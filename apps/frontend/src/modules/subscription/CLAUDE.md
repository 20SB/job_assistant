# Subscription Module — HLD §X: [Section Name]

## Purpose

[Concise description of module purpose and boundaries]

## Public API (index.ts exports)

```typescript
export { SubscriptionPage } from './components/SubscriptionPage';
export { useSubscription } from './hooks/useSubscription';
export { subscriptionApi } from './api/subscription.api';
export type * from './types';
```

## Key Files

- `components/SubscriptionPage/SubscriptionPage.tsx` - Main page component
- `hooks/useSubscription.ts` - State management hook
- `api/subscription.api.ts` - API client

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
| GET | `/api/subscription` | Fetch data |

## Design Decisions

### Key Decision 1

Explanation of important architectural choice.

---

**Backend Module:** `apps/backend/src/modules/subscription/`
**Last Updated:** 2026-02-11
