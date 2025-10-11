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