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
setup("authenticate", async ({ page, request }) => {
  const testEmail = process.env.E2E_USERNAME || "missing-dotenv-var@email.com";
  const testPassword = process.env.E2E_PASSWORD || "missing-dotenv-var";

  console.log(`🔐 Authenticating as: ${testEmail}`);
  console.log(`   Password length: ${testPassword.length} characters`);

  // Validate test credentials before attempting login
  if (!testEmail.includes("@")) {
    throw new Error(`Invalid test email: ${testEmail}`);
  }
  if (testPassword.length < 6) {
    throw new Error(`Test password is too short (${testPassword.length} chars). Must be at least 6 characters.`);
  }

  // Verify server is reachable before attempting login
  try {
    const healthCheck = await request.get("/");
    console.log(`✅ Server is reachable (status: ${healthCheck.status()})`);
  } catch (error) {
    console.error("❌ Server is not reachable!");
    console.error(`   Error: ${error}`);
    console.error("   Make sure the dev server is running on http://localhost:4321");
    throw error;
  }

  await page.goto("/login");
  console.log("✅ Navigated to /login");

  // Wait for React component to hydrate
  await page.waitForSelector('input[name="email"]', { state: "visible" });

  // Wait for React hydration to complete (button should be enabled)
  await page.waitForFunction(
    () => {
      const button = document.querySelector('button[type="submit"]');
      return button && !button.hasAttribute("disabled");
    },
    { timeout: 5000 }
  );
  console.log("✅ React hydrated - form is interactive");

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

  // Check for client-side validation errors before submitting (with timeout to avoid hanging)
  const validationErrorLocator = page.locator(".text-destructive").first();
  const validationErrorCount = await validationErrorLocator.count();

  if (validationErrorCount > 0) {
    const validationError = await validationErrorLocator.textContent();
    if (validationError) {
      console.error(`❌ Client-side validation error: ${validationError}`);
      await page.screenshot({ path: "validation-error.png", fullPage: true });
      throw new Error(`Form validation failed: ${validationError}`);
    }
  }
  console.log("✅ No validation errors");

  // Submit and wait for navigation
  console.log("🚀 Submitting login form...");

  // Check if button is disabled
  const loginButton = page.getByRole("button", { name: /log in/i });
  const isDisabled = await loginButton.isDisabled();
  if (isDisabled) {
    console.error("❌ Login button is disabled!");
    await page.screenshot({ path: "button-disabled.png", fullPage: true });
    throw new Error("Login button is disabled - form might have validation errors");
  }

  // Listen for any response from the login API (not just 200)
  const loginResponsePromise = page.waitForResponse(
    (response) => {
      const isLoginAPI = response.url().includes("/api/auth/login");
      if (isLoginAPI) {
        console.log(`📡 Login API responded with status: ${response.status()}`);
      }
      return isLoginAPI;
    },
    { timeout: 15000 } // Increased timeout
  );

  // Click the login button
  await loginButton.click();

  // Wait for API response
  try {
    const response = await loginResponsePromise;
    const status = response.status();

    if (status === 200) {
      console.log("✅ Login API responded successfully");
    } else {
      // Log error details for non-200 responses
      const responseBody = await response.text();
      console.error(`❌ Login API returned status ${status}`);
      console.error(`   Response body: ${responseBody.substring(0, 200)}`);

      // Try to parse as JSON for better error message
      try {
        const errorData = JSON.parse(responseBody);
        console.error(`   Error: ${errorData.error?.message || "Unknown error"}`);
      } catch {
        // Not JSON, already logged the text
      }
    }
  } catch (error) {
    console.error("❌ Login API did not respond within 15 seconds");
    console.error(`   Error details: ${error}`);
    console.error("   Possible causes:");
    console.error("   - Server is not running at http://localhost:4321");
    console.error("   - API endpoint is blocked or not responding");
    console.error("   - Supabase credentials are missing or invalid");
    console.error("   - Network connectivity issue");

    // Take a screenshot to help debug
    await page.screenshot({ path: "login-api-timeout.png", fullPage: true });

    // Don't throw yet - let the redirect check below handle the final error
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
