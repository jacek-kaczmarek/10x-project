Na podstawie @flashcard.service.ts i typów @database.types.ts 
w stosie @tech-stack.md 

zaimplementuj widok:


### 2.3 Widok Moje fiszki (My Flashcards)
- Ścieżka: `/flashcards`
- Cel: Przegląd, filtrowanie i zarządzanie zapisanymi fiszkami.
- Kluczowe informacje: tabela z paginacją, filtry status/źródło, search, inline edit/delete.
- Komponenty: `FlashcardsTable`, `DataTable`, `FilterPanel`, `SearchInput`, `InlineEditCell`, `Pagination`, Toast.
- UX/A11y/Sec: ARIA-grid dla tabeli, keyboard focus, paginacja zgodna z RLS przyszła ochrona.


Przygotuj go tak, by łatwo było zintegrować go z poniższym w przyszłości:


### 2.4 Widok Dodawania ręcznego (Add Manual)
- Ścieżka: `/flashcards/new`
- Cel: Dodanie pojedynczej fiszki ręcznie.
- Kluczowe informacje: front (≤200), back (≤500), walidacja, przycisk Dodaj.
- Komponenty: `ManualFlashcardForm`, `InputField`, `TextArea`, `Button`, Toast.
- UX/A11y/Sec: ARIA-required, inline validation, feedback.

---
oraz dodaj do topbaru link Browse


Zachowaj styl podobny do @generate.page.ts 

