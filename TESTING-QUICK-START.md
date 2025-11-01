# 🚀 Testing Quick Start Guide

## Instalacja przeglądarek (tylko raz)

```bash
npx playwright install chromium
```

## Uruchomienie testów

### Testy jednostkowe (Vitest)

```bash
# Tryb interaktywny z UI
npm run test:ui

# Tryb watch (dla rozwoju)
npm run test:watch

# Jednorazowe uruchomienie
npm test

# Z pokryciem kodu
npm run test:coverage
```

### Testy E2E (Playwright)

```bash
# Tryb interaktywny z UI
npm run test:e2e:ui

# Jednorazowe uruchomienie
npm run test:e2e

# Generator testów
npm run test:e2e:codegen

# Raport z testów
npm run test:e2e:report
```

## Struktura plików testowych

```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       └── button.test.tsx          ← Test komponentu
└── test/
    ├── setup.ts                     ← Konfiguracja Vitest
    ├── mocks/
    │   ├── handlers.ts              ← Definicje mocków API
    │   ├── server.ts                ← MSW server (Node)
    │   └── browser.ts               ← MSW worker (przeglądarka)
    └── utils/
        └── test-utils.tsx           ← Pomocnicze funkcje

e2e/
├── auth.setup.ts                    ← Setup autoryzacji (raz dla całej sesji)
├── example.spec.ts                  ← Przykładowy test E2E
└── pages/
    ├── base.page.ts                 ← Bazowy Page Object
    └── login.page.ts                ← Page Object dla loginu
```

## Przykłady

### Test jednostkowy komponentu

```typescript
// src/components/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Mock API

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/users", () => {
    return HttpResponse.json([{ id: 1, name: "John" }]);
  }),
];
```

### Test E2E z Page Object

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from "@playwright/test";
import { GeneratePage } from "./pages/generate.page";

test("user can generate flashcards", async ({ page }) => {
  // Sesja jest automatycznie zalogowana dzięki auth.setup.ts
  const generatePage = new GeneratePage(page);
  await generatePage.goto();
  await generatePage.generateFlashcards("Sample text...");
  await expect(generatePage.proposalsList).toBeVisible();
});
```

## Narzędzia developerskie

### Vitest UI

- Otwórz `http://localhost:51204/__vitest__/` (automatycznie)
- Interaktywne debugowanie testów
- Filtrowanie i ponowne uruchamianie testów

### Playwright UI

- Wizualna nawigacja po testach
- Krok po kroku debugowanie
- Podgląd selektorów

### Playwright Codegen

- Automatyczne generowanie testów
- Nagrywanie akcji użytkownika
- Eksport do kodu

## Dobre praktyki

✅ Pisz testy PRZED lub RAZEM z kodem (TDD)  
✅ Używaj semantycznych selektorów (getByRole, getByLabel)  
✅ Izoluj testy - każdy test powinien być niezależny  
✅ Mockuj API zamiast prawdziwych zapytań  
✅ Testuj zachowanie, nie implementację  
✅ Używaj Page Object Model dla testów E2E

## Wsparcie

📖 Pełna dokumentacja: `README.test.md`  
📝 Szczegóły setup: `11-test-plan/12-prepare-env.md`

---

**Środowisko gotowe do testowania! 🎯**
