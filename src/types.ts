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

// 2a. Flashcard Proposal DTO (raw AI-generated flashcard before saving)
export interface FlashcardProposalDTO {
  front: string;
  back: string;
}

// 3. Create Generation with AI Flashcards Command (POST /api/generations)
export interface CreateGenerationCommand {
  source_text: string;
}

// 4. Create Generation Response DTO (returns flashcard proposals for client-side editing)
export interface CreateGenerationResponseDTO {
  generation_id: string;
  model: string;
  source_text_length: number;
  source_text_hash: string;
  flashcards_generated: number;
  created_at: string;
  proposals: FlashcardProposalDTO[]; // Raw proposals, not saved to DB yet
}

// 4a. Save Flashcard Proposals Command (POST /api/flashcards/batch)
export interface SaveFlashcardProposalsCommand {
  generation_id: string;
  proposals: {
    front: string;
    back: string;
    was_edited: boolean; // To determine if source should be 'ai' or 'ai-edited'
  }[];
}

// 4b. Save Flashcard Proposals Response DTO
export interface SaveFlashcardProposalsResponseDTO {
  saved_count: number;
  flashcards: FlashcardDTO[]; // Full saved flashcard records
}

// 5. List Flashcards Query Parameters DTO
export interface ListFlashcardsQueryParamsDTO {
  status?: "active" | "rejected" | "all"; // No 'candidate' - proposals exist only client-side
  source?: "manual" | "ai" | "ai-edited" | "all";
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

// ============= AUTH TYPES =============

// Request DTOs
export interface LoginRequestDTO {
  email: string;
  password: string;
}

// Response DTOs
export interface AuthUserDTO {
  id: string;
  email: string;
}

export interface LoginResponseDTO {
  message: string;
  user: AuthUserDTO;
}

export interface MessageResponseDTO {
  message: string;
}
