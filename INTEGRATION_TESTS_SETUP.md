# Integration Tests Setup Guide

## ✅ What's Been Completed

### 1. Test Database Setup
- ✅ MySQL Docker container configured and running
- ✅ Test database initialization script created ([scripts/init-test-db.js](scripts/init-test-db.js))
- ✅ `.env.test` configured to use Docker MySQL (root/rootpassword)
- ✅ Database schema automatically created in `nt_taxoffice_test`

### 2. Test Infrastructure
- ✅ Test Express app helper created ([tests/helpers/testApp.js](tests/helpers/testApp.js))
- ✅ Email queue mock created ([services/__mocks__/emailQueue.js](services/__mocks__/emailQueue.js))
- ✅ Integration test file created with 11 tests ([tests/integration/api/appointments.test.js](tests/integration/api/appointments.test.js))
- ✅ npm scripts added (`test:db:init`, `test:db:reset`, `test:integration`)

### 3. Current Test Status
```
✓ 3 passing tests (validation tests)
✗ 8 failing tests (booking/retrieval tests)
```

**Passing Tests:**
- ✅ Should reject appointment with invalid email
- ✅ Should reject appointment with invalid phone
- ✅ Should reject missing required fields

**Failing Tests:**
- ❌ Should create appointment successfully
- ❌ Should reject duplicate booking for same slot
- ❌ Should return appointment by valid token
- ❌ Should return 404 for invalid token
- ❌ Should reject token with invalid format
- ❌ Should cancel appointment successfully
- ❌ Should return 404 for non-existent token
- ❌ Should not allow cancelling already cancelled appointment

## 🔧 Known Issues

### Issue 1: Response Body Missing `appointment` Field
**Problem**: Tests expect `response.body.appointment` but it's `undefined`

**Likely Cause**: The API response format may differ from test expectations

**Investigation Needed**:
1. Check actual API response format in [routes/api/appointments.js](routes/api/appointments.js)
2. Update test expectations to match actual response structure
3. Verify the booking endpoint returns the correct format

### Issue 2: Test Data / Date Issues
**Problem**: Appointments may be rejected due to:
- Dates falling on non-working days
- Times outside working hours
- Dates beyond booking window

**Solution**: Use `getFutureWorkingDate()` helper that generates valid dates based on availability settings

### Issue 3: Database State Between Tests
**Problem**: Tests may be interfering with each other

**Current Setup**: `clearTestDatabase()` runs before each test in `beforeEach()`

**Verification Needed**: Ensure database is actually being cleared between tests

## 🚀 How to Run Integration Tests

### Start MySQL Container
```bash
docker-compose up -d mysql
```

### Initialize Test Database
```bash
npm run test:db:init
```

### Run Integration Tests
```bash
npm run test:integration
```

### Reset Test Database
```bash
npm run test:db:reset
```

## 📝 Next Steps to Fix Integration Tests

### Step 1: Investigate API Response Format
```javascript
// Add logging to see actual response
console.log('Response body:', JSON.stringify(response.body, null, 2));
console.log('Response status:', response.status);
```

### Step 2: Verify Database Connection
```javascript
// In beforeAll, verify database is accessible
const [rows] = await query('SELECT 1');
console.log('Database connected:', rows);
```

### Step 3: Check Availability Settings
```javascript
// Verify working days exist in test database
const [settings] = await query('SELECT * FROM availability_settings WHERE is_working_day = 1');
console.log('Working days:', settings);
```

### Step 4: Fix Test Data Generation
```javascript
// Ensure getFutureWorkingDate() returns a valid date
const date = getFutureWorkingDate(2);
console.log('Generated date:', date);

// Verify the date is a working day
const [availability] = await query(
    'SELECT * FROM availability_settings WHERE day_of_week = DAYOFWEEK(?) - 1',
    [date]
);
console.log('Date availability:', availability);
```

### Step 5: Update Test Expectations
Once you determine the actual response format, update tests:
```javascript
// Instead of:
expect(response.body.appointment).toMatchObject({ ... });

// Maybe it should be:
expect(response.body.data).toMatchObject({ ... });
// or
expect(response.body).toMatchObject({ ... });
```

## 📋 Integration Test Checklist

- [x] MySQL Docker container running
- [x] Test database created
- [x] Test database schema initialized
- [x] Test database helper functions created
- [x] Email queue mocked
- [x] Test Express app configured
- [x] Integration test file created
- [ ] Response format verified
- [ ] Test data generation fixed
- [ ] All 11 tests passing
- [ ] Database cleanup verified

## 🎯 Expected Final Result

Once fixed, you should see:
```
PASS backend tests/integration/api/appointments.test.js
  Appointments API Integration Tests
    POST /api/appointments/book
      ✓ should create appointment successfully
      ✓ should reject appointment with invalid email
      ✓ should reject appointment with invalid phone
      ✓ should reject duplicate booking for same slot
      ✓ should reject missing required fields
    GET /api/appointments/:token
      ✓ should return appointment by valid token
      ✓ should return 404 for invalid token
      ✓ should reject token with invalid format
    DELETE /api/appointments/cancel/:token
      ✓ should cancel appointment successfully
      ✓ should return 404 for non-existent token
      ✓ should not allow cancelling already cancelled appointment

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MySQL Docker Image](https://hub.docker.com/_/mysql)
- [Express Testing Guide](https://expressjs.com/en/advanced/best-practice-testing.html)

---

**Created**: December 2025
**Status**: Integration tests created, 3/11 passing, needs debugging
**Next Task**: Investigate response format and fix remaining 8 tests
