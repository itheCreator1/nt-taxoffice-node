# Testing Guide

Comprehensive testing documentation for the NT TaxOffice appointment booking system.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Infrastructure](#test-infrastructure)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

The project uses a comprehensive testing strategy with multiple layers:

- **Unit Tests**: Test individual functions and modules in isolation
- **Integration Tests**: Test API endpoints with database integration
- **E2E Tests**: Test complete user workflows using Playwright

### Test Framework

- **Jest**: Unit and integration testing
- **Playwright**: End-to-end browser testing
- **Supertest**: HTTP endpoint testing

### Coverage Goals

- **Minimum**: 70% coverage for branches, functions, lines, and statements
- **Target**: 80%+ coverage for critical business logic

---

## Test Structure

```
tests/
├── setup.js                           # Frontend test setup (jsdom)
├── setup-backend.js                   # Backend test setup (node)
├── helpers/
│   ├── database.js                    # Database test utilities
│   ├── fixtures.js                    # Test data factories
│   ├── mocks.js                       # Mock implementations
│   └── testApp.js                     # Test Express app setup
├── unit/
│   ├── utils/
│   │   ├── validation.test.js         # Validation utility tests
│   │   ├── sanitization.test.js       # Sanitization utility tests
│   │   └── timezone.test.js           # Timezone utility tests
│   ├── services/
│   │   └── appointments.test.js       # Appointments service tests
│   └── middleware/
│       └── (middleware tests)
├── integration/
│   ├── api/
│   │   └── appointments.test.js       # Public API integration tests
│   └── admin/
│       ├── auth.test.js               # Admin auth tests (10 tests)
│       ├── appointments.test.js       # Admin appointments tests (26 tests)
│       └── availability.test.js       # Admin availability tests (22 tests)
├── frontend/
│   └── (frontend component tests)
└── e2e/
    └── appointmentBooking.spec.js     # E2E appointment booking test
```

---

## Running Tests

### Prerequisites

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up test environment**:
   ```bash
   cp .env.example .env.test
   ```

3. **Edit `.env.test`** with test database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=nt_taxoffice_test
   DB_PASSWORD=test_password
   DB_NAME=nt_taxoffice_appointments_test
   ```

4. **Create test database**:
   ```bash
   mysql -u root -p
   CREATE DATABASE nt_taxoffice_appointments_test;
   CREATE USER 'nt_taxoffice_test'@'localhost' IDENTIFIED BY 'test_password';
   GRANT ALL PRIVILEGES ON nt_taxoffice_appointments_test.* TO 'nt_taxoffice_test'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Test Commands

**Run all tests**:
```bash
npm test
```

**Run only unit tests (backend + frontend)**:
```bash
npm run test:unit
```

**Run only backend unit tests**:
```bash
npm run test:backend
```

**Run only frontend unit tests**:
```bash
npm run test:frontend
```

**Run integration tests**:
```bash
npm run test:integration
```

**Run admin integration tests only**:
```bash
npm run test:integration -- tests/integration/admin/
```

**Run specific admin test file**:
```bash
npm run test:integration -- tests/integration/admin/appointments.test.js
```

**Run E2E tests**:
```bash
npm run test:e2e
```

**Run all test types**:
```bash
npm run test:all
```

**Watch mode (auto-rerun on changes)**:
```bash
npm run test:watch
```

**Generate coverage report**:
```bash
npm run test:coverage
```

Coverage report will be in `coverage/lcov-report/index.html`.

---

## Test Infrastructure

### Environment Configuration

Tests use a separate `.env.test` file to avoid affecting development/production:

- Test database (isolated from dev database)
- Lower bcrypt rounds (faster tests)
- Relaxed rate limiting
- Mock email sending

### Database Helpers

Located in `/tests/helpers/database.js`:

**Setup test database**:
```javascript
const { setupTestDatabase } = require('./helpers/database');
await setupTestDatabase();
```

**Clear data between tests**:
```javascript
const { clearTestDatabase } = require('./helpers/database');
await clearTestDatabase();
```

**Run raw queries**:
```javascript
const { query } = require('./helpers/database');
const results = await query('SELECT * FROM appointments WHERE id = ?', [1]);
```

### Fixtures and Factories

Located in `/tests/helpers/fixtures.js`:

**Create test appointment data**:
```javascript
const { createAppointmentData } = require('./helpers/fixtures');

const data = createAppointmentData({
    client_email: 'custom@example.com'
});
```

**Create multiple appointments**:
```javascript
const { createMultipleAppointments } = require('./helpers/fixtures');

const appointments = createMultipleAppointments(5); // 5 appointments
```

**Create admin user**:
```javascript
const { createAdminData } = require('./helpers/fixtures');

const admin = await createAdminData({
    username: 'testadmin'
});
// admin._plainPassword contains unhashed password for login tests
```

**Get future working dates**:
```javascript
const { getFutureWorkingDate } = require('./helpers/fixtures');

const date = getFutureWorkingDate(2); // 2 working days ahead
```

### Mocks

Located in `/tests/helpers/mocks.js`:

**Mock Express request/response**:
```javascript
const { createMockRequest, createMockResponse, createMockNext } = require('./helpers/mocks');

const req = createMockRequest({
    body: { name: 'test' },
    params: { id: 1 }
});
const res = createMockResponse();
const next = createMockNext();

await yourMiddleware(req, res, next);

expect(res.json).toHaveBeenCalledWith({ success: true });
```

**Mock database connection**:
```javascript
const { createMockDbPool } = require('./helpers/mocks');

const mockPool = createMockDbPool();
mockPool.query.mockResolvedValueOnce([[{ id: 1 }]]);
```

**Mock email transporter**:
```javascript
const { createMockEmailTransporter } = require('./helpers/mocks');

const transporter = createMockEmailTransporter();
expect(transporter.sendMail).toHaveBeenCalled();
```

---

## Writing Tests

### Unit Test Example

```javascript
// tests/unit/services/myService.test.js

const { createMockDbPool } = require('../../helpers/mocks');
const myService = require('../../../services/myService');

// Mock dependencies
jest.mock('../../../services/database');
const database = require('../../../services/database');

describe('My Service', () => {
    let mockPool;

    beforeEach(() => {
        mockPool = createMockDbPool();
        database.getDb.mockReturnValue(mockPool);
    });

    test('should process data correctly', async () => {
        mockPool.query.mockResolvedValueOnce([[{ id: 1, name: 'Test' }]]);

        const result = await myService.getData(1);

        expect(result).toEqual({ id: 1, name: 'Test' });
        expect(mockPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT'),
            [1]
        );
    });
});
```

### Integration Test Example

```javascript
// tests/integration/api/myRoute.test.js

const request = require('supertest');
const express = require('express');
const { clearTestDatabase } = require('../../helpers/database');

describe('My Route API', () => {
    let app;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        app.use('/api/my-route', require('../../../routes/api/myRoute'));
    });

    beforeEach(async () => {
        await clearTestDatabase();
    });

    test('POST /api/my-route should create resource', async () => {
        const data = { name: 'Test Resource' };

        const response = await request(app)
            .post('/api/my-route')
            .send(data)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.resource.name).toBe('Test Resource');
    });
});
```

### E2E Test Example

```javascript
// tests/e2e/myFeature.spec.js

const { test, expect } = require('@playwright/test');

test.describe('My Feature', () => {
    test('should complete user workflow', async ({ page }) => {
        await page.goto('/my-feature');

        await page.fill('#input-field', 'Test Value');
        await page.click('#submit-button');

        await expect(page.locator('#success-message')).toBeVisible();
        await expect(page.locator('#success-message')).toContainText('Success');
    });
});
```

---

## CI/CD Integration

### GitHub Actions

The project includes a GitHub Actions workflow that:

- Runs on every push and pull request
- Tests on multiple Node.js versions
- Sets up MySQL test database
- Runs unit, integration, and E2E tests
- Generates coverage reports
- Uploads coverage to Codecov (if configured)

Workflow file: `.github/workflows/test.yml`

### Pre-commit Hooks (Optional)

Install Husky for pre-commit testing:

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run test:unit"
```

---

## Troubleshooting

### Test Database Connection Issues

**Error**: `Access denied for user 'nt_taxoffice_test'`

**Solution**:
```bash
mysql -u root -p
GRANT ALL PRIVILEGES ON nt_taxoffice_appointments_test.* TO 'nt_taxoffice_test'@'localhost';
FLUSH PRIVILEGES;
```

### Tests Hanging

**Issue**: Tests don't complete, process hangs

**Causes**:
- Open database connections
- Timers not cleared
- Async operations not awaited

**Solution**:
- Ensure `afterAll` hooks close connections
- Use `jest.setTimeout()` to increase timeout
- Check for unresolved promises

### Port Already in Use (E2E Tests)

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port in .env.test
PORT=3001
```

### Flaky Tests

**Symptoms**: Tests pass sometimes, fail other times

**Common Causes**:
- Race conditions
- Timing issues
- Database state not cleared
- Shared state between tests

**Solutions**:
- Use `clearTestDatabase()` in `beforeEach`
- Avoid shared variables between tests
- Use `waitFor` in async operations
- Mock time-dependent functions

### Mock Not Working

**Issue**: Module changes don't reflect in tests

**Solution**:
```javascript
// Mock BEFORE importing the module
jest.mock('../../../services/database');
const myModule = require('../../../services/myModule');

// Clear mocks between tests
beforeEach(() => {
    jest.clearAllMocks();
});
```

---

## Best Practices

### 1. Test Independence

Each test should be independent and not rely on other tests:

```javascript
beforeEach(async () => {
    await clearTestDatabase();
    // Reset any shared state
});
```

### 2. Descriptive Test Names

Use clear, descriptive test names:

```javascript
// Good
test('should return 404 when appointment not found', ...)

// Bad
test('test 1', ...)
```

### 3. Arrange-Act-Assert Pattern

Structure tests clearly:

```javascript
test('should create appointment', async () => {
    // Arrange
    const data = createAppointmentData();

    // Act
    const result = await appointments.create(data);

    // Assert
    expect(result.id).toBeDefined();
    expect(result.status).toBe('pending');
});
```

### 4. Test Error Cases

Don't just test happy paths:

```javascript
test('should throw error for invalid email', async () => {
    const data = createAppointmentData({ client_email: 'invalid' });

    await expect(appointments.create(data))
        .rejects.toThrow('Invalid email');
});
```

### 5. Mock External Dependencies

Never make real API calls or send real emails in tests:

```javascript
jest.mock('../../../services/email');
jest.mock('../../../services/externalApi');
```

---

## Coverage Reports

### Viewing Coverage

After running `npm run test:coverage`:

```bash
# Open in browser
open coverage/lcov-report/index.html

# Or use terminal
cat coverage/coverage-summary.json
```

### Coverage Badges

Add to README.md:

```markdown
![Coverage](https://img.shields.io/codecov/c/github/yourname/nt-taxoffice-node)
```

---

## Admin Integration Tests

The project includes comprehensive admin integration tests covering authentication, appointment management, and availability settings.

### Test Coverage

- **Admin Authentication** (`tests/integration/admin/auth.test.js`): 10 tests
  - Admin setup, login, logout, session management

- **Admin Appointments** (`tests/integration/admin/appointments.test.js`): 26 tests
  - GET /api/admin/appointments (filtering, pagination, sorting)
  - GET /api/admin/appointments/stats (statistics)
  - GET /api/admin/appointments/:id (details with history)
  - PUT /api/admin/appointments/:id/status (confirm, decline, complete)
  - PUT /api/admin/appointments/:id (update details)
  - DELETE /api/admin/appointments/:id (deletion)

- **Admin Availability** (`tests/integration/admin/availability.test.js`): 22 tests
  - GET /api/admin/availability/settings (retrieve settings)
  - PUT /api/admin/availability/settings (update with validation)
  - GET /api/admin/availability/blocked-dates (future dates)
  - POST /api/admin/availability/blocked-dates (add blocked date)
  - DELETE /api/admin/availability/blocked-dates/:id (remove blocked date)

### Running Admin Tests

```bash
# All admin tests
npm run test:integration -- tests/integration/admin/

# Specific test file
npm run test:integration -- tests/integration/admin/appointments.test.js

# Single test by name
npm run test:integration -- tests/integration/admin/appointments.test.js -t "should get appointments with pagination"
```

### Admin Test Patterns

Admin tests use session-based authentication:

```javascript
// Create admin and login
await request(app)
    .post('/api/admin/setup')
    .send({
        username: 'admin',
        email: 'admin@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
    });

agent = request.agent(app);
await agent
    .post('/api/admin/login')
    .send({
        username: 'admin',
        password: 'SecurePass123!'
    });

// Now agent maintains session cookies
await agent.get('/api/admin/appointments').expect(200);
```

**Learn More**: See [Admin Testing Guide](./admin-testing.md) for comprehensive admin testing documentation.

---

## Further Reading

- [Admin Testing Guide](./admin-testing.md) - Detailed guide for admin integration tests
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## Support

If you encounter issues with testing:

1. Check this documentation
2. Review existing test files for examples
3. Check test output for detailed error messages
4. Ensure test database is properly configured
5. Verify all dependencies are installed

---

**Last Updated**: December 2025
