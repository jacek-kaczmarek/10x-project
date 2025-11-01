import { test as setup, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, "../playwright/.auth/user.json");

/**
 * Global authentication setup
 * Runs once before all tests to establish authenticated session
 * The session state is saved and reused across all test files
 */
setup("authenticate", async ({ page }) => {
  const testEmail = process.env.E2E_USERNAME || "missing-dotenv-var@email.com";
  const testPassword = process.env.E2E_PASSWORD || "missing-dotenv-var";

  await page.goto("/login");

  // Wait for React component to hydrate
  await page.waitForSelector('input[name="email"]', { state: "visible" });

  // Fill in login form - use type instead of fill to trigger React onChange events
  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');

  await emailInput.click();
  await emailInput.fill(testEmail);
  await passwordInput.click();
  await passwordInput.fill(testPassword);

  // Wait a bit for React state to update
  await page.waitForTimeout(500);

  // Submit and wait for navigation
  await page.getByRole("button", { name: /log in/i }).click();

  // Wait for successful login (redirect to /generate)
  await page.waitForURL("**/generate", {
    timeout: 15000,
  });

  // Verify we're actually logged in by checking for expected elements
  await expect(page.locator('[data-test-id="generation-form"]')).toBeVisible();

  // Save signed-in state to be reused in all tests
  await page.context().storageState({ path: authFile });
});
