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
  // Set a longer timeout for this test to handle slow CI environments
  // Includes time for: warmup (2s) + page load (5s) + form fill (2s) + API (30s) + redirect (20s) = ~60s
  setup.setTimeout(90000); // 90 seconds
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

  // Verify server is reachable and warm up Supabase connection
  console.log("🔥 Warming up server and Supabase connection...");
  try {
    // Make 2-3 warmup requests to ensure Supabase client is ready
    // This helps avoid cold start timeouts in CI environments
    for (let i = 0; i < 3; i++) {
      const healthCheck = await request.get("/");
      if (i === 0) {
        console.log(`✅ Server is reachable (status: ${healthCheck.status()})`);
      }
      // Wait a bit between warmup requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    console.log("✅ Warmup completed - Supabase connection established");
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

  // Fill in login form - use pressSequentially to properly trigger React onChange events
  // Playwright's fill() doesn't trigger onChange for controlled React inputs
  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');

  await emailInput.click();
  await emailInput.clear();
  await emailInput.pressSequentially(testEmail, { delay: 50 });

  await passwordInput.click();
  await passwordInput.clear();
  await passwordInput.pressSequentially(testPassword, { delay: 50 });
  console.log("✅ Filled login form");

  // Wait for React state to update and re-render
  await page.waitForTimeout(300);

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
    { timeout: 30000 } // 30s timeout for API response (handles slow CI/Supabase even after warmup)
  );

  // Click the login button
  await loginButton.click();

  // Wait for API response with proper error handling
  let loginSucceeded = false;
  try {
    const response = await loginResponsePromise;
    const status = response.status();

    if (status === 200) {
      console.log("✅ Login API responded successfully");
      loginSucceeded = true;
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

      await page.screenshot({ path: "login-api-error.png", fullPage: true });
      throw new Error(`Login API returned error status: ${status}`);
    }
  } catch (error) {
    if (!loginSucceeded) {
      console.error("❌ Login API did not respond within 30 seconds");
      console.error(`   Error details: ${error}`);
      console.error("   Possible causes:");
      console.error("   - Server is not running at http://localhost:4321");
      console.error("   - API endpoint is blocked or not responding");
      console.error("   - Supabase API is slow or timing out");
      console.error("   - Network connectivity issue in CI environment");

      // Take a screenshot to help debug
      try {
        await page.screenshot({ path: "login-api-timeout.png", fullPage: true });
      } catch {
        // Ignore screenshot errors if page is closed
      }

      // Fail fast - don't continue if API didn't respond
      throw new Error(`Login API timeout: ${error}`);
    }
  }

  // Give browser time to process cookies and client-side redirect
  await page.waitForTimeout(1000);

  // Wait for successful login (redirect to /generate)
  console.log("⏳ Waiting for redirect to /generate...");

  try {
    await page.waitForURL("**/generate", {
      timeout: 20000, // Reduced from 30s since we already waited for API
    });
    console.log("✅ Redirected to /generate");
  } catch (redirectError) {
    // Defensive check: ensure page is still open before accessing it
    if (page.isClosed()) {
      console.error("❌ Page was closed before redirect completed");
      throw new Error("Test timeout exceeded - page closed during redirect");
    }

    // If redirect fails, check for error messages
    const currentUrl = page.url();
    let errorMessage = null;

    try {
      errorMessage = await page.locator(".text-destructive").first().textContent({ timeout: 2000 });
    } catch {
      // No error message found, that's okay
    }

    console.error("❌ Login failed or redirect timeout:");
    console.error("   Current URL:", currentUrl);
    console.error("   Error message:", errorMessage || "No error message displayed");

    // Check if we're stuck in redirect loop
    if (currentUrl.includes("/login")) {
      console.error("   ⚠️  Still on login page - possible auth cookie issue");
    }

    // Log all cookies for debugging
    try {
      const cookies = await page.context().cookies();
      console.error("   Cookies:", cookies.map((c) => `${c.name}=${c.value.substring(0, 20)}...`).join(", "));
    } catch {
      console.error("   Could not retrieve cookies");
    }

    // Take screenshot for debugging
    try {
      await page.screenshot({ path: "login-failure.png", fullPage: true });
    } catch {
      // Ignore screenshot errors if page is closed
    }

    throw new Error(`Login redirect failed: ${errorMessage || redirectError}`);
  }

  // Verify we're actually logged in by checking for expected elements
  await expect(page.locator('[data-test-id="generation-form"]')).toBeVisible();
  console.log("✅ Generation form visible");

  // Save signed-in state to be reused in all tests
  await page.context().storageState({ path: authFile });
  console.log("✅ Auth state saved");
});
