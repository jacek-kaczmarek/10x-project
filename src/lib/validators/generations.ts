// src/lib/validators/generations.ts
import { z } from "zod";

/**
 * Validation schema for CreateGenerationCommand
 * Ensures source_text is between 1000 and 10000 characters
 */
export const createGenerationSchema = z.object({
  source_text: z
    .string({ required_error: "Source text is required" })
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text must not exceed 10000 characters"),
});

export type CreateGenerationSchemaType = z.infer<typeof createGenerationSchema>;
