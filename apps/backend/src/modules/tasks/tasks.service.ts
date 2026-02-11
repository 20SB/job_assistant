import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import { db } from "../../db/index.js";
import { taskQueue } from "../../db/schema.js";
import { NotFound } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";

type TaskType = "job_fetch" | "matching" | "csv_generation" | "email_delivery";

interface EnqueueOptions {
  priority?: number;
  maxAttempts?: number;
  scheduledFor?: Date;
}

export async function enqueue(
  type: TaskType,
  payload: unknown,
  options: EnqueueOptions = {},
) {
  const [task] = await db
    .insert(taskQueue)
    .values({
      type,
      payload: payload as Record<string, unknown>,
      priority: options.priority ?? 0,
      maxAttempts: options.maxAttempts ?? 3,
      scheduledFor: options.scheduledFor ?? new Date(),
    })
    .returning();

  logger.info({ taskId: task.id, type }, "Task enqueued");
  return task;
}

export async function getTask(taskId: string) {
  const [task] = await db
    .select()
    .from(taskQueue)
    .where(eq(taskQueue.id, taskId))
    .limit(1);

  if (!task) throw NotFound("Task not found");
  return task;
}

interface ListTasksParams {
  page: number;
  limit: number;
  type?: TaskType;
  status?: "pending" | "in_progress" | "completed" | "failed" | "retrying";
}

export async function listTasks(params: ListTasksParams) {
  const { page, limit, type, status } = params;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];
  if (type) conditions.push(eq(taskQueue.type, type));
  if (status) conditions.push(eq(taskQueue.status, status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [tasks, countResult] = await Promise.all([
    db
      .select()
      .from(taskQueue)
      .where(where)
      .orderBy(desc(taskQueue.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(taskQueue)
      .where(where),
  ]);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total: countResult[0].count,
      totalPages: Math.ceil(countResult[0].count / limit),
    },
  };
}
