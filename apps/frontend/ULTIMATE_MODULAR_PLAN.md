# Ultimate Frontend Modular Architecture Plan
## Production-Grade, Scalable, Future-Proof

> **Goal:** Build a frontend architecture that scales to 100+ developers, 1000+ components, and can evolve for years without major rewrites.

---

## Table of Contents
1. [Architecture Philosophy](#architecture-philosophy)
2. [Complete Structure](#complete-structure)
3. [Module Types & Patterns](#module-types--patterns)
4. [Implementation Phases](#implementation-phases)
5. [Code Standards & Conventions](#code-standards--conventions)
6. [Testing Strategy](#testing-strategy)
7. [Documentation Strategy](#documentation-strategy)
8. [Migration Execution Plan](#migration-execution-plan)

---

## Architecture Philosophy

### Core Principles

1. **Feature Modules as First-Class Citizens**
   - Each feature is a self-contained, independently deployable unit
   - Modules own their data, UI, logic, and tests

2. **Dependency Direction**
   - Features → Shared → Core (one-way dependency)
   - Features never import from other features directly
   - Communication via events/contracts only

3. **Colocation Over Separation**
   - Keep related code together (tests next to code)
   - Module = feature boundary, not tech layer

4. **Explicit Over Implicit**
   - Public API via index.ts barrel exports
   - No deep imports (enforce with linter)
   - Clear module boundaries

5. **Progressive Complexity**
   - Simple features stay simple
   - Complex features can use advanced patterns
   - No forced uniformity

---

## Complete Structure

```
apps/frontend/
├── src/
│   ├── modules/                          # Feature modules (bounded contexts)
│   │   ├── auth/                         # Authentication domain
│   │   │   ├── components/               # UI components
│   │   │   │   ├── LoginForm/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   ├── LoginForm.test.tsx
│   │   │   │   │   ├── LoginForm.stories.tsx (optional)
│   │   │   │   │   └── index.ts
│   │   │   │   ├── SignupForm/
│   │   │   │   └── index.ts              # Export all components
│   │   │   ├── hooks/                    # Custom React hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useAuth.test.ts
│   │   │   │   └── index.ts
│   │   │   ├── api/                      # API client
│   │   │   │   ├── auth.api.ts
│   │   │   │   ├── auth.api.test.ts
│   │   │   │   └── index.ts
│   │   │   ├── types/                    # TypeScript types
│   │   │   │   ├── auth.types.ts
│   │   │   │   ├── auth.schemas.ts       # Zod schemas
│   │   │   │   └── index.ts
│   │   │   ├── store/                    # State management (if needed)
│   │   │   │   ├── auth.store.ts
│   │   │   │   └── index.ts
│   │   │   ├── utils/                    # Module-specific utilities
│   │   │   │   ├── validation.ts
│   │   │   │   └── index.ts
│   │   │   ├── constants/                # Module constants
│   │   │   │   └── auth.constants.ts
│   │   │   ├── README.md                 # Module documentation
│   │   │   ├── CLAUDE.md                 # AI-friendly context
│   │   │   └── index.ts                  # Public API (barrel export)
│   │   │
│   │   ├── cv/                           # CV management domain
│   │   │   ├── components/
│   │   │   │   ├── CvViewer/
│   │   │   │   ├── CvEditor/
│   │   │   │   ├── CvHistory/
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useCv.ts
│   │   │   │   ├── useCvVersions.ts
│   │   │   │   └── index.ts
│   │   │   ├── api/
│   │   │   ├── types/
│   │   │   ├── README.md
│   │   │   ├── CLAUDE.md
│   │   │   └── index.ts
│   │   │
│   │   ├── jobs/                         # Job matching domain
│   │   │   ├── components/
│   │   │   │   ├── JobCard/
│   │   │   │   ├── JobFilters/
│   │   │   │   ├── JobDetails/
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useJobs.ts
│   │   │   │   ├── useJobFilters.ts
│   │   │   │   └── index.ts
│   │   │   ├── api/
│   │   │   ├── types/
│   │   │   ├── README.md
│   │   │   ├── CLAUDE.md
│   │   │   └── index.ts
│   │   │
│   │   ├── preferences/                  # Job preferences domain
│   │   ├── subscription/                 # Subscription domain
│   │   ├── notifications/                # Notifications domain
│   │   ├── exports/                      # CSV exports domain
│   │   ├── admin/                        # Admin domain
│   │   └── settings/                     # Settings domain
│   │
│   ├── shared/                           # Shared utilities (used by 2+ modules)
│   │   ├── components/                   # Shared UI components
│   │   │   ├── DataTable/
│   │   │   │   ├── DataTable.tsx
│   │   │   │   ├── DataTable.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Pagination/
│   │   │   ├── EmptyState/
│   │   │   └── index.ts
│   │   │
│   │   ├── hooks/                        # Shared hooks
│   │   │   ├── usePagination.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/                        # Shared utilities
│   │   │   ├── date.utils.ts
│   │   │   ├── format.utils.ts
│   │   │   ├── validation.utils.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── types/                        # Shared types
│   │   │   ├── common.types.ts
│   │   │   ├── api.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── constants/                    # Shared constants
│   │   │   ├── routes.ts
│   │   │   ├── config.ts
│   │   │   └── index.ts
│   │   │
│   │   └── README.md
│   │
│   ├── core/                             # Core infrastructure (framework-level)
│   │   ├── api/                          # Base API client
│   │   │   ├── client.ts                 # Fetch wrapper
│   │   │   ├── interceptors.ts
│   │   │   ├── error-handler.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── auth/                         # Core auth (context/provider)
│   │   │   ├── AuthContext.tsx
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── useAuth.ts                # Re-export from modules/auth
│   │   │   └── index.ts
│   │   │
│   │   ├── theme/                        # Theme system
│   │   │   ├── ThemeProvider.tsx
│   │   │   ├── useTheme.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── error-boundary/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ErrorFallback.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── router/                       # Routing utilities
│   │   │   ├── routes.config.ts
│   │   │   └── index.ts
│   │   │
│   │   └── README.md
│   │
│   ├── ui/                               # Design system (atomic components)
│   │   ├── button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── card/
│   │   ├── input/
│   │   ├── badge/
│   │   ├── skeleton/
│   │   ├── theme.css                     # Design tokens
│   │   ├── README.md
│   │   └── index.ts                      # Export all UI components
│   │
│   ├── app/                              # Next.js App Router (thin wrappers)
│   │   ├── layout.tsx                    # Root layout (providers)
│   │   ├── page.tsx                      # Landing page
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx              # <LoginPage /> from modules/auth
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── verify/
│   │   │       └── page.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx                # Dashboard shell
│   │       ├── dashboard/
│   │       │   └── page.tsx              # <DashboardPage /> from modules/dashboard
│   │       ├── cv/
│   │       │   └── page.tsx              # <CvPage /> from modules/cv
│   │       ├── jobs/
│   │       │   └── page.tsx
│   │       └── ...
│   │
│   ├── config/                           # App configuration
│   │   ├── env.ts                        # Validated environment variables
│   │   ├── features.ts                   # Feature flags
│   │   └── index.ts
│   │
│   └── types/                            # Global type augmentations
│       └── global.d.ts
│
├── tests/                                # Integration & E2E tests
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── cv.spec.ts
│   │   └── ...
│   ├── integration/
│   │   └── ...
│   └── setup.ts
│
├── scripts/                              # Build/dev scripts
│   ├── generate-module.ts                # CLI to scaffold new modules
│   ├── check-dependencies.ts             # Enforce dependency rules
│   └── ...
│
├── docs/                                 # Additional documentation
│   ├── ARCHITECTURE.md
│   ├── MODULE_GUIDE.md
│   ├── TESTING_GUIDE.md
│   └── CONTRIBUTING.md
│
├── .eslintrc.js                          # Enforce module boundaries
├── CLAUDE.md                             # Frontend architecture overview
└── README.md
```

---

## Module Types & Patterns

### 1. Feature Module (Standard Pattern)

**Purpose:** Self-contained feature with UI, logic, and data.

**Structure:**
```
modules/[feature]/
├── components/       # UI components
├── hooks/            # React hooks
├── api/              # API client
├── types/            # Types & schemas
├── utils/            # Feature-specific utils
├── constants/        # Feature constants
├── README.md         # Human docs
├── CLAUDE.md         # AI context
└── index.ts          # Public API
```

**Example (CV Module):**
```typescript
// modules/cv/index.ts - Public API
export { CvPage } from './components/CvPage';
export { CvViewer } from './components/CvViewer';
export { CvEditor } from './components/CvEditor';
export { useCv } from './hooks/useCv';
export type { Cv, CvFormData } from './types';

// modules/cv/components/CvPage/CvPage.tsx
import { useCv } from '../../hooks/useCv';
import { CvViewer } from '../CvViewer';
import { CvEditor } from '../CvEditor';

export function CvPage() {
  const { cv, isLoading, update } = useCv();
  // Page logic here
}
```

**Usage in app/:**
```typescript
// app/(dashboard)/cv/page.tsx
import { CvPage } from '@/modules/cv';

export default function Page() {
  return <CvPage />;
}
```

---

### 2. Core Infrastructure Pattern

**Purpose:** Framework-level utilities (API client, auth, theme).

**Rules:**
- Can be imported by any module
- Cannot import from modules (dependency inversion)
- Should be framework-agnostic where possible

**Example:**
```typescript
// core/api/client.ts
export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Base fetch logic
}

// modules/cv/api/cv.api.ts
import { fetchApi } from '@/core/api';

export const cvApi = {
  getActive: (token: string) => fetchApi<Cv>('/api/cv/active', { token }),
};
```

---

### 3. Shared Utilities Pattern

**Purpose:** Code reused by 2+ modules.

**When to extract:**
- ✅ Used in 2+ modules → Move to shared/
- ❌ Used in 1 module only → Keep in module
- ⚠️ Used in many modules + complex → Consider core/

**Example:**
```typescript
// shared/hooks/usePagination.ts
export function usePagination(total: number, pageSize: number) {
  // Pagination logic
}

// modules/jobs/components/JobList.tsx
import { usePagination } from '@/shared/hooks';
```

---

### 4. UI Design System Pattern

**Purpose:** Atomic UI components (button, input, card).

**Rules:**
- No business logic
- Fully themeable
- Accessible by default
- Tested with Storybook (optional)

**Example:**
```typescript
// ui/button/Button.tsx
export function Button({ children, variant, ...props }: ButtonProps) {
  // Pure UI component
}

// modules/cv/components/CvEditor.tsx
import { Button } from '@/ui';
```

---

## Module Communication Patterns

### ❌ Anti-Pattern: Direct Import
```typescript
// modules/jobs/components/JobCard.tsx
import { useCv } from '@/modules/cv'; // ❌ NEVER DO THIS
```

### ✅ Pattern 1: Shared State (Context)
```typescript
// core/auth/AuthContext.tsx
export const AuthProvider = ...;

// modules/jobs/hooks/useJobs.ts
import { useAuth } from '@/core/auth'; // ✅ Via core
```

### ✅ Pattern 2: Props Drilling
```typescript
// app/(dashboard)/jobs/page.tsx
import { JobsPage } from '@/modules/jobs';
import { useCv } from '@/modules/cv';

export default function Page() {
  const { cv } = useCv();
  return <JobsPage cv={cv} />; // ✅ Pass as prop
}
```

### ✅ Pattern 3: Events (Advanced)
```typescript
// core/events/events.ts
export const events = createEventBus();

// modules/cv/hooks/useCv.ts
import { events } from '@/core/events';

export function useCv() {
  const update = async (data) => {
    await cvApi.update(data);
    events.emit('cv:updated', data); // ✅ Publish event
  };
}

// modules/jobs/hooks/useJobs.ts
import { events } from '@/core/events';

events.on('cv:updated', () => {
  refetchJobs(); // ✅ Subscribe to event
});
```

---

## Code Standards & Conventions

### File Naming
```
✅ PascalCase:   Button.tsx, CvEditor.tsx (components)
✅ camelCase:    useCv.ts, cvApi.ts (hooks, utils)
✅ kebab-case:   cv-editor.test.ts (tests)
✅ UPPERCASE:    README.md, CLAUDE.md
```

### Import Order (enforced by ESLint)
```typescript
// 1. External dependencies
import { useState } from 'react';
import { toast } from 'sonner';

// 2. Core
import { fetchApi } from '@/core/api';
import { useAuth } from '@/core/auth';

// 3. Shared
import { usePagination } from '@/shared/hooks';
import { DataTable } from '@/shared/components';

// 4. UI
import { Button, Card } from '@/ui';

// 5. Local (within same module)
import { useCv } from '../hooks/useCv';
import { CvCard } from './CvCard';

// 6. Types
import type { Cv } from '../types';
```

### Barrel Exports (index.ts)
```typescript
// modules/cv/index.ts
export { CvPage } from './components/CvPage';
export { CvViewer } from './components/CvViewer';
export { CvEditor } from './components/CvEditor';
export { useCv } from './hooks/useCv';
export { cvApi } from './api/cv.api';
export type * from './types';

// DO NOT re-export everything (selective exports)
```

### Type Safety
```typescript
// ✅ Good: Zod schema + inferred types
// modules/cv/types/cv.schemas.ts
import { z } from 'zod';

export const cvSchema = z.object({
  id: z.string().uuid(),
  rawText: z.string(),
  skills: z.array(z.string()),
});

export type Cv = z.infer<typeof cvSchema>;

// ✅ Good: API response validation
export const cvApi = {
  getActive: async (token: string) => {
    const response = await fetchApi('/api/cv/active', { token });
    return cvSchema.parse(response); // Runtime validation
  },
};
```

---

## Testing Strategy

### Unit Tests (Co-located)
```
modules/cv/
├── hooks/
│   ├── useCv.ts
│   └── useCv.test.ts         # ✅ Next to source
├── utils/
│   ├── validation.ts
│   └── validation.test.ts
```

### Integration Tests (Top-level)
```
tests/integration/
├── cv-workflow.test.ts       # Test full CV flow
└── matching-workflow.test.ts
```

### E2E Tests (Top-level)
```
tests/e2e/
├── auth.spec.ts              # Playwright/Cypress
└── cv-management.spec.ts
```

### Coverage Requirements
- Unit tests: 80%+ for utils/hooks
- Integration tests: Critical user flows
- E2E tests: Happy paths only

---

## Documentation Strategy

### 1. README.md (Human-Friendly)
```markdown
# CV Module

## What it does
Manages user CV uploads, edits, and version history.

## Key components
- `CvPage` - Main page component
- `CvEditor` - Form to edit CV
- `useCv` - Hook to manage CV state

## Usage
\`\`\`tsx
import { CvPage } from '@/modules/cv';
\`\`\`
```

### 2. CLAUDE.md (AI-Friendly Context)
```markdown
# CV Module — HLD §6: CV Management

## Purpose
Self-contained CV management feature with versioning.

## Public API (index.ts exports)
- `CvPage` - Full page component
- `CvViewer` - Read-only viewer
- `CvEditor` - Edit form
- `useCv()` - Hook for CV state/actions
- `cvApi` - API client

## Key Files
- `components/CvPage/CvPage.tsx` - Main entry (200 lines)
- `hooks/useCv.ts` - State management (100 lines)
- `api/cv.api.ts` - API calls (50 lines)

## Dependencies
- Core: `@/core/api` (fetchApi)
- Core: `@/core/auth` (useAuth)
- UI: `@/ui` (Button, Card, Input)
- External: sonner (toasts)

## State Management
Local state via useCv hook (no global store).

## API Calls
- GET /api/cv/active
- POST /api/cv
- PATCH /api/cv/:id
- DELETE /api/cv/:id
- GET /api/cv/versions

## Design Decisions
- Snapshots not drafts: Each edit creates new version
- Optimistic UI: Update state before API confirms
- No global state: Module-local only
```

### 3. Inline Comments (For Complex Logic)
```typescript
// Use JSDoc for public APIs
/**
 * Hook to manage CV state and operations.
 * @returns CV data, loading state, and CRUD operations
 * @example
 * const { cv, isLoading, update } = useCv();
 */
export function useCv() { ... }

// Use // comments for complex logic
export function parseSkills(text: string) {
  // Extract skills using regex pattern matching
  // Format: "Skills: JavaScript, React, Node.js"
  const match = text.match(/Skills:\s*(.+)/i);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}
```

---

## ESLint Rules (Enforce Architecture)

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Prevent direct module-to-module imports
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/modules/*'],
            message: 'Do not import directly from other modules. Use shared/ or core/ instead.',
          },
        ],
      },
    ],

    // Enforce index.ts barrel exports
    'import/no-internal-modules': [
      'error',
      {
        allow: [
          '@/modules/*/index',  // ✅ Allowed
          '@/shared/**',         // ✅ Allowed
          '@/core/**',           // ✅ Allowed
          '@/ui',                // ✅ Allowed
        ],
      },
    ],

    // Enforce import order
    'import/order': [
      'error',
      {
        groups: [
          'builtin',   // node built-ins
          'external',  // npm packages
          'internal',  // @/ imports
          'parent',    // ../
          'sibling',   // ./
          'type',      // type imports
        ],
        'newlines-between': 'always',
      },
    ],
  },
};
```

---

## Migration Execution Plan

### Phase 1: Setup Infrastructure (Week 1)

**Tasks:**
1. Create directory structure
2. Set up ESLint rules
3. Configure path aliases (@/modules, @/core, etc.)
4. Create module generator script
5. Write architecture docs (ARCHITECTURE.md)

**Deliverables:**
- Empty directory structure
- Working ESLint enforcement
- `scripts/generate-module.ts` (scaffold tool)
- Documentation

---

### Phase 2: Core Layer (Week 2)

**Migrate to core/:**
1. `core/api/` - Move `lib/api/client.ts`
2. `core/auth/` - Keep `context/AuthContext.tsx`
3. `core/theme/` - Create ThemeProvider
4. `core/error-boundary/` - Move ErrorBoundary

**Testing:**
- All core utilities have unit tests
- No breaking changes to existing app

---

### Phase 3: UI Design System (Week 2)

**Migrate to ui/:**
1. Move `components/ui/button` → `ui/button/`
2. Move `components/ui/card` → `ui/card/`
3. Add tests for each component
4. Create `ui/index.ts` barrel

**Testing:**
- Each component has unit test
- Storybook stories (optional)

---

### Phase 4: Pilot Module - Auth (Week 3)

**Refactor auth module:**
1. Create `modules/auth/`
2. Move login/signup components
3. Extract `useAuth` hook (from context)
4. Create `auth.api.ts`
5. Write README.md + CLAUDE.md
6. Update `app/(auth)` pages to use module

**Testing:**
- Full auth flow (login, signup, verify)
- Unit tests for hooks/API
- No regressions

---

### Phase 5: Core Feature Modules (Weeks 4-6)

**Refactor in order:**
1. **CV Module** (Week 4)
   - Complex forms, version history
   - Good test of pattern

2. **Jobs Module** (Week 5)
   - Filters, pagination, state management
   - Largest feature

3. **Preferences Module** (Week 6)
   - Simpler, good for validation

**Testing:**
- E2E tests for each feature
- No regressions

---

### Phase 6: Remaining Modules (Weeks 7-8)

**Refactor:**
1. Subscription
2. Notifications
3. Exports
4. Settings
5. Admin (most complex, do last)

**Testing:**
- Full app E2E test suite
- Performance testing

---

### Phase 7: Cleanup & Polish (Week 9)

**Tasks:**
1. Remove old `lib/api/*` files
2. Remove old `components/` (if all migrated)
3. Update all documentation
4. Add Storybook (optional)
5. Performance audit
6. Accessibility audit

**Deliverables:**
- Clean, fully modular codebase
- Complete documentation
- All tests passing

---

## Module Generator Script

```typescript
// scripts/generate-module.ts
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface ModuleOptions {
  name: string;
  withStore?: boolean;
  withTests?: boolean;
}

export function generateModule({ name, withStore = false, withTests = true }: ModuleOptions) {
  const modulePath = path.join('src/modules', name);

  // Create directory structure
  const dirs = [
    `${modulePath}/components`,
    `${modulePath}/hooks`,
    `${modulePath}/api`,
    `${modulePath}/types`,
    `${modulePath}/utils`,
    `${modulePath}/constants`,
  ];

  if (withStore) dirs.push(`${modulePath}/store`);

  dirs.forEach(dir => fs.mkdirSync(dir, { recursive: true }));

  // Generate files
  generateIndexFile(modulePath);
  generateReadme(modulePath, name);
  generateClaudeMd(modulePath, name);
  generateApiFile(modulePath, name);
  generateTypesFile(modulePath, name);
  generateHookFile(modulePath, name);
  generateComponentFile(modulePath, name);

  if (withTests) {
    generateTestFiles(modulePath, name);
  }

  console.log(`✅ Module "${name}" generated at ${modulePath}`);
}

// Usage:
// npm run generate:module -- --name cv --with-store --with-tests
```

---

## Benefits of This Architecture

### Scalability
- ✅ Add features without touching existing code
- ✅ Multiple teams can work independently
- ✅ Clear ownership boundaries
- ✅ Can split into micro-frontends later

### Maintainability
- ✅ Easy to find code (feature colocation)
- ✅ Clear dependencies (enforced by linter)
- ✅ Self-documenting (README + CLAUDE.md)
- ✅ Tests next to code

### Developer Experience
- ✅ Fast onboarding (clear patterns)
- ✅ AI-friendly (CLAUDE.md context)
- ✅ Code generation (module scaffold)
- ✅ Type-safe across boundaries

### Performance
- ✅ Tree-shaking friendly (barrel exports)
- ✅ Lazy loading modules (Next.js dynamic)
- ✅ No circular dependencies
- ✅ Small bundle sizes (modular)

---

## Success Metrics

### Week 4 (After Pilot)
- [ ] Auth module fully migrated
- [ ] ESLint rules enforced
- [ ] Zero deep imports
- [ ] All tests passing

### Week 9 (After Full Migration)
- [ ] 100% of features in modules/
- [ ] 80%+ test coverage
- [ ] Zero linter violations
- [ ] Documentation complete

### Long-term (3-6 months)
- [ ] New features developed faster
- [ ] Fewer cross-feature bugs
- [ ] Onboarding time reduced 50%
- [ ] Refactoring becomes easy

---

## Conclusion

This architecture is designed for:
- ✅ **Long-term scalability** (years, not months)
- ✅ **Team growth** (1 → 100 developers)
- ✅ **Code quality** (enforced boundaries)
- ✅ **AI-friendly** (rich context)
- ✅ **Future-proof** (can evolve to micro-frontends)

**Time investment:** 9 weeks
**Long-term savings:** Years of maintainability

---

## Next Steps

**Ready to execute?**

1. **Review & Approve** this plan
2. **Phase 1 (Week 1)**: I'll set up infrastructure
3. **Phase 2-3 (Week 2)**: Migrate core + UI
4. **Phase 4 (Week 3)**: Refactor auth module (pilot)
5. **Evaluate**: If pilot successful → continue full migration

**Would you like me to:**
- Start Phase 1 (infrastructure setup)?
- Create the module generator script first?
- Refactor ONE module as proof-of-concept?
