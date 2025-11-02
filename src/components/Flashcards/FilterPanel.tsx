// src/components/Flashcards/FilterPanel.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { FlashcardsFilters } from "./types";

interface FilterPanelProps {
  filters: FlashcardsFilters;
  onFilterChange: (filters: Partial<FlashcardsFilters>) => void;
}

/**
 * Filter panel for status, source, and sorting
 */
export default function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="group" aria-label="Flashcard filters">
      {/* Status Filter */}
      <div className="space-y-2">
        <Label htmlFor="filter-status">Status</Label>
        <Select
          value={filters.status}
          onValueChange={(value: string) => onFilterChange({ status: value as FlashcardsFilters["status"] })}
        >
          <SelectTrigger id="filter-status" aria-label="Filter by status" data-test-id="filter-status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Source Filter */}
      <div className="space-y-2">
        <Label htmlFor="filter-source">Source</Label>
        <Select
          value={filters.source}
          onValueChange={(value: string) => onFilterChange({ source: value as FlashcardsFilters["source"] })}
        >
          <SelectTrigger id="filter-source" aria-label="Filter by source" data-test-id="filter-source">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="ai">AI</SelectItem>
            <SelectItem value="ai-edited">AI-Edited</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Field */}
      <div className="space-y-2">
        <Label htmlFor="filter-sort">Sort by</Label>
        <Select
          value={filters.sort}
          onValueChange={(value: string) => onFilterChange({ sort: value as FlashcardsFilters["sort"] })}
        >
          <SelectTrigger id="filter-sort" aria-label="Sort by field" data-test-id="filter-sort">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Created date</SelectItem>
            <SelectItem value="updated_at">Updated date</SelectItem>
            <SelectItem value="due_date">Due date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Order */}
      <div className="space-y-2">
        <Label htmlFor="filter-order">Order</Label>
        <Select
          value={filters.order}
          onValueChange={(value: string) => onFilterChange({ order: value as FlashcardsFilters["order"] })}
        >
          <SelectTrigger id="filter-order" aria-label="Sort order" data-test-id="filter-order">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest first</SelectItem>
            <SelectItem value="asc">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
