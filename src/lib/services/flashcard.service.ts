// src/lib/services/flashcard.service.ts
import { type SupabaseClient } from "../../db/supabase.client";
import type {
  SaveFlashcardProposalsCommand,
  SaveFlashcardProposalsResponseDTO,
  FlashcardInsert,
  FlashcardDTO,
} from "../../types";

/**
 * Service for managing flashcards
 */
export class FlashcardService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Save AI-generated flashcard proposals in batch
   *
   * @param command - Command containing generation_id and proposals to save
   * @param userId - The ID of the authenticated user
   * @returns Response with saved count and full flashcard entities
   * @throws Error if generation_id doesn't exist or database operation fails
   */
  async saveProposals(
    command: SaveFlashcardProposalsCommand,
    userId: string
  ): Promise<SaveFlashcardProposalsResponseDTO> {
    const { generation_id, proposals } = command;

    // Step 1: Verify that generation_id exists
    const { data: generation, error: generationError } = await this.supabase
      .from("generations")
      .select("id")
      .eq("id", generation_id)
      .single();

    if (generationError || !generation) {
      throw new Error("NOT_FOUND");
    }

    // Step 2: Map proposals to FlashcardInsert objects
    const now = new Date().toISOString();
    const flashcardsToInsert: FlashcardInsert[] = proposals.map((proposal) => ({
      generation_id,
      front: proposal.front.trim(),
      back: proposal.back.trim(),
      source: proposal.was_edited ? "ai-edited" : "ai",
      status: "active",
      due_date: now,
      interval: 0,
      ease_factor: 2.5,
      repetitions: 0,
      user_id: userId,
    }));
    console.warn(`Flashcards to insert: ${JSON.stringify(flashcardsToInsert)}`);

    // Step 3: Execute batch insert
    const { data: insertedFlashcards, error: insertError } = await this.supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select();

    if (insertError) {
      console.error("Database error inserting flashcards:", insertError);
      throw new Error("DATABASE_ERROR");
    }

    if (!insertedFlashcards || insertedFlashcards.length === 0) {
      throw new Error("DATABASE_ERROR");
    }

    // Step 4: Return response with saved count and full entities
    return {
      saved_count: insertedFlashcards.length,
      flashcards: insertedFlashcards as FlashcardDTO[],
    };
  }
}
