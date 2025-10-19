# Testing Guide

This project uses Vitest for unit tests and Playwright for E2E tests.

## Unit Tests (Vitest)

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Unit Tests

Tests are located alongside the source files or in `src/test/`.

Example test structure:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### MSW API Mocking

API handlers are defined in `src/test/mocks/handlers.ts`. Add new handlers as needed:

```typescript
export const handlers = [
  http.post("/api/your-endpoint", () => {
    return HttpResponse.json({ success: true });
  }),
];
```

## E2E Tests (Playwright)

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Generate tests using codegen
npm run test:e2e:codegen

# View test report
npm run test:e2e:report
```

### Writing E2E Tests

Tests are located in the `e2e/` directory. Use the Page Object Model pattern:

```typescript
import { test, expect } from "@playwright/test";
import { GeneratePage } from "./pages/generate.page";

test("user can generate flashcards", async ({ page }) => {
  // Authentication is automatically handled by auth.setup.ts
  // All tests start with an authenticated session
  const generatePage = new GeneratePage(page);
  await generatePage.goto();
  await generatePage.generateFlashcards("Sample text...");
  await expect(generatePage.proposalsList).toBeVisible();
});
```

### Authentication in E2E Tests

The project uses Playwright's **Storage State** pattern for authentication:

- `e2e/auth.setup.ts` logs in once before all tests
- The authenticated session is saved to `playwright/.auth/user.json`
- All tests automatically reuse this session (no repeated logins)
- This significantly speeds up test execution

To test unauthenticated flows, create a separate project in `playwright.config.ts` without `storageState`.

## Test Structure

```
├── src/
│   ├── test/
│   │   ├── setup.ts              # Vitest setup and global config
│   │   ├── mocks/
│   │   │   ├── server.ts         # MSW server for Node
│   │   │   ├── browser.ts        # MSW worker for browser
│   │   │   └── handlers.ts       # API mock handlers
│   │   └── utils/
│   │       └── test-utils.tsx    # Custom render and utilities
│   └── components/
│       └── **/*.test.tsx         # Component tests
├── e2e/
│   ├── auth.setup.ts             # Authentication setup (runs once)
│   ├── pages/                    # Page Object Models
│   └── *.spec.ts                 # E2E test specs
├── playwright/.auth/             # Stored auth state (gitignored)
├── vitest.config.ts              # Vitest configuration
└── playwright.config.ts          # Playwright configuration
```

## Best Practices

### Unit Tests (Vitest)

- Use `vi.mock()` for module mocking at the top of test files
- Prefer `vi.spyOn()` when you only need to observe behavior
- Use MSW for API mocking instead of mocking fetch directly
- Keep tests focused and test one thing at a time
- Use descriptive test names following the "should" pattern
- Clean up after tests using `afterEach` hooks

### E2E Tests (Playwright)

- Use Page Object Model for maintainable tests
- Use semantic locators (getByRole, getByLabel) over CSS selectors
- Leverage Storage State for authentication (faster than per-test login)
- Use browser contexts for test isolation
- Enable trace viewer for debugging failed tests
- Use visual regression testing when appropriate
- All tests automatically run with authenticated session

## Configuration

### Environment Variables for Testing

Copy `.env.example` to `.env.test.local` and update with test-specific values:

```env
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=test-key
OPENROUTER_API_KEY=test-api-key
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
```

## CI/CD Integration

Tests are designed to run in CI environments. The configurations automatically:

- Use Chromium only for faster E2E tests
- Run in non-interactive mode
- Generate reports and coverage
- Retry failed tests in CI

## Debugging

### Vitest

- Use `test.only()` to run a single test
- Use `--ui` flag for interactive debugging
- Check coverage reports in `coverage/` directory

### Playwright

- Use `--ui` flag for interactive debugging
- Use trace viewer: `npx playwright show-trace trace.zip`
- Use `--debug` flag to run in headed mode with debugger
- Use codegen to record new tests: `npm run test:e2e:codegen`

## Common Issues

1. **Tests fail due to missing environment variables**
   - Ensure `.env.test.local` is properly configured
   - Check that Supabase is running locally for integration tests

2. **E2E tests timeout**
   - Ensure dev server is running
   - Check `playwright.config.ts` timeout settings
   - Verify network connectivity

3. **Mock handlers not working**
   - Verify handlers are registered in `src/test/mocks/handlers.ts`
   - Check that MSW server is properly initialized in `setup.ts`
