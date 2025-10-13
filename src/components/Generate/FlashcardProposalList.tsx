import FlashcardItem from "./FlashcardItem";
import type { ProposalVM } from "./types";

interface FlashcardProposalListProps {
  proposals: ProposalVM[];
  onEdit: (id: string, front: string, back: string) => void;
  onRemove: (id: string) => void;
}

export default function FlashcardProposalList({ proposals, onEdit, onRemove }: FlashcardProposalListProps) {
  return (
    <ul className="space-y-4" role="list" aria-label="Lista propozycji fiszek">
      {proposals.map((proposal, index) => (
        <FlashcardItem
          key={proposal.id}
          proposal={proposal}
          index={index + 1}
          onChange={(front, back) => onEdit(proposal.id, front, back)}
          onRemove={() => onRemove(proposal.id)}
        />
      ))}
    </ul>
  );
}
