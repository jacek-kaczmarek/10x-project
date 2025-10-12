// src/lib/services/generation.service.ts
import { createHash } from "crypto";
import { type SupabaseClient, DEFAULT_USER_ID } from "../../../src/db/supabase.client";
import type { CreateGenerationResponseDTO, FlashcardProposalDTO, GenerationInsert } from "../../types";

/**
 * Service for generating flashcards using AI
 */
export class GenerationService {
  constructor(private readonly supabase: SupabaseClient) {}

  private readonly AI_MODEL = "openai/gpt-4o-mini";
  // MVP placeholder user_id (auth not implemented yet)

  /**
   * Creates a generation with AI-generated flashcard proposals
   * @param sourceText - The source text to generate flashcards from (1000-10000 chars)
   * @returns Generation metadata with flashcard proposals
   */
  async createGeneration(sourceText: string): Promise<CreateGenerationResponseDTO> {
    // Calculate SHA-256 hash of source text
    const sourceTextHash = this.calculateHash(sourceText);

    try {
      // Generate flashcards using AI (mocked for now)
      const proposals = await this.generateFlashcardsWithAI(sourceText);

      // Insert generation record into database
      const generationInsert: GenerationInsert = {
        model: this.AI_MODEL,
        source_text_length: sourceText.length,
        source_text_hash: sourceTextHash,
        flashcards_generated: proposals.length,
        user_id: DEFAULT_USER_ID,
      };

      const { data: generation, error: insertError } = await this.supabase
        .from("generations")
        .insert(generationInsert)
        .select()
        .single();

      if (insertError || !generation) {
        throw new Error(`Failed to insert generation record: ${insertError?.message || "Unknown error"}`);
      }

      // Return generation metadata with proposals
      const response: CreateGenerationResponseDTO = {
        generation_id: generation.id,
        model: generation.model,
        source_text_length: generation.source_text_length,
        source_text_hash: generation.source_text_hash,
        flashcards_generated: generation.flashcards_generated,
        created_at: generation.created_at,
        proposals,
      };

      return response;
    } catch (error) {
      // Log error to database
      await this.logError(error, sourceText, sourceTextHash);

      // Re-throw error to be handled by API route
      throw error;
    }
  }

  /**
   * Calculates SHA-256 hash of the source text
   * @param text - Text to hash
   * @returns Hex-encoded hash string
   */
  private calculateHash(text: string): string {
    return createHash("sha256").update(text).digest("hex");
  }

  /**
   * Generates flashcards using OpenRouter AI API
   * MOCK IMPLEMENTATION - To be replaced with actual API call
   * @param sourceText - Source text to generate flashcards from
   * @returns Array of 10 flashcard proposals
   */
  private async generateFlashcardsWithAI(sourceText: string): Promise<FlashcardProposalDTO[]> {
    // TODO: Replace with actual OpenRouter API call
    // For now, return mock data

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock proposals based on source text
    const mockProposals: FlashcardProposalDTO[] = Array.from({ length: 10 }, (_, i) => ({
      front: `Question ${i + 1} from source text (${sourceText.substring(0, 30)}...)`,
      back: `Answer ${i + 1} explaining the concept from the source material`,
    }));

    return mockProposals;
  }

  /**
   * Logs generation error to database
   * @param error - The error that occurred
   * @param sourceText - The source text that was being processed
   * @param sourceTextHash - Hash of the source text
   */
  private async logError(error: unknown, sourceText: string, sourceTextHash: string): Promise<void> {
    try {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorType = error instanceof Error ? error.constructor.name : "Error";

      await this.supabase.from("generation_error_logs").insert({
        error_type: errorType,
        error_message: errorMessage,
        source_text_length: sourceText.length,
        source_text_hash: sourceTextHash,
        model: this.AI_MODEL,
        user_id: DEFAULT_USER_ID,
      });
    } catch (logError) {
      // If logging fails, just log to console - don't throw
      console.error("Failed to log generation error to database:", logError);
    }
  }
}
