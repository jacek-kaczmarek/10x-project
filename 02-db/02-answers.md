
1. tak, tabela flashcards związane prze kolumnę user_id typu UUID, która będzie kluczem obcym odnoszącym się do kolumny id w tabeli auth.users Supabase. Stworzy to relację jeden-do-wielu, gdzie jeden użytkownik może posiadać wiele fiszek.

2. dodanie do tabeli flashcards kolumny status (typu enum) z wartościami takimi jak candidate, active, rejected. Pozwoli to uniknąć tworzenia osobnej tabeli i uprości zapytania o kolekcję fiszek użytkownika (np. WHERE status = 'active').

3. Należy dodać dedykowane kolumny do tabeli flashcards do przechowywania metadanych związanych z powtórkami. Typowe pola to due_date (data następnej powtórki), interval (interwał w dniach), ease_factor (współczynnik łatwości) oraz repetitions (liczba powtórek). Kolumny te powinny być inicjalizowane domyślnymi wartościami przy tworzeniu nowej fiszki.

4. Użyj typu TEXT dla obu pól, aby zapewnić elastyczność. Wymuś limity znaków za pomocą ograniczeń CHECK (np. CHECK (char_length(front) <= 200)). Dodatkowo, zastosuj ograniczenie NOT NULL, aby zapewnić, że oba pola zawsze będą zawierały wartość.