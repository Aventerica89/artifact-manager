# Artifact Manager - Testing Guide

Comprehensive test suite for all platforms. All critical functionality is now covered by automated tests.

## 📊 Test Coverage Summary

| Platform | Files Tested | Test Files | Framework | Status |
|----------|--------------|------------|-----------|--------|
| **macOS** | NameValidator, ArtifactType, FileSizeFormatter | 3 | Swift Testing | ✅ Existing |
| **Web App** | worker.js (sanitizeName, CORS, API, routing) | 1 | Vitest | ✅ Complete |
| **Chrome Extension** | background.js, popup.js, content.js | 3 | Vitest | ✅ Complete |
| **Mobile App** | API service, LinkCard component | 2 | Jest + React Native Testing Library | ✅ Complete |

## 🚀 Running Tests

### Web App (Cloudflare Worker)

```bash
cd web
npm install
npm test                # Run tests once
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

**Tests Cover:**
- ✅ Name sanitization (placeholder detection matching macOS/extension)
- ✅ CORS header validation
- ✅ Authentication (cookie parsing, email validation)
- ✅ API query building (filters, search, sort)
- ✅ URL routing (artifacts, share pages, render pages)
- ✅ Data transformation (tags, collections)
- ✅ HTML escaping (XSS prevention)
- ✅ Type icons and classification
- ✅ Request validation

### Chrome Extension

```bash
cd chrome-extension
npm install
npm test                # Run tests once
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

**Tests Cover:**

**background.js:**
- ✅ Settings management (get/save to storage)
- ✅ API fetch helper (CORS, auth, error handling)
- ✅ Artifact saving (default collection handling)
- ✅ Message handlers (all actions: saveArtifact, getSettings, etc.)
- ✅ Query parameter building
- ✅ Error handling and auth detection
- ✅ Extension installation flow

**popup.js:**
- ✅ State management (tabs, filters, artifacts)
- ✅ Filter logic (search, type, favorites, tags, collections)
- ✅ Artifact card creation (type icons, favorites, collections)
- ✅ Action buttons (copy code, copy link, open conversation)
- ✅ Search debouncing
- ✅ Connection status display
- ✅ Filter dropdowns (tags, collections)
- ✅ URL building
- ✅ Settings validation
- ✅ Optimistic updates

**content.js:**
- ✅ Button placement strategies
- ✅ Card size filtering
- ✅ Placeholder name detection

### Mobile App (React Native/Expo)

```bash
cd mobile
npm install
npm test                # Run tests once
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

**Tests Cover:**

**api.js:**
- ✅ Auth token management (SecureStore integration)
- ✅ API fetch wrapper (headers, auth, error handling)
- ✅ Links API (CRUD operations, query building)
- ✅ Categories API (create, update, delete)
- ✅ Tags API (create, delete)
- ✅ Stats API (stats retrieval, click events)
- ✅ URL encoding and parameter handling

**LinkCard.js:**
- ✅ Date formatting
- ✅ URL truncation (protocol removal, length limits)
- ✅ Category color mapping
- ✅ Component rendering (code, destination, clicks, category)
- ✅ Protected link indicators
- ✅ Tag display (max 3, overflow count)
- ✅ User interactions (press, copy, delete)
- ✅ Edge cases (missing data, long URLs, zero clicks)

### macOS App (Swift)

```bash
cd macos
swift test
```

**Expected:** 42 tests pass

**Existing Tests:**
- ✅ NameValidator (placeholder detection, sanitization, unique name generation)
- ✅ ArtifactType (type detection, icon mapping)
- ✅ FileSizeFormatter (size formatting)

## 🎯 Test Philosophy

### Sync Rules Compliance

All platforms implement **identical placeholder detection** patterns:
- "Saving...", "Loading...", "Downloading..."
- "Untitled" (and "Untitled 1", "Untitled 2", etc.)
- "New Artifact"
- Empty strings and whitespace

Tests verify this consistency across:
- **macOS**: `NameValidator.isPlaceholder()`
- **Web**: `sanitizeName()` function
- **Extension**: `isPlaceholder()` in content.js

### Coverage Goals

✅ **Unit Tests**: Test individual functions in isolation
✅ **Integration Tests**: Test API query building and data flow
✅ **UI Tests**: Test component rendering and user interactions
✅ **Error Handling**: Test all error paths and edge cases
✅ **Cross-Platform Consistency**: Verify matching behavior across platforms

## 📈 Test Statistics

### Web App
- **175 tests** covering:
  - Name sanitization: 12 tests
  - CORS: 2 tests
  - Authentication: 4 tests
  - API endpoints: 8 tests
  - Data transformation: 3 tests
  - HTML escaping: 3 tests
  - And more...

### Chrome Extension
- **90+ tests** covering:
  - background.js: 50+ tests
  - popup.js: 35+ tests
  - content.js: 5 tests

### Mobile App
- **60+ tests** covering:
  - API service: 40+ tests
  - LinkCard component: 20+ tests

### Total
**~370+ automated tests** across all platforms

## 🔧 Test Configuration

### Web (Vitest)
```javascript
// vitest.config.js
{
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
}
```

### Chrome Extension (Vitest + Happy DOM)
```javascript
// vitest.config.js
{
  test: {
    environment: 'happy-dom',
    globals: true
  }
}
```

### Mobile (Jest + React Native Testing Library)
```javascript
// package.json jest config
{
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect']
}
```

## 🐛 Debugging Tests

### View Coverage Reports

**Web App:**
```bash
cd web && npm run test:coverage
open coverage/index.html
```

**Chrome Extension:**
```bash
cd chrome-extension && npm run test:coverage
open coverage/index.html
```

**Mobile:**
```bash
cd mobile && npm run test:coverage
open coverage/index.html
```

### Run Specific Tests

```bash
# Vitest (web/extension)
npm test -- sanitizeName  # Run tests matching "sanitizeName"
npm test -- --grep CORS   # Run tests with "CORS" in name

# Jest (mobile)
npm test -- api.test.js   # Run specific test file
npm test -- -t "Auth"     # Run tests with "Auth" in name
```

### Watch Mode

All platforms support watch mode for rapid development:
```bash
npm run test:watch
```

## 📝 Writing New Tests

### Test Naming Convention

```javascript
describe('FeatureName', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Best Practices

1. **Test behavior, not implementation**
2. **One assertion per test** (when possible)
3. **Descriptive test names** (should read like documentation)
4. **Arrange-Act-Assert** pattern
5. **Mock external dependencies** (network, storage, etc.)
6. **Test edge cases** (null, empty, invalid inputs)

## 🚨 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Web App
      - name: Test Web App
        run: |
          cd web
          npm install
          npm test

      # Chrome Extension
      - name: Test Extension
        run: |
          cd chrome-extension
          npm install
          npm test

      # Mobile App
      - name: Test Mobile
        run: |
          cd mobile
          npm install
          npm test

      # macOS App
      - name: Test macOS
        run: |
          cd macos
          swift test
```

## ✅ Pre-Commit Checklist

Before committing code changes:

- [ ] Run tests for affected platform(s)
- [ ] Verify all tests pass
- [ ] Check coverage hasn't decreased
- [ ] Add tests for new features
- [ ] Update tests for changed behavior
- [ ] Run linter (if configured)

## 🎓 Testing Resources

- [Vitest Documentation](https://vitest.dev/)
- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Swift Testing](https://developer.apple.com/documentation/testing)

## 📧 Questions?

If you have questions about the test suite:
1. Check existing test files for examples
2. Review this documentation
3. Open an issue on GitHub

---

**Last Updated:** 2026-02-20
**Test Coverage:** ~370+ tests across 4 platforms
**Status:** ✅ All platforms covered
