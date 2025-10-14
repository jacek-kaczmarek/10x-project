# Szczegóły Implementacji Modułu Autentykacji - Pomysły i Wzorce

> Ten dokument zawiera szczegółowe przykłady implementacji, wzorce kodu i możliwe podejścia do realizacji modułu autentykacji. 
> Kluczowe założenia architektoniczne znajdują się w `.ai/auth-spec.md`.

## Spis treści
1. [Frontend - Komponenty React](#1-frontend---komponenty-react)
2. [Frontend - Strony Astro](#2-frontend---strony-astro)
3. [Backend - Endpointy API](#3-backend---endpointy-api)
4. [Backend - Middleware](#4-backend---middleware)
5. [Walidacja i błędy](#5-walidacja-i-błędy)
6. [Przepływy uwierzytelniania](#6-przepływy-uwierzytelniania)

---

## 1. Frontend - Komponenty React

### 1.1 LoginForm.tsx - Pełny przykład

```tsx
// src/components/Auth/LoginForm.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side validation
    if (!email || !validateEmail(email)) {
      setError('Niepoprawny format adresu email')
      return
    }

    if (!password || password.length < 8) {
      setError('Hasło musi mieć minimum 8 znaków')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Błąd logowania')
      }

      toast.success('Zalogowano pomyślnie')
      window.location.href = '/generate'
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił błąd'
      setError(errorMessage)
      toast.error('Błąd logowania', { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="twoj@email.com"
          disabled={isLoading}
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Hasło
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          required
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Logowanie...' : 'Zaloguj się'}
      </Button>

      <div className="text-center text-sm space-y-2">
        <a href="/forgot-password" className="text-blue-600 hover:underline block">
          Zapomniałeś hasła?
        </a>
        <p className="text-gray-600">
          Nie masz konta?{' '}
          <a href="/register" className="text-blue-600 hover:underline">
            Zarejestruj się
          </a>
        </p>
      </div>
    </form>
  )
}
```

### 1.2 RegisterForm.tsx - Wzorzec z potwierdzeniem hasła

```tsx
// src/components/Auth/RegisterForm.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  const validate = () => {
    const newErrors: typeof errors = {}

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Niepoprawny format adresu email'
    }

    if (!password || password.length < 8) {
      newErrors.password = 'Hasło musi mieć minimum 8 znaków'
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Hasła nie są zgodne'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Błąd rejestracji')
      }

      setRegistrationSuccess(true)
      toast.success('Konto utworzone!', {
        description: 'Sprawdź email w celu weryfikacji konta',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił błąd'
      toast.error('Błąd rejestracji', { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  if (registrationSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">
            Konto utworzone!
          </h3>
          <p className="text-sm text-green-700">
            Sprawdź swoją skrzynkę email i kliknij link weryfikacyjny.
          </p>
        </div>
        <a href="/login" className="text-blue-600 hover:underline inline-block">
          Przejdź do logowania
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="twoj@email.com"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Hasło
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 znaków"
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-red-600 mt-1">{errors.password}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
          Powtórz hasło
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Powtórz hasło"
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Tworzenie konta...' : 'Zarejestruj się'}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Masz już konto?{' '}
        <a href="/login" className="text-blue-600 hover:underline">
          Zaloguj się
        </a>
      </p>
    </form>
  )
}
```

### 1.3 ForgotPasswordForm.tsx - Prosty formularz

```tsx
// src/components/Auth/ForgotPasswordForm.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setEmailSent(true)
        toast.success('Email wysłany', {
          description: 'Jeśli konto istnieje, otrzymasz link do resetowania hasła',
        })
      }
    } catch (err) {
      toast.error('Błąd', { description: 'Spróbuj ponownie później' })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-700">
            Jeśli konto istnieje, wysłaliśmy link do resetowania hasła.
          </p>
        </div>
        <a href="/login" className="text-blue-600 hover:underline inline-block">
          Powrót do logowania
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Podaj adres email, a wyślemy Ci link do resetowania hasła.
      </p>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="twoj@email.com"
          disabled={isLoading}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
      </Button>

      <a href="/login" className="text-center block text-sm text-blue-600 hover:underline">
        Powrót do logowania
      </a>
    </form>
  )
}
```

### 1.4 ResetPasswordForm.tsx - Z tokenem z URL

```tsx
// src/components/Auth/ResetPasswordForm.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Props {
  token: string
}

export default function ResetPasswordForm({ token }: Props) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    newPassword?: string
    confirmPassword?: string
  }>({})

  const validate = () => {
    const newErrors: typeof errors = {}

    if (!newPassword || newPassword.length < 8) {
      newErrors.newPassword = 'Hasło musi mieć minimum 8 znaków'
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Hasła nie są zgodne'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Błąd resetowania hasła')
      }

      toast.success('Hasło zmienione!', {
        description: 'Możesz się teraz zalogować nowym hasłem',
      })

      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił błąd'
      toast.error('Błąd', { description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
          Nowe hasło
        </label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Min. 8 znaków"
          disabled={isLoading}
        />
        {errors.newPassword && (
          <p className="text-sm text-red-600 mt-1">{errors.newPassword}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
          Powtórz nowe hasło
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Powtórz hasło"
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Resetowanie...' : 'Zmień hasło'}
      </Button>
    </form>
  )
}
```

### 1.5 LogoutButton.tsx - Komponent wylogowania

```tsx
// src/components/Auth/LogoutButton.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  className?: string
}

export default function LogoutButton({ className }: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Wylogowano pomyślnie')
        window.location.href = '/login'
      } else {
        throw new Error('Błąd wylogowania')
      }
    } catch (err) {
      toast.error('Błąd wylogowania')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      size="sm"
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Wylogowywanie...' : 'Wyloguj'}
    </Button>
  )
}
```

---

## 2. Frontend - Strony Astro

### 2.1 AuthLayout.astro - Layout dla stron auth

```astro
---
// src/layouts/AuthLayout.astro
import '../styles/global.css'

interface Props {
  title?: string
}

const { title = 'Logowanie / Rejestracja' } = Astro.props
---

<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="generator" content={Astro.generator} />
    <title>{title} – 10x Cards</title>
  </head>
  <body class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4">
    <div class="w-full max-w-md">
      <div class="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 border border-white/20">
        <h1 class="text-2xl font-semibold text-white mb-6 text-center">{title}</h1>
        <div class="text-white">
          <slot />
        </div>
      </div>
    </div>
  </body>
</html>
```

### 2.2 login.astro - Strona logowania

```astro
---
// src/pages/login.astro
import Layout from '../layouts/Layout.astro'
import AuthLayout from '../layouts/AuthLayout.astro'
import LoginForm from '../components/Auth/LoginForm'

// Check if user is already logged in
const user = Astro.locals.user

if (user) {
  return Astro.redirect('/generate')
}
---

<Layout>
  <AuthLayout title="Logowanie">
    <LoginForm client:load />
  </AuthLayout>
</Layout>
```

### 2.3 register.astro - Strona rejestracji

```astro
---
// src/pages/register.astro
import Layout from '../layouts/Layout.astro'
import AuthLayout from '../layouts/AuthLayout.astro'
import RegisterForm from '../components/Auth/RegisterForm'

const user = Astro.locals.user

if (user) {
  return Astro.redirect('/generate')
}
---

<Layout>
  <AuthLayout title="Rejestracja">
    <RegisterForm client:load />
  </AuthLayout>
</Layout>
```

### 2.4 forgot-password.astro

```astro
---
// src/pages/forgot-password.astro
import Layout from '../layouts/Layout.astro'
import AuthLayout from '../layouts/AuthLayout.astro'
import ForgotPasswordForm from '../components/Auth/ForgotPasswordForm'
---

<Layout>
  <AuthLayout title="Resetowanie hasła">
    <ForgotPasswordForm client:load />
  </AuthLayout>
</Layout>
```

### 2.5 reset-password.astro - Z walidacją tokenu

```astro
---
// src/pages/reset-password.astro
import Layout from '../layouts/Layout.astro'
import AuthLayout from '../layouts/AuthLayout.astro'
import ResetPasswordForm from '../components/Auth/ResetPasswordForm'

// Get token from URL query params
const token = Astro.url.searchParams.get('token')

// Validate token presence
if (!token) {
  return Astro.redirect('/forgot-password')
}

// Basic UUID format validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
if (!uuidRegex.test(token)) {
  return Astro.redirect('/forgot-password')
}
---

<Layout>
  <AuthLayout title="Nowe hasło">
    <ResetPasswordForm client:load token={token} />
  </AuthLayout>
</Layout>
```

### 2.6 Topbar.astro - Nawigacja z wariantami

```astro
---
// src/components/Topbar.astro
import type { User } from '@supabase/supabase-js'
import LogoutButton from './Auth/LogoutButton'

interface Props {
  user: User | null
}

const { user } = Astro.props
---

<nav class="bg-white shadow-sm border-b">
  <div class="container mx-auto px-4 py-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-6">
        <a href="/" class="text-xl font-bold text-indigo-600">
          10x Cards
        </a>
        
        {user && (
          <div class="flex space-x-4">
            <a href="/generate" class="text-gray-700 hover:text-indigo-600">
              Generuj
            </a>
            <a href="/flashcards" class="text-gray-700 hover:text-indigo-600">
              Moje fiszki
            </a>
            <a href="/study" class="text-gray-700 hover:text-indigo-600">
              Sesja powtórek
            </a>
          </div>
        )}
      </div>

      <div class="flex items-center space-x-3">
        {user ? (
          <>
            <span class="text-sm text-gray-600">{user.email}</span>
            <LogoutButton client:load />
          </>
        ) : (
          <>
            <a href="/login" class="text-gray-700 hover:text-indigo-600">
              Zaloguj
            </a>
            <a href="/register" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Zarejestruj
            </a>
          </>
        )}
      </div>
    </div>
  </div>
</nav>
```

### 2.7 Layout.astro - Integracja Topbar (opcjonalna)

```astro
---
// src/layouts/Layout.astro
import '../styles/global.css'
import Topbar from '../components/Topbar.astro'

interface Props {
  title?: string
  showTopbar?: boolean
}

const { title = '10x Cards', showTopbar = true } = Astro.props

// Get user from middleware
const user = Astro.locals.user
---

<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>
  </head>
  <body>
    {showTopbar && <Topbar user={user} />}
    <slot />
  </body>
</html>
```

---

## 3. Backend - Endpointy API

### 3.1 POST /api/auth/register

```typescript
// src/pages/api/auth/register.ts
import type { APIRoute } from 'astro'
import { registerSchema } from '../../../lib/validators/auth'
import { handleSupabaseAuthError } from '../../../lib/utils/auth-errors'
import type { ErrorResponseDTO, RegisterResponseDTO } from '../../../types'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse request body
    const body = await request.json()

    // 2. Validate with Zod
    const validationResult = registerSchema.safeParse(body)
    
    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Nieprawidłowe dane wejściowe',
          details: validationResult.error.flatten(),
        },
      }
      
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { email, password } = validationResult.data

    // 3. Register user with Supabase
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/login`,
      },
    })

    // 4. Handle Supabase errors
    if (error) {
      return handleSupabaseAuthError(error)
    }

    // 5. Return success response
    const response: RegisterResponseDTO = {
      message: 'Konto utworzone. Sprawdź email w celu weryfikacji',
      user: {
        id: data.user!.id,
        email: data.user!.email!,
      },
    }

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in POST /api/auth/register:', error)
    
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Wystąpił błąd serwera',
      },
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
```

### 3.2 POST /api/auth/login

```typescript
// src/pages/api/auth/login.ts
import type { APIRoute } from 'astro'
import { loginSchema } from '../../../lib/validators/auth'
import { handleSupabaseAuthError } from '../../../lib/utils/auth-errors'
import type { ErrorResponseDTO, LoginResponseDTO } from '../../../types'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json()
    const validationResult = loginSchema.safeParse(body)

    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Nieprawidłowe dane wejściowe',
          details: validationResult.error.flatten(),
        },
      }

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { email, password } = validationResult.data

    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return handleSupabaseAuthError(error)
    }

    const response: LoginResponseDTO = {
      message: 'Zalogowano pomyślnie',
      user: {
        id: data.user.id,
        email: data.user.email!,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at!,
      },
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in POST /api/auth/login:', error)

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Wystąpił błąd serwera',
      },
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
```

### 3.3 POST /api/auth/logout

```typescript
// src/pages/api/auth/logout.ts
import type { APIRoute } from 'astro'
import type { ErrorResponseDTO, MessageResponseDTO } from '../../../types'

export const prerender = false

export const POST: APIRoute = async ({ locals }) => {
  try {
    const { error } = await locals.supabase.auth.signOut()

    if (error) {
      throw error
    }

    const response: MessageResponseDTO = {
      message: 'Wylogowano pomyślnie',
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in POST /api/auth/logout:', error)

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Błąd podczas wylogowania',
      },
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
```

### 3.4 POST /api/auth/forgot-password

```typescript
// src/pages/api/auth/forgot-password.ts
import type { APIRoute } from 'astro'
import { forgotPasswordSchema } from '../../../lib/validators/auth'
import type { ErrorResponseDTO, MessageResponseDTO } from '../../../types'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json()
    const validationResult = forgotPasswordSchema.safeParse(body)

    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Nieprawidłowy adres email',
          details: validationResult.error.flatten(),
        },
      }

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { email } = validationResult.data

    // Always return success (even if email doesn't exist) for security
    await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/reset-password`,
    })

    const response: MessageResponseDTO = {
      message: 'Jeśli konto istnieje, wysłaliśmy link resetujący hasło',
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in POST /api/auth/forgot-password:', error)

    // Still return success for security
    const response: MessageResponseDTO = {
      message: 'Jeśli konto istnieje, wysłaliśmy link resetujący hasło',
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
```

### 3.5 POST /api/auth/reset-password

```typescript
// src/pages/api/auth/reset-password.ts
import type { APIRoute } from 'astro'
import { resetPasswordSchema } from '../../../lib/validators/auth'
import { handleSupabaseAuthError } from '../../../lib/utils/auth-errors'
import type { ErrorResponseDTO, MessageResponseDTO } from '../../../types'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json()
    const validationResult = resetPasswordSchema.safeParse(body)

    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Nieprawidłowe dane',
          details: validationResult.error.flatten(),
        },
      }

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { newPassword } = validationResult.data

    const { error } = await locals.supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return handleSupabaseAuthError(error)
    }

    const response: MessageResponseDTO = {
      message: 'Hasło zostało zmienione',
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in POST /api/auth/reset-password:', error)

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Wystąpił błąd serwera',
      },
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
```

---

## 4. Backend - Middleware

### 4.1 Aktualizacja middleware z createServerClient

```typescript
// src/middleware/index.ts
import { defineMiddleware } from 'astro:middleware'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '../db/database.types'

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase server client with cookie handlers
  const supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) {
          return context.cookies.get(key)?.value
        },
        set(key, value, options) {
          context.cookies.set(key, value, {
            ...options,
            path: '/',
          })
        },
        remove(key, options) {
          context.cookies.delete(key, {
            ...options,
            path: '/',
          })
        },
      },
    }
  )

  // Attach Supabase client to context
  context.locals.supabase = supabase

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Attach user to context (null if not authenticated)
  context.locals.user = session?.user || null

  return next()
})
```

---

## 5. Walidacja i błędy

### 5.1 Schematy Zod

```typescript
// src/lib/validators/auth.ts
import { z } from 'zod'

export const emailSchema = z
  .string({ required_error: 'Email jest wymagany' })
  .email('Niepoprawny format adresu email')
  .toLowerCase()
  .trim()

export const passwordSchema = z
  .string({ required_error: 'Hasło jest wymagane' })
  .min(8, 'Hasło musi mieć minimum 8 znaków')

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().uuid('Nieprawidłowy token'),
  newPassword: passwordSchema,
})

export type RegisterSchemaType = z.infer<typeof registerSchema>
export type LoginSchemaType = z.infer<typeof loginSchema>
export type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>
```

### 5.2 Helper błędów Supabase

```typescript
// src/lib/utils/auth-errors.ts
import type { AuthError } from '@supabase/supabase-js'
import type { ErrorResponseDTO } from '../../types'

export function handleSupabaseAuthError(error: AuthError): Response {
  let status = 500
  let code = 'AUTH_ERROR'
  let message = 'Wystąpił błąd uwierzytelnienia'

  // Map Supabase error messages to user-friendly messages
  switch (error.message) {
    case 'Invalid login credentials':
      status = 401
      code = 'INVALID_CREDENTIALS'
      message = 'Niepoprawny email lub hasło'
      break
    case 'Email not confirmed':
      status = 401
      code = 'EMAIL_NOT_CONFIRMED'
      message = 'Konto nie zostało zweryfikowane. Sprawdź email'
      break
    case 'User already registered':
      status = 409
      code = 'EMAIL_EXISTS'
      message = 'Użytkownik z tym adresem email już istnieje'
      break
    case 'Token expired':
    case 'Token has expired or is invalid':
      status = 401
      code = 'TOKEN_EXPIRED'
      message = 'Link resetowania hasła wygasł'
      break
    case 'Password should be at least 8 characters':
      status = 400
      code = 'WEAK_PASSWORD'
      message = 'Hasło musi mieć minimum 8 znaków'
      break
    default:
      console.error('Unhandled Supabase auth error:', error)
      status = 500
      code = 'AUTH_ERROR'
      message = 'Wystąpił błąd uwierzytelnienia'
  }

  const errorResponse: ErrorResponseDTO = {
    error: {
      code,
      message,
      details: { originalError: error.message },
    },
  }

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
```

---

## 6. Przepływy uwierzytelniania

### 6.1 Przepływ rejestracji (szczegółowy)

```
1. User → /register
2. Middleware sprawdza sesję
3. Jeśli zalogowany → redirect /generate
4. Jeśli niezalogowany → renderowanie RegisterForm

5. User wypełnia formularz:
   - email: user@example.com
   - password: password123
   - confirmPassword: password123

6. Client-side validation (React):
   - Email regex check
   - Password length >= 8
   - Password === confirmPassword

7. POST /api/auth/register:
   Body: { email: "user@example.com", password: "password123" }

8. Server-side validation (Zod):
   - Email format
   - Password min 8 chars

9. Supabase.auth.signUp():
   - Tworzy user w auth.users
   - user.email_confirmed_at = null
   - Generuje token weryfikacyjny
   - Wysyła email z linkiem: 
     https://yourdomain.com/login?token=xxx&type=signup

10. Response 201:
    {
      "message": "Konto utworzone. Sprawdź email",
      "user": { "id": "uuid", "email": "user@example.com" }
    }

11. RegisterForm → stan registrationSuccess = true
12. Wyświetlenie komunikatu: "Sprawdź email"

13. User klika link w emailu
14. Supabase weryfikuje token:
    - user.email_confirmed_at = now()
    - Przekierowanie na /login

15. User może się zalogować
```

### 6.2 Przepływ logowania (szczegółowy)

```
1. User → /login
2. Middleware sprawdza sesję
3. Jeśli zalogowany → redirect /generate
4. Jeśli niezalogowany → renderowanie LoginForm

5. User wypełnia:
   - email: user@example.com
   - password: password123

6. Client validation:
   - Email format
   - Password min 8 chars

7. POST /api/auth/login:
   Body: { email: "user@example.com", password: "password123" }

8. Server validation (Zod)

9. Supabase.auth.signInWithPassword():
   - Sprawdza user w auth.users
   - Weryfikuje password hash (bcrypt)
   - Sprawdza email_confirmed_at != null
   - Generuje access_token (JWT, 1h)
   - Generuje refresh_token (7 dni)

10. Middleware (createServerClient) zapisuje cookies:
    - sb-access-token (httpOnly, secure, sameSite: lax)
    - sb-refresh-token (httpOnly, secure, sameSite: lax)

11. Response 200:
    {
      "message": "Zalogowano pomyślnie",
      "user": { "id": "uuid", "email": "user@example.com" },
      "session": {
        "access_token": "eyJ...",
        "refresh_token": "xxx",
        "expires_at": 1234567890
      }
    }

12. LoginForm → window.location.href = '/generate'

13. Kolejne requesty:
    - Browser wysyła cookies automatycznie
    - Middleware: supabase.auth.getSession()
    - Session z JWT → user = session.user
    - context.locals.user = user

14. /generate sprawdza:
    const user = Astro.locals.user
    if (!user) redirect('/login') // nie wykona się
    
15. User ma dostęp do /generate
```

### 6.3 Przepływ refresh token (automatyczny)

```
1. Access token wygasa po 1h
2. User robi request do /api/...

3. Middleware: supabase.auth.getSession()
   - Wykrywa wygasły access_token
   - Sprawdza refresh_token w cookies

4. @supabase/ssr automatycznie:
   - Wywołuje Supabase API: POST /auth/v1/token?grant_type=refresh_token
   - Body: { refresh_token: "xxx" }

5. Supabase:
   - Weryfikuje refresh_token
   - Invaliduje stary refresh_token
   - Generuje nowy access_token (JWT, 1h)
   - Generuje nowy refresh_token (7 dni)

6. Middleware aktualizuje cookies:
   - Nowy sb-access-token
   - Nowy sb-refresh-token

7. Request kontynuowany z nową sesją
8. User nie zauważa niczego (transparentne)
```

### 6.4 Przepływ reset hasła (szczegółowy)

```
1. User → /login → "Zapomniałeś hasła?"
2. Redirect → /forgot-password

3. User wpisuje email: user@example.com
4. POST /api/auth/forgot-password:
   Body: { email: "user@example.com" }

5. Supabase.auth.resetPasswordForEmail():
   - Sprawdza czy user istnieje
   - Jeśli TAK:
     * Generuje token (UUID, ważny 1h)
     * Zapisuje w auth.users (recovery_token)
     * Wysyła email z linkiem:
       https://yourdomain.com/reset-password?token=xxx&type=recovery
   - Jeśli NIE:
     * Nic nie robi (bezpieczeństwo)

6. Response 200 (zawsze):
   { "message": "Jeśli konto istnieje, wysłaliśmy link" }

7. ForgotPasswordForm → emailSent = true
8. Komunikat: "Sprawdź email"

9. User klika link w emailu
10. Browser → /reset-password?token=xxx&type=recovery

11. reset-password.astro:
    - Pobiera token z URL
    - Waliduje format (UUID regex)
    - Jeśli nieprawidłowy → redirect /forgot-password
    - Jeśli OK → renderuje ResetPasswordForm

12. User wpisuje:
    - newPassword: newpassword123
    - confirmPassword: newpassword123

13. Client validation:
    - newPassword >= 8 chars
    - newPassword === confirmPassword

14. POST /api/auth/reset-password:
    Body: { token: "xxx", newPassword: "newpassword123" }

15. Server validation (Zod)

16. Supabase.auth.updateUser({ password: "newpassword123" }):
    - Weryfikuje token (czy istnieje, czy nie wygasł)
    - Hashuje nowe hasło (bcrypt)
    - Aktualizuje password_hash w auth.users
    - Invaliduje recovery_token

17. Response 200:
    { "message": "Hasło zostało zmienione" }

18. ResetPasswordForm → toast.success + redirect /login

19. User loguje się nowym hasłem
```

---

## 7. Aktualizacja istniejących endpointów

### 7.1 Pattern sprawdzania auth w endpointach

```typescript
// src/pages/api/generations/index.ts (fragment)
export const POST: APIRoute = async (context) => {
  try {
    // ... existing validation code ...

    const supabase = context.locals.supabase

    // NOWE: Sprawdzenie autentykacji
    const user = context.locals.user
    if (!user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Musisz być zalogowany',
        },
      }
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ... existing OpenRouter setup ...

    const generationService = new GenerationService(supabase, openRouterService)

    // ZMIANA: Przekazanie user.id
    const result = await generationService.createGeneration(source_text, user.id)

    // ... existing response ...
  } catch (error) {
    // ... existing error handling ...
  }
}
```

### 7.2 Aktualizacja GenerationService

```typescript
// src/lib/services/generation.service.ts (fragment)

// PRZED:
import { type SupabaseClient, DEFAULT_USER_ID } from '../../db/supabase.client'

// TERAZ:
import { type SupabaseClient } from '../../db/supabase.client'

class GenerationService {
  // ...

  // PRZED:
  async createGeneration(sourceText: string): Promise<CreateGenerationResponseDTO> {
    // ...
    const generationData: GenerationInsert = {
      // ...
      user_id: DEFAULT_USER_ID, // STARE
    }
  }

  // TERAZ:
  async createGeneration(sourceText: string, userId: string): Promise<CreateGenerationResponseDTO> {
    // ...
    const generationData: GenerationInsert = {
      // ...
      user_id: userId, // NOWE
    }
  }

  // Analogicznie w logError:
  private async logError(sourceText: string, sourceTextHash: string, error: Error, userId: string) {
    await this.supabase.from('generation_error_logs').insert({
      // ...
      user_id: userId, // NOWE (zamiast DEFAULT_USER_ID)
    })
  }
}
```

### 7.3 Aktualizacja FlashcardService

```typescript
// src/lib/services/flashcard.service.ts (fragment)

// PRZED:
import { DEFAULT_USER_ID, type SupabaseClient } from '../../db/supabase.client'

// TERAZ:
import { type SupabaseClient } from '../../db/supabase.client'

class FlashcardService {
  // PRZED:
  async saveProposals(command: SaveFlashcardProposalsCommand): Promise<SaveFlashcardProposalsResponseDTO> {
    const flashcardsToInsert = command.proposals.map((proposal) => ({
      // ...
      user_id: DEFAULT_USER_ID, // STARE
    }))
  }

  // TERAZ:
  async saveProposals(
    command: SaveFlashcardProposalsCommand,
    userId: string
  ): Promise<SaveFlashcardProposalsResponseDTO> {
    const flashcardsToInsert = command.proposals.map((proposal) => ({
      // ...
      user_id: userId, // NOWE
    }))
  }
}
```

---

## 8. Dodatkowe typy

### 8.1 DTOs auth w types.ts

```typescript
// src/types.ts (dodać na końcu)

// ============= AUTH TYPES =============

// Supabase User type
import type { User } from '@supabase/supabase-js'

// Request DTOs
export interface RegisterRequestDTO {
  email: string
  password: string
}

export interface LoginRequestDTO {
  email: string
  password: string
}

export interface ForgotPasswordRequestDTO {
  email: string
}

export interface ResetPasswordRequestDTO {
  token: string
  newPassword: string
}

// Response DTOs
export interface AuthUserDTO {
  id: string
  email: string
}

export interface LoginResponseDTO {
  message: string
  user: AuthUserDTO
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}

export interface RegisterResponseDTO {
  message: string
  user: AuthUserDTO
}

export interface MessageResponseDTO {
  message: string
}
```

### 8.2 Rozszerzenie env.d.ts

```typescript
// src/env.d.ts
/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./db/database.types"
import type { User } from "@supabase/supabase-js"

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>
      user: User | null  // NOWE
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string
  readonly SUPABASE_KEY: string  // może zostać (dla kompatybilności)
  readonly SUPABASE_ANON_KEY: string  // NOWE (używane w middleware)
  readonly OPENROUTER_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

## 9. Testowanie

### 9.1 Testy manualne - Checklist

**Rejestracja:**
- [ ] Walidacja email (niepoprawny format)
- [ ] Walidacja hasła (< 8 znaków)
- [ ] Hasła nie zgadzają się
- [ ] Email już istnieje (409)
- [ ] Sukces → email weryfikacyjny
- [ ] Kliknięcie linku → weryfikacja

**Logowanie:**
- [ ] Niepoprawny email/hasło (401)
- [ ] Email niezweryfikowany (401)
- [ ] Sukces → redirect /generate
- [ ] Ciasteczka ustawione (DevTools)

**Reset hasła:**
- [ ] Email nie istnieje → sukces (bezpieczeństwo)
- [ ] Email istnieje → email z linkiem
- [ ] Token nieprawidłowy → redirect /forgot-password
- [ ] Token wygasły (401)
- [ ] Sukces → hasło zmienione

**Wylogowanie:**
- [ ] Sukces → redirect /login
- [ ] Ciasteczka usunięte

**Ochrona routingu:**
- [ ] /generate bez auth → redirect /login
- [ ] /login z auth → redirect /generate
- [ ] /register z auth → redirect /generate

**RLS:**
- [ ] User A nie widzi fiszek User B
- [ ] User A widzi tylko swoje fiszki

---

**Koniec dokumentu szczegółów implementacyjnych**

