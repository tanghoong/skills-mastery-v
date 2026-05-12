# Chapter 17 — Real-Time with Socket.io

## Learning Objectives

By the end of this chapter you will be able to:
- Attach Socket.io to an existing Express server
- Type Socket.io events end-to-end — no `any`
- Authenticate WebSocket connections with JWT
- Implement rooms for per-project real-time updates
- Emit domain events from the service layer to connected clients

---

## 17.1 Installing Socket.io

```bash
npm install socket.io
```

---

## 17.2 Typed Socket Events

Socket.io events are stringly typed by default. Define all events in a shared type map:

```typescript
// src/ws/events.ts

// Events the SERVER emits to clients
export interface ServerToClientEvents {
  "task.created":  (payload: TaskCreatedPayload)  => void;
  "task.updated":  (payload: TaskUpdatedPayload)  => void;
  "task.deleted":  (payload: TaskDeletedPayload)  => void;
  "comment.added": (payload: CommentAddedPayload) => void;
  "member.joined": (payload: MemberPayload)       => void;
  "member.left":   (payload: MemberPayload)       => void;
  "error":         (payload: WsErrorPayload)      => void;
}

// Events the CLIENT sends to the server
export interface ClientToServerEvents {
  "project.subscribe":   (projectId: number, ack: (status: "ok" | "forbidden") => void) => void;
  "project.unsubscribe": (projectId: number) => void;
}

// Per-socket data attached at auth time
export interface SocketData {
  userId: number;
  orgId:  number;
  email:  string;
  role:   string;
}

// Payload types
export interface TaskCreatedPayload {
  taskId:    number;
  projectId: number;
  title:     string;
  createdBy: { id: number; name: string };
  createdAt: string;
}

export interface TaskUpdatedPayload {
  taskId:    number;
  projectId: number;
  changes:   Record<string, unknown>;
  updatedBy: { id: number; name: string };
}

export interface TaskDeletedPayload {
  taskId:    number;
  projectId: number;
}

export interface CommentAddedPayload {
  commentId: number;
  taskId:    number;
  content:   string;
  author:    { id: number; name: string };
  createdAt: string;
}

export interface MemberPayload {
  userId: number;
  name:   string;
  orgId:  number;
}

export interface WsErrorPayload {
  code:    string;
  message: string;
}
```

---

## 17.3 WebSocket Gateway Setup

```typescript
// src/ws/gateway.ts
import { Server as SocketServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyAccessToken } from "../lib/jwt.js";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from "./events.js";

export type TypedServer = SocketServer<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export function createWebSocketGateway(httpServer: HttpServer): TypedServer {
  const io: TypedServer = new SocketServer(httpServer, {
    cors: {
      origin:      ["https://app.taskflow.io", "http://localhost:5173"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Auth middleware — runs before any connection is accepted
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token as string | undefined ??
      socket.handshake.query?.token as string | undefined;

    if (!token) {
      next(new Error("UNAUTHORIZED: token required"));
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data = {
        userId: payload.sub,
        orgId:  payload.orgId,
        email:  payload.email,
        role:   payload.role,
      };
      next();
    } catch {
      next(new Error("UNAUTHORIZED: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, orgId } = socket.data;

    console.log(`WS connected: user ${userId} org ${orgId}`);

    // Subscribe to a project's real-time updates
    socket.on("project.subscribe", async (projectId, ack) => {
      // Verify the user belongs to the org that owns this project
      const project = await prisma.project.findFirst({
        where: { id: projectId, orgId },
      });

      if (!project) {
        ack("forbidden");
        return;
      }

      await socket.join(`project:${projectId}`);
      ack("ok");
    });

    socket.on("project.unsubscribe", async (projectId) => {
      await socket.leave(`project:${projectId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`WS disconnected: user ${userId} — ${reason}`);
    });
  });

  return io;
}
```

---

## 17.4 Integrating with server.ts

```typescript
// src/server.ts
import http from "http";
import { createApp }               from "./app.js";
import { createWebSocketGateway }  from "./ws/gateway.js";
import { config }                  from "./config/env.js";

const app        = createApp();
const httpServer = http.createServer(app);
const io         = createWebSocketGateway(httpServer);

// Make io available to services via module export
export { io };

httpServer.listen(config.port, () => {
  console.log(`HTTP + WS on :${config.port}`);
});
```

---

## 17.5 Emitting Events from Services

```typescript
// src/services/task.service.ts
import { io } from "../server.js"; // import the socket.io instance

export async function create(projectId: number, dto: CreateTaskDto, user: AuthUser) {
  const task = await taskRepository.create({ ... });

  // Emit to all clients subscribed to this project
  io.to(`project:${projectId}`).emit("task.created", {
    taskId:    task.id,
    projectId: task.projectId,
    title:     task.title,
    createdBy: { id: user.id, name: user.name },
    createdAt: task.createdAt.toISOString(),
  });

  return task;
}
```

**Circular dependency warning**: `server.ts` creates the app and socket server. If services import from `server.ts`, and `server.ts` imports the app which imports services, you have a cycle. Solution: move `io` to a separate module:

```typescript
// src/ws/io.ts — io singleton, no other imports
import { Server as SocketServer } from "socket.io";
export let io: SocketServer;
export function setIo(instance: SocketServer) { io = instance; }

// src/server.ts
import { setIo } from "./ws/io.js";
const io = createWebSocketGateway(httpServer);
setIo(io);

// src/services/task.service.ts
import { io } from "../ws/io.js"; // safe — no cycle
```

---

## 17.6 Rooms Strategy for TaskFlow

| Room Name | Who Joins | Events Received |
|-----------|----------|----------------|
| `project:{id}` | Members subscribed to a project | `task.*`, `comment.*` |
| `org:{id}` | All org members | `member.joined`, `member.left` |
| `user:{id}` | Single user's own socket(s) | Notifications |

---

## 17.7 Client Usage (TypeScript)

```typescript
import { io } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "./ws/events.ts";

const socket = io("https://api.taskflow.io", {
  auth:       { token: accessToken },
  transports: ["websocket"],
});

socket.on("connect", () => {
  // Subscribe to project 42
  socket.emit("project.subscribe", 42, (status) => {
    console.log("Subscription status:", status);
  });
});

socket.on("task.created", (payload) => {
  console.log("New task:", payload.title);
  // Update UI
});

socket.on("task.updated", (payload) => {
  console.log("Task updated:", payload.taskId, payload.changes);
});
```

---

## Summary

| Concept | Rule |
|---------|------|
| Typed event maps | `ServerToClientEvents`, `ClientToServerEvents`, `SocketData` — no `any` |
| Auth middleware | Verify JWT in `io.use()` before any connection is accepted |
| Rooms | Group sockets by project/org/user — emit to rooms, not broadcasts |
| Service layer emission | Emit from service after DB write — same transaction boundary |
| Circular dependency | Use a `ws/io.ts` singleton module to avoid server↔service cycles |

---

## Exercise

Open `exercises/chapter_17.ts` and complete all TODOs.
