import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Page Object Model for Generate Flashcards Page
 * Handles flashcard generation workflow including form, progress, proposals, and saving
 */
export class GeneratePage extends BasePage {
  // Form elements
  readonly sourceTextInput: Locator;
  readonly submitButton: Locator;

  // Progress elements
  readonly progressContainer: Locator;
  readonly progressValue: Locator;
  readonly progressBar: Locator;

  // Proposals list
  readonly proposalsList: Locator;

  // Save actions
  readonly saveActionsContainer: Locator;
  readonly saveAllButton: Locator;
  readonly saveAcceptedButton: Locator;

  constructor(page: Page) {
    super(page);

    // Form elements
    this.sourceTextInput = page.locator('[data-test-id="generation-source-text-input"]');
    this.submitButton = page.locator('[data-test-id="generation-submit-button"]');

    // Progress elements
    this.progressContainer = page.locator('[data-test-id="generation-progress-container"]');
    this.progressValue = page.locator('[data-test-id="generation-progress-value"]');
    this.progressBar = page.locator('[data-test-id="generation-progress-bar"]');

    // Proposals list
    this.proposalsList = page.locator('[data-test-id="flashcard-proposals-list"]');

    // Save actions
    this.saveActionsContainer = page.locator('[data-test-id="flashcard-save-actions"]');
    this.saveAllButton = page.locator('[data-test-id="flashcard-save-all-button"]');
    this.saveAcceptedButton = page.locator('[data-test-id="flashcard-save-accepted-button"]');
  }

  async goto() {
    await super.goto("/generate");
  }

  /**
   * Fill source text for flashcard generation
   * Uses pressSequentially() to simulate real typing and trigger React onChange
   * @param text - Source text (must be 1000-10000 characters)
   */
  async fillSourceText(text: string) {
    // Click to focus the textarea first
    await this.sourceTextInput.click();
    // Clear any existing text
    await this.sourceTextInput.clear();
    // Use pressSequentially to type character by character (triggers React onChange)
    await this.sourceTextInput.pressSequentially(text, { delay: 0 });
  }

  async quickfillSourceText(text: string) {
    // Click to focus the textarea first
    await this.sourceTextInput.click();
    // Clear any existing text
    await this.sourceTextInput.clear();
    // Use pressSequentially to type character by character (triggers React onChange)
    await this.sourceTextInput.fill(text);
  }

  /**
   * Submit generation form
   */
  async submitGeneration() {
    // Wait for button to be enabled before clicking
    await this.submitButton.waitFor({ state: "visible" });
    const buttonHandle = await this.submitButton.elementHandle();
    if (buttonHandle) {
      await this.page.waitForFunction((button) => !button.hasAttribute("disabled"), buttonHandle);
    }
    await this.submitButton.click();
  }

  /**
   * Generate flashcards with source text (combined action)
   * @param text - Source text (must be 1000-10000 characters)
   */
  async generateFlashcards(text: string) {
    await this.fillSourceText(text);
    await this.submitGeneration();
  }

  /**
   * Wait for generation to complete
   * Waits for progress container to disappear and proposals list to appear
   */
  async waitForGenerationComplete() {
    // Wait for progress to appear first
    await this.progressContainer.waitFor({ state: "visible" });
    // Wait for progress to complete (disappear)
    await this.progressContainer.waitFor({ state: "hidden", timeout: 60000 });
    // Wait for proposals list to appear
    await this.proposalsList.waitFor({ state: "visible" });
  }

  /**
   * Get progress percentage value
   * @returns Progress value as string (e.g., "50%")
   */
  async getProgressValue(): Promise<string> {
    return (await this.progressValue.textContent()) || "";
  }

  /**
   * Check if proposals list is visible
   */
  async isProposalsListVisible(): Promise<boolean> {
    return await this.proposalsList.isVisible();
  }

  /**
   * Get flashcard proposal item by index
   * @param index - Flashcard index (1-based)
   */
  getProposalItem(index: number) {
    return new FlashcardProposalItem(this.page, index);
  }

  /**
   * Accept multiple flashcard proposals by their indices
   * @param indices - Array of flashcard indices to accept (1-based)
   */
  async acceptProposals(indices: number[]) {
    for (const index of indices) {
      const proposal = this.getProposalItem(index);
      await proposal.accept();
    }
  }

  /**
   * Click "Save all" button
   */
  async saveAll() {
    await this.saveAllButton.click();
  }

  /**
   * Click "Save accepted" button
   */
  async saveAccepted() {
    await this.saveAcceptedButton.click();
  }

  /**
   * Wait for save operation to complete and redirect
   */
  async waitForSaveComplete() {
    await this.page.waitForURL("/generate", { timeout: 10000 });
  }

  /**
   * Check if save accepted button is enabled
   */
  async isSaveAcceptedButtonEnabled(): Promise<boolean> {
    return await this.saveAcceptedButton.isEnabled();
  }

  /**
   * Check if form is in initial state (empty text, no proposals)
   */
  async isFormInInitialState(): Promise<boolean> {
    const inputValue = await this.sourceTextInput.inputValue();
    const proposalsVisible = await this.proposalsList.isVisible().catch(() => false);
    return inputValue === "" && !proposalsVisible;
  }
}

/**
 * Page Object Model for individual Flashcard Proposal Item
 * Represents a single flashcard in the proposals list
 */
export class FlashcardProposalItem {
  private readonly page: Page;
  private readonly index: number;

  // Locators
  readonly container: Locator;
  readonly acceptButton: Locator;
  readonly editButton: Locator;
  readonly removeButton: Locator;
  readonly frontInput: Locator;
  readonly backInput: Locator;
  readonly frontDisplay: Locator;
  readonly backDisplay: Locator;

  constructor(page: Page, index: number) {
    this.page = page;
    this.index = index;

    // Container
    this.container = page.locator(`[data-test-id="flashcard-item-${index}"]`);

    // Action buttons
    this.acceptButton = page.locator(`[data-test-id="flashcard-accept-button-${index}"]`);
    this.editButton = page.locator(`[data-test-id="flashcard-edit-button-${index}"]`);
    this.removeButton = page.locator(`[data-test-id="flashcard-remove-button-${index}"]`);

    // Edit mode inputs
    this.frontInput = page.locator(`[data-test-id="flashcard-front-input-${index}"]`);
    this.backInput = page.locator(`[data-test-id="flashcard-back-input-${index}"]`);

    // Display mode content
    this.frontDisplay = page.locator(`[data-test-id="flashcard-front-display-${index}"]`);
    this.backDisplay = page.locator(`[data-test-id="flashcard-back-display-${index}"]`);
  }

  /**
   * Accept this flashcard proposal
   */
  async accept() {
    await this.acceptButton.click();
  }

  /**
   * Remove this flashcard proposal
   */
  async remove() {
    await this.removeButton.click();
  }

  /**
   * Toggle edit mode
   */
  async toggleEdit() {
    await this.editButton.click();
  }

  /**
   * Edit flashcard content
   * Uses fill() followed by dispatchEvent to trigger React onChange
   * @param front - New front text (1-200 characters)
   * @param back - New back text (1-500 characters)
   */
  async edit(front: string, back: string) {
    // Open edit mode
    await this.toggleEdit();

    // Fill inputs and trigger React events
    await this.frontInput.fill(front);
    await this.frontInput.dispatchEvent("input", { bubbles: true });
    await this.frontInput.dispatchEvent("change", { bubbles: true });

    await this.backInput.fill(back);
    await this.backInput.dispatchEvent("input", { bubbles: true });
    await this.backInput.dispatchEvent("change", { bubbles: true });

    // Close edit mode
    await this.toggleEdit();
  }

  /**
   * Get front content (display mode)
   */
  async getFrontContent(): Promise<string> {
    return (await this.frontDisplay.textContent()) || "";
  }

  /**
   * Get back content (display mode)
   */
  async getBackContent(): Promise<string> {
    return (await this.backDisplay.textContent()) || "";
  }

  /**
   * Check if flashcard is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.container.isVisible();
  }

  /**
   * Check if flashcard is accepted (has accepted styling)
   */
  async isAccepted(): Promise<boolean> {
    const className = await this.container.getAttribute("class");
    return className?.includes("border-green-500") || false;
  }

  /**
   * Check if flashcard is edited (has edited styling)
   */
  async isEdited(): Promise<boolean> {
    const className = await this.container.getAttribute("class");
    return className?.includes("border-primary") || false;
  }

  /**
   * Wait for this proposal item to be visible
   */
  async waitForVisible() {
    await this.container.waitFor({ state: "visible" });
  }
}
