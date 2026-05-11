/**
 * Chapter 17 — Real-Time with Socket.io
 *
 * Run: tsx exercises/chapter_17.ts
 */

// =============================================================================
// EXERCISE 1 — Typed event map
// =============================================================================
// TODO: Define `TaskCreatedPayload` interface:
//       { taskId: number; projectId: number; title: string; createdBy: { id: number; name: string }; createdAt: string }
//
// TODO: Define `TaskUpdatedPayload` interface:
//       { taskId: number; projectId: number; changes: Record<string, unknown>; updatedBy: { id: number; name: string } }
//
// TODO: Define `ServerToClientEvents` interface mapping event names to payload types:
//       "task.created"  → TaskCreatedPayload
//       "task.updated"  → TaskUpdatedPayload
//       "task.deleted"  → { taskId: number; projectId: number }
//       "comment.added" → { commentId: number; taskId: number; content: string; author: { id: number; name: string } }

export interface TaskCreatedPayload {
  // TODO
}

export interface TaskUpdatedPayload {
  // TODO
}

export interface ServerToClientEvents {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Room name generators
// =============================================================================
// TODO: Implement these room name generators:
//       projectRoom(projectId: number): string → "project:{projectId}"
//       orgRoom(orgId: number): string         → "org:{orgId}"
//       userRoom(userId: number): string       → "user:{userId}"

export function projectRoom(projectId: number): string {
  // TODO
  return "";
}

export function orgRoom(orgId: number): string {
  // TODO
  return "";
}

export function userRoom(userId: number): string {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 3 — Socket auth token extractor
// =============================================================================
// TODO: Define `HandshakeData` interface:
//       { auth?: { token?: string }; query?: Record<string, string | string[]> }
//
// TODO: Implement `extractSocketToken(handshake: HandshakeData): string | null`
//       1. Check handshake.auth.token
//       2. Check handshake.query.token (take first if array)
//       3. Return null if neither present

export interface HandshakeData {
  // TODO
}

export function extractSocketToken(handshake: HandshakeData): string | null {
  // TODO
  return null;
}

// =============================================================================
// EXERCISE 4 — In-memory room manager (mock Socket.io rooms)
// =============================================================================
// TODO: Implement `RoomManager` class:
//       - join(socketId: string, room: string): void
//       - leave(socketId: string, room: string): void
//       - getSocketRooms(socketId: string): string[]
//       - getRoomSockets(room: string): string[]
//       - leaveAll(socketId: string): void

export class RoomManager {
  private socketRooms = new Map<string, Set<string>>(); // socketId → rooms
  private roomSockets = new Map<string, Set<string>>(); // room → socketIds

  join(socketId: string, room: string): void {
    // TODO
  }

  leave(socketId: string, room: string): void {
    // TODO
  }

  getSocketRooms(socketId: string): string[] {
    // TODO
    return [];
  }

  getRoomSockets(room: string): string[] {
    // TODO
    return [];
  }

  leaveAll(socketId: string): void {
    // TODO
  }
}

// =============================================================================
// EXERCISE 5 — Event broadcaster (mock emitter)
// =============================================================================
// TODO: Implement `EventBroadcaster` class:
//       - Constructor takes a RoomManager
//       - Keeps an emit log: Array<{ room: string; event: string; payload: unknown }>
//       - emit(room: string, event: string, payload: unknown): number
//         Returns the number of sockets in the room (from RoomManager)
//         Logs the emission

export class EventBroadcaster {
  public emitLog: Array<{ room: string; event: string; payload: unknown }> = [];

  constructor(private rooms: RoomManager) {}

  emit(room: string, event: string, payload: unknown): number {
    // TODO
    return 0;
  }
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 2 — room names
  console.assert(projectRoom(42)  === "project:42",  "Ex2: project room format");
  console.assert(orgRoom(7)       === "org:7",        "Ex2: org room format");
  console.assert(userRoom(99)     === "user:99",      "Ex2: user room format");

  // Exercise 3 — token extraction
  console.assert(extractSocketToken({ auth: { token: "abc" } })        === "abc",  "Ex3: auth token");
  console.assert(extractSocketToken({ query: { token: "xyz" } })       === "xyz",  "Ex3: query token");
  console.assert(extractSocketToken({ auth: { token: "auth-wins" }, query: { token: "query" } }) === "auth-wins", "Ex3: auth takes priority");
  console.assert(extractSocketToken({})                                 === null,   "Ex3: no token → null");
  console.assert(extractSocketToken({ query: { token: ["first","second"] } }) === "first", "Ex3: array query takes first");

  // Exercise 4 — RoomManager
  const rooms = new RoomManager();
  rooms.join("socket1", "project:1");
  rooms.join("socket1", "org:5");
  rooms.join("socket2", "project:1");

  console.assert(rooms.getSocketRooms("socket1").length === 2,            "Ex4: socket1 in 2 rooms");
  console.assert(rooms.getRoomSockets("project:1").length === 2,          "Ex4: project:1 has 2 sockets");
  console.assert(rooms.getRoomSockets("org:5").length === 1,              "Ex4: org:5 has 1 socket");

  rooms.leave("socket1", "org:5");
  console.assert(rooms.getSocketRooms("socket1").length === 1,            "Ex4: socket1 now in 1 room");
  console.assert(!rooms.getSocketRooms("socket1").includes("org:5"),      "Ex4: left org:5");

  rooms.leaveAll("socket1");
  console.assert(rooms.getSocketRooms("socket1").length === 0,            "Ex4: socket1 left all rooms");
  console.assert(rooms.getRoomSockets("project:1").includes("socket2"),   "Ex4: socket2 still in project:1");

  // Exercise 5 — EventBroadcaster
  const broadcaster = new EventBroadcaster(rooms);
  rooms.join("socket3", "project:42");
  rooms.join("socket4", "project:42");

  const count = broadcaster.emit("project:42", "task.created", { taskId: 1 });
  console.assert(count === 2,                             "Ex5: 2 sockets in room");
  console.assert(broadcaster.emitLog.length === 1,        "Ex5: logged 1 emission");
  console.assert(broadcaster.emitLog[0].event === "task.created", "Ex5: event name logged");
  console.assert(broadcaster.emitLog[0].room  === "project:42",   "Ex5: room logged");

  const zeroCount = broadcaster.emit("project:999", "task.created", {});
  console.assert(zeroCount === 0, "Ex5: empty room returns 0");

  console.log("Chapter 17 verification complete ✓");
}

verify();
