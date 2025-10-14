import type { APIRoute } from "astro";
import { loginSchema } from "../../../lib/validators/auth";
import { handleSupabaseAuthError } from "../../../lib/utils/auth-errors";
import type { ErrorResponseDTO, LoginResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/login
 * Authenticates user and creates session
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate with Zod
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Nieprawidłowe dane wejściowe",
          details: validationResult.error.flatten(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password } = validationResult.data;

    // 3. Sign in with Supabase
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 4. Handle Supabase errors
    if (error) {
      return handleSupabaseAuthError(error);
    }

    // 5. Return success response
    const response: LoginResponseDTO = {
      message: "Zalogowano pomyślnie",
      user: {
        id: data.user.id,
        email: data.user.email || "",
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/auth/login:", error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Wystąpił błąd serwera",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
