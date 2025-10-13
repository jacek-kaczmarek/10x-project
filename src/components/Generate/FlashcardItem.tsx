import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { ProposalVM } from "./types";
import { cn } from "@/lib/utils";

interface FlashcardItemProps {
  proposal: ProposalVM;
  index: number;
  onChange: (front: string, back: string) => void;
  onRemove: () => void;
}

export default function FlashcardItem({ proposal, index, onChange, onRemove }: FlashcardItemProps) {
  const [front, setFront] = useState(proposal.front);
  const [back, setBack] = useState(proposal.back);

  const handleFrontChange = (value: string) => {
    setFront(value);
    onChange(value, back);
  };

  const handleBackChange = (value: string) => {
    setBack(value);
    onChange(front, value);
  };

  const frontValid = front.length >= 1 && front.length <= 200;
  const backValid = back.length >= 1 && back.length <= 500;

  if (proposal.removed) {
    return (
      <li className="rounded-lg border border-dashed bg-muted/50 p-4 opacity-50">
        <p className="text-sm text-muted-foreground">Fiszka #{index} została usunięta</p>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "rounded-lg border bg-card p-4 transition-all",
        proposal.wasEdited && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Fiszka #{index}
          {proposal.wasEdited && <span className="ml-2 text-xs text-primary">(edytowana)</span>}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={`Usuń fiszkę ${index}`}
          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label htmlFor={`front-${proposal.id}`} className="text-sm font-medium">
            Przód fiszki
          </label>
          <Input
            id={`front-${proposal.id}`}
            value={front}
            onChange={(e) => handleFrontChange(e.target.value)}
            maxLength={200}
            placeholder="Pytanie lub termin"
            aria-invalid={!frontValid}
            className={cn(!frontValid && "border-destructive focus-visible:ring-destructive")}
          />
          <div className="flex justify-between text-xs">
            <span className={cn("text-muted-foreground", !frontValid && "text-destructive")}>
              {front.length} / 200 znaków
            </span>
            {!frontValid && front.length > 0 && (
              <span className="text-destructive">{front.length === 0 ? "Pole wymagane" : "Zbyt długie"}</span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor={`back-${proposal.id}`} className="text-sm font-medium">
            Tył fiszki
          </label>
          <Textarea
            id={`back-${proposal.id}`}
            value={back}
            onChange={(e) => handleBackChange(e.target.value)}
            maxLength={500}
            placeholder="Odpowiedź lub definicja"
            className={cn("min-h-[100px] resize-y", !backValid && "border-destructive focus-visible:ring-destructive")}
            aria-invalid={!backValid}
          />
          <div className="flex justify-between text-xs">
            <span className={cn("text-muted-foreground", !backValid && "text-destructive")}>
              {back.length} / 500 znaków
            </span>
            {!backValid && back.length > 0 && (
              <span className="text-destructive">{back.length === 0 ? "Pole wymagane" : "Zbyt długie"}</span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
