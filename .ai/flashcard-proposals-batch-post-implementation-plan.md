# API Endpoint Implementation Plan: Save Flashcard Proposals (Batch)

## 1. Przegląd punktu końcowego
Endpoint `POST /api/flashcards/batch` pozwala na zapisanie wielu propozycji fiszek wygenerowanych przez AI. Aplikacja przyjmuje zestaw surowych propozycji (front/back) z identyfikatorem generacji, waliduje je, ustawia odpowiednie pola (`source`, `status`, parametry SR) i wykonuje zbiorczy insert do tabeli `flashcards`.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Ścieżka URL: `/api/flashcards/batch`
- Nagłówki:
  - `Content-Type: application/json`
- Parametry:
  - Brak parametrów w URL
- Body (JSON):
  ```json
  {
    "generation_id": "uuid",
    "proposals": [
      { "front": "string (1-200)\n", "back": "string (1-500)", "was_edited": true|false }
      // minimum 1, maksimum 10 elementów
    ]
  }
  ```

### Parametry żądania
- Wymagane:
  - `generation_id` (UUID) – musi wskazywać istniejący rekord w tabeli `generations`
  - `proposals` (tablica) – od 1 do 10 obiektów
    - `front` (string) – 1-200 znaków
    - `back` (string) – 1-500 znaków
    - `was_edited` (boolean)
- Opcjonalne: brak

## 3. Wykorzystywane typy
- Command Model: `SaveFlashcardProposalsCommand` (zdefiniowany w `src/types.ts`)
- DTO odpowiedzi: `SaveFlashcardProposalsResponseDTO` (zdefiniowany w `src/types.ts`)
- Core Entity: `FlashcardDTO` (pełna encja z tabeli `flashcards`)

## 4. Szczegóły odpowiedzi
- Kod statusu 201 Created
- Body (JSON):
  ```json
  {
    "saved_count": number,
    "flashcards": FlashcardDTO[]
  }
  ```
- Kody błędów:
  - 400 Bad Request – walidacja danych wejściowych (brak pól, niepoprawne długości, rozmiar tablicy)
  - 404 Not Found – `generation_id` nie istnieje
  - 500 Internal Server Error – błąd bazy danych lub nieprzewidziany wyjątek

## 5. Przepływ danych
1. Odbiór żądania w `src/pages/api/flashcards/batch/index.ts`
2. Parsowanie i walidacja wejścia za pomocą Zod
3. Sprawdzenie istnienia `generation_id` w tabeli `generations`
4. Mapowanie każdego obiektu propozycji:
   - `source` = `'ai'` gdy `was_edited=false`, `'ai-edited'` gdy `was_edited=true`
   - `status` = `'active'`
   - `due_date` = NOW(), `interval`=0, `ease_factor`=2.5, `repetitions`=0
5. Wykonanie batch insert do tabeli `flashcards`
6. Zwrócenie liczby zapisanych rekordów i pełnych encji w odpowiedzi

## 6. Względy bezpieczeństwa
- Uwierzytelnianie/Autoryzacja:
  - Obecnie brak – publiczny dostęp w fazie MVP
  - W przyszłości: 401 dla nieautoryzowanych
- SQL Injection:
  - Korzystanie z Supabase (parametryzowane zapytania)
- Limitacja rozmiaru:
  - Ograniczenie liczby propozycji do 10
- Sanitizacja danych:
  - Trimowanie i sprawdzenie długości `front` i `back`

## 7. Obsługa błędów
- **400 Bad Request**:
  - `VALIDATION_ERROR` – szczegóły w `error.details` (pole, constraint)
- **404 Not Found**:
  - `NOT_FOUND` – gdy `generation_id` nie istnieje
- **500 Internal Server Error**:
  - `DATABASE_ERROR` – błąd podczas insertu
  - `UNKNOWN_ERROR` – nieprzewidziane wyjątki

## 8. Rozważania dotyczące wydajności
- Zbiorczy insert (batch) ogranicza liczbę zapytań
- Indeks na `flashcards(generation_id)` przyspiesza weryfikację
- Ograniczenie rozmiaru tablicy zapobiega nadmiernemu obciążeniu

## 9. Kroki implementacji
1. Utworzyć plik walidatora w `src/lib/validators/flashcards.ts` z Zod schema dla `SaveFlashcardProposalsCommand`.
2. Dodanie nowej usługi (service) w `src/lib/services/flashcard.service.ts`:
   - Metoda `saveProposals(command: SaveFlashcardProposalsCommand): Promise<SaveFlashcardProposalsResponseDTO>`
3. Utworzyć endpoint w `src/pages/api/flashcards/batch/index.ts`:
   - Importować Zod schema, typy, supabase z `locals`
   - Wywoływać serwis, obsługiwać błędy
4. Dodać testy jednostkowe dla:
   - Walidatora (Zod)
   - Logiki serwisu (mock Supabase)
   - Endpointu (integracja z Supabase emulator)
5. Zaktualizować dokumentację API (README lub pliki specyfikacji)
6. Wykonać code review i wdrożyć na środowisko staging
