/**
 * Chapter 11 — Repository + Service Pattern
 *
 * Run: tsx exercises/chapter_11.ts
 */

// =============================================================================
// Shared types
// =============================================================================

export type TaskStatus   = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";
export type TaskPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
export type OrgRole      = "owner" | "admin" | "member" | "viewer";

export interface Task {
  id:          number;
  projectId:   number;
  title:       string;
  description: string | null;
  status:      TaskStatus;
  priority:    TaskPriority;
  assigneeId:  number | null;
  dueDate:     Date | null;
  createdAt:   Date;
  updatedAt:   Date;
}

export interface AuthUser {
  id:    number;
  orgId: number;
  role:  OrgRole;
  email: string;
}

// =============================================================================
// EXERCISE 1 — Result type
// =============================================================================
// TODO: Define `Result<T, E = Error>` discriminated union
// TODO: Implement `ok<T>(v: T): Result<T>` and `err<E>(e: E): Result<never, E>`

export type Result<T, E = Error> = never; // replace

export function ok<T>(v: T): Result<T, never> {
  return {} as any;
}

export function err<E>(e: E): Result<never, E> {
  return {} as any;
}

// =============================================================================
// EXERCISE 2 — ITaskRepository interface
// =============================================================================
// TODO: Define `ITaskRepository` interface with methods:
//       - findById(id: number): Promise<Task | null>
//       - findMany(where: Partial<Task>, skip?: number, take?: number): Promise<Task[]>
//       - count(where: Partial<Task>): Promise<number>
//       - create(data: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task>
//       - update(id: number, data: Partial<Omit<Task, "id">>): Promise<Task>
//       - delete(id: number): Promise<void>

export interface ITaskRepository {
  // TODO
}

// =============================================================================
// EXERCISE 3 — InMemoryTaskRepository
// =============================================================================
// TODO: Implement `InMemoryTaskRepository` that satisfies `ITaskRepository`
//       Use an in-memory array. Auto-increment IDs, set timestamps on create.

export class InMemoryTaskRepository implements ITaskRepository {
  private store: Task[] = [];
  private nextId = 1;

  async findById(id: number): Promise<Task | null> {
    // TODO
    return null;
  }

  async findMany(where: Partial<Task> = {}, skip = 0, take = 20): Promise<Task[]> {
    // TODO: filter by where, apply skip/take
    return [];
  }

  async count(where: Partial<Task> = {}): Promise<number> {
    // TODO
    return 0;
  }

  async create(data: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> {
    // TODO
    return {} as Task;
  }

  async update(id: number, data: Partial<Omit<Task, "id">>): Promise<Task> {
    // TODO: throw Error("NOT_FOUND") if not found
    return {} as Task;
  }

  async delete(id: number): Promise<void> {
    // TODO: throw Error("NOT_FOUND") if not found
  }
}

// =============================================================================
// EXERCISE 4 — TaskService
// =============================================================================
// TODO: Implement `TaskService` with constructor that takes an `ITaskRepository`
//
//       Methods:
//       getById(id: number, user: AuthUser): Promise<Result<Task>>
//         - Returns err if not found
//         - Returns ok(task)
//
//       create(projectId: number, data: { title: string; priority?: TaskPriority }, user: AuthUser): Promise<Result<Task>>
//         - Members and above can create
//         - Returns err(new Error("FORBIDDEN")) for viewer
//         - Returns ok(task) on success
//
//       update(id: number, data: Partial<{ title: string; status: TaskStatus }>, user: AuthUser): Promise<Result<Task>>
//         - Only the task's project member or admin can update (simplify: just check role >= member)
//         - Returns err if not found or viewer
//
//       delete(id: number, user: AuthUser): Promise<Result<void>>
//         - Only admin and above can delete
//         - Returns err if not found or insufficient role

export class TaskService {
  constructor(private readonly repo: ITaskRepository) {}

  async getById(id: number, user: AuthUser): Promise<Result<Task>> {
    // TODO
    return ok({} as Task);
  }

  async create(
    projectId: number,
    data: { title: string; priority?: TaskPriority },
    user: AuthUser
  ): Promise<Result<Task>> {
    // TODO
    return ok({} as Task);
  }

  async update(
    id: number,
    data: Partial<{ title: string; status: TaskStatus }>,
    user: AuthUser
  ): Promise<Result<Task>> {
    // TODO
    return ok({} as Task);
  }

  async delete(id: number, user: AuthUser): Promise<Result<void>> {
    // TODO
    return ok(undefined as unknown as void);
  }
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  const repo    = new InMemoryTaskRepository();
  const service = new TaskService(repo);

  const adminUser:  AuthUser = { id: 1, orgId: 1, role: "admin",  email: "a@b.com" };
  const memberUser: AuthUser = { id: 2, orgId: 1, role: "member", email: "b@b.com" };
  const viewerUser: AuthUser = { id: 3, orgId: 1, role: "viewer", email: "c@b.com" };

  // Exercise 3 — repository
  const created = await repo.create({ projectId: 1, title: "Test Task", status: "BACKLOG", priority: "NONE", description: null, assigneeId: null, dueDate: null });
  console.assert(created.id > 0,                     "Ex3: create should assign id");
  console.assert(created.title === "Test Task",       "Ex3: title should match");
  console.assert(created.createdAt instanceof Date,   "Ex3: createdAt should be a Date");

  const found = await repo.findById(created.id);
  console.assert(found?.id === created.id,            "Ex3: findById should find created task");

  await repo.update(created.id, { status: "TODO" });
  const updated = await repo.findById(created.id);
  console.assert(updated?.status === "TODO",          "Ex3: update should change status");

  const count = await repo.count({ projectId: 1 });
  console.assert(count === 1,                         "Ex3: count should be 1");

  await repo.delete(created.id);
  console.assert(await repo.findById(created.id) === null, "Ex3: deleted task should not be found");

  // Exercise 4 — service
  const createResult = await service.create(1, { title: "Service Task" }, adminUser);
  console.assert(createResult.ok === true,               "Ex4: admin can create task");

  const viewerCreate = await service.create(1, { title: "Denied" }, viewerUser);
  console.assert(viewerCreate.ok === false,              "Ex4: viewer cannot create task");

  const taskId = (createResult as any).value.id;

  const getResult = await service.getById(taskId, memberUser);
  console.assert(getResult.ok === true,                  "Ex4: member can get task");

  const getMissing = await service.getById(9999, adminUser);
  console.assert(getMissing.ok === false,                "Ex4: missing task returns err");

  const updateResult = await service.update(taskId, { status: "IN_PROGRESS" }, memberUser);
  console.assert(updateResult.ok === true,               "Ex4: member can update task");

  const viewerDelete = await service.delete(taskId, viewerUser);
  console.assert(viewerDelete.ok === false,              "Ex4: viewer cannot delete");

  const memberDelete = await service.delete(taskId, memberUser);
  console.assert(memberDelete.ok === false,              "Ex4: member cannot delete");

  const adminCreate2 = await service.create(1, { title: "To Delete" }, adminUser);
  const deleteResult = await service.delete((adminCreate2 as any).value.id, adminUser);
  console.assert(deleteResult.ok === true,               "Ex4: admin can delete task");

  console.log("Chapter 11 verification complete ✓");
}

verify();
