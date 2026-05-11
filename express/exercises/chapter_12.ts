/**
 * Chapter 12 — File Uploads
 *
 * Run: tsx exercises/chapter_12.ts
 */

import crypto from "crypto";
import path   from "path";

// =============================================================================
// EXERCISE 1 — MIME type allowlist
// =============================================================================
// TODO: Create a `ALLOWED_MIME_TYPES` Set<string> containing these types:
//       image/jpeg, image/png, image/gif, image/webp,
//       application/pdf, text/plain

export const ALLOWED_MIME_TYPES: Set<string> = new Set([
  // TODO
]);

// TODO: Implement `isMimeAllowed(mimeType: string): boolean`
export function isMimeAllowed(mimeType: string): boolean {
  // TODO
  return false;
}

// =============================================================================
// EXERCISE 2 — File validation
// =============================================================================
// TODO: Define `FileValidationResult` type:
//       | { valid: true }
//       | { valid: false; reason: string }
//
// TODO: Implement `validateFile(file: { mimetype: string; size: number }, maxSizeBytes: number): FileValidationResult`
//       - If mime not allowed: { valid: false, reason: "Unsupported file type: {mimeType}" }
//       - If size > maxSizeBytes: { valid: false, reason: "File exceeds {maxSizeBytes} byte limit" }
//       - Otherwise: { valid: true }

export type FileValidationResult = never; // replace

export function validateFile(
  file: { mimetype: string; size: number },
  maxSizeBytes: number
): FileValidationResult {
  // TODO
  return { valid: true };
}

// =============================================================================
// EXERCISE 3 — Storage key generation
// =============================================================================
// TODO: Implement `generateStorageKey(orgId: number, taskId: number, filename: string): string`
//       Format: "orgs/{orgId}/tasks/{taskId}/{uuid}{ext}"
//       - ext from path.extname(filename).toLowerCase()
//       - uuid from crypto.randomUUID()

export function generateStorageKey(orgId: number, taskId: number, filename: string): string {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 4 — Mock storage backend
// =============================================================================
// TODO: Define `StorageBackend` interface:
//       - upload(key: string, buffer: Buffer, contentType: string): Promise<string>  → returns URL
//       - delete(key: string): Promise<void>
//       - exists(key: string): Promise<boolean>
//
// TODO: Implement `InMemoryStorage` class:
//       - Stores buffers in a Map<string, Buffer>
//       - upload: stores the buffer, returns `memory://${key}`
//       - delete: removes the buffer
//       - exists: checks if key exists in the map

export interface StorageBackend {
  // TODO
}

export class InMemoryStorage implements StorageBackend {
  private store = new Map<string, Buffer>();

  async upload(key: string, buffer: Buffer, _contentType: string): Promise<string> {
    // TODO
    return "";
  }

  async delete(key: string): Promise<void> {
    // TODO
  }

  async exists(key: string): Promise<boolean> {
    // TODO
    return false;
  }
}

// =============================================================================
// EXERCISE 5 — Cleanup on failure
// =============================================================================
// TODO: Implement `uploadWithCleanup<T>(
//         storage: StorageBackend,
//         key: string,
//         buffer: Buffer,
//         contentType: string,
//         afterUpload: (url: string) => Promise<T>
//       ): Promise<T>`
//
//       - Uploads the file to storage
//       - Calls afterUpload with the URL
//       - If afterUpload throws: deletes the uploaded file (best-effort) and rethrows
//       - Returns the result of afterUpload on success

export async function uploadWithCleanup<T>(
  storage:      StorageBackend,
  key:          string,
  buffer:       Buffer,
  contentType:  string,
  afterUpload:  (url: string) => Promise<T>
): Promise<T> {
  // TODO
  return {} as T;
}

// =============================================================================
// EXERCISE 6 — Multer error codes
// =============================================================================
// TODO: Define `MulterErrorCode` union:
//       "LIMIT_FILE_SIZE" | "LIMIT_FILE_COUNT" | "LIMIT_UNEXPECTED_FILE"
// TODO: Implement `mapMulterError(code: string): { statusCode: number; message: string }`
//       LIMIT_FILE_SIZE       → 413, "File exceeds size limit"
//       LIMIT_FILE_COUNT      → 413, "Too many files"
//       LIMIT_UNEXPECTED_FILE → 400, "Unexpected file field"
//       default               → 400, "Upload error"

export type MulterErrorCode = never; // replace

export function mapMulterError(code: string): { statusCode: number; message: string } {
  // TODO
  return { statusCode: 400, message: "Upload error" };
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  // Exercise 1
  console.assert(isMimeAllowed("image/jpeg") === true,  "Ex1: jpeg should be allowed");
  console.assert(isMimeAllowed("video/mp4")  === false, "Ex1: mp4 should not be allowed");

  // Exercise 2
  const okFile   = validateFile({ mimetype: "image/png", size: 1024 }, 10 * 1024 * 1024);
  console.assert((okFile as any).valid === true, "Ex2: valid file should pass");

  const bigFile  = validateFile({ mimetype: "image/png", size: 20 * 1024 * 1024 }, 10 * 1024 * 1024);
  console.assert((bigFile as any).valid === false, "Ex2: file over limit should fail");

  const badMime  = validateFile({ mimetype: "video/mp4", size: 100 }, 10 * 1024 * 1024);
  console.assert((badMime as any).valid === false, "Ex2: bad mime should fail");

  // Exercise 3
  const key = generateStorageKey(1, 42, "photo.JPG");
  console.assert(key.startsWith("orgs/1/tasks/42/"), "Ex3: key should start with org/task path");
  console.assert(key.endsWith(".jpg"),                "Ex3: extension should be lowercase .jpg");

  const key2 = generateStorageKey(1, 42, "photo.JPG");
  console.assert(key !== key2, "Ex3: each key should be unique (UUID)");

  // Exercise 4 — in-memory storage
  const storage = new InMemoryStorage();
  const buf     = Buffer.from("hello");
  const url     = await storage.upload("test/file.txt", buf, "text/plain");
  console.assert(url.includes("test/file.txt"),         "Ex4: URL should contain key");
  console.assert(await storage.exists("test/file.txt"), "Ex4: file should exist after upload");

  await storage.delete("test/file.txt");
  console.assert(!(await storage.exists("test/file.txt")), "Ex4: file should not exist after delete");

  // Exercise 5 — cleanup on failure
  const storageForCleanup = new InMemoryStorage();
  const cleanupKey        = "cleanup/test.txt";

  // Success path
  const successResult = await uploadWithCleanup(
    storageForCleanup,
    cleanupKey,
    Buffer.from("data"),
    "text/plain",
    async (url) => ({ saved: true, url })
  );
  console.assert((successResult as any).saved === true, "Ex5: success path should return afterUpload result");
  console.assert(await storageForCleanup.exists(cleanupKey), "Ex5: file should exist after success");

  // Failure path
  const failStorage = new InMemoryStorage();
  let cleanupThrew  = false;
  try {
    await uploadWithCleanup(
      failStorage,
      "fail/file.txt",
      Buffer.from("data"),
      "text/plain",
      async () => { throw new Error("DB write failed"); }
    );
  } catch { cleanupThrew = true; }

  console.assert(cleanupThrew,                                 "Ex5: should rethrow the error");
  console.assert(!(await failStorage.exists("fail/file.txt")), "Ex5: file should be cleaned up on failure");

  // Exercise 6
  console.assert(mapMulterError("LIMIT_FILE_SIZE").statusCode === 413,   "Ex6: file size → 413");
  console.assert(mapMulterError("LIMIT_FILE_COUNT").statusCode === 413,  "Ex6: file count → 413");
  console.assert(mapMulterError("UNKNOWN_CODE").statusCode === 400,      "Ex6: unknown → 400");

  console.log("Chapter 12 verification complete ✓");
}

verify();
