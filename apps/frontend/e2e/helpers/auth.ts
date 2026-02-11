import { Page } from "@playwright/test";
import { mockUser, mockAdminUser, mockToken } from "./test-data.js";

/**
 * Sets up authentication state as a regular user.
 * Must be called BEFORE page.goto() so middleware sees the cookie.
 */
export async function loginAsUser(page: Page) {
  // Set localStorage token via addInitScript (runs before any page JS)
  await page.addInitScript(
    ({ token, key }: { token: string; key: string }) => {
      localStorage.setItem(key, token);
    },
    { token: mockToken, key: "auth_token" },
  );

  // Set the cookie so Next.js middleware sees it server-side
  await page.context().addCookies([
    {
      name: "auth_token",
      value: mockToken,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      sameSite: "Lax",
    },
  ]);

  // Mock the /api/users/me endpoint to return user data
  await page.route("**/api/users/me", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "success", data: mockUser }),
      });
    } else {
      await route.fallback();
    }
  });
}

/**
 * Sets up authentication state as an admin user.
 * Must be called BEFORE page.goto() so middleware sees the cookie.
 */
export async function loginAsAdmin(page: Page) {
  await page.addInitScript(
    ({ token, key }: { token: string; key: string }) => {
      localStorage.setItem(key, token);
    },
    { token: mockToken, key: "auth_token" },
  );

  await page.context().addCookies([
    {
      name: "auth_token",
      value: mockToken,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      sameSite: "Lax",
    },
  ]);

  await page.route("**/api/users/me", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "success", data: mockAdminUser }),
      });
    } else {
      await route.fallback();
    }
  });
}
