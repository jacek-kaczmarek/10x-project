// src/types.ts
import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// Core entity types from database
export type FlashcardRow = Tables<"flashcards">;
export type FlashcardInsert = TablesInsert<"flashcards">;
export type FlashcardUpdate = TablesUpdate<"flashcards">;

export type GenerationRow = Tables<"generations">;
export type GenerationInsert = TablesInsert<"generations">;

export type ErrorLogRow = Tables<"generation_error_logs">;

// 1. Create Manual Flashcard Command (POST /api/flashcards)
export type CreateManualFlashcardCommand = Pick<FlashcardInsert, "front" | "back">;

// 2. Flashcard DTO (response)
export type FlashcardDTO = FlashcardRow;

// 3. Create Generation with AI Flashcards Command (POST /api/generations)
export interface CreateGenerationCommand {
  source_text: string;
}

// 4. Create Generation Response DTO (returns saved candidate flashcards)
export interface CreateGenerationResponseDTO {
  generation_id: string;
  model: string;
  source_text_length: number;
  source_text_hash: string;
  flashcards_generated: number;
  created_at: string;
  flashcards: FlashcardDTO[];
}

// 5. List Flashcards Query Parameters DTO
export interface ListFlashcardsQueryParamsDTO {
  status?: "candidate" | "active" | "rejected" | "all";
  source?: "manual" | "ai" | "all";
  search?: string;
  due?: boolean;
  generation_id?: string;
  page?: number;
  limit?: number;
  sort?: "created_at" | "updated_at" | "due_date";
  order?: "asc" | "desc";
}

// 6. Pagination DTO
export interface PaginationDTO {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 7. List Flashcards Response DTO
export interface ListFlashcardsResponseDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

// 8. Update Flashcard Command (PATCH /api/flashcards/:id)
export type UpdateFlashcardCommand = Pick<
  FlashcardUpdate,
  "front" | "back" | "status" | "source" | "due_date" | "interval" | "ease_factor" | "repetitions"
>;

// 9. List Generations Query Parameters DTO
export interface ListGenerationsQueryParamsDTO {
  page?: number;
  limit?: number;
}

// 10. Generation DTO (response)
export type GenerationDTO = GenerationRow;

// 11. List Generations Response DTO
export interface ListGenerationsResponseDTO {
  data: GenerationDTO[];
  pagination: PaginationDTO;
}

// 12. Generation Flashcard DTO (flashcards within a generation)
export type GenerationFlashcardDTO = Pick<FlashcardRow, "id" | "front" | "back" | "status" | "source" | "created_at">;

// 13. Get Generation With Flashcards Response DTO
export interface GetGenerationWithFlashcardsResponseDTO extends GenerationDTO {
  flashcards: GenerationFlashcardDTO[];
}

// 14. List Error Logs Query Parameters DTO
export interface ListErrorLogsQueryParamsDTO {
  page?: number;
  limit?: number;
  error_type?: string;
}

// 15. Error Log DTO (response)
export type ErrorLogDTO = ErrorLogRow;

// 16. List Error Logs Response DTO
export interface ListErrorLogsResponseDTO {
  data: ErrorLogDTO[];
  pagination: PaginationDTO;
}

// 17. Standard Error Response DTO
export interface ErrorResponseDTO<Details = Record<string, unknown>> {
  error: {
    code: string;
    message: string;
    details?: Details;
  };
}
