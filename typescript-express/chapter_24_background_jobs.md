# Chapter 24 — Background Jobs with BullMQ

## Learning Objectives

By the end of this chapter you will be able to:
- Set up BullMQ queues with typed job definitions
- Process jobs in dedicated worker processes
- Configure retry strategies and dead-letter queues
- Schedule delayed and recurring jobs
- Monitor queue health

---

## 24.1 Why Background Jobs

Some operations should not happen in the HTTP request cycle:
- Sending emails (can take 500ms–2s, user shouldn't wait)
- Processing file uploads (virus scan, thumbnail generation)
- Fan-out notifications (notify 1000 task watchers asynchronously)
- Scheduled reminders (due-date alerts sent at midnight)

BullMQ is the production-grade Node.js job queue built on Redis.

---

## 24.2 Installing BullMQ

```bash
npm install bullmq
```

BullMQ uses the same Redis instance as caching — no extra setup needed.

---

## 24.3 Typed Job Definitions

```typescript
// src/jobs/types.ts

export interface SendEmailJobData {
  to:      string;
  subject: string;
  html:    string;
  text:    string;
}

export interface ScanFileJobData {
  attachmentId: number;
  s3Key:        string;
  userId:       number;
}

export interface FanOutNotificationJobData {
  taskId:    number;
  projectId: number;
  event:     "task.created" | "task.updated" | "task.deleted";
  actorId:   number;
  message:   string;
}

export interface SendDueDateReminderJobData {
  taskId:    number;
  dueDate:   string; // ISO string
  assigneeId: number;
}

// Union of all job data types — used by the worker to narrow type per queue
export type JobData =
  | SendEmailJobData
  | ScanFileJobData
  | FanOutNotificationJobData
  | SendDueDateReminderJobData;
```

---

## 24.4 Queue Setup

```typescript
// src/jobs/queues.ts
import { Queue } from "bullmq";
import { redis } from "../lib/redis.js";
import type {
  SendEmailJobData,
  ScanFileJobData,
  FanOutNotificationJobData,
  SendDueDateReminderJobData,
} from "./types.js";

const connection = { host: redis.options.host, port: redis.options.port };

// One typed queue per job category
export const emailQueue = new Queue<SendEmailJobData>("email", {
  connection,
  defaultJobOptions: {
    attempts:    3,
    backoff:     { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 100 },  // keep last 100 completed jobs
    removeOnFail:     { count: 200 },  // keep last 200 failed jobs
  },
});

export const fileQueue = new Queue<ScanFileJobData>("file-scan", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff:  { type: "fixed", delay: 5000 },
    timeout:  30_000, // 30 seconds — file scanning can be slow
  },
});

export const notificationQueue = new Queue<FanOutNotificationJobData>("notifications", {
  connection,
  defaultJobOptions: {
    attempts:         5,
    backoff:          { type: "exponential", delay: 500 },
    removeOnComplete: true,
  },
});

export const reminderQueue = new Queue<SendDueDateReminderJobData>("reminders", {
  connection,
});
```

---

## 24.5 Enqueueing Jobs from Services

```typescript
// src/services/task.service.ts
import { emailQueue, notificationQueue } from "../jobs/queues.js";

export async function create(projectId: number, dto: CreateTaskDto, user: AuthUser): Promise<Task> {
  const task = await taskRepository.create({ ... });

  if (task.assigneeId && task.assigneeId !== user.id) {
    // Enqueue email notification — non-blocking
    await emailQueue.add(
      "task-assigned",
      {
        to:      assignee.email,
        subject: `New task assigned: ${task.title}`,
        html:    `<p>${user.name} assigned you a task: <strong>${task.title}</strong></p>`,
        text:    `${user.name} assigned you: ${task.title}`,
      },
      { jobId: `task-assigned:${task.id}` } // idempotent key
    );

    // Enqueue fan-out notifications
    await notificationQueue.add("task-created", {
      taskId:    task.id,
      projectId: task.projectId,
      event:     "task.created",
      actorId:   user.id,
      message:   `${user.name} created "${task.title}"`,
    });
  }

  return task;
}

// Schedule a due-date reminder when a task gets a due date
export async function setDueDate(taskId: number, dueDate: Date, user: AuthUser): Promise<Task> {
  const task = await taskRepository.update(taskId, { dueDate });

  if (task.assigneeId) {
    const delay = dueDate.getTime() - Date.now() - 24 * 60 * 60 * 1000; // 24h before due
    if (delay > 0) {
      await reminderQueue.add(
        "due-date-reminder",
        { taskId: task.id, dueDate: dueDate.toISOString(), assigneeId: task.assigneeId },
        { delay, jobId: `reminder:${taskId}` } // overwrite existing reminder if date changes
      );
    }
  }

  return task;
}
```

---

## 24.6 Workers

Workers run in a separate process — they consume jobs from the queue:

```typescript
// src/jobs/workers/email.worker.ts
import { Worker } from "bullmq";
import type { SendEmailJobData } from "../types.js";
import { sendEmail } from "../../lib/email.js"; // nodemailer or Resend SDK

const worker = new Worker<SendEmailJobData>(
  "email",
  async (job) => {
    const { to, subject, html, text } = job.data;

    await job.updateProgress(10);
    await sendEmail({ to, subject, html, text });
    await job.updateProgress(100);

    console.log(`[email-worker] Sent to ${to}: ${subject}`);
  },
  {
    connection: { host: "localhost", port: 6379 },
    concurrency: 5,  // process 5 emails simultaneously
  }
);

worker.on("failed", (job, err) => {
  console.error(`[email-worker] Job ${job?.id} failed:`, err.message);
  // After all retries exhausted, job moves to the failed set (dead-letter queue)
});

worker.on("completed", (job) => {
  console.log(`[email-worker] Job ${job.id} completed`);
});
```

---

## 24.7 Running Workers

Start workers in separate processes so they don't share event loop resources with the API:

```json
{
  "scripts": {
    "worker:email":        "tsx src/jobs/workers/email.worker.ts",
    "worker:file":         "tsx src/jobs/workers/file.worker.ts",
    "worker:notification": "tsx src/jobs/workers/notification.worker.ts"
  }
}
```

In Docker:

```dockerfile
# docker-compose.yml
services:
  worker-email:
    build: .
    command: ["node", "dist/jobs/workers/email.worker.js"]
    depends_on:
      redis: { condition: service_healthy }
    restart: unless-stopped
    environment: *api-env

  worker-notification:
    build: .
    command: ["node", "dist/jobs/workers/notification.worker.js"]
    depends_on:
      redis: { condition: service_healthy }
    restart: unless-stopped
    environment: *api-env
```

---

## 24.8 Recurring Jobs (Cron)

```typescript
// Add a recurring job when the worker starts
await reminderQueue.add(
  "check-overdue-tasks",
  {},
  {
    repeat: { pattern: "0 9 * * *" }, // every day at 9am
    jobId:  "check-overdue-daily",    // stable ID prevents duplicate schedules
  }
);
```

---

## 24.9 Bull Board — Queue Dashboard

```bash
npm install @bull-board/express @bull-board/api
```

```typescript
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter }   from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter }  from "@bull-board/express";
import { emailQueue, fileQueue, notificationQueue } from "./jobs/queues.js";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(fileQueue),
    new BullMQAdapter(notificationQueue),
  ],
  serverAdapter,
});

// Mount in app.ts (protect with admin auth in production)
app.use("/admin/queues", authenticate, requireRole("owner"), serverAdapter.getRouter());
```

Dashboard at `http://localhost:3000/admin/queues` shows job counts, failed jobs, retry history.

---

## Summary

| Concept | Rule |
|---------|------|
| Typed job data | Interface per job type — no `any` in job payloads |
| One queue per category | `email`, `file-scan`, `notifications`, `reminders` |
| `jobId` for idempotency | Prevents duplicate jobs on retry |
| Workers in separate processes | Don't share event loop with the HTTP server |
| Dead-letter queue | Failed jobs after all retries → `failed` set in Redis — inspect in Bull Board |

---

## Exercise

Open `exercises/chapter_24.ts` and complete all TODOs.
