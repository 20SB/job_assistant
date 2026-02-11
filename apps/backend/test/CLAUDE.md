# Test Suite — Vitest Unit + Integration Tests

## Overview

- **324 unit tests** across 34 test files covering all backend layers: lib utilities, middleware, services, controllers, and workers. All tests are pure unit tests with mocked dependencies — no database, network, or filesystem I/O.
- **108 integration tests** across 12 test files using supertest to send real HTTP requests through the Express app. Tests exercise the full middleware chain (routing → validation → auth → controller → response) while mocking only the DB layer and logger.

## Running Tests

```bash
# From apps/backend/
npm test                       # Run all unit tests once
npm run test:watch             # Unit tests in watch mode
npm run test:coverage          # Coverage report (v8 provider)
npm run test:integration       # Run all integration tests once
npm run test:integration:watch # Integration tests in watch mode
npx vitest --reporter=verbose  # See individual test names
```

## Configuration

### Unit Tests
- **Config**: `vitest.config.ts` at backend root
- **Setup file**: `test/vitest.setup.ts` — globally mocks `config/env.js` (test defaults, bcrypt rounds=4) and `lib/logger.js` (all methods are `vi.fn()`)
- **Coverage**: v8 provider, excludes `index.ts`, `db/schema.ts`, `db/index.ts`
- **Excludes**: `test/integration/**` (integration tests have their own config)

### Integration Tests
- **Config**: `test/vitest.integration.config.ts`
- **Setup file**: `test/integration/setup.ts` — mocks env, logger, db, email, task-processor; provides JWT helpers and global `beforeEach` that resets DB mocks
- **Prerequisite**: `src/app.ts` exports the Express app without calling `listen()` — supertest uses this directly

## Directory Structure

```
test/
  vitest.setup.ts               → Global mocks (env, logger) — runs before unit tests
  vitest.integration.config.ts  → Separate vitest config for integration tests
  utils/mocks/                  → Shared mock helpers and fixtures
  lib/                          → Tests for src/lib/ utilities
    workers/                    → Tests for src/lib/workers/
  middleware/                   → Tests for src/middleware/
  modules/                      → Tests for src/modules/ (service + controller per module)
    admin/
    csv/
    cv/
    jobs/
    matching/
    notifications/
    preferences/
    subscriptions/
    tasks/
    users/
  integration/                  → Supertest integration tests
    setup.ts                    → Shared setup: mocks, JWT helpers, beforeEach reset
    health.test.ts              → Health check + 404 (2 tests)
    users.test.ts               → Auth flows: signup, login, me, profile update (17 tests)
    middleware.test.ts           → Auth, validation, admin, subscription gating, error handler (11 tests)
    cv.test.ts                  → CV CRUD + versioning (11 tests)
    preferences.test.ts         → Preferences CRUD (9 tests)
    subscriptions.test.ts       → Plans, subscribe, cancel, payments (10 tests)
    jobs.test.ts                → Job listing, search, fetch trigger (7 tests)
    matching.test.ts            → Run matching, batches, results, shortlist, viewed (10 tests)
    csv.test.ts                 → Generate, list, download, archive + subscription gating (6 tests)
    notifications.test.ts       → Preferences CRUD + notification listing (10 tests)
    tasks.test.ts               → Task listing + details (4 tests)
    admin.test.ts               → Admin endpoints + role gating (11 tests)
```

## Mocking Strategy (Unit Tests)

| Dependency            | How                                       | Where                                             |
| --------------------- | ----------------------------------------- | ------------------------------------------------- |
| `config/env.js`       | Global `vi.mock` with test defaults       | `vitest.setup.ts`                                 |
| `lib/logger.js`       | Global `vi.mock`, all methods `vi.fn()`   | `vitest.setup.ts`                                 |
| `db` (Drizzle)        | Module-level `vi.mock`, chainable helpers | Per-file + `utils/mocks/db.mock.ts`               |
| `bcrypt`              | `vi.mock("bcrypt")` per-file              | Service tests that hash/compare                   |
| `jsonwebtoken`        | `vi.mock("jsonwebtoken")` per-file        | Auth middleware + user service                    |
| `global.fetch`        | `vi.spyOn(globalThis, "fetch")`           | Adzuna API client tests                           |
| Cross-module services | `vi.mock()` the imported module           | E.g., notifications mocked in subscriptions tests |
| Express req/res/next  | Factory functions                         | `utils/mocks/request.mock.ts`                     |

## Writing New Unit Tests

1. Create `test/modules/<name>/<name>.service.test.ts` (and controller test)
2. Mock `db` with `vi.mock("../../src/db/index.js")` and use chainable helpers from `utils/mocks/db.mock.ts`
3. Mock any cross-module imports with `vi.mock()`
4. Use fixtures from `utils/mocks/fixtures.ts` for test data
5. Use `mockRequest()`, `mockResponse()`, `mockNext()` for controller tests
6. Follow the existing pattern: `vi.mock()` calls at top, imports after, `beforeEach` clears mocks

### Important Pattern

`vi.mock()` calls must appear **before** the corresponding imports. Vitest hoists them, but keeping them at the top of the file makes intent clear:

```typescript
vi.mock("../../src/db/index.js", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

import { db } from "../../src/db/index.js";
import { mockSelectChain, type MockDb } from "../utils/mocks/db.mock.js";

const mDb = db as unknown as MockDb;
```

## Integration Tests

### What They Test

Integration tests send real HTTP requests through the full Express app via supertest. They verify:
- Route paths and HTTP methods are correct
- Middleware chain ordering (auth → validate → controller)
- Zod validation rejects invalid input with 400
- JWT auth returns 401 for missing/invalid/expired tokens
- `requireAdmin` returns 403 for non-admin users
- `requireSubscription` returns 403 for users without active plans
- Response shapes match `{ status: "success", data }` / `{ status: "error", message }`
- Correct HTTP status codes for all scenarios

### What's Mocked

- **DB** — same chainable mock helpers as unit tests (`mockSelectChain`, `mockInsertChain`, etc.)
- **Logger** — all methods are `vi.fn()`
- **Email** — `sendEmail` is a noop mock
- **Task processor** — `startTaskProcessor` is a noop mock
- **Everything else is real** — Express routing, middleware, controllers, Zod validation, error handler

### Writing New Integration Tests

1. Create `test/integration/<name>.test.ts`
2. Import `app` from `../../src/app.js` and `db` from `../../src/db/index.js`
3. Cast `db` as `MockDb` and set up mock return values for each DB call the route makes
4. Use `userToken`/`adminToken` and `authHeader()` from `./setup.js`
5. **Critical**: Mock DB calls in the exact order the service function calls them (select for existence check → delete/update → select for follow-up queries)

### Mock Ordering Gotcha

Services often check existence before mutating. Always mock in call order:

```typescript
// Example: DELETE /api/preferences
// Service does: db.select() → check exists → db.delete()
mDb.select.mockReturnValueOnce(mockSelectChain([{ id: "..." }]));  // existence check
mDb.delete.mockReturnValueOnce(mockDeleteChain([]));                // actual delete
```

### Mock Reset Strategy

The setup file's `beforeEach` uses:
- `vi.clearAllMocks()` — clears call history for all mocks
- `mDb.select.mockReset()` / `insert` / `update` / `delete` / `execute` — resets only DB mock queues

This avoids resetting bcrypt/email implementations while ensuring no leftover `mockReturnValueOnce` queues bleed between tests.
