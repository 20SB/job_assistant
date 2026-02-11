# Cv Module — HLD §X: [Section Name]

## Purpose

[Concise description of module purpose and boundaries]

## Public API (index.ts exports)

```typescript
export { CvPage } from './components/CvPage';
export { useCv } from './hooks/useCv';
export { cvApi } from './api/cv.api';
export type * from './types';
```

## Key Files

- `components/CvPage/CvPage.tsx` - Main page component
- `hooks/useCv.ts` - State management hook
- `api/cv.api.ts` - API client

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
| GET | `/api/cv` | Fetch data |

## Design Decisions

### Key Decision 1

Explanation of important architectural choice.

---

**Backend Module:** `apps/backend/src/modules/cv/`
**Last Updated:** 2026-02-11
