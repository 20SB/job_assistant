import { Page } from "@playwright/test";
import * as td from "./test-data.js";

type RouteOverride = {
  status?: number;
  body?: unknown;
};

type Overrides = Record<string, RouteOverride>;

/**
 * Sets up mock API route handlers for all backend endpoints.
 * Intercepts fetch calls to localhost:3001/api/* and returns mock data.
 *
 * @param page - Playwright page
 * @param overrides - Map of "METHOD /api/path" → { status, body } to override defaults
 * @returns helper with mockError() for dynamic error injection
 */
export async function setupMockApi(page: Page, overrides: Overrides = {}) {
  const defaults: Record<string, { status: number; body: unknown }> = {
    // Auth
    "POST /api/users/login": { status: 200, body: td.mockLoginResponse },
    "POST /api/users/signup": { status: 200, body: td.mockSignupResponse },
    "GET /api/users/me": {
      status: 200,
      body: { status: "success", data: td.mockUser },
    },
    "PATCH /api/users/me": {
      status: 200,
      body: { status: "success", data: td.mockUser },
    },

    // CV
    "GET /api/cv/active": {
      status: 200,
      body: { status: "success", data: td.mockCvSnapshot },
    },
    "GET /api/cv/versions": {
      status: 200,
      body: { status: "success", data: td.mockCvVersions },
    },
    "POST /api/cv": {
      status: 201,
      body: { status: "success", data: td.mockCvSnapshot },
    },
    "PATCH /api/cv": {
      status: 200,
      body: { status: "success", data: { ...td.mockCvSnapshot, version: 2 } },
    },

    // Preferences
    "GET /api/preferences": {
      status: 200,
      body: { status: "success", data: td.mockPreferences },
    },
    "POST /api/preferences": {
      status: 201,
      body: { status: "success", data: td.mockPreferences },
    },
    "PATCH /api/preferences": {
      status: 200,
      body: { status: "success", data: td.mockPreferences },
    },
    "DELETE /api/preferences": {
      status: 200,
      body: { status: "success", data: null },
    },

    // Subscriptions
    "GET /api/subscriptions/plans": {
      status: 200,
      body: { status: "success", data: td.mockPlans },
    },
    "GET /api/subscriptions/me": {
      status: 200,
      body: { status: "success", data: td.mockSubscription },
    },
    "POST /api/subscriptions/subscribe": {
      status: 200,
      body: { status: "success", data: td.mockSubscription },
    },
    "POST /api/subscriptions/cancel": {
      status: 200,
      body: { status: "success", data: { ...td.mockSubscription, status: "cancelled" } },
    },
    "GET /api/subscriptions/payments": {
      status: 200,
      body: { status: "success", data: td.mockPayments },
    },

    // Matching
    "POST /api/matching/run": {
      status: 200,
      body: { status: "success", data: { batchId: "batch-1", message: "Matching started" } },
    },
    "GET /api/matching/batches": {
      status: 200,
      body: { status: "success", data: td.mockBatches },
    },
    "GET /api/matching/results": {
      status: 200,
      body: {
        status: "success",
        data: { matches: td.mockMatchResults, total: 2, page: 1, limit: 10 },
      },
    },
    "PATCH /api/matching/shortlist": {
      status: 200,
      body: { status: "success", data: { isShortlisted: true } },
    },
    "PATCH /api/matching/viewed": {
      status: 200,
      body: { status: "success", data: { viewedAt: new Date().toISOString() } },
    },

    // CSV
    "POST /api/csv/generate": {
      status: 200,
      body: { status: "success", data: { message: "CSV generated successfully", export: td.mockExports[0] } },
    },
    "GET /api/csv/exports": {
      status: 200,
      body: {
        status: "success",
        data: { exports: td.mockExports, total: 2, page: 1, limit: 10 },
      },
    },

    // Notifications
    "GET /api/notifications/preferences": {
      status: 200,
      body: { status: "success", data: td.mockNotificationPrefs },
    },
    "POST /api/notifications/preferences": {
      status: 201,
      body: { status: "success", data: td.mockNotificationPrefs },
    },
    "PATCH /api/notifications/preferences": {
      status: 200,
      body: { status: "success", data: td.mockNotificationPrefs },
    },
    "DELETE /api/notifications/preferences": {
      status: 200,
      body: { status: "success", data: null },
    },
    "GET /api/notifications": {
      status: 200,
      body: {
        status: "success",
        data: { notifications: td.mockNotifications, total: 2, page: 1, limit: 10 },
      },
    },

    // Admin
    "GET /api/admin/stats": {
      status: 200,
      body: { status: "success", data: td.mockAdminStats },
    },
    "GET /api/admin/users": {
      status: 200,
      body: {
        status: "success",
        data: { users: td.mockAdminUsers, total: 2, page: 1, limit: 10 },
      },
    },
    "GET /api/admin/logs/job-fetch": {
      status: 200,
      body: {
        status: "success",
        data: { logs: td.mockJobFetchLogs, total: 1, page: 1, limit: 10 },
      },
    },
    "GET /api/admin/logs/matching": {
      status: 200,
      body: {
        status: "success",
        data: { logs: td.mockMatchingLogs, total: 1, page: 1, limit: 10 },
      },
    },
    "GET /api/admin/logs/email": {
      status: 200,
      body: {
        status: "success",
        data: { logs: td.mockEmailLogs, total: 1, page: 1, limit: 10 },
      },
    },
    "GET /api/admin/tasks": {
      status: 200,
      body: {
        status: "success",
        data: { tasks: td.mockTasks, total: 1, page: 1, limit: 10 },
      },
    },

    // Jobs (direct listing)
    "GET /api/jobs": {
      status: 200,
      body: {
        status: "success",
        data: { jobs: [td.mockJob], total: 1, page: 1, limit: 10 },
      },
    },
    "POST /api/jobs/fetch": {
      status: 200,
      body: { status: "success", data: { message: "Job fetch started" } },
    },
  };

  // Merge overrides into defaults
  const routes = { ...defaults };
  for (const [key, override] of Object.entries(overrides)) {
    routes[key] = {
      status: override.status ?? defaults[key]?.status ?? 200,
      body: override.body ?? defaults[key]?.body,
    };
  }

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname;

    // Try exact match first: "METHOD /api/path"
    let key = `${method} ${path}`;
    let match = routes[key];

    // If no exact match, try matching with pattern (for parameterized routes)
    if (!match) {
      for (const routeKey of Object.keys(routes)) {
        const [routeMethod, routePath] = routeKey.split(" ");
        if (routeMethod !== method) continue;

        // Match parameterized paths like /api/matching/:id/shortlist
        if (path.match(new RegExp(`^${routePath.replace(/:[^/]+/g, "[^/]+")}$`))) {
          match = routes[routeKey];
          break;
        }

        // Match paths that start with the route path (for query params, etc.)
        if (path.startsWith(routePath) && routePath !== "/api/") {
          match = routes[routeKey];
          break;
        }
      }
    }

    // Special handling for parameterized shortlist/viewed routes
    if (!match && method === "PATCH" && path.includes("/shortlist")) {
      match = routes["PATCH /api/matching/shortlist"];
    }
    if (!match && method === "PATCH" && path.includes("/viewed")) {
      match = routes["PATCH /api/matching/viewed"];
    }

    // Special handling for CSV download (returns blob)
    if (method === "GET" && path.match(/\/api\/csv\/[^/]+\/download/)) {
      await route.fulfill({
        status: 200,
        contentType: "text/csv",
        body: "title,company,location\nSenior React Dev,TechCorp,London",
      });
      return;
    }

    if (match) {
      await route.fulfill({
        status: match.status,
        contentType: "application/json",
        body: JSON.stringify(match.body),
      });
    } else {
      // Fallback: return 404 for unmatched API routes
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ status: "error", message: `Mock not found: ${method} ${path}` }),
      });
    }
  });

  return {
    /** Dynamically override a route to return an error */
    mockError: async (method: string, path: string, status: number, message: string) => {
      routes[`${method} ${path}`] = {
        status,
        body: { status: "error", message },
      };
    },
  };
}
