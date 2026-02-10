# Job Assistant — AI-Powered Job Matching Platform

## What This Is

A SaaS platform where users submit their CV + job preferences, the system periodically fetches jobs from external APIs, matches them against user profiles, and delivers best-fit results via CSV + email. Users never browse job portals manually.

## Monorepo Structure

```
apps/
  backend/       → Express 5 + TypeScript API server (the active development area)
  frontend/      → (future) React/Next.js frontend
docs/
  HLD.md         → High-Level Design document — source of truth for all features
```

## HLD Sections & Implementation Status

| # | Section                        | Status       | Module / Location              |
|---|--------------------------------|--------------|--------------------------------|
| 5 | Auth & User Management         | Done         | `modules/users/`               |
| 6 | User Profile & CV Management   | Done         | `modules/cv/`                  |
| 7 | Job Preferences                | Done         | `modules/preferences/`         |
| 8 | Pricing & Subscription         | Done         | `modules/subscriptions/` + `middleware/require-subscription.ts` |
| 9 | Job Ingestion (Adzuna API)     | Done         | `modules/jobs/` + Adzuna client |
| 10| Job Matching Engine            | Done         | `modules/matching/` + rule-based scorer |
| 11| Async Processing & Queues      | Not started  | schema ready: `taskQueue`      |
| 12| CSV Generation                 | Done         | `modules/csv/` + email attachment support |
| 13| Notification System            | Not started  | schema ready: `notifications`, `notificationPreferences` |
| 14| Admin & Observability          | Not started  | schema ready: `jobFetchLogs`, `matchingLogs`, `emailDeliveryLogs` |

## Key Conventions (all code)

- **ESM everywhere** — `"type": "module"` in package.json, all relative imports use `.js` extension
- **Strict TypeScript** — `strict: true`, `NodeNext` module resolution, `ES2023` target
- **No asyncHandler wrappers** — Express 5 catches async errors natively
- **Response shape** — `{ status: "success", data }` or `{ status: "error", message }`
- **Avoid over-engineering** — no premature abstractions, no unnecessary wrappers

## When Adding a New Module

Always refer to `docs/HLD.md` for requirements. Follow the backend `CLAUDE.md` for patterns. The database schema for all modules already exists in `db/schema.ts`.
