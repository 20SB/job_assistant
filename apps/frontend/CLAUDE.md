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
  middleware.ts              → Route protection (redirects unauthenticated users)
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
      layout.tsx            → Dashboard shell (sidebar + header + mobile nav)
      dashboard/page.tsx    → Main dashboard (dynamic stats + recent matches)
      onboarding/page.tsx   → 3-step onboarding wizard
      cv/page.tsx           → CV management (view, edit, version history)
      preferences/page.tsx  → Job preferences (view + edit form)
      subscription/page.tsx → Subscription management (plans, cancel, payments)
      jobs/page.tsx         → Job matches (filters, pagination, shortlist, details)
  components/
    ui/                     → Reusable UI primitives (button, card, input, label, badge)
    landing/                → Landing page sections (Navbar, Hero, HowItWorks, Pricing, FAQ, Footer)
  context/
    AuthContext.tsx          → Auth state (user, token, login, signup, logout) + cookie sync
  lib/
    utils.ts                → cn() helper (clsx + tailwind-merge)
    api/
      client.ts             → fetchApi<T>() base wrapper + ApiError class
      auth.ts               → Auth API (signup, login, verifyEmail, forgotPassword, resetPassword, getMe)
      cv.ts                 → CV API (create, getActive, getById, getVersions, update, delete)
      preferences.ts        → Preferences API (create, get, update, delete)
      subscriptions.ts      → Subscriptions API (listPlans, getPlan, subscribe, getMySubscription, cancel, getPayments)
      jobs.ts               → Jobs API (list with filters, getById, fetch from Adzuna)
      matching.ts           → Matching API (run, getBatches, getBatchById, getResults, toggleShortlist, markViewed)
```

## HLD Section → Frontend Status

| # | HLD Section                    | Frontend Status | Pages / Components                   | Notes                                       |
|---|--------------------------------|-----------------|--------------------------------------|---------------------------------------------|
| 4 | Landing Page                   | Done            | `/` + `components/landing/*`         | Hero, HowItWorks, Pricing, FAQ, Footer      |
| 5 | Auth & User Management         | Done            | `/login`, `/signup`, `/verify`       | AuthContext + localStorage + cookie sync     |
| 6 | CV Management                  | Done            | `/cv` + `/onboarding` step 1         | View, edit, version history, create          |
| 7 | Job Preferences                | Done            | `/preferences` + `/onboarding` step 2| View mode, edit form, all fields exposed     |
| 8 | Pricing & Subscription         | Done            | `/subscription` + `/onboarding` step 3| Current plan, change, cancel, payment history|
| 9 | Job Ingestion                  | N/A (backend)   | —                                    | No frontend needed                          |
| 10| Job Matching / Results         | Done            | `/jobs` + `/dashboard`               | Filters, pagination, shortlist, score breakdown, job details |
| 11| Async Processing               | Not started     | —                                    | No job status / queue UI yet                 |
| 12| CSV Generation                 | Not started     | —                                    | No download/export UI yet                    |
| 13| Notifications                  | Not started     | —                                    | No notification preferences UI yet           |
| 14| Admin & Observability          | Not started     | —                                    | No admin dashboard yet                       |

## What's Done

- [x] **Route protection middleware** — `src/middleware.ts` redirects unauthenticated → `/login`, authenticated → `/dashboard`
- [x] **Dashboard layout** — Sidebar nav (desktop) + bottom nav (mobile) + dynamic header + user info + logout
- [x] **Dashboard page** — Real-time stats from APIs, setup progress checklist, recent matches, run matching button
- [x] **CV management page** — View active CV with meta cards, parsed skills/roles badges, edit/create, version history
- [x] **Preferences page** — View mode with cards, full edit form (roles, locations, salary, experience, filters)
- [x] **Subscription page** — Current plan card, change plan grid, cancel, payment history
- [x] **Job matches page** — Filter by min%, shortlisted only, pagination, expandable job cards with score breakdown, shortlist toggle, mark viewed
- [x] **API clients** — All 6 backend modules covered (auth, cv, preferences, subscriptions, jobs, matching)

## What's Remaining (backend sections 11-14)

### Medium Priority
- [ ] **CSV export UI** — Download button for matched jobs CSV on dashboard
- [ ] **Notification preferences page** — Email frequency, notification channel settings

### Low Priority (section 14 + polish)
- [ ] **Admin dashboard** — User list, subscription stats, job ingestion health, queue status
- [ ] **Settings page** — Account settings, password change, delete account
- [ ] **Dark mode toggle** — Tailwind dark class already supported, needs UI toggle
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

### API Clients
| Client              | File                  | Backend Module       | Methods                                                          |
|---------------------|-----------------------|----------------------|------------------------------------------------------------------|
| `authApi`           | `lib/api/auth.ts`     | `modules/users`      | signup, login, verifyEmail, forgotPassword, resetPassword, getMe |
| `cvApi`             | `lib/api/cv.ts`       | `modules/cv`         | create, getActive, getById, getVersions, update, delete          |
| `preferencesApi`    | `lib/api/preferences.ts` | `modules/preferences` | create, get, update, delete                                  |
| `subscriptionsApi`  | `lib/api/subscriptions.ts` | `modules/subscriptions` | listPlans, getPlan, subscribe, getMySubscription, cancel, getPayments |
| `jobsApi`           | `lib/api/jobs.ts`     | `modules/jobs`       | list (with filters), getById, fetch (from Adzuna)                |
| `matchingApi`       | `lib/api/matching.ts` | `modules/matching`   | run, getBatches, getBatchById, getResults, toggleShortlist, markViewed |

### Not yet needed (backend modules not started)
- [ ] `lib/api/csv.ts` — CSV export download
- [ ] `lib/api/notifications.ts` — Notification preferences

## Conventions

- **"use client"** directive on all pages with interactivity (forms, state, effects)
- **Route groups** — `(auth)` and `(dashboard)` for layout separation, no URL impact
- **UI components** — shadcn pattern: Radix + Tailwind + CVA variants + `cn()` merge
- **Forms** — React Hook Form (+ Zod resolver where types are clean)
- **Imports** — `@/` alias maps to `src/`
- **Response parsing** — Expects `{ status: "success", data }` from backend
- **Auth cookie sync** — AuthContext sets/clears cookie alongside localStorage for middleware access

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
