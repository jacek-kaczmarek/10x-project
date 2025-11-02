// src/components/Flashcards/FlashcardsView.tsx
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SearchInput from "./SearchInput";
import FilterPanel from "./FilterPanel";
import FlashcardsTable from "./FlashcardsTable";
import Pagination from "./Pagination";
import { useFlashcards } from "./hooks/useFlashcards";

/**
 * Main view component for browsing and managing flashcards
 * Includes filtering, searching, pagination, and CRUD operations
 */
export default function FlashcardsView() {
  const {
    flashcards,
    isLoading,
    error,
    pagination,
    filters,
    setFilters,
    setPage,
    setSearch,
    startEdit,
    cancelEdit,
    updateFlashcard,
    deleteFlashcard,
  } = useFlashcards();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Toaster />

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">My Flashcards</h1>
          <p className="text-muted-foreground">Browse, search, and manage your saved flashcards</p>
        </div>
        <Button asChild size="lg">
          <a href="/flashcards/new" aria-label="Add new flashcard manually">
            <Plus className="size-4" />
            Add Flashcard
          </a>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          value={filters.search}
          onChange={setSearch}
          placeholder="Search flashcards by front or back text..."
        />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <FilterPanel filters={filters} onFilterChange={setFilters} />
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 rounded-md border border-destructive bg-destructive/10 p-4" role="alert">
          <p className="text-sm font-medium text-destructive">Error loading flashcards</p>
          <p className="text-sm text-destructive/80">{error}</p>
        </div>
      )}

      {/* Results count */}
      {!isLoading && !error && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {pagination.total === 0
              ? "No flashcards found"
              : `${pagination.total} flashcard${pagination.total === 1 ? "" : "s"} found`}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="mb-6">
        <FlashcardsTable
          flashcards={flashcards}
          isLoading={isLoading}
          onEdit={startEdit}
          onSave={updateFlashcard}
          onCancel={cancelEdit}
          onDelete={deleteFlashcard}
        />
      </div>

      {/* Pagination */}
      {!isLoading && !error && pagination.total_pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.total_pages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
