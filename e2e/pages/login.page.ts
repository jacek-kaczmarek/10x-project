import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Page Object Model for Login Page
 * Update selectors based on your actual login page implementation
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByRole("textbox", { name: /email/i });
    this.passwordInput = page.getByRole("textbox", { name: /password/i });
    this.submitButton = page.getByRole("button", { name: /log in/i });
    this.errorMessage = page.getByRole("alert");
  }

  async goto() {
    await super.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}
