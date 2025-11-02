import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Page Object Model for My Flashcards Page (Browse)
 * Handles flashcards list, filtering, searching, pagination, and CRUD operations
 */
export class FlashcardsPage extends BasePage {
  // Header elements
  readonly addFlashcardButton: Locator;

  // Search
  readonly searchInput: Locator;

  // Filters
  readonly statusFilter: Locator;
  readonly sourceFilter: Locator;
  readonly sortFilter: Locator;
  readonly orderFilter: Locator;

  // Table
  readonly flashcardsTable: Locator;

  // Pagination
  readonly paginationFirst: Locator;
  readonly paginationPrev: Locator;
  readonly paginationNext: Locator;
  readonly paginationLast: Locator;

  constructor(page: Page) {
    super(page);

    // Header
    this.addFlashcardButton = page.getByRole("link", { name: "Add new flashcard manually" });

    // Search
    this.searchInput = page.locator('[data-test-id="flashcards-search-input"]');

    // Filters
    this.statusFilter = page.locator('[data-test-id="filter-status"]');
    this.sourceFilter = page.locator('[data-test-id="filter-source"]');
    this.sortFilter = page.locator('[data-test-id="filter-sort"]');
    this.orderFilter = page.locator('[data-test-id="filter-order"]');

    // Table
    this.flashcardsTable = page.getByRole("region", { name: "Flashcards table" });

    // Pagination
    this.paginationFirst = page.locator('[data-test-id="pagination-first"]');
    this.paginationPrev = page.locator('[data-test-id="pagination-prev"]');
    this.paginationNext = page.locator('[data-test-id="pagination-next"]');
    this.paginationLast = page.locator('[data-test-id="pagination-last"]');
  }

  async goto() {
    await super.goto("/flashcards");
  }

  /**
   * Search for flashcards
   * @param query - Search query
   */
  async search(query: string) {
    await this.searchInput.fill(query);
  }

  /**
   * Get flashcard row by ID
   * @param id - Flashcard ID
   */
  getFlashcardRow(id: string) {
    return new FlashcardRow(this.page, id);
  }

  /**
   * Wait for flashcards to load
   */
  async waitForFlashcardsLoad() {
    await this.flashcardsTable.waitFor({ state: "visible" });
  }

  /**
   * Check if table is empty
   */
  async isTableEmpty(): Promise<boolean> {
    const noResultsText = this.page.getByText("No flashcards found");
    return await noResultsText.isVisible();
  }

  /**
   * Get total flashcards count from pagination info
   */
  async getTotalCount(): Promise<number> {
    const paginationText = await this.page.getByText(/Showing \d+ to \d+ of \d+ flashcards/).textContent();
    if (!paginationText) return 0;
    const match = paginationText.match(/of (\d+) flashcards/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Go to specific page
   * @param pageNumber - Page number to navigate to
   */
  async goToPage(pageNumber: number) {
    const pageButton = this.page.locator(`[data-test-id="pagination-page-${pageNumber}"]`);
    await pageButton.click();
  }

  /**
   * Go to next page
   */
  async goToNextPage() {
    await this.paginationNext.click();
  }

  /**
   * Go to previous page
   */
  async goToPreviousPage() {
    await this.paginationPrev.click();
  }

  /**
   * Go to first page
   */
  async goToFirstPage() {
    await this.paginationFirst.click();
  }

  /**
   * Go to last page
   */
  async goToLastPage() {
    await this.paginationLast.click();
  }
}

/**
 * Page Object Model for individual Flashcard Row in the table
 * Represents a single flashcard with inline editing capabilities
 */
export class FlashcardRow {
  private readonly page: Page;
  private readonly id: string;

  // Locators
  readonly row: Locator;
  readonly frontDisplay: Locator;
  readonly backDisplay: Locator;
  readonly frontInput: Locator;
  readonly backInput: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page, id: string) {
    this.page = page;
    this.id = id;

    // Row
    this.row = page.locator(`[data-test-id="flashcard-row-${id}"]`);

    // Display mode
    this.frontDisplay = page.locator(`[data-test-id="flashcard-front-display-${id}"]`);
    this.backDisplay = page.locator(`[data-test-id="flashcard-back-display-${id}"]`);

    // Edit mode
    this.frontInput = page.locator(`[data-test-id="flashcard-front-input-${id}"]`);
    this.backInput = page.locator(`[data-test-id="flashcard-back-input-${id}"]`);

    // Action buttons
    this.editButton = page.locator(`[data-test-id="flashcard-edit-button-${id}"]`);
    this.deleteButton = page.locator(`[data-test-id="flashcard-delete-button-${id}"]`);
    this.saveButton = page.locator(`[data-test-id="flashcard-save-button-${id}"]`);
    this.cancelButton = page.locator(`[data-test-id="flashcard-cancel-button-${id}"]`);
  }

  /**
   * Start editing this flashcard
   */
  async startEdit() {
    await this.editButton.click();
    await this.frontInput.waitFor({ state: "visible" });
  }

  /**
   * Edit flashcard content
   * @param front - New front text
   * @param back - New back text
   */
  async edit(front: string, back: string) {
    await this.frontInput.fill(front);
    await this.backInput.fill(back);
  }

  /**
   * Save edited flashcard
   */
  async save() {
    await this.saveButton.click();
    await this.frontDisplay.waitFor({ state: "visible" });
  }

  /**
   * Cancel editing
   */
  async cancel() {
    await this.cancelButton.click();
    await this.frontDisplay.waitFor({ state: "visible" });
  }

  /**
   * Delete this flashcard (with confirmation)
   */
  async delete() {
    // Setup dialog handler before clicking delete
    this.page.once("dialog", (dialog) => dialog.accept());
    await this.deleteButton.click();
  }

  /**
   * Get front text (display mode)
   */
  async getFrontText(): Promise<string> {
    return (await this.frontDisplay.textContent()) || "";
  }

  /**
   * Get back text (display mode)
   */
  async getBackText(): Promise<string> {
    return (await this.backDisplay.textContent()) || "";
  }

  /**
   * Check if flashcard is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.row.isVisible();
  }

  /**
   * Check if flashcard is in edit mode
   */
  async isEditing(): Promise<boolean> {
    return await this.frontInput.isVisible();
  }

  /**
   * Wait for this row to be visible
   */
  async waitForVisible() {
    await this.row.waitFor({ state: "visible" });
  }
}
