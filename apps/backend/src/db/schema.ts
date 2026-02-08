import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const emailVerificationStatusEnum = pgEnum("email_verification_status", [
  "pending",
  "verified",
]);

export const seniorityLevelEnum = pgEnum("seniority_level", [
  "intern",
  "junior",
  "mid",
  "senior",
  "lead",
  "principal",
  "executive",
]);

export const employmentTypeEnum = pgEnum("employment_type", [
  "full_time",
  "contract",
  "part_time",
  "freelance",
  "internship",
]);

export const companySizeEnum = pgEnum("company_size", [
  "startup",
  "small",
  "medium",
  "large",
  "enterprise",
]);

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",
  "starter",
  "pro",
  "power_user",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "cancelled",
  "expired",
  "trialing",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "authorized",
  "captured",
  "failed",
  "refunded",
]);

export const taskTypeEnum = pgEnum("task_type", [
  "job_fetch",
  "matching",
  "csv_generation",
  "email_delivery",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
  "retrying",
]);

export const matchTriggerEnum = pgEnum("match_trigger", [
  "new_job",
  "cv_updated",
  "preferences_updated",
  "scheduled",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "match_batch",
  "subscription_renewal",
  "payment_failure",
  "welcome",
  "password_reset",
]);

export const notificationFrequencyEnum = pgEnum("notification_frequency", [
  "hourly",
  "daily",
  "weekly",
]);

export const jobSourceEnum = pgEnum("job_source", ["adzuna"]);

// ============================================================================
// AUTH & USERS (HLD §5)
// ============================================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    role: userRoleEnum("role").notNull().default("user"),
    emailVerified: emailVerificationStatusEnum("email_verified")
      .notNull()
      .default("pending"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("users_email_idx").on(table.email)]
);

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("evt_user_id_idx").on(table.userId),
    uniqueIndex("evt_token_idx").on(table.token),
  ]
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("prt_user_id_idx").on(table.userId),
    uniqueIndex("prt_token_idx").on(table.token),
  ]
);

// ============================================================================
// CV MANAGEMENT (HLD §6)
// ============================================================================

export const cvSnapshots = pgTable(
  "cv_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    rawCvText: text("raw_cv_text").notNull(),
    inputMethod: text("input_method").notNull().default("text"),
    parsedSkills: text("parsed_skills").array(),
    parsedRoles: text("parsed_roles").array(),
    parsedTools: text("parsed_tools").array(),
    experienceYears: numeric("experience_years", {
      precision: 4,
      scale: 1,
    }),
    seniority: seniorityLevelEnum("seniority"),
    parsedData: jsonb("parsed_data"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("cvs_user_id_idx").on(table.userId),
    index("cvs_user_active_idx").on(table.userId, table.isActive),
  ]
);

// ============================================================================
// JOB PREFERENCES (HLD §7)
// ============================================================================

export const jobPreferences = pgTable(
  "job_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    preferredRoles: text("preferred_roles").array().notNull(),
    locations: text("locations").array().notNull(),
    remotePreference: boolean("remote_preference").notNull().default(false),
    minExperienceYears: numeric("min_experience_years", {
      precision: 4,
      scale: 1,
    }),
    maxExperienceYears: numeric("max_experience_years", {
      precision: 4,
      scale: 1,
    }),
    currentSalary: numeric("current_salary", { precision: 12, scale: 2 }),
    expectedSalaryMin: numeric("expected_salary_min", {
      precision: 12,
      scale: 2,
    }),
    expectedSalaryMax: numeric("expected_salary_max", {
      precision: 12,
      scale: 2,
    }),
    salaryCurrency: varchar("salary_currency", { length: 3 }).default("INR"),
    companySize: companySizeEnum("company_size"),
    employmentType: employmentTypeEnum("employment_type")
      .notNull()
      .default("full_time"),
    excludedKeywords: text("excluded_keywords").array(),
    blacklistedCompanies: text("blacklisted_companies").array(),
    minimumMatchPercentage: integer("minimum_match_percentage").default(50),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("jp_user_id_idx").on(table.userId)]
);

// ============================================================================
// SUBSCRIPTIONS & PAYMENTS (HLD §8)
// ============================================================================

export const subscriptionPlans = pgTable(
  "subscription_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: subscriptionPlanEnum("name").notNull().unique(),
    displayName: text("display_name").notNull(),
    priceMonthly: numeric("price_monthly", { precision: 10, scale: 2 }).notNull(),
    priceYearly: numeric("price_yearly", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    matchFrequencyHours: integer("match_frequency_hours").notNull(),
    jobFetchIntervalHours: integer("job_fetch_interval_hours").notNull(),
    csvFrequencyHours: integer("csv_frequency_hours").notNull(),
    emailLimitDaily: integer("email_limit_daily").notNull(),
    maxCvsStored: integer("max_cvs_stored").notNull().default(1),
    features: jsonb("features"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("sp_name_idx").on(table.name)]
);

export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => subscriptionPlans.id, { onDelete: "restrict" }),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    razorpaySubscriptionId: text("razorpay_subscription_id").unique(),
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
    }).notNull(),
    currentPeriodEnd: timestamp("current_period_end", {
      withTimezone: true,
    }).notNull(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("us_user_id_idx").on(table.userId),
    index("us_status_idx").on(table.status),
    index("us_razorpay_sub_id_idx").on(table.razorpaySubscriptionId),
  ]
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subscriptionId: uuid("subscription_id")
      .notNull()
      .references(() => userSubscriptions.id, { onDelete: "cascade" }),
    razorpayPaymentId: text("razorpay_payment_id").unique(),
    razorpayOrderId: text("razorpay_order_id"),
    razorpaySignature: text("razorpay_signature"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    failureReason: text("failure_reason"),
    webhookPayload: jsonb("webhook_payload"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pay_user_id_idx").on(table.userId),
    index("pay_subscription_id_idx").on(table.subscriptionId),
    index("pay_razorpay_payment_id_idx").on(table.razorpayPaymentId),
    index("pay_status_idx").on(table.status),
  ]
);

// ============================================================================
// JOB INGESTION (HLD §9)
// ============================================================================

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    externalJobId: text("external_job_id").notNull().unique(),
    source: jobSourceEnum("source").notNull().default("adzuna"),
    title: text("title").notNull(),
    company: text("company"),
    description: text("description"),
    salaryMin: numeric("salary_min", { precision: 12, scale: 2 }),
    salaryMax: numeric("salary_max", { precision: 12, scale: 2 }),
    salaryCurrency: varchar("salary_currency", { length: 3 }),
    location: text("location"),
    isRemote: boolean("is_remote").notNull().default(false),
    category: text("category"),
    contractType: text("contract_type"),
    applyUrl: text("apply_url"),
    postedDate: timestamp("posted_date", { withTimezone: true }),
    expiryDate: timestamp("expiry_date", { withTimezone: true }),
    rawData: jsonb("raw_data"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("jobs_external_job_id_idx").on(table.externalJobId),
    index("jobs_source_idx").on(table.source),
    index("jobs_posted_date_idx").on(table.postedDate),
    index("jobs_is_active_idx").on(table.isActive),
    index("jobs_location_idx").on(table.location),
    index("jobs_company_idx").on(table.company),
  ]
);

// ============================================================================
// MATCHING ENGINE (HLD §10)
// ============================================================================

export const matchBatches = pgTable(
  "match_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cvSnapshotId: uuid("cv_snapshot_id")
      .notNull()
      .references(() => cvSnapshots.id, { onDelete: "restrict" }),
    trigger: matchTriggerEnum("trigger").notNull(),
    totalJobsEvaluated: integer("total_jobs_evaluated").notNull().default(0),
    totalMatches: integer("total_matches").notNull().default(0),
    status: taskStatusEnum("status").notNull().default("pending"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("mb_user_id_idx").on(table.userId),
    index("mb_status_idx").on(table.status),
    index("mb_created_at_idx").on(table.createdAt),
  ]
);

export const jobMatches = pgTable(
  "job_matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => matchBatches.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    matchPercentage: numeric("match_percentage", {
      precision: 5,
      scale: 2,
    }).notNull(),
    matchedSkills: text("matched_skills").array(),
    missingSkills: text("missing_skills").array(),
    scoreBreakdown: jsonb("score_breakdown"),
    recommendationReason: text("recommendation_reason"),
    isShortlisted: boolean("is_shortlisted").notNull().default(false),
    isViewed: boolean("is_viewed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("jm_batch_id_idx").on(table.batchId),
    index("jm_user_id_idx").on(table.userId),
    index("jm_job_id_idx").on(table.jobId),
    index("jm_match_percentage_idx").on(table.matchPercentage),
    uniqueIndex("jm_batch_job_idx").on(table.batchId, table.jobId),
  ]
);

// ============================================================================
// ASYNC QUEUE (HLD §11)
// ============================================================================

export const taskQueue = pgTable(
  "task_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: taskTypeEnum("type").notNull(),
    status: taskStatusEnum("status").notNull().default("pending"),
    payload: jsonb("payload"),
    result: jsonb("result"),
    priority: integer("priority").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    lastError: text("last_error"),
    lockedBy: text("locked_by"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tq_type_status_idx").on(table.type, table.status),
    index("tq_status_scheduled_idx").on(table.status, table.scheduledFor),
    index("tq_locked_by_idx").on(table.lockedBy),
  ]
);

// ============================================================================
// CSV GENERATION (HLD §12)
// ============================================================================

export const csvExports = pgTable(
  "csv_exports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => matchBatches.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    filePath: text("file_path"),
    fileSize: integer("file_size"),
    totalRows: integer("total_rows").notNull().default(0),
    isArchived: boolean("is_archived").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("csv_user_id_idx").on(table.userId),
    index("csv_batch_id_idx").on(table.batchId),
    index("csv_expires_at_idx").on(table.expiresAt),
  ]
);

// ============================================================================
// NOTIFICATIONS (HLD §13)
// ============================================================================

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    subject: text("subject").notNull(),
    body: text("body"),
    metadata: jsonb("metadata"),
    emailTo: text("email_to").notNull(),
    emailStatus: text("email_status").notNull().default("pending"),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    emailError: text("email_error"),
    batchId: uuid("batch_id").references(() => matchBatches.id, {
      onDelete: "set null",
    }),
    csvExportId: uuid("csv_export_id").references(() => csvExports.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notif_user_id_idx").on(table.userId),
    index("notif_type_idx").on(table.type),
    index("notif_email_status_idx").on(table.emailStatus),
    index("notif_created_at_idx").on(table.createdAt),
  ]
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    matchEmailFrequency: notificationFrequencyEnum("match_email_frequency")
      .notNull()
      .default("daily"),
    subscriptionEmails: boolean("subscription_emails").notNull().default(true),
    paymentEmails: boolean("payment_emails").notNull().default(true),
    marketingEmails: boolean("marketing_emails").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("np_user_id_idx").on(table.userId)]
);

// ============================================================================
// ADMIN & OBSERVABILITY (HLD §14)
// ============================================================================

export const jobFetchLogs = pgTable(
  "job_fetch_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: jobSourceEnum("source").notNull(),
    searchParams: jsonb("search_params"),
    totalFetched: integer("total_fetched").notNull().default(0),
    totalNew: integer("total_new").notNull().default(0),
    totalDuplicates: integer("total_duplicates").notNull().default(0),
    totalFailed: integer("total_failed").notNull().default(0),
    status: taskStatusEnum("status").notNull(),
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("jfl_source_idx").on(table.source),
    index("jfl_status_idx").on(table.status),
    index("jfl_started_at_idx").on(table.startedAt),
  ]
);

export const matchingLogs = pgTable(
  "matching_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => matchBatches.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    level: text("level").notNull().default("info"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ml_batch_id_idx").on(table.batchId),
    index("ml_user_id_idx").on(table.userId),
    index("ml_level_idx").on(table.level),
    index("ml_created_at_idx").on(table.createdAt),
  ]
);

export const emailDeliveryLogs = pgTable(
  "email_delivery_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    notificationId: uuid("notification_id").references(
      () => notifications.id,
      { onDelete: "set null" }
    ),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emailTo: text("email_to").notNull(),
    subject: text("subject").notNull(),
    status: text("status").notNull(),
    provider: text("provider"),
    providerMessageId: text("provider_message_id"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("edl_user_id_idx").on(table.userId),
    index("edl_notification_id_idx").on(table.notificationId),
    index("edl_status_idx").on(table.status),
    index("edl_created_at_idx").on(table.createdAt),
  ]
);

// ============================================================================
// DRIZZLE RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  jobPreferences: one(jobPreferences),
  notificationPreferences: one(notificationPreferences),
  cvSnapshots: many(cvSnapshots),
  emailVerificationTokens: many(emailVerificationTokens),
  passwordResetTokens: many(passwordResetTokens),
  userSubscriptions: many(userSubscriptions),
  payments: many(payments),
  matchBatches: many(matchBatches),
  jobMatches: many(jobMatches),
  csvExports: many(csvExports),
  notifications: many(notifications),
  matchingLogs: many(matchingLogs),
  emailDeliveryLogs: many(emailDeliveryLogs),
}));

export const emailVerificationTokensRelations = relations(
  emailVerificationTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [emailVerificationTokens.userId],
      references: [users.id],
    }),
  })
);

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetTokens.userId],
      references: [users.id],
    }),
  })
);

export const cvSnapshotsRelations = relations(
  cvSnapshots,
  ({ one, many }) => ({
    user: one(users, {
      fields: [cvSnapshots.userId],
      references: [users.id],
    }),
    matchBatches: many(matchBatches),
  })
);

export const jobPreferencesRelations = relations(
  jobPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [jobPreferences.userId],
      references: [users.id],
    }),
  })
);

export const subscriptionPlansRelations = relations(
  subscriptionPlans,
  ({ many }) => ({
    userSubscriptions: many(userSubscriptions),
  })
);

export const userSubscriptionsRelations = relations(
  userSubscriptions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [userSubscriptions.userId],
      references: [users.id],
    }),
    plan: one(subscriptionPlans, {
      fields: [userSubscriptions.planId],
      references: [subscriptionPlans.id],
    }),
    payments: many(payments),
  })
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  subscription: one(userSubscriptions, {
    fields: [payments.subscriptionId],
    references: [userSubscriptions.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ many }) => ({
  jobMatches: many(jobMatches),
}));

export const matchBatchesRelations = relations(
  matchBatches,
  ({ one, many }) => ({
    user: one(users, {
      fields: [matchBatches.userId],
      references: [users.id],
    }),
    cvSnapshot: one(cvSnapshots, {
      fields: [matchBatches.cvSnapshotId],
      references: [cvSnapshots.id],
    }),
    jobMatches: many(jobMatches),
    csvExports: many(csvExports),
    notifications: many(notifications),
    matchingLogs: many(matchingLogs),
  })
);

export const jobMatchesRelations = relations(jobMatches, ({ one }) => ({
  batch: one(matchBatches, {
    fields: [jobMatches.batchId],
    references: [matchBatches.id],
  }),
  user: one(users, {
    fields: [jobMatches.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [jobMatches.jobId],
    references: [jobs.id],
  }),
}));

export const csvExportsRelations = relations(
  csvExports,
  ({ one, many }) => ({
    user: one(users, {
      fields: [csvExports.userId],
      references: [users.id],
    }),
    batch: one(matchBatches, {
      fields: [csvExports.batchId],
      references: [matchBatches.id],
    }),
    notifications: many(notifications),
  })
);

export const notificationsRelations = relations(
  notifications,
  ({ one, many }) => ({
    user: one(users, {
      fields: [notifications.userId],
      references: [users.id],
    }),
    batch: one(matchBatches, {
      fields: [notifications.batchId],
      references: [matchBatches.id],
    }),
    csvExport: one(csvExports, {
      fields: [notifications.csvExportId],
      references: [csvExports.id],
    }),
    emailDeliveryLogs: many(emailDeliveryLogs),
  })
);

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationPreferences.userId],
      references: [users.id],
    }),
  })
);

export const matchingLogsRelations = relations(matchingLogs, ({ one }) => ({
  batch: one(matchBatches, {
    fields: [matchingLogs.batchId],
    references: [matchBatches.id],
  }),
  user: one(users, {
    fields: [matchingLogs.userId],
    references: [users.id],
  }),
}));

export const emailDeliveryLogsRelations = relations(
  emailDeliveryLogs,
  ({ one }) => ({
    notification: one(notifications, {
      fields: [emailDeliveryLogs.notificationId],
      references: [notifications.id],
    }),
    user: one(users, {
      fields: [emailDeliveryLogs.userId],
      references: [users.id],
    }),
  })
);
