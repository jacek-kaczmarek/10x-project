import type { APIRoute } from "astro";
import type { ErrorResponseDTO, MessageResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Signs out user and clears session
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      throw error;
    }

    const response: MessageResponseDTO = {
      message: "Wylogowano pomyślnie",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/auth/logout:", error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "LOGOUT_ERROR",
        message: "Błąd podczas wylogowania",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
