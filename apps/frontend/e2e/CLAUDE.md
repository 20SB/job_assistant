# E2E Tests — Playwright

## Overview

Playwright E2E tests for the Job Assistant frontend. All backend API calls are mocked via `page.route()` — no running backend required.

## Tech Stack

- **Framework**: Playwright Test
- **Browser**: Chromium (desktop) + Pixel 5 (mobile)
- **Mocking**: `page.route()` intercepts all `**/api/**` requests
- **Auth**: Token injected via `localStorage` + cookie before navigation

## How to Run

```bash
# From apps/frontend/
npm run test:e2e                          # Run all tests (headless)
npm run test:e2e:headed                   # Run in browser (chromium only)
npm run test:e2e:ui                       # Interactive UI mode
npx playwright test e2e/auth/login.spec.ts  # Run single file
npx playwright show-report                # View HTML report
```

## Test Structure

```
e2e/
  helpers/
    mock-api.ts               — API route interception (setupMockApi)
    auth.ts                   — Auth state setup (loginAsUser, loginAsAdmin)
    test-data.ts              — Mock response data for all endpoints
  landing.spec.ts             — Landing page (hero, pricing, FAQ, footer)
  auth/
    login.spec.ts             — Login form, validation, redirect
    signup.spec.ts            — Signup form, validation, errors
    route-protection.spec.ts  — Auth middleware redirect tests
  onboarding.spec.ts          — 3-step onboarding wizard
  dashboard/
    dashboard.spec.ts         — Main dashboard stats, matches, exports
    cv.spec.ts                — CV view, edit, versions
    preferences.spec.ts       — Preferences view/edit
    subscription.spec.ts      — Plans, cancel, payment history
    jobs.spec.ts              — Job matches, filters, shortlist, pagination
    exports.spec.ts           — CSV generate, download, archive
    notifications.spec.ts     — Notification prefs, history, filters
    settings.spec.ts          — Email/password update, account info
  admin.spec.ts               — Admin dashboard tabs (stats, users, logs, tasks)
  cross-cutting/
    navigation.spec.ts        — Sidebar, active state, logout, dark mode
    responsive.spec.ts        — Desktop vs mobile layout
```

## How to Add New Tests

1. **Create spec file** in the appropriate directory
2. **Import helpers**: `loginAsUser`, `setupMockApi`, test data
3. **Standard pattern**:
   ```typescript
   import { test, expect } from "@playwright/test";
   import { loginAsUser } from "../helpers/auth.js";
   import { setupMockApi } from "../helpers/mock-api.js";

   test.describe("Page name", () => {
     test.beforeEach(async ({ page }) => {
       await loginAsUser(page);
       await setupMockApi(page);
     });

     test("test description", async ({ page }) => {
       await page.goto("/page-path");
       await expect(page.getByText("Expected text")).toBeVisible();
     });
   });
   ```
4. **Override API responses** for error/edge cases:
   ```typescript
   await setupMockApi(page, {
     "GET /api/endpoint": { status: 404, body: { status: "error", message: "Not found" } },
   });
   ```

## Locator Strategy

Priority order:
1. `id` attributes — `page.locator("#email")`
2. Role + text — `page.getByRole("button", { name: "Sign in" })`
3. Label text — `page.getByLabel("Email")`
4. Text content — `page.getByText("No matches yet")`
5. CSS selectors — `page.locator("aside nav a")` (last resort)

## Key Conventions

- Auth helpers must be called **before** `page.goto()` (middleware needs cookie)
- `setupMockApi` can be called multiple times — later calls override earlier routes
- Public pages (landing, login, signup) don't need `loginAsUser`
- Admin tests use `loginAsAdmin` which sets `role: "admin"`
