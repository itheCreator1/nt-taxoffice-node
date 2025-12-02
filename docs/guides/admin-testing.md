# Admin Integration Testing Guide

Comprehensive guide for testing admin functionality in the NT TaxOffice appointment booking system.

## Table of Contents

- [Overview](#overview)
- [Running Admin Tests](#running-admin-tests)
- [Test Structure](#test-structure)
- [Authentication Patterns](#authentication-patterns)
- [Testing Admin Endpoints](#testing-admin-endpoints)
- [Common Test Patterns](#common-test-patterns)
- [Writing New Admin Tests](#writing-new-admin-tests)
- [Troubleshooting](#troubleshooting)

---

## Overview

Admin integration tests verify the protected admin API endpoints that manage appointments, availability settings, and blocked dates. These tests ensure proper authentication, authorization, data validation, and database operations.

### Test Coverage

**Admin Authentication** (`tests/integration/admin/auth.test.js`):
- 10 tests covering admin setup, login, logout, and session management

**Admin Appointments** (`tests/integration/admin/appointments.test.js`):
- 26 tests covering appointment management (CRUD operations, filtering, statistics)

**Admin Availability** (`tests/integration/admin/availability.test.js`):
- 22 tests covering availability settings and blocked dates management

**Total**: 58 admin integration tests

---

## Running Admin Tests

### Run All Admin Tests

```bash
npm run test:integration -- tests/integration/admin/
```

### Run Specific Admin Test Files

**Authentication tests**:
```bash
npm run test:integration -- tests/integration/admin/auth.test.js
```

**Appointments tests**:
```bash
npm run test:integration -- tests/integration/admin/appointments.test.js
```

**Availability tests**:
```bash
npm run test:integration -- tests/integration/admin/availability.test.js
```

### Run Single Test

```bash
npm run test:integration -- tests/integration/admin/appointments.test.js -t "should get appointments with pagination"
```

### Watch Mode

```bash
npm run test:integration -- tests/integration/admin/ --watch
```

---

## Test Structure

All admin integration tests follow a consistent structure:

```javascript
const request = require('supertest');
const { clearTestDatabase } = require('../../helpers/database');
const { createTestApp } = require('../../helpers/testApp');

jest.mock('../../../services/emailQueue');

describe('Admin Feature Tests', () => {
    let app;
    let agent;  // Authenticated agent

    beforeAll(async () => {
        const { initializeDatabase } = require('../../../services/database');
        await initializeDatabase();
        app = createTestApp();
    });

    beforeEach(async () => {
        await clearTestDatabase();

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
    });

    describe('GET /api/admin/feature', () => {
        test('should perform action successfully', async () => {
            const response = await agent
                .get('/api/admin/feature')
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .get('/api/admin/feature')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
```

### Key Components

1. **App Setup**: Create test app in `beforeAll`
2. **Database Cleanup**: Clear database in `beforeEach`
3. **Admin Creation**: Set up admin account for each test
4. **Agent**: Use `request.agent(app)` to maintain session cookies
5. **Mock External Services**: Mock email queue and other external dependencies

---

## Authentication Patterns

### Creating an Authenticated Agent

```javascript
// Create admin account
await request(app)
    .post('/api/admin/setup')
    .send({
        username: 'admin',
        email: 'admin@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
    });

// Create agent and login
agent = request.agent(app);
await agent
    .post('/api/admin/login')
    .send({
        username: 'admin',
        password: 'SecurePass123!'
    });

// Now agent maintains session cookies for all requests
```

### Testing Authentication Requirements

Every admin endpoint should include an authentication test:

```javascript
test('should require authentication', async () => {
    const response = await request(app)  // NOT using agent
        .get('/api/admin/protected-endpoint')
        .expect(401);

    expect(response.body.success).toBe(false);
});
```

### Testing Authorization

```javascript
test('should reject non-admin users', async () => {
    // This would be used if we had role-based access control
    const response = await normalUserAgent
        .get('/api/admin/endpoint')
        .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('unauthorized');
});
```

---

## Testing Admin Endpoints

### Admin Appointments

#### GET /api/admin/appointments

**Purpose**: Retrieve appointments with filtering, pagination, and sorting

**Key Test Cases**:
```javascript
// Pagination
test('should get appointments with pagination', async () => {
    // Create 15 appointments
    const db = getDb();
    for (let i = 0; i < 15; i++) {
        await db.query(
            `INSERT INTO appointments (/* fields */) VALUES (/* values */)`
        );
    }

    const response = await agent
        .get('/api/admin/appointments?page=1&limit=10')
        .expect(200);

    expect(response.body.data.appointments).toHaveLength(10);
    expect(response.body.data.pagination.total).toBe(15);
    expect(response.body.data.pagination.totalPages).toBe(2);
});

// Filtering by status
test('should filter by status', async () => {
    // Create appointments with different statuses
    // Query with status filter
    const response = await agent
        .get('/api/admin/appointments?status=pending')
        .expect(200);

    response.body.data.appointments.forEach(apt => {
        expect(apt.status).toBe('pending');
    });
});

// Search functionality
test('should search by client name', async () => {
    const response = await agent
        .get('/api/admin/appointments?search=John')
        .expect(200);

    response.body.data.appointments.forEach(apt => {
        expect(
            apt.client_name.includes('John') ||
            apt.client_email.includes('John') ||
            apt.client_phone.includes('John')
        ).toBe(true);
    });
});
```

#### GET /api/admin/appointments/stats

**Purpose**: Get appointment statistics (counts by status, upcoming, today, this month)

**Key Test Cases**:
```javascript
test('should return statistics', async () => {
    // Create appointments with various statuses and dates
    const db = getDb();
    await db.query(/* Insert 5 pending appointments */);
    await db.query(/* Insert 3 confirmed appointments */);
    await db.query(/* Insert 2 for today */);

    const response = await agent
        .get('/api/admin/appointments/stats')
        .expect(200);

    expect(response.body.data.statusCounts.pending).toBe(5);
    expect(response.body.data.statusCounts.confirmed).toBe(3);
    expect(response.body.data.todayCount).toBe(2);
});
```

#### PUT /api/admin/appointments/:id/status

**Purpose**: Update appointment status (confirm, decline, complete)

**Key Test Cases**:
```javascript
// Successful status change
test('should confirm appointment', async () => {
    const [result] = await db.query(
        `INSERT INTO appointments (/* fields */) VALUES (/* values */)`
    );
    const appointmentId = result.insertId;

    const response = await agent
        .put(`/api/admin/appointments/${appointmentId}/status`)
        .send({ status: 'confirmed' })
        .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.newStatus).toBe('confirmed');

    // Verify in database
    const [rows] = await db.query(
        'SELECT status FROM appointments WHERE id = ?',
        [appointmentId]
    );
    expect(rows[0].status).toBe('confirmed');
});

// Validation - decline requires reason
test('should require decline reason', async () => {
    const response = await agent
        .put(`/api/admin/appointments/${appointmentId}/status`)
        .send({ status: 'declined' })  // No decline_reason
        .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('λόγο απόρριψης');
});

// History tracking
test('should record status change in history', async () => {
    await agent
        .put(`/api/admin/appointments/${appointmentId}/status`)
        .send({ status: 'confirmed' });

    const [history] = await db.query(
        'SELECT * FROM appointment_history WHERE appointment_id = ?',
        [appointmentId]
    );
    expect(history).toHaveLength(1);
    expect(history[0].old_status).toBe('pending');
    expect(history[0].new_status).toBe('confirmed');
});
```

#### PUT /api/admin/appointments/:id

**Purpose**: Update appointment details (date, time, client info)

**Key Test Cases**:
```javascript
// Update date and time
test('should update appointment date and time', async () => {
    const response = await agent
        .put(`/api/admin/appointments/${appointmentId}`)
        .send({
            appointment_date: '2025-12-20',
            appointment_time: '14:00:00'
        })
        .expect(200);

    // Verify in database
    const [rows] = await db.query(
        'SELECT appointment_date, appointment_time FROM appointments WHERE id = ?',
        [appointmentId]
    );
    expect(rows[0].appointment_date).toBe('2025-12-20');
    expect(rows[0].appointment_time).toBe('14:00:00');
});

// Conflict detection
test('should reject update if slot is taken', async () => {
    // Create conflicting appointment
    await db.query(
        `INSERT INTO appointments (appointment_date, appointment_time, status)
         VALUES ('2025-12-20', '14:00:00', 'confirmed')`
    );

    const response = await agent
        .put(`/api/admin/appointments/${appointmentId}`)
        .send({
            appointment_date: '2025-12-20',
            appointment_time: '14:00:00'
        })
        .expect(409);

    expect(response.body.message).toContain('δεν είναι διαθέσιμη');
});
```

#### DELETE /api/admin/appointments/:id

**Purpose**: Delete appointment (hard delete for GDPR compliance)

**Key Test Cases**:
```javascript
test('should delete appointment and history', async () => {
    // Create appointment with history
    const [result] = await db.query(/* Insert appointment */);
    const appointmentId = result.insertId;
    await db.query(/* Insert history record */);

    const response = await agent
        .delete(`/api/admin/appointments/${appointmentId}`)
        .expect(200);

    // Verify deletion
    const [appointments] = await db.query(
        'SELECT * FROM appointments WHERE id = ?',
        [appointmentId]
    );
    expect(appointments).toHaveLength(0);

    const [history] = await db.query(
        'SELECT * FROM appointment_history WHERE appointment_id = ?',
        [appointmentId]
    );
    expect(history).toHaveLength(0);
});
```

### Admin Availability

#### GET /api/admin/availability/settings

**Purpose**: Get availability settings for all 7 days

**Key Test Cases**:
```javascript
test('should return availability for all 7 days', async () => {
    const response = await agent
        .get('/api/admin/availability/settings')
        .expect(200);

    expect(response.body.data.days).toHaveLength(7);
    expect(response.body.data.days[0]).toHaveProperty('day_of_week');
    expect(response.body.data.days[0]).toHaveProperty('is_working_day');
    expect(response.body.data.days[0]).toHaveProperty('start_time');
    expect(response.body.data.days[0]).toHaveProperty('end_time');
});

test('should return days in order (0-6)', async () => {
    const response = await agent
        .get('/api/admin/availability/settings')
        .expect(200);

    const days = response.body.data.days;
    for (let i = 0; i < days.length; i++) {
        expect(days[i].day_of_week).toBe(i);
    }
});
```

#### PUT /api/admin/availability/settings

**Purpose**: Update availability settings for all days

**Key Test Cases**:
```javascript
// Successful update
test('should update availability settings', async () => {
    const settings = {
        days: [
            { day_of_week: 0, is_working_day: false, start_time: null, end_time: null },
            { day_of_week: 1, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
            // ... rest of days
        ]
    };

    const response = await agent
        .put('/api/admin/availability/settings')
        .send(settings)
        .expect(200);

    // Verify in database
    const db = getDb();
    const [rows] = await db.query(
        'SELECT * FROM availability_settings WHERE day_of_week = 1'
    );
    expect(rows[0].is_working_day).toBe(1);
    expect(rows[0].start_time).toBe('09:00:00');
});

// Validation - require all 7 days
test('should require all 7 days', async () => {
    const settings = {
        days: [
            { day_of_week: 0, is_working_day: false, start_time: null, end_time: null },
            { day_of_week: 1, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' }
        ]
    };

    const response = await agent
        .put('/api/admin/availability/settings')
        .send(settings)
        .expect(400);

    expect(response.body.message).toContain('7 ημέρες');
});

// Validation - working day requires hours
test('should reject working day without hours', async () => {
    const settings = {
        days: Array(7).fill(null).map((_, i) => ({
            day_of_week: i,
            is_working_day: i === 1,
            start_time: i === 1 ? null : '09:00:00',  // Day 1 missing start_time
            end_time: i === 1 ? '17:00:00' : '17:00:00'
        }))
    };

    const response = await agent
        .put('/api/admin/availability/settings')
        .send(settings)
        .expect(400);

    expect(response.body.message).toContain('ώρες λειτουργίας');
});
```

#### Blocked Dates Management

**GET /api/admin/availability/blocked-dates**:
```javascript
test('should return only future blocked dates', async () => {
    const db = getDb();
    await db.query(`
        INSERT INTO blocked_dates (blocked_date, reason, created_at)
        VALUES
        ('2025-12-25', 'Christmas', NOW()),
        ('2024-01-01', 'Past date', NOW())
    `);

    const response = await agent
        .get('/api/admin/availability/blocked-dates')
        .expect(200);

    // Should not include past dates
    const dates = response.body.data.map(d => d.blocked_date);
    expect(dates).not.toContain('2024-01-01');
    expect(dates).toContain('2025-12-25');
});
```

**POST /api/admin/availability/blocked-dates**:
```javascript
test('should add blocked date', async () => {
    const response = await agent
        .post('/api/admin/availability/blocked-dates')
        .send({
            blocked_date: '2025-12-25',
            reason: 'Christmas Holiday'
        })
        .expect(201);

    expect(response.body.data).toMatchObject({
        id: expect.any(Number),
        blocked_date: '2025-12-25',
        reason: 'Christmas Holiday'
    });

    // Verify in database
    const db = getDb();
    const [rows] = await db.query(
        'SELECT * FROM blocked_dates WHERE blocked_date = ?',
        ['2025-12-25']
    );
    expect(rows).toHaveLength(1);
});

test('should reject duplicate blocked date', async () => {
    // Add first time
    await agent
        .post('/api/admin/availability/blocked-dates')
        .send({ blocked_date: '2025-12-25', reason: 'First' });

    // Try to add again
    const response = await agent
        .post('/api/admin/availability/blocked-dates')
        .send({ blocked_date: '2025-12-25', reason: 'Second' })
        .expect(409);

    expect(response.body.message).toContain('ήδη αποκλεισμένη');
});
```

**DELETE /api/admin/availability/blocked-dates/:id**:
```javascript
test('should remove blocked date', async () => {
    const db = getDb();
    const [result] = await db.query(`
        INSERT INTO blocked_dates (blocked_date, reason, created_at)
        VALUES ('2025-12-25', 'Christmas', NOW())
    `);
    const blockedDateId = result.insertId;

    const response = await agent
        .delete(`/api/admin/availability/blocked-dates/${blockedDateId}`)
        .expect(200);

    // Verify deletion
    const [rows] = await db.query(
        'SELECT * FROM blocked_dates WHERE id = ?',
        [blockedDateId]
    );
    expect(rows).toHaveLength(0);
});
```

---

## Common Test Patterns

### Database Verification

Always verify critical operations in the database:

```javascript
// After creating/updating
const [rows] = await db.query('SELECT * FROM table WHERE id = ?', [id]);
expect(rows[0].field).toBe(expectedValue);

// After deleting
const [rows] = await db.query('SELECT * FROM table WHERE id = ?', [id]);
expect(rows).toHaveLength(0);
```

### Greek Language Messages

Verify Greek language messages in responses:

```javascript
expect(response.body.message).toContain('επιτυχώς');  // Successfully
expect(response.body.message).toContain('δεν βρέθηκε');  // Not found
expect(response.body.message).toContain('υποχρεωτική');  // Required
```

### Email Queue Verification

Email queue is mocked in tests:

```javascript
jest.mock('../../../services/emailQueue');

// In test
const { queueEmail } = require('../../../services/emailQueue');

// After operation that should queue email
expect(queueEmail).toHaveBeenCalledWith(
    'appointment-confirmed',
    'client@example.com',
    expect.objectContaining({
        id: appointmentId
    })
);
```

### Transaction Testing

Verify that operations are atomic:

```javascript
test('should rollback on conflict', async () => {
    // Create conflicting state
    // Attempt operation that should fail
    const response = await agent
        .put('/api/admin/appointments/1')
        .send({ /* conflicting data */ })
        .expect(409);

    // Verify no partial changes in database
    const [rows] = await db.query('SELECT * FROM appointments WHERE id = 1');
    expect(rows[0].field).toBe(originalValue);  // Should be unchanged
});
```

### Optimistic Locking

Test version conflicts:

```javascript
test('should handle concurrent updates', async () => {
    // Get appointment
    const [rows] = await db.query('SELECT * FROM appointments WHERE id = 1');
    const currentVersion = rows[0].version;

    // Simulate concurrent update
    await db.query(
        'UPDATE appointments SET status = ?, version = version + 1 WHERE id = 1',
        ['confirmed']
    );

    // Try to update with old version (should fail)
    const response = await agent
        .put('/api/admin/appointments/1')
        .send({ /* update data */ });

    // Should detect version conflict
    // (Implementation depends on your error handling)
});
```

---

## Writing New Admin Tests

### Step-by-Step Guide

1. **Create test file** in `tests/integration/admin/`:
   ```bash
   touch tests/integration/admin/new-feature.test.js
   ```

2. **Set up test structure**:
   ```javascript
   const request = require('supertest');
   const { clearTestDatabase } = require('../../helpers/database');
   const { createTestApp } = require('../../helpers/testApp');
   const { getDb } = require('../../../services/database');

   jest.mock('../../../services/emailQueue');

   describe('Admin New Feature Tests', () => {
       let app;
       let agent;

       beforeAll(async () => {
           const { initializeDatabase } = require('../../../services/database');
           await initializeDatabase();
           app = createTestApp();
       });

       beforeEach(async () => {
           await clearTestDatabase();

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
       });

       describe('GET /api/admin/new-feature', () => {
           test('should work as expected', async () => {
               // Test implementation
           });

           test('should require authentication', async () => {
               const response = await request(app)
                   .get('/api/admin/new-feature')
                   .expect(401);

               expect(response.body.success).toBe(false);
           });
       });
   });
   ```

3. **Write test cases** covering:
   - Happy path (successful operation)
   - Authentication requirements
   - Validation errors
   - Edge cases
   - Database state verification
   - Error handling

4. **Run tests**:
   ```bash
   npm run test:integration -- tests/integration/admin/new-feature.test.js
   ```

### Test Checklist

For each endpoint, ensure you test:

- [ ] Successful operation (200/201)
- [ ] Authentication required (401)
- [ ] Missing required fields (400)
- [ ] Invalid data format (400)
- [ ] Resource not found (404)
- [ ] Conflict scenarios (409)
- [ ] Database state verification
- [ ] Greek language messages
- [ ] Email notifications (if applicable)
- [ ] History/audit logging (if applicable)

---

## Troubleshooting

### Common Issues

#### Tests Fail with "Session not found"

**Problem**: Agent not maintaining session cookies

**Solution**:
```javascript
// Correct: Use agent for authenticated requests
agent = request.agent(app);
await agent.post('/api/admin/login').send({ /* credentials */ });
await agent.get('/api/admin/protected');  // Uses session

// Incorrect: Creating new request loses session
await request(app).get('/api/admin/protected');  // 401 error
```

#### Database State Leaking Between Tests

**Problem**: Tests affect each other

**Solution**:
```javascript
beforeEach(async () => {
    await clearTestDatabase();  // ALWAYS clear database
    // Set up test data
});
```

#### Greek Characters Not Matching

**Problem**: Encoding issues with Greek text

**Solution**:
```javascript
// Use .toContain() instead of exact match
expect(response.body.message).toContain('επιτυχώς');

// Or normalize strings before comparison
const normalize = str => str.normalize('NFC');
expect(normalize(response.body.message)).toBe(normalize('Το ραντεβού ενημερώθηκε επιτυχώς.'));
```

#### Email Queue Mock Not Working

**Problem**: Email functions not being mocked

**Solution**:
```javascript
// Mock BEFORE importing modules that use it
jest.mock('../../../services/emailQueue');

const request = require('supertest');
// ... rest of imports

// Clear mocks between tests
beforeEach(() => {
    jest.clearAllMocks();
});
```

#### Transaction Tests Failing

**Problem**: Transaction not rolling back in test

**Solution**:
```javascript
// Ensure proper error handling in route
try {
    await connection.beginTransaction();
    // ... operations
    await connection.commit();
} catch (error) {
    await connection.rollback();
    throw error;  // Re-throw to trigger test failure
} finally {
    connection.release();
}
```

#### Date Comparison Issues

**Problem**: Date strings not matching

**Solution**:
```javascript
// Use toMySQLDate utility for consistency
const { toMySQLDate } = require('../../../utils/timezone');

const dateString = toMySQLDate('2025-12-25');
expect(appointment.appointment_date).toBe(dateString);

// Or convert to Date objects for comparison
const expectedDate = new Date('2025-12-25');
const actualDate = new Date(appointment.appointment_date);
expect(actualDate.getTime()).toBe(expectedDate.getTime());
```

---

## Best Practices

### 1. Test Independence

Each test must be independent and not rely on other tests:

```javascript
// Good: Each test sets up its own data
test('should update appointment', async () => {
    const [result] = await db.query(/* Create appointment */);
    const id = result.insertId;

    await agent.put(`/api/admin/appointments/${id}`).send(/* update */);
});

// Bad: Relying on data from previous test
let sharedAppointmentId;
test('should create appointment', async () => {
    const [result] = await db.query(/* Create */);
    sharedAppointmentId = result.insertId;  // DON'T DO THIS
});
test('should update appointment', async () => {
    await agent.put(`/api/admin/appointments/${sharedAppointmentId}`);  // FRAGILE
});
```

### 2. Descriptive Test Names

Use clear, specific test names:

```javascript
// Good
test('should return 404 when appointment not found', ...)
test('should require decline reason when declining appointment', ...)

// Bad
test('test 1', ...)
test('should work', ...)
```

### 3. Arrange-Act-Assert

Structure tests clearly:

```javascript
test('should confirm appointment', async () => {
    // Arrange: Set up test data
    const [result] = await db.query(/* Create pending appointment */);
    const appointmentId = result.insertId;

    // Act: Perform the operation
    const response = await agent
        .put(`/api/admin/appointments/${appointmentId}/status`)
        .send({ status: 'confirmed' })
        .expect(200);

    // Assert: Verify results
    expect(response.body.success).toBe(true);
    const [rows] = await db.query('SELECT status FROM appointments WHERE id = ?', [appointmentId]);
    expect(rows[0].status).toBe('confirmed');
});
```

### 4. Test Both Success and Failure

```javascript
describe('PUT /api/admin/appointments/:id/status', () => {
    test('should confirm appointment successfully', async () => {
        // Happy path
    });

    test('should return 404 for non-existent appointment', async () => {
        // Error case
    });

    test('should reject invalid status', async () => {
        // Validation error
    });

    test('should require decline reason when declining', async () => {
        // Business rule validation
    });
});
```

### 5. Verify Side Effects

Don't just check the response - verify database changes, emails, logs:

```javascript
test('should decline appointment and send email', async () => {
    const response = await agent
        .put(`/api/admin/appointments/${appointmentId}/status`)
        .send({ status: 'declined', decline_reason: 'Fully booked' })
        .expect(200);

    // Check response
    expect(response.body.success).toBe(true);

    // Check database
    const [rows] = await db.query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
    expect(rows[0].status).toBe('declined');
    expect(rows[0].decline_reason).toBe('Fully booked');

    // Check history
    const [history] = await db.query('SELECT * FROM appointment_history WHERE appointment_id = ?', [appointmentId]);
    expect(history).toHaveLength(1);

    // Check email was queued
    const { queueEmail } = require('../../../services/emailQueue');
    expect(queueEmail).toHaveBeenCalledWith(
        'appointment-declined',
        expect.any(String),
        expect.objectContaining({ decline_reason: 'Fully booked' })
    );
});
```

---

## Coverage Goals

Aim for comprehensive coverage of admin functionality:

- **Branches**: 80%+
- **Functions**: 85%+
- **Lines**: 80%+
- **Statements**: 80%+

Run coverage report:
```bash
npm run test:coverage -- tests/integration/admin/
```

---

## Additional Resources

- [Main Testing Guide](./TESTING.md)
- [API Documentation](./API.md)
- [Database Schema](./DATABASE.md)
- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

---

**Last Updated**: December 2025
