import { test, expect } from "@playwright/test";
import { setupMockApi } from "../helpers/mock-api.js";

test.describe("Signup page", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
  });

  test("renders form with email, password, and confirm fields", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
    await expect(page.getByText("Enter your email below to create your account")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  test("successful signup redirects to /verify", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Email").fill("new@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("**/verify");
    await expect(page).toHaveURL(/\/verify/);
  });

  test("password mismatch shows validation error", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("different456");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Passwords don't match")).toBeVisible();
  });

  test("duplicate email shows error", async ({ page }) => {
    await setupMockApi(page, {
      "POST /api/users/signup": {
        status: 409,
        body: { status: "error", message: "Email already exists" },
      },
    });
    await page.goto("/signup");
    await page.getByLabel("Email").fill("existing@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Email already exists")).toBeVisible();
  });

  test("'Sign in' link navigates to /login", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("short password shows validation error", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password", { exact: true }).fill("short");
    await page.getByLabel("Confirm Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });
});
