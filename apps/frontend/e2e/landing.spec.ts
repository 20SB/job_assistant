import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("renders hero section with CTA buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Stop Searching.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Get Started for Free" })).toBeVisible();
    await expect(page.getByRole("link", { name: "How it works" })).toBeVisible();
  });

  test("'Get Started for Free' button navigates to /signup", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Get Started for Free" }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("pricing section shows plan cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Simple, transparent pricing" })).toBeVisible();
    await expect(page.getByText("Free")).toBeVisible();
    await expect(page.getByText("Starter")).toBeVisible();
    await expect(page.getByText("Pro")).toBeVisible();
  });

  test("FAQ items expand/collapse on click", async ({ page }) => {
    await page.goto("/");
    const faqItem = page.getByText("How does the AI matching algorithm work?");
    await expect(faqItem).toBeVisible();
    await faqItem.click();
    // After clicking, the details element should open and show answer content
    const details = page.locator("details").filter({ hasText: "AI matching algorithm" });
    await expect(details).toHaveAttribute("open", "");
  });

  test("footer links are present", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Privacy Policy")).toBeVisible();
    await expect(page.getByText("Terms of Service")).toBeVisible();
    await expect(page.getByText("Contact")).toBeVisible();
  });
});
