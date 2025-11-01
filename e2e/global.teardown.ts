/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import { join } from "path";
import type { Database } from "../src/db/database.types";

/**
 * Global teardown for E2E tests
 * Cleans up Supabase database after all tests have completed
 * This removes all test data created during E2E test execution
 */
async function globalTeardown() {
  console.log("🧹 Starting E2E test cleanup...");

  // Get environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLIC_KEY;
  let testUserId = process.env.E2E_USERNAME_ID;

  // Try to get user_id from stored auth state (more reliable)
  try {
    const authFile = join(process.cwd(), "playwright/.auth/user.json");
    const authStateContent = await readFile(authFile, "utf-8");
    const authState = JSON.parse(authStateContent);

    // Extract user_id from session localStorage
    const localStorage = authState.origins?.[0]?.localStorage || [];

    // Try to find user_id in localStorage (Supabase stores it there)
    const userDataItem = localStorage.find(
      (item: { name: string; value: string }) => item.name.includes("supabase.auth.token") || item.name.includes("sb-")
    );

    if (userDataItem) {
      const userData = JSON.parse(userDataItem.value);
      const sessionUserId = userData?.user?.id || userData?.currentSession?.user?.id;

      if (sessionUserId) {
        console.log(`📝 Found user_id from auth session: ${sessionUserId}`);
        if (testUserId && testUserId !== sessionUserId) {
          console.warn(`⚠️  Warning: E2E_USERNAME_ID (${testUserId}) differs from session user_id (${sessionUserId})`);
          console.warn(`   Using session user_id for cleanup to match test data.`);
        }
        testUserId = sessionUserId;
      }
    }
  } catch {
    console.log("ℹ️  Could not read auth state file, using E2E_USERNAME_ID from env");
  }

  // Validate required environment variables
  if (!supabaseUrl) {
    console.error("❌ SUPABASE_URL environment variable is missing");
    return;
  }

  if (!supabaseKey) {
    console.error("❌ SUPABASE_PUBLIC_KEY environment variable is missing");
    return;
  }

  if (!testUserId) {
    console.error("❌ E2E_USERNAME_ID environment variable is missing");
    console.log("⚠️  Cannot determine which user's data to clean up");
    return;
  }

  try {
    // Create Supabase client for cleanup
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    console.log(`🔍 Cleaning up data for test user: ${testUserId}`);

    // First, check what data exists before cleanup
    const { data: existingFlashcards } = await supabase
      .from("flashcards")
      .select("id, status, source")
      .eq("user_id", testUserId);

    const { data: existingGenerations } = await supabase
      .from("generations")
      .select("id, flashcards_generated")
      .eq("user_id", testUserId);

    const flashcardsBeforeCount = existingFlashcards?.length || 0;
    const generationsBeforeCount = existingGenerations?.length || 0;

    console.log(`📊 Found before cleanup: ${flashcardsBeforeCount} flashcards, ${generationsBeforeCount} generations`);

    // Delete flashcards for test user
    // This must be done first due to foreign key constraint (flashcards references generations)
    const { error: flashcardsError } = await supabase.from("flashcards").delete().eq("user_id", testUserId);

    if (flashcardsError) {
      console.error("❌ Error deleting flashcards:", flashcardsError.message);
    } else {
      // Use count from BEFORE query since Supabase .delete().count is unreliable
      console.log(`✅ Deleted ${flashcardsBeforeCount} flashcard(s)`);
    }

    // Delete generations for test user
    const { error: generationsError } = await supabase.from("generations").delete().eq("user_id", testUserId);

    if (generationsError) {
      console.error("❌ Error deleting generations:", generationsError.message);
    } else {
      // Use count from BEFORE query since Supabase .delete().count is unreliable
      console.log(`✅ Deleted ${generationsBeforeCount} generation(s)`);
    }

    // Delete generation error logs for test user (if any)
    // First check count
    const { data: existingErrorLogs } = await supabase
      .from("generation_error_logs")
      .select("id")
      .eq("user_id", testUserId);

    const errorLogsBeforeCount = existingErrorLogs?.length || 0;

    const { error: errorLogsError } = await supabase.from("generation_error_logs").delete().eq("user_id", testUserId);

    if (errorLogsError) {
      console.error("❌ Error deleting error logs:", errorLogsError.message);
    } else {
      console.log(`✅ Deleted ${errorLogsBeforeCount} error log(s)`);
    }

    console.log("✨ E2E test cleanup completed successfully");
  } catch (error) {
    console.error("❌ Unexpected error during cleanup:", error);
  }
}

export default globalTeardown;
