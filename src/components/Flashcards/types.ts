// src/components/Flashcards/types.ts
import type { FlashcardDTO } from "../../types";

/**
 * View model for flashcard with editing state
 */
export interface FlashcardVM extends FlashcardDTO {
  isEditing: boolean;
  editedFront?: string;
  editedBack?: string;
}

/**
 * Filters state for flashcards view
 */
export interface FlashcardsFilters {
  status: "active" | "rejected" | "all";
  source: "manual" | "ai" | "ai-edited" | "all";
  search: string;
  sort: "created_at" | "updated_at" | "due_date";
  order: "asc" | "desc";
}

/**
 * Hook return type for useFlashcards
 */
export interface UseFlashcardsReturn {
  flashcards: FlashcardVM[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  filters: FlashcardsFilters;
  setFilters: (filters: Partial<FlashcardsFilters>) => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  refetch: () => Promise<void>;
  startEdit: (id: string) => void;
  cancelEdit: (id: string) => void;
  createFlashcard: (front: string, back: string) => Promise<void>;
  updateFlashcard: (id: string, front: string, back: string) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;
}
