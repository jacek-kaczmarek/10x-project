# OpenRouter Service - Przewodnik Użycia

## Szybki Start

### 1. Konfiguracja Environment Variables

Utwórz plik `.env` w głównym katalogu projektu:

```bash
# Supabase (już istniejące)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# OpenRouter (nowe)
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

**Jak uzyskać klucz OpenRouter:**
1. Zarejestruj się na https://openrouter.ai/
2. Przejdź do Settings → API Keys
3. Wygeneruj nowy klucz
4. Skopiuj klucz do `.env`

### 2. Podstawowe Użycie

#### Przykład: Generowanie fiszek (już zaimplementowane)

```typescript
import { OpenRouterService } from './lib/services/openrouter.service';

// Inicjalizacja serwisu
const apiKey = import.meta.env.OPENROUTER_API_KEY;
const openRouter = new OpenRouterService(apiKey);

// Ustawienie system message
openRouter.setSystemMessage("You are a helpful assistant.");

// Wysłanie zapytania
const response = await openRouter.sendChatCompletion([
  {
    role: "user",
    content: "What is TypeScript?"
  }
]);

console.log(response);
```

#### Przykład: Chat z JSON Schema Response

```typescript
const schema = {
  type: "json_schema",
  json_schema: {
    name: "Answer",
    strict: true,
    schema: {
      type: "object",
      properties: {
        answer: { type: "string" },
        confidence: { type: "number" }
      },
      required: ["answer", "confidence"],
      additionalProperties: false
    }
  }
};

const response = await openRouter.sendChatCompletion(
  [{ role: "user", content: "Is TypeScript better than JavaScript?" }],
  {
    responseFormat: schema,
    parameters: {
      temperature: 0.7,
      max_tokens: 500
    }
  }
);

// response będzie zgodny ze schema:
// { answer: "...", confidence: 0.85 }
```

### 3. Opcje Konfiguracji

```typescript
const openRouter = new OpenRouterService(apiKey, {
  baseUrl: "https://openrouter.ai/api/v1",  // domyślny
  defaultModel: "openai/gpt-4o-mini",        // domyślny
  timeoutMs: 30000                           // 30 sekund (domyślny)
});
```

### 4. Zmiana Modelu

```typescript
// Globalnie dla wszystkich requestów
openRouter.setModel("anthropic/claude-3.5-sonnet");

// Lub per-request
const response = await openRouter.sendChatCompletion(
  messages,
  { model: "openai/gpt-4" }
);
```

**Popularne modele:**
- `openai/gpt-4o-mini` - szybki, tani (domyślny)
- `openai/gpt-4o` - mocniejszy GPT-4
- `anthropic/claude-3.5-sonnet` - Claude Sonnet
- `meta-llama/llama-3.1-70b-instruct` - Open source

Zobacz pełną listę: https://openrouter.ai/models

### 5. Parametry Generacji

```typescript
await openRouter.sendChatCompletion(messages, {
  parameters: {
    temperature: 0.7,      // 0.0 = deterministyczny, 1.0 = kreatywny
    max_tokens: 2000,      // max długość odpowiedzi
    top_p: 0.9,           // nucleus sampling
    frequency_penalty: 0,  // kara za powtórzenia
    presence_penalty: 0    // kara za obecność tokenów
  }
});
```

### 6. Obsługa Błędów

```typescript
import { 
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterNetworkError,
  OpenRouterSchemaValidationError
} from './lib/services/openrouter.service';

try {
  const response = await openRouter.sendChatCompletion(messages);
} catch (error) {
  if (error instanceof OpenRouterAuthError) {
    // Nieprawidłowy API key
    console.error("Authentication failed");
  } else if (error instanceof OpenRouterRateLimitError) {
    // Rate limit przekroczony
    console.error("Rate limit hit, retry after:", error.retryAfter);
  } else if (error instanceof OpenRouterNetworkError) {
    // Problem sieciowy (będzie retry automatycznie)
    console.error("Network error");
  } else if (error instanceof OpenRouterSchemaValidationError) {
    // Odpowiedź nie pasuje do schema
    console.error("Validation errors:", error.validationErrors);
  } else {
    // Inny błąd
    console.error("Unknown error:", error);
  }
}
```

### 7. Best Practices

#### Używaj System Messages dla kontekstu
```typescript
openRouter.setSystemMessage(
  "You are an expert in React. Provide concise, accurate answers."
);
```

#### Waliduj odpowiedzi z JSON Schema
```typescript
// DOBRZE - wymuszony format odpowiedzi
const response = await openRouter.sendChatCompletion(messages, {
  responseFormat: mySchema
});

// ŹLE - parsing ręczny, podatny na błędy
const text = await openRouter.sendChatCompletion(messages);
const parsed = JSON.parse(text); // może się nie udać
```

#### Używaj odpowiedniej temperatury
```typescript
// Dla zadań wymagających precyzji (kod, matematyka)
{ temperature: 0.1 }

// Dla zrównoważonych odpowiedzi (Q&A, edukacja)
{ temperature: 0.7 }

// Dla kreatywnych zadań (storytelling, brainstorming)
{ temperature: 1.0 }
```

#### Limituj max_tokens
```typescript
// Zawsze ustawiaj max_tokens aby kontrolować koszty
{
  max_tokens: 1000  // dostosuj do potrzeb
}
```

### 8. Monitorowanie Kosztów

OpenRouter pokazuje koszty w response headers. Możesz je logować:

```typescript
// W przyszłości można dodać interceptor do axios:
httpClient.interceptors.response.use((response) => {
  const cost = response.headers['x-openrouter-generation-cost'];
  console.log('Request cost:', cost);
  return response;
});
```

### 9. Testowanie

Dla testów, utwórz mock:

```typescript
// test/mocks/openrouter.mock.ts
export class MockOpenRouterService {
  async sendChatCompletion() {
    return {
      flashcards: [
        { front: "Test Q", back: "Test A" },
        // ... 9 more
      ]
    };
  }
  
  setSystemMessage() {}
  setModel() {}
}
```

Użyj w testach:
```typescript
const mockOpenRouter = new MockOpenRouterService();
const service = new GenerationService(supabase, mockOpenRouter);
```

### 10. Debugging

Włącz szczegółowe logi:

```typescript
// W development
if (import.meta.env.DEV) {
  console.log('Sending request:', messages);
  console.log('Response:', response);
}
```

## Przykłady Użycia

### Przykład 1: Proste pytanie-odpowiedź

```typescript
const response = await openRouter.sendChatCompletion([
  { role: "user", content: "What is 2+2?" }
]);
// "4"
```

### Przykład 2: Konwersacja z kontekstem

```typescript
openRouter.setSystemMessage("You are a math tutor for 10-year-olds.");

const response = await openRouter.sendChatCompletion([
  { role: "user", content: "Explain multiplication" }
]);
```

### Przykład 3: Strukturyzowana odpowiedź

```typescript
const taskSchema = {
  type: "json_schema",
  json_schema: {
    name: "TaskList",
    strict: true,
    schema: {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              priority: { type: "string", enum: ["high", "medium", "low"] }
            },
            required: ["title", "priority"]
          }
        }
      },
      required: ["tasks"]
    }
  }
};

const response = await openRouter.sendChatCompletion(
  [{ role: "user", content: "List 3 tasks for learning TypeScript" }],
  { responseFormat: taskSchema }
);

// response.tasks = [
//   { title: "Read TypeScript handbook", priority: "high" },
//   { title: "Build a small project", priority: "medium" },
//   { title: "Practice type definitions", priority: "medium" }
// ]
```

## FAQ

**Q: Czy muszę płacić za OpenRouter?**
A: Tak, OpenRouter działa na zasadzie pay-as-you-go. Sprawdź ceny na https://openrouter.ai/models

**Q: Ile kosztuje generowanie fiszek?**
A: Z GPT-4o-mini (~$0.15/$1M tokens) generowanie 10 fiszek z 5000 znaków źródłowych kosztuje ~$0.001-0.002

**Q: Czy mogę użyć darmowych modeli?**
A: Niektóre modele są darmowe (np. niektóre Llama). Sprawdź na https://openrouter.ai/models

**Q: Co się stanie jeśli przekroczę rate limit?**
A: Serwis automatycznie zaczeka (retry-after header) i spróbuje ponownie.

**Q: Jak zmienić timeout?**
A: Przekaż `timeoutMs` w konstruktorze: `new OpenRouterService(apiKey, { timeoutMs: 60000 })`

**Q: Czy mogę użyć własnego baseUrl?**
A: Tak, dla proxy/lokalnego API: `new OpenRouterService(apiKey, { baseUrl: "http://localhost:8000" })`

