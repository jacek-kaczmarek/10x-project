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

// 3. Generate AI Flashcards Command (POST /api/flashcards/generate)
export interface GenerateAIFlashcardsCommand {
  source_text: string;
}

// 4. Candidate Flashcard DTO (AI generation preview)
export type CandidateFlashcardDTO = Pick<FlashcardInsert, "front" | "back">;

// 5. Generate AI Flashcards Response DTO
export interface GenerateAIFlashcardsResponseDTO {
  source_text_hash: string;
  source_text_length: number;
  model: string;
  flashcards: CandidateFlashcardDTO[];
}

// 6. Save Flashcard Collection Command (POST /api/flashcards/collections)
export type SaveFlashcardCollectionCommandItem = Pick<FlashcardInsert, "front" | "back" | "source">;
export interface SaveFlashcardCollectionCommand {
  source_text_hash?: string;
  source_text_length?: number;
  model?: string;
  flashcards: SaveFlashcardCollectionCommandItem[];
}

// 7. Save Flashcard Collection Response DTO
export interface SaveFlashcardCollectionResponseDTO {
  generation_id?: string;
  model?: string;
  source_text_length?: number;
  flashcards_saved: number;
  created_at: string;
  flashcards: FlashcardDTO[];
}

// 8. List Flashcards Query Parameters DTO
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

// 9. Pagination DTO
export interface PaginationDTO {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 10. List Flashcards Response DTO
export interface ListFlashcardsResponseDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

// 11. Update Flashcard Command (PATCH /api/flashcards/:id)
export type UpdateFlashcardCommand = Pick<
  FlashcardUpdate,
  "front" | "back" | "status" | "due_date" | "interval" | "ease_factor" | "repetitions"
>;

// 12. List Generations Query Parameters DTO
export interface ListGenerationsQueryParamsDTO {
  page?: number;
  limit?: number;
}

// 13. Generation DTO (response)
export type GenerationDTO = GenerationRow;

// 14. List Generations Response DTO
export interface ListGenerationsResponseDTO {
  data: GenerationDTO[];
  pagination: PaginationDTO;
}

// 15. Generation Flashcard DTO (flashcards within a generation)
export type GenerationFlashcardDTO = Pick<FlashcardRow, "id" | "front" | "back" | "status" | "source" | "created_at">;

// 16. Get Generation With Flashcards Response DTO
export interface GetGenerationWithFlashcardsResponseDTO extends GenerationDTO {
  flashcards: GenerationFlashcardDTO[];
}

// 17. List Error Logs Query Parameters DTO
export interface ListErrorLogsQueryParamsDTO {
  page?: number;
  limit?: number;
  error_type?: string;
}

// 18. Error Log DTO (response)
export type ErrorLogDTO = ErrorLogRow;

// 19. List Error Logs Response DTO
export interface ListErrorLogsResponseDTO {
  data: ErrorLogDTO[];
  pagination: PaginationDTO;
}

// 20. Standard Error Response DTO
export interface ErrorResponseDTO<Details = Record<string, unknown>> {
  error: {
    code: string;
    message: string;
    details?: Details;
  };
}
