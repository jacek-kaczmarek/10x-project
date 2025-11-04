// src/components/Flashcards/AddFlashcardModal.tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AddFlashcardModalProps {
  onAdd: (front: string, back: string) => Promise<void>;
}

/**
 * Modal dialog for adding a new flashcard
 * Includes form validation matching API requirements (1-200 chars for front, 1-500 chars for back)
 */
export default function AddFlashcardModal({ onAdd }: AddFlashcardModalProps) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate front text
    const trimmedFront = front.trim();
    if (trimmedFront.length < 1) {
      toast.error("Validation error", {
        description: "Front text must be at least 1 character",
      });
      return;
    }
    if (trimmedFront.length > 200) {
      toast.error("Validation error", {
        description: "Front text must not exceed 200 characters",
      });
      return;
    }

    // Validate back text
    const trimmedBack = back.trim();
    if (trimmedBack.length < 1) {
      toast.error("Validation error", {
        description: "Back text must be at least 1 character",
      });
      return;
    }
    if (trimmedBack.length > 500) {
      toast.error("Validation error", {
        description: "Back text must not exceed 500 characters",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onAdd(trimmedFront, trimmedBack);
      toast.success("Flashcard created successfully");
      // Reset form and close modal
      setFront("");
      setBack("");
      setOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create flashcard";
      toast.error("Creation error", {
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!isSaving) {
      setFront("");
      setBack("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" aria-label="Add new flashcard manually" data-test-id="add-flashcard-button">
          <Plus className="size-4" />
          Add Flashcard
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby="add-flashcard-description">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Flashcard</DialogTitle>
            <DialogDescription id="add-flashcard-description">
              Create a new flashcard manually. Enter the front (question) and back (answer) text.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Front text input */}
            <div className="grid gap-2">
              <Label htmlFor="front" className="text-left">
                Front <span className="text-muted-foreground text-sm">(1-200 characters)</span>
              </Label>
              <Input
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Enter the question or term..."
                maxLength={200}
                required
                disabled={isSaving}
                aria-required="true"
                aria-label="Front text of flashcard"
                data-test-id="flashcard-front-input"
              />
              <p className="text-muted-foreground text-xs text-right">{front.length}/200</p>
            </div>

            {/* Back text input */}
            <div className="grid gap-2">
              <Label htmlFor="back" className="text-left">
                Back <span className="text-muted-foreground text-sm">(1-500 characters)</span>
              </Label>
              <Textarea
                id="back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Enter the answer or definition..."
                maxLength={500}
                required
                disabled={isSaving}
                aria-required="true"
                aria-label="Back text of flashcard"
                rows={4}
                data-test-id="flashcard-back-input"
              />
              <p className="text-muted-foreground text-xs text-right">{back.length}/500</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} data-test-id="flashcard-submit-button">
              {isSaving ? "Creating..." : "Create Flashcard"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
