# Wzorzec Ochrony Stron - Protected Routes

## 🎯 Cel

Automatyczna ochrona stron przed dostępem niezalogowanych użytkowników przy użyciu helper function + dedykowanego layoutu.

## 📐 Architektura rozwiązania

### Dwuetapowa ochrona:

1. **requireAuth()** - helper function wykonywany PRZED renderowaniem (w frontmatter)
2. **ProtectedLayout** - layout UI dla chronionych stron (z Topbar)

### Hierarchia layoutów:

```
Layout.astro (base)
├── AuthLayout.astro (dla stron auth: login, register, etc.)
└── ProtectedLayout.astro (dla chronionych stron: generate, etc.)
```

## 🔒 requireAuth() Helper Function

**Lokalizacja:** `src/lib/utils/auth.ts`

**Funkcjonalność:**
1. Sprawdza `Astro.locals.user` (ustawiane przez middleware)
2. Jeśli brak user → **redirect** na `/login`
3. Jeśli user istnieje → **zwraca** user object

**Dlaczego helper zamiast layoutu?**
- Redirect musi być wykonany **przed rozpoczęciem renderowania**
- Layout renderuje się za późno → błąd "Response already sent"
- Helper w frontmatter działa **przed** renderowaniem ✅

**Zgodnie ze specyfikacją:**
- Wszystkie chronione strony przekierowują na `/login`
- Po wylogowaniu użytkownik trafia na `/login`

**Kod:**
```typescript
// src/lib/utils/auth.ts
import type { AstroGlobal } from "astro";

export function requireAuth(Astro: AstroGlobal): User | Response {
  const user = Astro.locals.user;

  if (!user) {
    return Astro.redirect("/login");
  }

  return user;
}
```

## 🎨 ProtectedLayout.astro

**Lokalizacja:** `src/layouts/ProtectedLayout.astro`

**Funkcjonalność:**
- Wrapper UI dla chronionych stron
- Wyświetla Topbar z user info
- Zapewnia responsive container

**NIE sprawdza autentykacji** - to robi `requireAuth()`

**Kod:**
```astro
---
import type { User } from "@supabase/supabase-js";
import Layout from "./Layout.astro";
import Topbar from "../components/Topbar.astro";

interface Props {
  title?: string;
  user: User;
}

const { title = "10x Cards", user } = Astro.props;
---

<Layout title={title}>
  <Topbar user={user} />
  <main class="container mx-auto px-4 py-8">
    <slot />
  </main>
</Layout>
```

## 📝 Jak używać

### Dla NOWEJ chronionej strony:

```astro
---
// src/pages/my-protected-page.astro
import { requireAuth } from "../lib/utils/auth";
import ProtectedLayout from "../layouts/ProtectedLayout.astro";
import MyComponent from "../components/MyComponent";

// KROK 1: Sprawdź autentykację PRZED renderowaniem
const userOrRedirect = requireAuth(Astro);
if (userOrRedirect instanceof Response) return userOrRedirect;
const user = userOrRedirect;
// Jeśli user nie jest zalogowany, nastąpił redirect (return Response)
---

<!-- KROK 2: Renderuj z ProtectedLayout, przekazując user -->
<ProtectedLayout title="Moja chroniona strona" user={user}>
  <MyComponent client:load />
</ProtectedLayout>
```

**Dwie linijki kodu** i strona jest chroniona!

### Dla ISTNIEJĄCEJ strony (migracja):

**Przed:**
```astro
---
import Layout from "../layouts/Layout.astro";
import GenerateView from "../components/Generate/GenerateView";
---

<Layout title="Generate">
  <GenerateView client:load />
</Layout>
```

**Po:**
```astro
---
import { requireAuth } from "../lib/utils/auth";
import ProtectedLayout from "../layouts/ProtectedLayout.astro";
import GenerateView from "../components/Generate/GenerateView";

const userOrRedirect = requireAuth(Astro);
if (userOrRedirect instanceof Response) return userOrRedirect;
const user = userOrRedirect;
---

<ProtectedLayout title="Generate" user={user}>
  <GenerateView client:load />
</ProtectedLayout>
```

## 🏠 Strona główna (index.astro)

**Funkcjonalność:**
- Zalogowany user → redirect na `/generate`
- Niezalogowany user → landing page z CTA (Login/Register)

**Kod:**
```astro
---
const user = Astro.locals.user;

if (user) {
  return Astro.redirect("/generate");
}
---

<Layout>
  <Topbar user={user} />
  <!-- Landing page content with Login/Register buttons -->
</Layout>
```

## 🔄 Flow użytkownika

### Niezalogowany użytkownik:
```
1. User próbuje wejść na /generate
   ↓
2. requireAuth(Astro) sprawdza: Astro.locals.user === null
   ↓
3. Redirect: /login (PRZED renderowaniem!)
   ↓
4. User loguje się → redirect na /generate
```

### Zalogowany użytkownik:
```
1. User wchodzi na /generate
   ↓
2. requireAuth(Astro) sprawdza: Astro.locals.user !== null
   ↓
3. requireAuth() zwraca user object
   ↓
4. Renderowanie strony z ProtectedLayout + Topbar
```

### Zalogowany na index:
```
1. User wchodzi na /
   ↓
2. index.astro sprawdza: Astro.locals.user !== null
   ↓
3. Redirect: /generate
```

## 📋 Zaimplementowane strony

### Chronione (używają ProtectedLayout):
- ✅ `/generate` - generowanie fiszek

### Publiczne (AuthLayout):
- ✅ `/login` - logowanie (redirect zalogowanych na /generate)
- ✅ `/register` - rejestracja (redirect zalogowanych na /generate)
- ✅ `/forgot-password` - reset hasła
- ✅ `/reset-password` - nowe hasło

### Strona główna:
- ✅ `/` - landing page (redirect zalogowanych na /generate)

## 🚀 Przyszłe strony

Aby dodać nową chronioną stronę:

```astro
---
// src/pages/flashcards.astro
import { requireAuth } from "../lib/utils/auth";
import ProtectedLayout from "../layouts/ProtectedLayout.astro";
import FlashcardsList from "../components/FlashcardsList";

const userOrRedirect = requireAuth(Astro);
if (userOrRedirect instanceof Response) return userOrRedirect;
const user = userOrRedirect;
---

<ProtectedLayout title="Moje fiszki" user={user}>
  <FlashcardsList client:load />
</ProtectedLayout>
```

Aby dodać nową publiczną stronę:

```astro
---
// src/pages/about.astro
import Layout from "../layouts/Layout.astro";
import Topbar from "../components/Topbar.astro";

const user = Astro.locals.user;
---

<Layout title="O nas">
  <Topbar user={user} />
  <!-- Public content -->
</Layout>
```

## ✨ Zalety tego podejścia

1. **Działa poprawnie** - redirect wykonywany PRZED renderowaniem (brak błędu "Response already sent")
2. **DRY (Don't Repeat Yourself)** - logika sprawdzania auth w `requireAuth()` helper
3. **Jednolity UX** - wszystkie chronione strony mają Topbar przez ProtectedLayout
4. **Łatwe w użyciu** - dwie linijki kodu: `const user = requireAuth(Astro)` + przekazanie do layoutu
5. **Type-safe** - TypeScript gwarantuje że user istnieje po `requireAuth()`
6. **Middleware integration** - automatyczne działanie z SSR auth
7. **Separation of concerns** - auth logic (requireAuth) oddzielona od UI (ProtectedLayout)

## 🔧 Opcjonalne ulepszenia (future)

### 1. Zapamiętywanie strony przed logowaniem:
```typescript
// Możliwe rozszerzenie w przyszłości
// Obecnie wszystkie przekierowania idą na /login bez parametrów (zgodnie ze spec)
```

### 2. Role-based access:
```astro
---
// ProtectedLayout.astro
const user = Astro.locals.user;
const requiredRole = Astro.props.requiredRole;

if (!user) return Astro.redirect('/login');
if (requiredRole && user.role !== requiredRole) {
  return Astro.redirect('/forbidden');
}
---
```

### 3. Permission checks:
```astro
<ProtectedLayout requiredPermissions={['flashcards:create']}>
```

## 📊 Status

- ✅ requireAuth() helper utworzony
- ✅ ProtectedLayout utworzony (UI wrapper, BEZ auth logic)
- ✅ /generate używa requireAuth() + ProtectedLayout
- ✅ /index przekierowuje zalogowanych
- ✅ /index pokazuje landing page dla niezalogowanych
- ✅ Topbar zintegrowany z ProtectedLayout
- ✅ Wzorzec działa poprawnie (brak błędu "Response already sent")
- ✅ Wzorzec gotowy do użycia dla nowych stron

## 🎓 Przykłady użycia

### Typowa chroniona strona:
```astro
---
import { requireAuth } from "../lib/utils/auth";
import ProtectedLayout from "../layouts/ProtectedLayout.astro";

const user = requireAuth(Astro);
---

<ProtectedLayout title="Page Title" user={user}>
  <Content />
</ProtectedLayout>
```

### Wylogowanie przekierowuje na /login:
```typescript
// LogoutButton.tsx
const handleLogout = async () => {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  if (response.ok) {
    window.location.href = "/login";
  }
};
```

### Strona publiczna z auth-aware UI:
```astro
const user = Astro.locals.user;
<Layout>
  <Topbar user={user} />
  {user ? <UserContent /> : <PublicContent />}
</Layout>
```

