/**
 * Chapter 24 — Background Jobs with BullMQ
 *
 * Run: tsx exercises/chapter_24.ts
 */

// =============================================================================
// EXERCISE 1 — Job data types
// =============================================================================
// TODO: Define these job data interfaces:
//
//   SendEmailJobData: { to: string; subject: string; html: string; text: string }
//   ScanFileJobData:  { attachmentId: number; s3Key: string; userId: number }
//   FanOutNotificationJobData: { taskId: number; projectId: number; event: string; actorId: number; message: string }
//   SendReminderJobData: { taskId: number; dueDate: string; assigneeId: number }
//
// TODO: Define `JobType` union: "send-email" | "scan-file" | "fan-out" | "send-reminder"
// TODO: Define `JobDataMap` interface mapping each JobType to its data type

export interface SendEmailJobData {
  // TODO
}

export interface ScanFileJobData {
  // TODO
}

export interface FanOutNotificationJobData {
  // TODO
}

export interface SendReminderJobData {
  // TODO
}

export type JobType = never; // replace

export interface JobDataMap {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Typed job definition
// =============================================================================
// TODO: Define `Job<T>` interface: { id: string; name: string; data: T; attemptsMade: number; maxAttempts: number }
// TODO: Implement `createJob<T>(name: string, data: T, maxAttempts?: number): Job<T>`
//       Generate a unique id (use Math.random().toString(36).slice(2)), default maxAttempts = 3

export interface Job<T> {
  // TODO
}

export function createJob<T>(name: string, data: T, maxAttempts = 3): Job<T> {
  // TODO
  return {} as Job<T>;
}

// =============================================================================
// EXERCISE 3 — In-memory job queue
// =============================================================================
// TODO: Implement `InMemoryQueue<T>` class:
//       - add(name: string, data: T, opts?: { delay?: number; jobId?: string }): Job<T>
//         If jobId already exists in the queue, overwrite it (idempotency)
//       - process(): Job<T> | null  (returns and removes the next ready job, FIFO)
//       - getJob(jobId: string): Job<T> | undefined
//       - pending: number (count of waiting jobs)
//       - completed: Job<T>[]
//       - failed: Job<T>[]
//       - markCompleted(job: Job<T>): void
//       - markFailed(job: Job<T>): void

export class InMemoryQueue<T> {
  private jobs: Job<T>[] = [];
  public completed: Job<T>[] = [];
  public failed:    Job<T>[] = [];

  get pending(): number {
    // TODO
    return 0;
  }

  add(name: string, data: T, opts: { delay?: number; jobId?: string } = {}): Job<T> {
    // TODO: if jobId exists, replace; otherwise create new job and push
    return {} as Job<T>;
  }

  process(): Job<T> | null {
    // TODO: return and remove next job from queue (ignore delay for simplicity)
    return null;
  }

  getJob(jobId: string): Job<T> | undefined {
    // TODO
    return undefined;
  }

  markCompleted(job: Job<T>): void {
    // TODO
  }

  markFailed(job: Job<T>): void {
    // TODO
  }
}

// =============================================================================
// EXERCISE 4 — Retry strategy
// =============================================================================
// TODO: Define `BackoffStrategy` union: "exponential" | "fixed" | "linear"
// TODO: Implement `calculateNextRetryDelay(attemptsMade: number, baseDelayMs: number, strategy: BackoffStrategy): number`
//       - exponential: baseDelayMs * 2^attemptsMade
//       - fixed:       baseDelayMs
//       - linear:      baseDelayMs * (attemptsMade + 1)

export type BackoffStrategy = never; // replace

export function calculateNextRetryDelay(
  attemptsMade: number,
  baseDelayMs:  number,
  strategy:     BackoffStrategy
): number {
  // TODO
  return baseDelayMs;
}

// =============================================================================
// EXERCISE 5 — Job worker simulator
// =============================================================================
// TODO: Implement `JobWorker<T>` class:
//       - Constructor: (queue: InMemoryQueue<T>, processor: (job: Job<T>) => Promise<void>)
//       - async processNext(): Promise<boolean>
//         - Gets next job from queue
//         - Calls processor(job)
//         - If success: markCompleted
//         - If fail: increment attemptsMade; if < maxAttempts re-add to queue; else markFailed
//         - Returns true if a job was processed, false if queue was empty

export class JobWorker<T> {
  constructor(
    private queue:     InMemoryQueue<T>,
    private processor: (job: Job<T>) => Promise<void>
  ) {}

  async processNext(): Promise<boolean> {
    // TODO
    return false;
  }
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  // Exercise 2 — createJob
  const job1 = createJob("send-email", { to: "a@b.com", subject: "Hi" });
  const job2 = createJob("send-email", { to: "a@b.com", subject: "Hi" });
  console.assert(job1.id !== job2.id,     "Ex2: unique IDs");
  console.assert(job1.maxAttempts === 3,  "Ex2: default maxAttempts");
  console.assert(job1.name === "send-email", "Ex2: job name");

  // Exercise 3 — InMemoryQueue
  const queue = new InMemoryQueue<{ to: string }>();
  const j1 = queue.add("email", { to: "a@b.com" });
  const j2 = queue.add("email", { to: "b@b.com" });
  console.assert(queue.pending === 2, "Ex3: 2 pending");

  // Idempotency — same jobId should overwrite
  queue.add("email", { to: "updated@b.com" }, { jobId: j1.id });
  console.assert(queue.pending === 2, "Ex3: still 2 pending after overwrite");
  const updatedJob = queue.getJob(j1.id);
  console.assert(updatedJob?.data.to === "updated@b.com", "Ex3: job data updated");

  const next = queue.process();
  console.assert(next !== null,              "Ex3: should get a job");
  console.assert(queue.pending === 1,        "Ex3: 1 remaining after process");
  queue.markCompleted(next!);
  console.assert(queue.completed.length === 1, "Ex3: 1 completed");

  const failed = queue.process();
  queue.markFailed(failed!);
  console.assert(queue.failed.length === 1,    "Ex3: 1 failed");

  // Exercise 4 — retry delays
  console.assert(calculateNextRetryDelay(0, 1000, "exponential") === 1000,  "Ex4: exp attempt 0 = 1000");
  console.assert(calculateNextRetryDelay(1, 1000, "exponential") === 2000,  "Ex4: exp attempt 1 = 2000");
  console.assert(calculateNextRetryDelay(2, 1000, "exponential") === 4000,  "Ex4: exp attempt 2 = 4000");
  console.assert(calculateNextRetryDelay(5, 500,  "fixed")       === 500,   "Ex4: fixed always 500");
  console.assert(calculateNextRetryDelay(2, 1000, "linear")      === 3000,  "Ex4: linear attempt 2 = 3000");

  // Exercise 5 — JobWorker
  const workerQueue = new InMemoryQueue<{ n: number }>();
  let processed: number[] = [];

  const worker = new JobWorker(workerQueue, async (job) => {
    if (job.data.n === 0) throw new Error("fail");
    processed.push(job.data.n);
  });

  workerQueue.add("num", { n: 1 });
  workerQueue.add("num", { n: 2 });
  workerQueue.add("fail", { n: 0 }, );

  await worker.processNext(); // processes n=1
  await worker.processNext(); // processes n=2
  await worker.processNext(); // fails n=0 (attempt 1, re-queued)

  console.assert(processed.includes(1),              "Ex5: n=1 processed");
  console.assert(processed.includes(2),              "Ex5: n=2 processed");
  console.assert(workerQueue.failed.length === 0,    "Ex5: not failed yet (still has attempts)");

  // Exhaust attempts for n=0
  for (let i = 0; i < 3; i++) {
    const hasJob = await worker.processNext();
    if (!hasJob) break;
  }
  console.assert(workerQueue.failed.length >= 1,     "Ex5: n=0 job should be failed after exhausting attempts");

  const empty = await worker.processNext();
  console.assert(empty === false, "Ex5: empty queue returns false");

  console.log("Chapter 24 verification complete ✓");
}

verify();
