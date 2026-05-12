/**
 * Chapter 21 — Event-Driven Internals
 *
 * Run: tsx exercises/chapter_21.ts
 */

import { EventEmitter } from "events";

// =============================================================================
// EXERCISE 1 — Domain event types
// =============================================================================
// TODO: Define these payload interfaces:
//
//   TaskCreatedPayload: { taskId: number; projectId: number; title: string; actorId: number }
//   TaskUpdatedPayload: { taskId: number; changes: Partial<{ title: string; status: string }>; actorId: number }
//   CommentAddedPayload: { commentId: number; taskId: number; content: string; authorId: number }
//
// TODO: Define `EventMap` interface mapping event names to payloads:
//   "task.created"  → TaskCreatedPayload
//   "task.updated"  → TaskUpdatedPayload
//   "comment.added" → CommentAddedPayload

export interface TaskCreatedPayload {
  // TODO
}

export interface TaskUpdatedPayload {
  // TODO
}

export interface CommentAddedPayload {
  // TODO
}

export interface EventMap {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Typed event bus
// =============================================================================
// TODO: Implement `TypedEventBus` class:
//       - on<K extends keyof EventMap>(event: K, listener: (payload: EventMap[K]) => void | Promise<void>): this
//       - off<K extends keyof EventMap>(event: K, listener: Function): this
//       - emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): boolean
//       - listenerCount(event: keyof EventMap): number
//       (Wrap Node's EventEmitter internally)

export class TypedEventBus {
  private emitter = new EventEmitter();

  on<K extends keyof EventMap>(event: K, listener: (payload: EventMap[K]) => void | Promise<void>): this {
    // TODO
    return this;
  }

  off<K extends keyof EventMap>(event: K, listener: Function): this {
    // TODO
    return this;
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): boolean {
    // TODO
    return false;
  }

  listenerCount(event: keyof EventMap): number {
    // TODO
    return 0;
  }
}

// =============================================================================
// EXERCISE 3 — Safe async handler wrapper
// =============================================================================
// TODO: Implement `safeHandler<T>(handler: (payload: T) => Promise<void>, onError: (err: unknown) => void)`
//       Returns a new function that wraps handler in try/catch
//       On error: calls onError(err), does NOT rethrow

export function safeHandler<T>(
  handler: (payload: T) => Promise<void>,
  onError: (err: unknown) => void
): (payload: T) => Promise<void> {
  // TODO
  return handler;
}

// =============================================================================
// EXERCISE 4 — Activity log handler
// =============================================================================
// TODO: Define `ActivityEntry` interface: { entityType: string; entityId: number; actorId: number; action: string; timestamp: Date }
//
// TODO: Implement `ActivityLogger` class:
//       - Property: entries: ActivityEntry[]
//       - onTaskCreated(payload: TaskCreatedPayload): void
//         Adds entry: { entityType: "task", entityId: payload.taskId, actorId: payload.actorId, action: "created", timestamp: new Date() }
//       - onTaskUpdated(payload: TaskUpdatedPayload): void
//         Adds entry: { ..., action: "updated" }
//       - registerAll(bus: TypedEventBus): void
//         Registers onTaskCreated and onTaskUpdated as listeners on the bus

export interface ActivityEntry {
  // TODO
}

export class ActivityLogger {
  public entries: ActivityEntry[] = [];

  onTaskCreated(payload: TaskCreatedPayload): void {
    // TODO
  }

  onTaskUpdated(payload: TaskUpdatedPayload): void {
    // TODO
  }

  registerAll(bus: TypedEventBus): void {
    // TODO
  }
}

// =============================================================================
// EXERCISE 5 — Event replay (test helper)
// =============================================================================
// TODO: Implement `EventRecorder` class:
//       - Property: events: Array<{ name: string; payload: unknown }>
//       - record(bus: TypedEventBus, ...eventNames: (keyof EventMap)[]): void
//         Registers listeners on the bus for each event name
//       - getEventsOfType<K extends keyof EventMap>(name: K): EventMap[K][]
//       - clear(): void

export class EventRecorder {
  public events: Array<{ name: string; payload: unknown }> = [];

  record(bus: TypedEventBus, ...eventNames: (keyof EventMap)[]): void {
    // TODO
  }

  getEventsOfType<K extends keyof EventMap>(name: K): EventMap[K][] {
    // TODO
    return [];
  }

  clear(): void {
    // TODO
  }
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  const bus = new TypedEventBus();

  // Exercise 2 — typed emit and listen
  const received: TaskCreatedPayload[] = [];
  bus.on("task.created", (payload) => {
    received.push(payload);
  });

  bus.emit("task.created", { taskId: 1, projectId: 10, title: "Fix bug", actorId: 42 });
  bus.emit("task.created", { taskId: 2, projectId: 10, title: "Add tests", actorId: 42 });

  console.assert(received.length === 2,               "Ex2: should receive 2 events");
  console.assert(received[0].taskId === 1,            "Ex2: first task id should be 1");
  console.assert(bus.listenerCount("task.created") === 1, "Ex2: 1 listener registered");

  // off
  const handler = (p: TaskCreatedPayload) => {};
  bus.on("task.created", handler);
  console.assert(bus.listenerCount("task.created") === 2, "Ex2: 2 listeners after second on");
  bus.off("task.created", handler);
  console.assert(bus.listenerCount("task.created") === 1, "Ex2: back to 1 after off");

  // Exercise 3 — safeHandler
  const errors: unknown[] = [];
  const throwingHandler = safeHandler<string>(
    async (_payload) => { throw new Error("handler failed"); },
    (err) => errors.push(err)
  );

  await throwingHandler("test");
  console.assert(errors.length === 1,              "Ex3: error should be captured");
  console.assert(errors[0] instanceof Error,       "Ex3: error should be an Error");

  // Exercise 4 — ActivityLogger
  const logger = new ActivityLogger();
  logger.registerAll(bus);

  bus.emit("task.created", { taskId: 5, projectId: 1, title: "New Task", actorId: 7 });
  bus.emit("task.updated", { taskId: 5, changes: { status: "DONE" }, actorId: 7 });

  console.assert(logger.entries.length >= 2,                      "Ex4: should have 2 entries");
  const created = logger.entries.find((e) => e.action === "created");
  console.assert(created?.entityId === 5,                         "Ex4: created entry entityId");
  console.assert(created?.actorId  === 7,                         "Ex4: created entry actorId");
  const updated = logger.entries.find((e) => e.action === "updated");
  console.assert(updated !== undefined,                           "Ex4: updated entry exists");

  // Exercise 5 — EventRecorder
  const freshBus = new TypedEventBus();
  const recorder = new EventRecorder();
  recorder.record(freshBus, "task.created", "comment.added");

  freshBus.emit("task.created",  { taskId: 10, projectId: 1, title: "Rec Task", actorId: 1 });
  freshBus.emit("comment.added", { commentId: 1, taskId: 10, content: "LGTM", authorId: 2 });
  freshBus.emit("task.created",  { taskId: 11, projectId: 1, title: "Another", actorId: 1 });

  console.assert(recorder.events.length === 3,                      "Ex5: should record 3 events");
  const taskCreatedEvents = recorder.getEventsOfType("task.created");
  console.assert(taskCreatedEvents.length === 2,                    "Ex5: 2 task.created events");
  console.assert(taskCreatedEvents[0].taskId === 10,                "Ex5: first task id");

  recorder.clear();
  console.assert(recorder.events.length === 0,                      "Ex5: clear empties events");

  console.log("Chapter 21 verification complete ✓");
}

verify();
