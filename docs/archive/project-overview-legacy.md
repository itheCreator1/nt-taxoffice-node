# NT - TAXOFFICE Project

 

## Project Overview

 

NT - TAXOFFICE is a professional web platform for an accounting firm in Greece, providing comprehensive accounting, tax, and consulting services. Built with Node.js and Express, it features a clean, modern design with modular architecture.

 

## Technology Stack

 

- **Backend**: Node.js with Express 4.18.2

- **Frontend**: Vanilla JavaScript (ES6 modules)

- **Styling**: Modular CSS architecture

- **Icons**: Font Awesome

- **Fonts**: Google Fonts (Poppins, Roboto)

 

## Architecture

 

### Directory Structure

 

```

nt-taxoffice-node/

├── server.js              # Express server entry point

├── routes/

│   └── index.js          # Route handlers

├── public/               # Static assets served by Express

│   ├── index.html       # Home page

│   ├── contact.html     # Contact page

│   ├── media.html       # Media/press page

│   ├── css/

│   │   ├── base/        # Variables, typography, reset

│   │   ├── layout/      # Header, navigation, footer

│   │   ├── components/  # Buttons, cards, forms, badges, icons

│   │   └── utilities/   # Animations, responsive, accessibility

│   └── js/

│       ├── main.js              # Application entry point

│       ├── navigation.js        # Mobile menu logic

│       ├── animations.js        # Scroll animations

│       └── form-validation.js   # Form validation

├── package.json

└── README.md

```

 

### CSS Architecture

 

The project follows a modular CSS pattern with clear separation:

 

- **base/**: Foundation styles (variables, typography, normalization)

- **layout/**: Page structure (header, footer, navigation)

- **components/**: Reusable UI elements (buttons, cards, forms, badges, icons)

- **utilities/**: Helper classes (animations, responsive utilities, accessibility, print)

 

### JavaScript Modules

 

Client-side code is organized as ES6 modules:

 

- `main.js` - Initializes and coordinates all modules

- `navigation.js` - Handles mobile menu and navigation interactions

- `animations.js` - Manages scroll animations and visual effects

- `form-validation.js` - Validates contact forms before submission

 

## Key Features

 

- **Responsive Design**: Mobile-first approach with breakpoints

- **Accessibility**: WCAG compliant with proper ARIA labels

- **Performance**: Lightweight, fast-loading static assets

- **SEO**: Proper meta tags and semantic HTML

- **Modern UI**: Clean design with smooth animations

 

## Development Guidelines

 

### Starting the Server

 

```bash

npm install      # Install dependencies

npm start        # Start server on port 3000

PORT=8080 npm run dev  # Custom port

```

 

### Adding New Pages

 

1. Create HTML file in `public/`

2. Add route in `routes/index.js`:

   ```javascript

   router.get('/new-page', (req, res) => {

     res.sendFile(path.join(__dirname, '../public/new-page.html'));

   });

   ```

 

### Styling Guidelines

 

- Use CSS variables from `base/variables.css`

- Follow modular structure (add to appropriate directory)

- Keep components self-contained

- Use utility classes for common patterns

 

### JavaScript Guidelines

 

- Use ES6+ features

- Keep functions small and focused

- Comment complex logic

- Follow existing naming conventions

- Import modules in `main.js` if needed

 

## Common Tasks

 

### Modifying Styles

 

1. Identify the correct module (base/layout/components/utilities)

2. Edit the specific CSS file

3. Test responsive behavior across breakpoints

 

### Adding Form Validation

 

1. Add validation logic to `public/js/form-validation.js`

2. Import/call from `main.js` if needed

3. Follow existing patterns for error messaging

 

### Updating Navigation

 

1. Edit HTML navigation structure in HTML files

2. Update mobile menu logic in `public/js/navigation.js`

3. Adjust styles in `public/css/layout/navigation.css`

 

## Important Patterns

 

### Route Handling

 

All routes are defined in `routes/index.js` and serve static HTML files from the `public/` directory.

 

### Static Assets

 

Express serves everything in `public/` as static files. CSS and JS are imported directly in HTML files.

 

### Form Handling

 

Forms use client-side validation via `form-validation.js` module. Contact forms submit to server (backend handling may need implementation).

 

## Services Offered

 

The site showcases these service categories:

 

- **Business & Professional**: Bookkeeping, tax compliance, financial reporting

- **Payroll**: Employee registration, payroll processing, social security

- **Individual**: Personal tax returns, property tax, social benefits

- **Consulting**: Financial strategy, compliance, business optimization

 

## Contact Information

 

- **Address**: 3ης Σεπτεμβρίου 103

- **Phone**: +30 210 8222 950

- **Email**: ntallas@ntallas.com

 

## Browser Support

 

- Chrome (latest)

- Firefox (latest)

- Safari (latest)

- Edge (latest)

- Mobile browsers (iOS Safari, Chrome Mobile)

 

## Appointment Booking System

**Status**: ✅ IMPLEMENTED AND MERGED (December 2025)
**Database**: MySQL 8.0
**Branch**: Merged into `main` from `feature/appointment-system`

### System Overview

A comprehensive online appointment booking system with:
- Public calendar with real-time availability checking
- Client booking interface with email notifications
- Admin panel for appointment management
- Email system with Greek language support
- Concurrent booking protection with MySQL transactions
- Client self-cancellation via email tokens
- Admin availability settings management
- Full audit trail for all changes

### Technology Stack (Appointment System)

- **Backend**: Node.js + Express 4.18.2
- **Database**: MySQL 8.x with mysql2 driver
- **Authentication**: express-session + bcrypt
- **Email**: Nodemailer + Gmail SMTP
- **Session Storage**: express-mysql-session
- **Security**: helmet, express-rate-limit
- **Timezone**: moment-timezone (Europe/Athens)
- **Frontend**: Vanilla JavaScript ES6 modules (maintaining existing patterns)
- **Styling**: Extending existing modular CSS architecture

### Implementation Status

**Completed Phases:**

1. **Phase 1**: Foundation & Database ✅
   - MySQL 8.0 connection pooling with mysql2
   - Services: database, email, emailQueue, appointments, availability
   - Utils: validation, sanitization, timezone, logger
   - Middleware: auth, rateLimiter, errorHandler, setupCheck
   - **Key Achievement**: Robust service-oriented architecture

2. **Phase 2**: Public Availability API ✅
   - Availability calculation with slot generation
   - 4 API endpoints: /dates, /slots/:date, /check, /next
   - Configurable booking window (30 days default)
   - **Key Achievement**: Real-time availability checking

3. **Phase 3**: Public Booking System ✅
   - Appointments service with MySQL transactions
   - Optimistic locking (version column) prevents race conditions
   - 3-step booking interface (service → date/time → form)
   - Flatpickr date picker with DD/MM/YYYY format
   - **Key Achievement**: Zero double-booking guarantee via database locks

4. **Phase 4**: Admin Authentication ✅
   - First-time setup wizard at /admin/setup.html
   - Session-based auth with bcrypt (12 rounds)
   - Login/logout with session persistence
   - Setup check middleware redirects
   - **Key Achievement**: Secure, simple authentication without JWTs

5. **Phase 5**: Admin Dashboard ✅
   - Comprehensive appointment management UI
   - Filters: status, date range, search
   - Sorting and pagination (50 per page)
   - Approve/decline with reasons
   - Real-time summary statistics
   - **Key Achievement**: CSP-compliant event delegation (no inline handlers)

6. **Phase 6**: Email System ✅
   - Nodemailer with Gmail SMTP
   - Email queue table with retry logic (max 3 attempts)
   - 10 EJS templates (HTML + text versions)
   - Runs every 30 seconds in background
   - **Key Achievement**: Reliable delivery with automatic retries

7. **Phase 7**: Cancellation System ✅
   - Token-based cancellation page
   - DELETE /api/appointments/cancel/:token endpoint
   - Secure UUID tokens (36 characters)
   - Email notifications on cancellation
   - **Key Achievement**: One-click cancellation via email links

8. **Phase 8**: Availability Management ✅
   - Per-day working hours configuration (7 days/week)
   - Blocked dates management for holidays
   - Changes take effect immediately
   - MySQL transactions for atomic updates
   - **Key Achievement**: Flexible scheduling with per-day customization

9. **Phase 9**: Testing & Polish ✅
   - Playwright E2E test infrastructure
   - Complete booking flow test
   - CSP compliance fixes (event delegation)
   - Responsive design verified
   - Comprehensive documentation (README, API docs, CHANGELOG)
   - **Key Achievement**: Production-ready with test coverage

### Post-Implementation Fixes

**CSP Compliance** (November 2025):
- Removed all inline onclick handlers
- Implemented event delegation pattern throughout
- Dashboard action buttons now use data-action attributes
- Blocked dates removal uses event delegation
- Result: Zero CSP violations, modern JavaScript practices

**Schema Alignment** (November 2025):
- Fixed availability settings to use per-day structure (7 rows)
- Updated admin panel to handle array of days
- Added transaction support for availability updates
- Result: Consistent data model across frontend/backend

**Flatpickr Integration** (November 2025):
- Switched from ESM to UMD build
- Hosted flatpickr locally for reliability
- Corrected Font Awesome SRI hashes
- Result: Stable date picker in production

**Email & Timezone** (November 2025):
- Added formatGreekTime function to timezone utils
- Fixed MySQL JSON column parsing
- Result: Accurate timestamps in all email templates

### Database Schema

**6 Main Tables**:
- `admin_users` - Admin authentication
- `appointments` - Booking data with versioning
- `availability_settings` - Weekly schedule
- `blocked_dates` - Holidays and closures
- `appointment_history` - Audit trail
- `email_queue` - Email notification queue

### Git Commit Strategy

**Critical Rule**: One commit per file creation or significant change

**Commit Format**:
```
<type>(<scope>): <description>

🤖 Generated with Claude Code
```

**Types**: feat, fix, docs, style, refactor, test, chore

**Estimated**: ~67 commits across all phases

### Service Types (Greek)

- Φορολογική Δήλωση (Tax return consultation)
- Λογιστική Υποστήριξη (Accounting support)
- Έναρξη Επιχείρησης (Business startup consultation)
- Μισθοδοσία (Payroll services)
- Γενική Συμβουλευτική (General consultation)

### Business Rules

- **Operating Hours**: Monday-Friday 09:00-17:00 (Europe/Athens timezone)
- **Weekends**: Closed
- **Appointment Duration**: 1 hour
- **Available Slots**: 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00
- **Minimum Notice**: 24 hours
- **Maximum Booking Window**: 60 days
- **Timezone**: Europe/Athens (EEST/EET)

### Appointment Statuses

- `pending` - Awaiting admin review
- `confirmed` - Accepted by admin
- `declined` - Rejected by admin
- `cancelled` - Cancelled by client
- `completed` - Past appointment (auto-updated)

### Environment Configuration Required

```env
# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=nt_taxoffice
DB_PASSWORD=<password>
DB_NAME=nt_taxoffice_appointments

# Gmail SMTP (requires App Password)
GMAIL_USER=ntallas@ntallas.com
GMAIL_APP_PASSWORD=<16-char-app-password>
ADMIN_EMAIL=ntallas@ntallas.com

# Session Security
SESSION_SECRET=<32+ character random string>

# Application
APP_URL=http://localhost:3000
TIMEZONE=Europe/Athens
```

### Key Features

- **Concurrent Booking Protection**: MySQL transactions with row-level locking
- **Email Notifications**: Queued system with retry logic (3 attempts)
- **Token-based Cancellation**: UUID v4 tokens for secure cancellation links
- **Audit Trail**: Complete history tracking for compliance
- **Rate Limiting**: Protection against abuse (5 bookings/hour, 5 logins/15min)
- **Security**: Helmet headers, bcrypt password hashing, session security
- **Accessibility**: WCAG AA compliance, Greek language support
- **Responsive**: Mobile-first design across all breakpoints

### File Structure (New Additions)

```
nt-taxoffice-node/
├── database/
│   ├── schema.sql
│   ├── init.js
│   └── migrations/
├── services/
│   ├── database.js
│   ├── appointments.js
│   ├── availability.js
│   ├── email.js
│   └── emailQueue.js
├── utils/
│   ├── validation.js
│   ├── sanitization.js
│   ├── timezone.js
│   └── logger.js
├── middleware/
│   ├── auth.js
│   ├── setupCheck.js
│   ├── rateLimiter.js
│   └── errorHandler.js
├── routes/
│   ├── api/
│   │   ├── appointments.js
│   │   └── availability.js
│   └── admin/
│       ├── auth.js
│       ├── appointments.js
│       └── availability.js
├── views/
│   └── emails/
│       ├── booking-received.html
│       ├── booking-received.txt
│       ├── booking-confirmed.html
│       ├── booking-confirmed.txt
│       ├── booking-declined.html
│       ├── booking-declined.txt
│       ├── booking-cancelled.html
│       ├── booking-cancelled.txt
│       ├── admin-new-booking.html
│       ├── admin-new-booking.txt
│       ├── admin-cancellation.html
│       └── admin-cancellation.txt
├── public/
│   ├── appointments.html
│   ├── cancel-appointment.html
│   ├── admin/
│   │   ├── setup.html
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   └── availability.html
│   ├── css/
│   │   └── pages/
│   │       ├── appointments.css
│   │       └── admin.css
│   └── js/
│       ├── appointments.js
│       ├── cancel-appointment.js
│       └── admin/
│           ├── setup.js
│           ├── login.js
│           ├── dashboard.js
│           └── availability.js
└── tests/
    ├── unit/
    └── integration/
```

### MySQL-Specific Implementation Notes

**Key Differences from SQLite**:
- Auto Increment: `INT AUTO_INCREMENT PRIMARY KEY`
- Booleans: `BOOLEAN` or `TINYINT(1)`
- Timestamps: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
- Date Functions: `DATE_SUB(NOW(), INTERVAL 1 DAY)`
- Foreign Keys: Enabled by default with InnoDB engine
- Transactions: `START TRANSACTION`, `COMMIT`, `ROLLBACK`

**Connection Pooling**:
- 10 concurrent connections
- Automatic reconnection
- UTC timezone for storage

**Concurrent Booking Protection**:
```javascript
const connection = await pool.getConnection();
await connection.beginTransaction();
try {
    // SELECT ... FOR UPDATE for row-level locking
    await connection.commit();
} catch (error) {
    await connection.rollback();
    throw error;
} finally {
    connection.release();
}
```

### Prerequisites Before Implementation

1. **MySQL 8.x** installed and running
2. **Gmail App Password** generated (requires 2FA enabled)
3. **Node.js 18+** installed
4. **Git** configured for commits
5. Environment variables prepared

### Documentation

- **Implementation Plan**: `/docs/Appointment Booking System Plan - Implementatio Plan.md`
- **Compiled Plan**: `~/.claude/plans/compiled-gliding-narwhal.md`
- **API Documentation**: To be created in Phase 9
- **Deployment Guide**: To be created in Phase 9

## Notes for AI Assistant



- The project uses Express with static file serving for main site
- **NEW**: Appointment system adds MySQL database and backend API
- No database or backend API for main site (contact form client-side only)
- Appointment system follows same frontend patterns (ES6 modules, modular CSS)
- Focus on frontend improvements and user experience
- Maintain the professional, clean aesthetic
- Keep accessibility in mind for all changes (WCAG AA compliance)
- Test responsive design when making layout changes
- Follow the established modular patterns for CSS and JS
- **NEW**: Use strict Git commit discipline (one commit per file/change)
- **NEW**: Greek language support for all appointment-related content
- **NEW**: Security-first approach (rate limiting, input validation, transaction safety)