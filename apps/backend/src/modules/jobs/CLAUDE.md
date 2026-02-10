# Jobs Module — HLD §9: Job Ingestion System

## Purpose

Fetches jobs from external APIs (Adzuna), stores them with deduplication, and exposes them for browsing. This module has **5 files** (the standard 4 + an Adzuna API client):

| File | Role |
|------|------|
| `jobs.schemas.ts` | Zod schemas for query params and fetch trigger body |
| `jobs.adzuna.ts` | Adzuna API client: fetch + map to DB shape |
| `jobs.service.ts` | Fetch orchestration, dedup, storage, listing/search |
| `jobs.controller.ts` | Thin handlers |
| `jobs.routes.ts` | Routes (authenticated browse + admin fetch trigger) |

## Schema Tables Used

- `jobs` — stored jobs with unique `externalJobId` for deduplication
- `jobFetchLogs` — log of each fetch run (counts, duration, status)

## API Endpoints

All routes require authentication.

| Method | Path                   | Auth | Description                              |
|--------|------------------------|------|------------------------------------------|
| GET    | `/api/jobs`            | Yes  | List/search jobs (paginated, filterable) |
| GET    | `/api/jobs/fetch-logs` | Yes  | View fetch run history                   |
| GET    | `/api/jobs/:id`        | Yes  | Get full job details                     |
| POST   | `/api/jobs/fetch`      | Yes  | Trigger a manual fetch from Adzuna       |

### GET /api/jobs query params

| Param    | Type   | Description          |
|----------|--------|----------------------|
| page     | number | Page number (default 1) |
| limit    | number | Items per page (1-100, default 20) |
| search   | string | Filter by title (ILIKE) |
| location | string | Filter by location (ILIKE) |
| company  | string | Filter by company (ILIKE) |
| remote   | "true"/"false" | Filter remote jobs |
| category | string | Filter by category (ILIKE) |

### POST /api/jobs/fetch body

```json
{
  "roles": ["software engineer", "data analyst"],
  "locations": ["London", "Remote"],
  "maxPages": 2
}
```

## Fetch Flow

1. For each `role × location × page` combination, call Adzuna API
2. Map each Adzuna result to our `jobs` table shape via `mapAdzunaJob()`
3. Insert with `onConflictDoNothing` on `externalJobId` — deduplication
4. Track counts: `totalFetched`, `totalNew`, `totalDuplicates`, `totalFailed`
5. Log the entire run to `jobFetchLogs` with duration and status

## Environment Variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `ADZUNA_APP_ID` | No | — | If unset, fetch returns empty (logged as warning) |
| `ADZUNA_APP_KEY` | No | — | Adzuna API key |
| `ADZUNA_BASE_URL` | No | `https://api.adzuna.com/v1/api` | API base URL |
| `ADZUNA_COUNTRY` | No | `in` | Country code for search |

## Key Design Decisions

- **Global job fetch** — jobs are fetched globally (not per-user), as per HLD
- **Deduplication** via `onConflictDoNothing` on unique `externalJobId` — idempotent re-runs
- **Adzuna client is optional** — if keys aren't configured, fetch gracefully returns empty
- **rawData** stored as JSONB — preserves the full Adzuna response for future re-parsing
- `POST /fetch` is currently behind `authenticate` only — should be restricted to admin role in production
- Listing excludes `description` and `rawData` for lighter responses; `GET /:id` returns everything

## Gotchas

- Casting `AdzunaJob` to JSONB requires double cast: `raw as unknown as Record<string, unknown>`
- Adzuna API pagination is 1-indexed (page 1, 2, 3...)
- Query params are validated with Zod `.parse(req.query)` directly in the controller (not body middleware) since they come from query string
