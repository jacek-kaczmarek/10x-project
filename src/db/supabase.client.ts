import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

// Client-side Supabase client - for React components only
// For server-side (API routes, middleware), use context.locals.supabase instead
// On Cloudflare, client-side env vars must have PUBLIC_ prefix

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

// Only validate if we're in a browser context (not during SSR/build)
if (typeof window !== "undefined" && (!supabaseUrl || !supabaseAnonKey)) {
  console.error("Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_KEY environment variables");
}

export const supabaseClient = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

export type SupabaseClient = typeof supabaseClient;
