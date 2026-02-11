# Jobs Module — HLD §X: [Section Name]

## Purpose

[Concise description of module purpose and boundaries]

## Public API (index.ts exports)

```typescript
export { JobsPage } from './components/JobsPage';
export { useJobs } from './hooks/useJobs';
export { jobsApi } from './api/jobs.api';
export type * from './types';
```

## Key Files

- `components/JobsPage/JobsPage.tsx` - Main page component
- `hooks/useJobs.ts` - State management hook
- `api/jobs.api.ts` - API client

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
| GET | `/api/jobs` | Fetch data |

## Design Decisions

### Key Decision 1

Explanation of important architectural choice.

---

**Backend Module:** `apps/backend/src/modules/jobs/`
**Last Updated:** 2026-02-11
