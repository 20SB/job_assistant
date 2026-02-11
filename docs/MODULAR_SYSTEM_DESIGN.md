# Job Assistant — Modular System Design

A comprehensive feature-by-feature breakdown of the AI-powered job matching platform.

---

## Platform Summary

| Dimension | Detail |
|-----------|--------|
| **What** | SaaS platform that auto-matches jobs to users based on CV + preferences |
| **How** | Fetches jobs from Adzuna API, scores them across 5 dimensions, delivers results via CSV + email |
| **Stack** | Next.js 16 + Express 5 + PostgreSQL (Supabase) + Drizzle ORM |
| **Scale** | 10 backend modules, 14 frontend routes, 18 DB tables, 60+ API endpoints |
| **Tests** | 432 unit tests + 108 integration tests + 118 E2E tests = **658 total** |

---

## Module Map

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                            │
│  Landing │ Auth │ Dashboard │ CV │ Preferences │ Subscription │ Jobs    │
│  Exports │ Notifications │ Admin │ Settings │ Onboarding               │
├──────────────────────────────────────────────────────────────────────────┤
│                       API CLIENT LAYER (fetchApi)                       │
├──────────────────────────────────────────────────────────────────────────┤
│                    MIDDLEWARE (auth → validate → gate)                   │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────────┤
│Users │  CV  │Prefs │ Subs │ Jobs │Match │ CSV  │Notif │Tasks │ Admin   │
├──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴─────────┤
│                     TASK PROCESSOR (DB-polling)                          │
│         job-fetch │ matching │ csv-generation │ email-delivery           │
├──────────────────────────────────────────────────────────────────────────┤
│                    DATABASE — 18 tables (PostgreSQL)                     │
├──────────────────────────────────────────────────────────────────────────┤
│                    EXTERNAL: Adzuna API │ SMTP Server                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Authentication & User Management

**Purpose**: User registration, login, email verification, password recovery, profile management.

### User Journey
```
Sign Up → Verify Email → Login → Get JWT → Access Protected Routes
```

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/users/signup` | - | Register with email + password; triggers verification email |
| POST | `/api/users/login` | - | Returns JWT token + user profile |
| POST | `/api/users/verify-email` | - | Confirm email with token from email link |
| POST | `/api/users/forgot-password` | - | Send password reset email (always returns 200) |
| POST | `/api/users/reset-password` | - | Set new password with reset token |
| GET | `/api/users/me` | Yes | Get authenticated user's profile |
| PATCH | `/api/users/me` | Yes | Update email or password |

### Database Tables

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `users` | id, email (unique), password, role (user/admin), emailVerified, isActive, lastLoginAt | Root entity; everything references userId |
| `emailVerificationTokens` | userId, token (unique), expiresAt, usedAt | One-time use, expires |
| `passwordResetTokens` | userId, token (unique), expiresAt, usedAt | One-time use, expires |

### Security
- Passwords hashed with **bcrypt** (12 rounds production, 4 in tests)
- JWT tokens include `{ userId, email, role }`, configurable expiry (default 7d)
- Email verification required before full access
- Password reset tokens are single-use with expiration

### Frontend Pages
- `/login` — Login form with error handling
- `/signup` — Registration form with validation
- `/verify` — Email verification handler (auto-verifies from URL token)
- `/settings` — Email update + password change

---

## 2. CV Management

**Purpose**: Append-only CV versioning. Every update creates a new snapshot — old versions are never mutated. Matching always uses the latest active CV.

### Versioning Flow
```
Create CV (v1, active) → Update (v2 becomes active, v1 deactivated)
                       → Delete v2 → v1 auto-promoted to active
```

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/cv` | Yes | Create new CV (deactivates previous, increments version) |
| GET | `/api/cv/active` | Yes | Get currently active CV |
| GET | `/api/cv/versions` | Yes | List all versions (summary, no raw text) |
| GET | `/api/cv/:id` | Yes | Get specific snapshot |
| PATCH | `/api/cv` | Yes | Update = merge with active + create new snapshot |
| DELETE | `/api/cv/:id` | Yes | Delete snapshot; promotes latest if active was deleted |

### Database Table

**`cvSnapshots`**
| Column | Type | Notes |
|--------|------|-------|
| id, userId, version | uuid, uuid, int | Version monotonically increases per user |
| isActive | boolean | Only one active per user |
| rawCvText | text | Required — the actual CV content |
| inputMethod | enum | text / form / pdf |
| parsedSkills, parsedRoles, parsedTools | text[] | Extracted arrays for matching |
| experienceYears | numeric | Stored as string, converted on read |
| seniority | enum | intern → junior → mid → senior → lead → principal → executive |
| parsedData | jsonb | Additional parsed metadata |

### Design Decisions
- **Append-only**: Snapshots are immutable once created — enables audit trail
- **One active per user**: Enforced by deactivating previous on create
- **Version numbers**: Never reused (monotonically increasing per user)
- **Lightweight listing**: `listVersions` returns summary projection (excludes rawCvText, parsedData)

### Frontend Page
- `/cv` — View active CV (meta cards, skill/role badges), edit/create, version history panel

---

## 3. Job Preferences

**Purpose**: Stores user's matching criteria. One-to-one with user. These preferences affect matching eligibility (which jobs score high), not job fetching.

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/preferences` | Yes | Create preferences (409 if already exists) |
| GET | `/api/preferences` | Yes | Get user's preferences |
| PATCH | `/api/preferences` | Yes | Sparse update (only sent fields change) |
| DELETE | `/api/preferences` | Yes | Delete preferences |

### Database Table

**`jobPreferences`** (unique on userId)
| Column | Type | Required | Default |
|--------|------|:--------:|---------|
| preferredRoles | text[] | Yes | — |
| locations | text[] | Yes | — |
| remotePreference | boolean | No | false |
| min/maxExperienceYears | numeric | No | — |
| currentSalary | numeric | No | — |
| expectedSalaryMin/Max | numeric | No | — |
| salaryCurrency | varchar(3) | No | INR |
| companySize | enum | No | — |
| employmentType | enum | No | full_time |
| excludedKeywords | text[] | No | — |
| blacklistedCompanies | text[] | No | — |
| minimumMatchPercentage | int | No | 50 |

### Design Decisions
- **One-to-one**: POST returns 409 Conflict if exists, guiding to PATCH
- **Sparse PATCH**: Only fields present in body are updated; omitted fields remain unchanged
- **No :id routes**: Uses authenticated userId to locate the record

### Frontend Page
- `/preferences` — View mode with cards + full edit form (roles, locations, salary, experience, filters)

---

## 4. Pricing & Subscriptions

**Purpose**: Plan management, subscription lifecycle, payment tracking. Feature gating via middleware controls access to premium features (CSV export, etc).

### Plans

| Plan | Rank | Key Limits |
|------|:----:|------------|
| Free | 0 | Basic access, no CSV export |
| Starter | 1 | CSV export, standard matching |
| Pro | 2 | Faster matching, more exports |
| Power User | 3 | All features, highest limits |

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/subscriptions/plans` | - | List all plans (public) |
| GET | `/api/subscriptions/plans/:id` | - | Get plan details |
| POST | `/api/subscriptions/subscribe` | Yes | Subscribe to a plan |
| GET | `/api/subscriptions/me` | Yes | Get active subscription |
| POST | `/api/subscriptions/cancel` | Yes | Cancel subscription |
| GET | `/api/subscriptions/payments` | Yes | List payment history |

### Database Tables

| Table | Key Columns |
|-------|-------------|
| `subscriptionPlans` | name (unique), displayName, priceMonthly/Yearly, matchFrequencyHours, jobFetchIntervalHours, csvFrequencyHours, emailLimitDaily, features (jsonb) |
| `userSubscriptions` | userId, planId, status (active/past_due/cancelled/expired/trialing), currentPeriodStart/End, cancelledAt |
| `payments` | userId, subscriptionId, amount, currency, status (pending/authorized/captured/failed/refunded), razorpayPaymentId |

### Feature Gating Middleware
```
requireSubscription("starter") → checks user has active plan at rank >= starter
```
- Used on `/api/csv/*` routes
- Fetches user's active subscription + plan, compares rank
- Returns 403 Forbidden if below threshold

### Frontend Page
- `/subscription` — Current plan card, plan grid for changing, cancel flow, payment history table

---

## 5. Job Ingestion

**Purpose**: Fetches jobs from Adzuna API, deduplicates, stores in database. Jobs are global (not per-user) — fetched once, matched against all users.

### Flow
```
Trigger (manual/scheduled) → Adzuna API call → Parse response →
Deduplicate by externalJobId → Store new jobs → Log fetch results
```

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/jobs` | Yes | List/search jobs (pagination, filters: search, location, company, remote, category) |
| GET | `/api/jobs/:id` | Yes | Get full job details |
| GET | `/api/jobs/fetch-logs` | Yes | View fetch operation history |
| POST | `/api/jobs/fetch` | Yes | Manually trigger Adzuna fetch (enqueues task, returns 202) |

### Database Tables

| Table | Key Columns |
|-------|-------------|
| `jobs` | externalJobId (unique), source, title, company, description, salaryMin/Max, location, isRemote, category, contractType, applyUrl, postedDate, expiryDate, rawData (jsonb) |
| `jobFetchLogs` | source, searchParams (jsonb), totalFetched, totalNew, totalDuplicates, status, durationMs |

### Adzuna Integration
- Configurable via env: `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `ADZUNA_COUNTRY`
- Parameterized by roles, locations, experience
- Deduplication via unique constraint on `externalJobId`
- Gracefully handles missing API keys (returns empty results)

### Frontend Page
- `/jobs` — Job cards with match %, filters (score, shortlisted), pagination, expandable details with score breakdown

---

## 6. Job Matching Engine

**Purpose**: The core business logic. Scores every job against each user's CV + preferences across 5 weighted dimensions. Results are persisted (not computed on-the-fly).

### Matching Dimensions

| # | Dimension | What It Measures | Weight |
|---|-----------|------------------|--------|
| 1 | **Skill Overlap** | CV parsedSkills ∩ job description keywords | High |
| 2 | **Role Match** | CV parsedRoles vs job title/category | High |
| 3 | **Experience Alignment** | CV experienceYears vs job requirements | Medium |
| 4 | **Salary Compatibility** | User expectedSalary range vs job salaryMin/Max | Medium |
| 5 | **Location Match** | User locations/remotePreference vs job location/isRemote | Medium |

### Output Per Match
```typescript
{
  matchPercentage: 85,         // 0-100 composite score
  matchedSkills: ["React", "TypeScript"],
  missingSkills: ["Kubernetes"],
  scoreBreakdown: {            // Individual dimension scores
    skillOverlap: 90,
    roleMatch: 95,
    locationMatch: 100,
    salaryCompat: 70,
    experienceAlign: 80
  },
  recommendationReason: "Strong skill match with salary alignment"
}
```

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/matching/run` | Yes | Trigger matching (enqueues task, returns 202) |
| GET | `/api/matching/batches` | Yes | List user's match batches |
| GET | `/api/matching/batches/:id` | Yes | Get batch details with all matches |
| GET | `/api/matching/results` | Yes | Paginated results (filters: minPercentage, shortlistedOnly) |
| PATCH | `/api/matching/:id/shortlist` | Yes | Toggle shortlist on a match |
| PATCH | `/api/matching/:id/viewed` | Yes | Mark match as viewed |

### Database Tables

| Table | Key Columns |
|-------|-------------|
| `matchBatches` | userId, cvSnapshotId, trigger (new_job/cv_updated/preferences_updated/scheduled), totalJobsEvaluated, totalMatches, status |
| `jobMatches` | batchId, userId, jobId (unique per batch+job), matchPercentage, matchedSkills[], missingSkills[], scoreBreakdown (jsonb), isShortlisted, isViewed |
| `matchingLogs` | batchId, userId, message, level, metadata (jsonb) |

### Matching Triggers
- Manual (user clicks "Run Matching" on dashboard)
- Scheduled (periodic cron job)
- CV updated / Preferences updated (future)

### Frontend Page
- `/jobs` — Paginated match cards, expandable score breakdown, shortlist toggle, mark viewed, filter by min% and shortlisted-only

---

## 7. Async Processing & Task Queue

**Purpose**: Heavy operations (job fetch, matching, CSV generation, email delivery) run asynchronously via a DB-polling task processor. Controllers enqueue tasks and return 202 immediately.

### Architecture
```
Controller → enqueue(type, payload) → taskQueue table
                                          ↓
TaskProcessor (polls every 5s) → claim task (FOR UPDATE SKIP LOCKED)
                                          ↓
                              Route to worker by type
                                          ↓
                           Success → completed │ Failure → retry/failed
```

### Task Types & Workers

| Task Type | Worker | Payload | What It Does |
|-----------|--------|---------|--------------|
| `job_fetch` | job-fetch-worker | roles[], locations[], maxPages | Calls Adzuna API, deduplicates, stores jobs |
| `matching` | matching-worker | userId, trigger | Scores all active jobs against user's CV + preferences |
| `csv_generation` | csv-generation-worker | userId, batchId, sendEmail | Builds CSV from match results, optionally emails |
| `email_delivery` | email-delivery-worker | to, subject, html, attachments | Sends email via Nodemailer |

### Reliability Features
- **Atomic claiming**: `FOR UPDATE SKIP LOCKED` prevents double-processing
- **Retry with backoff**: `5000ms x 2^(attempt-1)` — 5s, 10s, 20s...
- **Max attempts**: Configurable per task (default 3)
- **Stale lock recovery**: Tasks stuck `in_progress` > 5 min reset to `retrying`
- **Priority support**: Tasks can be prioritized

### Database Table

**`taskQueue`**
| Column | Type | Notes |
|--------|------|-------|
| type | enum | job_fetch / matching / csv_generation / email_delivery |
| status | enum | pending / in_progress / completed / failed / retrying |
| payload | jsonb | Task-specific input |
| result | jsonb | Task-specific output (on completion) |
| priority | int | Higher = processed first |
| attempts / maxAttempts | int | Retry tracking |
| lastError | text | Last failure message |
| lockedBy / lockedAt | text / timestamp | Concurrency control |
| scheduledFor | timestamp | Delayed execution support |

### API Endpoints (User-facing)

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/tasks` | Yes | List user's tasks (filter by type/status) |
| GET | `/api/tasks/:id` | Yes | Get task status + result |

### Async Endpoints (Return 202)
- `POST /api/jobs/fetch` → enqueues `job_fetch`
- `POST /api/matching/run` → enqueues `matching`
- `POST /api/csv/generate` → enqueues `csv_generation`

---

## 8. CSV Generation & Export

**Purpose**: Generate downloadable CSV files from match results. CSV is built in-memory (no filesystem), optionally emailed as attachment. Gated behind starter+ subscription.

### Flow
```
User selects match batch → POST /api/csv/generate (202) →
csv-generation worker → build CSV in memory → store metadata in DB →
optionally email with attachment → user downloads via GET /api/csv/download/:id
```

### CSV Columns
```
Job Title | Company | Location | Salary | Match % | Matched Skills | Missing Skills | Apply URL
```

### API Endpoints

| Method | Path | Auth | Subscription | Description |
|--------|------|:----:|:------------:|-------------|
| POST | `/api/csv/generate` | Yes | Starter+ | Generate CSV from batch (enqueues task) |
| GET | `/api/csv/exports` | Yes | Starter+ | List user's exports |
| GET | `/api/csv/download/:id` | Yes | Starter+ | Download CSV (regenerated from DB) |
| PATCH | `/api/csv/:id/archive` | Yes | Starter+ | Soft-delete (archive) export |

### Database Table

**`csvExports`**
| Column | Type | Notes |
|--------|------|-------|
| userId, batchId | uuid | Links to user and match batch |
| fileName, filePath | text | Metadata |
| fileSize, totalRows | int | Export stats |
| isArchived | boolean | Soft delete |
| expiresAt | timestamp | Auto-cleanup |

### Design Decisions
- **In-memory generation**: No filesystem needed — CSV rebuilt from DB on download
- **Subscription gated**: `requireSubscription("starter")` middleware on all routes
- **Archivable**: Soft delete instead of hard delete

### Frontend Page
- `/exports` — Export list, generate from batch, download, archive, pagination

---

## 9. Notification System

**Purpose**: Manages notification preferences (opt-in/out) and delivers notifications via email. Other modules call the `notify()` function to trigger notifications. Full email delivery audit trail.

### `notify()` Internal API
```typescript
// Used by matching, subscriptions, etc.
await notify(userId, "match_batch", {
  subject: "New Matches Found",
  html: "<h1>...</h1>",
  metadata: { batchId, totalMatches },
  attachments: [{ filename: "matches.csv", content: csvBuffer }]
});
```

### notify() Flow
```
1. Fetch user email from users table
2. Check notificationPreferences for opt-in
3. Insert notification record (emailStatus: pending)
4. Attempt email via sendEmail()
5. Update notification status (sent/failed)
6. Insert emailDeliveryLogs record
```

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/notifications/preferences` | Yes | Create preferences (409 if exists) |
| GET | `/api/notifications/preferences` | Yes | Get user's preferences |
| PATCH | `/api/notifications/preferences` | Yes | Update preferences (sparse merge) |
| DELETE | `/api/notifications/preferences` | Yes | Delete preferences |
| GET | `/api/notifications` | Yes | List notifications (paginated, type filter) |
| GET | `/api/notifications/:id` | Yes | Get single notification |

### Database Tables

| Table | Key Columns |
|-------|-------------|
| `notificationPreferences` | userId (unique), matchEmailFrequency (hourly/daily/weekly), subscriptionEmails, paymentEmails, marketingEmails |
| `notifications` | userId, type, subject, body, emailTo, emailStatus (pending/sent/failed), emailSentAt, emailError, batchId, csvExportId |
| `emailDeliveryLogs` | notificationId, userId, emailTo, subject, status, provider, errorMessage, sentAt |

### Notification Types
| Type | Trigger | Module |
|------|---------|--------|
| `match_batch` | Matching batch completes | matching.service |
| `subscription_renewal` | User subscribes | subscriptions.service |
| `payment_failure` | Payment fails | subscriptions.service |
| `welcome` | User signs up | users.service |
| `password_reset` | Password reset requested | users.service |

### Frontend Page
- `/notifications` — Preference management (frequency, toggle switches), notification history with type filters

---

## 10. Admin & Observability

**Purpose**: Admin-only dashboard for platform monitoring. View users, fetch/matching/email logs, task queue health, and aggregate stats. All endpoints require admin role.

### API Endpoints

| Method | Path | Auth | Admin | Description |
|--------|------|:----:|:-----:|-------------|
| GET | `/api/admin/stats` | Yes | Yes | Dashboard stats (user counts, subscription distribution, job counts, task health) |
| GET | `/api/admin/users` | Yes | Yes | Paginated user list (search, role, emailVerified, isActive filters) |
| GET | `/api/admin/users/:id` | Yes | Yes | User details + subscriptions + CV + preferences |
| GET | `/api/admin/job-fetch-logs` | Yes | Yes | Job fetch operation logs (status, source filters) |
| GET | `/api/admin/matching-logs` | Yes | Yes | Matching operation logs (userId, batchId, level filters) |
| GET | `/api/admin/email-delivery-logs` | Yes | Yes | Email delivery logs (userId, status filters) |
| GET | `/api/admin/tasks` | Yes | Yes | Task queue (type, status filters) |

### Dashboard Stats
```typescript
{
  users: { total, verified, activeThisMonth },
  subscriptions: { byPlan: { free: 50, starter: 30, pro: 15, power_user: 5 } },
  jobs: { total, activeJobs, recentFetches },
  tasks: { pending, inProgress, failed, latestCompleted },
  matching: { totalBatches, totalMatches },
  emails: { sent, failed }
}
```

### Frontend Page
- `/admin` — 6-tab dashboard: Overview (stat cards), Users (table + search), Job Fetch Logs, Matching Logs, Email Logs, Task Queue

---

## Cross-Cutting Infrastructure

### Middleware Chain
```
Request → express.json() → cors → [route-specific middleware] → controller → errorHandler
```

| Middleware | Function | Used By |
|-----------|----------|---------|
| `authenticate` | Verify JWT, set `req.user` | All protected routes |
| `validate(schema, target)` | Zod validation for body/query/params | Routes with input |
| `requireSubscription(plan)` | Check active subscription rank | CSV routes |
| `requireAdmin` | Check `req.user.role === "admin"` | Admin routes |
| `errorHandler` | Catch all errors, format response | Global (last middleware) |

### Error Handling
```typescript
// Services throw typed errors:
throw NotFound("CV not found");        // → 404
throw BadRequest("Invalid token");     // → 400
throw Unauthorized("Invalid creds");   // → 401
throw Conflict("Email taken");         // → 409
throw Forbidden("Not allowed");        // → 403

// Error handler catches all:
AppError    → { status: "error", message } + correct HTTP status
Unknown     → { status: "error", message: "Internal server error" } + 500
```

### Response Format
```typescript
// Success
{ status: "success", data: { ... } }

// Error
{ status: "error", message: "Human-readable error" }

// Paginated
{ status: "success", data: { items: [...], pagination: { page, limit, total, totalPages } } }

// Async (202)
{ status: "success", data: { taskId: "uuid", message: "Task enqueued" } }
```

---

## Frontend Architecture

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| UI | React 19.2.3 + Tailwind CSS 4 + shadcn-style components |
| Forms | React Hook Form 7 + Zod 4 |
| State | React Context (AuthContext) |
| API | Custom fetchApi wrapper with auto JWT injection |
| Icons | Lucide React |

### Route Map (14 routes)

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page (hero, how-it-works, pricing, FAQ) |
| `/login` | Public | Login form |
| `/signup` | Public | Registration form |
| `/verify` | Public | Email verification handler |
| `/dashboard` | Auth | Stats, setup checklist, recent matches, quick actions |
| `/onboarding` | Auth | 3-step wizard (CV → Preferences → Subscription) |
| `/cv` | Auth | CV view, edit, version history |
| `/preferences` | Auth | Preferences view + edit form |
| `/subscription` | Auth | Current plan, change, cancel, payments |
| `/jobs` | Auth | Match results with filters, shortlist, score breakdown |
| `/exports` | Auth | CSV exports (generate, download, archive) |
| `/notifications` | Auth | Notification preferences + history |
| `/admin` | Admin | Platform monitoring (6 tabs) |
| `/settings` | Auth | Account email + password management |

### Route Protection
- `middleware.ts` — Server-side redirect: unauthenticated users → `/login`, authenticated on auth pages → `/dashboard`
- Auth token stored in localStorage + synced to cookie for middleware access

---

## Database Schema Overview

### 18 Tables, 14 Enums

```
USERS DOMAIN                    JOB DOMAIN                  SYSTEM DOMAIN
├── users                       ├── jobs                    ├── taskQueue
├── emailVerificationTokens     ├── jobFetchLogs            ├── matchingLogs
├── passwordResetTokens         ├── matchBatches            └── emailDeliveryLogs
├── cvSnapshots                 └── jobMatches
├── jobPreferences
├── subscriptionPlans           NOTIFICATION DOMAIN
├── userSubscriptions           ├── notifications
├── payments                    ├── notificationPreferences
└── csvExports
```

### Key Relationships
```
users ──1:N──→ cvSnapshots
users ──1:1──→ jobPreferences
users ──1:N──→ userSubscriptions ──N:1──→ subscriptionPlans
users ──1:N──→ payments
users ──1:N──→ matchBatches ──1:N──→ jobMatches ──N:1──→ jobs
users ──1:N──→ csvExports
users ──1:1──→ notificationPreferences
users ──1:N──→ notifications ──1:N──→ emailDeliveryLogs
```

---

## Test Coverage

### Summary

| Suite | Framework | Tests | What It Covers |
|-------|-----------|------:|----------------|
| Backend Unit | Vitest | 324 | Services, controllers, middleware, lib utilities, workers |
| Backend Integration | Supertest + Vitest | 108 | Full HTTP request through Express middleware chain |
| Frontend E2E | Playwright | 118 | All 14 pages, user flows, responsive layout |
| **Total** | | **550** | |

### Backend Unit Tests (324)
- 34 test files across all layers
- Pure unit tests — all dependencies mocked (DB, email, external APIs)
- Covers: error paths, validation, auth flows, business logic, edge cases

### Backend Integration Tests (108)
- 12 test files using supertest
- Real HTTP through Express (routing → validation → auth → controller → response)
- Mocked: DB layer only. Real: middleware chain, Zod validation, error handler
- Catches: route path typos, middleware ordering, validation schema mismatches, status codes

### Frontend E2E Tests (118)
- 16 spec files using Playwright
- API mocked via `page.route()` — no running backend needed
- Covers all pages: auth, dashboard, CV, preferences, subscription, jobs, exports, notifications, admin, settings, onboarding
- Cross-cutting: navigation, responsive layout (desktop + mobile)

---

## Key Data Flows

### 1. New User Onboarding
```
Sign Up → Verify Email → Login (JWT) →
Onboarding Wizard: Step 1 (Create CV) → Step 2 (Set Preferences) → Step 3 (Subscribe) →
Dashboard (ready to match)
```

### 2. Job Matching Cycle
```
Admin/Cron triggers Job Fetch → Adzuna API → Deduplicate → Store in jobs table
                                                                    ↓
User triggers "Run Matching" → Task enqueued → Matching Worker →
Load user CV + preferences → Score each active job (5 dimensions) →
Store matchBatches + jobMatches → Send notification email
```

### 3. CSV Export & Delivery
```
User selects match batch → POST /csv/generate (202) → Task enqueued →
CSV Worker: query matches + jobs → build CSV in memory →
Store csvExports metadata → Email CSV as attachment → User downloads
```

### 4. Notification Delivery
```
Module calls notify(userId, type, options) →
Check user email → Check opt-in preferences → Insert notification record →
Send email via SMTP → Update status (sent/failed) → Log to emailDeliveryLogs
```

---

## Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Jobs are global** | Fetched once, matched against all users — no per-user fetching |
| **Matches are persisted** | Stored in DB, not recomputed — enables history, export, filtering |
| **CV is versioned** | Append-only snapshots — never lose data, full audit trail |
| **Async for heavy work** | Job fetch, matching, CSV, email all run via task queue |
| **Feature gating** | Subscription rank middleware gates premium features |
| **Expandable notifications** | notify() function is a single integration point for all modules |
| **Modular architecture** | Each module is self-contained (routes, controller, service, schemas) |
| **Test at every level** | Unit (logic) + Integration (HTTP) + E2E (user flows) |
