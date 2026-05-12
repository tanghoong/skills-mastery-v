# Chapter 14 — Security Hardening

## Learning Objectives

By the end of this chapter you will be able to:
- Apply HTTP security headers with `helmet`
- Configure CORS correctly for a TypeScript API
- Implement IP-based and user-based rate limiting
- Prevent common injection attacks at the input layer
- Understand OWASP Top 10 in the context of Express APIs

---

## 14.1 Installing Dependencies

```bash
npm install helmet cors express-rate-limit
npm install -D @types/cors
```

---

## 14.2 Helmet — HTTP Security Headers

```typescript
import helmet from "helmet";

app.use(helmet({
  // Content-Security-Policy — prevents XSS if you serve HTML
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "https:"],
    },
  },

  // Prevents MIME-type sniffing
  noSniff: true,

  // Prevents clickjacking
  frameguard: { action: "deny" },

  // HSTS — forces HTTPS for 1 year in production
  hsts: {
    maxAge:            31536000,
    includeSubDomains: true,
    preload:           true,
  },

  // Removes X-Powered-By: Express header — don't advertise the framework
  hidePoweredBy: true,
}));
```

Helmet sets all of these headers with one `app.use`. Always register it first — before any route or other middleware.

---

## 14.3 CORS Configuration

```typescript
import cors from "cors";

const ALLOWED_ORIGINS = new Set([
  "https://app.taskflow.io",
  "https://admin.taskflow.io",
  ...(config.isDev ? ["http://localhost:3000", "http://localhost:5173"] : []),
]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman) in dev
    if (!origin || ALLOWED_ORIGINS.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials:     true,     // allow cookies (for refresh tokens)
  methods:         ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders:  ["Content-Type", "Authorization", "X-Request-ID"],
  exposedHeaders:  ["X-Request-ID"],
  maxAge:          86400,    // preflight cache: 24 hours
}));

// Handle preflight OPTIONS for all routes
app.options("*", cors());
```

---

## 14.4 Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

// General API rate limit: 100 req/min per IP
const apiLimiter = rateLimit({
  windowMs:         60 * 1000,  // 1 minute
  max:              100,
  standardHeaders:  true,   // sets Retry-After and RateLimit-* headers
  legacyHeaders:    false,
  keyGenerator:     (req) => req.ip ?? "unknown",
  handler: (_req, res) => {
    res.status(429).json({
      ok:    false,
      error: { code: "RATE_LIMITED", message: "Too many requests", statusCode: 429 },
    });
  },
});

// Stricter limit for auth endpoints: 10 req/min per IP
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      10,
  // same handler and headers
  handler: (_req, res) => {
    res.status(429).json({
      ok:    false,
      error: { code: "RATE_LIMITED", message: "Too many auth attempts. Try again in 1 minute.", statusCode: 429 },
    });
  },
});

// Apply in app.ts
app.use("/api/v1", apiLimiter);
app.use("/api/v1/auth", authLimiter);
```

For production, use a Redis store instead of in-memory (so limits work across multiple API instances):

```bash
npm install rate-limit-redis ioredis
```

```typescript
import RedisStore from "rate-limit-redis";
import { redis } from "./lib/redis.js";

const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  // ...
});
```

---

## 14.5 Input Sanitisation

Validation (Ch 4) rejects malformed input. Sanitisation removes dangerous content from valid input:

```typescript
// Trim and normalise strings in schemas
const CreateTaskSchema = z.object({
  title:       z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional(),
});

// For user-generated HTML content (if you allow rich text), use DOMPurify server-side:
// npm install isomorphic-dompurify
import DOMPurify from "isomorphic-dompurify";

const sanitisedContent = DOMPurify.sanitize(req.body.description);
```

Never store raw HTML from users without sanitising first.

---

## 14.6 OWASP Top 10 — API Context

| # | Vulnerability | How TaskFlow Mitigates It |
|---|--------------|--------------------------|
| A01 | Broken Access Control | RBAC middleware + ownership checks in service layer (Ch 9) |
| A02 | Cryptographic Failures | bcrypt for passwords, JWT signed with HS256, HTTPS only in prod |
| A03 | Injection | Prisma parameterised queries — no raw SQL |
| A04 | Insecure Design | Result pattern, AppError hierarchy, separation of concerns |
| A05 | Security Misconfiguration | Helmet, env validation at startup, no default secrets |
| A06 | Vulnerable Components | Keep dependencies updated; run `npm audit` in CI |
| A07 | Auth Failures | Short-lived tokens, refresh rotation, bcrypt with 12 rounds |
| A08 | Data Integrity Failures | Zod validation on all inputs, typed Prisma queries |
| A09 | Logging Failures | Pino structured logging with correlation IDs (Ch 13) |
| A10 | SSRF | No user-controlled URL fetching without allowlist validation |

---

## 14.7 Preventing Mass Assignment

Mass assignment happens when you pass `req.body` directly to a database write:

```typescript
// VULNERABLE — user could send { role: "owner" }
await prisma.user.update({ where: { id }, data: req.body });

// SAFE — explicit allow-list from validated DTO
await prisma.user.update({
  where: { id },
  data: {
    name:      dto.name,
    avatarUrl: dto.avatarUrl,
    // role is NOT in the DTO — users cannot escalate their own role
  },
});
```

Zod schemas enforce this automatically — only declared fields pass through.

---

## 14.8 Security Headers Checklist

After applying helmet, verify these headers with `curl -I https://your-api`:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0                    (CSP is the modern replacement)
Content-Security-Policy: ...
Referrer-Policy: no-referrer
Permissions-Policy: ...
```

Use [securityheaders.com](https://securityheaders.com) for a graded report.

---

## 14.9 app.ts Security Stack Order

```typescript
export function createApp() {
  const app = express();

  // 1. Security headers — first, always
  app.use(helmet());

  // 2. CORS — before routes
  app.use(cors({ ... }));

  // 3. Rate limiting — before parsing body
  app.use("/api/v1", apiLimiter);
  app.use("/api/v1/auth", authLimiter);

  // 4. Body parsing — after rate limit to avoid parsing DoS
  app.use(express.json({ limit: "1mb" }));

  // 5. Request ID + logging
  app.use(requestId);
  app.use(requestLogger);

  // 6. Routes
  app.get("/health", healthHandler);
  app.use("/api/v1", createV1Router());

  // 7. 404 + error handler — always last
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
```

---

## Summary

| Concern | Tool | Key Config |
|---------|------|-----------|
| HTTP headers | `helmet` | HSTS, noSniff, frameguard, hidePoweredBy |
| CORS | `cors` | Explicit origin allowlist, `credentials: true` for cookies |
| Rate limiting | `express-rate-limit` + Redis | 100/min general, 10/min auth |
| Injection | Prisma parameterised queries + Zod | No raw SQL, no unvalidated input |
| Mass assignment | Explicit DTOs in Zod schemas | Never spread `req.body` directly into a DB call |

---

## Exercise

Open `exercises/chapter_14.ts` and complete all TODOs.
