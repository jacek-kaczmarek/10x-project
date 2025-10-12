// src/pages/api/flashcards/batch/index.ts
import type { APIRoute } from "astro";
import { saveFlashcardProposalsCommandSchema } from "../../../../lib/validators/flashcards";
import { FlashcardService } from "../../../../lib/services/flashcard.service";
import type {
  SaveFlashcardProposalsCommand,
  SaveFlashcardProposalsResponseDTO,
  ErrorResponseDTO,
} from "../../../../types";

export const prerender = false;

/**
 * POST /api/flashcards/batch
 * Save multiple AI-generated flashcard proposals in batch
 *
 * Request body: SaveFlashcardProposalsCommand
 * Response: SaveFlashcardProposalsResponseDTO (201) or ErrorResponseDTO (400/404/500)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid JSON in request body",
          },
        } satisfies ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate input using Zod
    const validationResult = saveFlashcardProposalsCommandSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Input validation failed",
            details: errors,
          },
        } satisfies ErrorResponseDTO<typeof errors>),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const command: SaveFlashcardProposalsCommand = validationResult.data;

    // Step 3: Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INTERNAL_ERROR",
            message: "Database client not available",
          },
        } satisfies ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Execute service method
    const flashcardService = new FlashcardService(supabase);
    const result: SaveFlashcardProposalsResponseDTO = await flashcardService.saveProposals(command);

    // Step 5: Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 6: Handle known errors
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return new Response(
          JSON.stringify({
            error: {
              code: "NOT_FOUND",
              message: "Generation with provided generation_id does not exist",
            },
          } satisfies ErrorResponseDTO),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message === "DATABASE_ERROR") {
        return new Response(
          JSON.stringify({
            error: {
              code: "DATABASE_ERROR",
              message: "Failed to save flashcard proposals to database",
            },
          } satisfies ErrorResponseDTO),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Step 7: Handle unexpected errors
    console.error("Unexpected error in POST /api/flashcards/batch:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "UNKNOWN_ERROR",
          message: "An unexpected error occurred",
        },
      } satisfies ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
