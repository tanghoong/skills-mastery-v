# Chapter 21 — Event-Driven Internals

## Learning Objectives

By the end of this chapter you will be able to:
- Design typed domain events that decouple modules
- Build a type-safe EventEmitter wrapper
- Wire event handlers for activity logging and notifications
- Understand when to use events vs direct service calls
- Avoid circular dependencies using the event bus

---

## 21.1 Why Domain Events

Without events, the task service must know about every module that cares when a task is created:

```typescript
// WITHOUT events — tight coupling, hard to extend
async function create(dto: CreateTaskDto, user: AuthUser): Promise<Task> {
  const task = await taskRepository.create(dto);
  await activityService.log("task.created", task.id, user.id); // coupling
  await notificationService.notify(task.assigneeId, "Task assigned"); // coupling
  io.emit("task.created", task); // coupling
  await emailService.sendAssignmentEmail(task.assigneeId); // coupling
  return task;
}
```

Each new "reaction" requires editing the task service. With events:

```typescript
// WITH events — task service only emits, handlers are decoupled
async function create(dto: CreateTaskDto, user: AuthUser): Promise<Task> {
  const task = await taskRepository.create(dto);
  eventBus.emit("task.created", { task, actor: user }); // only this
  return task;
}
// Each handler registered independently — task service never changes when adding handlers
```

---

## 21.2 Typed Domain Events

```typescript
// src/events/types.ts

export interface DomainEvent<T = unknown> {
  name:       string;
  payload:    T;
  occurredAt: Date;
  actorId:    number;
}

// All TaskFlow domain events
export interface TaskCreatedEvent {
  task:  { id: number; projectId: number; title: string; assigneeId: number | null };
  actor: { id: number; name: string };
}

export interface TaskUpdatedEvent {
  taskId:  number;
  changes: Partial<{ title: string; status: string; priority: string; assigneeId: number | null }>;
  actor:   { id: number; name: string };
}

export interface TaskDeletedEvent {
  taskId:    number;
  projectId: number;
  actor:     { id: number; name: string };
}

export interface CommentAddedEvent {
  comment: { id: number; taskId: number; content: string };
  author:  { id: number; name: string };
}

export interface MemberJoinedEvent {
  userId: number;
  orgId:  number;
  role:   string;
}

// Event map — maps event name to payload type
export interface EventMap {
  "task.created":  TaskCreatedEvent;
  "task.updated":  TaskUpdatedEvent;
  "task.deleted":  TaskDeletedEvent;
  "comment.added": CommentAddedEvent;
  "member.joined": MemberJoinedEvent;
}
```

---

## 21.3 Typed EventEmitter

Node's built-in `EventEmitter` is untyped. Wrap it:

```typescript
// src/events/eventBus.ts
import { EventEmitter } from "events";
import type { EventMap } from "./types.js";

type Listener<T> = (payload: T) => void | Promise<void>;

class TypedEventBus {
  private emitter = new EventEmitter();

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): this {
    this.emitter.on(event, listener);
    return this;
  }

  once<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): this {
    this.emitter.once(event, listener);
    return this;
  }

  off<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): this {
    this.emitter.off(event, listener);
    return this;
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): boolean {
    return this.emitter.emit(event, payload);
  }
}

export const eventBus = new TypedEventBus();
```

---

## 21.4 Registering Handlers

```typescript
// src/events/handlers/activity.handler.ts
import { eventBus }             from "../eventBus.js";
import { activityRepository }   from "../../repositories/activity.repository.js";

eventBus.on("task.created", async ({ task, actor }) => {
  await activityRepository.create({
    entityType: "task",
    entityId:   task.id,
    userId:     actor.id,
    action:     "created",
    meta:       { title: task.title },
  });
});

eventBus.on("task.updated", async ({ taskId, changes, actor }) => {
  await activityRepository.create({
    entityType: "task",
    entityId:   taskId,
    userId:     actor.id,
    action:     "updated",
    meta:       { changes },
  });
});

// src/events/handlers/notification.handler.ts
import { eventBus } from "../eventBus.js";

eventBus.on("task.created", async ({ task, actor }) => {
  if (!task.assigneeId || task.assigneeId === actor.id) return;

  await notificationRepository.create({
    userId: task.assigneeId,
    type:   "task_assigned",
    title:  "New task assigned",
    body:   `${actor.name} assigned you: ${task.title}`,
  });
});

// src/events/handlers/websocket.handler.ts
import { eventBus } from "../eventBus.js";
import { io }       from "../../ws/io.js";

eventBus.on("task.created", ({ task, actor }) => {
  io.to(`project:${task.projectId}`).emit("task.created", {
    taskId:    task.id,
    projectId: task.projectId,
    title:     task.title,
    createdBy: actor,
    createdAt: new Date().toISOString(),
  });
});
```

---

## 21.5 Registering All Handlers at Startup

```typescript
// src/events/index.ts
// Import all handlers — side-effect imports that register listeners
import "./handlers/activity.handler.js";
import "./handlers/notification.handler.js";
import "./handlers/websocket.handler.js";
import "./handlers/email.handler.js";

// src/server.ts
import "./events/index.js"; // register all handlers before listen
```

---

## 21.6 Error Handling in Async Handlers

EventEmitter does not catch async errors automatically:

```typescript
// WRONG — uncaught promise rejection crashes the process
eventBus.on("task.created", async (payload) => {
  await doAsyncWork(payload); // if this throws, it's uncaught
});

// CORRECT — wrap in try/catch, log but don't rethrow
eventBus.on("task.created", async (payload) => {
  try {
    await doAsyncWork(payload);
  } catch (err) {
    logger.error({ err, payload }, "task.created handler failed");
    // Don't rethrow — other handlers should still run
  }
});
```

---

## 21.7 Synchronous vs Async Handlers

`EventEmitter.emit()` is synchronous — it calls all listeners immediately. Async listeners return Promises that are NOT awaited:

```typescript
// emit() does NOT wait for async handlers
eventBus.emit("task.created", payload); // returns immediately

// If you need to await handlers (e.g. in a transaction), use a different pattern:
const promises = listeners.map((fn) => fn(payload));
await Promise.allSettled(promises); // wait for all, don't fail on one
```

For TaskFlow, use fire-and-forget event emission. If reliability is critical (e.g. must guarantee activity log is written), use a database transaction in the service instead of an event.

---

## 21.8 When to Use Events vs Direct Calls

| Use Events When | Use Direct Calls When |
|----------------|--------------------|
| Multiple independent systems react to the same change | Only one thing needs to happen |
| You want to add handlers without editing the emitter | The reaction is part of the same business transaction |
| Reactions are fire-and-forget (notification, log) | The caller needs to know if the reaction succeeded |
| You're decoupling modules that shouldn't import each other | You need a synchronous, transactional guarantee |

---

## Summary

| Concept | Rule |
|---------|------|
| Typed `EventMap` | Maps event names to payload shapes — compiler catches wrong payloads |
| `TypedEventBus` | Wraps `EventEmitter` with generic methods |
| Handlers registered at startup | Import `events/index.ts` before `listen()` |
| Async error handling | Try/catch inside every async handler — never rethrow |
| Fire-and-forget | `emit()` does not await handlers — use direct calls for transactional guarantees |

---

## Exercise

Open `exercises/chapter_21.ts` and complete all TODOs.
