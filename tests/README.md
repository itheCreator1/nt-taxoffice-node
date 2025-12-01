# Tests Directory

This directory contains all automated tests for the NT TaxOffice appointment booking system.

## Quick Start

```bash
# Install dependencies
npm install

# Install supertest for integration tests
npm install --save-dev supertest

# Set up test database
cp .env.example .env.test
# Edit .env.test with test database credentials

# Create test database
mysql -u root -p
CREATE DATABASE nt_taxoffice_appointments_test;
CREATE USER 'nt_taxoffice_test'@'localhost' IDENTIFIED BY 'test_password';
GRANT ALL PRIVILEGES ON nt_taxoffice_appointments_test.* TO 'nt_taxoffice_test'@'localhost';
FLUSH PRIVILEGES;

# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## Directory Structure

```
tests/
├── README.md (this file)
├── setup.js                     # Frontend test setup
├── setup-backend.js             # Backend test setup
│
├── helpers/                     # Test utilities
│   ├── database.js              # Database helpers
│   ├── fixtures.js              # Test data factories
│   └── mocks.js                 # Mock implementations
│
├── unit/                        # Unit tests
│   ├── utils/
│   │   ├── validation.test.js
│   │   ├── sanitization.test.js
│   │   └── timezone.test.js
│   ├── services/
│   │   └── appointments.test.js
│   └── middleware/
│
├── integration/                 # Integration tests
│   └── api/
│       └── appointments.test.js
│
├── frontend/                    # Frontend tests
│   └── (frontend component tests)
│
└── e2e/                        # E2E tests
    └── appointmentBooking.spec.js
```

## Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all Jest tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests |
| `npm run test:backend` | Run backend tests only |
| `npm run test:frontend` | Run frontend tests only |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:all` | Run all test types |
| `npm run test:watch` | Run in watch mode |
| `npm run test:coverage` | Generate coverage report |

## Test Types

### Unit Tests (`/tests/unit/`)

Test individual functions and modules in isolation. Use mocks for dependencies.

**Example**:
```javascript
const { isValidEmail } = require('../../utils/validation');

test('should validate email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
});
```

### Integration Tests (`/tests/integration/`)

Test API endpoints with real database integration.

**Example**:
```javascript
const request = require('supertest');

test('POST /api/appointments/book', async () => {
    const response = await request(app)
        .post('/api/appointments/book')
        .send(appointmentData)
        .expect(201);
});
```

### E2E Tests (`/tests/e2e/`)

Test complete user workflows in a browser using Playwright.

**Example**:
```javascript
test('should book appointment', async ({ page }) => {
    await page.goto('/appointments.html');
    await page.fill('#client_email', 'test@example.com');
    await page.click('#submit-booking');
    await expect(page.locator('#success')).toBeVisible();
});
```

## Test Helpers

### Database Helpers

```javascript
const { clearTestDatabase, query } = require('./helpers/database');

// Clear all data
await clearTestDatabase();

// Run custom query
const results = await query('SELECT * FROM appointments');
```

### Fixtures

```javascript
const { createAppointmentData, getFutureWorkingDate } = require('./helpers/fixtures');

// Create test data
const appointment = createAppointmentData({
    appointment_date: getFutureWorkingDate(2)
});
```

### Mocks

```javascript
const { createMockRequest, createMockResponse } = require('./helpers/mocks');

const req = createMockRequest({ body: { name: 'test' } });
const res = createMockResponse();
```

## Coverage Threshold

The project requires minimum coverage of:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

View coverage report: `open coverage/lcov-report/index.html`

## CI/CD

Tests run automatically on:
- Every push to `main` or `develop` branches
- Every pull request
- Multiple Node.js versions (18.x, 20.x)

See [.github/workflows/test.yml](../.github/workflows/test.yml)

## Troubleshooting

**Database connection issues**:
- Verify `.env.test` configuration
- Ensure test database exists
- Check user permissions

**Tests hanging**:
- Close database connections in `afterAll` hooks
- Clear timers and intervals
- Check for unresolved promises

**Flaky tests**:
- Use `clearTestDatabase()` in `beforeEach`
- Avoid shared state between tests
- Mock time-dependent functions

## Documentation

For detailed testing documentation, see [docs/TESTING.md](../docs/TESTING.md)

## Writing New Tests

1. **Choose test type**: Unit, integration, or E2E
2. **Create test file**: Follow naming convention `*.test.js` or `*.spec.js`
3. **Use helpers**: Leverage fixtures and mocks
4. **Follow patterns**: See existing tests for examples
5. **Run tests**: Verify your tests pass
6. **Check coverage**: Ensure new code is covered

## Best Practices

✅ **DO**:
- Write descriptive test names
- Test both success and error cases
- Use fixtures for test data
- Mock external dependencies
- Clear database between tests
- Follow Arrange-Act-Assert pattern

❌ **DON'T**:
- Share state between tests
- Make real API calls
- Send real emails
- Depend on test execution order
- Test implementation details
- Commit `.env.test` with secrets

---

**Questions?** See [docs/TESTING.md](../docs/TESTING.md) for comprehensive documentation.
