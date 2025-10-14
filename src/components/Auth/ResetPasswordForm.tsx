import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

interface ResetPasswordFormProps {
  token: string;
  error?: string;
  success?: string;
}

export function ResetPasswordForm({ token, error, success }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationErrors({});

    // Client-side validation
    const errors: { newPassword?: string; confirmPassword?: string } = {};

    if (!newPassword) {
      errors.newPassword = "Hasło jest wymagane";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Hasło musi mieć min. 8 znaków";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Potwierdzenie hasła jest wymagane";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Hasła nie są identyczne";
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
        <CardTitle className="text-2xl">Nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło do swojego konta</CardDescription>
      </CardHeader>
      <form method="POST" action="/api/auth/reset-password" onSubmit={handleSubmit}>
        <input type="hidden" name="token" value={token} />

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
            <Label htmlFor="newPassword">Nowe hasło</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              aria-invalid={!!validationErrors.newPassword}
              disabled={isLoading}
              required
            />
            {validationErrors.newPassword && <p className="text-sm text-destructive">{validationErrors.newPassword}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={!!validationErrors.confirmPassword}
              disabled={isLoading}
              required
            />
            {validationErrors.confirmPassword && (
              <p className="text-sm text-destructive">{validationErrors.confirmPassword}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetowanie..." : "Zresetuj hasło"}
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
