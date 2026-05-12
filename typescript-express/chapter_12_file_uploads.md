# Chapter 12 — File Uploads

## Learning Objectives

By the end of this chapter you will be able to:
- Configure `multer` with typed middleware for multipart uploads
- Validate file type and size before accepting the upload
- Store files in S3-compatible storage with typed SDK calls
- Clean up temporary files and orphaned S3 objects on error
- Return signed URLs for secure file access

---

## 12.1 Installing Dependencies

```bash
npm install multer @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install -D @types/multer
```

---

## 12.2 Multer Configuration

```typescript
// src/lib/upload.ts
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { ValidationError } from "../types/errors.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const upload = multer({
  storage: multer.memoryStorage(), // buffer in memory — no temp file on disk
  limits: {
    fileSize: MAX_FILE_SIZE,
    files:    5, // max 5 files per request
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new ValidationError(
        "Unsupported file type",
        { allowed: [...ALLOWED_MIME_TYPES], received: file.mimetype }
      ));
      return;
    }
    cb(null, true);
  },
});

// Generate a unique storage key
export function generateStorageKey(
  orgId: number,
  taskId: number,
  originalName: string
): string {
  const ext  = path.extname(originalName).toLowerCase();
  const uuid = crypto.randomUUID();
  return `orgs/${orgId}/tasks/${taskId}/${uuid}${ext}`;
}
```

---

## 12.3 S3 Client

```typescript
// src/lib/s3.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config/env.js";

export const s3 = new S3Client({
  region:      config.s3.region,
  credentials: {
    accessKeyId:     config.s3.accessKey!,
    secretAccessKey: config.s3.secretKey!,
  },
});

export async function uploadToS3(
  key:         string,
  buffer:      Buffer,
  contentType: string
): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket:      config.s3.bucket!,
    Key:         key,
    Body:        buffer,
    ContentType: contentType,
  }));

  // Return the public S3 URL (or use a CDN prefix)
  return `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`;
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({
    Bucket: config.s3.bucket!,
    Key:    key,
  }));
}

// Generate a pre-signed URL for temporary private access (15 min)
export async function getSignedDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: config.s3.bucket!, Key: key }),
    { expiresIn: 60 * 15 }
  );
}
```

---

## 12.4 Attachment Service

```typescript
// src/services/attachment.service.ts
import { uploadToS3, deleteFromS3, getSignedDownloadUrl } from "../lib/s3.js";
import { generateStorageKey } from "../lib/upload.js";
import { attachmentRepository } from "../repositories/attachment.repository.js";
import { taskRepository }       from "../repositories/task.repository.js";
import { NotFoundError, ForbiddenError } from "../types/errors.js";
import type { AuthUser } from "../types/auth.js";
import type { Express } from "express";

export async function uploadAttachment(
  taskId: number,
  file:   Express.Multer.File,
  user:   AuthUser
): Promise<Attachment> {
  const task = await taskRepository.findById(taskId);
  if (!task) throw new NotFoundError("Task", taskId);

  const key = generateStorageKey(user.orgId, taskId, file.originalname);

  let url: string;
  try {
    url = await uploadToS3(key, file.buffer, file.mimetype);
  } catch (cause) {
    // S3 upload failed — clean up and rethrow
    throw new AppError("INTERNAL_ERROR", "File upload failed", 500, { cause });
  }

  try {
    const attachment = await attachmentRepository.create({
      taskId,
      userId:   user.id,
      filename: file.originalname,
      url,
      size:     file.size,
      mimeType: file.mimetype,
    });
    return attachment;
  } catch (dbError) {
    // DB write failed — orphaned S3 object must be cleaned up
    await deleteFromS3(key).catch(console.error); // best-effort cleanup
    throw dbError;
  }
}

export async function deleteAttachment(
  attachmentId: number,
  user: AuthUser
): Promise<void> {
  const attachment = await attachmentRepository.findById(attachmentId);
  if (!attachment) throw new NotFoundError("Attachment", attachmentId);

  const isOwner  = attachment.userId === user.id;
  const isAdmin  = ["OWNER", "ADMIN"].includes(user.role.toUpperCase());
  if (!isOwner && !isAdmin) throw new ForbiddenError("Cannot delete this attachment");

  // Extract key from URL
  const key = new URL(attachment.url).pathname.slice(1);

  await Promise.all([
    deleteFromS3(key),
    attachmentRepository.delete(attachmentId),
  ]);
}
```

---

## 12.5 Attachment Router

```typescript
// src/api/v1/tasks/attachments.router.ts
import { Router } from "express";
import { upload }       from "../../../lib/upload.js";
import { asyncHandler } from "../../../middleware/asyncHandler.js";
import * as attachmentService from "../../../services/attachment.service.js";

export function createAttachmentRouter(): Router {
  const router = Router({ mergeParams: true });

  router.post(
    "/",
    upload.single("file"),   // "file" is the multipart field name
    asyncHandler(async (req, res) => {
      if (!req.file) {
        res.status(400).json({
          ok: false,
          error: { code: "VALIDATION_ERROR", message: "No file provided", statusCode: 400 },
        });
        return;
      }

      const attachment = await attachmentService.uploadAttachment(
        Number(req.params.taskId),
        req.file,
        req.user!
      );

      res.status(201).json({ ok: true, data: attachment });
    })
  );

  router.delete(
    "/:attachmentId",
    asyncHandler(async (req, res) => {
      await attachmentService.deleteAttachment(
        Number(req.params.attachmentId),
        req.user!
      );
      res.status(204).send();
    })
  );

  return router;
}
```

---

## 12.6 Multer Error Handling

Multer throws its own error types — map them in the error handler:

```typescript
import multer from "multer";

// In errorHandler, before AppError check:
if (err instanceof multer.MulterError) {
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({
      ok: false,
      error: { code: "UNPROCESSABLE", message: "File exceeds 10 MB limit", statusCode: 413 },
    });
    return;
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    res.status(413).json({
      ok: false,
      error: { code: "UNPROCESSABLE", message: "Too many files (max 5)", statusCode: 413 },
    });
    return;
  }
}
```

---

## 12.7 Local Storage Fallback (Dev Without S3)

```typescript
// src/lib/storage.ts — strategy pattern for switching backends
export interface StorageBackend {
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
}

class S3Storage implements StorageBackend { /* ... */ }

class LocalStorage implements StorageBackend {
  private dir = "./uploads";

  async upload(key: string, buffer: Buffer): Promise<string> {
    const filepath = path.join(this.dir, key);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, buffer);
    return `http://localhost:3000/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    await fs.unlink(path.join(this.dir, key)).catch(() => {});
  }
}

export const storage: StorageBackend = config.s3.bucket
  ? new S3Storage()
  : new LocalStorage(); // fallback when S3 not configured
```

---

## Summary

| Concept | Rule |
|---------|------|
| `memoryStorage()` | Buffer in memory — no temp file cleanup needed |
| `fileFilter` | Reject unsupported MIME types before accepting the upload |
| Cleanup on failure | If DB write fails after S3 upload, delete the S3 object |
| Signed URLs | Never expose raw S3 URLs for private files — use pre-signed URLs |
| Multer errors | Map `MulterError` separately in the error handler |

---

## Exercise

Open `exercises/chapter_12.ts` and complete all TODOs.
