# Architektura UI dla 10x Cards

## 1. Przegląd struktury UI

Interfejs użytkownika składa się z responsywnej aplikacji SPA w Astro/React z główną nawigacją Topbar/Burger Menu, kilkoma widokami odpowiadającymi kluczowym funkcjom PRD, zarządzaniem stanem przez React Context i React Query oraz systemem Design System opartym na Shadcn/ui.

## 2. Lista widoków

### 2.1 Widok Logowania/Rejestracji
- Ścieżka: `/auth`
- Cel: Umożliwić nowym użytkownikom rejestrację oraz istniejącym logowanie.
- Kluczowe informacje: formularz email, hasło, walidacja (8+ znaków), link przełączania między widokami.
- Komponenty: `AuthForm`, `InputField`, `Button`, inline validation, Toast na błędy.
- UX/A11y/Sec: ARIA role=form, etykiety, keyboard navigation, zabezpieczenie routing guardem placeholder.

### 2.2 Widok Generowania fiszek (Generate)
- Ścieżka: `/generate`
- Cel: Pozwala wkleić tekst źródłowy (1000–10000 znaków), uruchomić generację AI, edytować i zaakceptować propozycje.
- Kluczowe informacje: textarea źródła, walidacja długości, ProgressBar, lista propozycji.
- Komponenty: `GenerationForm`, `ProgressBar`, `FlashcardProposalList`, `FlashcardCard` (editable), `Button` Akceptuj/Usuń/Zapisz.
- UX/A11y/Sec: ARIA-live dla progresu, descriptive labels, offline/error Toast, debounce.

### 2.3 Widok Moje fiszki (My Flashcards)
- Ścieżka: `/flashcards`
- Cel: Przegląd, filtrowanie i zarządzanie zapisanymi fiszkami.
- Kluczowe informacje: tabela z paginacją, filtry status/źródło, search, inline edit/delete.
- Komponenty: `FlashcardsTable`, `DataTable`, `FilterPanel`, `SearchInput`, `InlineEditCell`, `Pagination`, Toast.
- UX/A11y/Sec: ARIA-grid dla tabeli, keyboard focus, paginacja zgodna z RLS przyszła ochrona.

### 2.4 Widok Dodawania ręcznego (Add Manual)
- Ścieżka: `/flashcards/new`
- Cel: Dodanie pojedynczej fiszki ręcznie.
- Kluczowe informacje: front (≤200), back (≤500), walidacja, przycisk Dodaj.
- Komponenty: `ManualFlashcardForm`, `InputField`, `TextArea`, `Button`, Toast.
- UX/A11y/Sec: ARIA-required, inline validation, feedback.

### 2.5 Widok Sesji powtórek (Study Session)
- Ścieżka: `/study`
- Cel: Prowadzenie sesji spaced repetition.
- Kluczowe informacje: pojedyncza fiszka (flip-card), przyciski ocen (łatwe/trudne/ponów), wskaźnik postępu.
- Komponenty: `StudyCard`, `FlipCard`, `RatingButtons`, `SessionProgress`, Toast/error.
- UX/A11y/Sec: ARIA-live dla pytania/odpowiedzi, keyboard controls, obsługa timeouts.

## 3. Mapa podróży użytkownika

1. Nowy/istniejący → `/auth` → rejestracja/logowanie → placeholder AuthContext → redirect `/generate`
2. `/generate`: wklej tekst → walidacja → POST `/api/generations` → ProgressBar → edycja listy propozycji (`FlashcardProposalList`) → POST `/api/flashcards/batch` → sukces Toast → reset formy.
3. `/flashcards`: GET `/api/flashcards` → wyświetl tabela → filtrowanie/status/source wyszukiwanie → inline edit/PATCH `/api/flashcards/:id` lub DELETE.
4. `/flashcards/new`: GET form → POST `/api/flashcards` → Toast → redirect na `/flashcards`.
5. `/study`: GET due cards → sekwencja flip-card → PATCH SR params → koniec sesji.

## 4. Układ i struktura nawigacji

- `Topbar`: linki do: Generuj, Moje fiszki, Sesja, Auth (Login/Logout). Na mobile burger menu otwiera Drawer z tymi linkami.
- Routing oparty o Astro/React Router + ochrona placeholder AuthContext.

## 5. Kluczowe komponenty

- `Topbar` / `MobileMenu`
- `AuthForm` (login/register)
- `GenerationForm`, `ProgressBar`
- `FlashcardProposalList` + `FlashcardCard`
- `FlashcardsTable`, `FilterPanel`, `Pagination`, `InlineEditCell`
- `ManualFlashcardForm`
- `StudyCard`, `FlipCard`, `RatingButtons`, `SessionProgress`
- `ToastProvider` / `useToast`
- `AuthContext`, `UIContext`
- React Query hooks: `useGenerations`, `useFlashcards`, `useManualFlashcard`, `useStudySession`
- Design System tokens: kolory, typografia, spacing.
