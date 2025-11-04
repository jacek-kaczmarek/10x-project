// src/components/Flashcards/DeleteConfirmationModal.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  flashcardText: string;
  isDeleting: boolean;
}

/**
 * Modal dialog for confirming flashcard deletion
 * Replaces the native window.confirm with a nicer UI
 */
export default function DeleteConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  flashcardText,
  isDeleting,
}: DeleteConfirmationModalProps) {
  const truncatedText = flashcardText.slice(0, 50) + (flashcardText.length > 50 ? "..." : "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="delete-confirmation-description">
        <DialogHeader>
          <DialogTitle>Delete Flashcard</DialogTitle>
          <DialogDescription id="delete-confirmation-description">
            Are you sure you want to delete this flashcard? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-md border bg-muted/50 p-3">
            <p className="text-sm font-medium text-muted-foreground">Front:</p>
            <p className="text-sm mt-1">&ldquo;{truncatedText}&rdquo;</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            data-test-id="delete-cancel-button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            data-test-id="delete-confirm-button"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
