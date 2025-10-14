import { z } from "astro/zod";

/**
 * Schema for login request
 */
export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

/**
 * Schema for register request
 */
export const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

/**
 * Schema for forgot password request
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
});

/**
 * Schema for reset password request
 */
export const resetPasswordSchema = z.object({
  token: z.string().uuid({ message: "Invalid token" }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
