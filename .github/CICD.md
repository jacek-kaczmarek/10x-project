# CI/CD Setup

## Przegląd

Projekt wykorzystuje GitHub Actions do automatyzacji testów i buildów produkcyjnych. Pipeline CI/CD wykonuje:

1. **Lintowanie** - sprawdzenie jakości kodu
2. **Testy jednostkowe** - uruchomienie testów Vitest
3. **Build produkcyjny** - kompilacja aplikacji Astro
4. **Testy E2E** - uruchomienie testów Playwright

## Konfiguracja

### Instalacja lokalnych zależności

Po dodaniu niezbędnych zależności testowych do projektu, upewnij się że są zainstalowane:

```bash
npm install
```

**Dodane zależności testowe:**
- `vitest` - framework testowy (kompatybilny z Jest API)
- `@vitest/ui` - interfejs UI dla Vitest
- `@vitest/coverage-v8` - wsparcie dla raportów pokrycia kodu
- `@testing-library/react` - narzędzia do testowania komponentów React
- `@testing-library/jest-dom` - custom matchery dla DOM
- `jsdom` - środowisko DOM dla testów
- `msw` - Mock Service Worker (już był w projekcie)

**Uwaga:** Vitest jest kompatybilny z większością API Jest, ale niektóre matchery (np. `toHaveBeenCalledBefore`) nie są obsługiwane. Używaj standardowych matcherów Vitest.

### Uruchamianie Workflow

Pipeline jest uruchamiany automatycznie gdy:
- Kod jest pushowany do brancha `master`
- Workflow jest uruchamiany manualnie przez `workflow_dispatch`

### Wymagane Secrets w GitHub

Aby testy E2E mogły działać w CI, musisz skonfigurować następujące secrets w repozytorium GitHub:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Opis | Przykład |
|------------|------|----------|
| `SUPABASE_URL` | URL projektu Supabase | `https://xxxxx.supabase.co` |
| `SUPABASE_PUBLIC_KEY` | Publiczny anon key Supabase | `eyJhbGciOiJIUzI1NiIs...` |
| `OPENROUTER_API_KEY` | Klucz API OpenRouter | `sk-or-v1-...` |
| `E2E_USERNAME_ID` | UUID użytkownika testowego | `123e4567-e89b-12d3-a456-426614174000` |
| `E2E_USERNAME` | Email użytkownika testowego | `playwright@test.xyz` |
| `E2E_PASSWORD` | Hasło użytkownika testowego | `SecureTestPassword123!` |

### Jak uzyskać E2E_USERNAME_ID?

1. Zaloguj się do Supabase Dashboard
2. Przejdź do: **Authentication → Users**
3. Znajdź lub utwórz użytkownika testowego
4. Skopiuj jego UUID

Alternatywnie, użyj SQL Query w Supabase SQL Editor:

```sql
SELECT id FROM auth.users WHERE email = 'playwright@test.xyz';
```

## Struktura Workflow

```yaml
1. Checkout code
   └─> Pobranie kodu z repozytorium

2. Setup Node.js
   └─> Instalacja Node.js 22.14.0 (z .nvmrc)
   └─> Cache dependencies dla szybszych buildów

3. Install dependencies
   └─> npm ci (clean install)

4. Run linter
   └─> npm run lint

5. Run unit tests
   └─> npm test -- --run

6. Build production
   └─> npm run build

7. Run E2E tests
   └─> npm run test:e2e
   └─> Wymaga wszystkich secrets z GitHub

8. Upload artifacts (on failure)
   └─> playwright-report/
   └─> test-results/
```

## Artifacts

W przypadku niepowodzenia testów, workflow automatycznie uploaduje:
- **playwright-report/** - raport HTML z testów Playwright
- **test-results/** - szczegółowe wyniki testów

Artifacts są dostępne przez 7 dni w sekcji Actions workflow run.

## Ręczne uruchomienie

1. Przejdź do **Actions** w repozytorium GitHub
2. Wybierz workflow **CI/CD Pipeline**
3. Kliknij **Run workflow**
4. Wybierz branch i kliknij **Run workflow**

## Rozwiązywanie problemów

### Testy E2E nie przechodzą

- Sprawdź czy wszystkie secrets są poprawnie skonfigurowane
- Zweryfikuj czy `E2E_USERNAME_ID` odpowiada istniejącemu użytkownikowi w Supabase
- Sprawdź czy użytkownik testowy ma prawidłowe hasło
- Zobacz szczegóły w artifacts po nieudanym workflow

### Build nie przechodzi

- Sprawdź logi builda w sekcji Actions
- Upewnij się że wszystkie zależności są poprawnie zdefiniowane w `package.json`
- Sprawdź czy nie ma błędów TypeScript (`npm run build` lokalnie)

### Linter nie przechodzi

- Uruchom lokalnie `npm run lint:fix` aby automatycznie naprawić problemy
- Sprawdź logi w Actions dla szczegółów

