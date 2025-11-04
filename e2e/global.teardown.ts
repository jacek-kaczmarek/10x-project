/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import { join } from "path";
import type { Database } from "../src/db/database.types";

/**
 * Global teardown for E2E tests
 * Cleans up Supabase database after all tests have completed
 * Uses the authenticated session from Playwright auth state
 */
async function globalTeardown() {
  console.log("🧹 Starting E2E test cleanup...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLIC_KEY;
  const testUserId = process.env.E2E_USERNAME_ID;

  console.log("2");

  if (!supabaseUrl || !supabaseKey || !testUserId) {
    console.error("❌ Missing required environment variables");
    return;
  }

  console.log("3");

  try {
    // Read the auth state to get the session token
    const authFile = join(process.cwd(), "playwright/.auth/user.json");
    const authStateContent = await readFile(authFile, "utf-8");
    const authState = JSON.parse(authStateContent);

    // Extract access token from cookies (Supabase stores it in sb-*-auth-token cookie)
    const cookies = authState.cookies || [];
    const authCookie = cookies.find(
      (cookie: { name: string; value: string }) => cookie.name.includes("sb-") && cookie.name.includes("auth-token")
    );

    if (!authCookie) {
      console.error("❌ Could not find auth cookie in Playwright session");
      return;
    }

    // Decode the base64 cookie value
    const cookieValue = authCookie.value.replace("base64-", "");
    const decodedValue = Buffer.from(cookieValue, "base64").toString("utf-8");
    const authData = JSON.parse(decodedValue);

    const accessToken = authData?.access_token;

    if (!accessToken) {
      console.error("❌ Could not extract access token from session");
      return;
    }

    // Create authenticated Supabase client
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    console.log(`🔍 Cleaning up data for test user: ${testUserId.substring(0, 8)}...`);

    // Show how many items will be deleted
    const flashcards = await supabase.from("flashcards").select("*").eq("user_id", testUserId);
    console.log(`🔍 Found ${flashcards.data?.length} flashcards to delete`);

    const generations = await supabase.from("generations").select("*").eq("user_id", testUserId);
    console.log(`🔍 Found ${generations.data?.length} generations to delete`);

    const generationErrorLogs = await supabase.from("generation_error_logs").select("*").eq("user_id", testUserId);
    console.log(`🔍 Found ${generationErrorLogs.data?.length} generation error logs to delete`);

    // Delete in correct order (flashcards first due to foreign key constraint)
    await supabase.from("flashcards").delete().eq("user_id", testUserId);
    await supabase.from("generations").delete().eq("user_id", testUserId);
    await supabase.from("generation_error_logs").delete().eq("user_id", testUserId);

    console.log("✨ E2E test cleanup completed successfully");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  }
}

export default globalTeardown;
