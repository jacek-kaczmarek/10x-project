# Plan Implementacji API dla US-008: Wyświetlanie kolekcji

## 1. Przegląd User Story

**US-008: Wyświetlanie kolekcji**

- Jako użytkownik chcę zobaczyć wszystkie moje fiszki z paginacją i możliwością wyszukiwania
- Widok: `/flashcards` - tabela z paginacją, filtry, search, inline edit/delete
- Kryteria akceptacji:
  - Widok kolekcji pokazuje fiszki w rekordach po stronie serwera
  - Dostępne jest pole wyszukiwania filtrowania po tekście
  - Paginacja działa i można przechodzić między stronami

## 2. Wykorzystanie istniejącego API

### 2.1 Główny Endpoint - GET /api/flashcards

**Endpoint jest już zaprojektowany w `api-plan.md` (linie 189-262)**

Endpoint ten obsługuje wszystkie wymagania US-008:
- ✅ Paginacja po stronie serwera (query params: `page`, `limit`)
- ✅ Wyszukiwanie w tekście (query param: `search`)
- ✅ Filtrowanie po statusie (query param: `status`)
- ✅ Filtrowanie po źródle (query param: `source`)
- ✅ Sortowanie (query params: `sort`, `order`)

## 3. Modele Danych

### 3.1 FlashcardDTO (zwracany z API)

**Typ:** Kompletny rekord fiszki z bazy danych

```typescript
// src/types.ts
export interface FlashcardDTO {
  id: string;
  user_id: string;
  generation_id: string | null;
  front: string;
  back: string;
  status: 'candidate' | 'active' | 'rejected';
  source: 'manual' | 'ai' | 'ai-edited';
  due_date: string | null;  // ISO 8601 datetime
  interval: number | null;
  ease_factor: number | null;
  repetitions: number | null;
  created_at: string;  // ISO 8601 datetime
  updated_at: string;  // ISO 8601 datetime
}
```

**Mapowanie do Supabase types:**
- Odpowiada `Tables<'flashcards'>` z `database.types.ts`
- Wszystkie pola są zgodne z schematem bazy danych

### 3.2 PaginatedFlashcardsResponse (odpowiedź API)

```typescript
// src/types.ts
export interface PaginationMeta {
  total: number;       // Całkowita liczba rekordów
  page: number;        // Aktualna strona (1-indexed)
  limit: number;       // Rekordów na stronę
  total_pages: number; // Całkowita liczba stron
}

export interface PaginatedFlashcardsResponse {
  data: FlashcardDTO[];
  pagination: PaginationMeta;
}
```

### 3.3 FlashcardsQueryParams (parametry wyszukiwania)

```typescript
// src/types.ts
export interface FlashcardsQueryParams {
  // Filtry
  status?: 'candidate' | 'active' | 'rejected' | 'all';
  source?: 'manual' | 'ai' | 'ai-edited' | 'all';
  search?: string;
  due?: boolean;
  generation_id?: string;
  
  // Paginacja
  page?: number;
  limit?: number;
  
  // Sortowanie
  sort?: 'created_at' | 'updated_at' | 'due_date';
  order?: 'asc' | 'desc';
}
```

## 4. Implementacja Endpointu

### 4.1 Struktura pliku

**Lokalizacja:** `src/pages/api/flashcards/index.ts`

```typescript
import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { FlashcardsQueryParams } from '../../../types';

// Endpoint obsługuje GET i POST
export const GET: APIRoute = async ({ locals, url }) => {
  // Implementacja listowania
};

export const POST: APIRoute = async ({ locals, request }) => {
  // Implementacja tworzenia manualnego (z api-plan.md)
};
```

### 4.2 Schemat Walidacji (Zod)

**Lokalizacja:** `src/lib/validators/flashcards.validator.ts`

```typescript
import { z } from 'zod';

// Walidacja query params dla GET /api/flashcards
export const flashcardsQuerySchema = z.object({
  // Filtry
  status: z.enum(['candidate', 'active', 'rejected', 'all']).optional().default('all'),
  source: z.enum(['manual', 'ai', 'ai-edited', 'all']).optional().default('all'),
  search: z.string().min(1).max(200).optional(),
  due: z.coerce.boolean().optional().default(false),
  generation_id: z.string().uuid().optional(),
  
  // Paginacja
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  
  // Sortowanie
  sort: z.enum(['created_at', 'updated_at', 'due_date']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type FlashcardsQuery = z.infer<typeof flashcardsQuerySchema>;
```

### 4.3 Logika Biznesowa - Service Layer

**Lokalizacja:** `src/lib/services/flashcards.service.ts`

```typescript
import type { SupabaseClient } from '../../../db/supabase.client';
import type { Database } from '../../../db/database.types';
import type { FlashcardDTO, PaginatedFlashcardsResponse } from '../../types';
import type { FlashcardsQuery } from '../validators/flashcards.validator';

export class FlashcardsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Listuje fiszki użytkownika z filtrowaniem, wyszukiwaniem i paginacją
   */
  async listFlashcards(
    query: FlashcardsQuery
  ): Promise<{ data: PaginatedFlashcardsResponse | null; error: Error | null }> {
    try {
      // 1. Buduj bazowe zapytanie
      let queryBuilder = this.supabase
        .from('flashcards')
        .select('*', { count: 'exact' });

      // 2. Zastosuj filtry
      if (query.status !== 'all') {
        queryBuilder = queryBuilder.eq('status', query.status);
      }

      if (query.source !== 'all') {
        queryBuilder = queryBuilder.eq('source', query.source);
      }

      if (query.search) {
        queryBuilder = queryBuilder.or(
          `front.ilike.%${query.search}%,back.ilike.%${query.search}%`
        );
      }

      if (query.due) {
        const now = new Date().toISOString();
        queryBuilder = queryBuilder
          .eq('status', 'active')
          .lte('due_date', now);
      }

      if (query.generation_id) {
        queryBuilder = queryBuilder.eq('generation_id', query.generation_id);
      }

      // 3. Zastosuj sortowanie
      queryBuilder = queryBuilder.order(query.sort, { ascending: query.order === 'asc' });

      // 4. Zastosuj paginację
      const from = (query.page - 1) * query.limit;
      const to = from + query.limit - 1;
      queryBuilder = queryBuilder.range(from, to);

      // 5. Wykonaj zapytanie
      const { data, error, count } = await queryBuilder;

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      // 6. Przygotuj odpowiedź
      const totalPages = count ? Math.ceil(count / query.limit) : 0;

      return {
        data: {
          data: data as FlashcardDTO[],
          pagination: {
            total: count || 0,
            page: query.page,
            limit: query.limit,
            total_pages: totalPages,
          },
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }
}
```

### 4.4 Implementacja Route Handler

**Lokalizacja:** `src/pages/api/flashcards/index.ts`

```typescript
import type { APIRoute } from 'astro';
import { flashcardsQuerySchema } from '../../../lib/validators/flashcards.validator';
import { FlashcardsService } from '../../../lib/services/flashcards.service';

export const GET: APIRoute = async ({ locals, url }) => {
  // 1. Pobierz Supabase client z middleware
  const supabase = locals.supabase;

  if (!supabase) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'SERVER_ERROR',
          message: 'Database client not initialized',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Pobierz i waliduj query params
  const params = Object.fromEntries(url.searchParams.entries());
  const validationResult = flashcardsQuerySchema.safeParse(params);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: validationResult.error.errors,
        },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. Wywołaj service layer
  const service = new FlashcardsService(supabase);
  const { data, error } = await service.listFlashcards(validationResult.data);

  if (error) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to retrieve flashcards',
          details: { error: error.message },
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Zwróć wynik
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

## 5. Integracja z Frontend

### 5.1 API Client Hook (React)

**Lokalizacja:** `src/lib/hooks/useFlashcards.ts`

```typescript
import { useState, useEffect } from 'react';
import type { FlashcardDTO, PaginatedFlashcardsResponse, FlashcardsQueryParams } from '../../types';

interface UseFlashcardsResult {
  flashcards: FlashcardDTO[];
  pagination: PaginatedFlashcardsResponse['pagination'] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useFlashcards(params: FlashcardsQueryParams): UseFlashcardsResult {
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
  const [pagination, setPagination] = useState<PaginatedFlashcardsResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFlashcards = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Buduj query string
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/flashcards?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch flashcards');
      }

      const data: PaginatedFlashcardsResponse = await response.json();
      setFlashcards(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [JSON.stringify(params)]);

  return {
    flashcards,
    pagination,
    isLoading,
    error,
    refetch: fetchFlashcards,
  };
}
```

### 5.2 Komponent FlashcardsTable (przykład użycia)

**Lokalizacja:** `src/components/FlashcardsTable.tsx`

```tsx
import { useState } from 'react';
import { useFlashcards } from '../lib/hooks/useFlashcards';
import type { FlashcardsQueryParams } from '../types';

export function FlashcardsTable() {
  const [queryParams, setQueryParams] = useState<FlashcardsQueryParams>({
    status: 'active',
    page: 1,
    limit: 20,
    sort: 'created_at',
    order: 'desc',
  });

  const { flashcards, pagination, isLoading, error, refetch } = useFlashcards(queryParams);

  const handleSearch = (search: string) => {
    setQueryParams({ ...queryParams, search, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setQueryParams({ ...queryParams, page });
  };

  const handleStatusFilter = (status: FlashcardsQueryParams['status']) => {
    setQueryParams({ ...queryParams, status, page: 1 });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search flashcards..."
        onChange={(e) => handleSearch(e.target.value)}
      />

      {/* Filter Panel */}
      <div>
        <button onClick={() => handleStatusFilter('all')}>All</button>
        <button onClick={() => handleStatusFilter('active')}>Active</button>
        <button onClick={() => handleStatusFilter('candidate')}>Candidates</button>
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>Front</th>
            <th>Back</th>
            <th>Status</th>
            <th>Source</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {flashcards.map((card) => (
            <tr key={card.id}>
              <td>{card.front}</td>
              <td>{card.back}</td>
              <td>{card.status}</td>
              <td>{card.source}</td>
              <td>{new Date(card.created_at).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleEdit(card.id)}>Edit</button>
                <button onClick={() => handleDelete(card.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && (
        <div>
          <button
            disabled={pagination.page === 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <button
            disabled={pagination.page === pagination.total_pages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

## 6. Szczegóły Techniczne

### 6.1 Indeksy Bazy Danych (już istniejące)

Zapytania wykorzystują istniejące indeksy:
- `idx_flashcards_user_created` - dla sortowania po `created_at`
- `idx_flashcards_user_due` - dla filtrowania po `due_date`
- `idx_flashcards_generation` - dla filtrowania po `generation_id`

### 6.2 Optymalizacje Performance

1. **Server-Side Pagination:** LIMIT/OFFSET w SQL, nie pobieramy wszystkich rekordów
2. **Count Query:** Supabase wykonuje COUNT w jednym zapytaniu z danymi (`count: 'exact'`)
3. **Indeksowane Filtry:** Wszystkie filtry wykorzystują indeksy bazy danych
4. **Search ILIKE:** Dla MVP wystarczy ILIKE, można dodać GIN index jeśli będzie potrzebny

### 6.3 Bezpieczeństwo (na przyszłość)

**Obecna faza:** Brak autentykacji (development mode)

**Przyszła implementacja (z RLS):**
```sql
-- Row Level Security Policy
CREATE POLICY "Users can only view their own flashcards"
ON flashcards
FOR SELECT
USING (auth.uid() = user_id);
```

## 7. Przykłady Żądań i Odpowiedzi

### 7.1 Listowanie aktywnych fiszek (domyślne)

**Request:**
```http
GET /api/flashcards?status=active&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "user_id": "uuid-user",
      "generation_id": "uuid-gen",
      "front": "What is photosynthesis?",
      "back": "Process by which plants convert light into energy",
      "status": "active",
      "source": "ai",
      "due_date": "2025-11-05T12:00:00Z",
      "interval": 2,
      "ease_factor": 2.5,
      "repetitions": 1,
      "created_at": "2025-11-02T10:00:00Z",
      "updated_at": "2025-11-03T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8
  }
}
```

### 7.2 Wyszukiwanie z filtrem

**Request:**
```http
GET /api/flashcards?status=active&search=physics&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-2",
      "front": "Newton's first law of physics?",
      "back": "An object at rest stays at rest...",
      ...
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "total_pages": 1
  }
}
```

### 7.3 Błąd walidacji

**Request:**
```http
GET /api/flashcards?page=0&limit=200
```

**Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": [
      {
        "path": ["page"],
        "message": "Number must be greater than or equal to 1"
      },
      {
        "path": ["limit"],
        "message": "Number must be less than or equal to 100"
      }
    ]
  }
}
```

## 8. Checklisty Implementacyjne

### 8.1 Backend Checklist

- [ ] **Walidacja:** Utworzyć `flashcards.validator.ts` z Zod schema
- [ ] **Service:** Zaimplementować `FlashcardsService.listFlashcards()`
- [ ] **Route Handler:** Zaimplementować `GET /api/flashcards` w `index.ts`
- [ ] **Error Handling:** Obsłużyć wszystkie błędy (validation, database, unknown)
- [ ] **Testing:** Unit testy dla service layer
- [ ] **Testing:** Integration testy dla route handler

### 8.2 Frontend Checklist

- [ ] **Types:** Dodać `FlashcardDTO`, `PaginatedFlashcardsResponse`, `FlashcardsQueryParams` do `types.ts`
- [ ] **Hook:** Zaimplementować `useFlashcards` hook
- [ ] **Components:** Utworzyć `FlashcardsTable` komponent
- [ ] **Components:** Utworzyć `SearchInput` komponent
- [ ] **Components:** Utworzyć `FilterPanel` komponent
- [ ] **Components:** Utworzyć `Pagination` komponent
- [ ] **Integration:** Połączyć wszystkie komponenty w `/flashcards` page
- [ ] **Testing:** Unit testy dla hooka
- [ ] **Testing:** Component testy dla UI

### 8.3 E2E Testing Checklist

- [ ] **Test:** Wyświetlanie pustej kolekcji (empty state)
- [ ] **Test:** Wyświetlanie listy fiszek
- [ ] **Test:** Paginacja - przechodzenie między stronami
- [ ] **Test:** Wyszukiwanie - filtrowanie po tekście
- [ ] **Test:** Filtrowanie po statusie (active/candidate/rejected)
- [ ] **Test:** Filtrowanie po źródle (manual/ai/ai-edited)
- [ ] **Test:** Sortowanie (created_at/updated_at/due_date)
- [ ] **Test:** Inline edit fiszki
- [ ] **Test:** Inline delete fiszki

## 9. Dodatkowe Endpointy (już zaprojektowane w api-plan.md)

Te endpointy wspierają inline edit/delete w widoku kolekcji:

### 9.1 PATCH /api/flashcards/:id

**Linie 309-391 w api-plan.md**

- Edycja front/back fiszki
- Automatyczna zmiana source: 'ai' → 'ai-edited' przy edycji treści
- Używane przez inline edit w tabeli

### 9.2 DELETE /api/flashcards/:id

**Linie 395-422 w api-plan.md**

- Hard delete fiszki
- Używane przez inline delete w tabeli

## 10. Podsumowanie

### 10.1 Struktura Plików

```
src/
├── types.ts                                    # FlashcardDTO, PaginatedFlashcardsResponse
├── db/
│   ├── supabase.client.ts                     # Supabase client type
│   └── database.types.ts                       # Supabase generated types
├── lib/
│   ├── validators/
│   │   └── flashcards.validator.ts            # Zod schemas
│   ├── services/
│   │   └── flashcards.service.ts              # Business logic
│   └── hooks/
│       └── useFlashcards.ts                    # React hook for API
├── pages/
│   ├── api/
│   │   └── flashcards/
│   │       ├── index.ts                        # GET (list), POST (create)
│   │       └── [id].ts                         # GET, PATCH, DELETE
│   └── flashcards.astro                        # Frontend page
└── components/
    ├── FlashcardsTable.tsx                     # Main table component
    ├── SearchInput.tsx                          # Search component
    ├── FilterPanel.tsx                          # Filter component
    └── Pagination.tsx                           # Pagination component
```

### 10.2 Kluczowe Punkty

✅ **Wykorzystanie istniejącego API:** GET /api/flashcards już zaprojektowany w api-plan.md

✅ **Server-Side Pagination:** Wszystkie operacje po stronie serwera (performance)

✅ **Supabase Integration:** Pełne wykorzystanie typów z database.types.ts

✅ **Walidacja Zod:** Bezpieczna walidacja query params

✅ **Clean Architecture:** Service layer oddzielony od route handlers

✅ **Type Safety:** Pełne typowanie TypeScript dla frontend i backend

✅ **Łatwa Integracja Frontend:** Hook useFlashcards ułatwia integrację z React

✅ **Gotowe na Autentykację:** Struktura gotowa na dodanie RLS w przyszłości

### 10.3 Następne Kroki

1. **Implementacja Backend:**
   - Validator → Service → Route Handler
   - Unit testy dla logiki biznesowej
   
2. **Implementacja Frontend:**
   - Types → Hook → Components
   - Integracja z UI library (Shadcn/ui)
   
3. **E2E Testing:**
   - Playwright tests dla pełnego flow
   - Testy paginacji, search, filters

4. **Przyszłe Ulepszenia:**
   - Dodanie autentykacji (RLS)
   - GIN index dla ILIKE search (jeśli potrzebny)
   - Cache strategy dla często używanych queries
