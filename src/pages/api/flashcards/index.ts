// src/pages/api/flashcards/index.ts
import type { APIRoute } from "astro";
import { listFlashcardsQuerySchema, createManualFlashcardCommandSchema } from "../../../lib/validators/flashcards";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import type { ListFlashcardsQueryParamsDTO, CreateManualFlashcardCommand, ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/flashcards
 * List flashcards with filtering, searching, sorting, and pagination
 *
 * Query params: ListFlashcardsQueryParamsDTO
 * Response: ListFlashcardsResponseDTO (200) or ErrorResponseDTO (400/401/500)
 */
export const GET: APIRoute = async ({ locals, url }) => {
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

    // Step 3: Parse and validate query parameters
    const params = Object.fromEntries(url.searchParams.entries());
    const validationResult = listFlashcardsQuerySchema.safeParse(params);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: errors,
          },
        } satisfies ErrorResponseDTO<typeof errors>),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const query: ListFlashcardsQueryParamsDTO = validationResult.data;

    // Step 4: Execute service method
    const flashcardService = new FlashcardService(supabase);
    const result = await flashcardService.listFlashcards(query, user.id);

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
              message: "Failed to retrieve flashcards from database",
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
    console.error("Unexpected error in GET /api/flashcards:", error);
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
 * POST /api/flashcards
 * Create a manual flashcard
 *
 * Request body: CreateManualFlashcardCommand
 * Response: FlashcardDTO (201) or ErrorResponseDTO (400/401/500)
 */
export const POST: APIRoute = async ({ locals, request }) => {
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
    const validationResult = createManualFlashcardCommandSchema.safeParse(body);

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

    const command: CreateManualFlashcardCommand = validationResult.data;

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

    // Step 5: Execute service method
    const flashcardService = new FlashcardService(supabase);
    const result = await flashcardService.createManualFlashcard(command, user.id);

    // Step 6: Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 7: Handle errors
    if (error instanceof Error) {
      if (error.message === "DATABASE_ERROR") {
        return new Response(
          JSON.stringify({
            error: {
              code: "DATABASE_ERROR",
              message: "Failed to create manual flashcard",
            },
          } satisfies ErrorResponseDTO),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Step 8: Handle unexpected errors
    console.error("Unexpected error in POST /api/flashcards:", error);
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
