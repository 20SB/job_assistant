# Lib Tests

Tests for `src/lib/` — shared utilities, error handling, email, and the task processor.

## Files

| Test File | Source | Tests | What It Covers |
|-----------|--------|-------|----------------|
| `errors.test.ts` | `lib/errors.ts` | 9 | `AppError` class, 5 factory functions (BadRequest, Unauthorized, Forbidden, NotFound, Conflict), status codes, `isOperational` flag |
| `validate.test.ts` | `lib/validate.ts` | 8 | `validate(schema, target)` middleware for body/query/params, passes valid data, rejects invalid with 400 + Zod issues |
| `error-handler.test.ts` | `lib/error-handler.ts` | 5 | Global Express error middleware: AppError → structured response, unknown errors → 500, Zod errors → 400, non-error values |
| `email.test.ts` | `lib/email.ts` | 7 | `sendEmail`, template functions, dev mode (logs instead of sending), missing SMTP config handling. Mocks `nodemailer` |
| `task-processor.test.ts` | `lib/task-processor.ts` | 9 | `startTaskProcessor()` polling engine: returns stop function, claims tasks via SQL, dispatches to workers, handles failures/retries, cleans stale locks. Uses `vi.useFakeTimers()` |

## Subdirectory

### `workers/` — Worker Wrapper Tests

Thin wrappers that call the corresponding service function. See `workers/CLAUDE.md`.
