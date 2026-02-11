# Core Infrastructure

Framework-level infrastructure that all features depend on.

## Structure

- `api/` - Base API client (`fetchApi`, `ApiError`)
- `auth/` - Authentication context and provider
- `theme/` - Theme management and toggle
- `error-boundary/` - Global error handling

## Usage

```typescript
// API client
import { fetchApi, ApiError } from '@/core/api';

// Auth
import { useAuth, AuthProvider } from '@/core/auth';

// Theme
import { ThemeToggle } from '@/core/theme';

// Error boundary
import { ErrorBoundary } from '@/core/error-boundary';
```

## Dependency Rules

- ✅ Can import from: `ui/`
- ❌ Cannot import from: `modules/`, `shared/`
