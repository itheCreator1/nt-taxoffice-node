# NT TaxOffice Node

[![Test Suite](https://github.com/itheCreator1/nt-taxoffice-node/actions/workflows/test.yml/badge.svg)](https://github.com/itheCreator1/nt-taxoffice-node/actions/workflows/test.yml)

A professional tax office management system featuring a comprehensive appointment booking platform. This project demonstrates modern web development practices with Node.js, including secure authentication, real-time availability management, and automated email workflows.

**Last Updated:** December 3, 2025

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture & Design Principles](#architecture--design-principles)
- [Technology Stack](#technology-stack)
- [Quick Start with Docker](#quick-start-with-docker)
- [Manual Installation](#manual-installation)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Admin Panel](#admin-panel)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Common Pitfalls](#common-pitfalls)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

NT TaxOffice Node is a full-stack web application built to modernize appointment scheduling for professional tax services. The system handles the complete booking lifecycle—from client-facing appointment requests to admin approval workflows and automated email notifications.

### Why This Project?

Traditional appointment systems often rely on phone calls or manual email exchanges, leading to:
- Double bookings and scheduling conflicts
- Time wasted on coordination
- Poor user experience for clients

This application solves these problems by providing:
- **Real-time availability** based on configurable business hours
- **Automated email workflows** that keep all parties informed
- **Admin dashboard** for centralized appointment management
- **Conflict prevention** through database-level locking mechanisms

---

## Key Features

### For Clients
- **📅 Intuitive Booking Interface** - Select services, dates, and times through a clean, responsive UI
- **📧 Email Notifications** - Automatic confirmations, status updates, and reminders
- **🔗 Cancellation Links** - One-click appointment cancellation via secure tokens
- **📱 Mobile-Friendly** - Fully responsive design works on all devices

### For Administrators
- **🎛️ Dashboard** - View, filter, and manage all appointments from a centralized interface
- **⚙️ Availability Management** - Configure per-day working hours and block specific dates
- **✅ Appointment Approval** - Review and approve/decline booking requests
- **📊 Status Tracking** - Monitor appointments across pending, confirmed, declined, and completed states

### Technical Highlights
- **🔒 Security First** - CSP-compliant code, rate limiting, input sanitization, bcrypt password hashing
- **⚡ Performance** - Connection pooling, database indexes, optimistic locking
- **🐳 Docker Ready** - Full containerization with docker-compose for easy deployment
- **🧪 Test Coverage** - E2E tests with Playwright ensure reliability
- **📮 Email Queue** - Reliable email delivery with retry logic

---

## Architecture & Design Principles

### Why This Structure?

The project follows a **service-oriented architecture** that separates concerns into distinct layers:

```
Client Request → Routes (HTTP) → Services (Business Logic) → Database
```

**Benefits:**
- **Testability** - Each layer can be tested independently
- **Maintainability** - Changes in one layer don't cascade to others
- **Scalability** - Services can be extracted into microservices if needed

### Key Architectural Decisions

#### 1. Database-First Availability
Instead of calculating availability on-the-fly, we store availability settings in MySQL. This allows:
- **Consistent logic** across admin panel and booking interface
- **Fast queries** for available time slots
- **Historical tracking** of availability changes

#### 2. Session-Based Authentication
We use Express sessions (not JWT) for admin authentication because:
- **Simplicity** - No token refresh logic needed
- **Server control** - Sessions can be invalidated server-side instantly
- **Security** - Session cookies are HTTP-only and secure

#### 3. Email Queue System
Instead of sending emails synchronously, we use a queue (`email_queue` table):
- **Reliability** - Failed emails are automatically retried
- **Performance** - Email sending doesn't block HTTP responses
- **Monitoring** - Failed emails are easily identified

#### 4. Content Security Policy (CSP) Compliance
All JavaScript uses **event delegation** instead of inline handlers:
- **Security** - Prevents XSS attacks
- **Performance** - Fewer event listeners in memory
- **Best Practice** - Follows modern web standards

---

## Technology Stack

| Layer | Technology | Why We Chose It |
|-------|-----------|-----------------|
| **Runtime** | Node.js 18+ | Modern JavaScript features, excellent async support |
| **Web Framework** | Express 4.x | Battle-tested, extensive middleware ecosystem |
| **Database** | MySQL 8.0 | ACID compliance, mature tooling, proven reliability |
| **Templating** | EJS | Server-side email templates with logic |
| **Email** | Nodemailer + Gmail | Free, reliable, easy setup for small deployments |
| **Date Picker** | Flatpickr | Lightweight, accessible, locale support |
| **Containerization** | Docker + Docker Compose | Reproducible environments, easy deployment |
| **Testing** | Jest + Playwright | Unit and E2E testing coverage |

**Key Dependencies:**
```json
{
  "express": "^4.21.2",
  "mysql2": "^3.11.5",
  "express-session": "^1.18.1",
  "bcrypt": "^5.1.1",
  "nodemailer": "^6.9.16",
  "express-rate-limit": "^7.4.1",
  "helmet": "^8.0.0"
}
```

---

## Quick Start with Docker

**Prerequisites:** Docker and Docker Compose installed

### Step 1: Clone and Configure

```bash
git clone https://github.com/itheCreator1/nt-taxoffice-node.git
cd nt-taxoffice-node

# Copy and edit environment variables
cp .env.example .env
nano .env  # Edit database credentials, email config, and secrets
```

### Step 2: Start the Stack

```bash
docker-compose up -d
```

This starts:
- **MySQL 8.0** on port 3306
- **Node.js app** on port 3000 (http://localhost:3000)

### Step 3: Verify Everything Works

```bash
# Check logs
docker-compose logs -f app

# Check database connection
docker-compose exec mysql mysql -uroot -p -e "SHOW DATABASES;"
```

### Step 4: Access the Application

- **Main site:** http://localhost:3000
- **Appointment booking:** http://localhost:3000/appointments.html
- **Admin panel:** http://localhost:3000/admin/setup.html (first-time setup)

**Stopping the stack:**
```bash
docker-compose down
```

**Learn More:** See [docs/guides/deployment.md](docs/guides/deployment.md) for production deployment.

---

## Manual Installation

If you prefer running without Docker:

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0 server running

### Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/itheCreator1/nt-taxoffice-node.git
cd nt-taxoffice-node

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials and email config

# 4. Initialize database
mysql -u root -p < database/schema.sql

# 5. Start the server
npm run dev  # Development mode with nodemon
# OR
npm start    # Production mode
```

The application will be available at http://localhost:3000

---

## Project Structure

Understanding the codebase organization:

```
nt-taxoffice-node/
├── database/
│   ├── init.js              # Database connection and initialization
│   ├── schema.sql           # MySQL schema (6 tables)
│   └── migrations/          # Future schema migrations
├── docs/
│   ├── API.md              # Complete API documentation
│   ├── DEPLOYMENT.md       # Production deployment guide
│   ├── ADMIN_GUIDE.md      # Admin panel user guide
│   └── claude.md           # Development context for Claude Code
├── middleware/
│   ├── auth.js             # Session-based authentication
│   ├── errorHandler.js     # Centralized error handling
│   ├── rateLimiter.js      # IP-based rate limiting
│   └── setupCheck.js       # First-time setup redirect
├── public/
│   ├── admin/              # Admin panel HTML pages
│   │   ├── dashboard.html   # Appointment management
│   │   ├── availability.html # Hours & blocked dates config
│   │   ├── login.html       # Admin authentication
│   │   └── setup.html       # First-time setup wizard
│   ├── css/
│   │   ├── pages/           # Page-specific styles
│   │   └── vendor/          # Third-party CSS (Flatpickr)
│   ├── js/
│   │   ├── admin/           # Admin panel JavaScript
│   │   ├── vendor/          # Third-party JS (Flatpickr)
│   │   ├── appointments.js  # Booking interface logic
│   │   └── cancel-appointment.js # Cancellation logic
│   ├── appointments.html    # Client booking page
│   ├── cancel-appointment.html # Cancellation page
│   └── index.html           # Homepage
├── routes/
│   ├── admin/
│   │   ├── appointments.js  # Admin appointment CRUD
│   │   ├── auth.js          # Login, logout, setup
│   │   └── availability.js  # Availability configuration
│   ├── api/
│   │   ├── appointments.js  # Client booking endpoints
│   │   └── availability.js  # Slot availability queries
│   └── index.js             # Route registration
├── scripts/
│   └── init-db.js           # Database initialization script
├── services/
│   ├── appointments.js      # Appointment business logic
│   ├── availability.js      # Slot calculation logic
│   ├── database.js          # MySQL connection pool
│   ├── email.js             # Email sending (Nodemaaler)
│   └── emailQueue.js        # Email queue processor
├── tests/
│   ├── e2e/                 # Playwright end-to-end tests
│   │   └── appointmentBooking.spec.js
│   ├── integration/         # Integration tests (future)
│   ├── unit/                # Unit tests (future)
│   └── setup.js             # Test configuration
├── utils/
│   ├── logger.js            # Colored console logging
│   ├── sanitization.js      # Input sanitization (XSS prevention)
│   ├── timezone.js          # Timezone conversion utilities
│   └── validation.js        # Input validation rules
├── views/
│   └── emails/              # EJS email templates (HTML + text)
├── .env.example             # Environment variable template
├── .dockerignore            # Docker build exclusions
├── docker-compose.yml       # Multi-container Docker setup
├── Dockerfile               # Node.js container image
├── jest.config.js           # Jest test configuration
├── playwright.config.js     # Playwright test configuration
├── package.json             # Dependencies and scripts
└── server.js                # Application entry point
```

### Key Files Explained

**`server.js`** - Application entry point that:
- Configures Express middleware (Helmet, sessions, rate limiting)
- Registers all routes
- Initializes database connection
- Starts email queue processor
- Handles graceful shutdown

**`services/availability.js`** - Core business logic for:
- Calculating available time slots based on working hours
- Excluding booked slots
- Handling blocked dates
- Timezone conversions

**`services/emailQueue.js`** - Processes the email queue:
- Runs every 30 seconds
- Retries failed emails (max 3 attempts)
- Logs errors for manual review

**`middleware/auth.js`** - Protects admin routes:
- Checks for valid session
- Redirects to login if not authenticated
- Provides `requireAuth` middleware

---

## Configuration

All configuration is done through environment variables (`.env` file).

### Essential Variables

**Copy from template:**
```bash
cp .env.example .env
```

**Required before starting:**

| Variable | Description | Example |
|----------|-------------|---------|
| `SESSION_SECRET` | Secret for signing session cookies | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DB_PASSWORD` | MySQL root password | `mySecurePassword123` |
| `GMAIL_USER` | Gmail address for sending emails | `youremail@gmail.com` |
| `GMAIL_APP_PASSWORD` | Gmail app-specific password | [Get from Google](https://myaccount.google.com/apppasswords) |
| `ADMIN_EMAIL` | Email for admin notifications | `admin@example.com` |

### Gmail Setup Instructions

1. Enable 2-Factor Authentication on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Select "Mail" → "Other (Custom name)" → Generate
4. Copy the 16-character code to `GMAIL_APP_PASSWORD`

**Common Pitfall:** Don't use your regular Gmail password—it won't work. You must use an app-specific password.

### Docker-Specific Configuration

When using Docker Compose, set:
```bash
DB_HOST=mysql  # Must match service name in docker-compose.yml
```

When running locally without Docker:
```bash
DB_HOST=localhost
```

**Learn More:** See [`.env.example`](.env.example) for all available options.

---

## API Endpoints

The application exposes two sets of APIs:

### Client-Facing API (Public)

These endpoints are used by the booking interface:

- **GET `/api/availability/slots`** - Get available time slots for a date
- **POST `/api/appointments`** - Create a new appointment request
- **DELETE `/api/appointments/cancel/:token`** - Cancel an appointment

### Admin API (Authenticated)

Protected by session authentication:

- **GET `/api/admin/appointments`** - List all appointments (with filters)
- **GET `/api/admin/appointments/:id`** - Get appointment details
- **PUT `/api/admin/appointments/:id/status`** - Update appointment status
- **DELETE `/api/admin/appointments/:id`** - Delete an appointment
- **GET `/api/admin/availability/settings`** - Get working hours configuration
- **PUT `/api/admin/availability/settings`** - Update working hours
- **GET `/api/admin/availability/blocked-dates`** - List blocked dates
- **POST `/api/admin/availability/blocked-dates`** - Add a blocked date
- **DELETE `/api/admin/availability/blocked-dates/:id`** - Remove a blocked date

**Learn More:** See [docs/api/endpoints.md](docs/api/endpoints.md) for complete API documentation with examples.

---

## Admin Panel

### First-Time Setup

1. Navigate to http://localhost:3000/admin/setup.html
2. Create your admin account (username + password)
3. You'll be redirected to the login page

**Security Note:** The setup page is only accessible when no admin account exists. Once created, attempting to access `/admin/setup.html` will redirect to the dashboard.

### Admin Features

**Dashboard (`/admin/dashboard.html`):**
- View all appointments in a filterable table
- Filter by status (pending, confirmed, declined, completed)
- Filter by date range
- View appointment details (client info, service type, notes)
- Approve/decline pending appointments
- Delete appointments
- Real-time status updates

**Availability Management (`/admin/availability.html`):**
- Configure working hours for each day of the week
- Mark days as working/non-working
- Set different hours for different days (e.g., shorter hours on Friday)
- Block specific dates (holidays, closures)
- Changes take effect immediately for new bookings

### Understanding Appointment Statuses

| Status | Meaning | Transitions |
|--------|---------|-------------|
| **Pending** | Client submitted, awaiting admin review | → Confirmed or Declined |
| **Confirmed** | Admin approved, client notified | → Completed |
| **Declined** | Admin rejected, client notified | (Final state) |
| **Completed** | Appointment occurred (manual update) | (Final state) |
| **Cancelled** | Client cancelled before appointment | (Final state) |

**Learn More:** See [docs/guides/admin-panel.md](docs/guides/admin-panel.md) for detailed admin documentation.

---

## Development

### Running in Development Mode

```bash
npm run dev  # Uses nodemon for auto-restart on file changes
```

### Development Tools

**Check logs:**
- Server logs are color-coded (see `utils/logger.js`)
- Email queue logs show sent/failed messages
- Database query errors are logged with full SQL

**Debug mode:**
Set `NODE_ENV=development` for verbose logging.

**Testing email locally:**
Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `.env` to see real emails.

### Code Style Guidelines

- **Async/await** preferred over callbacks
- **Error handling** - All async route handlers wrapped in `asyncHandler`
- **Input validation** - Use `utils/validation.js` functions
- **Input sanitization** - Use `utils/sanitization.js` before database storage
- **Logging** - Use `utils/logger.js` instead of `console.log`
- **Comments** - Explain WHY, not WHAT (code should be self-explanatory)

### Database Schema Overview

**6 Core Tables:**
1. **`admin_users`** - Admin authentication (bcrypt hashed passwords)
2. **`appointments`** - Appointment records with versioning (`version` column for optimistic locking)
3. **`availability_settings`** - Per-day working hours (7 rows, one per day)
4. **`blocked_dates`** - Specific dates when bookings are unavailable
5. **`email_queue`** - Queued emails with retry logic
6. **`security_audit_log`** - Security event tracking (logins, changes)

**Learn More:** Database schema is documented in the migration files at [database/schema.sql](database/schema.sql).

---

## Testing

The project includes a comprehensive test suite with optimized performance through connection pooling, parallel execution, and specialized test utilities.

### Quick Start

```bash
# Run all tests (sequential, stable for CI)
npm test

# Fast parallel execution (development)
npm run test:parallel

# Specific test categories
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:fast          # Fast unit tests in parallel

# Specific areas
npm run test:admin         # Admin API tests
npm run test:api           # Public API tests
npm run test:services      # Service layer tests
```

### Test Infrastructure

**Modern Testing Features:**
- **Test Data Builders** - Fluent API for creating realistic test data ([AppointmentBuilder](tests/helpers/builders/AppointmentBuilder.js), [AdminBuilder](tests/helpers/builders/AdminBuilder.js))
- **Database Seeders** - Direct DB inserts for 10x faster test setup (bypasses HTTP overhead)
- **Custom Jest Matchers** - Domain-specific assertions like `toBeValidAppointment()`, `toExistInDatabase()`
- **Transaction Isolation** - Fast test isolation using DB transactions (10-20x faster than truncate)
- **Performance Monitoring** - Automatic tracking of slow tests with optimization suggestions
- **Shared Connection Pool** - Eliminates redundant database connections across test files

**Example: Using Test Builders**
```javascript
const { AppointmentBuilder } = require('./helpers/builders');

// Create appointment with fluent API
const appointment = new AppointmentBuilder()
    .withName('Γιάννης Παπαδόπουλος')
    .onDate('2025-12-15')
    .atTime('14:00:00')
    .forTaxReturn()
    .build();

// Create 10 random appointments
const appointments = new AppointmentBuilder()
    .onRandomFutureDate()
    .buildMany(10);
```

**Example: Database Seeding**
```javascript
const { seedAdminUser, seedAppointments } = require('./helpers/seeders');

// Fast admin creation (direct DB insert)
const admin = await seedAdminUser({
    username: 'admin',
    password: 'SecurePass123!',
    email: 'admin@example.com'
});

// Seed test appointments
const appointmentIds = await seedAppointments(10);
```

### Performance Improvements

Recent optimizations have achieved **30-40% faster test execution**:

| Optimization | Impact | Time Saved |
|--------------|--------|------------|
| Shared Connection Pool | 100+ fewer connections | 1-2s |
| Database Seeders | 10x faster setup | 10-20s |
| Shared Admin Sessions | 70+ → 5 bcrypt ops | 10-14s |
| Parallel Execution | 4 workers vs sequential | 30-50% faster |

**Performance Monitoring** - All tests are automatically monitored:
```bash
📊 TEST PERFORMANCE REPORT
Total Tests: 105
Total Time: 224.34s
Average: 2137ms per test
Slowest: 63403ms

🔴 VERY SLOW TESTS (>3000ms):
  1. 63403ms - Admin Appointments API › PUT /api/admin/appointments/:id

💡 OPTIMIZATION SUGGESTIONS:
  • Use seedAdminUser() instead of HTTP for admin tests
  • Consider transaction-based isolation for database tests
```

### End-to-End Tests

```bash
npm run test:e2e  # Run Playwright tests in headless mode
```

**E2E Test Coverage:**
- Complete booking flow (service selection → date/time → form submission)
- Availability slot calculation
- Appointment status changes

**Running tests with UI:**
```bash
npx playwright test --ui
```

### Comprehensive Testing Guide

**Learn More:** See [tests/README.md](tests/README.md) for the complete testing guide including:
- Test organization and best practices
- How to use all test utilities
- Performance optimization tips
- Troubleshooting common issues
- CI/CD integration examples

---

## Deployment

### Production Checklist

Before deploying to production:

- [ ] Generate a strong `SESSION_SECRET` (64+ random characters)
- [ ] Use a strong `DB_PASSWORD` (16+ characters, mixed case, symbols)
- [ ] Set `NODE_ENV=production`
- [ ] Configure SSL/TLS for HTTPS
- [ ] Set up regular database backups
- [ ] Configure email monitoring (check `email_queue` table for failures)
- [ ] Set up log rotation
- [ ] Test email delivery
- [ ] Review rate limiting settings (`RATE_LIMIT_*` variables)

### Deployment Options

**Docker (Recommended):**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Manual (VPS/Dedicated Server):**
1. Clone repository
2. Install Node.js 18+ and MySQL 8.0
3. Configure `.env` with production values
4. Run `npm install --production`
5. Initialize database: `mysql < database/schema.sql`
6. Start with PM2: `pm2 start server.js --name nt-taxoffice`

**Learn More:** See [docs/guides/deployment.md](docs/guides/deployment.md) for complete deployment guide.

---

## Common Pitfalls

### Email Not Sending?

**Problem:** Emails stuck in queue with "Authentication failed" errors

**Solutions:**
- Verify you're using an **app-specific password**, not your regular Gmail password
- Check that 2FA is enabled on your Google account
- Ensure `GMAIL_USER` matches the account where you generated the app password
- Check Gmail security settings: [https://myaccount.google.com/security](https://myaccount.google.com/security)

### Database Connection Errors?

**Problem:** `ECONNREFUSED` or `Access denied for user`

**Solutions:**
- **Docker:** Set `DB_HOST=mysql` (service name from `docker-compose.yml`)
- **Local:** Set `DB_HOST=localhost` or `127.0.0.1`
- Verify MySQL is running: `docker-compose ps` or `systemctl status mysql`
- Check database credentials match `.env` file

### CSP Violations in Browser Console?

**Problem:** "Refused to execute inline event handler" errors

**This shouldn't happen** - The codebase uses event delegation to be CSP-compliant. If you see this:
- Check if you added inline `onclick` handlers (don't do this)
- Use event delegation pattern instead (see `public/js/admin/dashboard.js` for examples)

### Appointments Not Showing Available Slots?

**Problem:** Booking calendar shows "No available slots"

**Solutions:**
1. Check availability settings in admin panel (`/admin/availability.html`)
2. Ensure at least one day is marked as "working day"
3. Verify working hours are set (e.g., 09:00 - 17:00)
4. Check that the date isn't in "blocked dates"
5. Verify `DEFAULT_SLOT_DURATION` in `.env` is reasonable (e.g., 30 minutes)

**Learn More:** See [docs/guides/admin-panel.md](docs/guides/admin-panel.md) for troubleshooting.

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit with clear messages
6. Push and open a pull request

**Code Review Checklist:**
- [ ] Code follows existing style conventions
- [ ] All input is validated and sanitized
- [ ] Error handling is comprehensive
- [ ] Tests are added/updated
- [ ] Documentation is updated

**Learn More:** See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## Support

- **Documentation:** See the [docs/README.md](docs/README.md) for all available guides
- **Issues:** Report bugs or request features on [GitHub Issues](https://github.com/itheCreator1/nt-taxoffice-node/issues)
- **Email:** For deployment support, contact the development team

---

