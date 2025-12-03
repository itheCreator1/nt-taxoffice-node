# Testing Guide - NT TaxOffice Node

Comprehensive guide for writing fast, maintainable tests in this project.

## Table of Contents

- [Quick Start](#quick-start)
- [Test Organization](#test-organization)
- [Running Tests](#running-tests)
- [Test Utilities](#test-utilities)
- [Best Practices](#best-practices)
- [Performance Tips](#performance-tips)

---

## Quick Start

### Install Dependencies
```bash
npm install
```

### Setup Test Database
```bash
npm run test:setup
```

### Run Tests
```bash
# All tests (sequential, for CI)
npm test

# Fast parallel execution (for development)
npm run test:parallel

# Specific test suites
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:fast         # Fast unit tests in parallel
```

---

## Test Organization

```
tests/
├── unit/                    # Unit tests (fast, isolated)
│   ├── services/           # Service layer tests
│   ├── middleware/         # Middleware tests
│   └── utils/              # Utility function tests
├── integration/            # Integration tests (with database)
│   ├── api/               # Public API tests
│   └── admin/             # Admin API tests
├── e2e/                    # End-to-end tests (Playwright)
└── helpers/                # Test utilities
    ├── builders/          # Test data builders
    ├── customMatchers.js  # Custom Jest matchers
    ├── database.js        # Database helpers
    ├── fixtures.js        # Test data fixtures
    ├── seeders.js         # Database seeders
    ├── testDatabase.js    # Shared connection pool
    ├── transactionHelper.js  # Transaction isolation
    └── performanceMonitor.js # Performance tracking
```

---

## Running Tests

### Development Workflow
```bash
# Fast feedback loop - unit tests only
npm run test:fast

# Watch mode for TDD
npm run test:watch

# Specific test file
npm test -- appointments.test.js

# Specific test pattern
npm test -- --testNamePattern="should create appointment"
```

### CI/CD Workflow
```bash
# Sequential execution (stable for CI)
npm test

# With coverage report
npm run test:coverage

# All tests including E2E
npm run test:all
```

### Test Categories
```bash
npm run test:unit          # All unit tests
npm run test:integration   # All integration tests
npm run test:admin         # Admin API tests only
npm run test:api           # Public API tests only
npm run test:services      # Service unit tests
npm run test:e2e           # E2E tests with Playwright
```

---

## Test Utilities

### 1. Test Data Builders (Fluent API)

Build test data with a readable, chainable API.

#### AppointmentBuilder
```javascript
const { AppointmentBuilder } = require('../helpers/builders');

// Simple appointment
const appointment = new AppointmentBuilder()
    .withName('Γιάννης Παπαδόπουλος')
    .onDate('2025-12-15')
    .atTime('14:00:00')
    .forTaxReturn()
    .build();

// Random appointment
const randomAppointment = new AppointmentBuilder()
    .onRandomFutureDate()
    .atRandomTime()
    .forConsultation()
    .build();

// Bulk appointments
const appointments = new AppointmentBuilder()
    .forBookkeeping()
    .buildMany(10);
```

#### AdminBuilder
```javascript
const { AdminBuilder } = require('../helpers/builders');

const admin = new AdminBuilder()
    .withUsername('admin')
    .withPassword('SecurePass123!')
    .withGreekEmail()
    .build();
```

### 2. Database Seeders

Fast database population for tests.

```javascript
const {
    seedAdminUser,
    seedAppointments,
    seedFullyBookedDay,
    seedBlockedDates
} = require('../helpers/seeders');

// Create admin user (bypasses HTTP, much faster)
const admin = await seedAdminUser({
    username: 'admin',
    password: 'SecurePass123!',
    email: 'admin@example.com'
});

// Seed 10 appointments
const appointmentIds = await seedAppointments(10);

// Create fully booked day
await seedFullyBookedDay('2025-12-20', '09:00:00', '17:00:00');

// Add blocked dates
await seedBlockedDates([
    { date: '2025-12-25', reason: 'Christmas', all_day: true },
    { date: '2025-01-01', reason: 'New Year', all_day: true }
]);
```

### 3. Custom Jest Matchers

Domain-specific assertions for clearer tests.

```javascript
// Appointment validation
expect(appointment).toBeValidAppointment();

// Database assertions
expect(appointmentId).toExistInDatabase();
expect(appointmentId).toHaveStatusInDatabase('confirmed');

// API response assertions
expect(response).toIndicateSuccess();
expect(response).toIndicateError();

// Domain-specific validations
expect('6912345678').toBeValidGreekPhone();
expect('2025-12-15').toBeWorkingDay();
expect(appointment).toMatchAppointmentSchema();
```

### 4. Transaction-Based Test Isolation

Fast test isolation using database transactions (10-20x faster than truncate).

```javascript
const { withTransaction } = require('../helpers/transactionHelper');

test('should create appointment', async () => {
    await withTransaction(async (tx) => {
        // All queries within this block use the transaction
        await tx.query('INSERT INTO appointments (...) VALUES (...)', []);

        const [rows] = await tx.query('SELECT * FROM appointments WHERE id = ?', [1]);
        expect(rows.length).toBe(1);

        // Transaction automatically rolls back after test
    });
});
```

**For entire test suites:**
```javascript
const { describeWithTransactions } = require('../helpers/transactionHelper');

describeWithTransactions('Appointment Service', () => {
    // All tests automatically use transactions

    test('should create appointment', async () => {
        const db = getDb();
        await db.query('INSERT INTO appointments (...) VALUES (...)', []);
        // Automatically rolled back
    });
});
```

### 5. Performance Monitoring

Automatically tracks and reports slow tests.

```javascript
// Performance monitoring is enabled by default
// Disable with: DISABLE_PERF_MONITOR=true npm test

// Export performance data for analysis
const { exportPerformanceData } = require('../helpers/performanceMonitor');
exportPerformanceData('./test-performance.json');
```

**Performance Report Example:**
```
📊 TEST PERFORMANCE REPORT
================================================================================
Total Tests: 105
Total Time: 224.34s
Average: 2137ms per test
Slowest: 63403ms

🔴 VERY SLOW TESTS (>3000ms):
  1. 63403ms - Admin Appointments API › PUT /api/admin/appointments/:id
  2. 46512ms - Admin Auth API › POST /api/admin/login

💡 OPTIMIZATION SUGGESTIONS:
  • Admin tests are slow - consider using seedAdminUser() instead of HTTP
  • Database tests are slow - consider transaction-based isolation
```

### 6. Shared Connection Pool

Efficient database connection management.

```javascript
const { getTestDatabase } = require('../helpers/testDatabase');

beforeAll(async () => {
    // Initialize shared pool once
    await getTestDatabase();
});

// All tests share the same connection pool
// No need to create separate pools per file
```

---

## Best Practices

### ✅ DO

1. **Use Builders for Test Data**
   ```javascript
   // Good
   const appointment = new AppointmentBuilder()
       .onDate('2025-12-15')
       .forTaxReturn()
       .build();

   // Avoid
   const appointment = {
       client_name: 'John Doe',
       client_email: 'john@example.com',
       // ... hardcoded fields
   };
   ```

2. **Use Seeders for Database Setup**
   ```javascript
   // Good - Direct DB insert (fast)
   const admin = await seedAdminUser();

   // Avoid - HTTP requests (slow)
   await request(app).post('/api/admin/setup').send({...});
   ```

3. **Use Custom Matchers**
   ```javascript
   // Good - Expressive
   expect(response).toIndicateSuccess();
   expect(appointmentId).toExistInDatabase();

   // Avoid - Verbose
   expect(response.body.success).toBe(true);
   const [rows] = await db.query('SELECT * FROM appointments WHERE id = ?', [id]);
   expect(rows.length).toBeGreaterThan(0);
   ```

4. **Use Transactions for Unit Tests**
   ```javascript
   // Good - Fast rollback
   await withTransaction(async (tx) => {
       await tx.query('INSERT ...');
       // Automatically rolled back
   });

   // Avoid - Slow truncate
   beforeEach(async () => {
       await clearTestDatabase();
   });
   ```

5. **Keep Tests Independent**
   ```javascript
   // Good
   test('test 1', async () => {
       const appointment = await seedAppointments(1);
       // ... test logic
   });

   // Avoid - Tests depend on execution order
   let sharedAppointmentId;
   test('test 1', async () => {
       sharedAppointmentId = await createAppointment();
   });
   test('test 2', async () => {
       await updateAppointment(sharedAppointmentId); // Depends on test 1!
   });
   ```

### ❌ DON'T

1. **Don't create redundant database connections**
2. **Don't use HTTP for test setup when direct DB is faster**
3. **Don't hardcode test data - use builders or faker**
4. **Don't forget to clean up after tests**
5. **Don't write slow tests without justification**

---

## Performance Tips

### 🚀 Speed Optimization Strategies

#### 1. Use Shared Connection Pool
- **Benefit**: Eliminates connection overhead (1-2s saved)
- **Already implemented** via `getTestDatabase()`

#### 2. Use Seeders Instead of HTTP
- **Benefit**: 10-20x faster than full HTTP requests
- **Example**: `seedAdminUser()` vs HTTP `/api/admin/setup`

#### 3. Share Admin Sessions
- **Benefit**: Reduces bcrypt operations from 70+ to ~5
- **Already implemented** in admin test files

#### 4. Use Transaction Isolation for Unit Tests
- **Benefit**: 10-20x faster than truncating tables
- **Usage**: `withTransaction()` or `describeWithTransactions()`

#### 5. Run Tests in Parallel
```bash
# Development: Fast parallel execution
npm run test:parallel

# CI: Stable sequential execution
npm test
```

#### 6. Use Test Splitting
```bash
# Run only fast tests during development
npm run test:fast

# Run specific test suites
npm run test:admin
npm run test:api
```

### Performance Benchmarks

| Optimization | Before | After | Savings |
|--------------|--------|-------|---------|
| Shared Connection Pool | 5+ pool creations | 1 shared pool | 1-2s |
| Seeders vs HTTP | ~200ms per setup | ~20ms per setup | 10x faster |
| Shared Admin Sessions | 70+ bcrypt ops | 5 bcrypt ops | 10-14s |
| Transaction Isolation | 50-100ms per test | 5-10ms per test | 10-20x |
| Parallel Execution | Sequential | 4 workers | 30-50% faster |

---

## Troubleshooting

### Tests are slow
1. Enable performance monitoring (already enabled by default)
2. Check the performance report for slow tests
3. Use transaction isolation for unit tests
4. Use seeders instead of HTTP for test setup
5. Run tests in parallel: `npm run test:parallel`

### Database connection errors
1. Ensure MySQL is running: `docker-compose up -d`
2. Initialize test database: `npm run test:db:init`
3. Check `.env.test` configuration
4. Run setup script: `npm run test:setup`

### Tests fail randomly
1. Check for shared state between tests
2. Ensure each test is independent
3. Use `beforeEach` for test setup, not `beforeAll`
4. Check for race conditions in parallel execution

### Performance monitor not showing
1. Check if disabled: `DISABLE_PERF_MONITOR=true`
2. Ensure tests are actually slow (>1s)
3. Check console output at end of test suite

---

## Advanced Usage

### Export Performance Data
```javascript
const { exportPerformanceData } = require('./helpers/performanceMonitor');

afterAll(() => {
    exportPerformanceData('./reports/test-performance.json');
});
```

### Custom Test Database per Worker
For true parallel integration tests (advanced):
```javascript
// Use JEST_WORKER_ID to create separate databases
const workerDB = `taxoffice_test_w${process.env.JEST_WORKER_ID}`;
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload performance report
  uses: actions/upload-artifact@v2
  with:
    name: test-performance
    path: test-performance.json
```

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Faker.js Documentation](https://fakerjs.dev/)
- [Playwright Documentation](https://playwright.dev/)

---

## Contributing

When adding new tests:
1. Use test builders for data generation
2. Use seeders for database setup
3. Add custom matchers for domain logic
4. Keep tests fast (<1s if possible)
5. Ensure tests are independent
6. Check performance report for regressions

---

**Last Updated**: 2025-12-03
**Version**: 2.0.0 (with Phase 1, 2, 3 optimizations)
