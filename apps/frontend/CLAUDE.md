# Frontend — Next.js 16 App

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **React**: 19.2.3
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS 4 + class-variance-authority (CVA)
- **Forms**: React Hook Form 7 + Zod 4 + @hookform/resolvers
- **Icons**: Lucide React
- **UI Pattern**: shadcn-style components (Radix primitives + Tailwind)
- **State**: React Context (AuthContext) — no Redux/Zustand
- **API Client**: Custom fetch wrapper (`lib/api/client.ts`)

## Architecture

```
src/
  app/
    layout.tsx              → Root layout (AuthProvider wraps entire app)
    page.tsx                → Landing page (public)
    globals.css             → Tailwind global styles
    (auth)/                 → Auth route group (public)
      layout.tsx            → Centered layout for auth pages
      login/page.tsx        → Login form
      signup/page.tsx       → Signup form
      verify/page.tsx       → Email verification handler
    (dashboard)/            → Dashboard route group (protected)
      layout.tsx            → Dashboard shell (header + nav)
      dashboard/page.tsx    → Main dashboard (stats + job matches)
      onboarding/page.tsx   → 3-step onboarding wizard
  components/
    ui/                     → Reusable UI primitives (button, card, input, label, badge)
    landing/                → Landing page sections (Navbar, Hero, HowItWorks, Pricing, FAQ, Footer)
  context/
    AuthContext.tsx          → Auth state (user, token, login, signup, logout)
  lib/
    utils.ts                → cn() helper (clsx + tailwind-merge)
    api/
      client.ts             → fetchApi<T>() base wrapper + ApiError class
      auth.ts               → Auth API methods (signup, login, verifyEmail, etc.)
      cv.ts                 → CV API (create, getActive)
      preferences.ts        → Preferences API (create, get)
      subscriptions.ts      → Subscriptions API (listPlans, subscribe, getMySubscription)
```

## HLD Section → Frontend Status

| # | HLD Section                    | Frontend Status | Pages / Components                   | Notes                                       |
|---|--------------------------------|-----------------|--------------------------------------|---------------------------------------------|
| 4 | Landing Page                   | Done            | `/` + `components/landing/*`         | Hero, HowItWorks, Pricing, FAQ, Footer      |
| 5 | Auth & User Management         | Done            | `/login`, `/signup`, `/verify`       | AuthContext + localStorage token             |
| 6 | CV Management                  | Partial         | `/onboarding` step 1                 | Text paste only; no dedicated CV page        |
| 7 | Job Preferences                | Partial         | `/onboarding` step 2                 | Set during onboarding; no edit page          |
| 8 | Pricing & Subscription         | Partial         | `/onboarding` step 3 + landing       | Plan selection; no manage/cancel page        |
| 9 | Job Ingestion                  | N/A (backend)   | —                                    | No frontend needed                          |
| 10| Job Matching / Results         | Basic           | `/dashboard`                         | Shows match stats + job list; needs polish   |
| 11| Async Processing               | Not started     | —                                    | No job status / queue UI yet                 |
| 12| CSV Generation                 | Not started     | —                                    | No download/export UI yet                    |
| 13| Notifications                  | Not started     | —                                    | No notification preferences UI yet           |
| 14| Admin & Observability          | Not started     | —                                    | No admin dashboard yet                       |

## What's Missing / TODO

### High Priority (core user flows)
- [ ] **Route protection middleware** — `src/middleware.ts` to redirect unauthenticated users from `/dashboard/*` and `/onboarding/*`
- [ ] **CV management page** — View active CV, update (create new snapshot), version history
- [ ] **Preferences edit page** — View & update job preferences after onboarding
- [ ] **Subscription management page** — View current plan, upgrade/downgrade, cancel, payment history
- [ ] **Dashboard polish** — Better job match cards, filter/sort, pagination, shortlist toggle

### Medium Priority (backend sections 11-13 frontend)
- [ ] **CSV export UI** — Download button for matched jobs CSV on dashboard
- [ ] **Notification preferences page** — Email frequency, notification channel settings
- [ ] **Job detail view** — Expanded job card with full description, score breakdown, apply link

### Low Priority (section 14 + polish)
- [ ] **Admin dashboard** — User list, subscription stats, job ingestion health, queue status
- [ ] **Settings page** — Account settings, password change, delete account
- [ ] **Dark mode toggle** — Tailwind dark class already supported, needs UI toggle
- [ ] **Mobile responsive polish** — Landing page is responsive, dashboard needs work
- [ ] **Loading skeletons** — Replace loading spinners with skeleton components
- [ ] **Error boundaries** — Global error handling with fallback UI

## API Client Layer

### Base client (`lib/api/client.ts`)
```
fetchApi<T>(endpoint, options) → Promise<T>
  - Prepends NEXT_PUBLIC_API_URL (default: http://localhost:3001)
  - Adds Authorization: Bearer <token> from localStorage
  - Parses JSON, throws ApiError on non-ok response
```

### Existing API clients
| Client              | File                  | Backend Module     | Methods                                            |
|---------------------|-----------------------|--------------------|----------------------------------------------------|
| `authApi`           | `lib/api/auth.ts`     | `modules/users`    | signup, login, verifyEmail, forgotPassword, resetPassword, getMe |
| `cvApi`             | `lib/api/cv.ts`       | `modules/cv`       | create, getActive                                  |
| `preferencesApi`    | `lib/api/preferences.ts` | `modules/preferences` | create, get                                   |
| `subscriptionsApi`  | `lib/api/subscriptions.ts` | `modules/subscriptions` | listPlans, subscribe, getMySubscription     |

### Missing API clients (need to add as backend modules are consumed)
- [ ] `lib/api/jobs.ts` — Job listing, search, filters (backend exists)
- [ ] `lib/api/matching.ts` — Match results, shortlist, viewed (backend exists)
- [ ] `lib/api/csv.ts` — CSV export download (backend not started)
- [ ] `lib/api/notifications.ts` — Notification preferences (backend not started)

## Conventions

- **"use client"** directive on all pages with interactivity (forms, state, effects)
- **Route groups** — `(auth)` and `(dashboard)` for layout separation, no URL impact
- **UI components** — shadcn pattern: Radix + Tailwind + CVA variants + `cn()` merge
- **Forms** — React Hook Form + Zod resolver for validation
- **Imports** — `@/` alias maps to `src/`
- **Response parsing** — Expects `{ status: "success", data }` from backend

## Environment Variables

| Variable              | Required | Default                  | Notes                        |
|-----------------------|----------|--------------------------|------------------------------|
| `NEXT_PUBLIC_API_URL` | No       | `http://localhost:3001`  | Backend API base URL         |

## Local Development

```bash
# From apps/frontend/
npm run dev       # Start dev server (port 3000)
npm run build     # Production build
npm run lint      # ESLint check
```
