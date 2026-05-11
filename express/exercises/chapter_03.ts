/**
 * Chapter 3 — Middleware Pipeline
 *
 * Run: tsx exercises/chapter_03.ts
 */

import type { RequestHandler, ErrorRequestHandler, NextFunction, Request, Response } from "express";

// =============================================================================
// EXERCISE 1 — requestId middleware
// =============================================================================
// TODO: Implement `requestIdMiddleware` — a RequestHandler that:
//       1. Reads X-Request-ID from req.headers (cast to string | undefined)
//       2. If present, use it; otherwise generate a UUID with crypto.randomUUID()
//       3. Assigns the ID to (req as any).requestId
//       4. Calls next()

import crypto from "crypto";

export const requestIdMiddleware: RequestHandler = (req, _res, next) => {
  // TODO
  next();
};

// =============================================================================
// EXERCISE 2 — asyncHandler
// =============================================================================
// TODO: Implement `asyncHandler` — wraps an async route handler and catches
//       any rejected promise, forwarding the error to next(err).
//
//       Signature:
//       asyncHandler<P, R, B, Q>(fn: AsyncHandler<P,R,B,Q>): RequestHandler<P,R,B,Q>
//
//       where AsyncHandler is (req, res, next) => Promise<void>

type AsyncHandler<P = Record<string,string>, R = unknown, B = unknown, Q = Record<string,string>> =
  (req: Request<P, R, B, Q>, res: Response<R>, next: NextFunction) => Promise<void>;

export function asyncHandler<
  P = Record<string, string>,
  R = unknown,
  B = unknown,
  Q = Record<string, string>
>(fn: AsyncHandler<P, R, B, Q>): RequestHandler<P, R, B, Q> {
  // TODO — return a RequestHandler that calls fn and catches errors
  return (req, res, next) => {
    // TODO
  };
}

// =============================================================================
// EXERCISE 3 — requireRole middleware factory
// =============================================================================
// TODO: Define `OrgRole` as a union: "owner" | "admin" | "member" | "viewer"
// TODO: Define `ROLE_LEVEL` as a Record<OrgRole, number>:
//       owner=4, admin=3, member=2, viewer=1
// TODO: Implement `requireRole(minimum: OrgRole): RequestHandler`
//       - Reads role from (req as any).user?.role (cast to OrgRole | undefined)
//       - If no role or ROLE_LEVEL[role] < ROLE_LEVEL[minimum]:
//         send 403 JSON: { ok: false, error: { code: "FORBIDDEN", message: "...", statusCode: 403 } }
//         return
//       - Otherwise call next()

type OrgRole = never; // replace with union

const ROLE_LEVEL: Record<string, number> = {
  // TODO
};

export function requireRole(minimum: string): RequestHandler {
  return (req, res, next) => {
    // TODO
  };
}

// =============================================================================
// EXERCISE 4 — errorHandler middleware
// =============================================================================
// TODO: Define a simple `AppError` class with: message, code (string), statusCode (number)
// TODO: Implement `errorHandler` — an ErrorRequestHandler that:
//       - If err is an AppError: send res.status(err.statusCode).json({ ok: false, error: { ... } })
//       - Otherwise: send 500 with generic message
//       - In both cases: return after sending

export class AppError extends Error {
  // TODO: add code and statusCode properties
  constructor(code: string, message: string, statusCode: number) {
    super(message);
    // TODO
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // TODO
};

// =============================================================================
// EXERCISE 5 — middleware ordering
// =============================================================================
// TODO: Implement `buildMiddlewareOrder` — a function that takes an array of
//       middleware names (strings) and returns them in the correct Express order.
//
//       Rules:
//       - "security" must come first
//       - "bodyParser" must come before "routes"
//       - "errorHandler" must come last
//       - Other items keep their position

type MiddlewareName = "security" | "bodyParser" | "requestId" | "logging" | "routes" | "notFound" | "errorHandler";

function buildMiddlewareOrder(items: MiddlewareName[]): MiddlewareName[] {
  // TODO: sort items according to the rules above
  return items;
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  // Exercise 1
  const mockReq1 = { headers: { "x-request-id": "existing-id" } } as unknown as Request;
  requestIdMiddleware(mockReq1, {} as Response, () => {});
  console.assert((mockReq1 as any).requestId === "existing-id", "Ex1: should use existing header ID");

  const mockReq2 = { headers: {} } as unknown as Request;
  requestIdMiddleware(mockReq2, {} as Response, () => {});
  console.assert(typeof (mockReq2 as any).requestId === "string", "Ex1: should generate UUID");
  console.assert((mockReq2 as any).requestId.length > 0,          "Ex1: UUID should not be empty");

  // Exercise 2
  let caughtError: unknown;
  const handler = asyncHandler(async (_req, _res, next) => {
    throw new Error("Test error");
  });
  handler({} as Request, {} as Response, (err) => { caughtError = err; });
  await new Promise((r) => setTimeout(r, 10));
  console.assert(caughtError instanceof Error, "Ex2: asyncHandler should catch and forward errors");
  console.assert((caughtError as Error).message === "Test error", "Ex2: error message should match");

  // Exercise 3 — role hierarchy
  const adminUser = { role: "admin" };
  const viewerUser = { role: "viewer" };

  let status403 = false;
  const mockRes = { status: (s: number) => ({ json: () => {} }), json: () => {} } as unknown as Response;

  // admin should pass requireRole("member")
  const reqAdmin = { user: adminUser } as unknown as Request;
  requireRole("member")(reqAdmin, mockRes, () => {});

  // viewer should fail requireRole("member")
  const reqViewer = { user: viewerUser } as unknown as Request;
  requireRole("member")(reqViewer, {
    status: (s: number) => { status403 = s === 403; return { json: () => {} }; },
  } as unknown as Response, () => {});
  console.assert(status403, "Ex3: viewer should get 403 when member is required");

  // Exercise 5
  const ordered = buildMiddlewareOrder(["routes", "bodyParser", "errorHandler", "security", "logging"]);
  console.assert(ordered[0] === "security",     "Ex5: security must be first");
  console.assert(ordered[ordered.length - 1] === "errorHandler", "Ex5: errorHandler must be last");
  const bpIdx  = ordered.indexOf("bodyParser");
  const rtIdx  = ordered.indexOf("routes");
  console.assert(bpIdx < rtIdx, "Ex5: bodyParser must come before routes");

  console.log("Chapter 3 verification complete ✓");
}

verify();
