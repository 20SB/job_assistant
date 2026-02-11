import { db } from "../../db/index.js";
import {
  users,
  userSubscriptions,
  subscriptionPlans,
  jobFetchLogs,
  matchingLogs,
  emailDeliveryLogs,
  taskQueue,
  jobs,
  matchBatches,
} from "../../db/schema.js";
import { logger } from "../../lib/logger.js";
import { NotFound } from "../../lib/errors.js";
import { eq, desc, and, ilike, sql } from "drizzle-orm";
import type {
  UsersQuery,
  JobFetchLogsQuery,
  MatchingLogsQuery,
  EmailDeliveryLogsQuery,
  TaskQueueQuery,
} from "./admin.schemas.js";

// ============================================================================
// USERS
// ============================================================================

export async function listUsers(query: UsersQuery) {
  const { page, limit, search, role, emailVerified, isActive } = query;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(ilike(users.email, `%${search}%`));
  }
  if (role) {
    conditions.push(eq(users.role, role));
  }
  if (emailVerified) {
    conditions.push(eq(users.emailVerified, emailVerified));
  }
  if (isActive !== undefined) {
    conditions.push(eq(users.isActive, isActive));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(where);
  const total = countResult[0]?.count ?? 0;

  // Get users with their active subscription
  const usersList = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      emailVerified: users.emailVerified,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      subscription: {
        id: userSubscriptions.id,
        status: userSubscriptions.status,
        planName: subscriptionPlans.name,
        currentPeriodEnd: userSubscriptions.currentPeriodEnd,
      },
    })
    .from(users)
    .leftJoin(userSubscriptions, eq(users.id, userSubscriptions.userId))
    .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  logger.info({ total, page, limit }, "Admin: Listed users");

  return {
    users: usersList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserDetails(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      jobPreferences: true,
      notificationPreferences: true,
      cvSnapshots: {
        where: eq(sql`is_active`, true),
        limit: 1,
      },
      userSubscriptions: {
        with: {
          plan: true,
        },
        orderBy: desc(userSubscriptions.createdAt),
        limit: 1,
      },
    },
  });

  if (!user) {
    throw NotFound("User not found");
  }

  logger.info({ userId }, "Admin: Fetched user details");

  return user;
}

// ============================================================================
// JOB FETCH LOGS
// ============================================================================

export async function listJobFetchLogs(query: JobFetchLogsQuery) {
  const { page, limit, status, source } = query;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) {
    conditions.push(eq(jobFetchLogs.status, status));
  }
  if (source) {
    conditions.push(eq(jobFetchLogs.source, source));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(jobFetchLogs)
    .where(where);
  const total = countResult[0]?.count ?? 0;

  // Get logs
  const logs = await db
    .select()
    .from(jobFetchLogs)
    .where(where)
    .orderBy(desc(jobFetchLogs.startedAt))
    .limit(limit)
    .offset(offset);

  logger.info({ total, page, limit, status, source }, "Admin: Listed job fetch logs");

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================================
// MATCHING LOGS
// ============================================================================

export async function listMatchingLogs(query: MatchingLogsQuery) {
  const { page, limit, userId, batchId, level } = query;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (userId) {
    conditions.push(eq(matchingLogs.userId, userId));
  }
  if (batchId) {
    conditions.push(eq(matchingLogs.batchId, batchId));
  }
  if (level) {
    conditions.push(eq(matchingLogs.level, level));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matchingLogs)
    .where(where);
  const total = countResult[0]?.count ?? 0;

  // Get logs with batch and user info
  const logs = await db
    .select({
      id: matchingLogs.id,
      batchId: matchingLogs.batchId,
      userId: matchingLogs.userId,
      userEmail: users.email,
      message: matchingLogs.message,
      level: matchingLogs.level,
      metadata: matchingLogs.metadata,
      createdAt: matchingLogs.createdAt,
    })
    .from(matchingLogs)
    .leftJoin(users, eq(matchingLogs.userId, users.id))
    .where(where)
    .orderBy(desc(matchingLogs.createdAt))
    .limit(limit)
    .offset(offset);

  logger.info({ total, page, limit, userId, batchId, level }, "Admin: Listed matching logs");

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================================
// EMAIL DELIVERY LOGS
// ============================================================================

export async function listEmailDeliveryLogs(query: EmailDeliveryLogsQuery) {
  const { page, limit, userId, status } = query;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (userId) {
    conditions.push(eq(emailDeliveryLogs.userId, userId));
  }
  if (status) {
    conditions.push(eq(emailDeliveryLogs.status, status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emailDeliveryLogs)
    .where(where);
  const total = countResult[0]?.count ?? 0;

  // Get logs with user info
  const logs = await db
    .select({
      id: emailDeliveryLogs.id,
      notificationId: emailDeliveryLogs.notificationId,
      userId: emailDeliveryLogs.userId,
      userEmail: users.email,
      emailTo: emailDeliveryLogs.emailTo,
      subject: emailDeliveryLogs.subject,
      status: emailDeliveryLogs.status,
      provider: emailDeliveryLogs.provider,
      providerMessageId: emailDeliveryLogs.providerMessageId,
      errorMessage: emailDeliveryLogs.errorMessage,
      sentAt: emailDeliveryLogs.sentAt,
      createdAt: emailDeliveryLogs.createdAt,
    })
    .from(emailDeliveryLogs)
    .leftJoin(users, eq(emailDeliveryLogs.userId, users.id))
    .where(where)
    .orderBy(desc(emailDeliveryLogs.createdAt))
    .limit(limit)
    .offset(offset);

  logger.info({ total, page, limit, userId, status }, "Admin: Listed email delivery logs");

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================================
// TASK QUEUE
// ============================================================================

export async function listTaskQueue(query: TaskQueueQuery) {
  const { page, limit, type, status } = query;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (type) {
    conditions.push(eq(taskQueue.type, type));
  }
  if (status) {
    conditions.push(eq(taskQueue.status, status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(taskQueue)
    .where(where);
  const total = countResult[0]?.count ?? 0;

  // Get tasks
  const tasks = await db
    .select()
    .from(taskQueue)
    .where(where)
    .orderBy(desc(taskQueue.createdAt))
    .limit(limit)
    .offset(offset);

  logger.info({ total, page, limit, type, status }, "Admin: Listed task queue");

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function getDashboardStats() {
  // Total users
  const totalUsersResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);
  const totalUsers = totalUsersResult[0]?.count ?? 0;

  // Active users (verified email and is_active)
  const activeUsersResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.emailVerified, "verified"), eq(users.isActive, true)));
  const activeUsers = activeUsersResult[0]?.count ?? 0;

  // Total subscriptions by status
  const subscriptionStatsResult = await db
    .select({
      status: userSubscriptions.status,
      count: sql<number>`count(*)::int`,
    })
    .from(userSubscriptions)
    .groupBy(userSubscriptions.status);

  const subscriptionStats = subscriptionStatsResult.reduce((acc, row) => {
    acc[row.status] = row.count;
    return acc;
  }, {} as Record<string, number>);

  // Total jobs in database
  const totalJobsResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(jobs)
    .where(eq(jobs.isActive, true));
  const totalJobs = totalJobsResult[0]?.count ?? 0;

  // Failed tasks in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const failedTasksResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(taskQueue)
    .where(
      and(
        eq(taskQueue.status, "failed"),
        sql`${taskQueue.createdAt} > ${oneDayAgo.toISOString()}`
      )
    );
  const failedTasksLast24h = failedTasksResult[0]?.count ?? 0;

  // Recent job fetch success rate (last 10 fetches)
  const recentFetches = await db
    .select({
      status: jobFetchLogs.status,
    })
    .from(jobFetchLogs)
    .orderBy(desc(jobFetchLogs.startedAt))
    .limit(10);

  const successCount = recentFetches.filter((f) => f.status === "completed").length;
  const jobFetchSuccessRate = recentFetches.length > 0
    ? Math.round((successCount / recentFetches.length) * 100)
    : 0;

  // Total match batches
  const totalMatchBatchesResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matchBatches);
  const totalMatchBatches = totalMatchBatchesResult[0]?.count ?? 0;

  logger.info("Admin: Fetched dashboard stats");

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
    },
    subscriptions: subscriptionStats,
    jobs: {
      total: totalJobs,
    },
    tasks: {
      failedLast24h: failedTasksLast24h,
    },
    jobFetch: {
      successRate: jobFetchSuccessRate,
    },
    matching: {
      totalBatches: totalMatchBatches,
    },
  };
}
