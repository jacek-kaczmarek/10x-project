import { useState } from "react";
import { Button } from "../ui/button";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    // Submit logout form (will be handled by Astro endpoint in the future)
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/logout";
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoading}>
      {isLoading ? "Wylogowywanie..." : "Wyloguj"}
    </Button>
  );
}
