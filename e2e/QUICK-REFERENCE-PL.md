# E2E Teardown - Szybka Instrukcja

## 🚀 Szybki Start

### 1. Utwórz plik `.env.test`

```env
SUPABASE_URL=https://gbbadiahjdaezmpfkgfp.supabase.co
SUPABASE_PUBLIC_KEY=twoj-klucz-publiczny
OPENROUTER_API_KEY=twoj-klucz-openrouter
E2E_USERNAME_ID=uuid-uzytkownika-testowego
E2E_USERNAME=playwright2@test.xyz
E2E_PASSWORD=twoje-haslo
BASE_URL=http://localhost:4321
```

### 2. Zweryfikuj konfigurację

```bash
npm run test:e2e:verify
```

### 3. Uruchom testy

```bash
npm run test:e2e
```

## 📋 Wymagane Zmienne

| Zmienna | Opis | Przykład |
|---------|------|----------|
| `SUPABASE_URL` | URL projektu Supabase | `https://xxx.supabase.co` |
| `SUPABASE_PUBLIC_KEY` | Klucz publiczny Supabase | `eyJhbGc...` |
| `E2E_USERNAME_ID` | UUID użytkownika testowego | `123e4567-e89b-...` |
| `E2E_USERNAME` | Email użytkownika testowego | `playwright2@test.xyz` |
| `E2E_PASSWORD` | Hasło użytkownika testowego | `SecurePass123!` |
| `OPENROUTER_API_KEY` | Klucz API OpenRouter | `sk-or-v1-...` |

## 🔍 Jak Uzyskać E2E_USERNAME_ID?

### Opcja 1: Z Panelu Supabase
1. Otwórz Supabase Dashboard
2. Przejdź do: Authentication → Users
3. Znajdź użytkownika `playwright2@test.xyz`
4. Skopiuj jego UUID

### Opcja 2: SQL Query
```sql
SELECT id FROM auth.users 
WHERE email = 'playwright2@test.xyz';
```

## 🛠️ Dostępne Komendy

```bash
# Weryfikacja konfiguracji
npm run test:e2e:verify

# Uruchomienie testów E2E
npm run test:e2e

# Tryb interaktywny (UI)
npm run test:e2e:ui

# Raport z testów
npm run test:e2e:report

# Generator testów
npm run test:e2e:codegen
```

## ✅ Spodziewany Output po Testach

```
🧹 Starting E2E test cleanup...
🔍 Cleaning up data for test user: xxx-xxx-xxx
✅ Deleted 10 flashcard(s)
✅ Deleted 2 generation(s)
✅ Deleted 0 error log(s)
✨ E2E test cleanup completed successfully
```

## ❌ Częste Problemy

### "SUPABASE_URL environment variable is missing"
→ Dodaj zmienną do `.env.test`

### "Error deleting flashcards"
→ Sprawdź polityki RLS w Supabase

### "Invalid UUID format"
→ Sprawdź format `E2E_USERNAME_ID` (powinien być UUID)

## 📚 Więcej Informacji

- Pełna dokumentacja: `e2e/README.md`
- Dokumentacja testów: `README.test.md`
- Szybki start: `TESTING-QUICK-START.md`

---

**Powodzenia z testowaniem! 🎯**

