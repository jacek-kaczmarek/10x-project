# ✅ Checklist weryfikacji środowiska testowego

## Status instalacji

### ✅ Pakiety zainstalowane

- [x] vitest@3.2.4
- [x] @vitest/ui
- [x] @vitejs/plugin-react
- [x] @testing-library/react
- [x] @testing-library/jest-dom
- [x] @testing-library/user-event
- [x] jsdom
- [x] @playwright/test@1.56.0
- [x] msw

### ✅ Pliki konfiguracyjne

- [x] `vitest.config.ts` - Konfiguracja Vitest z jsdom
- [x] `playwright.config.ts` - Konfiguracja Playwright (tylko Chromium)
- [x] `.gitignore` - Zaktualizowany o pliki testowe

### ✅ Struktura katalogów

```
✅ src/test/
   ✅ setup.ts
   ✅ mocks/
      ✅ server.ts
      ✅ browser.ts
      ✅ handlers.ts
   ✅ utils/
      ✅ test-utils.tsx

✅ e2e/
   ✅ example.spec.ts
   ✅ fixtures/
      ✅ auth.ts
   ✅ pages/
      ✅ base.page.ts
      ✅ login.page.ts
```

### ✅ Skrypty NPM

- [x] `npm test` - Vitest
- [x] `npm run test:ui` - Vitest z UI
- [x] `npm run test:coverage` - Vitest z pokryciem
- [x] `npm run test:watch` - Vitest w trybie watch
- [x] `npm run test:e2e` - Playwright
- [x] `npm run test:e2e:ui` - Playwright z UI
- [x] `npm run test:e2e:codegen` - Generator testów Playwright
- [x] `npm run test:e2e:report` - Raport Playwright

### ✅ Dokumentacja

- [x] `README.test.md` - Pełna dokumentacja testowania
- [x] `TESTING-QUICK-START.md` - Szybki start
- [x] `11-test-plan/12-prepare-env.md` - Szczegóły instalacji
- [x] `11-test-plan/13-verification-checklist.md` - Ta checklist

## Weryfikacja zgodności z wytycznymi

### Vitest ✅

| Wytyczna | Status |
|----------|--------|
| Wykorzystanie `vi` do mocków | ✅ Skonfigurowane |
| Konfiguracja jsdom | ✅ `environment: 'jsdom'` |
| Setup file | ✅ `src/test/setup.ts` |
| Pokrycie kodu z v8 | ✅ `provider: 'v8'` |
| TypeScript support | ✅ Pełne wsparcie |
| Globalne matchery | ✅ @testing-library/jest-dom |

### Playwright ✅

| Wytyczna | Status |
|----------|--------|
| Tylko Chromium/Desktop Chrome | ✅ Skonfigurowane |
| Browser contexts | ✅ Domyślne |
| Page Object Model | ✅ Przykłady w e2e/pages/ |
| Semantyczne locatory | ✅ getByRole, getByLabel |
| Trace viewer | ✅ `trace: 'on-first-retry'` |
| Test hooks | ✅ beforeAll, afterEach |
| Równoległe wykonanie | ✅ `fullyParallel: true` |

### MSW ✅

| Wytyczna | Status |
|----------|--------|
| Server dla Node.js | ✅ src/test/mocks/server.ts |
| Worker dla przeglądarki | ✅ src/test/mocks/browser.ts |
| Handlers w dedykowanym pliku | ✅ src/test/mocks/handlers.ts |
| Integracja z setup | ✅ W src/test/setup.ts |

## Następne kroki dla developera

### 1. Zainstaluj przeglądarki Playwright (obowiązkowe)

```bash
npx playwright install chromium
```

### 2. Skonfiguruj zmienne środowiskowe (opcjonalne)

Utwórz plik `.env.test.local`:

```env
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=your-test-key
OPENROUTER_API_KEY=test-api-key
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
```

### 3. Uruchom przykładowe testy

```bash
# Vitest UI (będzie puste, ale działa)
npm run test:ui

# Playwright UI
npm run test:e2e:ui
```

### 4. Napisz pierwsze testy

#### Dla komponentu React:

```typescript
// src/components/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

#### Dla E2E:

```typescript
// e2e/homepage.spec.ts
import { test, expect } from '@playwright/test';

test('loads homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Cards Generator/);
});
```

## Rozwiązywanie problemów

### Problem: "Cannot find module"
**Rozwiązanie**: Sprawdź czy używasz `.js` w importach w plikach `.ts` (wymagane przez ESM)

### Problem: Playwright timeout
**Rozwiązanie**: 
```bash
# Upewnij się że dev server działa
npm run dev

# Lub zwiększ timeout w playwright.config.ts
```

### Problem: MSW handlers nie działają
**Rozwiązanie**: Sprawdź czy server jest zainicjalizowany w `setup.ts` i czy handlers są poprawnie zdefiniowane

## Podsumowanie

🎉 **Środowisko testowe jest w pełni skonfigurowane i gotowe do użycia!**

- ✅ Wszystkie pakiety zainstalowane
- ✅ Konfiguracja zgodna z wytycznymi
- ✅ Przykładowe pliki utworzone
- ✅ Dokumentacja kompletna
- ✅ Brak błędów lintera

**Następny krok**: Zainstaluj przeglądarki Playwright i zacznij pisać testy!

```bash
npx playwright install chromium
npm run test:ui
npm run test:e2e:ui
```

