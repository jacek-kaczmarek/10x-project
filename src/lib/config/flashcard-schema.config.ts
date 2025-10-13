// src/lib/config/flashcard-schema.config.ts
import type { ResponseFormat } from "../services/openrouter.service";
import { FLASHCARD_GENERATION_PARAMS } from "./openrouter.config";

/**
 * JSON Schema for flashcard proposals response
 * Defines the structure that AI must follow when generating flashcards
 */
export const FLASHCARD_PROPOSALS_SCHEMA: ResponseFormat = {
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
          minItems: FLASHCARD_GENERATION_PARAMS.flashcardsCount,
          maxItems: FLASHCARD_GENERATION_PARAMS.flashcardsCount,
        },
      },
      required: ["flashcards"],
      additionalProperties: false,
    },
  },
};

/**
 * System message for flashcard generation
 * Instructs the AI on how to create effective flashcards
 */
export const FLASHCARD_GENERATION_SYSTEM_MESSAGE = `You are an expert educational content creator specializing in creating effective flashcards for spaced repetition learning.

Your task is to analyze the provided source text and generate exactly ${FLASHCARD_GENERATION_PARAMS.flashcardsCount} high-quality flashcards that:
1. Cover the most important concepts and facts from the text
2. Are clear, concise, and unambiguous
3. Follow the principle of atomicity (one concept per card)
4. Use simple language appropriate for learning
5. Have questions (front) that test understanding, not just memorization
6. Have answers (back) that are complete but concise

Format your response as a JSON object with a "flashcards" array containing exactly ${FLASHCARD_GENERATION_PARAMS.flashcardsCount} objects, each with "front" and "back" properties.`;

/**
 * User message template for flashcard generation
 * @param sourceText - The text to generate flashcards from
 * @returns Formatted user message
 */
export function createFlashcardGenerationUserMessage(sourceText: string): string {
  return `Please analyze the following text and generate exactly ${FLASHCARD_GENERATION_PARAMS.flashcardsCount} flashcards:

${sourceText}`;
}
