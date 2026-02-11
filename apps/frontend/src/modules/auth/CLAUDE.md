# Auth Module — HLD §X: [Section Name]

## Purpose

[Concise description of module purpose and boundaries]

## Public API (index.ts exports)

```typescript
export { AuthPage } from './components/AuthPage';
export { useAuth } from './hooks/useAuth';
export { authApi } from './api/auth.api';
export type * from './types';
```

## Key Files

- `components/AuthPage/AuthPage.tsx` - Main page component
- `hooks/useAuth.ts` - State management hook
- `api/auth.api.ts` - API client

## Dependencies

### External
- List external packages used

### Internal
- `@/core/api` - API client
- `@/core/auth` - Authentication
- `@/ui` - UI components

## API Calls

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/auth` | Fetch data |

## Design Decisions

### Key Decision 1

Explanation of important architectural choice.

---

**Backend Module:** `apps/backend/src/modules/auth/`
**Last Updated:** 2026-02-11
