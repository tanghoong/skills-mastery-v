/**
 * Chapter 9 — Authorization: RBAC
 *
 * Run: tsx exercises/chapter_09.ts
 */

// =============================================================================
// EXERCISE 1 — Role hierarchy
// =============================================================================
// TODO: Define `OrgRole` union: "owner" | "admin" | "member" | "viewer"
// TODO: Define `ROLE_LEVEL` as a Record<OrgRole, number>:
//       owner=4, admin=3, member=2, viewer=1

export type OrgRole = never; // replace

export const ROLE_LEVEL: Record<string, number> = {
  // TODO
};

// TODO: Implement `hasMinimumRole(userRole: OrgRole, required: OrgRole): boolean`

export function hasMinimumRole(userRole: OrgRole, required: OrgRole): boolean {
  // TODO
  return false;
}

// =============================================================================
// EXERCISE 2 — Branded IDs
// =============================================================================
// TODO: Define branded types:
//       UserId    = number & { readonly __brand: "UserId" }
//       OrgId     = number & { readonly __brand: "OrgId" }
//       ProjectId = number & { readonly __brand: "ProjectId" }
//       TaskId    = number & { readonly __brand: "TaskId" }
//
// TODO: Implement casting functions: asUserId, asOrgId, asProjectId, asTaskId
//       Each takes a number and returns the branded type

export type UserId    = never; // replace
export type OrgId     = never; // replace
export type ProjectId = never; // replace
export type TaskId    = never; // replace

export function asUserId(id: number):    UserId    { return id as unknown as UserId; }
export function asOrgId(id: number):     OrgId     { return id as unknown as OrgId; }
export function asProjectId(id: number): ProjectId { return id as unknown as ProjectId; }
export function asTaskId(id: number):    TaskId    { return id as unknown as TaskId; }

// =============================================================================
// EXERCISE 3 — Permission matrix
// =============================================================================
// TODO: Define `Action` union: "create" | "read" | "update" | "delete" | "manage"
// TODO: Define `Resource` union: "task" | "project" | "comment" | "member"
// TODO: Define `PERMISSIONS` as Record<OrgRole, Record<Resource, Action[]>>
//       with realistic permissions:
//       - owner: full access to everything
//       - admin: full access except manage (only owners manage members)
//       - member: read all, create/update tasks and comments, cannot delete projects
//       - viewer: read-only everything

export type Action   = never; // replace
export type Resource = never; // replace

export const PERMISSIONS: Record<string, Record<string, string[]>> = {
  // TODO
};

// TODO: Implement `can(role: OrgRole, resource: Resource, action: Action): boolean`

export function can(role: OrgRole, resource: Resource, action: Action): boolean {
  // TODO
  return false;
}

// =============================================================================
// EXERCISE 4 — Self-resource check
// =============================================================================
// TODO: Define `OwnedResource` interface: { userId: number } (resource owned by a user)
// TODO: Implement `canModify(requester: { id: number; role: OrgRole }, resource: OwnedResource): boolean`
//       Returns true if:
//       - requester.id === resource.userId (own resource), OR
//       - requester has at least admin role

export interface OwnedResource {
  // TODO
}

export function canModify(
  requester: { id: number; role: OrgRole },
  resource: OwnedResource
): boolean {
  // TODO
  return false;
}

// =============================================================================
// EXERCISE 5 — Access check function
// =============================================================================
// TODO: Define `AccessCheckResult` type:
//       | { allowed: true }
//       | { allowed: false; reason: string }
//
// TODO: Implement `checkAccess(params: {
//         userOrgId:     number;
//         resourceOrgId: number;
//         userRole:      OrgRole;
//         required:      OrgRole;
//       }): AccessCheckResult`
//       - If userOrgId !== resourceOrgId: { allowed: false, reason: "Cross-org access denied" }
//       - If !hasMinimumRole: { allowed: false, reason: "Requires ${required} role" }
//       - Otherwise: { allowed: true }

export type AccessCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string };

export function checkAccess(params: {
  userOrgId:     number;
  resourceOrgId: number;
  userRole:      OrgRole;
  required:      OrgRole;
}): AccessCheckResult {
  // TODO
  return { allowed: true };
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 1 — role hierarchy
  console.assert(hasMinimumRole("owner", "admin")  === true,  "Ex1: owner >= admin");
  console.assert(hasMinimumRole("admin", "admin")  === true,  "Ex1: admin >= admin");
  console.assert(hasMinimumRole("member","admin")  === false, "Ex1: member < admin");
  console.assert(hasMinimumRole("viewer","member") === false, "Ex1: viewer < member");
  console.assert(hasMinimumRole("member","viewer") === true,  "Ex1: member >= viewer");

  // Exercise 2 — branded types (compile-time only, runtime just numbers)
  const uid = asUserId(42);
  const oid = asOrgId(7);
  console.assert((uid as number) === 42, "Ex2: UserId should hold value 42");
  console.assert((oid as number) === 7,  "Ex2: OrgId should hold value 7");

  // Exercise 3 — permission matrix
  console.assert(can("owner",  "task",    "delete") === true,  "Ex3: owner can delete tasks");
  console.assert(can("viewer", "task",    "create") === false, "Ex3: viewer cannot create tasks");
  console.assert(can("member", "project", "delete") === false, "Ex3: member cannot delete projects");
  console.assert(can("admin",  "comment", "read")   === true,  "Ex3: admin can read comments");
  console.assert(can("member", "task",    "read")   === true,  "Ex3: member can read tasks");

  // Exercise 4 — canModify
  const owner    = { id: 1, role: "member" as OrgRole };
  const nonOwner = { id: 2, role: "member" as OrgRole };
  const adminUser = { id: 3, role: "admin" as OrgRole };
  const resource  = { userId: 1 };

  console.assert(canModify(owner,    resource) === true,  "Ex4: owner can modify own resource");
  console.assert(canModify(nonOwner, resource) === false, "Ex4: non-owner member cannot modify");
  console.assert(canModify(adminUser,resource) === true,  "Ex4: admin can modify any resource");

  // Exercise 5 — checkAccess
  const sameOrg  = checkAccess({ userOrgId: 1, resourceOrgId: 1, userRole: "admin",  required: "member" });
  console.assert(sameOrg.allowed === true, "Ex5: same org + sufficient role = allowed");

  const crossOrg = checkAccess({ userOrgId: 1, resourceOrgId: 2, userRole: "owner",  required: "viewer" });
  console.assert(crossOrg.allowed === false,                 "Ex5: cross-org = denied");
  console.assert((crossOrg as any).reason.includes("Cross-org"), "Ex5: reason mentions cross-org");

  const insufficientRole = checkAccess({ userOrgId: 1, resourceOrgId: 1, userRole: "viewer", required: "admin" });
  console.assert(insufficientRole.allowed === false, "Ex5: insufficient role = denied");

  console.log("Chapter 9 verification complete ✓");
}

verify();
