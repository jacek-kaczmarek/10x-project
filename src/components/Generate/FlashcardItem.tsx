import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Check, Edit, X } from "lucide-react";
import type { ProposalVM } from "./types";
import { cn } from "@/lib/utils";

interface FlashcardItemProps {
  proposal: ProposalVM;
  index: number;
  onChange: (front: string, back: string) => void;
  onRemove: () => void;
  onToggleAccept: () => void;
}

export default function FlashcardItem({ proposal, index, onChange, onRemove, onToggleAccept }: FlashcardItemProps) {
  const [isEditing, setIsEditing] = useState(false);
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

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const frontValid = front.length >= 1 && front.length <= 200;
  const backValid = back.length >= 1 && back.length <= 500;

  if (proposal.removed) {
    return (
      <li className="rounded-lg border border-dashed bg-muted/50 p-3 opacity-50">
        <p className="text-sm text-muted-foreground">Flashcard #{index} has been removed</p>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "rounded-lg border bg-card transition-colors min-h-[240px] flex flex-col",
        proposal.wasEdited && "border-primary/50 bg-primary/5",
        proposal.wasAccepted && "border-green-500/50 bg-green-500/5"
      )}
    >
      <div className="p-3 pb-2 flex items-center justify-between">
        <h3 className="text-xs font-medium text-muted-foreground">
          Flashcard #{index}
          {proposal.wasEdited && <span className="ml-1.5 text-xs text-primary">(edited)</span>}
          {proposal.wasAccepted && <span className="ml-1.5 text-xs text-green-600">(accepted)</span>}
        </h3>
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleAccept}
            aria-label={`${proposal.wasAccepted ? "Unmark" : "Accept"} flashcard ${index}`}
            className={cn(
              "h-7 w-7 p-0",
              proposal.wasAccepted
                ? "bg-green-600 text-white hover:bg-green-700"
                : "text-muted-foreground hover:bg-green-600/10 hover:text-green-600"
            )}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEditToggle}
            aria-label={`${isEditing ? "Cancel editing" : "Edit"} flashcard ${index}`}
            className={cn(
              "h-7 w-7 p-0",
              isEditing
                ? "text-muted-foreground hover:bg-muted"
                : "text-blue-600 hover:bg-blue-600/10 hover:text-blue-700"
            )}
          >
            {isEditing ? <X className="h-3.5 w-3.5" /> : <Edit className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={`Remove flashcard ${index}`}
            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="px-3 pb-3 pt-0 space-y-2 flex-1 flex flex-col">
        {isEditing ? (
          <>
            <div className="space-y-1">
              <label htmlFor={`front-${proposal.id}`} className="text-xs font-medium">
                Front
              </label>
              <Input
                id={`front-${proposal.id}`}
                value={front}
                onChange={(e) => handleFrontChange(e.target.value)}
                maxLength={200}
                placeholder="Question or term"
                aria-invalid={!frontValid}
                className={cn("h-9 text-sm", !frontValid && "border-destructive focus-visible:ring-destructive")}
              />
              <div className="flex justify-between text-xs min-h-[16px]">
                <span className={cn("text-muted-foreground", !frontValid && "text-destructive")}>
                  {front.length} / 200
                </span>
                {!frontValid && front.length > 0 && (
                  <span className="text-destructive">{front.length === 0 ? "Required" : "Too long"}</span>
                )}
              </div>
            </div>

            <div className="space-y-1 flex-1 flex flex-col">
              <label htmlFor={`back-${proposal.id}`} className="text-xs font-medium">
                Back
              </label>
              <Textarea
                id={`back-${proposal.id}`}
                value={back}
                onChange={(e) => handleBackChange(e.target.value)}
                maxLength={500}
                placeholder="Answer or definition"
                className={cn(
                  "flex-1 text-sm resize-none",
                  !backValid && "border-destructive focus-visible:ring-destructive"
                )}
                aria-invalid={!backValid}
              />
              <div className="flex justify-between text-xs min-h-[16px]">
                <span className={cn("text-muted-foreground", !backValid && "text-destructive")}>
                  {back.length} / 500
                </span>
                {!backValid && back.length > 0 && (
                  <span className="text-destructive">{back.length === 0 ? "Required" : "Too long"}</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <div className="text-xs font-medium">Front</div>
              <div className="text-sm leading-snug break-words min-h-[36px] flex items-center">{front}</div>
              <div className="min-h-[16px]"></div>
            </div>

            <div className="space-y-1 flex-1 flex flex-col">
              <div className="text-xs font-medium">Back</div>
              <div className="text-sm leading-snug break-words flex-1 overflow-y-auto">{back}</div>
              <div className="min-h-[16px]"></div>
            </div>
          </>
        )}
      </div>
    </li>
  );
}
