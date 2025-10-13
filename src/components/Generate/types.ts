// View Model types for Generate view

export interface ProposalVM {
  id: string;
  front: string;
  back: string;
  wasEdited: boolean;
  removed: boolean;
}

export interface GenerationMetadata {
  generationId: string;
  model: string;
  sourceTextLength: number;
  sourceTextHash: string;
  createdAt: string;
}
