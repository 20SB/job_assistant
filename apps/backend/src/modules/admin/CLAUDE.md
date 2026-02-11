# Admin & Observability Module (HLD §14)

## Purpose

Internal admin endpoints for monitoring platform health, managing users, and viewing system logs. All endpoints require admin role authentication.

## Endpoints

| Method | Path                          | Description                                    | Auth      |
|--------|-------------------------------|------------------------------------------------|-----------|
| GET    | `/api/admin/stats`            | Dashboard overview stats                       | Admin     |
| GET    | `/api/admin/users`            | List users with subscription info              | Admin     |
| GET    | `/api/admin/users/:id`        | Get detailed user info                         | Admin     |
| GET    | `/api/admin/job-fetch-logs`   | View job fetch operation logs                  | Admin     |
| GET    | `/api/admin/matching-logs`    | View matching operation logs                   | Admin     |
| GET    | `/api/admin/email-delivery-logs` | View email delivery logs                    | Admin     |
| GET    | `/api/admin/tasks`            | View task queue (with failed task filtering)   | Admin     |

## Schema Tables Used

- **users** — User management and role checking
- **userSubscriptions** — Subscription status for each user
- **subscriptionPlans** — Plan details
- **jobFetchLogs** — Logs from job-fetch worker
- **matchingLogs** — Logs from matching worker
- **emailDeliveryLogs** — Logs from email-delivery worker
- **taskQueue** — Async task queue entries
- **jobs** — Total job count
- **matchBatches** — Total match batches count

## Middleware

### requireAdmin

- Location: `middleware/require-admin.ts`
- Checks if authenticated user has `role === "admin"`
- Must be used AFTER `authenticate` middleware
- Returns 403 Forbidden if not admin

## Query Parameters (All List Endpoints)

All list endpoints support pagination:
- `page` (default: 1)
- `limit` (default: 20, max: 100)

### Users List (`/api/admin/users`)
- `search` — Filter by email (case-insensitive partial match)
- `role` — Filter by role (user | admin)
- `emailVerified` — Filter by verification status (pending | verified)
- `isActive` — Filter by active status (boolean)

### Job Fetch Logs (`/api/admin/job-fetch-logs`)
- `status` — Filter by task status (pending | in_progress | completed | failed | retrying)
- `source` — Filter by job source (adzuna)

### Matching Logs (`/api/admin/matching-logs`)
- `userId` — Filter by user ID (UUID)
- `batchId` — Filter by batch ID (UUID)
- `level` — Filter by log level (info | warn | error)

### Email Delivery Logs (`/api/admin/email-delivery-logs`)
- `userId` — Filter by user ID (UUID)
- `status` — Filter by delivery status

### Task Queue (`/api/admin/tasks`)
- `type` — Filter by task type (job_fetch | matching | csv_generation | email_delivery)
- `status` — Filter by task status (pending | in_progress | completed | failed | retrying)

## Dashboard Stats Response

```json
{
  "users": {
    "total": 150,
    "active": 120
  },
  "subscriptions": {
    "active": 80,
    "past_due": 5,
    "cancelled": 10,
    "expired": 3,
    "trialing": 2
  },
  "jobs": {
    "total": 5000
  },
  "tasks": {
    "failedLast24h": 3
  },
  "jobFetch": {
    "successRate": 90
  },
  "matching": {
    "totalBatches": 250
  }
}
```

## Design Decisions

### 1. Role-Based Access Control
- Only users with `role: "admin"` can access admin endpoints
- Separate middleware (`requireAdmin`) for reusability
- Fails with 403 Forbidden if non-admin attempts access

### 2. Log Tables Are Read-Only
- Admin endpoints only READ from log tables
- Log entries are created by workers (job-fetch, matching, email-delivery)
- No DELETE or UPDATE operations exposed

### 3. Pagination Required
- All list endpoints return paginated results
- Default limit: 20, max limit: 100
- Prevents loading excessive data in single request

### 4. Query Validation
- All query parameters validated via Zod schemas
- Invalid params return 400 Bad Request with clear error messages
- Coercion used for numeric/boolean params (page, limit, isActive)

### 5. Dashboard Stats Use Aggregations
- Stats computed via SQL aggregations (count, group by)
- No large data transfers — only summary numbers returned
- Success rate calculated from last 10 job fetches (lightweight)

### 6. User Details Includes Related Data
- Uses Drizzle's `with` clause for eager loading
- Returns user + active CV + active subscription + preferences + notification preferences
- Single query via join — efficient

### 7. Failed Task Monitoring
- Task queue endpoint supports filtering by `status: "failed"`
- Dashboard shows failed tasks in last 24 hours
- Enables quick identification of system issues

## Flows

### Admin Views Dashboard
1. Admin logs in (receives JWT with `role: "admin"`)
2. Frontend calls `GET /api/admin/stats`
3. Middleware verifies JWT + admin role
4. Service aggregates stats from multiple tables
5. Returns summary object with counts and rates

### Admin Views Failed Tasks
1. Admin calls `GET /api/admin/tasks?status=failed&page=1&limit=20`
2. Middleware validates query params + admin role
3. Service filters task_queue table for failed tasks
4. Returns paginated list with task details (payload, error, attempts)

### Admin Searches User
1. Admin calls `GET /api/admin/users?search=john@example.com`
2. Service performs case-insensitive LIKE query on email
3. Joins userSubscriptions + subscriptionPlans
4. Returns user list with subscription status

### Admin Views Job Fetch Health
1. Admin calls `GET /api/admin/job-fetch-logs?status=failed`
2. Service filters jobFetchLogs by status
3. Returns logs with error messages and duration
4. Admin can diagnose API issues or network problems

## Testing Notes

- To test admin endpoints, create a user with `role: "admin"` in the database
- Or update existing user: `UPDATE users SET role = 'admin' WHERE email = 'your@email.com'`
- Use admin JWT token in Authorization header
- Non-admin requests will receive 403 Forbidden

## Future Enhancements

- Add user deactivation/reactivation endpoint
- Add subscription management (force cancel, upgrade)
- Add manual task retry endpoint
- Add data export (CSV/JSON) for logs
- Add real-time dashboard with WebSocket updates
- Add alerting system (email/Slack when tasks fail)
