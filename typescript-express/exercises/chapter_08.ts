/**
 * Chapter 8 — Authentication: JWT
 *
 * Run: tsx exercises/chapter_08.ts
 *
 * Install: npm install jsonwebtoken bcryptjs uuid
 *          npm install -D @types/jsonwebtoken @types/bcryptjs @types/uuid
 */

import crypto from "crypto";

// =============================================================================
// EXERCISE 1 — JWT payload types
// =============================================================================
// TODO: Define `OrgRole` union: "owner" | "admin" | "member" | "viewer"
// TODO: Define `JwtAccessPayload` interface:
//       { sub: number; email: string; role: OrgRole; orgId: number; iat?: number; exp?: number }
// TODO: Define `JwtRefreshPayload` interface:
//       { sub: number; tokenId: string; iat?: number; exp?: number }
// TODO: Define `AuthUser` interface:
//       { id: number; email: string; role: OrgRole; orgId: number }

export type OrgRole = never; // replace

export interface JwtAccessPayload {
  // TODO
}

export interface JwtRefreshPayload {
  // TODO
}

export interface AuthUser {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Token issuance (mock — no real JWT library needed)
// =============================================================================
// TODO: Implement `createFakeToken(payload: Record<string, unknown>): string`
//       - Encode the payload as base64url JSON (no real signing needed for exercise)
//       - Format: "header.payload.signature" where each part is base64url
//       - Header: { alg: "HS256", typ: "JWT" }
//       - Signature: "fakesig"

function base64url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

export function createFakeToken(payload: Record<string, unknown>): string {
  // TODO
  return "";
}

// TODO: Implement `parseFakeToken(token: string): Record<string, unknown> | null`
//       - Split on "." and decode the payload part (index 1) from base64url
//       - Return the parsed object, or null if parsing fails

export function parseFakeToken(token: string): Record<string, unknown> | null {
  // TODO
  return null;
}

// =============================================================================
// EXERCISE 3 — Password hashing (without bcrypt for portability)
// =============================================================================
// TODO: Implement `hashPassword(plain: string, salt: string): string`
//       - Use crypto.createHmac("sha256", salt).update(plain).digest("hex")
//       - Return `${salt}:${hash}`
//
// TODO: Implement `verifyPassword(plain: string, stored: string): boolean`
//       - stored format: "salt:hash"
//       - Re-hash plain with the same salt and compare

export function hashPassword(plain: string, salt: string): string {
  // TODO
  return "";
}

export function verifyPassword(plain: string, stored: string): boolean {
  // TODO
  return false;
}

// =============================================================================
// EXERCISE 4 — Token expiry checker
// =============================================================================
// TODO: Implement `isTokenExpired(exp: number): boolean`
//       - exp is a Unix timestamp (seconds)
//       - Return true if Date.now() / 1000 > exp

export function isTokenExpired(exp: number): boolean {
  // TODO
  return false;
}

// TODO: Implement `tokenTtl(exp: number): number`
//       - Returns the number of seconds until token expires
//       - Returns 0 if already expired

export function tokenTtl(exp: number): number {
  // TODO
  return 0;
}

// =============================================================================
// EXERCISE 5 — AuthTokens and cookie options
// =============================================================================
// TODO: Define `AuthTokens` interface: { accessToken: string; refreshToken: string }
// TODO: Define `CookieOptions` interface matching Express's CookieOptions:
//       { httpOnly: boolean; secure: boolean; sameSite: "strict" | "lax" | "none"; maxAge: number }
// TODO: Implement `getRefreshCookieOptions(isProduction: boolean): CookieOptions`
//       - httpOnly: true (always)
//       - secure:   true only in production
//       - sameSite: "strict"
//       - maxAge:   7 days in milliseconds

export interface AuthTokens {
  // TODO
}

export interface CookieOptions {
  // TODO
}

export function getRefreshCookieOptions(isProduction: boolean): CookieOptions {
  // TODO
  return {} as CookieOptions;
}

// =============================================================================
// EXERCISE 6 — Extract Bearer token from Authorization header
// =============================================================================
// TODO: Implement `extractBearerToken(authHeader: string | undefined): string | null`
//       - Returns null if header is undefined, empty, or doesn't start with "Bearer "
//       - Returns the token string (everything after "Bearer ")

export function extractBearerToken(authHeader: string | undefined): string | null {
  // TODO
  return null;
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 2 — fake token
  const payload = { sub: 1, email: "test@example.com", orgId: 5 };
  const token   = createFakeToken(payload);
  console.assert(typeof token === "string",       "Ex2: token should be a string");
  console.assert(token.split(".").length === 3,   "Ex2: token should have 3 parts");

  const parsed = parseFakeToken(token);
  console.assert(parsed !== null,                 "Ex2: should parse the token");
  console.assert(parsed?.sub === 1,               "Ex2: sub should be 1");
  console.assert(parsed?.email === "test@example.com", "Ex2: email should match");

  const badParsed = parseFakeToken("not.a.token");
  // null or empty object — just not crashing
  console.assert(true, "Ex2: parseFakeToken should not throw on bad input");

  // Exercise 3 — password hashing
  const salt   = "random-salt-123";
  const hashed = hashPassword("mypassword", salt);
  console.assert(hashed.startsWith(salt + ":"),      "Ex3: hash should include salt prefix");
  console.assert(verifyPassword("mypassword", hashed) === true,  "Ex3: correct password should verify");
  console.assert(verifyPassword("wrongpass",  hashed) === false, "Ex3: wrong password should fail");

  // Exercise 4 — expiry
  const pastExp   = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
  const futureExp = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
  console.assert(isTokenExpired(pastExp)   === true,  "Ex4: past token should be expired");
  console.assert(isTokenExpired(futureExp) === false, "Ex4: future token should not be expired");

  console.assert(tokenTtl(pastExp)   === 0,  "Ex4: past token TTL should be 0");
  console.assert(tokenTtl(futureExp)  > 0,  "Ex4: future token TTL should be > 0");

  // Exercise 5 — cookie options
  const devCookies  = getRefreshCookieOptions(false);
  const prodCookies = getRefreshCookieOptions(true);
  console.assert(devCookies.httpOnly  === true,    "Ex5: httpOnly should always be true");
  console.assert(devCookies.secure    === false,   "Ex5: dev should not require secure");
  console.assert(prodCookies.secure   === true,    "Ex5: prod should require secure");
  console.assert(devCookies.sameSite  === "strict", "Ex5: sameSite should be strict");
  console.assert(devCookies.maxAge    === 7 * 24 * 60 * 60 * 1000, "Ex5: maxAge should be 7 days in ms");

  // Exercise 6 — Bearer extraction
  console.assert(extractBearerToken("Bearer abc123") === "abc123", "Ex6: should extract token");
  console.assert(extractBearerToken(undefined) === null,           "Ex6: undefined should return null");
  console.assert(extractBearerToken("Basic abc") === null,         "Ex6: non-Bearer should return null");
  console.assert(extractBearerToken("") === null,                  "Ex6: empty should return null");

  console.log("Chapter 8 verification complete ✓");
}

verify();
