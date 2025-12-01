# Changelog

All notable changes to the NT TaxOffice Node project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-12-01

### Added - Appointment System

**Core Features:**
- Complete appointment booking system with 3-step client interface
- Admin dashboard for comprehensive appointment management
- Per-day availability configuration (7-day week schedule)
- Blocked dates management for holidays and special closures
- Email notification system with queuing and retry logic
- Appointment cancellation via secure token links
- Real-time availability calculation with slot management

**Admin Panel:**
- First-time setup wizard for admin account creation
- Session-based authentication with bcrypt password hashing
- Dashboard with appointment filtering, sorting, and pagination
- Appointment status management (pending → confirmed/declined → completed)
- Availability settings page for per-day working hours configuration
- Blocked dates management interface

**Email System:**
- Nodemailer integration with Gmail SMTP
- Email queue with automatic retry (up to 3 attempts)
- 10 email templates (HTML + text versions):
  - Booking confirmation
  - Appointment confirmed
  - Appointment declined
  - Appointment reminder
  - Cancellation confirmation
  - Admin new appointment notification
- EJS templating for dynamic content
- Timezone-aware timestamp formatting

**APIs:**
- Client API: 7 public endpoints for booking and availability
- Admin Auth API: 4 endpoints for authentication and setup
- Admin Appointments API: 4 endpoints for CRUD operations
- Admin Availability API: 5 endpoints for configuration management
- Rate limiting on all endpoints (prevents abuse)

**Database:**
- MySQL 8.0 schema with 6 core tables
- Transaction support for atomic operations
- Optimistic locking (version column) prevents race conditions
- Database connection pooling for performance
- Indexes on frequently queried columns

**Security:**
- Content Security Policy (CSP) compliant code
- Event delegation pattern (no inline event handlers)
- Input validation with comprehensive validation utility
- Input sanitization (XSS prevention)
- SQL injection prevention via parameterized queries
- bcrypt password hashing (12 rounds)
- Session-based authentication (HTTP-only cookies)
- Rate limiting per endpoint type
- Security audit logging

**Infrastructure:**
- Docker containerization with multi-stage builds
- docker-compose.yml for local development
- Automated database initialization
- Environment variable configuration
- Graceful shutdown handling
- Health checks in Docker setup

**Testing:**
- Playwright E2E test infrastructure
- Complete booking flow test
- Jest configuration for unit tests
- Test setup and utilities

**Development Tools:**
- Colored console logging utility
- Timezone conversion utilities (Europe/Athens)
- Validation utility with Greek error messages
- Sanitization utility for XSS prevention
- Error handler middleware with custom error classes
- Async error wrapper for Express routes

**Documentation:**
- Comprehensive README.md (651 lines) with educational approach
- Complete API documentation (1223 lines)
- .env.example with detailed configuration comments
- Implementation plan document
- Code review documentation

### Fixed

**CSP Compliance:**
- Removed all inline onclick handlers from dashboard
- Implemented event delegation for appointment action buttons
- Removed inline onclick handler from blocked dates removal
- All JavaScript now CSP-compliant (script-src-attr: 'none')

**Availability Settings:**
- Fixed schema mismatch between database and admin panel
- Backend now correctly handles per-day availability structure (7 rows)
- Frontend renders dynamic 7-day form with Greek day names
- Added MySQL transaction support for atomic availability updates

**Flatpickr Integration:**
- Switched from ESM to UMD build to resolve module loading issues
- Corrected Font Awesome SRI hash for integrity verification
- Added flatpickr ESM dependencies for future-proofing
- Hosted flatpickr locally for production reliability

**Email System:**
- Added missing formatGreekTime function to timezone utils
- Fixed JSON parsing for MySQL JSON column types
- Resolved duplicate JSON parsing in email queue

**Date Handling:**
- Implemented DD/MM/YYYY date format for Greek locale
- Fixed date picker initialization and formatting
- Corrected timezone conversions for Europe/Athens

### Security

**Implemented:**
- Rate limiting on all API endpoints:
  - Booking: 5 requests/hour
  - Cancellation: 10 requests/hour
  - Login: 5 requests/15 minutes
  - Setup: 3 requests/15 minutes
  - General Admin API: 100 requests/15 minutes
- Input sanitization before database storage
- Comprehensive input validation with error messages
- SQL injection prevention via parameterized queries
- Session-based authentication with secure cookies
- CSRF protection through SameSite cookies
- Bcrypt password hashing with 12 rounds
- Security event logging for audit trail
- HTTP-only cookies (prevents XSS cookie theft)
- Helmet.js for security headers including CSP

### Changed

**Architecture:**
- Adopted service-oriented architecture:
  - Routes handle HTTP concerns
  - Services contain business logic
  - Utils provide reusable functions
- Separated client API from admin API
- Implemented middleware-based authentication
- Created centralized error handling
- Database-first availability calculation

**Code Organization:**
- Modular route structure (routes/api/, routes/admin/)
- Dedicated services layer (services/)
- Utility functions organized by concern (utils/)
- Middleware organized by functionality (middleware/)
- Email templates in views/emails/

**Development Workflow:**
- Added nodemon for development auto-restart
- Configured Jest for unit testing
- Set up Playwright for E2E testing
- Implemented colored logging for better debugging

### Performance

**Optimizations:**
- MySQL connection pooling (10 connections)
- Database indexes on appointment_date, appointment_time, status
- Optimistic locking prevents double-booking race conditions
- Email queue prevents blocking HTTP responses
- Efficient slot calculation with set operations
- Pagination on admin appointment list (50 per page default)

### Known Limitations

- Single admin user support (no role-based access control)
- Email queue runs in-process (consider separate worker for scale)
- No SMS notifications (email only)
- No calendar integration (Google Calendar, Outlook)
- No recurring appointments support
- Single service provider (no multi-staff scheduling)
- 30-day booking window (configurable via code)
- Greek language in API responses (no internationalization)

### Migration Notes

**From Static Site:**
If upgrading from the previous static-only version:
1. Run `database/schema.sql` to create new tables
2. Configure `.env` with database and email credentials
3. Access `/admin/setup.html` to create admin account
4. Configure working hours in availability settings
5. Test booking flow in `/appointments.html`

**Environment Variables:**
New variables required in `.env`:
- `SESSION_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `DB_*` - MySQL connection credentials
- `GMAIL_*` - Email sending configuration
- `DEFAULT_SLOT_DURATION` - Appointment slot duration (default: 30 minutes)

### Deprecation Notices

None - This is the initial release of the appointment system.

### Contributors

- Development: NT TaxOffice Team
- Documentation: Technical Writing Team
- Testing: QA Team

---

## [0.1.0] - 2025-11-15 (Pre-release)

### Added
- Initial project structure
- Static website pages (index, contact, media)
- Basic Express server setup
- MySQL database connection
- Static file serving

### Notes
This version included only the static website without appointment functionality.

---

## Versioning

**Version Number Format:** MAJOR.MINOR.PATCH

- **MAJOR:** Incompatible API changes
- **MINOR:** Backwards-compatible functionality additions
- **PATCH:** Backwards-compatible bug fixes

**Current Status:** 1.0.0 (First stable release)

---

## Roadmap

### Planned for 1.1.0
- Multi-language support (English/Greek toggle)
- SMS notifications via Twilio integration
- Google Calendar sync for appointments
- Appointment rescheduling interface
- Client portal for viewing appointment history

### Planned for 1.2.0
- Multi-staff scheduling (multiple service providers)
- Recurring appointment support
- Payment integration (deposits/prepayment)
- Advanced reporting and analytics
- Mobile app (React Native)

### Planned for 2.0.0
- Microservices architecture
- Real-time updates via WebSockets
- Multi-tenant support (multiple offices)
- AI-powered scheduling optimization
- Customer relationship management (CRM) features

---

## Support

For questions or issues:
- **GitHub Issues:** https://github.com/itheCreator1/nt-taxoffice-node/issues
- **Documentation:** See docs/ directory
- **Email:** Contact development team

---

**Last Updated:** December 1, 2025
