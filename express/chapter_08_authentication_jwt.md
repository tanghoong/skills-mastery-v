# Chapter 8 — Authentication: JWT

## Learning Objectives

By the end of this chapter you will be able to:
- Issue access tokens and refresh tokens with typed payloads
- Write an `authenticate` middleware that validates JWTs and populates `req.user`
- Implement refresh token rotation with a Redis allow-list
- Hash passwords correctly with bcrypt
- Understand token expiry strategy and why two tokens are needed

---

## 8.1 Why Two Tokens

| Token | Lifetime | Where Stored | Purpose |
|-------|---------|-------------|---------|
| Access token | 15 minutes | Memory (client) | Prove identity on every request |
| Refresh token | 7 days | HttpOnly cookie | Get a new access token without re-login |

Short-lived access tokens limit exposure if intercepted. Refresh tokens live longer but are stored in a HttpOnly cookie — JavaScript cannot read them, preventing XSS theft.

---

## 8.2 JWT Payload Types

```typescript
// src/types/auth.ts
export interface JwtAccessPayload {
  sub:   number;      // user ID
  email: string;
  role:  OrgRole;     // from Ch 9
  orgId: number;
  iat?:  number;      // issued at (added by jsonwebtoken)
  exp?:  number;      // expiry (added by jsonwebtoken)
}

export interface JwtRefreshPayload {
  sub:      number;
  tokenId:  string;   // unique ID for this refresh token (for revocation)
}

export interface AuthUser {
  id:    number;
  email: string;
  role:  OrgRole;
  orgId: number;
}
```

---

## 8.3 Token Issuance

```bash
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs
```

```typescript
// src/lib/jwt.ts
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import type { JwtAccessPayload, JwtRefreshPayload } from "../types/auth.js";

export function signAccessToken(payload: Omit<JwtAccessPayload, "iat" | "exp">): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn, // "15m"
  });
}

export function signRefreshToken(payload: JwtRefreshPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn, // "7d"
  });
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  // Throws JsonWebTokenError or TokenExpiredError on failure
  return jwt.verify(token, config.jwt.accessSecret) as JwtAccessPayload;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtRefreshPayload;
}
```

---

## 8.4 Password Hashing

```typescript
// src/lib/password.ts
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12; // ~300ms on modern hardware — slow enough to deter brute force

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

Never store plain-text passwords. Never use MD5 or SHA-1 — use bcrypt, argon2, or scrypt. `SALT_ROUNDS=12` is the recommended minimum for 2024.

---

## 8.5 Auth Service

```typescript
// src/services/auth.service.ts
import { v4 as uuid } from "uuid";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signAccessToken, signRefreshToken } from "../lib/jwt.js";
import { UnauthorizedError, ConflictError } from "../types/errors.js";
import type { Result } from "../types/result.js";
import { ok, err } from "../types/result.js";

interface RegisterDto { name: string; email: string; password: string }
interface LoginDto    { email: string; password: string }

interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
}

export async function register(dto: RegisterDto): Promise<Result<AuthTokens>> {
  const existing = await userRepository.findByEmail(dto.email);
  if (existing) return err(new ConflictError("User", "email", dto.email));

  const passwordHash = await hashPassword(dto.password);
  const user = await userRepository.create({
    name:  dto.name,
    email: dto.email,
    passwordHash,
  });

  return ok(issueTokens(user));
}

export async function login(dto: LoginDto): Promise<Result<AuthTokens>> {
  const user = await userRepository.findByEmail(dto.email);
  if (!user) return err(new UnauthorizedError("Invalid credentials"));

  const valid = await verifyPassword(dto.password, user.passwordHash);
  if (!valid) return err(new UnauthorizedError("Invalid credentials"));

  return ok(issueTokens(user));
}

function issueTokens(user: { id: number; email: string; role: string; orgId: number }): AuthTokens {
  const tokenId = uuid();

  const accessToken = signAccessToken({
    sub:   user.id,
    email: user.email,
    role:  user.role as OrgRole,
    orgId: user.orgId,
  });

  const refreshToken = signRefreshToken({ sub: user.id, tokenId });

  // Store tokenId in Redis allow-list (Ch 18 expands this)
  // await redis.set(`refresh:${tokenId}`, user.id, "EX", 60 * 60 * 24 * 7);

  return { accessToken, refreshToken };
}
```

---

## 8.6 authenticate Middleware

```typescript
// src/middleware/authenticate.ts
import type { RequestHandler } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { UnauthorizedError } from "../types/errors.js";

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(new UnauthorizedError("Missing or malformed Authorization header"));
    return;
  }

  const token = header.slice(7); // remove "Bearer "

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id:    payload.sub,
      email: payload.email,
      role:  payload.role,
      orgId: payload.orgId,
    };
    next();
  } catch {
    // jwt.verify throws JsonWebTokenError or TokenExpiredError
    next(new UnauthorizedError("Invalid or expired access token"));
  }
};
```

---

## 8.7 Auth Routes

```typescript
// src/api/v1/auth/auth.router.ts
import { Router } from "express";
import { validate }      from "../../../middleware/validate.js";
import { asyncHandler }  from "../../../middleware/asyncHandler.js";
import { authenticate }  from "../../../middleware/authenticate.js";
import * as authService  from "../../../services/auth.service.js";
import { sendOk, sendCreated } from "../../../lib/response.js";
import { z } from "zod";

const RegisterSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(8).max(100),
});

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export function createAuthRouter(): Router {
  const router = Router();

  router.post(
    "/register",
    validate({ body: RegisterSchema }),
    asyncHandler(async (req, res) => {
      const result = await authService.register(req.body);
      if (!result.ok) throw result.error;
      sendCreated(res, { tokens: result.value });
    })
  );

  router.post(
    "/login",
    validate({ body: LoginSchema }),
    asyncHandler(async (req, res) => {
      const result = await authService.login(req.body);
      if (!result.ok) throw result.error;

      // Set refresh token as HttpOnly cookie
      res.cookie("refreshToken", result.value.refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
      });

      sendOk(res, { accessToken: result.value.accessToken });
    })
  );

  router.post(
    "/refresh",
    asyncHandler(async (req, res) => {
      const refreshToken = req.cookies?.refreshToken as string | undefined;
      if (!refreshToken) throw new UnauthorizedError("No refresh token");

      const tokens = await authService.refresh(refreshToken);
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge:   7 * 24 * 60 * 60 * 1000,
      });

      sendOk(res, { accessToken: tokens.accessToken });
    })
  );

  router.post(
    "/logout",
    authenticate,
    asyncHandler(async (req, res) => {
      res.clearCookie("refreshToken");
      res.status(204).send();
    })
  );

  router.get(
    "/me",
    authenticate,
    asyncHandler(async (req, res) => {
      const user = await userRepository.findById(req.user!.id);
      sendOk(res, user);
    })
  );

  return router;
}
```

---

## 8.8 Refresh Token Rotation

Each refresh produces a new refresh token and invalidates the old one:

```typescript
export async function refresh(refreshToken: string): Promise<AuthTokens> {
  let payload: JwtRefreshPayload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Invalid refresh token");
  }

  // Check allow-list in Redis — if tokenId not present, token was revoked
  const stored = await redis.get(`refresh:${payload.tokenId}`);
  if (!stored) throw new UnauthorizedError("Refresh token revoked");

  // Delete old token from allow-list
  await redis.del(`refresh:${payload.tokenId}`);

  const user = await userRepository.findById(payload.sub);
  if (!user) throw new UnauthorizedError("User not found");

  // Issue new pair
  return issueTokens(user);
}
```

If a refresh token is used twice (stolen + replayed), the second use finds nothing in Redis and fails — protecting the user.

---

## Summary

| Concept | Rule |
|---------|------|
| Access token | 15 min, in-memory on client, Bearer header |
| Refresh token | 7 days, HttpOnly cookie, stored in Redis allow-list |
| bcrypt rounds | 12 minimum — slow by design |
| Token rotation | Each refresh issues a new refresh token, revokes the old |
| `req.user` | Populated by `authenticate` middleware, always typed |

---

## Exercise

Open `exercises/chapter_08.ts` and complete all TODOs.
