import { test, expect } from "@playwright/test";
import { setupMockApi } from "../helpers/mock-api.js";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
  });

  test("renders form with email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByText("Enter your email and password to sign in")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("successful login redirects to /dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("invalid credentials show error message", async ({ page }) => {
    await setupMockApi(page, {
      "POST /api/users/login": {
        status: 401,
        body: { status: "error", message: "Invalid credentials" },
      },
    });
    await page.goto("/login");
    await page.getByLabel("Email").fill("bad@test.com");
    await page.getByLabel("Password").fill("wrongpass");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid credentials")).toBeVisible();
  });

  test("empty email shows validation error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email address")).toBeVisible();
  });

  test("empty password shows validation error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("'Sign up' link navigates to /signup", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("'Forgot password?' link is present", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
  });
});
