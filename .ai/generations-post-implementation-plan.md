# API Endpoint Implementation Plan: POST /api/generations

## 1. Endpoint Overview
This endpoint is responsible for generating a set of 10 flashcard proposals from a user-provided source text using an external AI service (OpenRouter). It creates a generation record for tracking but **does NOT save flashcards to the database**. Instead, it returns raw proposals (`FlashcardProposalDTO[]`) to the client for editing. Any failure during the process results in an error log being created.

## 2. Request Details
- **HTTP Method:** `POST`
- **URL Structure:** `/api/generations`
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "source_text": "string"
  }
  ```
- **Parameters:**
  - **Required:**
    - `source_text`: `string` (must be between 1000 and 10000 characters)
  - **Optional:** None

## 3. Utilized Types
- **Command Model:** `CreateGenerationCommand`
  ```typescript
  // Represents the incoming request body
  export interface CreateGenerationCommand {
    source_text: string;
  }
  ```
- **Data Transfer Object (DTO):** `CreateGenerationResponseDTO`
  ```typescript
  // Represents the successful response body
  export interface CreateGenerationResponseDTO {
    generation_id: string;
    model: string;
    source_text_length: number;
    source_text_hash: string;
    flashcards_generated: number;
    created_at: string;
    proposals: FlashcardProposalDTO[]; // Raw proposals, NOT saved to DB
  }
  ```
- **Internal DTO:** `FlashcardProposalDTO`
  ```typescript
  // Raw AI-generated flashcard (only front/back, before database save)
  export interface FlashcardProposalDTO {
    front: string;
    back: string;
  }
  ```
  Used to represent AI-generated proposals. Returned to client for editing, not saved to database.
- **Database Models:** `GenerationInsert` (FlashcardInsert not used in this endpoint)

## 4. Response Details
- **Success Response:**
  - **Code:** `201 Created`
  - **Body:** `CreateGenerationResponseDTO` containing the generation metadata and the array of 10 flashcard proposals (NOT saved to database).
- **Error Responses:**
  - **Code:** `400 Bad Request` - For validation errors (e.g., `source_text` length).
  - **Code:** `502 Bad Gateway` - When the external AI service (OpenRouter) fails or is unavailable.
  - **Code:** `500 Internal Server Error` - For unexpected server-side issues like database transaction failures or AI response parsing errors.

## 5. Data Flow
1. The API route handler at `src/pages/api/generations/index.ts` receives a `POST` request.
2. The request body is parsed and validated using a Zod schema to ensure `source_text` is a string between 1000 and 10000 characters.
3. If validation fails, the flow terminates, and a `400 Bad Request` is returned.
4. If validation succeeds, a new `GenerationService` instance is created and its `createGeneration` method is called, passing the `source_text` and the `supabase` client from `context.locals`.
5. **Inside `GenerationService`**:
   a. A SHA-256 hash of the `source_text` is calculated for the generation record.
   b. A `try...catch` block is initiated to handle all potential errors.
   c. A request is sent to the OpenRouter API with the `source_text` and a system prompt to generate exactly 10 flashcards. The model (e.g., `gpt-4o-mini`) is configured on the server.
   d. The AI response is received and parsed to extract an array of 10 `FlashcardProposalDTO` objects (only front/back text). If parsing fails, an error is thrown.
   e. A new record is inserted into the `generations` table with metadata (model, text length, hash, flashcards_generated=10).
   f. **Flashcards are NOT inserted into database** - proposals remain as data to return to client.
   g. The created generation record and the raw proposals (as `FlashcardProposalDTO[]`) are returned.
6. **Error Flow**:
   a. If any error occurs within the `GenerationService`'s `try` block (AI call, parsing, generation insert), the `catch` block is executed.
   b. A new record is inserted into the `generation_error_logs` table with details about the failure.
   c. The error is re-thrown or a structured error object is returned.
7. The API route handler receives the result from the service and sends the appropriate HTTP response (`201 Created` on success, or an error response on failure).

## 6. Security Considerations
- **Authentication:** In the current MVP phase, authentication is **not implemented**. The `user_id` field in the database tables will be handled later. This is a known and accepted risk for the initial development.
- **API Key Management:** The `OPENROUTER_API_KEY` must be stored as a server-side environment variable and must not be exposed to the client. It will be accessed via `import.meta.env.OPENROUTER_API_KEY`.
- **Input Validation:** Zod validation is mandatory to prevent invalid data from being processed, protecting both the database and the AI service from malformed input.
- **Rate Limiting:** This is an expensive, long-running operation. While not in the MVP scope, rate limiting should be added in the future to prevent abuse and control costs.

## 7. Performance Considerations
- **Latency:** The endpoint's response time is dependent on the external AI service and can take 10-30 seconds. The frontend must handle this asynchronously, displaying a loading state to the user and not blocking the UI.
- **No Database Transaction Needed:** Since only the generation record is saved (flashcards are not persisted), no complex transaction is required. This simplifies the implementation and improves performance.

## 8. Implementation Steps
1.  **Create File Structure:**
    -   Create the API route file: `src/pages/api/generations/index.ts`.
    -   Create the new service file: `src/lib/services/generation.service.ts`.
2.  **Define Zod Schema:** In `src/lib/validators/generations.ts` (create if not exists), define the Zod schema for the `CreateGenerationCommand`.
    ```typescript
    import { z } from 'zod';

    export const createGenerationSchema = z.object({
      source_text: z.string({ required_error: 'Source text is required' }).min(1000).max(10000),
    });
    ```
3.  **Implement API Route Handler (`index.ts`):**
    -   Import `APIRoute`.
    -   Export a `POST` function.
    -   Use a `try...catch` block for overall error handling.
    -   Parse the request body using `await context.request.json()`.
    -   Validate the body using the `createGenerationSchema`. Return a 400 response on failure.
    -   Instantiate `GenerationService` and call the `createGeneration` method, passing the validated `source_text` and `context.locals.supabase`.
    -   Return a `201 Created` `Response` with the service's result.
    -   In the `catch` block, return a `500 Internal Server Error` response.
4.  **Implement `GenerationService`:**
    -   Create a `GenerationService` class.
    -   Define a public async method `createGeneration(sourceText: string, supabase: SupabaseClient)`.
    -   Implement the data flow logic as described in section 5, including:
        -   SHA-256 hash calculation (`crypto` module).
        -   The `fetch` call to the OpenRouter API (at this moment of implemenation just create a mock of the service)
        -   A helper function to parse the AI JSON response and validate its structure, returning `FlashcardProposalDTO[]`.
        -   Insert only the generation record into `generations` table (single insert).
        -   **Do NOT insert flashcards** - proposals remain as array to return to client.
        -   Return generation metadata + proposals array as `CreateGenerationResponseDTO`.
        -   A `catch` block that calls another private method `logError` to insert into `generation_error_logs`.
5.  **Environment Variables:**
    -   Ensure `OPENROUTER_API_KEY` is defined in the project's environment variables (`.env` file).
    -   Update `env.d.ts` to include the type definition for this variable.
6.  **Testing:**
    -   (omitted for this phase)