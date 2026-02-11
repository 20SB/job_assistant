# Frontend Architecture Guide

## Overview

This document describes the modular architecture of the Job Assistant frontend. The architecture is designed for **scalability**, **maintainability**, and **team collaboration**, following feature-based modularization with strict boundary enforcement.

---

## Architecture Principles

### 1. Feature Modules as Bounded Contexts

Each feature is a self-contained module that owns:
- Its UI components
- Business logic (hooks, state)
- API client
- Types and validation
- Tests and documentation

### 2. One-Way Dependency Flow

Dependencies flow in one direction only:
```
app/ → modules/ → shared/ → core/ → ui/
```

**Enforced by ESLint** — imports violating this flow will fail linting.

### 3. Explicit Public APIs

Modules expose a public API via `index.ts` barrel exports. Deep imports are forbidden:

```typescript
// ✅ GOOD - Import from public API
import { CvEditor } from '@/modules/cv';

// ❌ BAD - Deep import (will fail ESLint)
import { CvEditor } from '@/modules/cv/components/CvEditor';
```

### 4. Colocation Over Separation

Related code lives together:
- Tests next to source files (`CvEditor.tsx` + `CvEditor.test.tsx`)
- Module-specific utilities inside the module (`modules/cv/utils/`)
- Types close to usage (`modules/cv/types/`)

### 5. Progressive Complexity

- Simple features stay simple (no forced patterns)
- Complex features can adopt advanced patterns (state management, complex hooks)
- No one-size-fits-all approach

---

## 4-Layer Architecture

```
src/
├── modules/        # Layer 1: Feature modules (business domains)
├── shared/         # Layer 2: Shared utilities (2+ modules)
├── core/           # Layer 3: Core infrastructure (framework)
└── ui/             # Layer 4: Design system (pure UI)
```

### Layer 1: `modules/` — Feature Modules

**Purpose:** Self-contained business features/domains.

**Examples:** `auth`, `cv`, `jobs`, `preferences`, `subscription`, `notifications`, `exports`, `admin`, `settings`

**Structure:**
```
modules/[feature]/
├── components/         # UI components
│   ├── [Name]/
│   │   ├── [Name].tsx
│   │   ├── [Name].test.tsx
│   │   └── index.ts
│   └── index.ts        # Export all components
├── hooks/              # Custom hooks
│   ├── use[Feature].ts
│   ├── use[Feature].test.ts
│   └── index.ts
├── api/                # API client
│   ├── [feature].api.ts
│   ├── [feature].api.test.ts
│   └── index.ts
├── types/              # TypeScript types
│   ├── [feature].types.ts
│   ├── [feature].schemas.ts  # Zod schemas
│   └── index.ts
├── utils/              # Module-specific utilities
│   └── index.ts
├── constants/          # Module constants
│   └── [feature].constants.ts
├── README.md           # Human-friendly docs
├── CLAUDE.md           # AI-friendly context
└── index.ts            # Public API (barrel exports)
```

**Dependency Rules:**
- ✅ Can import from: `shared/`, `core/`, `ui/`
- ❌ Cannot import from: other modules in `modules/`

**Communication Between Modules:**
- Use shared state (e.g., `core/auth/AuthContext`)
- Use URL state (query params, route params)
- Use events (custom events, pub-sub patterns)
- **Never** directly import from another module

---

### Layer 2: `shared/` — Shared Utilities

**Purpose:** Code used by **2 or more modules** (avoid premature extraction).

**Examples:** `DataTable`, `Pagination`, `usePagination`, `useDebounce`, `formatDate`

**Structure:**
```
shared/
├── components/         # Shared UI components
│   ├── DataTable/
│   ├── Pagination/
│   ├── EmptyState/
│   └── index.ts
├── hooks/              # Shared hooks
│   ├── usePagination.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── index.ts
├── utils/              # Shared utilities
│   ├── date.utils.ts
│   ├── format.utils.ts
│   ├── validation.utils.ts
│   └── index.ts
├── types/              # Shared types
│   ├── common.types.ts
│   ├── api.types.ts
│   └── index.ts
├── constants/          # Shared constants
│   ├── routes.ts
│   ├── config.ts
│   └── index.ts
└── README.md
```

**Dependency Rules:**
- ✅ Can import from: `core/`, `ui/`
- ❌ Cannot import from: `modules/`, other `shared/`

**Extraction Rule:**
- Only extract to `shared/` when **2+ modules need it**
- Don't extract speculatively "just in case"

---

### Layer 3: `core/` — Core Infrastructure

**Purpose:** Framework-level infrastructure (auth, API, theme, routing).

**Examples:** `fetchApi()`, `AuthProvider`, `ThemeProvider`, `ErrorBoundary`

**Structure:**
```
core/
├── api/                # Base API client
│   ├── client.ts       # fetchApi<T>() wrapper
│   ├── interceptors.ts
│   ├── error-handler.ts
│   └── index.ts
├── auth/               # Core auth infrastructure
│   ├── AuthContext.tsx
│   ├── AuthProvider.tsx
│   ├── useAuth.ts
│   └── index.ts
├── theme/              # Theme system
│   ├── ThemeProvider.tsx
│   ├── useTheme.ts
│   └── index.ts
├── error-boundary/
│   ├── ErrorBoundary.tsx
│   ├── ErrorFallback.tsx
│   └── index.ts
├── router/
│   ├── routes.config.ts
│   └── index.ts
└── README.md
```

**Dependency Rules:**
- ✅ Can import from: `ui/`
- ❌ Cannot import from: `modules/`, `shared/`

**Key Principle:**
Core is **framework-level** — it provides infrastructure that all features depend on, but it should know nothing about specific features.

---

### Layer 4: `ui/` — Design System

**Purpose:** Pure, reusable UI components (no business logic).

**Examples:** `Button`, `Card`, `Input`, `Badge`, `Skeleton`, `Dialog`

**Structure:**
```
ui/
├── button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   ├── Button.stories.tsx  # (optional)
│   └── index.ts
├── card/
├── input/
├── badge/
├── skeleton/
├── theme.css           # Design tokens (colors, spacing, etc.)
├── README.md
└── index.ts            # Export all UI components
```

**Dependency Rules:**
- ✅ Can import from: **Nothing** (pure UI layer)
- ❌ Cannot import from: `modules/`, `shared/`, `core/`

**Key Principle:**
UI components are **dumb** — they accept props, render UI, call callbacks. No API calls, no auth checks, no business logic.

---

## Import Patterns

### TypeScript Path Aliases

Configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/modules/*": ["./src/modules/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/core/*": ["./src/core/*"],
      "@/ui": ["./src/ui"],
      "@/ui/*": ["./src/ui/*"]
    }
  }
}
```

### Import Examples

```typescript
// ✅ Module public API import
import { CvPage, CvEditor, useCv } from '@/modules/cv';

// ✅ Shared utilities
import { usePagination } from '@/shared/hooks';
import { formatDate } from '@/shared/utils';

// ✅ Core infrastructure
import { fetchApi } from '@/core/api';
import { useAuth } from '@/core/auth';

// ✅ UI components
import { Button, Card, Input } from '@/ui';

// ❌ FORBIDDEN - Deep module import
import { CvEditor } from '@/modules/cv/components/CvEditor';

// ❌ FORBIDDEN - Cross-module import
import { useJobs } from '@/modules/jobs'; // Inside modules/cv
```

### ESLint Enforcement

Rules in `eslint.config.mjs`:
```javascript
rules: {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: ['@/modules/*/!(index)'],
          message: 'Import from module public API only (index.ts). Use: @/modules/[name]',
        },
        {
          group: ['../**/modules/*'],
          message: 'Do not use relative imports for modules. Use: @/modules/[name]',
        },
      ],
    },
  ],
}
```

---

## Module Structure Deep Dive

### Anatomy of a Feature Module

**Example:** `modules/cv`

```
modules/cv/
├── components/
│   ├── CvPage/
│   │   ├── CvPage.tsx           # Main page (orchestrates sub-components)
│   │   ├── CvPage.test.tsx
│   │   └── index.ts
│   ├── CvViewer/
│   │   ├── CvViewer.tsx         # Display CV in read-only mode
│   │   ├── CvViewer.test.tsx
│   │   └── index.ts
│   ├── CvEditor/
│   │   ├── CvEditor.tsx         # Edit/create CV form
│   │   ├── CvEditor.test.tsx
│   │   └── index.ts
│   ├── CvHistory/
│   │   ├── CvHistory.tsx        # Version history list
│   │   ├── CvHistory.test.tsx
│   │   └── index.ts
│   └── index.ts                 # Export all components
│
├── hooks/
│   ├── useCv.ts                 # Main CV hook (CRUD operations)
│   ├── useCv.test.ts
│   ├── useCvVersions.ts         # Version history hook
│   ├── useCvVersions.test.ts
│   └── index.ts
│
├── api/
│   ├── cv.api.ts                # API client (all HTTP calls)
│   ├── cv.api.test.ts
│   └── index.ts
│
├── types/
│   ├── cv.types.ts              # TypeScript interfaces
│   ├── cv.schemas.ts            # Zod schemas (runtime validation)
│   └── index.ts
│
├── utils/
│   ├── validation.ts            # CV-specific validation helpers
│   └── index.ts
│
├── constants/
│   └── cv.constants.ts          # CV-related constants
│
├── README.md                    # Human-friendly documentation
├── CLAUDE.md                    # AI-friendly context
└── index.ts                     # Public API (what gets exported)
```

### Public API (`index.ts`)

The `index.ts` file defines what is publicly available from the module:

```typescript
// modules/cv/index.ts

// Components
export { CvPage } from './components/CvPage';
export { CvViewer } from './components/CvViewer';
export { CvEditor } from './components/CvEditor';
export { CvHistory } from './components/CvHistory';

// Hooks
export { useCv } from './hooks/useCv';
export { useCvVersions } from './hooks/useCvVersions';

// API
export { cvApi } from './api/cv.api';

// Types
export type { Cv, CvFormData, CvVersion } from './types';
```

**Key Principles:**
- Export only what's needed outside the module
- Don't export internal utilities or helpers
- If something is not in `index.ts`, it's considered private

---

## State Management

### Local State First

By default, use **local state** via React hooks:

```typescript
// modules/cv/hooks/useCv.ts
export function useCv(id?: string) {
  const [cv, setCv] = useState<Cv | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCv = async () => {
    setLoading(true);
    try {
      const data = await cvApi.getById(id);
      setCv(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { cv, loading, error, fetchCv };
}
```

### Global State When Needed

For truly global state (auth, theme, user), use **React Context**:

```typescript
// core/auth/AuthContext.tsx
export const AuthContext = createContext<AuthContextValue>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Auth logic here

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// core/auth/useAuth.ts
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### State Management Libraries (Optional)

For complex state (e.g., large forms, complex filters), consider:
- **Zustand** — Lightweight global state
- **React Query** / **TanStack Query** — Server state caching

**Rule of Thumb:**
- Start with local state
- Promote to Context when shared across multiple components
- Use external library only when Context becomes unwieldy

---

## Code Organization Best Practices

### 1. File Naming Conventions

| File Type          | Convention         | Example                  |
|--------------------|--------------------|--------------------------|
| Components         | PascalCase         | `CvEditor.tsx`           |
| Hooks              | camelCase          | `useCv.ts`               |
| Utilities          | camelCase          | `validation.ts`          |
| Types              | camelCase          | `cv.types.ts`            |
| Constants          | camelCase          | `cv.constants.ts`        |
| Tests              | Same as source + `.test` | `CvEditor.test.tsx` |

### 2. Component Organization

**Prefer:** One component per file (folder structure)
```
components/CvEditor/
├── CvEditor.tsx
├── CvEditor.test.tsx
└── index.ts
```

**Over:** Multiple components in one file
```
components/CvEditor.tsx  # ❌ Avoid
```

**Why:** Easier to find, test, and refactor.

### 3. Export Strategy

**Use named exports** (better for tree-shaking and refactoring):
```typescript
// ✅ GOOD
export function CvEditor() { ... }

// ❌ Avoid
export default function CvEditor() { ... }
```

**Exception:** Next.js pages (must use default export)
```typescript
// app/(dashboard)/cv/page.tsx
import { CvPage } from '@/modules/cv';

export default function Page() {
  return <CvPage />;
}
```

### 4. Barrel Exports (`index.ts`)

Each folder should have an `index.ts` that re-exports its public API:

```typescript
// modules/cv/components/index.ts
export { CvPage } from './CvPage';
export { CvViewer } from './CvViewer';
export { CvEditor } from './CvEditor';
export { CvHistory } from './CvHistory';
```

**Benefits:**
- Cleaner imports: `import { CvEditor, CvViewer } from './components'`
- Easy to see what's public
- Easier to refactor internal structure

---

## Testing Strategy

### Test Colocation

Tests live **next to** the code they test:
```
components/CvEditor/
├── CvEditor.tsx
├── CvEditor.test.tsx    # ✅ Next to source
└── index.ts
```

**Not:**
```
components/CvEditor/CvEditor.tsx
tests/components/CvEditor.test.tsx  # ❌ Separate test folder
```

### Test Types

| Test Type       | Location                  | Tools                | Purpose                          |
|-----------------|---------------------------|----------------------|----------------------------------|
| Unit Tests      | Next to source files      | Vitest + Testing Library | Test individual functions/components |
| Integration     | `tests/integration/`      | Vitest               | Test module interactions         |
| E2E             | `tests/e2e/`              | Playwright           | Test full user flows             |

### Example Unit Test

```typescript
// modules/cv/hooks/useCv.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useCv } from './useCv';
import { cvApi } from '../api/cv.api';

vi.mock('../api/cv.api');

describe('useCv', () => {
  it('should fetch CV on mount', async () => {
    const mockCv = { id: '1', name: 'Test CV' };
    vi.mocked(cvApi.getById).mockResolvedValue(mockCv);

    const { result } = renderHook(() => useCv('1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.cv).toEqual(mockCv);
      expect(result.current.loading).toBe(false);
    });
  });
});
```

---

## Creating New Modules

### Using the Generator Script

We provide a CLI tool to scaffold new modules with all necessary files:

```bash
# Generate a new module
npm run generate:module -- --name [feature]

# Examples
npm run generate:module -- --name analytics
npm run generate:module -- --name reports --with-store
npm run generate:module -- --name demo --no-tests
```

**Flags:**
- `--name` — Module name (required)
- `--with-store` — Include Zustand store setup (optional)
- `--no-tests` — Skip test file generation (optional)

**What it generates:**
- Complete module structure (components, hooks, api, types, etc.)
- TypeScript types + Zod schemas
- API client with CRUD operations
- React hooks with state management
- Main page component
- Test files (unless `--no-tests`)
- README.md + CLAUDE.md documentation
- Public API (`index.ts`)

### Manual Module Creation

If creating manually, follow this checklist:

1. **Create module directory:** `modules/[name]/`
2. **Add subdirectories:** `components/`, `hooks/`, `api/`, `types/`, `utils/`, `constants/`
3. **Create `index.ts`:** Define public API
4. **Create `README.md`:** Human-friendly docs (use template in `docs/templates/MODULE_README_TEMPLATE.md`)
5. **Create `CLAUDE.md`:** AI-friendly context (use template in `docs/templates/MODULE_CLAUDE_TEMPLATE.md`)
6. **Update module list:** Add to `modules/README.md`

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Cross-Module Imports

**Problem:**
```typescript
// Inside modules/cv/
import { useJobs } from '@/modules/jobs';  // ❌ FORBIDDEN
```

**Solution:**
- Lift shared logic to `shared/` or `core/`
- Use shared state (Context, URL state)
- Use events for communication
- Rethink module boundaries (maybe they should be one module?)

---

### ❌ Pitfall 2: Deep Imports

**Problem:**
```typescript
import { CvEditor } from '@/modules/cv/components/CvEditor';  // ❌ FORBIDDEN
```

**Solution:**
```typescript
import { CvEditor } from '@/modules/cv';  // ✅ GOOD
```

Ensure `CvEditor` is exported in `modules/cv/index.ts`.

---

### ❌ Pitfall 3: Premature Extraction to `shared/`

**Problem:**
Extracting utilities to `shared/` when only 1 module uses them.

**Solution:**
- Keep utilities inside the module until **2+ modules** need them
- Prefer duplication over premature abstraction
- Extract to `shared/` only when there's clear reuse

---

### ❌ Pitfall 4: Business Logic in UI Components

**Problem:**
```typescript
// ui/button/Button.tsx
export function Button() {
  const { user } = useAuth();  // ❌ Business logic in UI layer
  // ...
}
```

**Solution:**
UI components should be **pure** — no API calls, no auth checks, no business logic. Move logic to modules or shared.

---

### ❌ Pitfall 5: Large `index.ts` Files

**Problem:**
Barrel exports that re-export everything, including internals.

**Solution:**
Only export what's **truly public**. Keep internal helpers private.

```typescript
// modules/cv/index.ts

// ✅ Public API
export { CvPage } from './components/CvPage';
export { useCv } from './hooks/useCv';

// ❌ Don't export internals
// export { validateCvData } from './utils/validation';  // Keep private
```

---

## Tools & Automation

### ESLint Rules

Enforce module boundaries with ESLint:
```bash
npm run lint
```

See `docs/ESLINT_RULES.md` for details.

### Module Generator

Scaffold new modules:
```bash
npm run generate:module -- --name [name]
```

See `scripts/generate-module.ts` for implementation.

### Dependency Check (Future)

Planned script to validate dependency rules:
```bash
npm run check:dependencies
```

---

## Migration Guide

If you're migrating existing code to this architecture:

1. **Start with new features** — Build new modules using this structure
2. **Extract shared utilities** — Identify code used by 2+ features, move to `shared/`
3. **Refactor existing features** — Gradually convert old code to module structure
4. **Enforce with ESLint** — Turn on rules once most code is migrated

**See:** `ULTIMATE_MODULAR_PLAN.md` for detailed migration phases.

---

## Decision Tree: Where Does This Code Go?

```
Is it a UI component with no business logic?
├─ Yes → ui/
└─ No ↓

Is it used by the entire app (auth, API, theme)?
├─ Yes → core/
└─ No ↓

Is it used by 2+ feature modules?
├─ Yes → shared/
└─ No ↓

Is it specific to one feature/domain?
├─ Yes → modules/[feature]/
└─ Unsure? → Start in modules/, extract later if needed
```

---

## Additional Resources

- **Module Guide:** See `docs/templates/MODULE_README_TEMPLATE.md` for creating new modules
- **ESLint Rules:** See `docs/ESLINT_RULES.md` for import rules
- **Ultimate Plan:** See `ULTIMATE_MODULAR_PLAN.md` for full architecture vision
- **Backend Architecture:** See `apps/backend/CLAUDE.md` for backend patterns

---

## Questions?

If you're unsure where code belongs or how to structure something:
1. Check the decision tree above
2. Look at existing modules for examples
3. Ask the team (or Claude!) for guidance

**Remember:** Start simple, refactor as you learn. Architecture evolves with the codebase.

---

**Last Updated:** 2026-02-11
