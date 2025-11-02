// src/lib/validators/flashcards.ts
import { z } from "zod";

/**
 * Validator for individual flashcard proposal
 */
export const flashcardProposalSchema = z.object({
  front: z
    .string()
    .trim()
    .min(1, "Front text must be at least 1 character")
    .max(200, "Front text must not exceed 200 characters"),
  back: z
    .string()
    .trim()
    .min(1, "Back text must be at least 1 character")
    .max(500, "Back text must not exceed 500 characters"),
  was_edited: z.boolean({
    required_error: "was_edited field is required",
    invalid_type_error: "was_edited must be a boolean",
  }),
});

/**
 * Validator for SaveFlashcardProposalsCommand
 * Validates batch save request for AI-generated flashcard proposals
 */
export const saveFlashcardProposalsCommandSchema = z.object({
  generation_id: z.string().uuid("generation_id must be a valid UUID"),
  proposals: z
    .array(flashcardProposalSchema)
    .min(1, "At least 1 proposal is required")
    .max(10, "Maximum 10 proposals allowed per batch"),
});

/**
 * Validator for creating manual flashcard
 */
export const createManualFlashcardCommandSchema = z.object({
  front: z
    .string()
    .trim()
    .min(1, "Front text must be at least 1 character")
    .max(200, "Front text must not exceed 200 characters"),
  back: z
    .string()
    .trim()
    .min(1, "Back text must be at least 1 character")
    .max(500, "Back text must not exceed 500 characters"),
});

/**
 * Validator for updating flashcard
 */
export const updateFlashcardCommandSchema = z.object({
  front: z
    .string()
    .trim()
    .min(1, "Front text must be at least 1 character")
    .max(200, "Front text must not exceed 200 characters")
    .optional(),
  back: z
    .string()
    .trim()
    .min(1, "Back text must be at least 1 character")
    .max(500, "Back text must not exceed 500 characters")
    .optional(),
  status: z.enum(["active", "rejected"]).optional(),
  source: z.enum(["manual", "ai", "ai-edited"]).optional(),
  due_date: z.string().datetime().optional(),
  interval: z.number().int().min(0).optional(),
  ease_factor: z.number().min(1.3).max(2.5).optional(),
  repetitions: z.number().int().min(0).optional(),
});

/**
 * Validator for list flashcards query parameters
 * Validates GET /api/flashcards query params with filtering, search, sorting, and pagination
 */
export const listFlashcardsQuerySchema = z.object({
  // Filters
  status: z.enum(["active", "rejected", "all"]).optional().default("all"),
  source: z.enum(["manual", "ai", "ai-edited", "all"]).optional().default("all"),
  search: z.string().min(1).max(200).optional(),
  due: z
    .string()
    .optional()
    .default("false")
    .transform((val) => val === "true"),
  generation_id: z.string().uuid().optional(),

  // Pagination
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),

  // Sorting
  sort: z.enum(["created_at", "updated_at", "due_date"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});
