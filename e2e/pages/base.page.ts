import type { Page } from "@playwright/test";

/**
 * Base Page Object Model class
 * Extend this for specific pages in your application
 */
export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async getTitle() {
    return await this.page.title();
  }
}
