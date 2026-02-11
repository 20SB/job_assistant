# Test Suite — Vitest Unit Tests

## Overview

324 unit tests across 34 test files covering all backend layers: lib utilities, middleware, services, controllers, and workers. All tests are pure unit tests with mocked dependencies — no database, network, or filesystem I/O.

## Running Tests

```bash
# From apps/backend/
npm test                       # Run all tests once
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report (v8 provider)
npx vitest --reporter=verbose  # See individual test names
```

## Configuration

- **Config**: `vitest.config.ts` at backend root
- **Setup file**: `test/vitest.setup.ts` — globally mocks `config/env.js` (test defaults, bcrypt rounds=4) and `lib/logger.js` (all methods are `vi.fn()`)
- **Coverage**: v8 provider, excludes `index.ts`, `db/schema.ts`, `db/index.ts`

## Directory Structure

```
test/
  vitest.setup.ts           → Global mocks (env, logger) — runs before all tests
  utils/mocks/              → Shared mock helpers and fixtures
  lib/                      → Tests for src/lib/ utilities
    workers/                → Tests for src/lib/workers/
  middleware/               → Tests for src/middleware/
  modules/                  → Tests for src/modules/ (service + controller per module)
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
```

## Mocking Strategy

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

## Writing New Tests

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
