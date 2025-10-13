import FlashcardItem from "./FlashcardItem";
import type { ProposalVM } from "./types";

interface FlashcardProposalListProps {
  proposals: ProposalVM[];
  onEdit: (id: string, front: string, back: string) => void;
  onRemove: (id: string) => void;
  onToggleAccept: (id: string) => void;
}

export default function FlashcardProposalList({
  proposals,
  onEdit,
  onRemove,
  onToggleAccept,
}: FlashcardProposalListProps) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" aria-label="Lista propozycji fiszek">
      {proposals.map((proposal, index) => (
        <FlashcardItem
          key={proposal.id}
          proposal={proposal}
          index={index + 1}
          onChange={(front, back) => onEdit(proposal.id, front, back)}
          onRemove={() => onRemove(proposal.id)}
          onToggleAccept={() => onToggleAccept(proposal.id)}
        />
      ))}
    </ul>
  );
}
