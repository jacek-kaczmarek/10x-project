# Plan implementacji widoku Generate

## 1. Przegląd
Widok `Generate` pozwala użytkownikowi wkleić tekst źródłowy (1000–10000 znaków), uruchomić generowanie 10 propozycji fiszek AI, edytować lub usuwać propozycje, a następnie zaakceptować i zapisać wybrane fiszki.

## 2. Routing widoku
- Ścieżka strony: `/generate`
- Plik Astro: `src/pages/generate.astro`

## 3. Struktura komponentów
```
PageGenerate (Astro)
└─ ReactHydrateWrapper (client:load)
   └─ GenerateView (React)
      ├─ GenerationForm
      ├─ ProgressBar / Skeleton (widoczny podczas ładowania)
      ├─ FlashcardProposalList
      │  └─ FlashcardCard[]
      └─ Button "Zapisz fiszki" (widoczny po wygenerowaniu)
```

## 4. Szczegóły komponentów

### GenerationForm
- Opis: formularz z `textarea` i przyciskiem generowania.
- Elementy:
  - `<textarea>` z `aria-label="Tekst źródłowy"`
  - `<Button>` (Shadcn/ui) "Generuj"
  - Komunikaty walidacji długości (1k–10k).
- Zdarzenia:
  - `onChange(sourceText:string)`
  - `onSubmit()`
- Walidacja:
  - `sourceText.length >= 1000 && <= 10000`
- Typy:
  - `CreateGenerationCommand { source_text: string }`
- Propsy:
  - `onGenerate(sourceText: string): void`

### ProgressBar
- Opis: wskazuje procentowy postęp generowania.
- Elementy:
  - `<div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-live="polite">`
  - Label z tekstem "Trwa generowanie: {progress}%"
- Propsy:
  - `progress: number`

### FlashcardProposalList
- Opis: lista edytowalnych propozycji.
- Elementy:
  - `<ul>` zawierające `FlashcardItem`.
- Propsy:
  - `proposals: ProposalVM[]`
  - `onEdit(id, front, back)`
  - `onRemove(id)`

### FlashcardItem
- Opis: pojedyncza karta z polami front/back.
- Elementy:
  - `<input>` dla front (max 200 znaków)
  - `<textarea>` dla back (max 500 znaków)
  - `<Button>` usuń
- Zdarzenia:
  - `onChange({ front, back })`
  - `onRemove()`
- Walidacja:
  - `front.length ∈ [1,200]`, `back.length ∈ [1,500]`
- Typy:
  - `ProposalVM { id, front, back, wasEdited, removed }`
- Propsy:
  - `proposal: ProposalVM`
  - `onChange(updated: ProposalVM)`
  - `onRemove(id: string)`

### Button "Zapisz fiszki"
- Wyzwala zapis batch.
- Propsy:
  - `onClick()`

## 5. Typy
- ProposalVM:
  ```ts
  interface ProposalVM {
    id: string;
    front: string;
    back: string;
    wasEdited: boolean;
    removed: boolean;
  }
  ```
- GenerationMetadata:
  ```ts
  interface GenerationMetadata {
    generationId: string;
    model: string;
    sourceTextLength: number;
    sourceTextHash: string;
    createdAt: string;
  }
  ```

## 6. Zarządzanie stanem
- useState, useEffect
- GenerateView:
  - `sourceText: string`
  - `validationError: string|null`
  - `loading: boolean`
  - `progress: number`
  - `metadata: GenerationMetadata|null`
  - `proposals: ProposalVM[]`
  - `apiError: string|null`
- Custom hooks:
  - `useDebounce(value, delay)` – debouncing textarea.
  - `useGenerateFlashcards()` – obsługa API, symulacja progress.

## 7. Integracja API
1. `POST /api/generations`
   - Request: `CreateGenerationCommand`
   - Response: `CreateGenerationResponseDTO`
2. `POST /api/flashcards/batch`
   - Request: `SaveFlashcardProposalsCommand`
   - Response: `SaveFlashcardProposalsResponseDTO`

## 8. Interakcje użytkownika
- Wklejenie/edycja tekstu → walidacja, aktualizacja `validationError`.
- Kliknięcie "Generuj" → `startGeneration()`, `loading=true`, `progress` animowany.
- Wyświetlenie `ProgressBar` → aktualizacje procentowe.
- Po zakończeniu → lista `FlashcardProposalList`.
- Edycja/usunięcie pozycji → aktualizacja stanu `proposals`.
- Kliknięcie "Zapisz fiszki" → walidacja propozycji, wywołanie batch, redirect.

## 9. Warunki i walidacja
- `sourceText.length ∈ [1000,10000]`
- `proposals` min 1, max 10.
- `front.length ∈ [1,200]`, `back.length ∈ [1,500]` przed zapisem.

## 10. Obsługa błędów
- Walidacja wejścia → komunikaty inline.
- Błąd generacji → Toast (Kod i message z `ErrorResponseDTO`).
- Błąd batch save → Toast i możliwość ponowienia.

## 11. Kroki implementacji
1. Utworzyć `src/pages/generate.astro` z wrapperem React.
2. Stworzyć folder `src/components/Generate`.
3. Implementować `GenerateView` z useState i custom hookami.
4. Dodać komponenty: `GenerationForm`, `ProgressBar`, `FlashcardProposalList`, `FlashcardItem`.
5. Zaimplementować walidację i obsługę zdarzeń.
6. Napisać hook `useGenerateFlashcards` do wywołania API i symulacji progress.
7. Zaimplementować batch save i redirect po sukcesie.
8. Dodać Toasty dla błędów i skeleton podczas loadingu.
9. Dostosować style Tailwind i komponenty Shadcn/ui.
10. Przetestować scenariusze: sukces, błędy, walidacja.
