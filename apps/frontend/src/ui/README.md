# UI Design System

Pure, reusable UI components with no business logic.

## Usage

```typescript
import { Button, Card, Input, Badge, Label, Skeleton } from '@/ui';
```

## Available Components

- `button` - Button with variants (default, destructive, outline, etc.)
- `card` - Card container with Header, Content, Footer
- `input` - Form input field
- `label` - Form label
- `badge` - Status badge with variants
- `skeleton` - Loading skeleton

## Principles

- **Pure UI** - No API calls, no business logic
- **Prop-driven** - Props in, UI out
- **Accessible** - Built on Radix UI
- **Themeable** - Light/dark mode support
