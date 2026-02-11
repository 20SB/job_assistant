# ESLint Rules for Module Boundaries

This document explains the ESLint rules that enforce our modular architecture.

## Rules Overview

### 1. No Deep Module Imports

**Rule:** `no-restricted-imports`

```typescript
// ❌ BAD - Deep import
import { CvEditor } from '@/modules/cv/components/CvEditor';

// ✅ GOOD - Public API import
import { CvEditor } from '@/modules/cv';
```

**Why:** Enforces that modules export only what's intended to be public via `index.ts`.

---

### 2. No Relative Imports Across Modules

```typescript
// ❌ BAD - Relative import from another module
import { useCv } from '../../cv/hooks/useCv';

// ✅ GOOD - Absolute import
import { useCv } from '@/modules/cv';
```

**Why:** Makes imports explicit and prevents accidental cross-module dependencies.

---

### 3. Import Order (Future Enhancement)

```typescript
// Recommended order (not yet enforced):
// 1. External dependencies
import { useState } from 'react';
import { toast } from 'sonner';

// 2. Core infrastructure
import { fetchApi } from '@/core/api';
import { useAuth } from '@/core/auth';

// 3. Shared utilities
import { usePagination } from '@/shared/hooks';

// 4. UI components
import { Button, Card } from '@/ui';

// 5. Module imports
import { useCv } from '@/modules/cv';

// 6. Local imports
import { CvCard } from './CvCard';

// 7. Types
import type { Cv } from './types';
```

---

## Dependency Rules

### Allowed Dependencies

```
app/          → modules/  ✅
              → shared/   ✅
              → core/     ✅
              → ui/       ✅

modules/      → shared/   ✅
              → core/     ✅
              → ui/       ✅
              → modules/  ❌ (NO cross-module imports!)

shared/       → core/     ✅
              → ui/       ✅
              → modules/  ❌

core/         → ui/       ✅
              → modules/  ❌
              → shared/   ❌

ui/           → (nothing) ✅ (pure UI components)
```

---

## Future Enhancements

### Phase 2: Add import/order rule

```bash
npm install -D eslint-plugin-import
```

### Phase 3: Add no-internal-modules rule

Prevent imports from non-exported internals.

### Phase 4: Custom ESLint Plugin

Create custom rules for:
- Detecting circular dependencies
- Enforcing module documentation
- Validating index.ts exports

---

## Running Linter

```bash
# Check for violations
npm run lint

# Auto-fix where possible
npm run lint:fix
```

---

## Exceptions

If you need to temporarily bypass a rule (rare!):

```typescript
// eslint-disable-next-line no-restricted-imports
import { internal } from '@/modules/cv/utils/internal';
```

**Note:** Document why the exception is needed in a comment.
