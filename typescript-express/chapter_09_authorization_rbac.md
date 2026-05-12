# Chapter 9 — Authorization: RBAC

## Learning Objectives

By the end of this chapter you will be able to:
- Design a Role-Based Access Control system with branded types
- Write typed route guards for role and resource ownership checks
- Separate authentication (who are you?) from authorization (what can you do?)
- Implement permission matrices and check them at the service layer
- Use TypeScript's type system to prevent incorrect role comparisons

---

## 9.1 Auth vs Authz

- **Authentication** (Ch 8): verifies identity — "you are user 42, member of org 7, role: admin"
- **Authorization** (this chapter): verifies permission — "can user 42 delete project 15?"

A user can be authenticated but not authorized. Always check both.

---

## 9.2 Role Hierarchy with Branded Types

```typescript
// src/types/auth.ts

export type OrgRole = "owner" | "admin" | "member" | "viewer";

// Role hierarchy — higher number = more power
export const ROLE_LEVEL: Record<OrgRole, number> = {
  owner:  4,
  admin:  3,
  member: 2,
  viewer: 1,
};

export function hasMinimumRole(userRole: OrgRole, required: OrgRole): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[required];
}

// Branded UserId prevents passing a raw number where a UserId is needed
export type UserId    = number & { readonly __brand: "UserId" };
export type OrgId     = number & { readonly __brand: "OrgId" };
export type ProjectId = number & { readonly __brand: "ProjectId" };
export type TaskId    = number & { readonly __brand: "TaskId" };

// Casting helper — only call after you've verified the number is actually a valid ID
export function asUserId(id: number):    UserId    { return id as UserId; }
export function asOrgId(id: number):     OrgId     { return id as OrgId; }
export function asProjectId(id: number): ProjectId { return id as ProjectId; }
export function asTaskId(id: number):    TaskId    { return id as TaskId; }
```

---

## 9.3 requireRole Middleware Factory

```typescript
// src/middleware/authorize.ts
import type { RequestHandler } from "express";
import { ForbiddenError } from "../types/errors.js";
import { hasMinimumRole, type OrgRole } from "../types/auth.js";

export function requireRole(minimum: OrgRole): RequestHandler {
  return (req, _res, next) => {
    const userRole = req.user?.role as OrgRole | undefined;

    if (!userRole || !hasMinimumRole(userRole, minimum)) {
      next(new ForbiddenError(`Requires '${minimum}' role or above`));
      return;
    }

    next();
  };
}

// Usage
router.delete(
  "/:projectId",
  requireRole("admin"),         // only admin and owner can delete
  asyncHandler(deleteProject)
);

router.get(
  "/:projectId",
  requireRole("viewer"),        // all roles can view
  asyncHandler(getProject)
);
```

---

## 9.4 Resource Ownership Guard

Role alone isn't enough. A user with `member` role in org A should not access resources in org B. Check ownership at the service layer:

```typescript
// src/services/project.service.ts
import { NotFoundError, ForbiddenError } from "../types/errors.js";
import type { OrgId, ProjectId, UserId } from "../types/auth.js";

async function assertProjectAccess(
  projectId: ProjectId,
  requestingUser: { id: UserId; orgId: OrgId; role: OrgRole }
): Promise<Project> {
  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new NotFoundError("Project", projectId);
  }

  // Cross-org access check
  if (project.orgId !== requestingUser.orgId) {
    throw new ForbiddenError("You do not have access to this project");
  }

  return project;
}

export async function deleteProject(
  projectId: ProjectId,
  requestingUser: { id: UserId; orgId: OrgId; role: OrgRole }
): Promise<void> {
  await assertProjectAccess(projectId, requestingUser); // throws if not found or wrong org

  // Role check at service layer (belt-and-suspenders with the middleware guard)
  if (!hasMinimumRole(requestingUser.role, "admin")) {
    throw new ForbiddenError("Only admins and owners can delete projects");
  }

  await projectRepository.delete(projectId);
}
```

---

## 9.5 Permission Matrix

Document what each role can do in a typed matrix:

```typescript
// src/types/permissions.ts

type Action = "create" | "read" | "update" | "delete" | "manage_members";
type Resource = "project" | "task" | "comment" | "member";

const PERMISSIONS: Record<OrgRole, Record<Resource, Action[]>> = {
  owner: {
    project:        ["create", "read", "update", "delete"],
    task:           ["create", "read", "update", "delete"],
    comment:        ["create", "read", "update", "delete"],
    member:         ["create", "read", "update", "delete", "manage_members"],
  },
  admin: {
    project:        ["create", "read", "update", "delete"],
    task:           ["create", "read", "update", "delete"],
    comment:        ["create", "read", "update", "delete"],
    member:         ["read", "update"],
  },
  member: {
    project:        ["read"],
    task:           ["create", "read", "update"],
    comment:        ["create", "read", "update", "delete"],
    member:         ["read"],
  },
  viewer: {
    project:        ["read"],
    task:           ["read"],
    comment:        ["read"],
    member:         ["read"],
  },
};

export function can(
  role: OrgRole,
  resource: Resource,
  action: Action
): boolean {
  return PERMISSIONS[role][resource].includes(action);
}
```

---

## 9.6 Self-Resource Override

Members can always edit their own comments even if they can't edit others':

```typescript
export async function updateComment(
  commentId: CommentId,
  dto: UpdateCommentDto,
  requestingUser: AuthUser
): Promise<Comment> {
  const comment = await commentRepository.findById(commentId);
  if (!comment) throw new NotFoundError("Comment", commentId);

  const isOwner = comment.userId === requestingUser.id;
  const isAdmin = hasMinimumRole(requestingUser.role, "admin");

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError("You can only edit your own comments");
  }

  return commentRepository.update(commentId, dto);
}
```

---

## 9.7 Org Membership Middleware

For routes that require org membership, load and cache the membership on `req`:

```typescript
// Extend Request type
declare global {
  namespace Express {
    interface Request {
      user?:       AuthUser;
      membership?: OrgMembership;
      requestId?:  string;
    }
  }
}

// Middleware to resolve org membership from URL params
export function requireOrgMembership(): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const orgId = Number(req.params.orgId);
    if (isNaN(orgId)) {
      next(new NotFoundError("Organization", req.params.orgId));
      return;
    }

    const membership = await orgRepository.findMembership(
      asOrgId(orgId),
      asUserId(req.user!.id)
    );

    if (!membership) {
      next(new ForbiddenError("You are not a member of this organization"));
      return;
    }

    req.membership = membership;
    next();
  });
}
```

---

## 9.8 Full Route with Multi-Layer Auth

```typescript
router.delete(
  "/:projectId",
  authenticate,                   // layer 1: is the user logged in?
  requireOrgMembership(),         // layer 2: are they in this org?
  requireRole("admin"),           // layer 3: do they have the right role?
  asyncHandler(async (req, res) => {
    // Layer 4: service checks resource ownership + business rules
    await projectService.deleteProject(
      asProjectId(Number(req.params.projectId)),
      req.user!
    );
    res.status(204).send();
  })
);
```

Each layer is a separate concern — if any fails, the chain stops. This is easier to audit than a single handler doing all checks.

---

## Summary

| Concept | Rule |
|---------|------|
| `hasMinimumRole()` | Compare roles with the hierarchy, not string equality |
| Branded IDs | Prevents `userId` being passed where `projectId` is expected |
| Service-layer ownership | Always verify resource belongs to the requester's org |
| Self-resource override | Owners can always edit their own resources |
| Multi-layer guards | Authenticate → org membership → role → service-layer business rules |

---

## Exercise

Open `exercises/chapter_09.ts` and complete all TODOs.
