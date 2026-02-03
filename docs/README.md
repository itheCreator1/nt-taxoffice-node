# NT-TAXOFFICE Documentation

Welcome to the NT-TAXOFFICE appointment booking system documentation.

## 📚 Documentation Structure

### Quick Start

- [Testing Quickstart](testing/TESTING_QUICKSTART.md) - Get started with testing in 5 minutes

### Guides

- [Admin Panel Guide](guides/admin-panel.md) - Complete admin panel user guide
- [Admin Testing Guide](guides/admin-testing.md) - Testing admin functionality (58 tests)
- [Testing Guide](guides/testing.md) - Comprehensive testing documentation
- [Comprehensive Testing Guide](../tests/README.md) - Complete guide with modern test utilities and performance tips
- [Deployment Guide](guides/deployment.md) - Production deployment instructions

### API Documentation

- [API Endpoints](api/endpoints.md) - Complete API reference

### Testing Documentation

- [Testing Overview](testing/README.md) - Testing documentation index
- [Integration Tests Setup](testing/INTEGRATION_TESTS_SETUP.md) - How to set up integration tests
- [Test Findings](testing/TEST_FINDINGS.md) - Issues discovered during testing
- [Testing Checklist](testing/TESTING_CHECKLIST.md) - Pre-deployment testing checklist
- [Testing Completion Plan](testing/TESTING_COMPLETION_PLAN.md) - Testing roadmap
- [Testing Phase Summary](testing/TESTING_PHASE_SUMMARY.md) - Testing progress summary
- [Testing Implementation Summary](testing/TESTING_IMPLEMENTATION_SUMMARY.md) - Implementation details
- [Test Status Summary](testing/TEST_STATUS_SUMMARY.md) - Current test coverage status

### Planning & Architecture

- [Appointment System Implementation Plan](planning/appointment-system-implementation-plan.md) - Original implementation plan

### Archive

- [Project Overview (Legacy)](archive/project-overview-legacy.md) - Historical project overview
- [Code Review (2024-11-18)](archive/code-review-2024-11-18.md) - Initial code review

---

## 🚀 Quick Links

### For Developers

1. **Getting Started**: See main [README.md](../README.md)
2. **Running Tests**: [Testing Quickstart](testing/TESTING_QUICKSTART.md)
3. **API Reference**: [API Endpoints](api/endpoints.md)
4. **Writing Tests**: [Testing Guide](guides/testing.md)

### For Admins

1. **Using Admin Panel**: [Admin Panel Guide](guides/admin-panel.md)
2. **Deployment**: [Deployment Guide](guides/deployment.md)

### For Testing

1. **Quick Start**: [Testing Quickstart](testing/TESTING_QUICKSTART.md)
2. **Admin Tests**: [Admin Testing Guide](guides/admin-testing.md)
3. **Integration Tests**: [Integration Tests Setup](testing/INTEGRATION_TESTS_SETUP.md)

---

## 📊 Test Coverage

**Current Status**: 105+ tests with optimized performance

- **Admin Authentication**: 10 tests
- **Admin Appointments**: 26 tests
- **Admin Availability**: 22 tests
- **Public API**: 47+ tests

**Performance**: Tests now run **30-40% faster** thanks to:

- Shared connection pool (eliminates 100+ redundant connections)
- Database seeders (10x faster than HTTP setup)
- Transaction-based isolation (10-20x faster than truncate)
- Parallel execution support

See [Test Status Summary](testing/TEST_STATUS_SUMMARY.md) for detailed coverage information.

---

## 🔧 Common Tasks

### Running Tests

```bash
# All tests (sequential, stable for CI)
npm test

# Fast parallel execution (development)
npm run test:parallel

# Specific test categories
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:fast          # Fast unit tests in parallel

# Specific test suites
npm run test:admin         # Admin API tests
npm run test:api           # Public API tests
npm run test:services      # Service layer tests

# Specific test file
npm run test:integration -- tests/integration/admin/appointments.test.js

# With coverage report
npm run test:coverage
```

### Viewing Documentation

All documentation is in Markdown format and can be viewed in any text editor or on GitHub.

---

## 📝 Documentation Standards

- **Naming**: Use lowercase-with-hyphens for file names
- **Structure**: Organized by category (guides, api, testing, planning, archive)
- **Format**: GitHub-flavored Markdown
- **Links**: Use relative paths for cross-document references

---

## 🤝 Contributing

When adding new documentation:

1. Place in the appropriate folder:
   - `guides/` - User and developer guides
   - `api/` - API documentation and references
   - `testing/` - Testing-related documentation
   - `planning/` - Architecture and planning documents
   - `archive/` - Historical or outdated documents

2. Update this README.md with a link to the new document

3. Use clear, descriptive file names (lowercase-with-hyphens)

4. Include a table of contents for documents longer than 3 sections

---

**Last Updated**: December 3, 2025
