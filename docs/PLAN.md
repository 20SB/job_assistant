# Job Matching Platform – Execution Plan (v1)

## Goal

Help users discover best-fit jobs automatically based on CV + preferences.

## Core User Flow (Phase 1)

1. User lands on a public landing page
2. User registers (email + password)
3. User submits CV text OR skills manually
4. User sets job preferences
5. System fetches jobs periodically
6. System matches jobs to CV
7. User receives CSV via email

## Constraints

- No LinkedIn login
- No auto-apply
- Jobs fetched via Adzuna API only
- Matching runs asynchronously
- CSV generation must not block API

## Phase 1 Scope

- Authentication
- User profile & preferences
- Job ingestion (cron)
- Matching logic
- Email delivery

## Non-goals (Phase 1)

- Chrome extension
- Dashboard analytics
- AI resume rewriting
- Multi-language CVs
