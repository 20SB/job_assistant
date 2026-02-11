# Middleware Tests

Tests for `src/middleware/` — authentication and authorization middleware.

All tests use `mockRequest()`, `mockResponse()`, `mockNext()` from `utils/mocks/request.mock.ts`.

## Files

| Test File | Source | Tests | What It Covers |
|-----------|--------|-------|----------------|
| `auth.test.ts` | `middleware/auth.ts` | 6 | `authenticate` middleware: valid JWT → sets `req.user`, missing token → 401, invalid token → 401, expired token → 401, malformed header → 401, Bearer prefix handling. Mocks `jsonwebtoken` |
| `require-admin.test.ts` | `middleware/require-admin.ts` | 4 | `requireAdmin` middleware: admin role passes, non-admin → 403, missing `req.user` → 401 |
| `require-subscription.test.ts` | `middleware/require-subscription.ts` | 6 | `requireSubscription(minPlan)` middleware: active subscription with sufficient tier passes, lower tier → 403, expired → 403, no subscription → 403, plan rank ordering (free < starter < professional < enterprise). Mocks `db` to return subscription + plan data |
