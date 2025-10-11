<pytania>
Czy dla kolumny status w tabeli flashcards powinien zostać utworzony dedykowany typ ENUM w PostgreSQL (np. CREATE TYPE flashcard_status AS ENUM ('candidate', 'active', 'rejected'))?
Rekomendacja: Tak, użycie natywnego typu ENUM jest zalecane, ponieważ zapewnia lepszą integralność danych i wydajność w porównaniu do kolumny TEXT z ograniczeniem CHECK.
W jaki sposób odróżnić fiszki stworzone ręcznie od tych wygenerowanych przez AI, aby umożliwić śledzenie metryk sukcesu (np. 75% zaakceptowanych fiszek AI)?
Rekomendacja: Dodać do tabeli flashcards kolumnę source (np. typu ENUM z wartościami manual i ai), aby jednoznacznie identyfikować pochodzenie każdej fiszki.
Jakie powinny być początkowe wartości dla kolumn związanych z algorytmem spaced repetition (due_date, interval, ease_factor, repetitions), gdy nowa fiszka jest dodawana do kolekcji (zmienia status na active)?
Rekomendacja: Dla nowo zaakceptowanej fiszki, zaleca się ustawienie due_date na aktualny czas (NOW()), a interval, ease_factor i repetitions na wartości początkowe zgodne z logiką wybranej biblioteki spaced repetition (np. repetitions = 0, interval = 0, ease_factor = 2.5).
Jakie są szczegółowe wymagania dotyczące funkcjonalności wyszukiwania w kolekcji fiszek na potrzeby MVP? Czy wyszukiwanie ma obejmować jednocześnie pola front i back oraz być niewrażliwe na wielkość liter?
Rekomendacja: Dla MVP zaleca się zaimplementowanie prostego wyszukiwania niewrażliwego na wielkość liter (case-insensitive) w obu polach (front i back) za pomocą operatora ILIKE. W przyszłości, dla większej wydajności przy dużych zbiorach danych, można rozważyć wdrożenie wyszukiwania pełnotekstowego (Full-Text Search) z użyciem indeksów GIN/GiST.
Jakie typy danych powinny być użyte dla kolumn due_date, interval, ease_factor i repetitions?
Rekomendacja: due_date: TIMESTAMPTZ, interval: INTEGER (reprezentujący dni), ease_factor: NUMERIC(4, 2) (dla precyzji), repetitions: INTEGER.
Czy w ramach MVP należy w bazie danych śledzić wykorzystanie API do generowania fiszek przez poszczególnych użytkowników w kontekście "konfigurowalnych limitów API"?
Rekomendacja: Na etapie MVP można pominąć śledzenie użycia API w głównej bazie danych, zakładając, że limity będą zarządzane na poziomie aplikacji lub bramki API (np. OpenRouter). Jeśli jednak wymagane jest śledzenie historyczne per użytkownik, konieczne będzie utworzenie dedykowanej tabeli (np. ai_usage_log). Dla uproszczenia, rekomenduje się odłożenie tego na później.
</pytania>