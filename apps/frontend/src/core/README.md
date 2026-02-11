# Core Infrastructure

This directory contains **framework-level infrastructure** used throughout the application.

## Purpose

Core provides foundational services that all modules depend on:
- API client (fetch wrapper)
- Authentication context
- Theme system
- Error boundaries
- Routing utilities

## Dependency Rules

- ✅ Modules can import from core/
- ✅ Shared can import from core/
- ❌ Core CANNOT import from modules/ (dependency inversion)
- ❌ Core CANNOT import from shared/

## Structure

```
core/
├── api/              # Base API client & interceptors
├── auth/             # Authentication context & provider
├── theme/            # Theme provider & hooks
├── error-boundary/   # Global error boundaries
├── router/           # Routing utilities
└── README.md
```

## Import Path

```typescript
import { fetchApi } from '@/core/api';
import { useAuth } from '@/core/auth';
import { useTheme } from '@/core/theme';
```

## Guidelines

1. **Framework-Agnostic**: Keep as generic as possible
2. **Stable API**: Changes affect all modules
3. **Well Tested**: High test coverage required
4. **Documented**: Clear JSDoc comments
