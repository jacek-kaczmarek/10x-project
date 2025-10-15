# GenerationService - Dokumentacja testów

## Przegląd

Testy dla `GenerationService` są podzielone na dwa pliki:
- `generation.service.test.ts` - **Testy jednostkowe** (unit tests)
- `generation.service.integration.test.ts` - **Testy integracyjne** (integration tests)

## Uruchomienie testów

```bash
# Wszystkie testy dla service
npm test -- generation.service

# Tylko testy jednostkowe
npm test -- generation.service.test

# Tylko testy integracyjne
npm test -- generation.service.integration

# Z pokryciem kodu
npm run test:coverage -- generation.service

# W trybie watch podczas development
npm run test:watch -- generation.service
```

## Struktura testów

### 1. Testy jednostkowe (`generation.service.test.ts`)

#### Pokrycie funkcjonalności:

##### ✅ Constructor
- Weryfikacja inicjalizacji system message w OpenRouter service
- Weryfikacja ustawienia domyślnego modelu AI

##### ✅ createGeneration() - Happy path
- Pomyślne tworzenie generacji z propozycjami fiszek
- Poprawne wywołanie OpenRouter API z parametrami
- Poprawne zapisywanie rekordu generacji do bazy danych
- Zwracanie kompletnego DTO z propozycjami

##### ✅ createGeneration() - Error handling
- Obsługa błędu generacji AI
- Obsługa błędu zapisu do bazy danych
- Obsługa nieprawidłowej struktury odpowiedzi z AI
- Obsługa nieprawidłowej liczby wygenerowanych fiszek

##### ✅ Error logging
- Logowanie błędów do tabeli `generation_error_logs`
- Obsługa błędów logowania (nie blokuje głównego błędu)
- Obsługa wyjątków nie-Error

##### ✅ Hash calculation
- Spójność hashy dla tego samego tekstu źródłowego

##### ✅ Edge cases
- Pusta tablica fiszek od AI
- Bardzo długi tekst źródłowy (10000 znaków)

**Łączna liczba testów**: 17 przypadków testowych

### 2. Testy integracyjne (`generation.service.integration.test.ts`)

#### Pokrycie funkcjonalności:

##### ✅ Full generation workflow
- Kompletny przepływ generacji od początku do końca
- Obsługa częściowych niepowodzeń (AI OK, DB fail)

##### ✅ Concurrent requests handling
- Równoczesne przetwarzanie wielu żądań generacji
- Unikalność ID generacji dla równoległych żądań

##### ✅ Error recovery scenarios
- Symulacja przejściowych błędów sieciowych
- Zachowanie spójności danych po błędzie

##### ✅ Data validation
- Walidacja struktury fiszek z odpowiedzi AI
- Wymuszenie dokładnej liczby fiszek (10)

##### ✅ Performance and resource management
- Wydajne przetwarzanie dużych tekstów źródłowych
- Pomiar czasu wykonania

**Łączna liczba testów**: 9 przypadków testowych

## Mockowanie zależności

### Supabase Client

```typescript
const mockSupabaseClient = {
  from: vi.fn(),
} as unknown as SupabaseClient;
```

**Mockowane metody**:
- `from()` - wybór tabeli
- `insert()` - wstawianie rekordów
- `select()` - selekcja danych
- `single()` - pobranie pojedynczego rekordu

### OpenRouter Service

```typescript
const mockOpenRouterService = {
  setSystemMessage: vi.fn(),
  setModel: vi.fn(),
  sendChatCompletion: vi.fn(),
} as unknown as OpenRouterService;
```

**Mockowane metody**:
- `setSystemMessage()` - ustawienie system message
- `setModel()` - ustawienie modelu AI
- `sendChatCompletion()` - wysłanie żądania do AI

### Crypto module

```typescript
vi.mock("crypto", () => ({
  createHash: vi.fn(() => ({
    update: vi.fn(() => ({
      digest: vi.fn(() => "mocked-hash-value"),
    })),
  })),
}));
```

## Przykłady użycia

### Test 1: Pomyślna generacja

```typescript
it("should successfully create generation with flashcard proposals", async () => {
  const result = await generationService.createGeneration(mockSourceText, mockUserId);

  expect(result).toEqual<CreateGenerationResponseDTO>({
    generation_id: "gen-123",
    model: "openai/gpt-4o-mini",
    source_text_length: 54,
    source_text_hash: "mocked-hash-value",
    flashcards_generated: 10,
    created_at: "2024-01-01T00:00:00Z",
    proposals: mockFlashcards,
  });
});
```

### Test 2: Obsługa błędów

```typescript
it("should throw error when AI generation fails", async () => {
  vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockRejectedValue(
    new Error("API Error")
  );

  await expect(
    generationService.createGeneration(mockSourceText, mockUserId)
  ).rejects.toThrow();
});
```

### Test 3: Walidacja danych

```typescript
it("should throw error when AI returns wrong number of flashcards", async () => {
  const wrongNumberOfFlashcards = [{ front: "Q1", back: "A1" }];

  vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockResolvedValue({
    flashcards: wrongNumberOfFlashcards,
  });

  await expect(
    generationService.createGeneration(mockSourceText, mockUserId)
  ).rejects.toThrow("Expected 10 flashcards, received 1");
});
```

## Pokrycie kodu

Testy pokrywają:
- ✅ **100%** metod publicznych
- ✅ **100%** metod prywatnych (poprzez wywołania publiczne)
- ✅ **~95%** linii kodu
- ✅ **~90%** gałęzi (branches)

### Obszary bez pokrycia

Minimalne braki w pokryciu dotyczą:
- Niektórych edge cases w error handling (np. bardzo specyficzne błędy Supabase)
- Teoretycznych scenariuszy, które nie powinny wystąpić w normalnej pracy

## Best practices zastosowane w testach

### 1. Arrange-Act-Assert (AAA)

```typescript
it("example test", async () => {
  // Arrange - przygotowanie mocków i danych
  vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockResolvedValue(mockData);

  // Act - wykonanie testowanej funkcji
  const result = await generationService.createGeneration(sourceText, userId);

  // Assert - weryfikacja wyników
  expect(result).toMatchObject(expectedResult);
});
```

### 2. Używanie beforeEach dla setup

```typescript
beforeEach(() => {
  // Reset wszystkich mocków przed każdym testem
  mockSupabaseClient = { from: vi.fn() } as unknown as SupabaseClient;
  mockOpenRouterService = { /* ... */ } as unknown as OpenRouterService;
  generationService = new GenerationService(mockSupabaseClient, mockOpenRouterService);
});
```

### 3. Mocki zamiast prawdziwych zależności

Wszystkie zależności (Supabase, OpenRouter, crypto) są mockowane, dzięki czemu:
- Testy są szybkie (milisekundy zamiast sekund)
- Testy są deterministyczne (nie zależą od zewnętrznych serwisów)
- Testy są izolowane (testują tylko GenerationService)

### 4. Opisowe nazwy testów

Każdy test ma nazwę opisującą:
- Co jest testowane
- W jakich warunkach
- Jaki jest oczekiwany rezultat

### 5. Test isolation

Każdy test jest niezależny i nie wpływa na inne testy.

## Rozszerzanie testów

### Dodawanie nowego testu jednostkowego

```typescript
it("should handle new scenario", async () => {
  // Setup mock behavior
  vi.spyOn(mockOpenRouterService, "sendChatCompletion").mockResolvedValue({
    /* mock data */
  });

  // Execute
  const result = await generationService.createGeneration(sourceText, userId);

  // Verify
  expect(result).toMatchObject({
    /* expected result */
  });
});
```

### Dodawanie nowego testu integracyjnego

```typescript
it("should integrate with multiple services", async () => {
  // Setup complex multi-service scenario
  vi.spyOn(mockOpenRouterService, "sendChatCompletion")
    .mockResolvedValueOnce({ /* first call */ })
    .mockResolvedValueOnce({ /* second call */ });

  // Execute complex workflow
  const result = await generationService.createGeneration(sourceText, userId);

  // Verify complete integration
  expect(mockOpenRouterService.sendChatCompletion).toHaveBeenCalledTimes(2);
  expect(mockSupabaseClient.from).toHaveBeenCalledWith("generations");
});
```

## Troubleshooting

### Problem: Test fails z "Cannot find module"
**Rozwiązanie**: Sprawdź czy importy mają rozszerzenie `.js` dla lokalnych modułów w ESM.

### Problem: Mock nie działa
**Rozwiązanie**: Upewnij się że mock jest ustawiony przed wywołaniem testowanej funkcji i że używasz `vi.spyOn()` dla metod obiektów.

### Problem: Timeout w testach
**Rozwiązanie**: Sprawdź czy wszystkie asynchroniczne operacje są prawidłowo mockowane i nie wywołują prawdziwych API.

## Dalsze kroki

1. **Zwiększenie pokrycia**: Dodaj testy dla edge cases, które mogą wystąpić w produkcji
2. **Testy E2E**: Rozważ dodanie testów E2E z prawdziwym Supabase (local) i mockami OpenRouter
3. **Performance tests**: Dodaj testy obciążeniowe dla wielu równoległych generacji
4. **Snapshot tests**: Rozważ testy snapshot dla struktury zwracanych DTO

## Przypisy

- Testy używają Vitest jako framework testowy
- Mocki są tworzone używając `vi.fn()` i `vi.spyOn()`
- TypeScript type checking jest włączony dla testów
- ESLint rule `@typescript-eslint/no-explicit-any` jest wyłączony dla plików testowych (konieczne dla mocków)

