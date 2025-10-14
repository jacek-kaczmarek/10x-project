# Specyfikacja Techniczna Modułu Autentykacji dla 10x Cards

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1 Nowe strony Astro (SSR)

#### Strony autoryzacji:
- **`/login`** - logowanie użytkownika (przekierowanie zalogowanych na `/generate`)
- **`/register`** - rejestracja nowego użytkownika (przekierowanie zalogowanych na `/generate`)
- **`/forgot-password`** - inicjowanie procesu resetowania hasła
- **`/reset-password`** - ustawienie nowego hasła (token z URL)

#### Struktura stron:
```astro
<Layout>                    <!-- Globalne meta, CSS -->
  <AuthLayout>              <!-- Wizualne opakowanie auth (karta, tło) -->
    <AuthForm client:load /> <!-- React: LoginForm, RegisterForm, etc. -->
  </AuthLayout>
</Layout>
```

### 1.2 Modyfikacje istniejących stron

- **`/index.astro`** - sprawdzenie sesji, dla niezalogowanych: przyciski login/register
- **`/generate.astro`** - ochrona routingu (redirect na `/login` jeśli brak sesji)
- **Przyszłe chronione strony** - pattern: `if (!Astro.locals.user) return Astro.redirect('/login')`

### 1.3 Nowe komponenty

#### Layout:
- **`AuthLayout.astro`** - wspólny wrapper dla stron auth (bez Topbar)
- **`Topbar.astro`** - nawigacja z wariantami dla zalogowanych/niezalogowanych

#### Komponenty React:
- **`LoginForm.tsx`** - formularz logowania
- **`RegisterForm.tsx`** - formularz rejestracji  
- **`ForgotPasswordForm.tsx`** - formularz z polem email
- **`ResetPasswordForm.tsx`** - formularz nowego hasła
- **`LogoutButton.tsx`** - przycisk wylogowania (w Topbar)

### 1.4 Walidacja i komunikaty

#### Reguły walidacji (Zod):
- Email: format email, wymagane
- Password: min. 8 znaków, wymagane
- Token: UUID format

#### Komunikaty błędów:
- **400** - błędy walidacji ("Email jest wymagany", "Hasło min. 8 znaków")
- **401** - błędy auth ("Niepoprawny email lub hasło", "Konto niezweryfikowane")
- **409** - email już istnieje
- **500** - błędy serwera

### 1.5 Scenariusze użytkownika

1. **Rejestracja** → wysłanie emaila weryfikacyjnego → kliknięcie linku → login
2. **Logowanie** → walidacja → przekierowanie na `/generate`
3. **Reset hasła** → email z linkiem → `/reset-password?token=xxx` → nowe hasło → login
4. **Wylogowanie** → usunięcie sesji → przekierowanie na `/login`
5. **Ochrona routingu** → próba dostępu bez sesji → redirect na `/login`

---

## 2. LOGIKA BACKENDOWA

### 2.1 Endpointy API

| Endpoint | Metoda | Cel |
|----------|--------|-----|
| `/api/auth/register` | POST | Rejestracja (email, password) |
| `/api/auth/login` | POST | Logowanie (email, password) |
| `/api/auth/logout` | POST | Wylogowanie |
| `/api/auth/forgot-password` | POST | Inicjowanie resetu hasła |
| `/api/auth/reset-password` | POST | Resetowanie hasła (token, newPassword) |

### 2.2 Modele danych

#### Request DTOs:
```typescript
RegisterRequestDTO { email, password }
LoginRequestDTO { email, password }
ForgotPasswordRequestDTO { email }
ResetPasswordRequestDTO { token, newPassword }
```

#### Response DTOs:
```typescript
AuthUserDTO { id, email }
LoginResponseDTO { message, user, session }
RegisterResponseDTO { message, user }
MessageResponseDTO { message }
```

### 2.3 Walidacja (Zod)

**Plik:** `src/lib/validators/auth.ts`
- `loginSchema`, `registerSchema`, `forgotPasswordSchema`, `resetPasswordSchema`

### 2.4 Obsługa błędów

**Helper:** `src/lib/utils/auth-errors.ts`
- Mapowanie błędów Supabase na user-friendly komunikaty
- Standaryzacja response (ErrorResponseDTO)

### 2.5 Middleware SSR

**Plik:** `src/middleware/index.ts`

**Kluczowe zmiany:**
```typescript
import { createServerClient } from '@supabase/ssr'

// Utworzenie Supabase server client z obsługą cookies
const supabase = createServerClient<Database>(...)

// Pobranie sesji
const { data: { session } } = await supabase.auth.getSession()

// Dodanie do kontekstu
context.locals.supabase = supabase
context.locals.user = session?.user || null
```

### 2.6 Rozszerzenie typów

**Plik:** `src/env.d.ts`
```typescript
interface Locals {
  supabase: SupabaseClient<Database>
  user: User | null  // NOWE
}

interface ImportMetaEnv {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string  // NOWE (zamiast SUPABASE_KEY)
  OPENROUTER_API_KEY: string
}
```

---

## 3. SYSTEM AUTENTYKACJI

### 3.1 Supabase Auth - Architektura

**Supabase zapewnia:**
- Zarządzanie użytkownikami (`auth.users`)
- Haszowanie haseł (bcrypt)
- Tokeny JWT (access + refresh)
- Wysyłanie emaili (weryfikacja, reset)
- Automatyczne odświeżanie tokenów

**Integracja z Astro:**
- Middleware: `createServerClient` dla SSR
- Cookies: zarządzane przez `@supabase/ssr`
- Context: `Astro.locals.user`

### 3.2 Konfiguracja

**Zmienne środowiskowe:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

**Supabase Dashboard:**
- Email Templates (weryfikacja, reset hasła)
- Redirect URLs (`https://yourdomain.com/reset-password`)
- Email Provider (SMTP lub domyślny)

### 3.3 Metody Auth (kluczowe)

```typescript
// Rejestracja
supabase.auth.signUp({ email, password, options: { emailRedirectTo } })

// Logowanie
supabase.auth.signInWithPassword({ email, password })

// Wylogowanie
supabase.auth.signOut()

// Reset hasła - inicjalizacja
supabase.auth.resetPasswordForEmail(email, { redirectTo })

// Reset hasła - aktualizacja
supabase.auth.updateUser({ password: newPassword })

// Sesja
supabase.auth.getSession()
```

### 3.4 Zarządzanie sesjami

**Ciasteczka (automatyczne przez `@supabase/ssr`):**
- `sb-access-token` - JWT (httpOnly, secure, sameSite)
- `sb-refresh-token` - refresh token (httpOnly, secure, sameSite)

**Refresh token rotation:**
- Automatyczne odświeżanie przez `@supabase/ssr`
- Token rotation (invalidacja starego refresh token)

### 3.5 Aktualizacja serwisów

#### Usunąć:
```typescript
// src/db/supabase.client.ts
export const DEFAULT_USER_ID = "..." // USUNĄĆ
```

#### Aktualizacja serwisów (przyjmowanie user_id):
- `GenerationService.createGeneration(sourceText, userId)`
- `FlashcardService.saveProposals(command, userId)`

#### Aktualizacja endpointów API:
```typescript
// Sprawdzenie auth
const user = context.locals.user
if (!user) return 401 UNAUTHORIZED

// Przekazanie user.id do serwisu
generationService.createGeneration(source_text, user.id)
flashcardService.saveProposals(command, user.id)
```

### 3.6 Row Level Security (RLS)

**Istniejące polityki RLS działają automatycznie:**
- `auth.uid() = user_id` - izolacja danych użytkowników
- Middleware ustawia sesję → RLS wykrywa użytkownika przez JWT
- Nie trzeba zmieniać queries!

---

## 4. BEZPIECZEŃSTWO

**Implemented Security Measures:**
1. Haszowanie haseł (bcrypt przez Supabase)
2. JWT tokeny podpisane kluczem Supabase
3. HttpOnly cookies (ochrona przed XSS)
4. SameSite cookies (ochrona przed CSRF)
5. Row Level Security (izolacja danych)
6. Token rotation (invalidacja refresh tokens)
7. Email weryfikacja
8. Rate limiting (Supabase Auth)
9. HTTPS only (production)
10. Walidacja input (Zod po stronie serwera)

---

## 5. PLAN WDROŻENIA

### Faza 1: Infrastruktura
1. Instalacja `@supabase/ssr`
2. Aktualizacja middleware (`createServerClient`)
3. Rozszerzenie typów (`env.d.ts`, `types.ts`)
4. Walidatory auth (`src/lib/validators/auth.ts`)

### Faza 2: Backend
1. Endpointy auth (5 endpointów)
2. Helper błędów (`src/lib/utils/auth-errors.ts`)
3. Aktualizacja serwisów (user_id jako parametr)
4. Aktualizacja istniejących endpointów (sprawdzanie user)

### Faza 3: Frontend
1. Komponenty React (formularze auth)
2. Strony Astro (login, register, forgot-password, reset-password)
3. AuthLayout + Topbar
4. Aktualizacja Layout i istniejących stron

### Faza 4: Testowanie
1. Testy endpointów auth
2. Testy RLS policies
3. Testy flow użytkownika (E2E)
4. Testy bezpieczeństwa

### Faza 5: Deployment
1. Konfiguracja Supabase (templates, URLs)
2. Zmienne środowiskowe
3. Deploy
4. Weryfikacja w production

---

## 6. KLUCZOWE KONTRAKTY

### Middleware → Strony Astro
```typescript
context.locals.supabase: SupabaseClient<Database>
context.locals.user: User | null
```

### Strony Astro → React
```astro
<AuthForm client:load user={user} />
```

### React → API
```typescript
POST /api/auth/login
Body: { email, password }
Response: { message, user, session } | { error }
```

### API → Serwisy
```typescript
service.method(data, user.id)
```

---

## 7. ZGODNOŚĆ Z ISTNIEJĄCĄ APLIKACJĄ

**Zachowane funkcjonalności:**
- ✅ Generowanie fiszek (+ user_id)
- ✅ Zapisywanie propozycji (+ user_id)
- ✅ RLS polityki (działają automatycznie)
- ✅ Routing (nowe strony nie kolidują)
- ✅ API pattern (ten sam wzorzec)

**Nienaruszalne wymagania z PRD:**
- ✅ US-004 do US-014 pozostają bez zmian
- ✅ Generowanie 10 propozycji
- ✅ Edycja po stronie klienta
- ✅ Walidacja 1000-10000 znaków
- ✅ Źródło fiszek (ai, ai-edited, manual)

---

**Szczegółowe przykłady implementacji:** Zobacz `.ai/auth-spec-ideas.md`
