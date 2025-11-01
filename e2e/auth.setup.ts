/* eslint-disable no-console */
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

  console.log(`🔐 Authenticating as: ${testEmail}`);

  await page.goto("/login");
  console.log("✅ Navigated to /login");

  // Wait for React component to hydrate
  await page.waitForSelector('input[name="email"]', { state: "visible" });

  // Fill in login form - use type instead of fill to trigger React onChange events
  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');

  await emailInput.click();
  await emailInput.fill(testEmail);
  await passwordInput.click();
  await passwordInput.fill(testPassword);
  console.log("✅ Filled login form");

  // Wait a bit for React state to update
  await page.waitForTimeout(500);

  // Submit and wait for navigation
  console.log("🚀 Submitting login form...");

  // Listen for the API response to ensure cookies are set
  const loginResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/auth/login") && response.status() === 200,
    { timeout: 10000 }
  );

  await page.getByRole("button", { name: /log in/i }).click();

  // Wait for API response first
  try {
    await loginResponsePromise;
    console.log("✅ Login API responded successfully");
  } catch {
    console.error("❌ Login API did not respond");
  }

  // Give browser time to process cookies
  await page.waitForTimeout(1000);

  // Wait for successful login (redirect to /generate)
  // Increased timeout to handle slow API/middleware responses
  console.log("⏳ Waiting for redirect to /generate...");

  try {
    await page.waitForURL("**/generate", {
      timeout: 30000,
    });
    console.log("✅ Redirected to /generate");
  } catch {
    // If redirect fails, check for error messages
    const currentUrl = page.url();
    const errorMessage = await page.locator(".text-destructive").first().textContent();

    console.error("❌ Login failed or redirect timeout:");
    console.error("   Current URL:", currentUrl);
    console.error("   Error message:", errorMessage || "No error message displayed");

    // Check if we're stuck in redirect loop
    if (currentUrl.includes("/login")) {
      console.error("   ⚠️  Still on login page - possible auth cookie issue");
    }

    // Log all cookies for debugging
    const cookies = await page.context().cookies();
    console.error("   Cookies:", cookies.map((c) => `${c.name}=${c.value.substring(0, 20)}...`).join(", "));

    // Take screenshot for debugging
    await page.screenshot({ path: "login-failure.png", fullPage: true });
    throw new Error(`Login failed: ${errorMessage || "Timeout waiting for redirect to /generate"}`);
  }

  // Verify we're actually logged in by checking for expected elements
  await expect(page.locator('[data-test-id="generation-form"]')).toBeVisible();
  console.log("✅ Generation form visible");

  // Save signed-in state to be reused in all tests
  await page.context().storageState({ path: authFile });
  console.log("✅ Auth state saved");
});
