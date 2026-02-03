# Testing Quickstart Guide

**Get started with testing in 5 minutes**

---

## Quick Setup (First Time)

### One Command Setup

```bash
npm run test:setup
```

This automated script will:

1. ✓ Check Docker is running
2. ✓ Start MySQL container
3. ✓ Wait for MySQL to be healthy
4. ✓ Initialize test database
5. ✓ Verify setup is complete

**That's it!** Your test environment is ready.

---

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Unit tests only (fast)
npm run test:unit

# Integration tests only (slower, needs Docker)
npm run test:integration

# Backend unit tests
npm run test:backend

# Frontend unit tests
npm run test:frontend

# End-to-end tests
npm run test:e2e
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Watch Mode (Development)

```bash
npm run test:watch
```

---

## Test Database Management

### Reset Test Database

```bash
npm run test:db:reset
```

### Manual Database Access

```bash
# Connect to MySQL in Docker
docker-compose exec mysql mysql -u root -prootpassword nt_taxoffice_test

# View tables
SHOW TABLES;

# Check data
SELECT * FROM appointments;
SELECT * FROM availability;
```

### Stop Docker Services

```bash
docker-compose down
```

---

## Troubleshooting

### Docker Not Running

**Problem**: `ERROR: Docker is not running`

**Solution**: Start Docker Desktop or Docker daemon

```bash
# Linux
sudo systemctl start docker

# macOS
# Open Docker Desktop app
```

### MySQL Not Starting

**Problem**: MySQL container fails to start

**Solution**: Check if port 3306 is already in use

```bash
# Check what's using port 3306
sudo lsof -i :3306

# Stop conflicting MySQL
sudo systemctl stop mysql  # or: brew services stop mysql
```

### Tests Failing After Setup

**Problem**: Tests fail with database connection errors

**Solution**: Verify MySQL is healthy

```bash
# Check container status
docker-compose ps

# Check MySQL logs
docker-compose logs mysql

# Restart setup
docker-compose down
npm run test:setup
```

### Permission Denied on test-setup.sh

**Problem**: `Permission denied: scripts/test-setup.sh`

**Solution**: Make script executable

```bash
chmod +x scripts/test-setup.sh
```

---

## Understanding Test Output

### Unit Test Output

```
PASS backend tests/unit/middleware/validator.test.js
  Appointment Validator
    validateAppointmentBooking
      ✓ should pass with valid data
      ✓ should fail with invalid email
```

### Integration Test Output

```
PASS backend tests/integration/api/appointments.test.js
  Appointments API Integration Tests
    POST /api/appointments/book
      ✓ should create appointment successfully (1785 ms)
```

### Coverage Report

```
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   68.42 |    65.23 |   72.15 |   68.89 |
 middleware/          |   85.71 |    80.00 |   90.00 |   85.71 |
  validator.js        |   95.00 |    92.30 |  100.00 |   95.00 |
```

---

## Test Structure

```
tests/
├── unit/                   # Fast, isolated tests
│   ├── middleware/         # Middleware tests
│   ├── services/           # Service layer tests
│   └── utils/              # Utility function tests
│
├── integration/            # API endpoint tests
│   └── api/                # API route tests
│       └── appointments.test.js
│
├── helpers/                # Test utilities
│   ├── database.js         # DB helpers
│   ├── fixtures.js         # Test data
│   └── testApp.js          # Express app setup
│
└── setup.js                # Global test setup
```

---

## Writing Your First Test

### Unit Test Example

```javascript
// tests/unit/utils/myUtil.test.js
describe('myFunction', () => {
  test('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Integration Test Example

```javascript
// tests/integration/api/myRoute.test.js
const request = require('supertest');
const { createTestApp } = require('../../helpers/testApp');

describe('My API Tests', () => {
  let app;

  beforeAll(async () => {
    const { initializeDatabase } = require('../../../services/database');
    await initializeDatabase();
    app = createTestApp();
  });

  test('should return 200', async () => {
    const response = await request(app).get('/api/my-endpoint').expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

---

## Best Practices

### ✅ DO

- Run `npm run test:setup` before first test run
- Use `test:watch` during development
- Write tests for new features
- Keep unit tests fast (< 100ms)
- Mock external services (email, APIs)
- Clear database between integration tests
- Use descriptive test names

### ❌ DON'T

- Don't commit with failing tests
- Don't skip test setup
- Don't test implementation details
- Don't make tests depend on each other
- Don't hardcode test data
- Don't test external APIs directly
- Don't commit real credentials

---

## CI/CD Integration

Tests automatically run on:

- Every push to GitHub
- Every pull request
- Before deployment

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
- name: Setup test database
  run: npm run test:setup

- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage
```

---

## Current Test Status

**Unit Tests**: 234/234 passing (100%) ✅
**Integration Tests**: 11/11 passing (100%) ✅
**Total Tests**: 245
**Coverage**: ~68%

---

## Next Steps

1. **Run tests**: `npm run test:setup && npm test`
2. **Read full guide**: [docs/TESTING.md](../TESTING.md)
3. **Understand structure**: [tests/README.md](../../tests/README.md)
4. **Check status**: [TEST_STATUS_SUMMARY.md](TEST_STATUS_SUMMARY.md)

---

## Getting Help

### Documentation

- **Full testing guide**: [docs/TESTING.md](../TESTING.md)
- **Test findings**: [TEST_FINDINGS.md](TEST_FINDINGS.md)
- **Testing plan**: [TESTING_COMPLETION_PLAN.md](TESTING_COMPLETION_PLAN.md)
- **Integration setup**: [INTEGRATION_TESTS_SETUP.md](INTEGRATION_TESTS_SETUP.md)

### Common Commands Reference

```bash
# Setup
npm run test:setup              # First-time setup
npm run test:db:reset          # Reset database

# Running Tests
npm test                       # All tests
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests only
npm run test:coverage          # With coverage report
npm run test:watch             # Watch mode

# Docker Management
docker-compose up -d mysql     # Start MySQL
docker-compose down            # Stop all services
docker-compose logs mysql      # View MySQL logs
docker-compose ps              # Check service status
```

---

**Last Updated**: December 2025
**Status**: Active - Setup automated ✅
**Next**: Run `npm run test:setup` to get started!
