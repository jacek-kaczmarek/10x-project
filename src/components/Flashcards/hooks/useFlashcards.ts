// src/components/Flashcards/hooks/useFlashcards.ts
import { useState, useEffect, useCallback } from "react";
import type { FlashcardVM, FlashcardsFilters, UseFlashcardsReturn } from "../types";
import type { ListFlashcardsResponseDTO } from "../../../types";

const DEFAULT_FILTERS: FlashcardsFilters = {
  status: "all",
  source: "all",
  search: "",
  sort: "created_at",
  order: "desc",
};

/**
 * Custom hook for managing flashcards data, filtering, pagination, and CRUD operations
 */
export function useFlashcards(): UseFlashcardsReturn {
  const [flashcards, setFlashcards] = useState<FlashcardVM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<FlashcardsFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  });

  /**
   * Fetch flashcards from API
   */
  const fetchFlashcards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sort: filters.sort,
        order: filters.order,
      });

      if (filters.status !== "all") {
        params.set("status", filters.status);
      }

      if (filters.source !== "all") {
        params.set("source", filters.source);
      }

      if (filters.search.trim()) {
        params.set("search", filters.search.trim());
      }

      const response = await fetch(`/api/flashcards?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch flashcards");
      }

      const data: ListFlashcardsResponseDTO = await response.json();

      // Transform to view models with editing state
      const flashcardVMs: FlashcardVM[] = data.data.map((fc) => ({
        ...fc,
        isEditing: false,
      }));

      setFlashcards(flashcardVMs);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while fetching flashcards";
      setError(errorMessage);
      setFlashcards([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filters]);

  /**
   * Fetch flashcards on mount and when dependencies change
   */
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  /**
   * Update filters and reset to page 1
   */
  const setFilters = useCallback((newFilters: Partial<FlashcardsFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  /**
   * Update search filter (separate function for debouncing in component)
   */
  const setSearch = useCallback((search: string) => {
    setFiltersState((prev) => ({ ...prev, search }));
    setPage(1);
  }, []);

  /**
   * Start editing a flashcard
   */
  const startEdit = useCallback((id: string) => {
    setFlashcards((prev) =>
      prev.map((fc) =>
        fc.id === id
          ? {
              ...fc,
              isEditing: true,
              editedFront: fc.front,
              editedBack: fc.back,
            }
          : fc
      )
    );
  }, []);

  /**
   * Cancel editing a flashcard
   */
  const cancelEdit = useCallback((id: string) => {
    setFlashcards((prev) =>
      prev.map((fc) =>
        fc.id === id
          ? {
              ...fc,
              isEditing: false,
              editedFront: undefined,
              editedBack: undefined,
            }
          : fc
      )
    );
  }, []);

  /**
   * Create a new flashcard
   */
  const createFlashcard = useCallback(
    async (front: string, back: string) => {
      try {
        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ front, back }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to create flashcard");
        }

        // Refetch flashcards to get the new one
        await fetchFlashcards();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create flashcard";
        throw new Error(errorMessage);
      }
    },
    [fetchFlashcards]
  );

  /**
   * Update a flashcard
   */
  const updateFlashcard = useCallback(async (id: string, front: string, back: string) => {
    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ front, back }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to update flashcard");
      }

      const updatedFlashcard = await response.json();

      // Update local state
      setFlashcards((prev) =>
        prev.map((fc) =>
          fc.id === id
            ? {
                ...updatedFlashcard,
                isEditing: false,
                editedFront: undefined,
                editedBack: undefined,
              }
            : fc
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update flashcard";
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Delete a flashcard
   */
  const deleteFlashcard = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/flashcards/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to delete flashcard");
        }

        // Remove from local state
        setFlashcards((prev) => prev.filter((fc) => fc.id !== id));

        // Update pagination total
        setPagination((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          total_pages: Math.ceil(Math.max(0, prev.total - 1) / prev.limit),
        }));

        // If current page is now empty and not the first page, go to previous page
        const remainingOnPage = flashcards.length - 1;
        if (remainingOnPage === 0 && page > 1) {
          setPage(page - 1);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete flashcard";
        throw new Error(errorMessage);
      }
    },
    [flashcards.length, page]
  );

  return {
    flashcards,
    isLoading,
    error,
    pagination,
    filters,
    setFilters,
    setPage,
    setSearch,
    refetch: fetchFlashcards,
    startEdit,
    cancelEdit,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
  };
}
