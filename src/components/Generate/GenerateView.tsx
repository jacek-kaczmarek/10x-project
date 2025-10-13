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
      setValidationError("Tekst musi zawierać minimum 1000 znaków");
      return false;
    }
    if (text.length > 10000) {
      setValidationError("Tekst może zawierać maksymalnie 10000 znaków");
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

      toast.success(`Wygenerowano ${result.flashcards_generated} fiszek`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił błąd podczas generowania";
      toast.error("Błąd generowania", {
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

  // Validate proposals before saving
  const validateProposals = (): boolean => {
    const activeProposals = proposals.filter((p) => !p.removed);

    if (activeProposals.length === 0) {
      toast.error("Brak fiszek do zapisania", {
        description: "Musisz zostawić co najmniej jedną fiszkę",
      });
      return false;
    }

    for (const proposal of activeProposals) {
      if (proposal.front.length < 1 || proposal.front.length > 200) {
        toast.error("Błąd walidacji", {
          description: "Przód fiszki musi zawierać 1-200 znaków",
        });
        return false;
      }
      if (proposal.back.length < 1 || proposal.back.length > 500) {
        toast.error("Błąd walidacji", {
          description: "Tył fiszki musi zawierać 1-500 znaków",
        });
        return false;
      }
    }

    return true;
  };

  // Handle save flashcards
  const handleSaveFlashcards = async () => {
    if (!metadata || !validateProposals()) {
      return;
    }

    setIsSaving(true);

    try {
      const activeProposals = proposals.filter((p) => !p.removed);

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
        throw new Error(errorData.error?.message || "Błąd zapisu fiszek");
      }

      const data = await response.json();
      toast.success(`Zapisano ${data.saved_count} fiszek`);

      // Redirect to flashcards list or home after successful save
      window.location.href = "/";
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił błąd podczas zapisywania";
      toast.error("Błąd zapisu", {
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const activeProposalsCount = proposals.filter((p) => !p.removed).length;
  const showProposals = proposals.length > 0 && !loading;
  const showSaveButton = showProposals && activeProposalsCount > 0;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Toaster />

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Generuj fiszki</h1>
        <p className="text-muted-foreground">
          Wklej tekst (1000-10000 znaków), a AI wygeneruje dla Ciebie 10 propozycji fiszek
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
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Propozycje fiszek ({activeProposalsCount}/{proposals.length})
            </h2>
            {metadata && <p className="text-sm text-muted-foreground">Model: {metadata.model}</p>}
          </div>

          <FlashcardProposalList proposals={proposals} onEdit={handleProposalEdit} onRemove={handleProposalRemove} />

          {showSaveButton && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveFlashcards} disabled={isSaving} size="lg">
                {isSaving ? "Zapisywanie..." : `Zapisz fiszki (${activeProposalsCount})`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
