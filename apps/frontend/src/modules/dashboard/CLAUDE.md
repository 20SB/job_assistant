# Dashboard Module — HLD §X: [Section Name]

## Purpose

[Concise description of module purpose and boundaries]

## Public API (index.ts exports)

```typescript
export { DashboardPage } from './components/DashboardPage';
export { useDashboard } from './hooks/useDashboard';
export { dashboardApi } from './api/dashboard.api';
export type * from './types';
```

## Key Files

- `components/DashboardPage/DashboardPage.tsx` - Main page component
- `hooks/useDashboard.ts` - State management hook
- `api/dashboard.api.ts` - API client

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
| GET | `/api/dashboard` | Fetch data |

## Design Decisions

### Key Decision 1

Explanation of important architectural choice.

---

**Backend Module:** `apps/backend/src/modules/dashboard/`
**Last Updated:** 2026-02-11
