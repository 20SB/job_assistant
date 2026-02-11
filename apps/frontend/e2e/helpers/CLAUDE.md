# E2E Test Helpers

## Files

### `mock-api.ts` — API Route Interception

**Export**: `setupMockApi(page, overrides?)`

Intercepts all `**/api/**` fetch calls via `page.route()` and returns mock JSON responses.

- **Default routes**: Every backend endpoint has a default mock response
- **Overrides**: Pass `{ "METHOD /api/path": { status, body } }` to customize per-test
- **Parameterized routes**: Handles `/api/matching/:id/shortlist`, `/api/csv/:id/download`, etc.
- **CSV download**: Returns actual CSV text (not JSON) for download endpoints
- **Unmatched routes**: Returns 404 with descriptive error message
- **Returns**: `{ mockError(method, path, status, message) }` for dynamic error injection

Route key format: `"METHOD /api/path"` — e.g., `"POST /api/users/login"`, `"GET /api/cv/active"`

### `auth.ts` — Auth State Setup

**Exports**: `loginAsUser(page)`, `loginAsAdmin(page)`

Sets up authentication state so protected routes work:
1. Injects `auth_token` into `localStorage` via `page.addInitScript()`
2. Sets `auth_token` cookie via `page.context().addCookies()` (for middleware)
3. Mocks `GET /api/users/me` to return user/admin data

**Must be called before `page.goto()`** — middleware runs server-side and checks cookie.

### `test-data.ts` — Mock Response Data

Centralized mock objects matching exact backend response shapes:

| Export | Shape | Used by |
|--------|-------|---------|
| `mockUser` | User object (role: "user") | Auth, dashboard, settings |
| `mockAdminUser` | User object (role: "admin") | Admin tests |
| `mockToken` | JWT string | Auth helpers |
| `mockLoginResponse` | `{ status, data: { token, user } }` | Login tests |
| `mockSignupResponse` | `{ status, data: { verificationToken } }` | Signup tests |
| `mockCvSnapshot` | CV with parsedSkills, parsedRoles | CV page tests |
| `mockCvVersions` | Array of CV versions | CV versions tests |
| `mockPreferences` | Full preferences object | Preferences tests |
| `mockPlans` | Array of 3 plans (free, starter, pro) | Subscription, onboarding |
| `mockSubscription` | Active subscription with plan | Subscription, dashboard |
| `mockPayments` | Payment history array | Subscription tests |
| `mockJob` | Single job object | Jobs tests |
| `mockMatchResults` | Array of 2 match results | Jobs, dashboard tests |
| `mockBatches` | Match batch list | Exports, dashboard tests |
| `mockExports` | CSV export list | Exports, dashboard tests |
| `mockNotificationPrefs` | Notification preferences | Notifications tests |
| `mockNotifications` | Notification history array | Notifications tests |
| `mockAdminStats` | Admin dashboard stats | Admin tests |
| `mockAdminUsers` | Admin users list | Admin tests |
| `mockJobFetchLogs` | Job fetch log entries | Admin tests |
| `mockMatchingLogs` | Matching log entries | Admin tests |
| `mockEmailLogs` | Email log entries | Admin tests |
| `mockTasks` | Task queue entries | Admin tests |
