import { eq, and, sql, lte, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { taskQueue } from "../db/schema.js";
import { logger } from "./logger.js";
import { jobFetchWorker } from "./workers/job-fetch.worker.js";
import { matchingWorker } from "./workers/matching.worker.js";
import { csvGenerationWorker } from "./workers/csv-generation.worker.js";
import { emailDeliveryWorker } from "./workers/email-delivery.worker.js";
import crypto from "node:crypto";

type TaskType = "job_fetch" | "matching" | "csv_generation" | "email_delivery";
type WorkerFn = (payload: unknown) => Promise<unknown>;

const workerRegistry: Record<TaskType, WorkerFn> = {
  job_fetch: jobFetchWorker,
  matching: matchingWorker,
  csv_generation: csvGenerationWorker,
  email_delivery: emailDeliveryWorker,
};

const workerId = `worker-${crypto.randomUUID().slice(0, 8)}`;

const STALE_LOCK_MINUTES = 5;
const BACKOFF_BASE_MS = 5000;

async function cleanStaleLocks(): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_LOCK_MINUTES * 60 * 1000);
  const stale = await db
    .update(taskQueue)
    .set({
      status: "retrying",
      lockedBy: null,
      lockedAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(taskQueue.status, "in_progress"),
        lte(taskQueue.lockedAt, cutoff),
      ),
    )
    .returning({ id: taskQueue.id });

  if (stale.length > 0) {
    logger.warn({ count: stale.length, ids: stale.map((s) => s.id) }, "Cleaned stale task locks");
  }
}

interface ClaimedTask {
  id: string;
  type: TaskType;
  payload: unknown;
  attempts: number;
  max_attempts: number;
}

async function claimTask(): Promise<ClaimedTask | null> {
  const now = new Date();
  // Atomic claim: update one eligible task and return it
  const result = await db.execute(sql`
    UPDATE task_queue
    SET status = 'in_progress',
        locked_by = ${workerId},
        locked_at = ${now},
        started_at = ${now},
        attempts = attempts + 1,
        updated_at = ${now}
    WHERE id = (
      SELECT id FROM task_queue
      WHERE status IN ('pending', 'retrying')
        AND scheduled_for <= ${now}
      ORDER BY priority DESC, scheduled_for ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, type, payload, attempts, max_attempts
  `);

  const rows = result.rows as unknown as ClaimedTask[];
  return rows[0] ?? null;
}

async function completeTask(taskId: string, result: unknown): Promise<void> {
  await db
    .update(taskQueue)
    .set({
      status: "completed",
      result: result as Record<string, unknown>,
      completedAt: new Date(),
      lockedBy: null,
      lockedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(taskQueue.id, taskId));
}

async function failTask(
  taskId: string,
  error: string,
  attempts: number,
  maxAttempts: number,
): Promise<void> {
  const shouldRetry = attempts < maxAttempts;
  const backoffMs = BACKOFF_BASE_MS * Math.pow(2, attempts - 1);

  await db
    .update(taskQueue)
    .set({
      status: shouldRetry ? "retrying" : "failed",
      lastError: error,
      scheduledFor: shouldRetry ? new Date(Date.now() + backoffMs) : undefined,
      lockedBy: null,
      lockedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(taskQueue.id, taskId));

  if (shouldRetry) {
    logger.info({ taskId, attempts, maxAttempts, backoffMs }, "Task scheduled for retry");
  } else {
    logger.error({ taskId, attempts, maxAttempts }, "Task permanently failed");
  }
}

async function pollOnce(): Promise<void> {
  try {
    await cleanStaleLocks();

    const task = await claimTask();
    if (!task) return;

    const worker = workerRegistry[task.type];
    if (!worker) {
      await failTask(task.id, `Unknown task type: ${task.type}`, task.attempts, task.max_attempts);
      return;
    }

    logger.info({ taskId: task.id, type: task.type, attempt: task.attempts }, "Processing task");

    try {
      const result = await worker(task.payload);
      await completeTask(task.id, result);
      logger.info({ taskId: task.id, type: task.type }, "Task completed");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ taskId: task.id, type: task.type, err: message }, "Task execution failed");
      await failTask(task.id, message, task.attempts, task.max_attempts);
    }
  } catch (err) {
    logger.error({ err }, "Task processor poll error");
  }
}

export function startTaskProcessor(pollIntervalMs: number): () => void {
  logger.info({ workerId, pollIntervalMs }, "Task processor started");
  const timer = setInterval(pollOnce, pollIntervalMs);
  return () => {
    clearInterval(timer);
    logger.info({ workerId }, "Task processor stopped");
  };
}
