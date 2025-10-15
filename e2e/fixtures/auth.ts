import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";

interface AuthFixtures {
  authenticatedPage: Page;
}

/**
 * Example fixture for authenticated tests
 * Extend this to create reusable test contexts
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, useFixture) => {
    // Setup: Login before each test
    await page.goto("/login");
    // Add your login logic here
    // await page.fill('[name="email"]', 'test@example.com');
    // await page.fill('[name="password"]', 'password');
    // await page.click('button[type="submit"]');

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await useFixture(page);

    // Teardown: Logout after each test
    // Add logout logic if needed
  },
});

export { expect } from "@playwright/test";
