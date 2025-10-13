# OpenRouter Service Implementation Plan

## 1. Opis usługi
`OpenRouterService` jest modułem pośredniczącym między aplikacją a OpenRouter API, zapewniającym:

1. Autentykację i konfigurację połączenia z OpenRouter.
2. Przekazywanie wsadowych i pojedynczych zapytań czatu.
3. Budowanie wiadomości z uwzględnieniem ról (system, user).
4. Walidację i parsowanie odpowiedzi zgodnie z zadanym formatem JSON schema.
5. Obsługę błędów, retry/backoff i logowanie.

## 2. Opis konstruktora

```ts
constructor(apiKey: string, options?: {
  baseUrl?: string;
  defaultModel?: string;
  timeoutMs?: number;
})
```

- `apiKey` – klucz dostępu do OpenRouter (z ENV: `OPENROUTER_API_KEY`).
- `baseUrl` – endpoint API (domyślnie `https://openrouter.ai/api`).
- `defaultModel` – nazwa modelu (np. `gpt-4`).
- `timeoutMs` – czas oczekiwania na odpowiedź.

**Pola publiczne:**
- `apiKey: string`
- `model: string`
- `baseUrl: string`
- `timeoutMs: number`

## 3. Publiczne metody i pola

### 3.1. `sendChatCompletion`
```ts
sendChatCompletion(
  messages: Array<{ role: 'system' | 'user'; content: string }>,
  options?: {
    model?: string;
    parameters?: Record<string, any>;
    responseFormat?: {
      type: 'json_schema';
      json_schema: { name: string; strict: true; schema: object };
    };
  }
): Promise<any>
```
- Buduje payload:
  1. `messages` – tablica z rólkami: system, user.
     - Przykład system message:
       ```json
       { "role": "system", "content": "You are a helpful assistant." }
       ```
     - Przykład user message:
       ```json
       { "role": "user", "content": "What is the capital of France?" }
       ```
  2. `model` – domyślny lub nadpisany w `options.model` (np. `gpt-4`).
  3. `parameters` – np. `{ temperature: 0.7, max_tokens: 150 }`.
  4. `responseFormat` – JSON schema:
     ```json
     {
       "type": "json_schema",
       "json_schema": {
         "name": "ChatResponse",
         "strict": true,
         "schema": {
           "type": "object",
           "properties": {
             "answer": { "type": "string" },
             "source": { "type": "string" }
           },
           "required": ["answer"]
         }
       }
     }
     ```
- Wysyła żądanie do OpenRouter i zwraca odpowiedź zwalidowaną według schematu.

### 3.2. `setSystemMessage`
```ts
setSystemMessage(content: string): void
```
- Ustawia globalny system message.

### 3.3. `setModel`
```ts
setModel(modelName: string): void
```
- Zmienia domyślny model używany w `sendChatCompletion`.

## 4. Prywatne metody i pola

### 4.1. `buildPayload`
- Łączy `apiKey`, `messages`, `model`, `parameters`, `responseFormat` w JSON-ready obiekt.

### 4.2. `executeRequest`
- Wysyła HTTP POST przy pomocy `fetch`/`axios` z retry/backoff.

### 4.3. `validateResponseFormat`
- Waliduje odpowiedź przy pomocy AJV lub innego JSON Schema validatora.

### 4.4. `parseResponse`
- Ekstrahuje dane z odpowiedzi API i mapuje do zwracanego obiektu.

### 4.5. `handleError`
- Centralne miejsce obsługi błędów sieciowych, limitów i walidacji.

## 5. Obsługa błędów

1. Błąd sieciowy (timeout, DNS): retry z backoff (3 próby).
2. Błąd HTTP 401 (nieprawidłowy klucz): wyrzuć `AuthError`.
3. Błąd HTTP 429 (rate limit): poczekaj `Retry-After`, retry.
4. Błąd HTTP 5xx: retry/backoff, loguj.
5. Niepoprawny JSON (parse error): wyrzuć `ResponseParseError`.
6. Niezgodny ze schematem JSON: `SchemaValidationError`.

## 6. Kwestie bezpieczeństwa

- Klucz API z ENV, nigdy nie w kodzie.
- HTTPS dla wszystkich żądań.
- Ogranicz próby retry, aby nie zamknąć się w pętli.
- Sanitizacja treści wejściowej (unikaj injection).
- Logowanie błędów bez wycieków wrażliwych danych.

## 7. Plan wdrożenia krok po kroku

1. **Zainstaluj zależności**:
   ```bash
   npm install axios ajv
   ```
2. **Dodaj zmienną środowiskową**:
   - `.env`: `OPENROUTER_API_KEY=your_key_here`
3. **Utwórz plik serwisu**:
   - `src/lib/services/openrouter.service.ts`
   - Wklej implementację klasy `OpenRouterService`.
4. **Skonfiguruj JSON Schema validator**:
   - Użyj `AJV` i przygotuj loader schematów.
6. **Zintegruj z backendem**:
   - W `src/pages/api/chat.ts` wywołaj `sendChatCompletion`.
7. **Ustawienie system/user messages**:
   - W endpointach API przed `sendChatCompletion`, wywołaj `setSystemMessage` i dołącz czat użytkownika.
(..)
8. **Parametryzacja modelu i response_format**:
   - Przekazuj w `options` podczas wywołania metody.
(..)
10. **Monitorowanie i alerty**:
    - Ustaw alerty na błędy 5xx i rate-limit.
