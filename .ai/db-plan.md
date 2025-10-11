# Schemat Bazy Danych - 10x Cards

## 1. Tabele

### 1.1 flashcards

Główna tabela przechowująca wszystkie fiszki użytkowników wraz z metadanymi algorytmu spaced repetition.

| Kolumna | Typ Danych | Ograniczenia | Opis |
|---------|------------|--------------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator fiszki |
| `user_id` | UUID | NOT NULL, FOREIGN KEY → auth.users(id) ON DELETE CASCADE | Identyfikator właściciela fiszki |
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

### 1.2 Typy ENUM

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
    'manual',  -- Fiszka utworzona ręcznie przez użytkownika
    'ai'       -- Fiszka wygenerowana przez AI
);
```

## 2. Relacje między tabelami

### 2.1 flashcards → auth.users (wiele-do-jeden)

- **Kardynalność**: Wiele fiszek należy do jednego użytkownika
- **Klucz obcy**: `flashcards.user_id` → `auth.users.id`
- **Akcja CASCADE**: ON DELETE CASCADE (usunięcie użytkownika powoduje usunięcie wszystkich jego fiszek)
- **Opis**: Każda fiszka musi być przypisana do konkretnego użytkownika. Użytkownik może mieć wiele fiszek.

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
Kolumna `source` pozwala na śledzenie, ile fiszek pochodzi z AI vs. manualnego tworzenia, co jest kluczowe dla metryki sukcesu: "75% fiszek w kolekcji pochodzi z generowania AI".

### 6.7 Skalowalność
- UUID jako PRIMARY KEY zapewnia globalną unikalność i możliwość partycjonowania w przyszłości
- Indeksy są dobrane pod kątem najczęstszych zapytań w MVP
- RLS zapewnia bezpieczeństwo bez konieczności dodatkowych warstw walidacji w aplikacji

### 6.8 Integralność danych
- Klucz obcy z CASCADE zapewnia czystość danych przy usuwaniu użytkowników
- Ograniczenia CHECK wymuszają poprawne zakresy wartości
- NOT NULL na kluczowych polach zapobiega niekompletnym danym
- Typy ENUM zapewniają spójność wartości statusu i źródła

### 6.9 Zgodność z Supabase
- Schemat wykorzystuje natywną tabelę `auth.users` z Supabase
- Polityki RLS używają funkcji `auth.uid()` dostępnej w Supabase
- Wszystkie typy danych są kompatybilne z automatycznym generowaniem typów TypeScript przez Supabase CLI

