/**
 * Chapter 10 — Database Layer: Prisma
 *
 * Run: tsx exercises/chapter_10.ts
 *
 * These exercises focus on Prisma query patterns and typing — no real DB needed.
 * We simulate Prisma types to practice the patterns.
 */

// =============================================================================
// EXERCISE 1 — Model type definitions (simulate Prisma-generated types)
// =============================================================================
// TODO: Define `TaskStatus` enum (as a union): "BACKLOG"|"TODO"|"IN_PROGRESS"|"IN_REVIEW"|"DONE"|"CANCELLED"
// TODO: Define `TaskPriority` enum (as a union): "URGENT"|"HIGH"|"MEDIUM"|"LOW"|"NONE"
// TODO: Define `Task` interface:
//       id, projectId, title, description?, status (TaskStatus), priority (TaskPriority),
//       assigneeId?, dueDate?, createdAt (Date), updatedAt (Date)
// TODO: Define `User` interface:
//       id (number), email (string), name (string), createdAt (Date)

export type TaskStatus   = never; // replace
export type TaskPriority = never; // replace

export interface Task {
  // TODO
}

export interface User {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Prisma-style where input types
// =============================================================================
// TODO: Define `TaskWhereInput` — all fields optional, can filter by:
//       projectId (number), status (TaskStatus), priority (TaskPriority), assigneeId (number | null)

export interface TaskWhereInput {
  // TODO
}

// =============================================================================
// EXERCISE 3 — findMany options
// =============================================================================
// TODO: Define `FindManyOptions<T>` generic interface:
//       - where?: T (the where input type)
//       - skip?:  number
//       - take?:  number
//       - orderBy?: Record<string, "asc" | "desc">
//       - include?: Record<string, boolean>

export interface FindManyOptions<W> {
  // TODO
}

// =============================================================================
// EXERCISE 4 — Mock repository
// =============================================================================
// TODO: Implement `MockTaskRepository` class with an in-memory store:
//       - Constructor initialises `private tasks: Task[] = []`
//       - `seed(tasks: Task[]): void` — replaces the store
//       - `findById(id: number): Task | null`
//       - `findMany(opts: FindManyOptions<TaskWhereInput>): Task[]`
//         Apply where filters, skip, take (in that order)
//       - `count(where: TaskWhereInput): number`
//       - `create(data: Omit<Task, "id" | "createdAt" | "updatedAt">): Task`
//         Auto-increment id, set createdAt and updatedAt to new Date()
//       - `update(id: number, data: Partial<Omit<Task, "id">>): Task | null`
//       - `delete(id: number): boolean`

export class MockTaskRepository {
  private tasks: Task[] = [];
  private nextId = 1;

  seed(tasks: Task[]): void {
    this.tasks  = tasks;
    this.nextId = Math.max(0, ...tasks.map((t) => t.id)) + 1;
  }

  findById(id: number): Task | null {
    // TODO
    return null;
  }

  findMany(opts: FindManyOptions<TaskWhereInput> = {}): Task[] {
    // TODO: apply where filters, skip, take
    return [];
  }

  count(where: TaskWhereInput = {}): number {
    // TODO
    return 0;
  }

  create(data: Omit<Task, "id" | "createdAt" | "updatedAt">): Task {
    // TODO
    return {} as Task;
  }

  update(id: number, data: Partial<Omit<Task, "id">>): Task | null {
    // TODO
    return null;
  }

  delete(id: number): boolean {
    // TODO
    return false;
  }
}

// =============================================================================
// EXERCISE 5 — Transaction simulation
// =============================================================================
// TODO: Implement `runTransaction<T>(operations: (() => T)[]): T[]`
//       - Executes all operations
//       - If any throws, rollback by returning empty array and logging the error
//       - Otherwise returns array of results

export function runTransaction<T>(operations: (() => T)[]): T[] {
  // TODO
  return [];
}

// =============================================================================
// EXERCISE 6 — Prisma error codes
// =============================================================================
// TODO: Define `PrismaErrorCode` union: "P2025" | "P2002" | "P2003" | "P2000"
// TODO: Implement `mapPrismaError(code: PrismaErrorCode): { statusCode: number; message: string }`

export type PrismaErrorCode = never; // replace

export function mapPrismaError(code: PrismaErrorCode): { statusCode: number; message: string } {
  // P2025 → 404 "Record not found"
  // P2002 → 409 "Record already exists"
  // P2003 → 409 "Referenced record does not exist"
  // P2000 → 400 "Value too long for column"
  // TODO
  return { statusCode: 500, message: "Database error" };
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  const repo = new MockTaskRepository();
  const now  = new Date();

  repo.seed([
    { id: 1, projectId: 10, title: "Task A", status: "TODO",        priority: "HIGH",   createdAt: now, updatedAt: now },
    { id: 2, projectId: 10, title: "Task B", status: "IN_PROGRESS", priority: "MEDIUM", createdAt: now, updatedAt: now },
    { id: 3, projectId: 11, title: "Task C", status: "DONE",        priority: "LOW",    createdAt: now, updatedAt: now },
  ]);

  // Exercise 4 — findById
  const found = repo.findById(1);
  console.assert(found?.id === 1,        "Ex4: findById should return task 1");
  console.assert(found?.title === "Task A", "Ex4: title should match");
  console.assert(repo.findById(99) === null, "Ex4: missing task should return null");

  // Exercise 4 — findMany with where
  const project10Tasks = repo.findMany({ where: { projectId: 10 } });
  console.assert(project10Tasks.length === 2, "Ex4: project 10 has 2 tasks");

  const inProgressTasks = repo.findMany({ where: { status: "IN_PROGRESS" } });
  console.assert(inProgressTasks.length === 1, "Ex4: 1 in-progress task");

  // Exercise 4 — skip/take
  const paged = repo.findMany({ skip: 1, take: 2 });
  console.assert(paged.length === 2, "Ex4: take 2 after skip 1");

  // Exercise 4 — count
  console.assert(repo.count({ projectId: 10 }) === 2, "Ex4: count project 10 tasks");
  console.assert(repo.count() === 3,                  "Ex4: total count is 3");

  // Exercise 4 — create
  const newTask = repo.create({ projectId: 10, title: "New Task", status: "BACKLOG", priority: "NONE" });
  console.assert(newTask.id > 0,             "Ex4: create should assign id");
  console.assert(repo.count() === 4,         "Ex4: count should be 4 after create");

  // Exercise 4 — update
  const updated = repo.update(1, { status: "DONE" });
  console.assert(updated?.status === "DONE", "Ex4: update should change status");
  console.assert(updated?.title  === "Task A", "Ex4: other fields should be unchanged");

  // Exercise 4 — delete
  const deleted = repo.delete(1);
  console.assert(deleted === true,   "Ex4: delete should return true");
  console.assert(repo.count() === 3, "Ex4: count should be 3 after delete");
  console.assert(repo.delete(99) === false, "Ex4: deleting non-existent should return false");

  // Exercise 5 — transaction
  const results = runTransaction<number>([() => 1, () => 2, () => 3]);
  console.assert(results.length === 3, "Ex5: successful transaction returns all results");
  console.assert(results[0] === 1,     "Ex5: first result should be 1");

  const rollback = runTransaction<number>([() => 1, () => { throw new Error("fail"); }, () => 3]);
  console.assert(rollback.length === 0, "Ex5: failed transaction should rollback to empty array");

  // Exercise 6 — Prisma error mapping
  const notFound = mapPrismaError("P2025");
  console.assert(notFound.statusCode === 404, "Ex6: P2025 → 404");

  const conflict = mapPrismaError("P2002");
  console.assert(conflict.statusCode === 409, "Ex6: P2002 → 409");

  console.log("Chapter 10 verification complete ✓");
}

verify();
