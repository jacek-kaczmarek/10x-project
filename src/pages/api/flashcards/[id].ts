// src/pages/api/flashcards/[id].ts
import type { APIRoute } from "astro";
import { updateFlashcardCommandSchema } from "../../../lib/validators/flashcards";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import type { UpdateFlashcardCommand, ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/flashcards/:id
 * Get a single flashcard by ID
 *
 * Response: FlashcardDTO (200) or ErrorResponseDTO (401/404/500)
 */
export const GET: APIRoute = async ({ locals, params }) => {
  try {
    // Step 1: Check authentication
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Musisz być zalogowany",
          },
        } satisfies ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Get Supabase client from locals
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

    // Step 3: Get flashcard ID from URL params
    const flashcardId = params.id;
    if (!flashcardId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Flashcard ID is required",
          },
        } satisfies ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Execute service method
    const flashcardService = new FlashcardService(supabase);
    const result = await flashcardService.getFlashcard(flashcardId, user.id);

    if (!result) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Flashcard not found",
          },
        } satisfies ErrorResponseDTO),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 5: Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 6: Handle errors
    if (error instanceof Error) {
      if (error.message === "DATABASE_ERROR") {
        return new Response(
          JSON.stringify({
            error: {
              code: "DATABASE_ERROR",
              message: "Failed to retrieve flashcard from database",
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
    console.error("Unexpected error in GET /api/flashcards/:id:", error);
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

/**
 * PATCH /api/flashcards/:id
 * Update a flashcard
 *
 * Request body: UpdateFlashcardCommand
 * Response: FlashcardDTO (200) or ErrorResponseDTO (400/401/404/500)
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
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
    const validationResult = updateFlashcardCommandSchema.safeParse(body);

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

    const command: UpdateFlashcardCommand = validationResult.data;

    // Step 3: Check authentication
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Musisz być zalogowany",
          },
        } satisfies ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Get Supabase client from locals
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

    // Step 5: Get flashcard ID from URL params
    const flashcardId = params.id;
    if (!flashcardId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Flashcard ID is required",
          },
        } satisfies ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 6: Execute service method
    const flashcardService = new FlashcardService(supabase);
    const result = await flashcardService.updateFlashcard(flashcardId, command, user.id);

    // Step 7: Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 8: Handle known errors
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return new Response(
          JSON.stringify({
            error: {
              code: "NOT_FOUND",
              message: "Flashcard not found",
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
              message: "Failed to update flashcard in database",
            },
          } satisfies ErrorResponseDTO),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Step 9: Handle unexpected errors
    console.error("Unexpected error in PATCH /api/flashcards/:id:", error);
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

/**
 * DELETE /api/flashcards/:id
 * Delete a flashcard (hard delete)
 *
 * Response: 204 No Content or ErrorResponseDTO (401/404/500)
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    // Step 1: Check authentication
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Musisz być zalogowany",
          },
        } satisfies ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Get Supabase client from locals
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

    // Step 3: Get flashcard ID from URL params
    const flashcardId = params.id;
    if (!flashcardId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Flashcard ID is required",
          },
        } satisfies ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Execute service method
    const flashcardService = new FlashcardService(supabase);
    await flashcardService.deleteFlashcard(flashcardId, user.id);

    // Step 5: Return success response (204 No Content)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Step 6: Handle known errors
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return new Response(
          JSON.stringify({
            error: {
              code: "NOT_FOUND",
              message: "Flashcard not found",
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
              message: "Failed to delete flashcard from database",
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
    console.error("Unexpected error in DELETE /api/flashcards/:id:", error);
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
