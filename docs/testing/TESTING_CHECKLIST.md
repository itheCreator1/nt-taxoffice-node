# Testing Phase - Quick Checklist

Use this checklist to track progress through the testing completion plan.

**Total Time**: 8-12 hours | **Tasks**: 24 | **Tests to Add**: ~316

---

## Phase 1: Fix Integration Tests (1-2 hours) 🔥

- [ ] **Task 1.1**: Fix response format (`appointment` → `data`) - 7 locations
- [ ] **Task 1.2**: Fix HTTP method (DELETE → POST) - 3 locations
- [ ] **Task 1.3**: Create `tests/helpers/testData.js` for valid dates
- [ ] **Task 1.4**: Run tests - verify 12/12 passing

**Commands**:

```bash
npm run test:integration  # Should see 12/12 passing
```

---

## Phase 2: Automate Setup (1 hour) 🔥

- [ ] **Task 2.1**: Create `scripts/test-setup.sh` (chmod +x)
- [ ] **Task 2.2**: Add npm scripts: `test:setup`, `pretest:integration`
- [ ] **Task 2.3**: Create `docs/TESTING_QUICKSTART.md`

**Commands**:

```bash
npm run test:setup  # Should complete successfully
```

---

## Phase 3: Email Testing (2-3 hours) 🔥

- [ ] **Task 3.1**: Create `tests/unit/services/email.test.js` (~40 tests)
  - [ ] Setup/teardown tests (5)
  - [ ] Booking confirmation tests (8)
  - [ ] Cancellation tests (6)
  - [ ] Admin notification tests (7)
  - [ ] Status update tests (6)
  - [ ] Template rendering tests (4)
  - [ ] SMTP error handling tests (4)

- [ ] **Task 3.2**: Create `tests/unit/services/emailQueue.test.js` (~26 tests)
  - [ ] Queue management tests (6)
  - [ ] Email processing tests (8)
  - [ ] Processing loop tests (5)
  - [ ] Error handling tests (4)
  - [ ] Integration tests (3)

- [ ] **Task 3.3**: Create `tests/integration/services/email.test.js` (~7 tests)

**Commands**:

```bash
npm run test:backend -- --testPathPattern=email  # Should see 73+ passing
```

---

## Phase 4: Admin Routes Testing (3-4 hours) 🔥

- [ ] **Task 4.1**: Create `tests/integration/api/admin/auth.test.js` (~27 tests)
  - [ ] POST /api/admin/setup (8)
  - [ ] POST /api/admin/login (7)
  - [ ] POST /api/admin/logout (4)
  - [ ] GET /api/admin/me (5)
  - [ ] GET /api/admin/check-setup (3)

- [ ] **Task 4.2**: Create `tests/integration/api/admin/appointments.test.js` (~26 tests)
  - [ ] GET /api/admin/appointments (10)
  - [ ] PUT /api/admin/appointments/:id/status (7)
  - [ ] PUT /api/admin/appointments/:id/approve (4)
  - [ ] PUT /api/admin/appointments/:id/decline (5)

- [ ] **Task 4.3**: Create `tests/integration/api/admin/availability.test.js` (~22 tests)
  - [ ] GET /api/admin/availability (3)
  - [ ] PUT /api/admin/availability/:day (7)
  - [ ] GET blocked-dates (3)
  - [ ] POST blocked-dates (5)
  - [ ] DELETE blocked-dates (4)

- [ ] **Task 4.4**: Create `tests/integration/api/availability.test.js` (~13 tests)
  - [ ] GET /api/availability/slots (8)
  - [ ] GET /api/availability/dates (5)

- [ ] **Task 4.5**: Update `tests/helpers/testApp.js` - add admin routes

**Commands**:

```bash
npm run test:integration -- --testPathPattern=admin  # Should see 88+ passing
```

---

## Phase 5: Utilities Testing (2-3 hours)

- [ ] **Task 5.1**: Create `tests/unit/utils/logger.test.js` (~20 tests)
  - [ ] Basic logging (6)
  - [ ] Security events (5)
  - [ ] Email logging (4)
  - [ ] Appointment logging (3)
  - [ ] Error handling (2)

- [ ] **Task 5.2**: Create `tests/unit/services/database.test.js` (~15 tests)
  - [ ] Connection management (6)
  - [ ] Query execution (4)
  - [ ] Transaction support (3)
  - [ ] Health checks (2)

- [ ] **Task 5.3**: Create `tests/unit/middleware/setupCheck.test.js` (~8 tests)
  - [ ] requireSetupIncomplete (4)
  - [ ] requireSetupComplete (4)

**Commands**:

```bash
npm run test:unit -- --testPathPattern="logger|database|setupCheck"  # 43+ passing
```

---

## Phase 6: Documentation (1-2 hours)

- [ ] **Task 6.1**: Create `docs/ADMIN_TESTING_GUIDE.md`
- [ ] **Task 6.2**: Update `docs/TESTING.md` (add email/admin sections)
- [ ] **Task 6.3**: Create `scripts/coverage-report.sh` (chmod +x)
- [ ] **Task 6.4**: Run full test suite and update `TEST_STATUS_SUMMARY.md`

**Commands**:

```bash
npm test                    # Should see 562+ tests passing
npm run test:coverage       # Should see 70%+ coverage
./scripts/coverage-report.sh
```

---

## Final Verification

Run these commands to verify everything works:

```bash
# 1. Clean start
docker-compose down -v
npm run test:setup

# 2. Unit tests
npm run test:unit
# Expected: 438+ tests passing

# 3. Integration tests
npm run test:integration
# Expected: 124+ tests passing

# 4. All tests
npm test
# Expected: 562+ tests passing ✅

# 5. Coverage
npm run test:coverage
# Expected: 70%+ in all categories ✅
```

---

## Progress Tracking

**Started**: \***\*\_\_\_\*\***
**Phase 1 Complete**: \***\*\_\_\_\*\***
**Phase 2 Complete**: \***\*\_\_\_\*\***
**Phase 3 Complete**: \***\*\_\_\_\*\***
**Phase 4 Complete**: \***\*\_\_\_\*\***
**Phase 5 Complete**: \***\*\_\_\_\*\***
**Phase 6 Complete**: \***\*\_\_\_\*\***
**Finished**: \***\*\_\_\_\*\***

**Total Tests**:

- Before: 246
- After: **\_\_\_**
- Target: 562+

**Coverage**:

- Before: ~60%
- After: **\_\_\_**%
- Target: 70%+

---

## Quick Reference

### File Locations

```
tests/
├── unit/
│   ├── services/
│   │   ├── email.test.js          [NEW - 40 tests]
│   │   ├── emailQueue.test.js     [NEW - 26 tests]
│   │   └── database.test.js       [NEW - 15 tests]
│   ├── utils/
│   │   └── logger.test.js         [NEW - 20 tests]
│   └── middleware/
│       └── setupCheck.test.js     [NEW - 8 tests]
├── integration/
│   ├── api/
│   │   ├── appointments.test.js   [FIX - 12 tests]
│   │   ├── availability.test.js   [NEW - 13 tests]
│   │   └── admin/
│   │       ├── auth.test.js       [NEW - 27 tests]
│   │       ├── appointments.test.js [NEW - 26 tests]
│   │       └── availability.test.js [NEW - 22 tests]
│   └── services/
│       └── email.test.js          [NEW - 7 tests]
└── helpers/
    ├── testData.js                [NEW]
    └── testApp.js                 [UPDATE]
```

### Scripts

```bash
npm run test:setup          # One-time setup
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm test                    # All tests
npm run test:coverage       # With coverage report
npm run test:db:init        # Reset test database
./scripts/coverage-report.sh # Coverage summary
```

---

**Reference**: See `TESTING_COMPLETION_PLAN.md` for detailed instructions
