# Testing Guide - ARA Voice Form

## Table of Contents

- [Overview](#overview)
- [Test Infrastructure](#test-infrastructure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [Continuous Integration](#continuous-integration)
- [Troubleshooting](#troubleshooting)

## Overview

This project uses a comprehensive testing strategy with:
- **Jest** - Test framework and runner
- **React Native Testing Library** - Component testing utilities
- **GitHub Actions** - Automated CI/CD testing
- **Sentry** - Production error monitoring

### Current Test Coverage

```
Test Suites: 3 passed (Card, InputField, VoiceFill Integration)
Tests:       29 passing (88% pass rate)
Coverage:    Target 60% statements, 50% branches
```

## Test Infrastructure

### Dependencies

```json
{
  "devDependencies": {
    "@testing-library/jest-native": "^5.4.3",
    "@testing-library/react-native": "^13.3.3",
    "@types/jest": "^30.0.0",
    "jest": "^30.2.0",
    "jest-expo": "^54.0.13"
  }
}
```

### Configuration Files

#### `jest.config.js`

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.js'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!@sentry/.*|expo.*|react-native.*)'
  ],
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 50,
      functions: 60,
      lines: 60
    }
  }
};
```

#### `jest.setup.js`

Comprehensive mocks for:
- Expo SDK 54+ (import meta registry, structuredClone)
- Sentry error monitoring
- Environment variables
- React Native modules (Audio, ImagePicker, etc.)
- Lucide icons
- API fetch calls (Gemini, Rork STT)

## Running Tests

### Available Commands

```bash
# Run all tests
bun run test

# Run tests in watch mode (auto-rerun on file changes)
bun run test:watch

# Run tests with coverage report
bun run test:coverage

# Run tests in CI mode (no watch, with coverage)
bun run test:ci
```

### Test Modes

#### Development Mode
```bash
bun run test:watch
```
- Runs tests automatically when files change
- Shows only failed tests after first run
- Interactive mode with filtering options

#### Coverage Mode
```bash
bun run test:coverage
```
- Generates detailed coverage reports
- Creates `coverage/` directory with HTML report
- Enforces coverage thresholds (60% statements, 50% branches)

#### CI Mode
```bash
bun run test:ci
```
- Non-interactive mode for CI/CD pipelines
- Uses `maxWorkers=2` for faster execution
- Generates coverage report for upload

## Writing Tests

### Component Testing

Test React Native components using `@testing-library/react-native`:

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import InputField from '@/components/InputField';

describe('InputField', () => {
  it('calls onChangeText when text changes', () => {
    const mockOnChange = jest.fn();
    const { getByTestId } = render(
      <InputField
        label="Name"
        value=""
        onChangeText={mockOnChange}
      />
    );

    const input = getByTestId('inputField');
    fireEvent.changeText(input, 'John Doe');

    expect(mockOnChange).toHaveBeenCalledWith('John Doe');
  });
});
```

### Integration Testing

Test complete user flows across multiple components:

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VoiceFillScreen from '../(tabs)/index';

describe('Voice Fill Integration Test', () => {
  it('clears form when clear button is pressed', () => {
    const { getByTestId } = render(<VoiceFillScreen />);

    const nameInput = getByTestId('nameInput');
    fireEvent.changeText(nameInput, 'John Doe');

    const clearButton = getByTestId('clearForm');
    fireEvent.press(clearButton);

    expect(nameInput.props.value).toBe('');
  });
});
```

### Utility Function Testing

Test pure functions with standard Jest assertions:

```typescript
import { parseContractSource } from '../contractParser';

describe('contractParser', () => {
  describe('parseContractSource', () => {
    it('extracts client name correctly', () => {
      const source = 'Client name: ABC Corporation';
      const result = parseContractSource(source);

      expect(result.data.clientName).toBe('ABC Corporation');
    });

    it('handles empty source gracefully', () => {
      const result = parseContractSource('');

      expect(result.data).toBeDefined();
      expect(result.summaryLines).toEqual([]);
    });
  });
});
```

### Testing Best Practices

#### 1. Use Test IDs for Reliable Selection

```typescript
// In component
<TextInput testID="nameInput" {...props} />

// In test
const nameInput = getByTestId('nameInput');
```

#### 2. Test User Interactions, Not Implementation

```typescript
// ✅ Good - Tests user behavior
it('displays error message when form is invalid', () => {
  const { getByText, getByTestId } = render(<Form />);
  fireEvent.press(getByTestId('submitButton'));
  expect(getByText('Email is required')).toBeTruthy();
});

// ❌ Bad - Tests implementation details
it('sets state correctly', () => {
  const component = new Form();
  component.setState({ email: 'test@example.com' });
  expect(component.state.email).toBe('test@example.com');
});
```

#### 3. Mock External Dependencies

```typescript
// Mock API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'mocked response' }),
  })
);

// Verify fetch was called correctly
expect(global.fetch).toHaveBeenCalledWith(
  expect.stringContaining('/api/endpoint'),
  expect.objectContaining({ method: 'POST' })
);
```

#### 4. Test Edge Cases and Error Handling

```typescript
it('handles network errors gracefully', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

  const { getByTestId, findByText } = render(<Component />);
  fireEvent.press(getByTestID('fetchButton'));

  const errorMessage = await findByText(/Network error/i);
  expect(errorMessage).toBeTruthy();
});
```

## Test Coverage

### Viewing Coverage Reports

After running `bun run test:coverage`, open the HTML report:

```bash
# macOS
open coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html

# Windows
start coverage/lcov-report/index.html
```

### Coverage Thresholds

The project enforces minimum coverage thresholds:

```javascript
coverageThreshold: {
  global: {
    statements: 60,  // 60% of statements must be covered
    branches: 50,    // 50% of branches must be covered
    functions: 60,   // 60% of functions must be covered
    lines: 60        // 60% of lines must be covered
  }
}
```

### Improving Coverage

To increase coverage:

1. **Identify uncovered code**:
   ```bash
   bun run test:coverage
   # Check coverage/lcov-report/index.html for red/yellow files
   ```

2. **Write tests for uncovered files**:
   ```bash
   # Create test file in __tests__ directory
   touch components/__tests__/YourComponent.test.tsx
   ```

3. **Focus on critical paths first**:
   - User authentication flows
   - Payment processing
   - Data validation
   - Error handling

## Continuous Integration

### GitHub Actions Workflows

#### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` or `develop`:

```yaml
jobs:
  lint-and-test:
    - Checkout code
    - Setup Bun
    - Install dependencies
    - Run linter
    - Run tests with coverage
    - Upload coverage to Codecov

  type-check:
    - Run TypeScript compiler (tsc --noEmit)

  security-audit:
    - Run bun audit for vulnerabilities
```

#### PR Checks Workflow (`.github/workflows/pr-checks.yml`)

Enhanced security and quality checks on pull requests:

```yaml
jobs:
  pr-quality-gate:
    - Run tests with coverage
    - Check coverage thresholds
    - Verify no .env files committed
    - Check for hardcoded secrets (API keys)
    - Verify environment variable usage
    - Comment PR with test results

  dependency-review:
    - Review new dependencies
    - Fail on moderate+ vulnerabilities
    - Block GPL/AGPL licenses
```

### Setting Up CI

#### Required GitHub Secrets

None required for basic testing. Optional for coverage:

```bash
# Codecov (optional)
CODECOV_TOKEN=<your_codecov_token>
```

#### Viewing CI Results

1. Go to https://github.com/your-org/your-repo/actions
2. Click on the workflow run
3. View test results, coverage, and logs

## Troubleshooting

### Common Issues

#### 1. Module Not Found Errors

**Error**: `Cannot find module '@sentry/react-native'`

**Solution**: Update `transformIgnorePatterns` in `jest.config.js`:

```javascript
transformIgnorePatterns: [
  'node_modules/(?!@sentry/.*|expo.*|react-native.*)'
]
```

#### 2. Expo Import Meta Registry Error

**Error**: `ReferenceError: You are trying to import a file outside of the scope`

**Solution**: Add to `jest.setup.js`:

```javascript
global.__ExpoImportMetaRegistry = {
  register: jest.fn(),
  get: jest.fn(),
};
```

#### 3. structuredClone Not Defined

**Error**: `ReferenceError: structuredClone is not defined`

**Solution**: Add polyfill to `jest.setup.js`:

```javascript
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
```

#### 4. Tests Pass Locally but Fail in CI

**Common causes**:
- Missing environment variables in CI
- Different Node.js/Bun versions
- Race conditions in async tests

**Solutions**:
- Add required env vars to GitHub Secrets
- Use `maxWorkers=2` in CI mode
- Use `waitFor` for async assertions:

```typescript
const result = await waitFor(() => getByText('Success'));
```

#### 5. Snapshot Tests Failing

**Error**: `Received value does not match stored snapshot`

**Solution**: Update snapshots if changes are intentional:

```bash
bun run test -- -u
```

### Debugging Tests

#### Enable Verbose Output

```bash
bun run test -- --verbose
```

#### Run Specific Test File

```bash
bun run test -- components/__tests__/InputField.test.tsx
```

#### Run Tests Matching Pattern

```bash
bun run test -- --testNamePattern="handles keyboard types"
```

#### Debug with Breakpoints

```typescript
it('should debug this test', () => {
  debugger; // Add breakpoint
  const result = myFunction();
  expect(result).toBe(expected);
});
```

Then run with:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Expo Testing Guide](https://docs.expo.dev/develop/unit-testing/)

## Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Ensure tests pass locally**: `bun run test`
3. **Check coverage**: `bun run test:coverage`
4. **Verify CI passes** before merging PR

Aim for:
- ✅ 60%+ statement coverage
- ✅ All new features have tests
- ✅ All edge cases handled
- ✅ Error states tested
