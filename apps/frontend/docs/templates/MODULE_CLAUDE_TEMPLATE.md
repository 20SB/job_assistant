# [Module Name] Module — HLD §X: [Section Name]

## Purpose

Concise description of module purpose and boundaries.

## Public API (index.ts exports)

List everything exported from the module's index.ts:

```typescript
// Components
export { ExamplePage } from './components/ExamplePage';
export { ExampleCard } from './components/ExampleCard';
export { ExampleEditor } from './components/ExampleEditor';

// Hooks
export { useExample } from './hooks/useExample';
export { useExampleList } from './hooks/useExampleList';

// API
export { exampleApi } from './api/example.api';

// Types
export type { Example, ExampleFormData } from './types';
```

## Directory Structure

```
modules/example/
├── components/
│   ├── ExamplePage/
│   │   ├── ExamplePage.tsx        # Main page (150 lines)
│   │   └── ExamplePage.test.tsx
│   ├── ExampleCard/
│   │   ├── ExampleCard.tsx        # Display card (80 lines)
│   │   └── ExampleCard.test.tsx
│   └── index.ts
├── hooks/
│   ├── useExample.ts              # State management (100 lines)
│   ├── useExample.test.ts
│   └── index.ts
├── api/
│   ├── example.api.ts             # API client (60 lines)
│   ├── example.api.test.ts
│   └── index.ts
├── types/
│   ├── example.types.ts           # TypeScript types
│   ├── example.schemas.ts         # Zod schemas
│   └── index.ts
├── utils/
│   ├── validation.ts              # Module-specific utils
│   └── index.ts
├── constants/
│   └── example.constants.ts
├── README.md
├── CLAUDE.md                      # This file
└── index.ts                       # Public API
```

## Key Components

### ExamplePage (components/ExamplePage/ExamplePage.tsx)

**Purpose:** Main entry point, orchestrates sub-components
**Lines:** ~150
**Dependencies:** useExample, ExampleCard, ExampleEditor
**State:** Local via useExample hook

**Key Logic:**
- Fetches data on mount
- Handles create/update/delete operations
- Shows toast notifications on success/error

### ExampleCard (components/ExampleCard/ExampleCard.tsx)

**Purpose:** Display single item in read-only mode
**Lines:** ~80
**Props:** `{ data: Example }`
**Pure Component:** No state, just display

### useExample Hook (hooks/useExample.ts)

**Purpose:** Manages CRUD operations and state
**Lines:** ~100
**Returns:** `{ data, loading, error, create, update, delete }`

**Key Logic:**
- Optimistic UI updates
- Error handling with toast
- Automatic refetch after mutations

## API Calls

Backend: `apps/backend/src/modules/example/`

| Method | Endpoint | Request | Response | Hook |
|--------|----------|---------|----------|------|
| GET | `/api/example` | - | `Example[]` | `useExampleList()` |
| GET | `/api/example/:id` | - | `Example` | `useExample(id)` |
| POST | `/api/example` | `ExampleFormData` | `Example` | `useExample().create()` |
| PATCH | `/api/example/:id` | `Partial<ExampleFormData>` | `Example` | `useExample().update()` |
| DELETE | `/api/example/:id` | - | `void` | `useExample().delete()` |

## Dependencies

### External Packages
- `sonner` - Toast notifications for user feedback
- `zod` - Runtime validation of API responses

### Internal Dependencies
- `@/core/api` - `fetchApi()` for HTTP requests
- `@/core/auth` - `useAuth()` for token access
- `@/ui` - `Button`, `Card`, `Input` components
- `@/shared/hooks` - `usePagination()` for list view

## State Management

**Pattern:** Local state via custom hooks (no global store)

- Each hook manages its own state
- No Redux/Zustand needed (module is self-contained)
- Context used only for truly global state (auth, theme)

## User Flows

### Primary Flow: View List
1. User navigates to `/example`
2. `ExamplePage` renders, calls `useExampleList()`
3. Hook fetches from `/api/example`
4. Data displayed in cards
5. Pagination updates URL params

### Secondary Flow: Create Item
1. User clicks "Create"
2. `ExampleEditor` form opens (modal/drawer)
3. User fills form, clicks "Save"
4. Calls `create()` from `useExample()`
5. Optimistic update → API call → Refetch
6. Toast success message
7. Form closes, list refreshes

### Error Flow
1. API call fails
2. Hook catches error
3. Revert optimistic update (if any)
4. Show toast error message
5. User can retry

## Design Decisions

### 1. Why Local State (Not Global)?

**Decision:** Use local hooks instead of global state management.

**Reasoning:**
- Module is self-contained
- No cross-module state sharing needed
- Simpler to understand and test
- Better performance (no global re-renders)

**Trade-off:** If multiple pages need same data, may duplicate fetches. Accept this for now.

### 2. Why Optimistic UI?

**Decision:** Update UI before API confirms.

**Reasoning:**
- Better perceived performance
- More responsive feel
- Can rollback if API fails

**Trade-off:** More complex error handling. Worth it for UX.

### 3. Why Zod Runtime Validation?

**Decision:** Validate API responses at runtime.

**Reasoning:**
- Backend types might change
- Catch API contract violations early
- Better error messages
- Type safety + runtime safety

## Testing Strategy

### Unit Tests (Co-located)
- `useExample.test.ts` - Hook behavior, mocking API
- `ExampleCard.test.tsx` - Component rendering
- `validation.test.ts` - Utility functions

### Integration Tests
- `example-workflow.test.ts` - Full CRUD flow
- Mock API responses
- Test user interactions

### E2E Tests (tests/e2e/)
- `example.spec.ts` - Real browser test
- Create → Edit → Delete flow
- Happy path only

## Known Issues / Limitations

1. **No offline support** - Requires network connection
2. **No real-time updates** - Manual refresh needed
3. **No bulk operations** - Edit one at a time

## Future Enhancements

- [ ] Add bulk delete
- [ ] Add real-time updates (WebSocket)
- [ ] Add offline support (service worker)
- [ ] Add export to CSV
- [ ] Add advanced filters

## Related Modules

- None (fully self-contained)
- Or: Links to related modules and how they communicate

---

**Backend Module:** `apps/backend/src/modules/example/`
**HLD Reference:** Section X
**Last Updated:** YYYY-MM-DD
