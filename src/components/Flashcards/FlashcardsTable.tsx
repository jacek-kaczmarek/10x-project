// src/components/Flashcards/FlashcardsTable.tsx
import { useState } from "react";
import { Edit2, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import type { FlashcardVM } from "./types";

interface FlashcardsTableProps {
  flashcards: FlashcardVM[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onSave: (id: string, front: string, back: string) => Promise<void>;
  onCancel: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Table component for displaying flashcards with inline editing and deletion
 * Implements ARIA grid pattern for accessibility
 */
export default function FlashcardsTable({
  flashcards,
  isLoading,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: FlashcardsTableProps) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState<{ id: string; front: string } | null>(null);

  // Local state for edited values
  const [editedValues, setEditedValues] = useState<Record<string, { front: string; back: string }>>({});

  const handleEdit = (flashcard: FlashcardVM) => {
    setEditedValues({
      ...editedValues,
      [flashcard.id]: {
        front: flashcard.front,
        back: flashcard.back,
      },
    });
    onEdit(flashcard.id);
  };

  const handleSave = async (id: string) => {
    const values = editedValues[id];
    if (!values) return;

    // Validate
    if (values.front.trim().length < 1 || values.front.trim().length > 200) {
      toast.error("Validation error", {
        description: "Front text must be 1-200 characters",
      });
      return;
    }

    if (values.back.trim().length < 1 || values.back.trim().length > 500) {
      toast.error("Validation error", {
        description: "Back text must be 1-500 characters",
      });
      return;
    }

    setSavingId(id);
    try {
      await onSave(id, values.front.trim(), values.back.trim());
      toast.success("Flashcard updated");
      // Clear edited values
      setEditedValues((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update flashcard";
      toast.error("Update error", {
        description: errorMessage,
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleCancel = (id: string) => {
    onCancel(id);
    // Clear edited values
    setEditedValues((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleDeleteClick = (id: string, front: string) => {
    setFlashcardToDelete({ id, front });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!flashcardToDelete) return;

    const { id } = flashcardToDelete;
    setDeletingId(id);
    try {
      await onDelete(id);
      toast.success("Flashcard deleted");
      setDeleteModalOpen(false);
      setFlashcardToDelete(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete flashcard";
      toast.error("Delete error", {
        description: errorMessage,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleInputChange = (id: string, field: "front" | "back", value: string) => {
    setEditedValues({
      ...editedValues,
      [id]: {
        ...editedValues[id],
        [field]: value,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "manual":
        return <Badge variant="default">Manual</Badge>;
      case "ai":
        return <Badge variant="secondary">AI</Badge>;
      case "ai-edited":
        return <Badge variant="outline">AI-Edited</Badge>;
      default:
        return <Badge variant="secondary">{source}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <p className="text-muted-foreground">Loading flashcards...</p>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
        <p className="text-lg font-medium text-muted-foreground">No flashcards found</p>
        <p className="text-sm text-muted-foreground">Try adjusting your filters or create new flashcards</p>
      </div>
    );
  }

  return (
    <>
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        flashcardText={flashcardToDelete?.front ?? ""}
        isDeleting={deletingId !== null}
      />
      <div className="rounded-md border" role="region" aria-label="Flashcards table">
        <Table role="grid" aria-label="Flashcards">
          <TableHeader>
            <TableRow role="row">
              <TableHead role="columnheader" className="w-[30%]">
                Front
              </TableHead>
              <TableHead role="columnheader" className="w-[35%]">
                Back
              </TableHead>
              <TableHead role="columnheader" className="w-[10%]">
                Status
              </TableHead>
              <TableHead role="columnheader" className="w-[10%]">
                Source
              </TableHead>
              <TableHead role="columnheader" className="w-[10%]">
                Created
              </TableHead>
              <TableHead role="columnheader" className="w-[5%]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flashcards.map((flashcard) => {
              const isEditing = flashcard.isEditing;
              const isSaving = savingId === flashcard.id;
              const isDeleting = deletingId === flashcard.id;
              const values = editedValues[flashcard.id];

              return (
                <TableRow key={flashcard.id} role="row" data-test-id={`flashcard-row-${flashcard.id}`}>
                  {/* Front */}
                  <TableCell role="gridcell">
                    {isEditing ? (
                      <Input
                        value={values?.front ?? flashcard.front}
                        onChange={(e) => handleInputChange(flashcard.id, "front", e.target.value)}
                        maxLength={200}
                        aria-label="Edit front text"
                        disabled={isSaving}
                        data-test-id={`flashcard-front-input-${flashcard.id}`}
                      />
                    ) : (
                      <span className="line-clamp-2" data-test-id={`flashcard-front-display-${flashcard.id}`}>
                        {flashcard.front}
                      </span>
                    )}
                  </TableCell>

                  {/* Back */}
                  <TableCell role="gridcell">
                    {isEditing ? (
                      <Input
                        value={values?.back ?? flashcard.back}
                        onChange={(e) => handleInputChange(flashcard.id, "back", e.target.value)}
                        maxLength={500}
                        aria-label="Edit back text"
                        disabled={isSaving}
                        data-test-id={`flashcard-back-input-${flashcard.id}`}
                      />
                    ) : (
                      <span className="line-clamp-2" data-test-id={`flashcard-back-display-${flashcard.id}`}>
                        {flashcard.back}
                      </span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell role="gridcell">{getStatusBadge(flashcard.status)}</TableCell>

                  {/* Source */}
                  <TableCell role="gridcell">{getSourceBadge(flashcard.source)}</TableCell>

                  {/* Created */}
                  <TableCell role="gridcell" className="text-sm text-muted-foreground">
                    {formatDate(flashcard.created_at)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell role="gridcell">
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSave(flashcard.id)}
                            disabled={isSaving}
                            aria-label="Save changes"
                            data-test-id={`flashcard-save-button-${flashcard.id}`}
                          >
                            <Check className="size-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancel(flashcard.id)}
                            disabled={isSaving}
                            aria-label="Cancel editing"
                            data-test-id={`flashcard-cancel-button-${flashcard.id}`}
                          >
                            <X className="size-4 text-red-600" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(flashcard)}
                            disabled={isDeleting}
                            aria-label="Edit flashcard"
                            data-test-id={`flashcard-edit-button-${flashcard.id}`}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(flashcard.id, flashcard.front)}
                            disabled={isDeleting}
                            aria-label="Delete flashcard"
                            data-test-id={`flashcard-delete-button-${flashcard.id}`}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
        </Table>
      </div>
    </>
  );
}
