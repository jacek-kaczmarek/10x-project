import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, "playwright/.auth/user.json");

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI.*/
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [["list"], ["html"]] : "html",

  /* Global timeout for all tests - increased for slow OpenRouter API in CI */
  timeout: 90000, // 90 seconds per test (allows time for API calls)

  /* Global teardown - runs once after all tests */
  globalTeardown: "./e2e/global.teardown.ts",

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || "http://localhost:4321",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project - runs once to authenticate
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      timeout: 90000, // 90s timeout for auth setup (handles slow CI/Supabase with warmup)
      retries: process.env.CI ? 2 : 0, // Retry auth setup on CI for transient failures
    },
    // Authenticated tests - reuse auth state from setup
    {
      name: "chromium",
      // ensure to include / run the flashcards test
      testMatch: /.*\.spec\.ts/,
      //testIgnore: /.*\.(setup|teardown)\.ts/, // Exclude setup/teardown files from test runs
      use: {
        ...devices["Desktop Chrome"],
        // Use signed-in state from setup
        storageState: authFile,
      },
      dependencies: ["setup"], // Run setup project first
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev:e2e",
    url: process.env.BASE_URL || "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
