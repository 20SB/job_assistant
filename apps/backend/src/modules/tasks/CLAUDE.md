# Tasks Module — HLD §11: Async Processing & Queues

## Purpose

Provides a DB-backed task queue for offloading heavy operations (job fetching, matching, CSV generation, email delivery). Tasks are enqueued by converted controllers and processed by an in-process polling worker.

## Files (4 — standard module pattern)

| File | Role |
|------|------|
| `tasks.schemas.ts` | Zod schemas for list query params |
| `tasks.service.ts` | enqueue(), getTask(), listTasks() |
| `tasks.controller.ts` | Thin handlers for GET endpoints |
| `tasks.routes.ts` | Routes behind `authenticate` |

## Related Files (outside module)

| File | Role |
|------|------|
| `lib/task-processor.ts` | Polling engine: claim → execute → update |
| `lib/workers/job-fetch.worker.ts` | Wraps `jobs.service.triggerFetch()` |
| `lib/workers/matching.worker.ts` | Wraps `matching.service.runMatching()` |
| `lib/workers/csv-generation.worker.ts` | Wraps `csv.service.generateCsv()` |
| `lib/workers/email-delivery.worker.ts` | Wraps `email.sendEmail()` |

## Schema Tables Used

- `taskQueue` — task records with status, payload, result, retry info, locking

## API Endpoints

All routes require authentication.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tasks` | List tasks (paginated, filterable by type/status) |
| GET | `/api/tasks/:id` | Get task status + result |

No POST endpoint — tasks are enqueued internally by controllers.

## Converted Endpoints (return 202 + taskId)

- `POST /api/jobs/fetch` → enqueues `job_fetch` task
- `POST /api/matching/run` → enqueues `matching` task
- `POST /api/csv/generate` → enqueues `csv_generation` task

## Task Processor Flow

1. `setInterval` polls at `WORKER_POLL_INTERVAL_MS` (default 5000ms)
2. Cleans stale locks (in_progress > 5 min with no update)
3. Atomically claims one task via `UPDATE ... RETURNING` with `FOR UPDATE SKIP LOCKED`
4. Routes to worker function based on `task.type`
5. On success: status → completed, result stored
6. On failure: if attempts < maxAttempts → retrying with exponential backoff; else → failed

## Key Design Decisions

- **DB-polling** — no external dependencies (Redis, BullMQ)
- **In-process** — worker runs alongside Express via `setInterval`
- **Atomic claiming** — `FOR UPDATE SKIP LOCKED` prevents double-processing
- **Exponential backoff** — 5s × 2^(attempt-1) for retries
- **Stale lock cleanup** — tasks stuck in_progress for >5 min are reset to retrying
