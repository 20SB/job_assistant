# Feature Modules

This directory contains self-contained feature modules. Each module represents a distinct feature or domain in the application.

## Structure

Each module follows this pattern:
```
modules/[feature]/
├── components/       # UI components
├── hooks/            # React hooks
├── api/              # API client
├── types/            # TypeScript types & Zod schemas
├── utils/            # Feature-specific utilities
├── constants/        # Feature constants
├── README.md         # Human-friendly documentation
├── CLAUDE.md         # AI-friendly context
└── index.ts          # Public API (barrel exports)
```

## Modules

| Module | Purpose | Status |
|--------|---------|--------|
| auth | Authentication & user management | 🔄 Planned |
| cv | CV management & version history | 🔄 Planned |
| jobs | Job matching & search | 🔄 Planned |
| preferences | Job preferences | 🔄 Planned |
| subscription | Plans & billing | 🔄 Planned |
| notifications | Notifications & preferences | 🔄 Planned |
| exports | CSV exports | 🔄 Planned |
| admin | Admin dashboard | 🔄 Planned |
| settings | Account settings | 🔄 Planned |

## Guidelines

1. **Self-Contained**: Each module should be independently testable
2. **No Cross-Imports**: Modules cannot import from other modules directly
3. **Public API**: Export only what's needed via index.ts
4. **Documentation**: Every module must have README.md + CLAUDE.md

## Creating a New Module

Use the generator script:
```bash
npm run generate:module -- --name [module-name]
```

See: `scripts/generate-module.ts`
