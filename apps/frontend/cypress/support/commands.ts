import {
  mockUser,
  mockAdminUser,
  mockToken,
  mockLoginResponse,
  mockSignupResponse,
  mockCvSnapshot,
  mockCvVersions,
  mockPreferences,
  mockPlans,
  mockSubscription,
  mockPayments,
  mockJob,
  mockMatchResults,
  mockBatches,
  mockExports,
  mockNotificationPrefs,
  mockNotifications,
  mockAdminStats,
  mockAdminUsers,
  mockJobFetchLogs,
  mockMatchingLogs,
  mockEmailLogs,
  mockTasks,
} from "./test-data";

// ─── Type declarations ───────────────────────────────────────────────

type RouteOverride = {
  status?: number;
  body?: unknown;
};

type Overrides = Record<string, RouteOverride>;

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsUser(): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      setupMockApi(overrides?: Overrides): Chainable<void>;
    }
  }
}

// ─── Auth Commands ───────────────────────────────────────────────────

Cypress.Commands.add("loginAsUser", () => {
  cy.setCookie("auth_token", mockToken, { path: "/" });
  Cypress.env("_authToken", mockToken);
  cy.intercept({ method: "GET", pathname: "/api/users/me" }, {
    statusCode: 200,
    body: { status: "success", data: mockUser },
  }).as("getMe");
});

Cypress.Commands.add("loginAsAdmin", () => {
  cy.setCookie("auth_token", mockToken, { path: "/" });
  Cypress.env("_authToken", mockToken);
  cy.intercept({ method: "GET", pathname: "/api/users/me" }, {
    statusCode: 200,
    body: { status: "success", data: mockAdminUser },
  }).as("getMe");
});

// ─── Mock API Command ────────────────────────────────────────────────

Cypress.Commands.add("setupMockApi", (overrides: Overrides = {}) => {
  const defaults: Record<string, { status: number; body: unknown }> = {
    // Auth
    "POST /api/users/login": { status: 200, body: mockLoginResponse },
    "POST /api/users/signup": { status: 200, body: mockSignupResponse },
    "GET /api/users/me": {
      status: 200,
      body: { status: "success", data: mockUser },
    },
    "PATCH /api/users/me": {
      status: 200,
      body: { status: "success", data: mockUser },
    },

    // CV
    "GET /api/cv/active": {
      status: 200,
      body: { status: "success", data: mockCvSnapshot },
    },
    "GET /api/cv/versions": {
      status: 200,
      body: { status: "success", data: mockCvVersions },
    },
    "POST /api/cv": {
      status: 201,
      body: { status: "success", data: mockCvSnapshot },
    },
    "PATCH /api/cv": {
      status: 200,
      body: { status: "success", data: { ...mockCvSnapshot, version: 2 } },
    },

    // Preferences
    "GET /api/preferences": {
      status: 200,
      body: { status: "success", data: mockPreferences },
    },
    "POST /api/preferences": {
      status: 201,
      body: { status: "success", data: mockPreferences },
    },
    "PATCH /api/preferences": {
      status: 200,
      body: { status: "success", data: mockPreferences },
    },
    "DELETE /api/preferences": {
      status: 200,
      body: { status: "success", data: null },
    },

    // Subscriptions
    "GET /api/subscriptions/plans": {
      status: 200,
      body: { status: "success", data: mockPlans },
    },
    "GET /api/subscriptions/me": {
      status: 200,
      body: { status: "success", data: mockSubscription },
    },
    "POST /api/subscriptions/subscribe": {
      status: 200,
      body: { status: "success", data: mockSubscription },
    },
    "POST /api/subscriptions/cancel": {
      status: 200,
      body: { status: "success", data: { ...mockSubscription, status: "cancelled" } },
    },
    "GET /api/subscriptions/payments": {
      status: 200,
      body: { status: "success", data: mockPayments },
    },

    // Matching
    "POST /api/matching/run": {
      status: 200,
      body: { status: "success", data: { batchId: "batch-1", message: "Matching started" } },
    },
    "GET /api/matching/batches": {
      status: 200,
      body: { status: "success", data: mockBatches },
    },
    "GET /api/matching/results": {
      status: 200,
      body: {
        status: "success",
        data: { matches: mockMatchResults, total: 2, page: 1, limit: 10 },
      },
    },

    // CSV
    "POST /api/csv/generate": {
      status: 200,
      body: { status: "success", data: { message: "CSV generated successfully", export: mockExports[0] } },
    },
    "GET /api/csv/exports": {
      status: 200,
      body: {
        status: "success",
        data: { exports: mockExports, total: 2, page: 1, limit: 10 },
      },
    },

    // Notifications
    "GET /api/notifications/preferences": {
      status: 200,
      body: { status: "success", data: mockNotificationPrefs },
    },
    "POST /api/notifications/preferences": {
      status: 201,
      body: { status: "success", data: mockNotificationPrefs },
    },
    "PATCH /api/notifications/preferences": {
      status: 200,
      body: { status: "success", data: mockNotificationPrefs },
    },
    "DELETE /api/notifications/preferences": {
      status: 200,
      body: { status: "success", data: null },
    },
    "GET /api/notifications": {
      status: 200,
      body: {
        status: "success",
        data: { notifications: mockNotifications, total: 2, page: 1, limit: 10 },
      },
    },

    // Admin — stats uses nested DashboardStats format expected by frontend
    "GET /api/admin/stats": {
      status: 200,
      body: {
        status: "success",
        data: {
          users: { total: mockAdminStats.totalUsers, active: mockAdminStats.activeUsers },
          subscriptions: mockAdminStats.subscriptionBreakdown,
          jobs: { total: mockAdminStats.totalJobs },
          tasks: { failedLast24h: mockAdminStats.failedTasks24h },
          jobFetch: { successRate: mockAdminStats.jobFetchSuccessRate },
          matching: { totalBatches: mockAdminStats.matchBatches },
        },
      },
    },
    "GET /api/admin/users": {
      status: 200,
      body: {
        status: "success",
        data: { users: mockAdminUsers, total: 2, page: 1, limit: 10 },
      },
    },
    // Frontend API client uses these paths (not /api/admin/logs/*)
    "GET /api/admin/job-fetch-logs": {
      status: 200,
      body: {
        status: "success",
        data: { logs: mockJobFetchLogs, total: 1, page: 1, limit: 10 },
      },
    },
    "GET /api/admin/matching-logs": {
      status: 200,
      body: {
        status: "success",
        data: { logs: mockMatchingLogs, total: 1, page: 1, limit: 10 },
      },
    },
    "GET /api/admin/email-delivery-logs": {
      status: 200,
      body: {
        status: "success",
        data: { logs: mockEmailLogs, total: 1, page: 1, limit: 10 },
      },
    },
    "GET /api/admin/tasks": {
      status: 200,
      body: {
        status: "success",
        data: { tasks: mockTasks, total: 1, page: 1, limit: 10 },
      },
    },

    // Jobs
    "GET /api/jobs": {
      status: 200,
      body: {
        status: "success",
        data: { jobs: [mockJob], total: 1, page: 1, limit: 10 },
      },
    },
    "POST /api/jobs/fetch": {
      status: 200,
      body: { status: "success", data: { message: "Job fetch started" } },
    },
  };

  // Merge overrides
  const routes = { ...defaults };
  for (const [key, override] of Object.entries(overrides)) {
    routes[key] = {
      status: override.status ?? defaults[key]?.status ?? 200,
      body: override.body ?? defaults[key]?.body,
    };
  }

  // Register each route using { method, pathname } object matcher for reliability
  for (const [key, { status, body }] of Object.entries(routes)) {
    const spaceIdx = key.indexOf(" ");
    const method = key.substring(0, spaceIdx);
    const pathname = key.substring(spaceIdx + 1);
    cy.intercept({ method, pathname }, {
      statusCode: status,
      body,
    });
  }

  // Parameterized routes using regex for wildcard segments
  cy.intercept({ method: "PATCH", pathname: /\/api\/matching\/[^/]+\/shortlist/ }, {
    statusCode: 200,
    body: { status: "success", data: { isShortlisted: true } },
  });
  cy.intercept({ method: "PATCH", pathname: /\/api\/matching\/[^/]+\/viewed/ }, {
    statusCode: 200,
    body: { status: "success", data: { viewedAt: new Date().toISOString() } },
  });
  cy.intercept({ method: "GET", pathname: /\/api\/csv\/[^/]+\/download/ }, {
    headers: { "content-type": "text/csv" },
    body: "title,company,location\nSenior React Dev,TechCorp,London",
  });
  cy.intercept({ method: "PATCH", pathname: /\/api\/csv\/[^/]+\/archive/ }, {
    statusCode: 200,
    body: { status: "success", data: null },
  });
});
