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

## 3. Data Type Conventions

Throughout this API plan, two important flashcard-related types are used:

- **`FlashcardProposalDTO`** - Raw AI-generated flashcard with only `front` and `back` fields. Returned to client for editing, NOT saved to database immediately.
- **`FlashcardDTO`** - Complete flashcard record from database, including `id`, `status`, `due_date`, `created_at`, and all other fields.

**Flow:** 
1. AI service generates `FlashcardProposalDTO[]` → returned to client
2. User edits proposals on client-side
3. User saves: `POST /api/flashcards/batch` with proposals → saved as `FlashcardDTO[]`

## 4. API Endpoints

### 4.1 Flashcard Management

---

#### Save Flashcard Proposals (Batch)

**Endpoint:** `POST /api/flashcards/batch`

**Description:** Saves multiple flashcard proposals from AI generation to the database as active flashcards with proper source tracking

**Request Body:**
```json
{
  "generation_id": "uuid",
  "proposals": [
    {
      "front": "What is photosynthesis?",
      "back": "The process by which plants convert light energy into chemical energy",
      "was_edited": false
    },
    {
      "front": "What is mitosis?",
      "back": "Cell division resulting in two identical daughter cells",
      "was_edited": true
    }
  ]
}
```

**Request Body Schema:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `generation_id` | uuid | Yes | Must reference existing generation |
| `proposals` | array | Yes | 1-10 proposals |
| `proposals[].front` | string | Yes | 1-200 characters, non-empty |
| `proposals[].back` | string | Yes | 1-500 characters, non-empty |
| `proposals[].was_edited` | boolean | Yes | Determines source: 'ai' or 'ai-edited' |

**Success Response:**
- **Code:** `201 Created`
- **Body:**
```json
{
  "saved_count": 10,
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
    // ... more flashcards
  ]
}
```

**Error Responses:**
- **Code:** `400 Bad Request`
  - Message: "Generation ID is required"
  - Message: "Proposals array must contain 1-10 items"
  - Message: "Front text must be between 1 and 200 characters"
  - Message: "Back text must be between 1 and 500 characters"
- **Code:** `404 Not Found`
  - Message: "Generation not found"
- **Code:** `500 Internal Server Error`
  - Message: "Failed to save flashcards"

**Business Logic:**
1. Validate generation_id exists
2. Validate proposals array (1-10 items)
3. Validate each proposal (front 1-200 chars, back 1-500 chars)
4. For each proposal:
   - Set source = 'ai' if was_edited=false, 'ai-edited' if was_edited=true
   - Set status = 'active'
   - Set generation_id from request
   - Initialize SR parameters: due_date=NOW(), interval=0, ease_factor=2.5, repetitions=0
5. Batch insert all flashcards into database
6. Return saved flashcards with full fields

**Use Cases:**
- Saving accepted AI proposals after user review/editing
- Primary way to persist AI-generated flashcards

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

**Description:** Updates flashcard content, status, source, or spaced repetition parameters

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
  "source": "ai-edited",
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
| `source` | string | No | 'manual', 'ai', or 'ai-edited' |
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
  "source": "ai-edited",
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
  - Message: "Invalid source value"
  - Message: "Interval must be >= 0"
  - Message: "Ease factor must be >= 1.3"
  - Message: "Repetitions must be >= 0"
- **Code:** `404 Not Found`
  - Message: "Flashcard not found"

**Business Logic:**
1. Verify flashcard exists
2. Validate provided fields against constraints
3. If status changes to 'active' and SR params not provided, initialize them (due_date=NOW(), interval=0, ease_factor=2.5, repetitions=0)
4. If front or back text changes and source='ai', automatically change source to 'ai-edited'
5. Update only provided fields (partial update)
6. updated_at automatically updated by database trigger
7. Return updated flashcard

**Use Cases:**
- **Editing AI candidate content:** PATCH candidate flashcard with new front/back (auto-change source to 'ai-edited')
- **Accepting candidate:** PATCH with status='active' (initializes SR parameters)
- **Updating SR after review:** PATCH with new due_date, interval, ease_factor, repetitions calculated by frontend SR library
- **Manual source change:** Explicitly PATCH source field if needed

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

#### Create Generation with AI Flashcard Proposals

**Endpoint:** `POST /api/generations`

**Description:** Generates 10 flashcard proposals from source text using AI, creates a generation record for tracking, and returns proposals to client for editing. Proposals are NOT saved as flashcards yet.

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
- **Code:** `201 Created`
- **Body:**
```json
{
  "generation_id": "uuid",
  "model": "gpt-4o-mini",
  "source_text_length": 5432,
  "source_text_hash": "sha256_hash_here",
  "flashcards_generated": 10,
  "created_at": "2025-10-11T12:00:00Z",
  "proposals": [
    {
      "front": "What is photosynthesis?",
      "back": "The process by which plants convert light energy into chemical energy"
    },
    {
      "front": "What is cellular respiration?",
      "back": "The process of breaking down glucose to produce ATP"
    }
    // ... 8 more proposals (only front/back fields, no id or database fields)
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
4. Parse AI response into 10 `FlashcardProposalDTO` objects (raw front/back pairs)
5. Create generation record in database (with flashcards_generated=10)
6. **Do NOT save flashcards** - proposals remain on client-side for editing
7. On error: create generation_error_log record and return error
8. Return generation metadata with raw proposals (FlashcardProposalDTO[])

**Processing Notes:**
- Frontend should show progress indicator during generation
- Generation typically takes 10-30 seconds
- **Proposals are returned to client, NOT saved to database**
- User edits proposals in client-side state (React/Vue/etc)
- User can remove unwanted proposals from the list (client-side)
- User saves accepted proposals via `POST /api/flashcards/batch` with generation_id

---

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

#### BL-1: AI Generation with Proposals (No Flashcard Save)

**Trigger:** POST `/api/generations`

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
   - Extract 10 `FlashcardProposalDTO` objects (only front/back fields)
   - Validate each proposal (front/back length)
   - If validation fails, create error log and return error

4. **Save Generation Record Only**
   - Calculate SHA-256 hash of source_text
   - Create generation record:
     ```sql
     INSERT INTO generations (
       model, source_text_length, source_text_hash, flashcards_generated
     ) VALUES ($model, $length, $hash, 10)
     RETURNING *
     ```
   - **Do NOT insert flashcards** - proposals stay on client

5. **Return Response**
   - Status 201 Created
   - Include generation metadata (id, model, hash, count, created_at)
   - Include raw proposals as `FlashcardProposalDTO[]` (only front/back, no database fields)

**Error Handling:**
- On any error, create error log:
  ```sql
  INSERT INTO generation_error_logs (
    error_type, error_message, model,
    source_text_length, source_text_hash
  ) VALUES (...)
  ```
- Return appropriate error response to user

**Note:** AI returns `FlashcardProposalDTO[]` to client for editing. User saves them later via `POST /api/flashcards/batch`.

---

#### BL-1A: Save Flashcard Proposals (Batch)

**Trigger:** POST `/api/flashcards/batch`

**Steps:**
1. **Validate Input**
   - Check generation_id exists in database
   - Validate proposals array (1-10 items)
   - Validate each proposal: front (1-200 chars), back (1-500 chars), was_edited (boolean)

2. **Process Proposals**
   - For each proposal, determine source:
     - If was_edited=false → source='ai'
     - If was_edited=true → source='ai-edited'

3. **Batch Insert Flashcards**
   ```sql
   INSERT INTO flashcards (
     generation_id, front, back, source, status,
     due_date, interval, ease_factor, repetitions
   ) VALUES (
     $generation_id, $front, $back, $source, 'active',
     NOW(), 0, 2.5, 0
   )
   RETURNING *
   ```

4. **Return Response**
   - Status 201 Created
   - Include saved_count
   - Include all saved flashcards as `FlashcardDTO[]`

**Note:** This is the primary way AI-generated proposals become persistent flashcards in the database.

---

#### BL-2: Manual Flashcard Creation

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

---

#### BL-3: Edit Active Flashcard

**Trigger:** PATCH `/api/flashcards/:id`

**Steps:**
1. **Validate Input**
   - Verify flashcard exists and user has access
   - Validate provided fields (front, back, etc.)

2. **Update Flashcard**
   - If front or back changed and source='ai', automatically set source='ai-edited'
   - Standard field updates (partial update pattern)
     ```sql
     UPDATE flashcards SET
       front = COALESCE($front, front),
       back = COALESCE($back, back),
       source = CASE 
         WHEN ($front IS NOT NULL OR $back IS NOT NULL) AND source = 'ai' 
         THEN 'ai-edited' 
         ELSE source 
       END,
       status = COALESCE($status, status),
       due_date = COALESCE($due_date, due_date),
       interval = COALESCE($interval, interval),
       ease_factor = COALESCE($ease_factor, ease_factor),
       repetitions = COALESCE($repetitions, repetitions)
     WHERE id = $id
     RETURNING *
     ```

3. **Return Updated Flashcard**

**Note:** No candidate editing needed - proposals are edited client-side before batch save.

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
// Generate flashcard candidates (saves to DB immediately)
const response = await fetch('/api/generations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source_text: longText
  })
})

const generation = await response.json()
// Returns: { generation_id, model, source_text_hash, flashcards_generated, created_at, flashcards: [...] }
// Flashcards are already saved as candidates in DB

// Edit a candidate flashcard
await fetch(`/api/flashcards/${candidateId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    front: "Edited question",
    back: "Edited answer"
    // source automatically changes to 'ai-edited' if content changed
  })
})

// Accept a candidate (activate it)
await fetch(`/api/flashcards/${candidateId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'active'
    // SR parameters automatically initialized
  })
})

// Reject a candidate (delete it)
await fetch(`/api/flashcards/${candidateId}`, {
  method: 'DELETE'
})

// List candidate flashcards from a generation
const candidates = await fetch(
  `/api/flashcards?generation_id=${generationId}&status=candidate`
).then(r => r.json())

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

// Create manual flashcard
await fetch('/api/flashcards', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    front: "What is the capital of France?",
    back: "Paris"
  })
})
```

### 10.2 cURL Examples

```bash
# Generate flashcard candidates (saves to DB immediately)
curl -X POST https://app.10xcards.com/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Long educational text..."
  }'

# Edit a candidate flashcard
curl -X PATCH https://app.10xcards.com/api/flashcards/<candidate-id> \
  -H "Content-Type: application/json" \
  -d '{
    "front": "Edited question",
    "back": "Edited answer"
  }'

# Accept a candidate (activate it)
curl -X PATCH https://app.10xcards.com/api/flashcards/<candidate-id> \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'

# Reject a candidate (delete it)
curl -X DELETE https://app.10xcards.com/api/flashcards/<candidate-id>

# Create manual flashcard
curl -X POST https://app.10xcards.com/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is the capital of France?",
    "back": "Paris"
  }'

# List candidate flashcards from a generation
curl -X GET "https://app.10xcards.com/api/flashcards?generation_id=<gen-id>&status=candidate"

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
│   └── [id].ts           # GET, PATCH, DELETE single flashcard
├── generations/
│   ├── index.ts          # GET (list), POST (generate AI + save)
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

**Type Distinction:**
- `FlashcardProposalDTO` - Raw AI response format (only `front` and `back` fields)
- `FlashcardDTO` - Full database record (includes `id`, `status`, `due_date`, etc.)

The AI service returns `FlashcardProposalDTO[]` which are then saved to the database and returned as `FlashcardDTO[]`.

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
    
    // Parse and validate AI response (returns FlashcardProposalDTO[])
    const flashcardProposals = parseFlashcardsFromAI(aiResult)
    
    // Save to database (transaction)
    // Create generation record
    const { data: generation, error: genError } = await supabase
      .from('generations')
      .insert({
        model,
        source_text_length: source_text.length,
        source_text_hash: hash,
        flashcards_generated: 10
      })
      .select()
      .single()
    
    if (genError) throw genError
    
    // Save flashcard proposals as candidates in database
    const flashcardsToInsert = flashcardProposals.map(proposal => ({
      generation_id: generation.id,
      front: proposal.front,
      back: proposal.back,
      source: 'ai',
      status: 'candidate',
      due_date: null,
      interval: null,
      ease_factor: null,
      repetitions: null
    }))
    
    const { data: savedFlashcards, error: flashcardsError } = await supabase
      .from('flashcards')
      .insert(flashcardsToInsert)
      .select()
    
    if (flashcardsError) throw flashcardsError
    
    // Return saved generation with full flashcards from database (FlashcardDTO[])
    return new Response(JSON.stringify({
      generation_id: generation.id,
      model: generation.model,
      source_text_length: generation.source_text_length,
      source_text_hash: generation.source_text_hash,
      flashcards_generated: generation.flashcards_generated,
      created_at: generation.created_at,
      flashcards: savedFlashcards // Full FlashcardDTO[] with id, status, etc.
    }), {
      status: 201,
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

**Note:** Flashcards are immediately saved to the database as candidates. User can then edit them via PATCH `/api/flashcards/:id` and activate them by changing status to 'active'. The `user_id` field will be properly set when authentication is implemented.

---

## 12. Summary

This REST API provides a complete backend for the 10x Cards MVP application with:

- **8 main endpoints** covering all user stories from the PRD
- **RESTful design** following industry best practices
- **Comprehensive validation** matching database constraints
- **Proper error handling** with meaningful status codes and messages
- **Performance optimization** via database indexes and efficient queries
- **Scalable architecture** ready for future enhancements

### Key API Flow

**AI Generation Flow:**
1. Generate proposals via `POST /api/generations` → returns `FlashcardProposalDTO[]` and generation_id
2. **Client-side:** User reviews, edits, and removes unwanted proposals (React/Vue state)
3. User saves accepted proposals via `POST /api/flashcards/batch` with generation_id
4. Proposals are saved as active flashcards with proper source tracking

**Manual Flashcard Flow:**
1. Create manual flashcard via `POST /api/flashcards` (immediately active with source='manual')

**Source Tracking:**
- `'ai'` - Original AI-generated proposal (not edited by user)
- `'ai-edited'` - AI proposal modified by user before saving
- `'manual'` - User-created content

**Status Lifecycle:**
- **No 'candidate' status** - proposals exist only on client-side
- `'active'` - Saved flashcard, ready for spaced repetition
- `'rejected'` - (Optional) Flashcard marked as rejected

**Current Phase:** Authentication is **not implemented**. All endpoints are publicly accessible for development purposes. 

**Next Phase:** Supabase Auth integration with session-based authentication and Row-Level Security (RLS) policies will be added to secure the API and enforce proper data isolation between users.

The API leverages Supabase's database capabilities while maintaining clean separation of concerns and enabling a smooth developer experience for frontend integration.


