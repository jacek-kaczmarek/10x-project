# Schemat Bazy Danych - 10x Cards

## 1. Tabele

### 1.1 flashcards

Główna tabela przechowująca wszystkie fiszki użytkowników wraz z metadanymi algorytmu spaced repetition.

| Kolumna | Typ Danych | Ograniczenia | Opis |
|---------|------------|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator fiszki |
| `user_id` | UUID | NOT NULL, FOREIGN KEY → auth.users(id) ON DELETE CASCADE | Identyfikator właściciela fiszki |
| `generation_id` | UUID | NULL, FOREIGN KEY → generations(id) ON DELETE SET NULL | Identyfikator generacji, do której należy fiszka (NULL dla fiszek ręcznych) |
| `front` | TEXT | NOT NULL, CHECK (char_length(front) > 0 AND char_length(front) <= 200) | Przód fiszki (pytanie/termin) |
| `back` | TEXT | NOT NULL, CHECK (char_length(back) > 0 AND char_length(back) <= 500) | Tył fiszki (odpowiedź/definicja) |
| `status` | flashcard_status | NOT NULL, DEFAULT 'candidate' | Status fiszki w cyklu życia |
| `source` | flashcard_source | NOT NULL | Źródło pochodzenia fiszki |
| `due_date` | TIMESTAMPTZ | NULL | Data następnej powtórki (NULL dla statusu 'candidate') |
| `interval` | INTEGER | NULL, CHECK (interval >= 0) | Interwał w dniach do następnej powtórki |
| `ease_factor` | NUMERIC(4, 2) | NULL, CHECK (ease_factor >= 1.3) | Współczynnik łatwości dla algorytmu SM-2 |
| `repetitions` | INTEGER | NULL, CHECK (repetitions >= 0) | Liczba udanych powtórek z rzędu |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia fiszki |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej modyfikacji |

### 1.2 generations

Tabela śledząca każdą akcję generowania fiszek przez AI, grupująca wygenerowane fiszki.

| Kolumna | Typ Danych | Ograniczenia | Opis |
|---------|------------|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator generacji |
| `user_id` | UUID | NOT NULL, FOREIGN KEY → auth.users(id) ON DELETE CASCADE | Identyfikator użytkownika, który wygenerował fiszki |
| `model` | TEXT | NOT NULL | Nazwa/identyfikator użytego modelu AI (np. "gpt-4o-mini") |
| `source_text_length` | INTEGER | NOT NULL, CHECK (source_text_length >= 1000 AND source_text_length <= 10000) | Długość źródłowego tekstu w znakach |
| `source_text_hash` | TEXT | NOT NULL | Hash (np. SHA-256) źródłowego tekstu dla audytu |
| `flashcards_generated` | INTEGER | NOT NULL, DEFAULT 0, CHECK (flashcards_generated >= 0) | Liczba wygenerowanych fiszek w tej generacji |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data i czas generacji |

### 1.3 generation_error_logs

Tabela przechowująca logi błędów występujących podczas generowania fiszek przez AI.

| Kolumna | Typ Danych | Ograniczenia | Opis |
|---------|------------|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator logu błędu |
| `user_id` | UUID | NOT NULL, FOREIGN KEY → auth.users(id) ON DELETE CASCADE | Identyfikator użytkownika, który próbował wygenerować fiszki |
| `error_type` | TEXT | NOT NULL | Typ błędu (np. "api_error", "network_error", "validation_error") |
| `error_message` | TEXT | NOT NULL | Treść komunikatu błędu |
| `model` | TEXT | NOT NULL | Nazwa/identyfikator modelu AI, który był używany |
| `source_text_length` | INTEGER | NOT NULL, CHECK (source_text_length >= 0) | Długość źródłowego tekstu w znakach |
| `source_text_hash` | TEXT | NOT NULL | Hash (np. SHA-256) źródłowego tekstu |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data i czas wystąpienia błędu |

### 1.4 Typy ENUM

#### flashcard_status
```sql
CREATE TYPE flashcard_status AS ENUM (
    'candidate',  -- Fiszka wygenerowana przez AI, oczekująca na akceptację
    'active',     -- Fiszka zaakceptowana, aktywna w kolekcji
    'rejected'    -- Fiszka odrzucona przez użytkownika
);
```

#### flashcard_source
```sql
CREATE TYPE flashcard_source AS ENUM (
    'manual',     -- Fiszka utworzona ręcznie przez użytkownika
    'ai',         -- Fiszka wygenerowana przez AI (niezmieniona)
    'ai-edited'   -- Fiszka wygenerowana przez AI i edytowana przez użytkownika
);
```

## 2. Relacje między tabelami

### 2.1 flashcards → auth.users (wiele-do-jeden)

- **Kardynalność**: Wiele fiszek należy do jednego użytkownika
- **Klucz obcy**: `flashcards.user_id` → `auth.users.id`
- **Akcja CASCADE**: ON DELETE CASCADE (usunięcie użytkownika powoduje usunięcie wszystkich jego fiszek)
- **Opis**: Każda fiszka musi być przypisana do konkretnego użytkownika. Użytkownik może mieć wiele fiszek.

### 2.2 flashcards → generations (wiele-do-jeden, opcjonalna)

- **Kardynalność**: Wiele fiszek może należeć do jednej generacji
- **Klucz obcy**: `flashcards.generation_id` → `generations.id`
- **Akcja CASCADE**: ON DELETE SET NULL (usunięcie generacji ustawia generation_id na NULL, fiszki pozostają)
- **Opis**: Fiszki wygenerowane przez AI są powiązane z obiektem generacji. Fiszki ręczne mają generation_id = NULL. Relacja jest opcjonalna, co pozwala na istnienie fiszek niezależnie od generacji.

### 2.3 generations → auth.users (wiele-do-jeden)

- **Kardynalność**: Wiele generacji należy do jednego użytkownika
- **Klucz obcy**: `generations.user_id` → `auth.users.id`
- **Akcja CASCADE**: ON DELETE CASCADE (usunięcie użytkownika powoduje usunięcie wszystkich jego generacji)
- **Opis**: Każda generacja musi być przypisana do użytkownika, który ją wykonał.

### 2.4 generation_error_logs → auth.users (wiele-do-jeden)

- **Kardynalność**: Wiele logów błędów należy do jednego użytkownika
- **Klucz obcy**: `generation_error_logs.user_id` → `auth.users.id`
- **Akcja CASCADE**: ON DELETE CASCADE (usunięcie użytkownika powoduje usunięcie wszystkich jego logów błędów)
- **Opis**: Każdy log błędu musi być przypisany do użytkownika, który próbował wygenerować fiszki.

## 3. Indeksy

### 3.1 Indeks podstawowy
```sql
-- Automatycznie tworzony dla PRIMARY KEY
CREATE UNIQUE INDEX flashcards_pkey ON flashcards(id);
```

### 3.2 Indeks dla zapytań paginowanych po user_id
```sql
CREATE INDEX idx_flashcards_user_created ON flashcards(user_id, created_at DESC);
```
**Uzasadnienie**: Optymalizuje najczęstsze zapytania do kolekcji użytkownika, sortowane chronologicznie.

### 3.3 Indeks dla zapytań do sesji powtórek
```sql
CREATE INDEX idx_flashcards_user_due ON flashcards(user_id, status, due_date) 
WHERE status = 'active' AND due_date IS NOT NULL;
```
**Uzasadnienie**: Partial index optymalizujący zapytania dla sesji nauki - pobieranie aktywnych fiszek gotowych do powtórki.

### 3.4 Indeks dla wyszukiwania tekstowego (opcjonalny dla MVP)
```sql
CREATE INDEX idx_flashcards_search ON flashcards USING gin(
    to_tsvector('simple', front || ' ' || back)
);
```
**Uwaga**: Ten indeks może zostać dodany w późniejszej fazie jeśli proste wyszukiwanie ILIKE okaże się niewystarczające.

### 3.5 Indeks dla generacji użytkownika
```sql
CREATE INDEX idx_generations_user_created ON generations(user_id, created_at DESC);
```
**Uzasadnienie**: Optymalizuje zapytania do historii generacji użytkownika, sortowane chronologicznie.

### 3.6 Indeks dla powiązania fiszek z generacjami
```sql
CREATE INDEX idx_flashcards_generation ON flashcards(generation_id) WHERE generation_id IS NOT NULL;
```
**Uzasadnienie**: Partial index optymalizujący zapytania pobierające fiszki należące do konkretnej generacji.

### 3.7 Indeks dla logów błędów użytkownika
```sql
CREATE INDEX idx_error_logs_user_created ON generation_error_logs(user_id, created_at DESC);
```
**Uzasadnienie**: Optymalizuje zapytania do historii błędów użytkownika dla celów audytu i analizy.

## 4. Polityki Row-Level Security (RLS)

### 4.1 Włączenie RLS na tabeli flashcards
```sql
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
```

### 4.2 Polityka SELECT
```sql
CREATE POLICY "Users can view their own flashcards"
    ON flashcards
    FOR SELECT
    USING (auth.uid() = user_id);
```
**Opis**: Użytkownicy mogą odczytywać tylko własne fiszki.

### 4.3 Polityka INSERT
```sql
CREATE POLICY "Users can insert their own flashcards"
    ON flashcards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```
**Opis**: Użytkownicy mogą tworzyć fiszki tylko dla siebie.

### 4.4 Polityka UPDATE
```sql
CREATE POLICY "Users can update their own flashcards"
    ON flashcards
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```
**Opis**: Użytkownicy mogą modyfikować tylko własne fiszki i nie mogą zmienić właściciela.

### 4.5 Polityka DELETE
```sql
CREATE POLICY "Users can delete their own flashcards"
    ON flashcards
    FOR DELETE
    USING (auth.uid() = user_id);
```
**Opis**: Użytkownicy mogą usuwać tylko własne fiszki (hard delete).

### 4.6 Włączenie RLS na tabeli generations
```sql
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
```

### 4.7 Polityki dla tabeli generations
```sql
CREATE POLICY "Users can view their own generations"
    ON generations
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations"
    ON generations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generations"
    ON generations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations"
    ON generations
    FOR DELETE
    USING (auth.uid() = user_id);
```
**Opis**: Użytkownicy mogą zarządzać tylko własnymi generacjami.

### 4.8 Włączenie RLS na tabeli generation_error_logs
```sql
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;
```

### 4.9 Polityki dla tabeli generation_error_logs
```sql
CREATE POLICY "Users can view their own error logs"
    ON generation_error_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own error logs"
    ON generation_error_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```
**Opis**: Użytkownicy mogą przeglądać własne logi błędów. System może wstawiać nowe logi. Operacje UPDATE i DELETE mogą być ograniczone tylko do administratorów (nie zdefiniowane w MVP).

## 5. Triggery

### 5.1 Automatyczna aktualizacja updated_at
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_flashcards_updated_at
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```
**Opis**: Automatycznie aktualizuje kolumnę `updated_at` przy każdej modyfikacji wiersza.

## 6. Dodatkowe uwagi i decyzje projektowe

### 6.1 Wartości domyślne dla nowych aktywnych fiszek
Przy zmianie statusu fiszki z `candidate` na `active`, aplikacja powinna ustawić:
- `due_date` = NOW() (natychmiast dostępna do nauki)
- `interval` = 0
- `ease_factor` = 2.5 (standardowa wartość początkowa dla SM-2)
- `repetitions` = 0

### 6.2 Obsługa statusu 'rejected'
Fiszki ze statusem `rejected` mogą być przechowywane tymczasowo (np. 30 dni) przed ostatecznym usunięciem, lub usuwane natychmiast w zależności od implementacji. Na etapie MVP proponowane jest natychmiastowe usuwanie (hard delete) odrzuconych kandydatów.

**Nowy flow generacji (z zapisem po stronie serwera):**
1. POST `/generations` z tekstem źródłowym
2. Serwer generuje fiszki przez AI i zapisuje je do bazy jako kandydaci (status='candidate', source='ai')
3. Serwer tworzy rekord w tabeli `generations` i powiązuje fiszki przez `generation_id`
4. Fiszki są zwracane do klienta do edycji
5. Klient może edytować fiszki lokalnie i wysłać aktualizacje:
   - Edycja treści (front/back) → source zmienia się na 'ai-edited'
   - Odrzucenie → status='rejected' lub hard delete
   - Akceptacja → status='active' (wraz z inicjalizacją parametrów SR)
6. Fiszki manualne tworzone są bezpośrednio z status='active', source='manual', generation_id=NULL

### 6.3 Wyszukiwanie tekstowe
Na etapie MVP wyszukiwanie będzie realizowane za pomocą prostego zapytania:
```sql
WHERE (front ILIKE '%search_term%' OR back ILIKE '%search_term%')
AND user_id = $1
AND status = 'active'
```

### 6.4 Paginacja
Zapytania paginowane powinny wykorzystywać indeks `idx_flashcards_user_created`:
```sql
SELECT * FROM flashcards
WHERE user_id = $1 AND status = 'active'
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

### 6.5 Algorytm Spaced Repetition
Kolumny `due_date`, `interval`, `ease_factor` i `repetitions` są zaprojektowane do obsługi algorytmu SuperMemo 2 (SM-2) lub podobnych. Biblioteka frontend'owa (np. `ts-fsrs`) będzie obliczać wartości, a backend zapisuje je w bazie.

### 6.6 Metryki i analityka
Kolumna `source` w tabeli `flashcards` pozwala na śledzenie pochodzenia fiszek:
- `'ai'` - wygenerowane przez AI i niezmodyfikowane
- `'ai-edited'` - wygenerowane przez AI i edytowane przez użytkownika
- `'manual'` - utworzone ręcznie przez użytkownika

Dla metryki sukcesu "75% fiszek w kolekcji pochodzi z generowania AI" zliczamy fiszki z source='ai' OR source='ai-edited'.

Tabela `generations` umożliwia analizę:
- Częstotliwości generowania fiszek przez użytkowników
- Wykorzystania różnych modeli AI
- Wzorców długości tekstów źródłowych
- Średniej liczby wygenerowanych fiszek na sesję

### 6.7 Śledzenie generacji AI
Każda akcja generowania fiszek przez AI tworzy rekord w tabeli `generations`, który:
- Grupuje wygenerowane fiszki (poprzez foreign key `generation_id` w `flashcards`)
- Przechowuje metadane generacji: model AI, długość i hash tekstu źródłowego
- Pozwala na audyt i analizę procesu generowania
- Umożliwia przyszłe funkcje jak "pokaż wszystkie fiszki z tej generacji"

**Proces tworzenia generacji:**
1. Endpoint POST `/generations` otrzymuje tekst źródłowy
2. Tworzy rekord w tabeli `generations` z metadanymi
3. Generuje fiszki przez AI i zapisuje je z powiązaniem do `generation_id`
4. Aktualizuje licznik `flashcards_generated` w rekordzie generacji
5. Zwraca fiszki do klienta jako kandydaci (status='candidate', source='ai')

Fiszki ręczne nie są powiązane z żadną generacją (`generation_id` = NULL), co pozwala na ich niezależne istnienie.

### 6.8 Logowanie błędów generacji
Tabela `generation_error_logs` służy do:
- Zbierania informacji o błędach w procesie generowania (API errors, network issues, validation errors)
- Analizy problemów i poprawy stabilności systemu
- Audytu i debugowania
- Potencjalnego monitorowania i alertów dla administratorów

Przechowywanie hashu tekstu źródłowego zamiast pełnego tekstu chroni prywatność użytkownika przy jednoczesnym umożliwieniu identyfikacji unikalnych przypadków błędów.

### 6.9 Skalowalność
- UUID jako PRIMARY KEY zapewnia globalną unikalność i możliwość partycjonowania w przyszłości
- Indeksy są dobrane pod kątem najczęstszych zapytań w MVP
- RLS zapewnia bezpieczeństwo bez konieczności dodatkowych warstw walidacji w aplikacji
- Relacja `flashcards.generation_id` z ON DELETE SET NULL zapewnia, że usunięcie starych generacji nie wpływa na aktywne fiszki

### 6.10 Integralność danych
- Klucze obce z CASCADE zapewniają czystość danych przy usuwaniu użytkowników
- Ograniczenia CHECK wymuszają poprawne zakresy wartości (długość fiszek, zakresy parametrów SR, długość tekstu źródłowego)
- NOT NULL na kluczowych polach zapobiega niekompletnym danym
- Typy ENUM zapewniają spójność wartości statusu i źródła
- Foreign key `generation_id` z ON DELETE SET NULL pozwala na zachowanie fiszek nawet po usunięciu generacji

### 6.11 Zgodność z Supabase
- Schemat wykorzystuje natywną tabelę `auth.users` z Supabase
- Polityki RLS używają funkcji `auth.uid()` dostępnej w Supabase
- Wszystkie typy danych są kompatybilne z automatycznym generowaniem typów TypeScript przez Supabase CLI
- Struktura wspiera automatyczne migracje przez Supabase CLI

