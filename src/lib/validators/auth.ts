import { z } from "astro/zod";

/**
 * Schema for login request
 */
export const loginSchema = z.object({
  email: z.string().email({ message: "Nieprawidłowy format email" }),
  password: z.string().min(8, { message: "Hasło musi mieć min. 8 znaków" }),
});

/**
 * Schema for register request
 */
export const registerSchema = z.object({
  email: z.string().email({ message: "Nieprawidłowy format email" }),
  password: z.string().min(8, { message: "Hasło musi mieć min. 8 znaków" }),
});

/**
 * Schema for forgot password request
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Nieprawidłowy format email" }),
});

/**
 * Schema for reset password request
 */
export const resetPasswordSchema = z.object({
  token: z.string().uuid({ message: "Nieprawidłowy token" }),
  newPassword: z.string().min(8, { message: "Hasło musi mieć min. 8 znaków" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
