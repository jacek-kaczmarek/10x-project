import { test, expect } from "@playwright/test";

test.describe("Example E2E Test", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");

    // Example assertion - update based on your actual homepage
    await expect(page).toHaveTitle(/Cards Generator/i);
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Example navigation - update based on your actual UI
    const loginLink = page.getByRole("link", { name: /login/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*login/);
    }
  });
});
