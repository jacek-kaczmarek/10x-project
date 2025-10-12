// src/pages/api/generations/index.ts
import type { APIRoute } from "astro";
import { createGenerationSchema } from "../../../lib/validators/generations";
import { GenerationService } from "../../../lib/services/generation.service";
import type { CreateGenerationCommand, ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/generations
 * Generates 10 flashcard proposals from source text using AI
 * Returns proposals for client-side editing (does NOT save flashcards to DB)
 */
export const POST: APIRoute = async (context) => {
  try {
    // Parse request body
    const body = (await context.request.json()) as CreateGenerationCommand;

    // Validate request body
    const validationResult = createGenerationSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: validationResult.error.flatten(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const { source_text } = validationResult.data;

    // Get Supabase client from context
    const supabase = context.locals.supabase;

    // Create generation service instance
    const generationService = new GenerationService(supabase);

    // Generate flashcards
    const result = await generationService.createGeneration(source_text);

    // Return success response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in POST /api/generations:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // Check for AI service errors (502 Bad Gateway)
      if (error.message.includes("OpenRouter") || error.message.includes("AI service")) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "AI_SERVICE_ERROR",
            message: "Failed to generate flashcards from AI service",
            details: { originalError: error.message },
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 502,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    }

    // Generic 500 error
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while generating flashcards",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
