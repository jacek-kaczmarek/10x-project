# REST API Plan - 10x Cards

## 1. Overview

This REST API is designed for the 10x Cards flashcard application, built with:
- **Backend**: Astro API routes with Supabase (PostgreSQL)
- **AI Integration**: OpenRouter.ai for flashcard generation
- **Authentication**: **NOT IMPLEMENTED** - Deferred to later phase
- **Frontend**: Astro 5 + React 19 with TypeScript 5

The API follows RESTful principles.

> **⚠️ Development Phase Notice:**
> Authentication and Row-Level Security (RLS) are **disabled** in this phase. The API currently operates without user authentication for development purposes. All endpoints are publicly accessible. Authentication will be implemented in a later phase.

## 2. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Flashcards | `flashcards` | User's flashcards with spaced repetition metadata |
| Generations | `generations` | AI generation tracking records |
| Error Logs | `generation_error_logs` | Error logs from failed AI generations |


**Endpoints:** 

## 4. API Endpoints

### 4.1 Flashcard Management

---

#### Create Manual Flashcard

**Endpoint:** `POST /api/flashcards`

**Description:** Creates a new manual flashcard directly in user's active collection

**Request Body:**
```json
{
  "front": "What is the capital of France?",
  "back": "Paris"
}
```

**Request Body Schema:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `front` | string | Yes | 1-200 characters, non-empty |
| `back` | string | Yes | 1-500 characters, non-empty |

**Success Response:**
- **Code:** `201 Created`
- **Body:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "generation_id": null,
  "front": "What is the capital of France?",
  "back": "Paris",
  "status": "active",
  "source": "manual",
  "due_date": "2025-10-11T12:00:00Z",
  "interval": 0,
  "ease_factor": 2.5,
  "repetitions": 0,
  "created_at": "2025-10-11T12:00:00Z",
  "updated_at": "2025-10-11T12:00:00Z"
}
```

**Error Responses:**
- **Code:** `400 Bad Request`
  - Message: "Front text must be between 1 and 200 characters"
  - Message: "Back text must be between 1 and 500 characters"
- **Code:** `500 Internal Server Error`
  - Message: "Failed to create flashcard"

**Business Logic:**
1. Validate front (1-200 chars) and back (1-500 chars)
2. Set source='manual', status='active', generation_id=NULL
3. Initialize SR parameters: due_date=NOW(), interval=0, ease_factor=2.5, repetitions=0
4. Insert flashcard into database
5. Return created flashcard

---

#### Generate AI Flashcards

**Endpoint:** `POST /api/flashcards/generate`

**Description:** Generates 10 flashcard candidates from source text using AI and returns them for client-side editing

**Request Body:**
```json
{
  "source_text": "Long educational text content here..."
}
```

**Request Body Schema:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `source_text` | string | Yes | 1000-10000 characters |

**Success Response:**
- **Code:** `200 OK`
- **Body:**
```json
{
  "source_text_hash": "sha256_hash_here",
  "source_text_length": 5432,
  "model": "gpt-4o-mini",
  "flashcards": [
    {
      "front": "What is photosynthesis?",
      "back": "The process by which plants convert light energy into chemical energy"
    }
    // ... 9 more flashcards
  ]
}
```

**Error Responses:**
- **Code:** `400 Bad Request`
  - Message: "Source text must be between 1000 and 10000 characters"
- **Code:** `502 Bad Gateway`
  - Message: "AI service unavailable"
- **Code:** `500 Internal Server Error`
  - Message: "Failed to generate flashcards"

**Business Logic:**
1. Validate source_text length (1000-10000 chars)
2. Calculate SHA-256 hash of source_text
3. Call OpenRouter API with source text and server-configured model
4. Parse AI response into 10 flashcard objects
5. On error: create generation_error_log record
6. Return flashcard data for client-side editing (no database save yet)

**Processing Notes:**
- Frontend should show progress indicator during generation
- Generation typically takes 10-30 seconds
- Flashcards are returned for client-side editing before saving
- No database records created until user saves the collection

---

#### Save Flashcard Collection

**Endpoint:** `POST /api/flashcards/collections`

**Description:** Saves a collection of flashcards (from AI generation or manual creation) to the database

**Request Body:**
```json
{
  "source_text_hash": "sha256_hash_here",
  "source_text_length": 5432,
  "model": "gpt-4o-mini",
  "flashcards": [
    {
      "front": "What is photosynthesis?",
      "back": "The process by which plants convert light energy into chemical energy",
      "source": "ai"
    },
    {
      "front": "What is cellular respiration?",
      "back": "The process that breaks down glucose to release energy",
      "source": "ai-edited"
    },
    {
      "front": "What is ATP?",
      "back": "Adenosine triphosphate - the energy currency of cells",
      "source": "manual"
    }
  ]
}
```

**Request Body Schema:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `source_text_hash` | string | No | SHA-256 hash (required for AI generations) |
| `source_text_length` | integer | No | 1000-10000 (required for AI generations) |
| `model` | string | No | AI model used (required for AI generations) |
| `flashcards` | array | Yes | 1-50 flashcard objects |
| `flashcards[].front` | string | Yes | 1-200 characters, non-empty |
| `flashcards[].back` | string | Yes | 1-500 characters, non-empty |
| `flashcards[].source` | string | Yes | 'manual', 'ai', or 'ai-edited' |

**Success Response:**
- **Code:** `201 Created`
- **Body:**
```json
{
  "generation_id": "uuid",
  "model": "gpt-4o-mini",
  "source_text_length": 5432,
  "flashcards_saved": 3,
  "created_at": "2025-10-11T12:00:00Z",
  "flashcards": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "generation_id": "uuid",
      "front": "What is photosynthesis?",
      "back": "The process by which plants convert light energy into chemical energy",
      "status": "active",
      "source": "ai",
      "due_date": "2025-10-11T12:00:00Z",
      "interval": 0,
      "ease_factor": 2.5,
      "repetitions": 0,
      "created_at": "2025-10-11T12:00:00Z",
      "updated_at": "2025-10-11T12:00:00Z"
    }
    // ... more saved flashcards
  ]
}
```

**Error Responses:**
- **Code:** `400 Bad Request`
  - Message: "At least one flashcard is required"
  - Message: "Maximum 50 flashcards per collection"
  - Message: "Front text must be between 1 and 200 characters"
  - Message: "Back text must be between 1 and 500 characters"
  - Message: "Invalid source value"
  - Message: "Source text hash required for AI generations"
- **Code:** `500 Internal Server Error`
  - Message: "Failed to save flashcard collection"

**Business Logic:**
1. Validate flashcard array (1-50 items)
2. Validate each flashcard (front, back, source)
3. For AI generations: create generation record with metadata
4. For manual collections: skip generation record
5. Insert all flashcards with status='active' and initialized SR parameters
6. Update generation.flashcards_generated count (if applicable)
7. Return saved collection with generated IDs

**Use Cases:**
- Save AI-generated flashcards after client-side editing
- Save manually created flashcard collections
- Mix of AI, AI-edited, and manual flashcards in one collection

---

#### List Flashcards

**Endpoint:** `GET /api/flashcards`

**Description:** Retrieves user's flashcards with filtering, searching, and pagination

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | No | all | Filter by status: 'candidate', 'active', 'rejected', or 'all' |
| `source` | string | No | all | Filter by source: 'manual', 'ai', or 'all' |
| `search` | string | No | - | Search in front and back text (case-insensitive) |
| `due` | boolean | No | false | If true, only return active cards where due_date <= NOW() |
| `generation_id` | uuid | No | - | Filter by specific generation |
| `page` | integer | No | 1 | Page number (1-indexed) |
| `limit` | integer | No | 20 | Items per page (max 100) |
| `sort` | string | No | created_at | Sort field: 'created_at', 'updated_at', 'due_date' |
| `order` | string | No | desc | Sort order: 'asc' or 'desc' |

**Example Request:**
```
GET /api/flashcards?status=active&search=physics&page=1&limit=20&sort=created_at&order=desc
```

**Success Response:**
- **Code:** `200 OK`
- **Body:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "generation_id": "uuid",
      "front": "What is Newton's first law?",
      "back": "An object at rest stays at rest...",
      "status": "active",
      "source": "ai",
      "due_date": "2025-10-11T12:00:00Z",
      "interval": 1,
      "ease_factor": 2.5,
      "repetitions": 1,
      "created_at": "2025-10-10T12:00:00Z",
      "updated_at": "2025-10-11T11:00:00Z"
    }
    // ... more flashcards
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8
  }
}
```

**Error Responses:**
- **Code:** `400 Bad Request`
  - Message: "Invalid status value"
  - Message: "Invalid page or limit value"
  - Message: "Limit cannot exceed 100"

**Business Logic:**
1. Build query to retrieve flashcards
2. Apply status filter if provided
3. Apply source filter if provided
4. Apply search filter using ILIKE on front and back
5. Apply due filter if requested (due_date <= NOW() AND status='active')
6. Apply generation_id filter if provided
7. Apply sorting (default: created_at DESC)
8. Calculate total count for pagination
9. Apply LIMIT and OFFSET for pagination
10. Return data array with pagination metadata

---

#### Get Single Flashcard

**Endpoint:** `GET /api/flashcards/:id`

**Description:** Retrieves a specific flashcard by ID

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Flashcard ID |

**Success Response:**
- **Code:** `200 OK`
- **Body:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "generation_id": "uuid",
  "front": "What is mitosis?",
  "back": "Cell division resulting in two identical daughter cells",
  "status": "active",
  "source": "ai",
  "due_date": "2025-10-12T12:00:00Z",
  "interval": 2,
  "ease_factor": 2.6,
  "repetitions": 2,
  "created_at": "2025-10-10T12:00:00Z",
  "updated_at": "2025-10-11T14:30:00Z"
}
```

**Error Responses:**
- **Code:** `404 Not Found`
  - Message: "Flashcard not found"

**Business Logic:**
1. Query flashcard by ID
2. Return flashcard if found
3. Return 404 if not found

---

#### Update Flashcard

**Endpoint:** `PATCH /api/flashcards/:id`

**Description:** Updates flashcard content, status, or spaced repetition parameters

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Flashcard ID |

**Request Body:**
```json
{
  "front": "Updated question text",
  "back": "Updated answer text",
  "status": "active",
  "due_date": "2025-10-15T12:00:00Z",
  "interval": 4,
  "ease_factor": 2.7,
  "repetitions": 3
}
```

**Request Body Schema:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `front` | string | No | 1-200 characters if provided |
| `back` | string | No | 1-500 characters if provided |
| `status` | string | No | 'candidate', 'active', or 'rejected' |
| `due_date` | string (ISO 8601) | No | Valid datetime |
| `interval` | integer | No | >= 0 |
| `ease_factor` | number | No | >= 1.3 |
| `repetitions` | integer | No | >= 0 |

**Success Response:**
- **Code:** `200 OK`
- **Body:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "generation_id": "uuid",
  "front": "Updated question text",
  "back": "Updated answer text",
  "status": "active",
  "source": "ai",
  "due_date": "2025-10-15T12:00:00Z",
  "interval": 4,
  "ease_factor": 2.7,
  "repetitions": 3,
  "created_at": "2025-10-10T12:00:00Z",
  "updated_at": "2025-10-11T15:45:00Z"
}
```

**Error Responses:**
- **Code:** `400 Bad Request`
  - Message: "Front text must be between 1 and 200 characters"
  - Message: "Back text must be between 1 and 500 characters"
  - Message: "Invalid status value"
  - Message: "Interval must be >= 0"
  - Message: "Ease factor must be >= 1.3"
  - Message: "Repetitions must be >= 0"
- **Code:** `404 Not Found`
  - Message: "Flashcard not found"

**Business Logic:**
1. Verify flashcard exists
2. Validate provided fields against constraints
3. Update only provided fields (partial update)
4. updated_at automatically updated by database trigger
5. Return updated flashcard

**Use Cases:**
- **Updating SR after review:** PATCH with new due_date, interval, ease_factor, repetitions calculated by frontend SR library
- **Editing content:** PATCH with new front/back text
- **Changing source:** PATCH to mark as 'ai-edited' if user modifies AI-generated content

---

#### Delete Flashcard

**Endpoint:** `DELETE /api/flashcards/:id`

**Description:** Permanently deletes a flashcard (hard delete)

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Flashcard ID |

**Success Response:**
- **Code:** `204 No Content`
- **Body:** Empty

**Error Responses:**
- **Code:** `404 Not Found`
  - Message: "Flashcard not found"

**Business Logic:**
1. Verify flashcard exists
2. Hard delete flashcard from database
3. Return 204 on success

**Use Cases:**
- Rejecting candidate flashcards (delete unwanted AI generations)
- Removing incorrect or outdated flashcards from collection

---

### 4.2 Generation Management

#### List Generations

**Endpoint:** `GET /api/generations`

**Description:** Retrieves user's AI generation history with pagination

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (1-indexed) |
| `limit` | integer | No | 20 | Items per page (max 50) |

**Example Request:**
```
GET /api/generations?page=1&limit=20
```

**Success Response:**
- **Code:** `200 OK`
- **Body:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "model": "gpt-4o-mini",
      "source_text_length": 5432,
      "source_text_hash": "sha256_hash_here",
      "flashcards_generated": 10,
      "created_at": "2025-10-11T12:00:00Z"
    }
    // ... more generations
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "total_pages": 3
  }
}
```

**Error Responses:**
- **Code:** `400 Bad Request`
  - Message: "Invalid page or limit value"

**Business Logic:**
1. Query generations table
2. Order by created_at DESC
3. Apply pagination
4. Return generations with metadata

---

#### Get Single Generation

**Endpoint:** `GET /api/generations/:id`

**Description:** Retrieves specific generation with associated flashcards

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Generation ID |

**Success Response:**
- **Code:** `200 OK`
- **Body:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "model": "gpt-4o-mini",
  "source_text_length": 5432,
  "source_text_hash": "sha256_hash_here",
  "flashcards_generated": 10,
  "created_at": "2025-10-11T12:00:00Z",
  "flashcards": [
    {
      "id": "uuid",
      "front": "Question text",
      "back": "Answer text",
      "status": "active",
      "source": "ai",
      "created_at": "2025-10-11T12:00:00Z"
    }
    // ... associated flashcards
  ]
}
```

**Error Responses:**
- **Code:** `404 Not Found`
  - Message: "Generation not found"

**Business Logic:**
1. Query generation by ID
2. Join with flashcards table to get associated flashcards
3. Return generation with flashcards array

**Use Cases:**
- Viewing all flashcards from a specific generation
- Auditing AI generation history
- Analytics and insights

---

### 4.3 Error Log Management

#### List Error Logs

**Endpoint:** `GET /api/error-logs`

**Description:** Retrieves error logs from failed AI generations (admin/debugging)

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (1-indexed) |
| `limit` | integer | No | 20 | Items per page (max 50) |
| `error_type` | string | No | all | Filter by error type |

**Example Request:**
```
GET /api/error-logs?page=1&limit=20&error_type=api_error
```

**Success Response:**
- **Code:** `200 OK`
- **Body:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "error_type": "api_error",
      "error_message": "OpenRouter API rate limit exceeded",
      "model": "gpt-4o-mini",
      "source_text_length": 5432,
      "source_text_hash": "sha256_hash_here",
      "created_at": "2025-10-11T12:00:00Z"
    }
    // ... more error logs
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "total_pages": 1
  }
}
```

**Business Logic:**
1. Query error logs table
2. Apply error_type filter if provided
3. Order by created_at DESC
4. Apply pagination
5. Return error logs with metadata

**Error Types:**
- `api_error` - AI service API errors
- `network_error` - Network connectivity issues
- `validation_error` - Invalid AI response format
- `timeout_error` - AI generation timeout
- `rate_limit_error` - Rate limiting

**Use Cases:**
- User viewing their own generation failures
- Debugging generation issues
- Admin monitoring system health

---

## 5. Validation and Business Logic

### 5.1 Input Validation Rules

#### Flashcard Content Validation
- **front**: Required, 1-200 characters, non-empty after trim
- **back**: Required, 1-500 characters, non-empty after trim
- **status**: Must be one of: 'candidate', 'active', 'rejected'
- **source**: Must be one of: 'manual', 'ai', 'ai-edited'

#### Spaced Repetition Parameters Validation
- **interval**: Optional, integer >= 0 (days)
- **ease_factor**: Optional, numeric >= 1.3
- **repetitions**: Optional, integer >= 0
- **due_date**: Optional, valid ISO 8601 datetime

#### Generation Request Validation
- **source_text**: Required, 1000-10000 characters

#### Pagination Validation
- **page**: Integer >= 1, default 1
- **limit**: Integer 1-100, default 20 (generations: max 50)
- **sort**: Valid field name from table schema
- **order**: 'asc' or 'desc'

#### Search Validation
- **search**: String, optional, 1-200 characters
- Sanitize for SQL injection (use parameterized queries)

### 5.2 Business Logic Implementation

#### BL-1: AI Flashcard Generation Flow

**Trigger:** POST `/api/flashcards/generate`

**Steps:**
1. **Validate Input**
   - Check source_text length (1000-10000)
   - Return 400 if validation fails

2. **Call AI Service**
   - Send request to OpenRouter API with server-configured model
   - Include system prompt for flashcard generation
   - Request exactly 10 flashcards
   - Set timeout (30 seconds)
   - Handle streaming response if available

3. **Parse AI Response**
   - Validate response structure
   - Extract 10 flashcard objects
   - Validate each flashcard (front/back length)
   - If validation fails, create error log

4. **Return Response**
   - Calculate SHA-256 hash of source_text
   - Return flashcard data for client-side editing
   - Include metadata (hash, length, model) for later saving
   - Status 200 OK

**Error Handling:**
- On any error, create error log:
  ```sql
  INSERT INTO generation_error_logs (
    error_type, error_message, model,
    source_text_length, source_text_hash
  ) VALUES (...)
  ```
- Return appropriate error response to user

**Note:** No database records created until user saves via `/api/flashcards/collections`

---

#### BL-2: Save Flashcard Collection

**Trigger:** POST `/api/flashcards/collections`

**Steps:**
1. **Validate Input**
   - Check flashcards array (1-50 items)
   - Validate each flashcard (front, back, source)
   - Validate generation metadata if provided

2. **Create Generation Record (if AI-based)**
   - If source_text_hash provided, create generation:
     ```sql
     INSERT INTO generations (
       model, source_text_length, source_text_hash, flashcards_generated
     ) VALUES ($model, $length, $hash, $count)
     RETURNING id
     ```

3. **Insert Flashcards**
   - Batch insert all flashcards with status='active':
     ```sql
     INSERT INTO flashcards (
       generation_id, front, back, source, status,
       due_date, interval, ease_factor, repetitions
     ) VALUES (
       $generation_id, $front, $back, $source, 'active',
       NOW(), 0, 2.5, 0
     )
     ```

4. **Return Saved Collection**
   - Include generation_id (if applicable)
   - Include all saved flashcards with IDs

---

#### BL-3: Manual Flashcard Creation

**Trigger:** POST `/api/flashcards`

**Steps:**
1. **Validate Input**
   - front: 1-200 chars
   - back: 1-500 chars

2. **Create Active Flashcard**
   ```sql
   INSERT INTO flashcards (
     generation_id, front, back,
     status, source, due_date, interval, ease_factor, repetitions
   ) VALUES (
     NULL, $front, $back,
     'active', 'manual', NOW(), 0, 2.5, 0
   ) RETURNING *
   ```

3. **Return Created Flashcard**
   - Status 201 Created

**Note:** Individual manual flashcards can also be created as part of a collection via `/api/flashcards/collections`

---

#### BL-4: Study Session Flashcard Retrieval

**Trigger:** GET `/api/flashcards?status=active&due=true`

**Steps:**
1. **Query Due Flashcards**
   ```sql
   SELECT * FROM flashcards
   WHERE status = 'active'
     AND due_date <= NOW()
   ORDER BY due_date ASC
   LIMIT $limit
   ```

2. **Return Due Flashcards**
   - Frontend displays cards one by one
   - User rates each card (easy/good/hard/again)

3. **Frontend Calculates Next Review**
   - Uses ts-fsrs or similar SR library
   - Calculates new: due_date, interval, ease_factor, repetitions

4. **Update SR Parameters**
   - Frontend calls PATCH `/api/flashcards/:id` with new values

---

#### BL-5: Collection Search

**Trigger:** GET `/api/flashcards?search=<term>`

**Steps:**
1. **Build Search Query**
   ```sql
   SELECT * FROM flashcards
   WHERE status = $status
     AND (front ILIKE '%' || $search || '%' 
          OR back ILIKE '%' || $search || '%')
   ORDER BY created_at DESC
   LIMIT $limit OFFSET $offset
   ```

2. **Count Total Results**
   ```sql
   SELECT COUNT(*) FROM flashcards
   WHERE status = $status
     AND (front ILIKE '%' || $search || '%' 
          OR back ILIKE '%' || $search || '%')
   ```

3. **Return Paginated Results**

**Performance Notes:**
- ILIKE for MVP (case-insensitive)
- Can add GIN index later if needed

---

#### BL-6: Flashcard Deletion (Rejection)

**Trigger:** DELETE `/api/flashcards/:id`

**Steps:**
1. **Hard Delete**
   ```sql
   DELETE FROM flashcards
   WHERE id = $id
   RETURNING id
   ```

2. **Return 204 No Content**

**Use Cases:**
- Rejecting unwanted candidate flashcards
- Removing outdated flashcards from collection

**Note:** No soft delete in MVP - immediate permanent deletion

---

## 6. Error Handling

### 6.1 Standard Error Response Format

All error responses follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "specific field that caused error",
      "constraint": "validation rule that failed"
    }
  }
}
```

### 6.2 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Validation errors, invalid input |
| 404 | Not Found | Resource doesn't exist or doesn't belong to user |
| 409 | Conflict | Resource conflict (rare in this API) |
| 429 | Too Many Requests | Rate limiting (future implementation) |
| 500 | Internal Server Error | Unexpected server errors |
| 502 | Bad Gateway | External service (OpenRouter) errors |
| 503 | Service Unavailable | Database or service down |

### 6.3 Common Error Scenarios

#### Validation Errors
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Front text must be between 1 and 200 characters",
    "details": {
      "field": "front",
      "constraint": "length",
      "min": 1,
      "max": 200
    }
  }
}
```

#### AI Generation Errors
```json
{
  "error": {
    "code": "AI_GENERATION_FAILED",
    "message": "Failed to generate flashcards. Please try again.",
    "details": {
      "error_type": "api_error",
      "ai_provider": "openrouter"
    }
  }
}
```

#### Resource Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Flashcard not found"
  }
}
```

---

## 7. Rate Limiting and Performance

### 7.1 Rate Limiting (Future Implementation)

**Recommended Limits:**
- General API calls: 100 requests/minute per user
- AI generation: 5 requests/minute per user (expensive operation)
- Search queries: 30 requests/minute per user

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1696168800
```

**Error Response:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retry_after": 45
    }
  }
}
```

### 7.2 Performance Optimizations

#### Database Indexes
All queries leverage existing database indexes:
- `idx_flashcards_user_created` - Collection pagination
- `idx_flashcards_user_due` - Study session queries
- `idx_flashcards_generation` - Generation filtering
- `idx_generations_user_created` - Generation history

#### Query Optimizations
- Use LIMIT/OFFSET for pagination
- Avoid SELECT * in production (specify fields)
- Use COUNT queries separately from data queries

#### Caching Strategy (Future)
- Cache generation history (low write frequency)
- Cache user flashcard counts
- Don't cache active flashcards (high update frequency)

---

## 8. API Versioning

### Current Version
- **Version:** v1 (implicit)
- **Base Path:** `/api/*`

### Future Versioning Strategy
If breaking changes are needed:
- **Version 2:** `/api/v2/*`
- **Version 1:** Continue supporting `/api/*` or `/api/v1/*`

### Non-Breaking Changes
These can be added without versioning:
- New optional fields in request/response
- New query parameters
- New endpoints
- Additional values in enums (if backward compatible)

### Breaking Changes (require new version)
- Removing fields from responses
- Changing field types
- Removing endpoints
- Changing validation rules to be more strict

---

## 9. Testing Considerations

### 9.1 Unit Tests
- Validation logic for all input fields
- Business logic functions (SR initialization, status transitions)
- Error handling and error log creation

### 9.2 Integration Tests
- Full endpoint flows (create → read → update → delete)
- AI generation workflow with mocked OpenRouter
- Pagination and filtering logic
- Search functionality

### 9.3 Authentication Tests
- **Deferred**: Authentication will be implemented in a later phase
- No authentication tests required for current phase

### 9.4 Edge Cases
- Empty collections (pagination edge cases)
- Maximum pagination limits
- Very long search queries
- Concurrent updates to same flashcard
- AI generation timeout scenarios

---

## 10. API Client Examples

### 10.1 JavaScript/TypeScript (Frontend)

```typescript
// Generate flashcard candidates
const response = await fetch('/api/flashcards/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source_text: longText
  })
})

const generation = await response.json()
// Returns: { source_text_hash, source_text_length, model, flashcards: [...] }

// User edits flashcards on client, then saves collection
const editedFlashcards = generation.flashcards.map(card => ({
  front: card.front, // possibly edited
  back: card.back,   // possibly edited
  source: card.front !== originalCard.front || card.back !== originalCard.back ? 'ai-edited' : 'ai'
}))

// Save the collection
const saveResponse = await fetch('/api/flashcards/collections', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source_text_hash: generation.source_text_hash,
    source_text_length: generation.source_text_length,
    model: generation.model,
    flashcards: editedFlashcards
  })
})

const savedCollection = await saveResponse.json()

// List active flashcards
const flashcards = await fetch(
  '/api/flashcards?status=active&page=1&limit=20'
).then(r => r.json())

// Update SR parameters after review
await fetch(`/api/flashcards/${flashcardId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    due_date: newDueDate.toISOString(),
    interval: newInterval,
    ease_factor: newEaseFactor,
    repetitions: newRepetitions
  })
})

// Create manual flashcard collection
await fetch('/api/flashcards/collections', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    flashcards: [
      {
        front: "What is the capital of France?",
        back: "Paris",
        source: "manual"
      }
    ]
  })
})
```

### 10.2 cURL Examples

```bash
# Generate flashcard candidates
curl -X POST https://app.10xcards.com/api/flashcards/generate \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Long educational text..."
  }'

# Save AI-generated collection (after client-side editing)
curl -X POST https://app.10xcards.com/api/flashcards/collections \
  -H "Content-Type: application/json" \
  -d '{
    "source_text_hash": "sha256_hash_here",
    "source_text_length": 5432,
    "model": "gpt-4o-mini",
    "flashcards": [
      {
        "front": "What is photosynthesis?",
        "back": "The process by which plants convert light energy into chemical energy",
        "source": "ai"
      },
      {
        "front": "What is cellular respiration?",
        "back": "Process that breaks down glucose to release energy",
        "source": "ai-edited"
      }
    ]
  }'

# Create manual flashcard collection
curl -X POST https://app.10xcards.com/api/flashcards/collections \
  -H "Content-Type: application/json" \
  -d '{
    "flashcards": [
      {
        "front": "What is the capital of France?",
        "back": "Paris",
        "source": "manual"
      }
    ]
  }'

# Create individual manual flashcard
curl -X POST https://app.10xcards.com/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is the capital of France?",
    "back": "Paris"
  }'

# List flashcards with search
curl -X GET "https://app.10xcards.com/api/flashcards?status=active&search=physics&page=1&limit=20"

# Delete flashcard
curl -X DELETE https://app.10xcards.com/api/flashcards/<id>
```

---

## 11. Implementation Notes

### 11.1 Astro API Route Structure

```
src/pages/api/
├── flashcards/
│   ├── index.ts          # GET (list), POST (create manual)
│   ├── [id].ts           # GET, PATCH, DELETE single flashcard
│   ├── generate.ts       # POST (AI generation - returns candidates)
│   └── collections.ts    # POST (save collection of flashcards)
├── generations/
│   ├── index.ts          # GET (list)
│   └── [id].ts           # GET single generation
└── error-logs/
    └── index.ts          # GET (list)
```

### 11.2 Middleware Implementation

**File:** `src/middleware/index.ts`

```typescript
import { defineMiddleware } from 'astro:middleware'
import { createClient } from '@supabase/supabase-js'

export const onRequest = defineMiddleware(async ({ locals }, next) => {
  // Initialize Supabase client for database operations
  const supabase = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY
  )
  
  // Attach supabase client to locals for use in API routes
  locals.supabase = supabase
  
  return next()
})
```

**Note:** Authentication is not implemented in this phase. The middleware only initializes the Supabase client for database access.

### 11.3 Supabase Client Usage

```typescript
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ locals, url }) => {
  const { supabase } = locals
  
  // Query flashcards from database
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(0, 19)
  
  if (error) {
    return new Response(JSON.stringify({
      error: {
        code: 'DATABASE_ERROR',
        message: error.message
      }
    }), { status: 500 })
  }
  
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### 11.4 AI Generation Implementation

```typescript
import type { APIRoute } from 'astro'
import { createHash } from 'crypto'

export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase } = locals
  const body = await request.json()
  const { source_text } = body
  
  // Server-configured model (not user-selectable)
  const model = 'gpt-4o-mini'
  
  // Validate
  if (!source_text || source_text.length < 1000 || source_text.length > 10000) {
    return new Response(JSON.stringify({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Source text must be between 1000 and 10000 characters'
      }
    }), { status: 400 })
  }
  
  // Create hash for metadata
  const hash = createHash('sha256').update(source_text).digest('hex')
  
  try {
    // Call OpenRouter API
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'Generate exactly 10 flashcards from the provided text...'
          },
          {
            role: 'user',
            content: source_text
          }
        ]
      })
    })
    
    const aiResult = await aiResponse.json()
    
    // Parse and validate AI response
    const flashcards = parseFlashcardsFromAI(aiResult)
    
    // Return candidates for client-side editing
    return new Response(JSON.stringify({
      source_text_hash: hash,
      source_text_length: source_text.length,
      model,
      flashcards
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    // Log error (no user_id needed for error logs in development phase)
    await supabase.from('generation_error_logs').insert({
      error_type: 'api_error',
      error_message: error.message,
      model,
      source_text_length: source_text.length,
      source_text_hash: hash
    })
    
    return new Response(JSON.stringify({
      error: {
        code: 'AI_GENERATION_FAILED',
        message: 'Failed to generate flashcards. Please try again.'
      }
    }), { status: 502 })
  }
}
```

**Note:** No database records are created until the user saves the collection via `/api/flashcards/collections`. The `user_id` field will be properly set when authentication is implemented.

---

## 12. Summary

This REST API provides a complete backend for the 10x Cards MVP application with:

- **9 main endpoints** covering all user stories from the PRD
- **RESTful design** following industry best practices
- **Comprehensive validation** matching database constraints
- **Proper error handling** with meaningful status codes and messages
- **Performance optimization** via database indexes and efficient queries
- **Scalable architecture** ready for future enhancements

### Key API Flow Changes

**AI Generation Flow:**
1. Generate candidates via `POST /api/flashcards/generate` (returns data, no DB save)
2. User edits flashcards on client-side
3. Save collection via `POST /api/flashcards/collections` with proper source tracking

**Source Tracking:**
- `'ai'` - Original AI-generated content
- `'ai-edited'` - AI content modified by user
- `'manual'` - User-created content

**Current Phase:** Authentication is **not implemented**. All endpoints are publicly accessible for development purposes. 

**Next Phase:** Supabase Auth integration with session-based authentication and Row-Level Security (RLS) policies will be added to secure the API and enforce proper data isolation between users.

The API leverages Supabase's database capabilities while maintaining clean separation of concerns and enabling a smooth developer experience for frontend integration.

