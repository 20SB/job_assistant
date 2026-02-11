# Test Utilities & Mocks

Shared mock helpers, fixtures, and factories used across all test files.

## Files

### `db.mock.ts` — Drizzle ORM Chainable Mocks

Provides helpers that simulate Drizzle's chainable query builder API so tests can mock database operations without a real connection.

| Export | Returns | Simulates |
|--------|---------|-----------|
| `mockSelectChain(data)` | `ChainableQuery` | `db.select().from().where().orderBy().limit()` |
| `mockInsertChain(data)` | `InsertChain` | `db.insert().values().returning().onConflictDoNothing()` |
| `mockUpdateChain(data)` | `UpdateChain` | `db.update().set().where().returning()` |
| `mockDeleteChain(data)` | `DeleteChain` | `db.delete().where().returning()` |
| `createMockDb()` | `MockDb` | Full `db` object with all methods as `vi.fn()` |
| `MockDb` (type) | — | Type interface for casting the mocked `db` |

**How chaining works**: Each method returns `this` (the chain object). The chain implements `.then()` so it's awaitable — resolves with the `data` array passed to the helper.

**Usage**:
```typescript
const mDb = db as unknown as MockDb;
mDb.select.mockReturnValue(mockSelectChain([mockUser]));
// Now: await db.select().from(users).where(...) → [mockUser]
```

**Sequential calls** (when a service calls `db.select` multiple times):
```typescript
mDb.select
  .mockReturnValueOnce(mockSelectChain([plan]))    // 1st call
  .mockReturnValueOnce(mockSelectChain([]));        // 2nd call
```

### `request.mock.ts` — Express Request/Response Factories

| Export | Purpose |
|--------|---------|
| `mockRequest(overrides)` | Creates a mock `Request` with `body`, `params`, `query`, `user`, etc. |
| `mockResponse()` | Creates a mock `Response` with chainable `status().json()` + tracking fields |
| `mockNext()` | Creates a mock `NextFunction` (`vi.fn()`) |

The response tracks internal state via `_status`, `_json`, `_headers`, and `_sent` fields for assertions:
```typescript
const res = mockResponse();
controller.someHandler(req, res, next);
expect(res._status).toBe(201);
expect(res._json).toEqual({ status: "success", data: ... });
```

### `auth.mock.ts` — Auth Payload Fixtures

| Export | Role | userId |
|--------|------|--------|
| `mockUserPayload` | `"user"` | `"user-uuid-1234"` |
| `mockAdminPayload` | `"admin"` | `"admin-uuid-5678"` |

Both match the `AuthPayload` interface from `src/middleware/auth.ts`.

### `fixtures.ts` — Reusable Test Data

14 fixture objects matching the database schema shapes:

| Fixture | Table |
|---------|-------|
| `mockUser` | `users` |
| `mockAdminUser` | `users` (role=admin) |
| `mockCvSnapshot` | `cvSnapshots` |
| `mockPreferences` | `jobPreferences` |
| `mockJob` | `jobs` |
| `mockPlan` | `plans` (starter tier) |
| `mockFreePlan` | `plans` (free tier) |
| `mockSubscription` | `subscriptions` |
| `mockMatchBatch` | `matchBatches` |
| `mockJobMatch` | `jobMatches` |
| `mockCsvExport` | `csvExports` |
| `mockNotificationPrefs` | `notificationPreferences` |
| `mockNotification` | `notifications` |
| `mockTask` | `taskQueue` |

All fixtures use consistent IDs (`user-uuid-1234`, `plan-uuid-4444`, etc.) so they can be composed across test files.
