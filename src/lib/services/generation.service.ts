// src/lib/services/generation.service.ts
import { createHash } from "crypto";
import { type SupabaseClient, DEFAULT_USER_ID } from "../../../src/db/supabase.client";
import type { CreateGenerationResponseDTO, FlashcardProposalDTO, GenerationInsert } from "../../types";
import { OpenRouterService, type ResponseFormat } from "./openrouter.service";

/**
 * JSON Schema for flashcard proposals response
 */
const FLASHCARD_PROPOSALS_SCHEMA: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "FlashcardProposals",
    strict: true,
    schema: {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: { type: "string" },
              back: { type: "string" },
            },
            required: ["front", "back"],
            additionalProperties: false,
          },
          minItems: 10,
          maxItems: 10,
        },
      },
      required: ["flashcards"],
      additionalProperties: false,
    },
  },
};

/**
 * System message for flashcard generation
 */
const SYSTEM_MESSAGE = `You are an expert educational content creator specializing in creating effective flashcards for spaced repetition learning.

Your task is to analyze the provided source text and generate exactly 10 high-quality flashcards that:
1. Cover the most important concepts and facts from the text
2. Are clear, concise, and unambiguous
3. Follow the principle of atomicity (one concept per card)
4. Use simple language appropriate for learning
5. Have questions (front) that test understanding, not just memorization
6. Have answers (back) that are complete but concise

Format your response as a JSON object with a "flashcards" array containing exactly 10 objects, each with "front" and "back" properties.`;

/**
 * Service for generating flashcards using AI
 */
export class GenerationService {
  private readonly AI_MODEL = "openai/gpt-4o-mini";

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly openRouterService: OpenRouterService
  ) {
    // Set the system message for all requests
    this.openRouterService.setSystemMessage(SYSTEM_MESSAGE);
    this.openRouterService.setModel(this.AI_MODEL);
  }

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
   * @param sourceText - Source text to generate flashcards from
   * @returns Array of 10 flashcard proposals
   */
  private async generateFlashcardsWithAI(sourceText: string): Promise<FlashcardProposalDTO[]> {
    try {
      // Create user message with source text
      const userMessage = `Please analyze the following text and generate exactly 10 flashcards:

${sourceText}`;

      // Call OpenRouter API with structured output
      const response = await this.openRouterService.sendChatCompletion(
        [
          {
            role: "user",
            content: userMessage,
          },
        ],
        {
          responseFormat: FLASHCARD_PROPOSALS_SCHEMA,
          parameters: {
            temperature: 0.7,
            max_tokens: 2000,
          },
        }
      );

      // Extract flashcards from response
      if (!response || !response.flashcards || !Array.isArray(response.flashcards)) {
        throw new Error("Invalid response structure from AI service");
      }

      // Validate we got exactly 10 flashcards
      if (response.flashcards.length !== 10) {
        throw new Error(`Expected 10 flashcards, received ${response.flashcards.length}`);
      }

      return response.flashcards as FlashcardProposalDTO[];
    } catch (error) {
      // Re-throw with context
      if (error instanceof Error) {
        throw new Error(`Failed to generate flashcards with AI: ${error.message}`);
      }
      throw new Error("Failed to generate flashcards with AI: Unknown error");
    }
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
