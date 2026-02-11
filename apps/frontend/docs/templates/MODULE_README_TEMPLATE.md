# [Module Name] Module

> Brief one-line description of what this module does.

## Purpose

Detailed explanation of the module's purpose and responsibilities.

## Features

- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

## Public API

### Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `ExamplePage` | Main page component | - |
| `ExampleCard` | Display card | `data: Example` |
| `ExampleEditor` | Edit form | `onSave: (data) => void` |

### Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useExample()` | Manage example state | `{ data, loading, create, update, delete }` |
| `useExampleList()` | Paginated list | `{ items, total, page, setPage }` |

### Types

```typescript
export interface Example {
  id: string;
  name: string;
  createdAt: string;
}

export interface ExampleFormData {
  name: string;
}
```

## Usage

### In App Router

```typescript
// app/(dashboard)/example/page.tsx
import { ExamplePage } from '@/modules/example';

export default function Page() {
  return <ExamplePage />;
}
```

### In Other Components

```typescript
import { ExampleCard, useExample } from '@/modules/example';

function MyComponent() {
  const { data, loading } = useExample();

  if (loading) return <div>Loading...</div>;

  return <ExampleCard data={data} />;
}
```

## Dependencies

### External
- `sonner` - Toast notifications
- `zod` - Schema validation

### Internal
- `@/core/api` - API client
- `@/core/auth` - Authentication
- `@/ui` - UI components
- `@/shared/hooks` - Shared hooks

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/example` | List items |
| GET | `/api/example/:id` | Get single item |
| POST | `/api/example` | Create item |
| PATCH | `/api/example/:id` | Update item |
| DELETE | `/api/example/:id` | Delete item |

## Development

### Running Tests

```bash
npm test -- --testPathPattern=modules/example
```

### Adding New Components

1. Create component in `components/[Name]/`
2. Add tests: `[Name].test.tsx`
3. Export from `components/index.ts`
4. Export from module `index.ts` if public

## Design Decisions

### Why X instead of Y?

Explanation of key architectural choices made in this module.

### Known Limitations

- Limitation 1: Why it exists
- Limitation 2: Future enhancement needed

## Related Modules

- None (self-contained)
- Or list related modules and how they interact

## TODO

- [ ] Future enhancement 1
- [ ] Future enhancement 2

---

**Last Updated:** YYYY-MM-DD
**Maintainer:** Team Name
