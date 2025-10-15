import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import type { RegisterResponseDTO, ErrorResponseDTO } from "../../types";

interface RegisterFormProps {
  error?: string;
}

export function RegisterForm({ error: initialError }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(initialError || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationErrors({});
    setApiError(null);
    setSuccessMessage(null);

    // Client-side validation
    const errors: { email?: string; password?: string; confirmPassword?: string } = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email format";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Password confirmation is required";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      // Call the API endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = (await response.json()) as RegisterResponseDTO | ErrorResponseDTO;

      if (!response.ok) {
        // Handle error response
        const errorData = data as ErrorResponseDTO;
        setApiError(errorData.error.message);
        setIsLoading(false);
        return;
      }

      // Handle success response
      const successData = data as RegisterResponseDTO;

      if (successData.requiresEmailConfirmation) {
        // Email confirmation required - show success message
        setSuccessMessage(successData.message);
        setIsLoading(false);
      } else {
        // Auto-login (fallback for when email confirmation is disabled)
        window.location.href = "/generate";
      }
    } catch (error) {
      console.error("Registration error:", error);
      setApiError("An error occurred during registration. Please try again");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Register</CardTitle>
        <CardDescription>Create a new account to get started</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {apiError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {apiError}
            </div>
          )}

          {successMessage && (
            <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
              {successMessage}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!validationErrors.email}
              disabled={isLoading}
              required
            />
            {validationErrors.email && <p className="text-sm text-destructive">{validationErrors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!validationErrors.password}
              disabled={isLoading}
              required
            />
            {validationErrors.password && <p className="text-sm text-destructive">{validationErrors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
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
            {isLoading ? "Registering..." : "Register"}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:underline">
              Log in
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
