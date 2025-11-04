import type { APIRoute } from "astro";
import { registerSchema } from "../../../lib/validators/auth";
import { handleSupabaseAuthError } from "../../../lib/utils/auth-errors";
import type { ErrorResponseDTO, RegisterResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/register
 * Creates new user account and auto-logs in the user
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate with Zod
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: validationResult.error.flatten(),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password } = validationResult.data;

    // 3. Prepare email redirect URL
    const siteUrl = import.meta.env.PUBLIC_SITE_URL || "http://localhost:3000";
    const emailRedirectTo = `${siteUrl}/auth/callback`;

    // 4. Sign up with Supabase
    // Note: Email confirmation behavior is controlled by Supabase server settings:
    // - Local: supabase/config.toml -> [auth.email] -> enable_confirmations
    // - Production: Supabase Dashboard -> Authentication -> Settings -> Email Auth
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });

    // 5. Handle Supabase errors
    if (error) {
      return handleSupabaseAuthError(error);
    }

    // 6. Check if user was created successfully
    if (!data.user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "REGISTRATION_FAILED",
          message: "Failed to create account",
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 7. Check if email confirmation was required
    // When Supabase email confirmation is disabled, a session is created immediately
    // When enabled, data.session will be null and user needs to confirm via email
    const requiresEmailConfirmation = data.session === null;

    // 8. Return success response
    const response: RegisterResponseDTO = {
      message: requiresEmailConfirmation
        ? "Account created successfully. Please check your email to confirm your account."
        : "Account created successfully. You are now logged in.",
      user: {
        id: data.user.id,
        email: data.user.email || "",
      },
      requiresEmailConfirmation,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/auth/register:", error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "A server error occurred",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
