CREATE TYPE "public"."company_size" AS ENUM('startup', 'small', 'medium', 'large', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."email_verification_status" AS ENUM('pending', 'verified');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'contract', 'part_time', 'freelance', 'internship');--> statement-breakpoint
CREATE TYPE "public"."job_source" AS ENUM('adzuna');--> statement-breakpoint
CREATE TYPE "public"."match_trigger" AS ENUM('new_job', 'cv_updated', 'preferences_updated', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."notification_frequency" AS ENUM('hourly', 'daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('match_batch', 'subscription_renewal', 'payment_failure', 'welcome', 'password_reset');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'authorized', 'captured', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."seniority_level" AS ENUM('intern', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'starter', 'pro', 'power_user');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'cancelled', 'expired', 'trialing');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed', 'failed', 'retrying');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('job_fetch', 'matching', 'csv_generation', 'email_delivery');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "csv_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text,
	"file_size" integer,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cv_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"raw_cv_text" text NOT NULL,
	"input_method" text DEFAULT 'text' NOT NULL,
	"parsed_skills" text[],
	"parsed_roles" text[],
	"parsed_tools" text[],
	"experience_years" numeric(4, 1),
	"seniority" "seniority_level",
	"parsed_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_delivery_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid,
	"user_id" uuid NOT NULL,
	"email_to" text NOT NULL,
	"subject" text NOT NULL,
	"status" text NOT NULL,
	"provider" text,
	"provider_message_id" text,
	"error_message" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "job_fetch_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "job_source" NOT NULL,
	"search_params" jsonb,
	"total_fetched" integer DEFAULT 0 NOT NULL,
	"total_new" integer DEFAULT 0 NOT NULL,
	"total_duplicates" integer DEFAULT 0 NOT NULL,
	"total_failed" integer DEFAULT 0 NOT NULL,
	"status" "task_status" NOT NULL,
	"error_message" text,
	"duration_ms" integer,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"match_percentage" numeric(5, 2) NOT NULL,
	"matched_skills" text[],
	"missing_skills" text[],
	"score_breakdown" jsonb,
	"recommendation_reason" text,
	"is_shortlisted" boolean DEFAULT false NOT NULL,
	"is_viewed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"preferred_roles" text[] NOT NULL,
	"locations" text[] NOT NULL,
	"remote_preference" boolean DEFAULT false NOT NULL,
	"min_experience_years" numeric(4, 1),
	"max_experience_years" numeric(4, 1),
	"current_salary" numeric(12, 2),
	"expected_salary_min" numeric(12, 2),
	"expected_salary_max" numeric(12, 2),
	"salary_currency" varchar(3) DEFAULT 'INR',
	"company_size" "company_size",
	"employment_type" "employment_type" DEFAULT 'full_time' NOT NULL,
	"excluded_keywords" text[],
	"blacklisted_companies" text[],
	"minimum_match_percentage" integer DEFAULT 50,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_job_id" text NOT NULL,
	"source" "job_source" DEFAULT 'adzuna' NOT NULL,
	"title" text NOT NULL,
	"company" text,
	"description" text,
	"salary_min" numeric(12, 2),
	"salary_max" numeric(12, 2),
	"salary_currency" varchar(3),
	"location" text,
	"is_remote" boolean DEFAULT false NOT NULL,
	"category" text,
	"contract_type" text,
	"apply_url" text,
	"posted_date" timestamp with time zone,
	"expiry_date" timestamp with time zone,
	"raw_data" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_external_job_id_unique" UNIQUE("external_job_id")
);
--> statement-breakpoint
CREATE TABLE "match_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"cv_snapshot_id" uuid NOT NULL,
	"trigger" "match_trigger" NOT NULL,
	"total_jobs_evaluated" integer DEFAULT 0 NOT NULL,
	"total_matches" integer DEFAULT 0 NOT NULL,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matching_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"message" text NOT NULL,
	"level" text DEFAULT 'info' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"match_email_frequency" "notification_frequency" DEFAULT 'daily' NOT NULL,
	"subscription_emails" boolean DEFAULT true NOT NULL,
	"payment_emails" boolean DEFAULT true NOT NULL,
	"marketing_emails" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"subject" text NOT NULL,
	"body" text,
	"metadata" jsonb,
	"email_to" text NOT NULL,
	"email_status" text DEFAULT 'pending' NOT NULL,
	"email_sent_at" timestamp with time zone,
	"email_error" text,
	"batch_id" uuid,
	"csv_export_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"razorpay_payment_id" text,
	"razorpay_order_id" text,
	"razorpay_signature" text,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"failure_reason" text,
	"webhook_payload" jsonb,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_razorpay_payment_id_unique" UNIQUE("razorpay_payment_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" "subscription_plan" NOT NULL,
	"display_name" text NOT NULL,
	"price_monthly" numeric(10, 2) NOT NULL,
	"price_yearly" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"match_frequency_hours" integer NOT NULL,
	"job_fetch_interval_hours" integer NOT NULL,
	"csv_frequency_hours" integer NOT NULL,
	"email_limit_daily" integer NOT NULL,
	"max_cvs_stored" integer DEFAULT 1 NOT NULL,
	"features" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "task_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "task_type" NOT NULL,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb,
	"result" jsonb,
	"priority" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"locked_by" text,
	"locked_at" timestamp with time zone,
	"scheduled_for" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"razorpay_subscription_id" text,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_subscriptions_razorpay_subscription_id_unique" UNIQUE("razorpay_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"email_verified" "email_verification_status" DEFAULT 'pending' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "csv_exports" ADD CONSTRAINT "csv_exports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_exports" ADD CONSTRAINT "csv_exports_batch_id_match_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."match_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_snapshots" ADD CONSTRAINT "cv_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_delivery_logs" ADD CONSTRAINT "email_delivery_logs_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_delivery_logs" ADD CONSTRAINT "email_delivery_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_batch_id_match_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."match_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_preferences" ADD CONSTRAINT "job_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_batches" ADD CONSTRAINT "match_batches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_batches" ADD CONSTRAINT "match_batches_cv_snapshot_id_cv_snapshots_id_fk" FOREIGN KEY ("cv_snapshot_id") REFERENCES "public"."cv_snapshots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matching_logs" ADD CONSTRAINT "matching_logs_batch_id_match_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."match_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matching_logs" ADD CONSTRAINT "matching_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_batch_id_match_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."match_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_csv_export_id_csv_exports_id_fk" FOREIGN KEY ("csv_export_id") REFERENCES "public"."csv_exports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "csv_user_id_idx" ON "csv_exports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "csv_batch_id_idx" ON "csv_exports" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "csv_expires_at_idx" ON "csv_exports" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "cvs_user_id_idx" ON "cv_snapshots" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cvs_user_active_idx" ON "cv_snapshots" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "edl_user_id_idx" ON "email_delivery_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "edl_notification_id_idx" ON "email_delivery_logs" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "edl_status_idx" ON "email_delivery_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "edl_created_at_idx" ON "email_delivery_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "evt_user_id_idx" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "evt_token_idx" ON "email_verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "jfl_source_idx" ON "job_fetch_logs" USING btree ("source");--> statement-breakpoint
CREATE INDEX "jfl_status_idx" ON "job_fetch_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jfl_started_at_idx" ON "job_fetch_logs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "jm_batch_id_idx" ON "job_matches" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "jm_user_id_idx" ON "job_matches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "jm_job_id_idx" ON "job_matches" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "jm_match_percentage_idx" ON "job_matches" USING btree ("match_percentage");--> statement-breakpoint
CREATE UNIQUE INDEX "jm_batch_job_idx" ON "job_matches" USING btree ("batch_id","job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "jp_user_id_idx" ON "job_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_external_job_id_idx" ON "jobs" USING btree ("external_job_id");--> statement-breakpoint
CREATE INDEX "jobs_source_idx" ON "jobs" USING btree ("source");--> statement-breakpoint
CREATE INDEX "jobs_posted_date_idx" ON "jobs" USING btree ("posted_date");--> statement-breakpoint
CREATE INDEX "jobs_is_active_idx" ON "jobs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "jobs_location_idx" ON "jobs" USING btree ("location");--> statement-breakpoint
CREATE INDEX "jobs_company_idx" ON "jobs" USING btree ("company");--> statement-breakpoint
CREATE INDEX "mb_user_id_idx" ON "match_batches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mb_status_idx" ON "match_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mb_created_at_idx" ON "match_batches" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ml_batch_id_idx" ON "matching_logs" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "ml_user_id_idx" ON "matching_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ml_level_idx" ON "matching_logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "ml_created_at_idx" ON "matching_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "np_user_id_idx" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notif_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notif_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notif_email_status_idx" ON "notifications" USING btree ("email_status");--> statement-breakpoint
CREATE INDEX "notif_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "prt_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "prt_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "pay_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pay_subscription_id_idx" ON "payments" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "pay_razorpay_payment_id_idx" ON "payments" USING btree ("razorpay_payment_id");--> statement-breakpoint
CREATE INDEX "pay_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "sp_name_idx" ON "subscription_plans" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tq_type_status_idx" ON "task_queue" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "tq_status_scheduled_idx" ON "task_queue" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "tq_locked_by_idx" ON "task_queue" USING btree ("locked_by");--> statement-breakpoint
CREATE INDEX "us_user_id_idx" ON "user_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "us_status_idx" ON "user_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "us_razorpay_sub_id_idx" ON "user_subscriptions" USING btree ("razorpay_subscription_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");