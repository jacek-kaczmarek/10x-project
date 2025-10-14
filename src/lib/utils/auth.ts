import type { User } from "@supabase/supabase-js";
import type { AstroGlobal } from "astro";

/**
 * @deprecated This function is no longer needed. Use ProtectedLayout instead.
 *
 * Authentication is now handled automatically by ProtectedLayout.
 * For protected pages, simply wrap your content with ProtectedLayout:
 *
 * @example
 * ```astro
 * ---
 * import ProtectedLayout from "../layouts/ProtectedLayout.astro";
 * ---
 *
 * <ProtectedLayout title="My Protected Page">
 *   <!-- Your content here -->
 * </ProtectedLayout>
 * ```
 *
 * For API routes, check locals.user and return 401 if missing:
 * @example
 * ```ts
 * export const POST: APIRoute = async ({ locals }) => {
 *   if (!locals.user) {
 *     return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
 *   }
 *   // ...
 * };
 * ```
 */
export function requireAuth(Astro: AstroGlobal): User | Response {
  const user = Astro.locals.user;

  if (!user) {
    return Astro.redirect("/login");
  }

  return user;
}
