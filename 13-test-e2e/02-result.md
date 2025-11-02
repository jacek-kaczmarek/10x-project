# Dodanie atrybutów data-test-id do scenariusza E2E generowania fiszek

## Scenariusz testowy

1. Wpisz (wygenerowany) tekst 1200 znaków do generacji
2. Wygeneruj fiszki
3. Poczekaj na wynik
4. Zaakceptuj 2 fiszki (pierwszą, drugą)
5. Zapisz zaakceptowane fiszki
6. Zweryfikuj czy jesteś na stronie nowej generacji (brak listy fiszek, puste pole generacji)

## Dodane atrybuty data-test-id

### 1. GenerationForm (kroki 1-2)

**Plik:** `src/components/Generate/GenerationForm.tsx`

- ✅ `data-test-id="generation-source-text-input"` - pole textarea do wpisywania tekstu źródłowego
- ✅ `data-test-id="generation-submit-button"` - przycisk "Generate Flashcards"

### 2. ProgressBar (krok 3)

**Plik:** `src/components/Generate/ProgressBar.tsx`

- ✅ `data-test-id="generation-progress-container"` - kontener wskaźnika postępu
- ✅ `data-test-id="generation-progress-value"` - wartość procentowa postępu
- ✅ `data-test-id="generation-progress-bar"` - komponent Progress (pasek postępu)

### 3. FlashcardProposalList (krok 4)

**Plik:** `src/components/Generate/FlashcardProposalList.tsx`

- ✅ `data-test-id="flashcard-proposals-list"` - lista propozycji fiszek (element `<ul>`)

### 4. FlashcardItem (krok 4) - elementy powtarzalne

**Plik:** `src/components/Generate/FlashcardItem.tsx`

**Kontener fiszki:**

- ✅ `data-test-id="flashcard-item-{index}"` - element `<li>` pojedynczej fiszki (np. `flashcard-item-1`, `flashcard-item-2`)

**Przyciski akcji:**

- ✅ `data-test-id="flashcard-accept-button-{index}"` - przycisk akceptacji (checkmark) ✓
- ✅ `data-test-id="flashcard-edit-button-{index}"` - przycisk edycji (edit) ✏️
- ✅ `data-test-id="flashcard-remove-button-{index}"` - przycisk usunięcia (trash) 🗑️

**Pola edycji (tryb edycji):**

- ✅ `data-test-id="flashcard-front-input-{index}"` - pole input dla "Front" fiszki
- ✅ `data-test-id="flashcard-back-input-{index}"` - pole textarea dla "Back" fiszki

**Wyświetlanie treści (tryb odczytu):**

- ✅ `data-test-id="flashcard-front-display-{index}"` - wyświetlana treść "Front"
- ✅ `data-test-id="flashcard-back-display-{index}"` - wyświetlana treść "Back"

### 5. GenerateView - przyciski zapisywania (krok 5)

**Plik:** `src/components/Generate/GenerateView.tsx`

- ✅ `data-test-id="flashcard-save-actions"` - kontener przycisków zapisywania
- ✅ `data-test-id="flashcard-save-all-button"` - przycisk "Save all"
- ✅ `data-test-id="flashcard-save-accepted-button"` - przycisk "Save accepted"

## Mapa atrybutów według scenariusza

| Krok | Akcja                       | data-test-id                           | Element   |
| ---- | --------------------------- | -------------------------------------- | --------- |
| 1    | Wpisz tekst                 | `generation-source-text-input`         | Textarea  |
| 2    | Wygeneruj fiszki            | `generation-submit-button`             | Button    |
| 3    | Poczekaj na wynik           | `generation-progress-container`        | Div       |
| 3    | Sprawdź postęp              | `generation-progress-value`            | Span      |
| 3    | Obserwuj pasek postępu      | `generation-progress-bar`              | Progress  |
| 4    | Lista propozycji            | `flashcard-proposals-list`             | UL        |
| 4    | Pierwsza fiszka             | `flashcard-item-1`                     | LI        |
| 4    | Zaakceptuj pierwszą fiszkę  | `flashcard-accept-button-1`            | Button    |
| 4    | Druga fiszka                | `flashcard-item-2`                     | LI        |
| 4    | Zaakceptuj drugą fiszkę     | `flashcard-accept-button-2`            | Button    |
| 5    | Zapisz zaakceptowane fiszki | `flashcard-save-accepted-button`       | Button    |
| 6    | Sprawdź puste pole          | `generation-source-text-input`         | Textarea  |
| 6    | Sprawdź brak listy          | `flashcard-proposals-list` (not exist) | UL (brak) |

## Propozycje dotyczące identyfikowalności elementów powtarzalnych

### Obecne rozwiązanie ✅ (ZAIMPLEMENTOWANE)

Użycie dynamicznego indeksu w atrybutach `data-test-id`:

```tsx
data-test-id={`flashcard-item-${index}`}
data-test-id={`flashcard-accept-button-${index}`}
```

**Zalety:**

- ✅ Proste i przewidywalne
- ✅ Zgodne z kolejnością wyświetlania (1-10)
- ✅ Łatwe do użycia w testach: `page.locator('[data-test-id="flashcard-item-1"]')`
- ✅ Czytelne w kodzie testu

**Wady:**

- ⚠️ Zależne od kolejności renderowania
- ⚠️ Problemy przy sortowaniu/filtracji (jeśli zostanie dodane)

### Propozycja alternatywna 1: UUID/ID propozycji (NIE WPROWADZONO)

```tsx
data-test-id={`flashcard-item-${proposal.id}`}
data-test-id={`flashcard-accept-button-${proposal.id}`}
```

**Zalety:**

- ✅ Stabilne niezależnie od kolejności
- ✅ Unikalne dla każdej propozycji

**Wady:**

- ❌ Trudniejsze do użycia w testach (długie UUID: `proposal-0`, `proposal-1`)
- ❌ Mniej czytelne w testach
- ❌ Wymaga znajomości ID z API

### Propozycja alternatywna 2: Kombinacja indeksu i roli (NIE WPROWADZONO)

```tsx
data-test-id="flashcard-item"
data-test-index={index}
data-test-role="proposal"
```

**Zalety:**

- ✅ Możliwość selekcji wszystkich fiszek: `[data-test-id="flashcard-item"]`
- ✅ Możliwość selekcji konkretnej: `[data-test-id="flashcard-item"][data-test-index="1"]`

**Wady:**

- ❌ Bardziej złożone selektory w testach
- ❌ Niestandardowe podejście (zwykle używa się tylko data-test-id)

### Propozycja alternatywna 3: ARIA + data-test-id (NIE WPROWADZONO)

```tsx
data-test-id="flashcard-item"
aria-label={`Flashcard proposal ${index}`}
aria-posinset={index}
aria-setsize={proposals.length}
```

**Zalety:**

- ✅ Zgodność z dostępnością (ARIA)
- ✅ Semantyczne atrybuty
- ✅ Możliwość użycia różnych selektorów

**Wady:**

- ❌ Bardziej złożone w implementacji
- ❌ Duplikacja informacji (już mamy aria-label w przyciskach)

## Rekomendacja

**Pozostawić obecne rozwiązanie** z dynamicznym indeksem (`flashcard-item-${index}`), ponieważ:

1. ✅ Jest najprostsze i najczęściej stosowane w testach E2E
2. ✅ Spełnia wymagania scenariusza testowego
3. ✅ Czytelne i przewidywalne dla testerów
4. ✅ Nie wymaga znajomości wewnętrznych ID z API
5. ✅ Łatwe w debugowaniu (DevTools)

**Jeśli w przyszłości** pojawią się:

- Sortowanie listy fiszek
- Filtrowanie propozycji
- Edycja kolejności

Wówczas warto rozważyć **propozycję 1** (użycie `proposal.id` zamiast `index`).

## Przykładowy kod testu Playwright

```typescript
// Krok 1: Wpisz tekst
await page.locator('[data-test-id="generation-source-text-input"]').fill(generatedText);

// Krok 2: Wygeneruj fiszki
await page.locator('[data-test-id="generation-submit-button"]').click();

// Krok 3: Poczekaj na wynik
await page.waitForSelector('[data-test-id="generation-progress-container"]');
await page.waitForSelector('[data-test-id="flashcard-proposals-list"]');

// Krok 4: Zaakceptuj 2 fiszki (pierwszą, drugą)
await page.locator('[data-test-id="flashcard-accept-button-1"]').click();
await page.locator('[data-test-id="flashcard-accept-button-2"]').click();

// Krok 5: Zapisz zaakceptowane fiszki
await page.locator('[data-test-id="flashcard-save-accepted-button"]').click();

// Krok 6: Zweryfikuj czy jesteś na stronie nowej generacji
await expect(page.locator('[data-test-id="generation-source-text-input"]')).toHaveValue("");
await expect(page.locator('[data-test-id="flashcard-proposals-list"]')).not.toBeVisible();
```

## Status

✅ **Zaimplementowano** wszystkie atrybuty `data-test-id` potrzebne do scenariusza testowego.
✅ **Sformatowano** kod za pomocą Prettier.
📝 **Udokumentowano** propozycje alternatywne (bez implementacji zgodnie z instrukcją).
