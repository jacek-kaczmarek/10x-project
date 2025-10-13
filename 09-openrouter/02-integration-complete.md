# OpenRouter Service - Integracja z Generation Service ✅

## Zrealizowane kroki (4-6)

### Krok 4: ✅ Konfiguracja JSON Schema Validator
Utworzono schema dla odpowiedzi z fiszkami:

```typescript
const FLASHCARD_PROPOSALS_SCHEMA: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "FlashcardProposals",
    strict: true,
    schema: {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: { type: "string" },
              back: { type: "string" },
            },
            required: ["front", "back"],
            additionalProperties: false,
          },
          minItems: 10,
          maxItems: 10,
        },
      },
      required: ["flashcards"],
      additionalProperties: false,
    },
  },
};
```

**Cechy schema:**
- Wymusza dokładnie 10 fiszek (`minItems: 10, maxItems: 10`)
- Każda fiszka musi mieć `front` i `back` (string)
- `strict: true` - ścisła walidacja
- `additionalProperties: false` - brak dodatkowych pól

### Krok 5: ✅ Integracja z Backendem

#### Zmiany w `GenerationService`:

1. **Dodano dependency injection OpenRouterService:**
```typescript
constructor(
  private readonly supabase: SupabaseClient,
  private readonly openRouterService: OpenRouterService
) {
  this.openRouterService.setSystemMessage(SYSTEM_MESSAGE);
  this.openRouterService.setModel(this.AI_MODEL);
}
```

2. **Zastąpiono mock implementację prawdziwym API call:**
```typescript
private async generateFlashcardsWithAI(sourceText: string): Promise<FlashcardProposalDTO[]> {
  const userMessage = `Please analyze the following text and generate exactly 10 flashcards:\n\n${sourceText}`;

  const response = await this.openRouterService.sendChatCompletion(
    [{ role: "user", content: userMessage }],
    {
      responseFormat: FLASHCARD_PROPOSALS_SCHEMA,
      parameters: {
        temperature: 0.7,
        max_tokens: 2000,
      },
    }
  );

  // Walidacja odpowiedzi
  if (!response || !response.flashcards || !Array.isArray(response.flashcards)) {
    throw new Error("Invalid response structure from AI service");
  }

  if (response.flashcards.length !== 10) {
    throw new Error(`Expected 10 flashcards, received ${response.flashcards.length}`);
  }

  return response.flashcards as FlashcardProposalDTO[];
}
```

#### Zmiany w API endpoint `POST /api/generations`:

1. **Dodano import OpenRouterService**
2. **Walidacja konfiguracji:**
```typescript
const apiKey = import.meta.env.OPENROUTER_API_KEY;
if (!apiKey) {
  return new Response(JSON.stringify({
    error: {
      code: "CONFIGURATION_ERROR",
      message: "OpenRouter API key is not configured",
    },
  }), { status: 500 });
}
```

3. **Tworzenie instancji serwisów:**
```typescript
const openRouterService = new OpenRouterService(apiKey);
const generationService = new GenerationService(supabase, openRouterService);
```

### Krok 6: ✅ Konfiguracja System/User Messages

#### System Message:
```typescript
const SYSTEM_MESSAGE = `You are an expert educational content creator specializing in creating effective flashcards for spaced repetition learning.

Your task is to analyze the provided source text and generate exactly 10 high-quality flashcards that:
1. Cover the most important concepts and facts from the text
2. Are clear, concise, and unambiguous
3. Follow the principle of atomicity (one concept per card)
4. Use simple language appropriate for learning
5. Have questions (front) that test understanding, not just memorization
6. Have answers (back) that are complete but concise

Format your response as a JSON object with a "flashcards" array containing exactly 10 objects, each with "front" and "back" properties.`;
```

**Charakterystyka:**
- Definiuje rolę AI jako eksperta edukacyjnego
- Precyzyjne instrukcje dotyczące jakości fiszek
- Wymusza format odpowiedzi (JSON z 10 fiszkami)
- Uwzględnia best practices tworzenia fiszek (atomicity, clarity, testing understanding)

#### User Message Template:
```typescript
const userMessage = `Please analyze the following text and generate exactly 10 flashcards:

${sourceText}`;
```

**Parametry generacji:**
- `temperature: 0.7` - balans między kreatywnością a spójnością
- `max_tokens: 2000` - wystarczająco dużo na 10 fiszek
- `responseFormat: FLASHCARD_PROPOSALS_SCHEMA` - wymuszony format JSON

## Podsumowanie Integracji

### Przepływ danych:
1. **Użytkownik** → POST `/api/generations` z `source_text`
2. **API endpoint** → Tworzy `OpenRouterService` i `GenerationService`
3. **GenerationService** → Wywołuje `generateFlashcardsWithAI(sourceText)`
4. **OpenRouterService** → Wysyła request do OpenRouter API z:
   - System message (rola i instrukcje)
   - User message (source text)
   - Response format (JSON schema)
   - Parametry (temperature, max_tokens)
5. **OpenRouter API** → Zwraca JSON z 10 fiszkami
6. **OpenRouterService** → Waliduje odpowiedź (AJV + JSON schema)
7. **GenerationService** → Zapisuje metadata do DB, zwraca proposals
8. **API endpoint** → Zwraca `CreateGenerationResponseDTO` do klienta

### Obsługa błędów:
- ❌ Brak API key → 500 CONFIGURATION_ERROR
- ❌ OpenRouter auth error → 502 AI_SERVICE_ERROR
- ❌ Network/timeout → Retry 3x z backoff
- ❌ Rate limit → Wait + retry
- ❌ Invalid JSON → ResponseParseError → 502
- ❌ Schema validation fail → SchemaValidationError → 502
- ❌ Wrong flashcard count → Error → logged to DB

### Bezpieczeństwo:
- ✅ API key z environment variable
- ✅ HTTPS tylko (enforced przez baseUrl)
- ✅ Walidacja input (zod schema dla source_text)
- ✅ Walidacja output (JSON schema dla flashcards)
- ✅ Error logging bez wrażliwych danych
- ✅ Retry limits (max 3 attempts)

### Typowanie:
- ✅ Pełne TypeScript typing
- ✅ Type-safe interfaces (ChatMessage, ResponseFormat, etc.)
- ✅ Return types dla wszystkich metod
- ✅ Error types dla różnych scenariuszy

## Status: Integracja Kompletna ✅

OpenRouterService jest w pełni zintegrowany z GenerationService i gotowy do produkcyjnego użycia.

### Aby przetestować:
1. Dodaj `OPENROUTER_API_KEY` do pliku `.env`
2. Uruchom dev server: `npm run dev`
3. Otwórz `/generate` w przeglądarce
4. Wklej tekst źródłowy (1000-10000 znaków)
5. Kliknij "Generate Flashcards"
6. System wywoła OpenRouter API i wygeneruje 10 fiszek

### Kolejne kroki (opcjonalne):
- [ ] Dodać testy jednostkowe dla OpenRouterService
- [ ] Dodać testy integracyjne dla GenerationService
- [ ] Zaimplementować caching dla identycznych source_text (duplicate detection przez hash)
- [ ] Dodać monitoring/analytics dla API calls
- [ ] Rozważyć batch processing dla wielu requestów

