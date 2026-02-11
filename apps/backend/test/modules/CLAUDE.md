# Module Tests

Tests for `src/modules/` — each module has a service test and a controller test.

## Test Pattern

**Service tests** (`<name>.service.test.ts`):
- Mock `db` with chainable helpers from `utils/mocks/db.mock.ts`
- Mock cross-module services (e.g., notifications in subscriptions)
- Mock external deps (bcrypt, jwt, global.fetch) where needed
- Test business logic: success paths, error paths, edge cases
- Verify correct DB operations and error types thrown

**Controller tests** (`<name>.controller.test.ts`):
- Mock the corresponding service module entirely
- Use `mockRequest()`, `mockResponse()`, `mockNext()` from `utils/mocks/request.mock.ts`
- Verify: extracts from `req` correctly, calls service, sends proper response shape `{ status: "success", data }`
- Thin by design — controllers are just glue

## Module Summary

| Module | Service Tests | Controller Tests | Special Notes |
|--------|--------------|-----------------|---------------|
| `users/` | 26 | 7 | Mocks bcrypt + jwt; signup, login, verify email, reset password, profile |
| `cv/` | 18 | 6 | Versioning logic, auto-promote active CV, snapshot immutability |
| `preferences/` | 11 | 4 | One-to-one CRUD, sparse PATCH updates, conflict on duplicate create |
| `subscriptions/` | 17 | 6 | Subscribe flow, cancel, plan tier checks, payment history; mocks notifications |
| `jobs/` | 13 + 12 | 4 | `jobs.service` (fetch orchestration, dedup) + `jobs.adzuna` (API client, response mapper); mocks `globalThis.fetch` |
| `matching/` | 16 + 45 | 6 | `matching.service` (batch orchestration) + `matching.scorer` (PURE function, no mocks, 45 tests across 5 scoring dimensions) |
| `csv/` | 14 | 4 | CSV generation (in-memory), download, email attachment, archive |
| `notifications/` | 20 | 6 | `notify()` with opt-in checks, email delivery logging, preference CRUD |
| `tasks/` | 8 | 2 | `enqueue`, status lookup, list with filters |
| `admin/` | 12 | 7 | Stats aggregation, log viewers (job-fetch, matching, email), user list, task queue |

## Notable Test Files

### `matching/matching.scorer.test.ts` (45 tests)
The highest-value test file. Tests the pure scoring function with zero mocks across all 5 weighted dimensions:
- Skill overlap (40% weight)
- Role match (25% weight)
- Location match (15% weight)
- Salary compatibility (10% weight)
- Experience alignment (10% weight)

### `jobs/jobs.adzuna.test.ts` (12 tests)
Tests the Adzuna API client and response mapper. Uses `vi.spyOn(globalThis, "fetch")` to mock HTTP calls. Tests pagination, error responses, missing credentials, and field mapping from Adzuna's API format to internal schema.
