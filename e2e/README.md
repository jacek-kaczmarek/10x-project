# E2E Tests - Teardown Configuration

## Overview

This directory contains E2E tests using Playwright. The test suite includes:

- **Setup**: `auth.setup.ts` - Authenticates once before all tests
- **Teardown**: `global.teardown.ts` - Cleans up database after all tests
- **Tests**: `*.spec.ts` - Individual test specifications
- **Page Objects**: `pages/` - Page Object Model implementations

## Global Teardown

The `global.teardown.ts` script automatically cleans up test data from Supabase after all E2E tests complete. This ensures:

- No test data pollution between test runs
- Clean database state for next test execution
- Isolated test data per test user

### What Gets Cleaned Up

The teardown removes all data created by the test user:

1. **Flashcards** (`flashcards` table)
2. **Generations** (`generations` table)
3. **Error Logs** (`generation_error_logs` table)

### Required Environment Variables

Add these to your `.env.test` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLIC_KEY=your-public-anon-key

# OpenRouter API (for flashcard generation)
OPENROUTER_API_KEY=your-openrouter-api-key

# Test User Credentials
E2E_USERNAME_ID=test-user-uuid-here
E2E_USERNAME=test@example.com
E2E_PASSWORD=your-test-password

# Base URL for testing
BASE_URL=http://localhost:4321
```

### Environment Variable Details

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_PUBLIC_KEY` | Public anon key from Supabase | `eyJhbGciOiJIUzI1NiIs...` |
| `E2E_USERNAME_ID` | UUID of test user (from `auth.users` table) | `123e4567-e89b-12d3-a456-426614174000` |
| `E2E_USERNAME` | Test user email address | `playwright@test.xyz` |
| `E2E_PASSWORD` | Test user password | `SecureTestPassword123!` |
| `OPENROUTER_API_KEY` | API key for OpenRouter | `sk-or-v1-...` |

### How It Works

1. **Before Tests**: `auth.setup.ts` logs in with `E2E_USERNAME` and saves session
2. **During Tests**: All tests run with authenticated session, creating data in database
3. **After Tests**: `global.teardown.ts` connects to Supabase and deletes all data for `E2E_USERNAME_ID`

### Setup Instructions

#### 1. Create Test User in Supabase

```sql
-- In Supabase SQL Editor
-- Create a test user (note the returned UUID)
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'playwright@test.xyz',
  crypt('YourSecurePassword', gen_salt('bf')),
  now()
);

-- Get the user ID
SELECT id FROM auth.users WHERE email = 'playwright@test.xyz';
```

Or use Supabase Dashboard:
1. Go to Authentication > Users
2. Add New User
3. Copy the UUID

#### 2. Configure `.env.test`

Create `.env.test` in project root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLIC_KEY=your-anon-key
OPENROUTER_API_KEY=your-api-key
E2E_USERNAME_ID=copied-uuid-from-step-1
E2E_USERNAME=playwright@test.xyz
E2E_PASSWORD=YourSecurePassword
BASE_URL=http://localhost:4321
```

#### 3. Verify Configuration

**Option A: Run the verification script (Recommended)**

```bash
npm run test:e2e:verify
```

This will check:
- All required environment variables are set
- Supabase connection works
- Database tables are accessible
- Test user ID is valid UUID format

**Option B: Run a full test**

```bash
npm run test:e2e
```

You should see cleanup output at the end:

```
🧹 Starting E2E test cleanup...
🔍 Cleaning up data for test user: xxx-xxx-xxx
✅ Deleted 10 flashcard(s)
✅ Deleted 2 generation(s)
✅ Deleted 0 error log(s)
✨ E2E test cleanup completed successfully
```

## Troubleshooting

### "Environment variable is missing"

**Problem**: Teardown script shows missing environment variable errors.

**Solution**: Ensure all required variables are set in `.env.test`:
- `SUPABASE_URL`
- `SUPABASE_PUBLIC_KEY`
- `E2E_USERNAME_ID`

### "Error deleting flashcards/generations"

**Problem**: Database deletion fails with permission error.

**Solution**: Check Supabase Row Level Security (RLS) policies:
- Ensure test user can delete their own data
- Or temporarily disable RLS for testing environment

### "Cannot determine which user's data to clean up"

**Problem**: `E2E_USERNAME_ID` is not set.

**Solution**: 
1. Find your test user ID in Supabase Dashboard (Authentication > Users)
2. Add it to `.env.test` as `E2E_USERNAME_ID`

### Cleanup Doesn't Run

**Problem**: Tests finish but cleanup doesn't execute.

**Solution**: 
- Verify `playwright.config.ts` has `globalTeardown: "./e2e/global.teardown.ts"`
- Check that `.env.test` file exists and is being loaded
- Ensure `dotenv` is properly configured in `playwright.config.ts`

## Best Practices

### Use Dedicated Test User

- Create a separate user specifically for E2E tests
- Don't use production or development user accounts
- Use a recognizable email like `e2e-test@example.com`

### Verify Cleanup

After running tests, check Supabase dashboard to confirm:
- No orphaned flashcards remain
- No test generations in database
- Clean slate for next test run

### CI/CD Considerations

In CI environments:
- Store sensitive credentials in CI secrets
- Use different test database/project if possible
- Consider using Supabase local development setup

## Running Tests

```bash
# Verify configuration before running tests
npm run test:e2e:verify

# Run all E2E tests with cleanup
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# View test report
npm run test:e2e:report

# Generate new tests
npm run test:e2e:codegen
```

## Additional Resources

- [Playwright Configuration](https://playwright.dev/docs/test-configuration)
- [Playwright Global Setup/Teardown](https://playwright.dev/docs/test-global-setup-teardown)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

