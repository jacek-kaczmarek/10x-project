
Na podstawie US:

<user-story>
- ID: US-008
  Tytuł: Wyświetlanie kolekcji
  Opis: Jako użytkownik chcę zobaczyć wszystkie moje fiszki z paginacją i możliwością wyszukiwania, aby łatwo przeglądać zasoby.
  Kryteria akceptacji:
  - Widok kolekcji pokazuje fiszki w rekordach po stronie serwera
  - Dostępne jest pole wyszukiwania filtrowania po tekście
  - Paginacja działa i można przechodzić między stronami

</user-story>

w stosie @tech-stack.md 

przygotuj plan implementacji API dla flashcards.

W przyszłości to API będzie obsługiwało widok:

<Widok>
### 2.3 Widok Moje fiszki (My Flashcards)
- Ścieżka: `/flashcards`
- Cel: Przegląd, filtrowanie i zarządzanie zapisanymi fiszkami.
- Kluczowe informacje: tabela z paginacją, filtry status/źródło, search, inline edit/delete.
- Komponenty: `FlashcardsTable`, `DataTable`, `FilterPanel`, `SearchInput`, `InlineEditCell`, `Pagination`, Toast.
- UX/A11y/Sec: ARIA-grid dla tabeli, keyboard focus, paginacja zgodna z RLS przyszła ochrona.

</Widok>

Plan powinien zawierać:

* informację o endpointach i modelach
* ułatwienie implementacji API, które łatwo zintegrować z bazą supabase @database.types.ts i widokiem,
