import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "../db/database.types";

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase server client with cookie handlers
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      get(key) {
        return context.cookies.get(key)?.value;
      },
      set(key, value, options) {
        context.cookies.set(key, value, {
          ...options,
          path: "/",
        });
      },
      remove(key, options) {
        context.cookies.delete(key, {
          ...options,
          path: "/",
        });
      },
    },
  });

  // Attach Supabase client to context
  context.locals.supabase = supabase;

  // Get authenticated user (verifies with Supabase Auth server)
  // Using getUser() instead of getSession() for security
  // getSession() reads from cookies without verification
  // getUser() authenticates by contacting Supabase Auth server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Attach user to context (null if not authenticated)
  context.locals.user = user;

  return next();
});
