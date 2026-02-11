# Shared Utilities

This directory contains utilities, components, hooks, and types that are **shared by 2 or more modules**.

## When to Use Shared

- ✅ Code used in 2+ modules → Move to shared/
- ❌ Code used in 1 module only → Keep in module
- ⚠️ Used everywhere + complex → Consider core/

## Structure

```
shared/
├── components/       # Reusable UI components (DataTable, Pagination)
├── hooks/            # Reusable hooks (usePagination, useDebounce)
├── utils/            # Utility functions (date, format, validation)
├── types/            # Shared TypeScript types
├── constants/        # Shared constants (routes, config)
└── README.md
```

## Import Path

```typescript
import { usePagination } from '@/shared/hooks';
import { DataTable } from '@/shared/components';
import { formatDate } from '@/shared/utils';
```

## Guidelines

1. **Extract When Duplicated**: Don't extract prematurely
2. **Keep it Simple**: Shared code should be generic
3. **Document Well**: Add JSDoc comments
4. **Test Thoroughly**: Shared code needs high test coverage
