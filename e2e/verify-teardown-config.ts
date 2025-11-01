/* eslint-disable no-console */
/**
 * Verification script for E2E teardown configuration
 * Run this script to verify your .env.test is properly configured
 *
 * Usage: npx tsx e2e/verify-teardown-config.ts
 */

import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";

// Load .env.test
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

async function validateConfiguration(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  console.log("🔍 Validating E2E teardown configuration...\n");

  // Check required environment variables
  const requiredVars = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLIC_KEY: process.env.SUPABASE_PUBLIC_KEY,
    E2E_USERNAME_ID: process.env.E2E_USERNAME_ID,
    E2E_USERNAME: process.env.E2E_USERNAME,
    E2E_PASSWORD: process.env.E2E_PASSWORD,
  };

  console.log("📋 Environment Variables:");
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      result.errors.push(`Missing required variable: ${key}`);
      console.log(`  ❌ ${key}: NOT SET`);
      result.isValid = false;
    } else {
      // Mask sensitive values
      const displayValue = key.includes("KEY") || key.includes("PASSWORD") ? `${value.substring(0, 8)}...` : value;
      console.log(`  ✅ ${key}: ${displayValue}`);
    }
  }

  console.log();

  // Validate UUID format
  if (requiredVars.E2E_USERNAME_ID) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requiredVars.E2E_USERNAME_ID)) {
      result.errors.push("E2E_USERNAME_ID is not a valid UUID format");
      console.log("  ❌ E2E_USERNAME_ID: Invalid UUID format");
      result.isValid = false;
    } else {
      console.log("  ✅ E2E_USERNAME_ID: Valid UUID format");
    }
  }

  // Test Supabase connection
  if (requiredVars.SUPABASE_URL && requiredVars.SUPABASE_PUBLIC_KEY) {
    console.log("\n🔌 Testing Supabase connection...");
    try {
      const supabase = createClient<Database>(requiredVars.SUPABASE_URL, requiredVars.SUPABASE_PUBLIC_KEY);

      // Try to query the tables (just check if they exist)
      const { error: flashcardsError } = await supabase.from("flashcards").select("id").limit(1);

      const { error: generationsError } = await supabase.from("generations").select("id").limit(1);

      if (flashcardsError) {
        result.errors.push(`Cannot access flashcards table: ${flashcardsError.message}`);
        console.log("  ❌ flashcards table: Access failed");
        result.isValid = false;
      } else {
        console.log("  ✅ flashcards table: Accessible");
      }

      if (generationsError) {
        result.errors.push(`Cannot access generations table: ${generationsError.message}`);
        console.log("  ❌ generations table: Access failed");
        result.isValid = false;
      } else {
        console.log("  ✅ generations table: Accessible");
      }

      // Check if test user exists
      if (requiredVars.E2E_USERNAME_ID) {
        const { data, error } = await supabase
          .from("flashcards")
          .select("id")
          .eq("user_id", requiredVars.E2E_USERNAME_ID)
          .limit(1);

        if (error) {
          result.warnings.push(`Cannot query test user data: ${error.message}`);
          console.log("  ⚠️  Test user data: Cannot verify");
        } else {
          console.log(`  ✅ Test user query: Success (found ${data.length} flashcards)`);
        }
      }
    } catch (error) {
      result.errors.push(`Supabase connection failed: ${error instanceof Error ? error.message : String(error)}`);
      console.log("  ❌ Connection failed");
      result.isValid = false;
    }
  }

  return result;
}

async function main() {
  console.log("════════════════════════════════════════════════");
  console.log("   E2E Teardown Configuration Validator");
  console.log("════════════════════════════════════════════════\n");

  const result = await validateConfiguration();

  console.log("\n════════════════════════════════════════════════");
  console.log("📊 Validation Results:\n");

  if (result.isValid) {
    console.log("✅ Configuration is valid!");
    console.log("\nYour E2E tests are properly configured for teardown.");
    console.log("You can now run: npm run test:e2e");
  } else {
    console.log("❌ Configuration has errors!\n");
    console.log("Errors:");
    result.errors.forEach((error) => console.log(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    result.warnings.forEach((warning) => console.log(`  - ${warning}`));
  }

  console.log("\n════════════════════════════════════════════════");
  console.log("\n📚 For help, see: e2e/README.md");

  process.exit(result.isValid ? 0 : 1);
}

main().catch((error) => {
  console.error("\n💥 Unexpected error:", error);
  process.exit(1);
});
