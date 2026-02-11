# Notifications Module — HLD §13: Notification System

## Purpose

Manages notification preferences (per-user opt-in/out) and notification delivery. Creates notification records, sends emails via Nodemailer, and logs delivery results. Other modules call the exported `notify()` function to trigger notifications.

## Files (4 — standard module pattern)

| File | Role |
|------|------|
| `notifications.schemas.ts` | Zod schemas for preferences CRUD + notification listing |
| `notifications.service.ts` | Preferences CRUD, notification listing, core `notify()` function |
| `notifications.controller.ts` | Thin handlers |
| `notifications.routes.ts` | All routes behind `authenticate` |

## Schema Tables Used

- `notificationPreferences` — one-to-one with user (frequency, opt-in flags)
- `notifications` — notification records with email status tracking
- `emailDeliveryLogs` — audit trail of every email send attempt

Also reads from: `users` (for email address)

## API Endpoints

All routes require authentication.

| Method | Path                              | Description                                |
|--------|-----------------------------------|--------------------------------------------|
| POST   | `/api/notifications/preferences`  | Create notification preferences (409 if exists) |
| GET    | `/api/notifications/preferences`  | Get user's preferences                     |
| PATCH  | `/api/notifications/preferences`  | Update preferences (sparse merge)          |
| DELETE | `/api/notifications/preferences`  | Delete preferences                         |
| GET    | `/api/notifications/`             | List notifications (paginated, type filter) |
| GET    | `/api/notifications/:id`          | Get single notification                    |

## `notify()` Function (Internal API)

Used by other modules to trigger notifications:

```typescript
import { notify } from "../notifications/notifications.service.js";

await notify(userId, "match_batch", {
  subject: "New Matches Found",
  html: "<h1>...</h1>",
  metadata: { batchId, totalMatches },
  batchId: batch.id,
});
```

### Flow
1. Fetch user email from `users` table
2. Check `notificationPreferences` for opt-in (subscription/payment types)
3. Insert `notifications` record with `emailStatus: "pending"`
4. Attempt email via `sendEmail()`
5. Update notification status to `sent` or `failed`
6. Insert `emailDeliveryLogs` record

### Integrated Triggers

| Module | Event | Type |
|--------|-------|------|
| `matching.service.ts` | Batch completes | `match_batch` |
| `subscriptions.service.ts` | User subscribes | `subscription_renewal` |

Both use fire-and-forget (`.catch()`) to avoid blocking the response.

## Notification Preferences

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `matchEmailFrequency` | enum | `daily` | hourly/daily/weekly (stored, enforcement needs cron) |
| `subscriptionEmails` | boolean | `true` | Opt-in for subscription event emails |
| `paymentEmails` | boolean | `true` | Opt-in for payment event emails |
| `marketingEmails` | boolean | `false` | Opt-in for marketing (future) |

## Key Design Decisions

- **Synchronous delivery** — emails sent inline (async workers deferred to HLD §11)
- **Fire-and-forget from callers** — `notify()` errors don't break calling flows
- **Opt-in checking** — respects user preferences before sending
- **Full audit trail** — every send attempt logged to `emailDeliveryLogs`
- **Frequency stored but not enforced** — `matchEmailFrequency` requires cron (HLD §11)
- **No subscription gating** — all authenticated users can manage preferences and view notifications
