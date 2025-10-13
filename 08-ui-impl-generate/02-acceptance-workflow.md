# Acceptance Workflow Implementation

## Overview
Implemented acceptance workflow for flashcard proposals with two separate save actions:
1. **Zapisz zaakceptowane** - Saves only accepted proposals
2. **Zapisz wszystkie** - Saves all non-removed proposals

## Changes Made

### 1. Types (`src/components/Generate/types.ts`)
- ✅ `ProposalVM` now extends `FlashcardProposalDTO` (proper DTO reuse)
- ✅ Added `wasAccepted: boolean` field to track acceptance state

### 2. FlashcardItem Component (`src/components/Generate/FlashcardItem.tsx`)
Added acceptance functionality:
- ✅ New acceptance button with checkmark icon
- ✅ Visual indicators:
  - Green border and background tint for accepted cards
  - "(zaakceptowana)" label displayed
  - Button changes to filled green when accepted
- ✅ `onToggleAccept` callback prop
- ✅ Import `Check` icon from lucide-react

### 3. FlashcardProposalList Component (`src/components/Generate/FlashcardProposalList.tsx`)
- ✅ Added `onToggleAccept` prop and passed to `FlashcardItem`

### 4. GenerateView Component (`src/components/Generate/GenerateView.tsx`)

#### State Management
- ✅ `wasAccepted: false` initialized when creating proposals from API response
- ✅ New handler: `handleProposalToggleAccept` - toggles acceptance state

#### Validation
- ✅ Updated `validateProposals(onlyAccepted: boolean)` to filter by acceptance when needed
- ✅ Different error messages for accepted vs all proposals

#### Save Logic
- ✅ Updated `handleSaveFlashcards(onlyAccepted: boolean)` parameter
- ✅ Filters proposals based on `onlyAccepted` flag
- ✅ Both paths use same API endpoint with filtered data

#### UI Updates
- ✅ Track `acceptedProposalsCount` separately from `activeProposalsCount`
- ✅ Display accepted count in header: "(X zaakceptowanych)"
- ✅ Two save buttons:
  - **Zapisz wszystkie (N)** - outline variant, saves all active proposals
  - **Zapisz zaakceptowane (N)** - primary variant, saves only accepted proposals
- ✅ "Zapisz zaakceptowane" button disabled when no proposals are accepted

## User Workflow

1. User generates flashcards from source text
2. Each proposal displays with:
   - Edit fields (front/back)
   - Checkmark button (acceptance toggle)
   - Trash button (removal)
3. User can:
   - Edit any proposal (marks as `wasEdited`)
   - Click checkmark to accept (green visual feedback)
   - Click trash to remove (marks as `removed`)
4. At save time, user chooses:
   - **Zapisz wszystkie**: Saves all non-removed proposals (regardless of acceptance)
   - **Zapisz zaakceptowane**: Saves only accepted and non-removed proposals

## Technical Details

### Filtering Logic
```typescript
// For "Zapisz wszystkie"
proposals.filter((p) => !p.removed)

// For "Zapisz zaakceptowane"
proposals.filter((p) => !p.removed && p.wasAccepted)
```

### Visual States
- **Default**: White card with normal border
- **Edited**: Blue border/background tint + "(edytowana)" label
- **Accepted**: Green border/background tint + "(zaakceptowana)" label + filled green checkmark button
- **Removed**: Dashed border, muted, grayed out

### DTO Reuse
`ProposalVM` properly extends `FlashcardProposalDTO`:
```typescript
export interface ProposalVM extends FlashcardProposalDTO {
  id: string;
  wasEdited: boolean;
  wasAccepted: boolean;
  removed: boolean;
}
```

This ensures:
- No duplication of `front` and `back` fields
- Type safety if DTO changes
- Clear relationship between view model and data transfer object

## No Linter Errors
All code passes linting requirements.

