import { test, expect } from "@playwright/test";
import { GeneratePage } from "./pages/generate.page";

// Sample text with 1200 characters for testing
const SAMPLE_TEXT_1200 = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?`;

test.describe("Generate Flashcards E2E", () => {
  let generatePage: GeneratePage;

  test.beforeEach(async ({ page }) => {
    generatePage = new GeneratePage(page);
    await generatePage.goto();
  });

  test("should generate and save accepted flashcards", async () => {
    // Step 1: Fill source text (1200 characters)
    await generatePage.fillSourceText(SAMPLE_TEXT_1200);

    // Verify text is filled
    const inputValue = await generatePage.sourceTextInput.inputValue();
    expect(inputValue.length).toBeGreaterThanOrEqual(1000);
    expect(inputValue.length).toBeLessThanOrEqual(10000);

    // Step 2: Generate flashcards
    await generatePage.submitGeneration();

    // Step 3: Wait for generation to complete
    await generatePage.waitForGenerationComplete();

    // Verify proposals list is visible
    await expect(generatePage.proposalsList).toBeVisible();

    // Step 4: Accept first 2 flashcards
    await generatePage.acceptProposals([1, 2]);

    // Verify flashcards are accepted (check styling)
    const firstProposal = generatePage.getProposalItem(1);
    const secondProposal = generatePage.getProposalItem(2);

    expect(await firstProposal.isAccepted()).toBeTruthy();
    expect(await secondProposal.isAccepted()).toBeTruthy();

    // Verify save accepted button is enabled
    expect(await generatePage.isSaveAcceptedButtonEnabled()).toBeTruthy();

    // Step 5: Save accepted flashcards
    await generatePage.saveAccepted();

    // Step 6: Verify redirect and form reset
    await generatePage.waitForSaveComplete();

    // Navigate back to generate page to verify clean state
    await generatePage.goto();
    expect(await generatePage.isFormInInitialState()).toBeTruthy();
  });

  test("should allow editing flashcard content", async () => {
    // Generate flashcards
    await generatePage.generateFlashcards(SAMPLE_TEXT_1200);
    await generatePage.waitForGenerationComplete();

    // Get first proposal
    const firstProposal = generatePage.getProposalItem(1);

    // Edit the flashcard
    const newFront = "What is the capital of France?";
    const newBack = "Paris is the capital of France.";
    await firstProposal.edit(newFront, newBack);

    // Verify content was updated
    const frontContent = await firstProposal.getFrontContent();
    const backContent = await firstProposal.getBackContent();

    expect(frontContent).toBe(newFront);
    expect(backContent).toBe(newBack);

    // Verify edited styling is applied
    expect(await firstProposal.isEdited()).toBeTruthy();
  });

  test("should remove flashcard proposal", async () => {
    // Generate flashcards
    await generatePage.generateFlashcards(SAMPLE_TEXT_1200);
    await generatePage.waitForGenerationComplete();

    // Get third proposal
    const thirdProposal = generatePage.getProposalItem(3);

    // Verify it's visible
    expect(await thirdProposal.isVisible()).toBeTruthy();

    // Remove the proposal
    await thirdProposal.remove();

    // Verify container shows removed state
    // (Component shows "Flashcard #3 has been removed" message)
    // Verify only 9 items remain (10 generated - 1 removed)
    const remainingItems = await generatePage.proposalsList.locator('[data-test-id^="flashcard-item-"]').count();
    expect(remainingItems).toBe(9);
  });

  test("should save all flashcards", async () => {
    // Generate flashcards
    await generatePage.generateFlashcards(SAMPLE_TEXT_1200);
    await generatePage.waitForGenerationComplete();

    // Save all without accepting any
    await generatePage.saveAll();

    // Verify redirect
    await generatePage.waitForSaveComplete();
  });

  test("should validate minimum text length", async () => {
    const shortText = "This text is too short";

    // Fill short text
    await generatePage.fillSourceText(shortText);

    // Submit button should be disabled
    await expect(generatePage.submitButton).toBeDisabled();
  });

  test("should validate maximum text length", async () => {
    // Generate text longer than 10000 characters
    const longText = "a".repeat(9999);

    // Fill long text
    await generatePage.quickfillSourceText(longText);
    await generatePage.fillSourceText("bb");

    // Submit button should be disabled
    await expect(generatePage.submitButton).toBeDisabled();
  });
});

test.describe("Generate Flashcards - Individual Proposal Actions", () => {
  let generatePage: GeneratePage;

  test.beforeEach(async ({ page }) => {
    generatePage = new GeneratePage(page);
    await generatePage.goto();

    // Generate flashcards for testing
    await generatePage.generateFlashcards(SAMPLE_TEXT_1200);
    await generatePage.waitForGenerationComplete();
  });

  test("should toggle flashcard acceptance", async () => {
    const proposal = generatePage.getProposalItem(1);

    // Initially not accepted
    expect(await proposal.isAccepted()).toBeFalsy();

    // Accept
    await proposal.accept();
    expect(await proposal.isAccepted()).toBeTruthy();

    // Unaccept (toggle)
    await proposal.accept();
    expect(await proposal.isAccepted()).toBeFalsy();
  });

  test("should show all 10 proposal items", async () => {
    // Verify all 10 proposals are visible
    for (let i = 1; i <= 10; i++) {
      const proposal = generatePage.getProposalItem(i);
      await expect(proposal.container).toBeVisible();
    }
  });
});
