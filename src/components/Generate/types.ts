// View Model types for Generate view

import type { FlashcardProposalDTO } from "@/types";

export interface ProposalVM extends FlashcardProposalDTO {
  id: string;
  wasEdited: boolean;
  wasAccepted: boolean;
  removed: boolean;
}

export interface GenerationMetadata {
  generationId: string;
  model: string;
  sourceTextLength: number;
  sourceTextHash: string;
  createdAt: string;
}
