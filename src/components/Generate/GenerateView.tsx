import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import GenerationForm from "./GenerationForm";
import ProgressBar from "./ProgressBar";
import FlashcardProposalList from "./FlashcardProposalList";
import { Button } from "@/components/ui/button";
import { useGenerateFlashcards } from "./hooks/useGenerateFlashcards";
import type { ProposalVM, GenerationMetadata } from "./types";

export default function GenerateView() {
  const [sourceText, setSourceText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<GenerationMetadata | null>(null);
  const [proposals, setProposals] = useState<ProposalVM[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { loading, progress, generateFlashcards } = useGenerateFlashcards();

  // Validate source text length
  const validateSourceText = (text: string): boolean => {
    if (text.length < 1000) {
      setValidationError("Text must contain at least 1000 characters");
      return false;
    }
    if (text.length > 10000) {
      setValidationError("Text can contain at most 10000 characters");
      return false;
    }
    setValidationError(null);
    return true;
  };

  // Handle source text change
  const handleSourceTextChange = (text: string) => {
    setSourceText(text);
    if (text.length >= 1000 && text.length <= 10000) {
      setValidationError(null);
    }
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!validateSourceText(sourceText)) {
      return;
    }

    try {
      const result = await generateFlashcards(sourceText);

      // Transform API response to ProposalVM
      const proposalVMs: ProposalVM[] = result.proposals.map((p, index) => ({
        id: `proposal-${index}`,
        front: p.front,
        back: p.back,
        wasEdited: false,
        wasAccepted: false,
        removed: false,
      }));
      setMetadata({
        generationId: result.generation_id,
        model: result.model,
        sourceTextLength: result.source_text_length,
        sourceTextHash: result.source_text_hash,
        createdAt: result.created_at,
      });
      setProposals(proposalVMs);

      toast.success(`Generated ${result.flashcards_generated} flashcards`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred during generation";
      toast.error("Generation error", {
        description: errorMessage,
      });
    }
  };

  // Handle proposal edit
  const handleProposalEdit = (id: string, front: string, back: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, front, back, wasEdited: p.front !== front || p.back !== back } : p))
    );
  };

  // Handle proposal remove
  const handleProposalRemove = (id: string) => {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, removed: true } : p)));
  };

  // Handle proposal toggle accept
  const handleProposalToggleAccept = (id: string) => {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, wasAccepted: !p.wasAccepted } : p)));
  };

  // Validate proposals before saving
  const validateProposals = (onlyAccepted: boolean): boolean => {
    const activeProposals = proposals.filter((p) => !p.removed && (!onlyAccepted || p.wasAccepted));

    if (activeProposals.length === 0) {
      toast.error("No flashcards to save", {
        description: onlyAccepted ? "You must accept at least one flashcard" : "You must keep at least one flashcard",
      });
      return false;
    }

    for (const proposal of activeProposals) {
      if (proposal.front.length < 1 || proposal.front.length > 200) {
        toast.error("Validation error", {
          description: "Flashcard front must contain 1-200 characters",
        });
        return false;
      }
      if (proposal.back.length < 1 || proposal.back.length > 500) {
        toast.error("Validation error", {
          description: "Flashcard back must contain 1-500 characters",
        });
        return false;
      }
    }

    return true;
  };

  // Handle save flashcards (onlyAccepted: true for accepted only, false for all)
  const handleSaveFlashcards = async (onlyAccepted: boolean) => {
    if (!metadata || !validateProposals(onlyAccepted)) {
      return;
    }

    setIsSaving(true);

    try {
      const activeProposals = proposals.filter((p) => !p.removed && (!onlyAccepted || p.wasAccepted));

      const response = await fetch("/api/flashcards/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generation_id: metadata.generationId,
          proposals: activeProposals.map((p) => ({
            front: p.front,
            back: p.back,
            was_edited: p.wasEdited,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Error saving flashcards");
      }

      const data = await response.json();
      toast.success(`Saved ${data.saved_count} flashcards`);

      // Redirect to flashcards list or home after successful save
      window.location.href = "/";
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred during saving";
      toast.error("Save error", {
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const activeProposalsCount = proposals.filter((p) => !p.removed).length;
  const acceptedProposalsCount = proposals.filter((p) => !p.removed && p.wasAccepted).length;
  const showProposals = proposals.length > 0 && !loading;
  const showSaveButtons = showProposals && activeProposalsCount > 0;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Toaster />

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Generate Flashcards</h1>
        <p className="text-muted-foreground">
          Paste text (1000-10000 characters), and AI will generate 10 flashcard proposals for you
        </p>
      </div>

      <GenerationForm
        sourceText={sourceText}
        validationError={validationError}
        loading={loading}
        onSourceTextChange={handleSourceTextChange}
        onGenerate={handleGenerate}
      />

      {loading && (
        <div className="mt-8">
          <ProgressBar progress={progress} />
        </div>
      )}

      {showProposals && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Flashcard Proposals ({activeProposalsCount}/{proposals.length})
              {acceptedProposalsCount > 0 && (
                <span className="ml-2 text-sm font-normal text-green-600">({acceptedProposalsCount} accepted)</span>
              )}
            </h2>
            {metadata && <p className="text-sm text-muted-foreground">Model: {metadata.model}</p>}
          </div>

          {showSaveButtons && (
            <div className="flex gap-3">
              <Button
                onClick={() => handleSaveFlashcards(false)}
                disabled={isSaving}
                size="lg"
                variant="outline"
                data-test-id="flashcard-save-all-button"
              >
                {isSaving ? "Saving..." : `Save all (${activeProposalsCount})`}
              </Button>
              <Button
                onClick={() => handleSaveFlashcards(true)}
                disabled={isSaving || acceptedProposalsCount === 0}
                size="lg"
                data-test-id="flashcard-save-accepted-button"
              >
                {isSaving ? "Saving..." : `Save accepted (${acceptedProposalsCount})`}
              </Button>
            </div>
          )}

          <FlashcardProposalList
            proposals={proposals}
            onEdit={handleProposalEdit}
            onRemove={handleProposalRemove}
            onToggleAccept={handleProposalToggleAccept}
          />
        </div>
      )}
    </div>
  );
}
