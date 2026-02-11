# UI Design System

This directory contains the **atomic UI components** (design system) used throughout the application.

## Purpose

UI components are pure, presentational components with:
- No business logic
- Full accessibility (WCAG 2.1 AA)
- Complete themability
- Isolated testing

## Components

| Component | Purpose | Status |
|-----------|---------|--------|
| button | Button with variants | ✅ Done |
| card | Container component | ✅ Done |
| input | Form input field | ✅ Done |
| badge | Status indicator | ✅ Done |
| label | Form label | ✅ Done |
| skeleton | Loading placeholders | ✅ Done |

## Usage

```typescript
import { Button, Card, Input } from '@/ui';

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Email" />
      <Button>Submit</Button>
    </Card>
  );
}
```

## Guidelines

1. **Pure UI**: No state management, API calls, or business logic
2. **Composable**: Small, reusable building blocks
3. **Accessible**: Keyboard navigation, ARIA labels, focus management
4. **Themed**: Use design tokens from theme.css
5. **Tested**: Unit tests + visual regression (optional Storybook)

## Adding New Components

Use shadcn/ui pattern:
```bash
npx shadcn-ui@latest add [component]
```

Or create manually following the existing pattern.
