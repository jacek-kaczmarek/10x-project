## 1. Wprowadzenie i cele testowania  
Celem testów jest zapewnienie stabilności, poprawności funkcjonalnej oraz wydajności aplikacji webowej zbudowanej w Astro/React z backendem Supabase i usługami AI Openrouter. Testy pozwolą:  
- Wykryć i zredukować błędy przed wdrożeniem.  
- Zabezpieczyć kluczowe procesy: logowanie/rejestracja, generowanie flashcardów, integrację z AI.  
- Zapewnić wysoką jakość UX i wydajność.

## 2. Zakres testów  
Obejmuje następujące obszary:  
- Frontend (React + Astro + Shadcn/UI + Tailwind)  
- API HTTP (Astro Pages /src/pages/api/)  
- Logika biznesowa w `src/lib/services/` i `src/lib/validators/`  
- Integracja z Supabase (auth, baza danych)  
- Integracja z Openrouter AI (generowanie treści)  
- Strony i układy Astro (rendering, ochrona routingu)  

## 3. Typy testów do przeprowadzenia  
1. Testy jednostkowe  
   - Komponenty UI (`src/components/…`)  
   - Funkcje walidacyjne (`validators/`)  
   - Usługi (`flashcard.service.ts`, `generation.service.ts`)  
2. Testy integracyjne  
   - Wywołania API (`/api/auth/*`, `/api/generations`, `/api/flashcards`)  
   - End-to-end z użyciem testowej instancji Supabase  
   - Scenariusze wykorzystujące Openrouter (z mockiem)  
3. Testy end-to-end (E2E)  
   - Pełny przebieg użytkownika: rejestracja, logowanie, generowanie, przeglądanie flashcardów  
   - Przepływy chronionych routów (`ProtectedLayout.astro`)  
4. Testy UI (visual/regresyjne)  
   - Rendering kluczowych komponentów Shadcn/ui + Tailwind  
   - Responsywność  
5. Testy wydajnościowe i obciążeniowe  
   - Mierzony czas odpowiedzi API przy dużej liczbie zapytań  
   - Renderowanie stron generowanych przez Astro  
6. Testy bezpieczeństwa (podstawowe)  
   - Próby dostępu do chronionych zasobów bez autoryzacji  
   - Sprawdzenie poprawności obsługi błędów auth  

## 4. Scenariusze testowe dla kluczowych funkcjonalności  

### 4.1. Rejestracja i logowanie  
- Walidacja formularza (pusty email, słabe hasło, niezgodność haseł)  
- Sukces rejestracji → email confirmation (jeśli wdrożone)  
- Logowanie poprawne vs. błędne (nieistniejące konto, złe hasło)  
- Reset hasła / Forgot password flow  

### 4.2. Ochrona routów i sesja  
- Próba wejścia na `/generate` jako anonim → przekierowanie na `/login`  
- Wejście po zalogowaniu → dostęp do generowania  

### 4.3. Generowanie flashcardów (Openrouter)  
- Poprawny request z parametrami → otrzymanie listy propozycji  
- Mock błędu zewnętrznego API → odpowiedni komunikat w UI  
- Obsługa timeoutu i retry  

### 4.4. CRUD flashcardów  
- Zapis nowego flashcard (`/api/flashcards`)  
- Pobieranie listy flashcardów  
- Edycja i usuwanie (jeżeli dostępne)  

### 4.5. Komponenty UI  
- `FlashcardItem`, `ProgressBar`, `GenerationForm` – renderowanie i interakcja  
- Komponenty Shadcn/ui – poprawne style i a11y  

### 4.6. Walidatory i usługi  
- `validators/*` – wartości graniczne, nieprawidłowe dane  
- `flashcard.service.ts` – poprawne mapowanie danych  

## 5. Środowisko testowe  
- Lokalne Astro serwery (dev/staging)  
- Testowa instancja Supabase (oddzielna baza z rollbackiem po każdym scenariuszu)  
- Mocki Openrouter w środowisku CI  
- Node.js 18+, TS 5.x  

## 6. Narzędzia do testowania  
- Vitest dla testów jednostkowych i integracyjnych  
- React Testing Library dla komponentów UI  
- Supertest dla wywołań API  
- Playwright dla E2E  
- REST client + MSW (Mock Service Worker): do testowania i mockowania API
- ESLint + Tailwind-lint + axe-core dla a11y  
- Lighthouse / WebPageTest dla wydajności  

## 7. Harmonogram testów  
| Faza                  | Czas trwania | Zadania                                                    |
|-----------------------|--------------|------------------------------------------------------------|
| Przygotowanie         | 1 tydzień    | Konfiguracja środowiska, mocki, baza testowa               |
| Testy jednostkowe     | 1–2 tygodnie | Pokrycie logiki biznesowej i walidacji                     |
| Testy integracyjne    | 1 tydzień    | API, usługi, integracja z Supabase, mock Openrouter        |
| Testy E2E i UI        | 1–2 tygodnie | Scenariusze full-flow, a11y, responsywność                 |
| Testy wydajnościowe   | 1 tydzień    | Obciążeniowe API, rendering stron                         |
| Raport i poprawki     | 1 tydzień    | Analiza wyników, zgłaszanie i naprawa krytycznych błędów   |

## 8. Kryteria akceptacji testów  
- ≥ 90 % pokrycia krytycznych modułów (usługi, walidatory, API)  
- Brak błędów krytycznych/major w E2E  
- Prędkość odpowiedzi API poniżej 200 ms dla 95 % żądań  
- Brak regresji UI/a11y  

## 9. Role i odpowiedzialności  
- QA Engineer: pisanie i utrzymanie scenariuszy testowych, raportowanie  
- Developerzy: implementacja poprawek, utrzymanie testów jednostkowych  
- DevOps: konfiguracja CI/CD, środowisk testowych (Supabase, mocki)  
- Product Owner: priorytetyzacja krytycznych ścieżek testowych  

## 10. Procedury raportowania błędów  
- System zgłoszeń: GitHub Issues z etykietami `bug/critical`, `bug/major`, `bug/minor`  
- Każdy błąd: opis kroku reprodukcji, oczekiwane vs. rzeczywiste zachowanie, załączniki (zrzuty ekranu/logi)  
- Regularne spotkania QA–Dev co tydzień w celu omówienia statusu oraz krytycznych usterek  
