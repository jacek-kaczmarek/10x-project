import type { AuthError } from "@supabase/supabase-js";
import type { ErrorResponseDTO } from "../../types";

/**
 * Maps Supabase auth errors to user-friendly error responses
 */
export function handleSupabaseAuthError(error: AuthError): Response {
  let status = 500;
  let code = "AUTH_ERROR";
  let message = "Wystąpił błąd uwierzytelnienia";

  // Map Supabase error messages to user-friendly messages
  switch (error.message) {
    case "Invalid login credentials":
      status = 401;
      code = "INVALID_CREDENTIALS";
      message = "Niepoprawny email lub hasło";
      break;
    case "Email not confirmed":
      status = 401;
      code = "EMAIL_NOT_CONFIRMED";
      message = "Konto nie zostało zweryfikowane. Sprawdź email";
      break;
    case "User already registered":
      status = 409;
      code = "EMAIL_EXISTS";
      message = "Użytkownik z tym adresem email już istnieje";
      break;
    case "Token expired":
    case "Token has expired or is invalid":
      status = 401;
      code = "TOKEN_EXPIRED";
      message = "Link resetowania hasła wygasł";
      break;
    case "Password should be at least 8 characters":
      status = 400;
      code = "WEAK_PASSWORD";
      message = "Hasło musi mieć minimum 8 znaków";
      break;
    default:
      console.error("Unhandled Supabase auth error:", error);
      status = 500;
      code = "AUTH_ERROR";
      message = "Wystąpił błąd uwierzytelnienia";
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
