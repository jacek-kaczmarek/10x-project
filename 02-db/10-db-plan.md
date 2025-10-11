Jesteś architektem baz danych, którego zadaniem jest stworzenie schematu bazy danych PostgreSQL na podstawie informacji dostarczonych z sesji planowania, dokumentu wymagań produktu (PRD) i stacku technologicznym. Twoim celem jest zaprojektowanie wydajnej i skalowalnej struktury bazy danych, która spełnia wymagania projektu.

1. <prd>
@prd.md
</prd>

Jest to dokument wymagań produktu, który określa cechy, funkcjonalności i wymagania projektu.

2. <session_notes>
<conversation_summary>
<decisions>
1.  Tabela `flashcards` zostanie powiązana z tabelą `auth.users` Supabase za pomocą klucza obcego `user_id` (UUID), tworząc relację jeden-do-wielu.
2.  Status fiszek (`candidate`, `active`, `rejected`) będzie zarządzany przez kolumnę `status` z wykorzystaniem natywnego typu `ENUM` w PostgreSQL.
3.  Pochodzenie fiszek (`manual`, `ai`) będzie śledzone w kolumnie `source`, również typu `ENUM`, w celu zbierania metryk.
4.  Do tabeli `flashcards` zostaną dodane dedykowane kolumny do obsługi algorytmu spaced repetition: `due_date` (TIMESTAMPTZ), `interval` (INTEGER), `ease_factor` (NUMERIC(4, 2)) oraz `repetitions` (INTEGER).
5.  Wartości początkowe dla nowo aktywowanych fiszek w systemie powtórek to: `due_date` jako `NOW()`, `interval` = 0, `ease_factor` = 2.5, `repetitions` = 0.
6.  Pola `front` i `back` będą typu `TEXT` z ograniczeniami `CHECK` na długość (odpowiednio 200 i 500 znaków) oraz `NOT NULL`.
7.  Wydajność zapytań zostanie zapewniona przez złożony indeks na kolumnach `(user_id, created_at DESC)`.
8.  Wyszukiwanie w kolekcji na etapie MVP będzie realizowane jako proste, niewrażliwe na wielkość liter zapytanie `ILIKE` na polach `front` i `back`.
9.  Bezpieczeństwo danych zostanie zaimplementowane poprzez polityki Row-Level Security (RLS), ograniczające dostęp każdego użytkownika wyłącznie do jego własnych fiszek.
10. Usuwanie fiszek będzie operacją trwałą (hard delete).
11. Obszerny tekst źródłowy używany do generowania fiszek przez AI oraz śledzenie użycia API nie będą przechowywane w bazie danych na etapie MVP.
</decisions>

<matched_recommendations>
1.  Powiązanie tabeli `flashcards` z `auth.users` za pomocą klucza obcego `user_id` w celu zapewnienia integralności referencyjnej.
2.  Zastosowanie natywnych typów `ENUM` dla kolumn `status` i `source` w celu poprawy spójności i wydajności danych.
3.  Dodanie dedykowanych, poprawnie otypowanych kolumn do przechowywania metadanych algorytmu spaced repetition.
4.  Wdrożenie polityk bezpieczeństwa na poziomie wiersza (RLS) w celu ścisłej izolacji danych poszczególnych użytkowników.
5.  Utworzenie złożonego indeksu na `(user_id, created_at DESC)` w celu optymalizacji najczęstszych zapytań odczytu.
6.  Implementacja usuwania fiszek jako operacji trwałej (hard delete) w celu uproszczenia logiki na etapie MVP.
7.  Zastosowanie ograniczeń `CHECK` i `NOT NULL` dla pól `front` i `back` w celu zapewnienia jakości i kompletności danych.
</matched_recommendations>

<database_planning_summary>
Na podstawie analizy wymagań produktu i stosu technologicznego, schemat bazy danych dla MVP aplikacji 10x Cards zostanie scentralizowany wokół jednej głównej tabeli `flashcards`.

**Encje i Relacje:**
Główną encją będzie `flashcards`, przechowująca wszystkie informacje o fiszkach. Będzie ona w relacji jeden-do-wielu z encją `users`, zarządzaną przez system `Supabase Auth`. Relacja ta zostanie zrealizowana poprzez klucz obcy `user_id` w tabeli `flashcards`, wskazujący na `id` w tabeli `auth.users`. Tabela `flashcards` będzie zawierała pola `front` i `back` (typu `TEXT` z ograniczeniami długości), kolumny do zarządzania cyklem życia fiszki (`status` i `source` typu `ENUM`) oraz zestaw kolumn (`due_date`, `interval`, `ease_factor`, `repetitions`) do obsługi logiki algorytmu spaced repetition.

**Bezpieczeństwo i Skalowalność:**
Kluczowym elementem bezpieczeństwa będzie wdrożenie polityk Row-Level Security (RLS) na tabeli `flashcards`. Zapewni to, że użytkownicy będą mogli wykonywać operacje CRUD wyłącznie na wierszach, których są właścicielami (gdzie `user_id` pasuje do `auth.uid()`). W celu zapewnienia wydajności przy przeglądaniu kolekcji, na tabeli zostanie założony złożony indeks `(user_id, created_at DESC)`. Wyszukiwanie tekstowe na etapie MVP będzie oparte na operatorze `ILIKE`, co jest wystarczającym rozwiązaniem przy początkowej skali projektu.

**Integralność Danych:**
Integralność danych będzie zapewniona przez użycie kluczy obcych, ograniczeń `NOT NULL` oraz `CHECK` dla kluczowych pól tekstowych, a także przez zastosowanie typów `ENUM` dla statusu i źródła fiszki, co zapobiegnie wprowadzeniu nieprawidłowych wartości.
</database_planning_summary>

<unresolved_issues>
Brak nierozwiązanych kwestii. Wszystkie kluczowe aspekty projektowania schematu bazy danych dla MVP zostały omówione i uzgodnione.
</unresolved_issues>
</conversation_summary>
</session_notes>

Są to notatki z sesji planowania schematu bazy danych. Mogą one zawierać ważne decyzje, rozważania i konkretne wymagania omówione podczas spotkania.

3. <tech_stack>
@tech-stack.md
</tech_stack>

Opisuje stack technologiczny, który zostanie wykorzystany w projekcie, co może wpłynąć na decyzje dotyczące projektu bazy danych.

Wykonaj następujące kroki, aby utworzyć schemat bazy danych:

1. Dokładnie przeanalizuj notatki z sesji, identyfikując kluczowe jednostki, atrybuty i relacje omawiane podczas sesji planowania.
2. Przejrzyj PRD, aby upewnić się, że wszystkie wymagane funkcje i funkcjonalności są obsługiwane przez schemat bazy danych.
3. Przeanalizuj stack technologiczny i upewnij się, że projekt bazy danych jest zoptymalizowany pod kątem wybranych technologii.

4. Stworzenie kompleksowego schematu bazy danych, który obejmuje
   a. Tabele z odpowiednimi nazwami kolumn i typami danych
   b. Klucze podstawowe i klucze obce
   c. Indeksy poprawiające wydajność zapytań
   d. Wszelkie niezbędne ograniczenia (np. unikalność, not null)

5. Zdefiniuj relacje między tabelami, określając kardynalność (jeden-do-jednego, jeden-do-wielu, wiele-do-wielu) i wszelkie tabele łączące wymagane dla relacji wiele-do-wielu.

6. Opracowanie zasad PostgreSQL dla zabezpieczeń na poziomie wiersza (RLS), jeśli dotyczy, w oparciu o wymagania określone w notatkach z sesji lub PRD.

7. Upewnij się, że schemat jest zgodny z najlepszymi praktykami projektowania baz danych, w tym normalizacji do odpowiedniego poziomu (zwykle 3NF, chyba że denormalizacja jest uzasadniona ze względu na wydajność).

Ostateczny wynik powinien mieć następującą strukturę:
```markdown
1. Lista tabel z ich kolumnami, typami danych i ograniczeniami
2. Relacje między tabelami
3. Indeksy
4. Zasady PostgreSQL (jeśli dotyczy)
5. Wszelkie dodatkowe uwagi lub wyjaśnienia dotyczące decyzji projektowych
```

W odpowiedzi należy podać tylko ostateczny schemat bazy danych w formacie markdown, który zapiszesz w pliku .ai/db-plan.md bez uwzględniania procesu myślowego lub kroków pośrednich. Upewnij się, że schemat jest kompleksowy, dobrze zorganizowany i gotowy do wykorzystania jako podstawa do tworzenia migracji baz danych.