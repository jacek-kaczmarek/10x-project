import type { AuthError } from "@supabase/supabase-js";
import type { ErrorResponseDTO } from "../../types";

/**
 * Maps Supabase auth errors to user-friendly error responses
 */
export function handleSupabaseAuthError(error: AuthError): Response {
  let status = 500;
  let code = "AUTH_ERROR";
  let message = "An authentication error occurred";

  // Map Supabase error messages to user-friendly messages
  switch (error.message) {
    case "Invalid login credentials":
      status = 401;
      code = "INVALID_CREDENTIALS";
      message = "Invalid email or password";
      break;
    case "Email not confirmed":
      status = 401;
      code = "EMAIL_NOT_CONFIRMED";
      message = "Account has not been verified. Check your email";
      break;
    case "User already registered":
      status = 409;
      code = "EMAIL_EXISTS";
      message = "A user with this email address already exists";
      break;
    case "Unable to validate email address: invalid format":
      status = 400;
      code = "INVALID_EMAIL";
      message = "Invalid email address format";
      break;
    case "Signup requires a valid password":
      status = 400;
      code = "PASSWORD_REQUIRED";
      message = "Password is required";
      break;
    case "Password should be at least 6 characters":
      status = 400;
      code = "WEAK_PASSWORD";
      message = "Password must be at least 6 characters";
      break;
    case "Token expired":
    case "Token has expired or is invalid":
      status = 401;
      code = "TOKEN_EXPIRED";
      message = "Password reset link has expired";
      break;
    default:
      // Check if error contains "already registered"
      if (error.message.toLowerCase().includes("already registered")) {
        status = 409;
        code = "EMAIL_EXISTS";
        message = "A user with this email address already exists";
      } else {
        console.error("Unhandled Supabase auth error:", error);
        status = 500;
        code = "AUTH_ERROR";
        message = "An authentication error occurred";
      }
  }

  const errorResponse: ErrorResponseDTO = {
    error: {
      code,
      message,
      details: { originalError: error.message },
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
