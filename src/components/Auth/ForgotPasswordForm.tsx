import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

interface ForgotPasswordFormProps {
  error?: string;
  success?: string;
}

export function ForgotPasswordForm({ error, success }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationErrors({});

    // Client-side validation
    const errors: { email?: string } = {};

    if (!email) {
      errors.email = "Email jest wymagany";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Nieprawidłowy format email";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    // Submit form (will be handled by Astro endpoint in the future)
    const form = e.target as HTMLFormElement;
    form.submit();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Resetowanie hasła</CardTitle>
        <CardDescription>Wprowadź swój email, a wyślemy Ci link do zresetowania hasła</CardDescription>
      </CardHeader>
      <form method="POST" action="/api/auth/forgot-password" onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nazwa@przyklad.pl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!validationErrors.email}
              disabled={isLoading}
              required
            />
            {validationErrors.email && <p className="text-sm text-destructive">{validationErrors.email}</p>}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            <a href="/login" className="text-primary hover:underline">
              Powrót do logowania
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
