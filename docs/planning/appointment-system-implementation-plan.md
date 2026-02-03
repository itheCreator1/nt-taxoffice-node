# Appointment Booking System Plan - Implementation Ready

## NT - TAXOFFICE Online Appointment Booking System

**Version:** 2.1 (MySQL Adaptation - Ready for Phased Implementation)
**Date:** November 26, 2025
**Target:** Claude Code Implementation
**Estimated Time:** 44-57 hours across 9 phases

---

## 🔄 Implementation Updates (v2.1)

**Key Changes from Original Plan:**

- ✅ **Database Changed**: MySQL 8.x instead of SQLite (client preference)
- ✅ **Phased Approach**: 9 sequential phases for manageable implementation
- ✅ **Strict Git Strategy**: One commit per file/change (~67 commits total)
- ✅ **MySQL Adaptations**: Transaction patterns, connection pooling, syntax updates
- ✅ **Detailed Plan**: Complete file-by-file breakdown in `~/.claude/plans/compiled-gliding-narwhal.md`

**Database Rationale:**

- Better concurrency handling for appointment bookings
- Production-ready with standard backup/replication tools
- Row-level locking for concurrent booking protection
- Industry-standard RDBMS features

**Implementation Status:**

- All prerequisites identified
- Gmail configuration pending (client contact required)
- MySQL schema adapted from SQLite
- Ready to begin Phase 1: Foundation & Database

---

---

## 1. Project Overview

### 1.1 Purpose

Create an online appointment booking system that allows NT - TAXOFFICE clients to schedule appointments via the website, with an admin panel for staff to accept or decline requests.

### 1.2 Core Features

- Public calendar displaying available/unavailable time slots
- Real-time availability checking
- Booking form for clients
- Admin panel for appointment management
- Email notifications (Gmail)
- Client self-cancellation via email link
- Audit trail for all appointment changes
- Concurrent booking protection

---

## 2. Business Rules

### 2.1 Operating Hours

| Day             | Hours         |
| --------------- | ------------- |
| Monday - Friday | 09:00 - 17:00 |
| Saturday        | Closed        |
| Sunday          | Closed        |

- **Appointment duration:** 1 hour
- **Lunch break:** None (continuous availability)
- **Available time slots:** 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00
- **Timezone:** Europe/Athens (EEST/EET)

### 2.2 Booking Constraints

| Rule                             | Value                       |
| -------------------------------- | --------------------------- |
| Maximum advance booking          | 60 days                     |
| Minimum notice required          | 24 hours                    |
| Calendar week start              | Monday                      |
| Buffer time between appointments | None (back-to-back allowed) |

### 2.3 Appointment Statuses

| Status      | Description                     | Color (Admin) | Who Can Set |
| ----------- | ------------------------------- | ------------- | ----------- |
| `pending`   | Awaiting admin review           | Yellow        | System      |
| `confirmed` | Accepted by admin               | Green         | Admin       |
| `declined`  | Rejected by admin               | Red           | Admin       |
| `cancelled` | Cancelled by client             | Gray          | Client      |
| `completed` | Past appointment (auto-updated) | Blue          | System      |

### 2.4 Service Types (Sample - To Be Confirmed)

| Service              | Description                   |
| -------------------- | ----------------------------- |
| Φορολογική Δήλωση    | Tax return consultation       |
| Λογιστική Υποστήριξη | Accounting support            |
| Έναρξη Επιχείρησης   | Business startup consultation |
| Μισθοδοσία           | Payroll services              |
| Γενική Συμβουλευτική | General consultation          |

---

## 3. User Flows

### 3.1 Client Booking Flow

```
1. Client visits /appointments
2. Views calendar (current month by default)
3. Navigates months (within 60-day window)
4. Clicks on available day (green)
5. Modal/section shows available time slots for that day
6. Selects a time slot
7. System checks real-time availability
8. If available, shows booking form
9. Fills booking form:
   - Full name (required)
   - Email (required)
   - Phone (required)
   - Service type (dropdown, required)
   - Notes (optional)
10. Client reviews details
11. Submits form
12. System performs final availability check with row-level locking
13. If still available:
    - Creates appointment with status 'pending'
    - Sends confirmation email to client
    - Sends notification email to admin
    - Shows success message
14. If no longer available:
    - Shows error message
    - Returns to slot selection
```

### 3.2 Admin Approval Flow

```
1. Admin receives email notification of new booking
2. Logs into /admin/dashboard
3. Sees pending appointments highlighted
4. Clicks on appointment to view details
5. Views:
   - Client info
   - Appointment details
   - Client's previous booking history
   - Any notes from client
6. Chooses: Accept, Decline, or Delete
7. If Accept:
   - Status changes to 'confirmed'
   - Client receives confirmation email
   - History entry created
8. If Decline:
   - Admin enters reason (optional)
   - Status changes to 'declined'
   - Client receives decline email with reason
   - History entry created
9. If Delete:
   - Confirmation dialog appears
   - Appointment removed from database
   - No email sent
```

### 3.3 Client Cancellation Flow

```
1. Client clicks cancellation link in email
2. Lands on /appointments/cancel?token=xxxxx
3. System validates token
4. If valid:
   - Shows appointment details
   - Shows cancellation confirmation button
5. Client confirms cancellation
6. System checks if appointment is in the future
7. If yes:
   - Status changes to 'cancelled'
   - Admin receives cancellation notification email
   - Client sees confirmation message
   - History entry created
8. If already past:
   - Shows "Cannot cancel past appointment" message
```

### 3.4 Admin First-Time Setup Flow

```
1. First visit to /admin (no admin exists in database)
2. System checks admin_users table
3. If empty, redirects to /admin/setup
4. Setup wizard form:
   - Username (required, unique)
   - Email (required, for notifications)
   - Password (required, min 8 chars)
   - Confirm password (required, must match)
5. Validates inputs
6. Hashes password with bcrypt (cost factor 12)
7. Creates admin account
8. Redirected to /admin/login
9. Setup page becomes permanently inaccessible
10. Subsequent visits to /admin/setup redirect to /admin/login
```

---

## 4. Technical Architecture

### 4.1 Technology Stack

| Component       | Technology                        | Version |
| --------------- | --------------------------------- | ------- |
| Backend         | Node.js + Express                 | 5.x     |
| Database        | SQLite                            | 3.x     |
| Database Driver | better-sqlite3                    | ^11.0.0 |
| Authentication  | express-session + bcrypt          | Latest  |
| Email           | Nodemailer + Gmail SMTP           | Latest  |
| Frontend        | Vanilla JavaScript (ES6 modules)  | -       |
| Styling         | Existing modular CSS architecture | -       |
| Timezone        | moment-timezone                   | ^0.5.45 |

### 4.2 Dependencies to Install

```json
{
  "better-sqlite3": "^11.0.0",
  "bcrypt": "^5.1.1",
  "express-session": "^1.18.0",
  "connect-sqlite3": "^0.9.13",
  "nodemailer": "^6.9.0",
  "uuid": "^9.0.0",
  "moment-timezone": "^0.5.45",
  "express-rate-limit": "^7.1.5",
  "helmet": "^7.1.0"
}
```

### 4.3 File Structure

```
nt-taxoffice-node/
├── server.js                          # Updated with new middleware
├── .env                               # Environment variables (Gmail credentials)
├── .env.example                       # Template for environment variables
│
├── database/
│   ├── init.js                        # Database initialization script
│   ├── schema.sql                     # Table definitions
│   ├── migrations/                    # Future schema changes
│   │   └── .gitkeep
│   └── nt-taxoffice.db               # SQLite database file (generated, gitignored)
│
├── routes/
│   ├── index.js                       # Existing routes (updated)
│   ├── api/
│   │   ├── appointments.js            # Public appointment API
│   │   └── availability.js            # Public availability API
│   └── admin/
│       ├── auth.js                    # Admin login/logout/setup
│       ├── appointments.js            # Admin appointment management
│       └── availability.js            # Admin availability settings
│
├── middleware/
│   ├── auth.js                        # Admin authentication check
│   ├── setupCheck.js                  # Redirect to setup if no admin
│   ├── rateLimiter.js                 # Rate limiting configuration
│   └── errorHandler.js                # Centralized error handling
│
├── services/
│   ├── database.js                    # Database connection singleton
│   ├── appointments.js                # Appointment business logic
│   ├── availability.js                # Availability calculations
│   ├── email.js                       # Email sending service
│   ├── emailQueue.js                  # Email queue processor
│   └── timezone.js                    # Timezone utilities
│
├── utils/
│   ├── validation.js                  # Input validation helpers
│   ├── sanitization.js                # Input sanitization
│   └── logger.js                      # Logging utility
│
├── public/
│   ├── appointments.html              # Public booking page
│   ├── cancel-appointment.html        # Cancellation confirmation page
│   │
│   ├── admin/
│   │   ├── setup.html                 # First-time admin setup
│   │   ├── login.html                 # Admin login page
│   │   ├── dashboard.html             # Main admin dashboard
│   │   └── availability.html          # Availability settings page
│   │
│   ├── css/
│   │   ├── main.css                   # Updated with new imports
│   │   └── pages/
│   │       ├── appointments.css       # Public booking page styles
│   │       └── admin.css              # Admin panel styles
│   │
│   └── js/
│       ├── appointments.js            # Public booking logic
│       ├── cancel-appointment.js      # Cancellation page logic
│       └── admin/
│           ├── setup.js               # Setup wizard logic
│           ├── login.js               # Login form logic
│           ├── dashboard.js           # Dashboard logic
│           └── availability.js        # Availability settings logic
│
├── views/
│   └── emails/                        # Email templates (HTML + Plain Text)
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
│
├── tests/                             # Test files
│   ├── unit/
│   │   ├── availability.test.js
│   │   ├── appointments.test.js
│   │   └── validation.test.js
│   └── integration/
│       ├── booking-flow.test.js
│       └── admin-flow.test.js
│
└── docs/
    ├── appointment-system-plan.md     # This document
    ├── deployment.md                  # Deployment guide
    └── api-documentation.md           # API documentation
```

---

## 5. Database Schema

### 5.1 Tables

#### `admin_users`

```sql
CREATE TABLE admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_login TEXT,
    is_active INTEGER DEFAULT 1
);

CREATE INDEX idx_admin_username ON admin_users(username);
```

#### `appointments`

```sql
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    service_type TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'declined', 'cancelled', 'completed')),
    decline_reason TEXT,
    cancellation_token TEXT UNIQUE,
    version INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Critical performance indexes
CREATE INDEX idx_appointment_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointment_status ON appointments(status);
CREATE INDEX idx_appointment_email ON appointments(client_email);
CREATE INDEX idx_cancellation_token ON appointments(cancellation_token);
CREATE UNIQUE INDEX idx_unique_slot ON appointments(appointment_date, appointment_time)
    WHERE status NOT IN ('cancelled', 'declined');
```

#### `availability_settings`

```sql
CREATE TABLE availability_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER NOT NULL UNIQUE CHECK(day_of_week >= 0 AND day_of_week <= 6),
    is_working_day INTEGER DEFAULT 0 CHECK(is_working_day IN (0, 1)),
    start_time TEXT,
    end_time TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_working_days ON availability_settings(is_working_day);
```

#### `blocked_dates`

```sql
CREATE TABLE blocked_dates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blocked_date TEXT NOT NULL UNIQUE,
    reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted_at TEXT DEFAULT NULL
);

CREATE INDEX idx_blocked_date ON blocked_dates(blocked_date) WHERE deleted_at IS NULL;
```

#### `appointment_history`

```sql
CREATE TABLE appointment_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT NOT NULL CHECK(changed_by IN ('client', 'admin', 'system')),
    changed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE INDEX idx_history_appointment ON appointment_history(appointment_id);
CREATE INDEX idx_history_changed_at ON appointment_history(changed_at);
```

#### `email_queue`

```sql
CREATE TABLE email_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    sent_at TEXT
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_created ON email_queue(created_at);
```

### 5.2 Default Availability Data

```sql
-- Monday to Friday: 09:00 - 17:00
INSERT INTO availability_settings (day_of_week, is_working_day, start_time, end_time) VALUES
(0, 0, NULL, NULL),           -- Sunday: Closed
(1, 1, '09:00', '17:00'),     -- Monday: Open
(2, 1, '09:00', '17:00'),     -- Tuesday: Open
(3, 1, '09:00', '17:00'),     -- Wednesday: Open
(4, 1, '09:00', '17:00'),     -- Thursday: Open
(5, 1, '09:00', '17:00'),     -- Friday: Open
(6, 0, NULL, NULL);           -- Saturday: Closed
```

### 5.3 Database Initialization Script

```javascript
// database/init.js
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'nt-taxoffice.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

function initializeDatabase() {
  const dbExists = fs.existsSync(DB_PATH);
  const db = new Database(DB_PATH);

  if (!dbExists) {
    console.log('Creating new database...');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);
    console.log('Database schema created successfully');
  }

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Set journal mode to WAL for better concurrent access
  db.pragma('journal_mode = WAL');

  return db;
}

module.exports = { initializeDatabase };
```

---

## 6. API Endpoints

### 6.1 Public Endpoints

#### Get Available Slots

```
GET /api/availability?month=2025-12

Response:
{
  "success": true,
  "data": {
    "month": "2025-12",
    "timezone": "Europe/Athens",
    "days": [
      {
        "date": "2025-12-01",
        "dayOfWeek": 1,
        "dayName": "Δευτέρα",
        "isWorkingDay": true,
        "isBlocked": false,
        "isPast": false,
        "isBeyondBookingWindow": false,
        "availableSlots": ["09:00", "10:00", "11:00", "14:00", "15:00"],
        "totalSlots": 8,
        "bookedSlots": 3
      },
      {
        "date": "2025-12-02",
        "dayOfWeek": 2,
        "dayName": "Τρίτη",
        "isWorkingDay": true,
        "isBlocked": false,
        "isPast": false,
        "isBeyondBookingWindow": false,
        "availableSlots": [],
        "totalSlots": 8,
        "bookedSlots": 8
      }
    ]
  }
}
```

#### Check Slot Availability (Real-time)

```
GET /api/appointments/check-availability?date=2025-12-15&time=10:00

Response (Available):
{
  "success": true,
  "available": true,
  "data": {
    "date": "2025-12-15",
    "time": "10:00",
    "dayName": "Δευτέρα"
  }
}

Response (Not Available):
{
  "success": false,
  "available": false,
  "error": "This time slot is no longer available"
}
```

#### Create Appointment

```
POST /api/appointments

Request:
{
  "clientName": "Γιώργος Παπαδόπουλος",
  "clientEmail": "giorgos@example.com",
  "clientPhone": "+30 6912345678",
  "appointmentDate": "2025-12-15",
  "appointmentTime": "10:00",
  "serviceType": "Φορολογική Δήλωση",
  "notes": "Θέλω να συζητήσουμε για τη δήλωση του 2024"
}

Response (Success):
{
  "success": true,
  "message": "Appointment request submitted successfully",
  "data": {
    "id": 42,
    "status": "pending",
    "appointmentDate": "2025-12-15",
    "appointmentTime": "10:00"
  }
}

Response (Slot Taken):
{
  "success": false,
  "error": "This time slot is no longer available"
}

Response (Validation Error):
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "clientEmail": "Invalid email format",
    "clientPhone": "Invalid phone number format"
  }
}
```

#### Get Appointment by Token (for cancellation page)

```
GET /api/appointments/by-token/:token

Response (Valid Token):
{
  "success": true,
  "data": {
    "clientName": "Γιώργος Παπαδόπουλος",
    "appointmentDate": "2025-12-15",
    "appointmentTime": "10:00",
    "serviceType": "Φορολογική Δήλωση",
    "status": "pending",
    "canCancel": true
  }
}

Response (Invalid Token):
{
  "success": false,
  "error": "Invalid or expired cancellation link"
}

Response (Already Cancelled):
{
  "success": false,
  "error": "This appointment has already been cancelled"
}
```

#### Cancel Appointment

```
POST /api/appointments/cancel

Request:
{
  "token": "550e8400-e29b-41d4-a716-446655440000"
}

Response (Success):
{
  "success": true,
  "message": "Appointment cancelled successfully"
}

Response (Past Appointment):
{
  "success": false,
  "error": "Cannot cancel past appointments"
}
```

### 6.2 Admin Endpoints (Authenticated)

All admin endpoints require valid session authentication.

#### Check Setup Status

```
GET /api/admin/setup-status

Response (No admin exists):
{
  "setupRequired": true
}

Response (Admin exists):
{
  "setupRequired": false
}
```

#### Create Admin (Setup)

```
POST /api/admin/setup

Request:
{
  "username": "admin",
  "password": "securePassword123",
  "email": "ntallas@ntallas.com"
}

Response (Success):
{
  "success": true,
  "message": "Admin account created successfully"
}

Response (Admin Already Exists):
{
  "success": false,
  "error": "Admin account already exists"
}
```

#### Login

```
POST /api/admin/login

Request:
{
  "username": "admin",
  "password": "securePassword123"
}

Response (Success):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "username": "admin",
    "email": "ntallas@ntallas.com"
  }
}

Response (Invalid Credentials):
{
  "success": false,
  "error": "Invalid username or password"
}
```

#### Logout

```
POST /api/admin/logout

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Get All Appointments

```
GET /api/admin/appointments?status=pending&from=2025-12-01&to=2025-12-31&page=1&limit=20

Response:
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": 42,
        "clientName": "Γιώργος Παπαδόπουλος",
        "clientEmail": "giorgos@example.com",
        "clientPhone": "+30 6912345678",
        "appointmentDate": "2025-12-15",
        "appointmentTime": "10:00",
        "serviceType": "Φορολογική Δήλωση",
        "notes": "...",
        "status": "pending",
        "createdAt": "2025-12-01T10:30:00Z",
        "hasOtherBookings": true,
        "otherBookingsCount": 2
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 42,
      "limit": 20
    }
  }
}
```

#### Get Single Appointment

```
GET /api/admin/appointments/:id

Response:
{
  "success": true,
  "data": {
    "id": 42,
    "clientName": "Γιώργος Παπαδόπουλος",
    "clientEmail": "giorgos@example.com",
    "clientPhone": "+30 6912345678",
    "appointmentDate": "2025-12-15",
    "appointmentTime": "10:00",
    "serviceType": "Φορολογική Δήλωση",
    "notes": "Θέλω να συζητήσουμε για τη δήλωση του 2024",
    "status": "pending",
    "createdAt": "2025-12-01T10:30:00Z",
    "updatedAt": "2025-12-01T10:30:00Z",
    "clientHistory": [
      {
        "id": 38,
        "appointmentDate": "2025-11-20",
        "appointmentTime": "14:00",
        "status": "completed",
        "serviceType": "Λογιστική Υποστήριξη"
      }
    ],
    "history": [
      {
        "id": 1,
        "oldStatus": null,
        "newStatus": "pending",
        "changedBy": "system",
        "changedAt": "2025-12-01T10:30:00Z"
      }
    ]
  }
}
```

#### Update Appointment Status

```
PATCH /api/admin/appointments/:id

Request (Accept):
{
  "status": "confirmed"
}

Request (Decline):
{
  "status": "declined",
  "declineReason": "Δυστυχώς δεν είμαστε διαθέσιμοι αυτή την ημερομηνία"
}

Response (Success):
{
  "success": true,
  "message": "Appointment updated successfully",
  "data": {
    "id": 42,
    "status": "confirmed"
  }
}
```

#### Delete Appointment

```
DELETE /api/admin/appointments/:id

Response:
{
  "success": true,
  "message": "Appointment deleted successfully"
}
```

#### Get Availability Settings

```
GET /api/admin/availability

Response:
{
  "success": true,
  "data": {
    "weeklySchedule": [
      { "dayOfWeek": 0, "name": "Κυριακή", "isWorkingDay": false },
      { "dayOfWeek": 1, "name": "Δευτέρα", "isWorkingDay": true, "startTime": "09:00", "endTime": "17:00" },
      { "dayOfWeek": 2, "name": "Τρίτη", "isWorkingDay": true, "startTime": "09:00", "endTime": "17:00" },
      { "dayOfWeek": 3, "name": "Τετάρτη", "isWorkingDay": true, "startTime": "09:00", "endTime": "17:00" },
      { "dayOfWeek": 4, "name": "Πέμπτη", "isWorkingDay": true, "startTime": "09:00", "endTime": "17:00" },
      { "dayOfWeek": 5, "name": "Παρασκευή", "isWorkingDay": true, "startTime": "09:00", "endTime": "17:00" },
      { "dayOfWeek": 6, "name": "Σάββατο", "isWorkingDay": false }
    ],
    "blockedDates": [
      { "id": 1, "date": "2025-12-25", "reason": "Χριστούγεννα" },
      { "id": 2, "date": "2025-12-26", "reason": "Επόμενη Χριστουγέννων" }
    ]
  }
}
```

#### Update Weekly Schedule

```
PUT /api/admin/availability/schedule

Request:
{
  "schedule": [
    { "dayOfWeek": 1, "isWorkingDay": true, "startTime": "09:00", "endTime": "17:00" },
    { "dayOfWeek": 2, "isWorkingDay": true, "startTime": "09:00", "endTime": "17:00" },
    { "dayOfWeek": 3, "isWorkingDay": true, "startTime": "09:00", "endTime": "17:00" },
    { "dayOfWeek": 4, "isWorkingDay": true, "startTime": "09:00", "endTime": "17:00" },
    { "dayOfWeek": 5, "isWorkingDay": true, "startTime": "09:00", "endTime": "17:00" },
    { "dayOfWeek": 6, "isWorkingDay": true, "startTime": "10:00", "endTime": "14:00" }
  ]
}

Response:
{
  "success": true,
  "message": "Schedule updated successfully"
}
```

#### Block Date

```
POST /api/admin/availability/blocked-dates

Request:
{
  "date": "2025-12-31",
  "reason": "Παραμονή Πρωτοχρονιάς"
}

Response (Success):
{
  "success": true,
  "message": "Date blocked successfully",
  "data": { "id": 3 }
}

Response (Has Existing Appointments):
{
  "success": false,
  "error": "Cannot block date with existing confirmed appointments",
  "data": {
    "affectedAppointments": [
      {
        "id": 45,
        "clientName": "Μαρία Κωνσταντίνου",
        "time": "10:00"
      }
    ]
  }
}
```

#### Unblock Date

```
DELETE /api/admin/availability/blocked-dates/:id

Response:
{
  "success": true,
  "message": "Date unblocked successfully"
}
```

---

## 7. Security Implementation

### 7.1 Authentication

```javascript
// middleware/auth.js
const requireAuth = (req, res, next) => {
  if (!req.session.adminId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }
  next();
};
```

**Password Requirements:**

- Minimum 8 characters
- Hashed with bcrypt (cost factor 12)
- No maximum length (bcrypt handles this)

**Session Configuration:**

```javascript
// In server.js
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

app.use(
  session({
    store: new SQLiteStore({
      db: 'sessions.db',
      dir: './database',
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  })
);
```

### 7.2 Input Validation & Sanitization

```javascript
// utils/validation.js
const validators = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  phone: (phone) => /^(\+30)?[0-9]{10}$/.test(phone.replace(/\s/g, '')),
  date: (date) => /^\d{4}-\d{2}-\d{2}$/.test(date),
  time: (time) => /^(09|1[0-6]):\d{2}$/.test(time),
  name: (name) => name.length >= 2 && name.length <= 100,
};

// utils/sanitization.js
const sanitize = {
  string: (str) => str.trim().replace(/[<>]/g, ''),
  email: (email) => email.toLowerCase().trim(),
  phone: (phone) => phone.replace(/\s/g, ''),
};
```

### 7.3 Rate Limiting

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many booking attempts, please try again later',
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again later',
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests, please slow down',
});
```

### 7.4 SQL Injection Prevention

**ALWAYS use parameterized queries:**

```javascript
// ✅ CORRECT
const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId);

// ❌ WRONG - Never do this!
const appointment = db.prepare(`SELECT * FROM appointments WHERE id = ${appointmentId}`).get();
```

### 7.5 CSRF Protection

Cancellation tokens use UUID v4 (cryptographically random).

```javascript
const { v4: uuidv4 } = require('uuid');
const cancellationToken = uuidv4();
```

### 7.6 Security Headers

```javascript
// In server.js
const helmet = require('helmet');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
        fontSrc: ["'self'", 'fonts.gstatic.com'],
        scriptSrc: ["'self'", 'cdnjs.cloudflare.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);
```

---

## 8. Concurrent Booking Protection

### 8.1 Row-Level Locking Strategy

```javascript
// services/appointments.js
function createAppointment(appointmentData) {
  const db = require('./database').getDb();

  try {
    // Begin immediate transaction for exclusive lock
    db.prepare('BEGIN IMMEDIATE').run();

    // Check availability within transaction
    const existingAppointment = db
      .prepare(
        `
            SELECT id FROM appointments 
            WHERE appointment_date = ? 
            AND appointment_time = ? 
            AND status NOT IN ('cancelled', 'declined')
        `
      )
      .get(appointmentData.appointmentDate, appointmentData.appointmentTime);

    if (existingAppointment) {
      db.prepare('ROLLBACK').run();
      return { success: false, error: 'Slot no longer available' };
    }

    // Check if date is blocked
    const blockedDate = db
      .prepare(
        `
            SELECT id FROM blocked_dates 
            WHERE blocked_date = ? 
            AND deleted_at IS NULL
        `
      )
      .get(appointmentData.appointmentDate);

    if (blockedDate) {
      db.prepare('ROLLBACK').run();
      return { success: false, error: 'Date is not available' };
    }

    // Create appointment
    const cancellationToken = require('uuid').v4();
    const result = db
      .prepare(
        `
            INSERT INTO appointments (
                client_name, client_email, client_phone,
                appointment_date, appointment_time, service_type,
                notes, status, cancellation_token
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        `
      )
      .run(
        appointmentData.clientName,
        appointmentData.clientEmail,
        appointmentData.clientPhone,
        appointmentData.appointmentDate,
        appointmentData.appointmentTime,
        appointmentData.serviceType,
        appointmentData.notes || null,
        cancellationToken
      );

    // Log to history
    db.prepare(
      `
            INSERT INTO appointment_history 
            (appointment_id, old_status, new_status, changed_by)
            VALUES (?, NULL, 'pending', 'client')
        `
    ).run(result.lastInsertRowid);

    // Commit transaction
    db.prepare('COMMIT').run();

    // Queue emails (outside transaction)
    queueEmail('client', appointmentData.clientEmail, 'booking-received', {
      appointmentId: result.lastInsertRowid,
      cancellationToken,
    });

    queueEmail('admin', process.env.ADMIN_EMAIL, 'admin-new-booking', {
      appointmentId: result.lastInsertRowid,
    });

    return {
      success: true,
      data: {
        id: result.lastInsertRowid,
        cancellationToken,
      },
    };
  } catch (error) {
    db.prepare('ROLLBACK').run();
    throw error;
  }
}
```

### 8.2 Optimistic Locking (Version Column)

```javascript
function updateAppointmentStatus(appointmentId, newStatus, currentVersion) {
  const db = require('./database').getDb();

  const result = db
    .prepare(
      `
        UPDATE appointments 
        SET status = ?, 
            version = version + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? 
        AND version = ?
    `
    )
    .run(newStatus, appointmentId, currentVersion);

  if (result.changes === 0) {
    throw new Error('Appointment was modified by another user');
  }

  return result;
}
```

---

## 9. Email System

### 9.1 Email Queue Architecture

```javascript
// services/emailQueue.js
function queueEmail(recipient, subject, templateName, data) {
  const db = require('./database').getDb();
  const { renderEmailTemplate } = require('./email');

  const { html, text } = renderEmailTemplate(templateName, data);

  db.prepare(
    `
        INSERT INTO email_queue (recipient, subject, html_body, text_body)
        VALUES (?, ?, ?, ?)
    `
  ).run(recipient, subject, html, text);
}

// Background processor (runs every 30 seconds)
function processEmailQueue() {
  const db = require('./database').getDb();
  const { sendEmail } = require('./email');

  const pendingEmails = db
    .prepare(
      `
        SELECT * FROM email_queue 
        WHERE status = 'pending' 
        AND attempts < 3
        ORDER BY created_at ASC
        LIMIT 10
    `
    )
    .all();

  for (const email of pendingEmails) {
    try {
      sendEmail(email.recipient, email.subject, email.html_body, email.text_body);

      db.prepare(
        `
                UPDATE email_queue 
                SET status = 'sent', sent_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `
      ).run(email.id);
    } catch (error) {
      db.prepare(
        `
                UPDATE email_queue 
                SET attempts = attempts + 1,
                    last_error = ?
                WHERE id = ?
            `
      ).run(error.message, email.id);

      if (email.attempts >= 2) {
        db.prepare(
          `
                    UPDATE email_queue 
                    SET status = 'failed'
                    WHERE id = ?
                `
        ).run(email.id);
      }
    }
  }
}

// Start processor
setInterval(processEmailQueue, 30000);
```

### 9.2 Email Template Structure

Each template must have both HTML and plain text versions:

**HTML Template (`views/emails/booking-received.html`):**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      /* Inline CSS for email client compatibility */
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: #1e3a5f;
        color: white;
        padding: 20px;
      }
      .content {
        padding: 20px;
        background: #f0f4f8;
      }
      .button {
        background: #2980b9;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        display: inline-block;
        border-radius: 5px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>NT - TAXOFFICE</h1>
      </div>
      <div class="content">
        <h2>Το αίτημά σας καταχωρήθηκε</h2>
        <p>Αγαπητέ/ή {{clientName}},</p>
        <p>Το αίτημα κράτησης ραντεβού σας έχει καταχωρηθεί επιτυχώς:</p>

        <ul>
          <li><strong>Ημερομηνία:</strong> {{appointmentDate}}</li>
          <li><strong>Ώρα:</strong> {{appointmentTime}}</li>
          <li><strong>Υπηρεσία:</strong> {{serviceType}}</li>
        </ul>

        <p>Θα επικοινωνήσουμε μαζί σας σύντομα για επιβεβαίωση.</p>

        <p>Αν χρειαστεί να ακυρώσετε το ραντεβού σας:</p>
        <a href="{{cancellationLink}}" class="button">Ακύρωση Ραντεβού</a>
      </div>
    </div>
  </body>
</html>
```

**Plain Text Template (`views/emails/booking-received.txt`):**

```
NT - TAXOFFICE
==============

Το αίτημά σας καταχωρήθηκε
--------------------------

Αγαπητέ/ή {{clientName}},

Το αίτημα κράτησης ραντεβού σας έχει καταχωρηθεί επιτυχώς:

- Ημερομηνία: {{appointmentDate}}
- Ώρα: {{appointmentTime}}
- Υπηρεσία: {{serviceType}}

Θα επικοινωνήσουμε μαζί σας σύντομα για επιβεβαίωση.

Αν χρειαστεί να ακυρώσετε το ραντεβού σας:
{{cancellationLink}}

---
NT - TAXOFFICE
3ης Σεπτεμβρίου 103
+30 210 8222 950
ntallas@ntallas.com
```

### 9.3 Template Rendering

```javascript
// services/email.js
const fs = require('fs');
const path = require('path');

function renderEmailTemplate(templateName, data) {
  const htmlPath = path.join(__dirname, '../views/emails', `${templateName}.html`);
  const textPath = path.join(__dirname, '../views/emails', `${templateName}.txt`);

  let html = fs.readFileSync(htmlPath, 'utf8');
  let text = fs.readFileSync(textPath, 'utf8');

  // Simple template replacement
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, data[key]);
    text = text.replace(regex, data[key]);
  });

  return { html, text };
}
```

### 9.4 Email Content Specifications

#### To Client: Booking Received

**Subject:** Το αίτημά σας καταχωρήθηκε | NT - TAXOFFICE

**Variables:**

- `{{clientName}}` - Client's full name
- `{{appointmentDate}}` - Date in Greek format (e.g., "15 Δεκεμβρίου 2025")
- `{{appointmentTime}}` - Time (e.g., "10:00")
- `{{serviceType}}` - Service name
- `{{cancellationLink}}` - Full URL to cancellation page

#### To Client: Booking Confirmed

**Subject:** Επιβεβαίωση Ραντεβού | NT - TAXOFFICE

**Variables:**

- `{{clientName}}`
- `{{appointmentDate}}`
- `{{appointmentTime}}`
- `{{serviceType}}`
- `{{officeAddress}}` - "3ης Σεπτεμβρίου 103"
- `{{googleMapsLink}}` - Google Maps URL
- `{{cancellationLink}}`

#### To Client: Booking Declined

**Subject:** Ενημέρωση για το αίτημά σας | NT - TAXOFFICE

**Variables:**

- `{{clientName}}`
- `{{appointmentDate}}`
- `{{appointmentTime}}`
- `{{serviceType}}`
- `{{declineReason}}` - Optional reason from admin
- `{{bookingPageLink}}` - Link to /appointments

#### To Client: Cancellation Confirmed

**Subject:** Ακύρωση Ραντεβού | NT - TAXOFFICE

**Variables:**

- `{{clientName}}`
- `{{appointmentDate}}`
- `{{appointmentTime}}`
- `{{serviceType}}`

#### To Admin: New Booking

**Subject:** Νέο Αίτημα Ραντεβού - {{clientName}}

**Variables:**

- `{{clientName}}`
- `{{clientEmail}}`
- `{{clientPhone}}`
- `{{appointmentDate}}`
- `{{appointmentTime}}`
- `{{serviceType}}`
- `{{clientNotes}}`
- `{{dashboardLink}}` - Link to admin dashboard
- `{{hasOtherBookings}}` - Boolean
- `{{otherBookingsCount}}` - Number

#### To Admin: Cancellation

**Subject:** Ακύρωση Ραντεβού - {{clientName}}

**Variables:**

- `{{clientName}}`
- `{{clientEmail}}`
- `{{appointmentDate}}`
- `{{appointmentTime}}`
- `{{serviceType}}`
- `{{dashboardLink}}`

---

## 10. Timezone Handling

### 10.1 Timezone Utility

```javascript
// services/timezone.js
const moment = require('moment-timezone');

const TIMEZONE = 'Europe/Athens';

module.exports = {
  now: () => moment.tz(TIMEZONE),

  parseDate: (dateString) => moment.tz(dateString, TIMEZONE),

  formatDate: (date, format = 'DD/MM/YYYY') => moment.tz(date, TIMEZONE).format(format),

  formatTime: (time) => time, // Already in HH:mm format

  isInPast: (date, time) => {
    const appointmentMoment = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
    return appointmentMoment.isBefore(moment.tz(TIMEZONE));
  },

  isBeyondBookingWindow: (date) => {
    const dateMoment = moment.tz(date, TIMEZONE);
    const maxDate = moment.tz(TIMEZONE).add(60, 'days');
    return dateMoment.isAfter(maxDate);
  },

  isWithinMinimumNotice: (date, time) => {
    const appointmentMoment = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
    const minNotice = moment.tz(TIMEZONE).add(24, 'hours');
    return appointmentMoment.isBefore(minNotice);
  },
};
```

### 10.2 Usage in Availability Service

```javascript
// services/availability.js
const { now, parseDate, isInPast, isBeyondBookingWindow } = require('./timezone');

function getAvailableSlots(month) {
  const currentDate = now().startOf('day');
  const requestedMonth = parseDate(`${month}-01`);

  // Validate month is within booking window
  if (isBeyondBookingWindow(requestedMonth.format('YYYY-MM-DD'))) {
    throw new Error('Date is beyond booking window');
  }

  // ... rest of logic
}
```

---

## 11. Environment Variables

### 11.1 Required Variables

Create `.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Session
SESSION_SECRET=your-very-long-random-secret-key-minimum-32-characters-recommended

# Database
DATABASE_PATH=./database/nt-taxoffice.db

# Email Configuration (Gmail)
GMAIL_USER=ntallas@ntallas.com
GMAIL_APP_PASSWORD=your-16-character-app-specific-password

# Admin Email (for notifications)
ADMIN_EMAIL=ntallas@ntallas.com

# Application URLs
APP_URL=http://localhost:3000
APP_NAME=NT - TAXOFFICE

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5

# Timezone
TIMEZONE=Europe/Athens

# Security
BCRYPT_ROUNDS=12
```

### 11.2 `.env.example` Template

Create `.env.example` for repository:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Session Secret (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=

# Database
DATABASE_PATH=./database/nt-taxoffice.db

# Email Configuration
# To get Gmail App Password:
# 1. Enable 2FA on your Google account
# 2. Go to: https://myaccount.google.com/apppasswords
# 3. Generate password for "Mail" on "Other device"
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=

# Admin Email
ADMIN_EMAIL=your-email@gmail.com

# Application
APP_URL=http://localhost:3000
APP_NAME=NT - TAXOFFICE

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5

# Timezone
TIMEZONE=Europe/Athens

# Security
BCRYPT_ROUNDS=12
```

---

## 12. Error Handling

### 12.1 Centralized Error Handler

```javascript
// middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Send response
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
  });
}

module.exports = errorHandler;
```

### 12.2 Custom Error Classes

```javascript
// utils/errors.js
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

module.exports = {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
};
```

---

## 13. UI/UX Specifications

### 13.1 Public Booking Page (`/appointments`)

#### Page Layout

- Clean, centered layout (max-width: 1200px)
- Sticky header with NT - TAXOFFICE branding
- Progress indicator: Select Date → Select Time → Enter Details → Confirm

#### Calendar Component

**Visual Design:**

- Month view grid (7 columns for days of week)
- Navigation: Previous/Next month arrows
- Current month displayed prominently
- Week starts on Monday

**Day Cell States:**

```css
/* Available day - has open slots */
.calendar-day.available {
  background: #d4edda;
  cursor: pointer;
  border: 2px solid #28a745;
}

/* Fully booked */
.calendar-day.booked {
  background: #f8d7da;
  color: #721c24;
  cursor: not-allowed;
}

/* Past date, weekend, or blocked */
.calendar-day.unavailable {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

/* Beyond booking window */
.calendar-day.out-of-range {
  background: #f8f9fa;
  color: #dee2e6;
  cursor: not-allowed;
}

/* Selected */
.calendar-day.selected {
  background: #007bff;
  color: white;
  border: 2px solid #0056b3;
}

/* Hover state (available only) */
.calendar-day.available:hover {
  background: #c3e6cb;
  transform: scale(1.05);
}
```

**Accessibility:**

- Keyboard navigation (arrow keys)
- Enter key to select
- Tab to navigate between controls
- ARIA labels: `aria-label="Select date December 15, 2025"`
- Screen reader announcements for availability

#### Time Slot Selection

**Display:**

- Shown in modal or slide-down panel
- Grid layout (3-4 columns)
- Only show available slots (hide booked)

**Slot Button:**

```css
.time-slot {
  padding: 16px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  text-align: center;
  font-size: 18px;
  font-weight: 500;
}

.time-slot:hover {
  background: #e7f3ff;
  border-color: #007bff;
}

.time-slot.selected {
  background: #007bff;
  color: white;
  border-color: #0056b3;
}
```

#### Booking Form

**Layout:**

- Single column, left-aligned labels
- Input fields: 100% width, 48px height
- Spacing: 24px between fields

**Fields:**

1. **Full Name**
   - Type: text
   - Required: Yes
   - Validation: 2-100 characters
   - Placeholder: "Γιώργος Παπαδόπουλος"

2. **Email**
   - Type: email
   - Required: Yes
   - Validation: Valid email format
   - Placeholder: "giorgos@example.com"

3. **Phone**
   - Type: tel
   - Required: Yes
   - Validation: Greek phone format
   - Placeholder: "+30 6912345678"
   - Help text: "Μορφή: +30 6XXXXXXXXX"

4. **Service Type**
   - Type: select dropdown
   - Required: Yes
   - Options: Pre-populated from database
   - Default: "-- Επιλέξτε υπηρεσία --"

5. **Notes**
   - Type: textarea
   - Required: No
   - Max length: 500 characters
   - Rows: 4
   - Placeholder: "Προαιρετικές σημειώσεις..."

**Validation:**

- Real-time validation on blur
- Error messages below fields
- Red border for invalid fields
- Success checkmark for valid fields

#### Success State

**Display:**

- Full-screen overlay or centered card
- Large checkmark icon (green)
- Success message
- Appointment summary
- Instructions to check email
- Button: "Επιστροφή στην Αρχική"

**Content:**

```
✓ Επιτυχής Υποβολή!

Το αίτημα ραντεβού σας έχει καταχωρηθεί:

Ημερομηνία: 15 Δεκεμβρίου 2025
Ώρα: 10:00
Υπηρεσία: Φορολογική Δήλωση

Θα λάβετε email επιβεβαίωσης στο: giorgos@example.com

Θα επικοινωνήσουμε μαζί σας σύντομα για επιβεβαίωση.
```

### 13.2 Admin Panel

#### Login Page (`/admin/login`)

**Layout:**

- Centered card (max-width: 400px)
- NT - TAXOFFICE logo at top
- Clean, minimal design

**Elements:**

- Username field
- Password field (with show/hide toggle)
- "Σύνδεση" button
- Error message area

#### Setup Page (`/admin/setup`)

**Display Conditions:**

- Only shown when `admin_users` table is empty
- After setup, redirects to login
- Attempting to access setup when admin exists → redirect to login

**Layout:**

- Centered card (max-width: 500px)
- Welcome message
- Instructions

**Fields:**

1. Username (required)
2. Email (required)
3. Password (required, show strength indicator)
4. Confirm Password (required, must match)

**Password Requirements Display:**

```
✓ At least 8 characters
✓ Contains letters and numbers (optional but recommended)
✓ Passwords match
```

#### Dashboard (`/admin/dashboard`)

**Header:**

- NT - TAXOFFICE Admin
- Current admin username
- Logout button

**Navigation Tabs:**

```
[Dashboard] [Pending (3)] [All Appointments] [Availability] [Settings]
```

**Dashboard Tab Content:**

1. **Today's Appointments Section**
   - Shows appointments for current day
   - Color-coded by status
   - Quick action buttons

2. **Pending Requests Section**
   - Highlighted/badged
   - Shows count
   - List of pending appointments
   - Quick approve/decline buttons

3. **Quick Stats**
   - This week: X appointments
   - Pending: X requests
   - Upcoming 7 days: X appointments

**All Appointments Tab:**

**Filters:**

```
[Status: All ▾] [From: ___] [To: ___] [Search: _______] [Apply]
```

**Table:**
| Date/Time | Client | Service | Status | Actions |
|-----------|--------|---------|--------|---------|
| 15/12 10:00 | Γιώργος Π. | Φορολογική | Pending | [View] [✓] [✗] |
| 16/12 14:00 | Μαρία Κ. | Λογιστική | Confirmed | [View] |

**Status Badges:**

```css
.status-pending {
  background: #ffc107;
  color: #000;
}
.status-confirmed {
  background: #28a745;
  color: #fff;
}
.status-declined {
  background: #dc3545;
  color: #fff;
}
.status-cancelled {
  background: #6c757d;
  color: #fff;
}
.status-completed {
  background: #007bff;
  color: #fff;
}
```

**Pagination:**

```
← Previous  [1] 2 3 ... 10  Next →
Showing 1-20 of 195 appointments
```

#### Appointment Detail Modal

**Trigger:** Click "View" or click appointment row

**Layout:**

- Modal overlay (80% width, max 800px)
- Close button (X) top-right

**Content Sections:**

1. **Header**
   - Appointment ID
   - Status badge
   - Created date

2. **Client Information**

   ```
   Name: Γιώργος Παπαδόπουλος
   Email: giorgos@example.com
   Phone: +30 6912345678
   ```

3. **Appointment Details**

   ```
   Date: 15 Δεκεμβρίου 2025
   Time: 10:00
   Service: Φορολογική Δήλωση
   ```

4. **Client Notes**
   - Display notes if present
   - Gray box, italic text

5. **Client History** (if exists)

   ```
   Previous Appointments:
   • 20/11/2025 14:00 - Λογιστική Υποστήριξη (Completed)
   • 15/10/2025 10:00 - Γενική Συμβουλευτική (Completed)

   Total appointments: 3
   ```

6. **Action Buttons**
   - If pending:
     ```
     [✓ Approve]  [✗ Decline]  [Delete]
     ```
   - If confirmed/declined:
     ```
     [Delete]
     ```

**Decline Flow:**

- Click "Decline"
- Modal expands to show textarea
- Label: "Αιτία απόρριψης (προαιρετικό)"
- Placeholder: "π.χ. Δυστυχώς δεν είμαστε διαθέσιμοι αυτή την ημερομηνία"
- Buttons: [Cancel] [Confirm Decline]

#### Availability Settings Page (`/admin/availability`)

**Weekly Schedule Section:**

**Table:**
| Day | Working | Start Time | End Time | Actions |
|-----|---------|------------|----------|---------|
| Δευτέρα | ✓ | 09:00 | 17:00 | [Edit] |
| Τρίτη | ✓ | 09:00 | 17:00 | [Edit] |
| ... | ... | ... | ... | ... |

**Edit Mode:**

- Toggle: Working / Not Working
- If working: Time pickers for start/end
- Save/Cancel buttons

**Blocked Dates Section:**

**Add Blocked Date Form:**

```
[Date Picker] [Reason: ________________] [+ Block Date]
```

**Blocked Dates List:**

```
• 25/12/2025 - Χριστούγεννα [Remove]
• 26/12/2025 - Επόμενη Χριστουγέννων [Remove]
• 01/01/2026 - Πρωτοχρονιά [Remove]
```

**Warning:**
If removing blocked date with existing appointments:

```
⚠ Cannot unblock this date
The following confirmed appointments exist:
• 10:00 - Μαρία Κωνσταντίνου
Please contact clients before unblocking.
```

### 13.3 Cancellation Page (`/appointments/cancel`)

**URL:** `/appointments/cancel?token=xxxxx`

**Valid Token Display:**

```
NT - TAXOFFICE
Ακύρωση Ραντεβού

Είστε σίγουροι ότι θέλετε να ακυρώσετε το ραντεβού σας;

Ημερομηνία: 15 Δεκεμβρίου 2025
Ώρα: 10:00
Υπηρεσία: Φορολογική Δήλωση
Όνομα: Γιώργος Παπαδόπουλος

[Cancel] [Confirm Cancellation]
```

**After Cancellation:**

```
✓ Το ραντεβού ακυρώθηκε

Το ραντεβού σας στις 15 Δεκεμβρίου στις 10:00 έχει ακυρωθεί επιτυχώς.

Μπορείτε να κλείσετε νέο ραντεβού ανά πάσα στιγμή.

[Book New Appointment]
```

**Invalid Token:**

```
⚠ Μη Έγκυρος Σύνδεσμος

Ο σύνδεσμος ακύρωσης δεν είναι έγκυρος ή έχει ήδη χρησιμοποιηθεί.

Αν χρειάζεστε βοήθεια, επικοινωνήστε μαζί μας:
+30 210 8222 950

[Contact Us] [Return Home]
```

---

## 14. Implementation Phases

### Phase 1: Foundation & Database (5-6 hours)

**Tasks:**

1. Install new dependencies

   ```bash
   npm install better-sqlite3 bcrypt express-session connect-sqlite3 nodemailer uuid moment-timezone express-rate-limit helmet
   ```

2. Create database structure
   - `database/init.js` - Initialization script
   - `database/schema.sql` - All table definitions
   - Run initialization

3. Set up environment configuration
   - Create `.env.example`
   - Document all required variables
   - Add to `.gitignore`

4. Create database service
   - `services/database.js` - Connection singleton
   - Export `getDb()` function

5. Update `server.js`
   - Add session middleware
   - Add helmet for security headers
   - Add rate limiters
   - Initialize database on startup

6. Create utility modules
   - `utils/validation.js`
   - `utils/sanitization.js`
   - `utils/logger.js`
   - `services/timezone.js`

**Deliverables:**

- Working database with all tables
- Environment configuration documented
- Security middleware configured
- Utility functions ready

**Testing:**

- Database initialization works
- Can insert/query test data
- Environment variables load correctly
- Timezone functions work correctly

---

### Phase 2: Public Availability API (6-8 hours)

**Tasks:**

1. Create availability service
   - `services/availability.js`
   - Function: `getMonthAvailability(year, month)`
   - Function: `checkSlotAvailability(date, time)`
   - Function: `generateTimeSlots(startTime, endTime)`
   - Handle working days logic
   - Handle blocked dates
   - Handle existing bookings
   - Apply 24-hour minimum notice
   - Apply 60-day max booking window

2. Create availability routes
   - `routes/api/availability.js`
   - `GET /api/availability?month=YYYY-MM`
   - `GET /api/appointments/check-availability?date=YYYY-MM-DD&time=HH:MM`

3. Add timezone handling
   - Use `moment-timezone` throughout
   - Set default timezone: Europe/Athens
   - Convert all dates/times properly

4. Add error handling
   - Validate date formats
   - Handle invalid requests
   - Return proper error codes

**Deliverables:**

- Availability calculation working
- Real-time slot checking functional
- Timezone handling correct
- API endpoints tested

**Testing:**

- Test with various months
- Test past dates (should be unavailable)
- Test beyond 60 days (should be unavailable)
- Test blocked dates
- Test fully booked days
- Test working vs. non-working days

---

### Phase 3: Public Booking System (7-9 hours)

**Tasks:**

1. Create appointments service
   - `services/appointments.js`
   - Function: `createAppointment(data)` with transaction
   - Function: `getAppointmentByToken(token)`
   - Function: `cancelAppointment(token)`
   - Implement row-level locking
   - Create history entries
   - Generate cancellation tokens

2. Create appointments routes
   - `routes/api/appointments.js`
   - `POST /api/appointments`
   - `GET /api/appointments/by-token/:token`
   - `POST /api/appointments/cancel`

3. Add validation & sanitization
   - Validate all input fields
   - Sanitize strings
   - Check phone number format
   - Verify email format

4. Add rate limiting
   - Apply to booking endpoint
   - 5 requests per hour per IP

5. Build booking page HTML
   - `public/appointments.html`
   - Header with navigation
   - Calendar container
   - Time slot selection area
   - Booking form
   - Success state

6. Build booking page CSS
   - `public/css/pages/appointments.css`
   - Calendar grid styles
   - Day cell states
   - Time slot buttons
   - Form styles
   - Responsive design

7. Build booking page JavaScript
   - `public/js/appointments.js`
   - Calendar rendering
   - Month navigation
   - Day selection
   - Time slot fetching/display
   - Form submission
   - Real-time validation
   - Success/error handling

**Deliverables:**

- Functional booking page
- Clients can view availability
- Clients can submit requests
- Data stored in database
- Concurrent booking protection works

**Testing:**

- Book appointment (success case)
- Try to book same slot twice (should fail)
- Try to book past date (should fail)
- Try to book beyond window (should fail)
- Validate form inputs
- Test on mobile devices

---

### Phase 4: Admin Authentication (4-5 hours)

**Tasks:**

1. Create auth middleware
   - `middleware/auth.js`
   - Function: `requireAuth(req, res, next)`
   - Check session for adminId

2. Create setup check middleware
   - `middleware/setupCheck.js`
   - Check if admin exists
   - Redirect to setup if needed

3. Implement setup wizard
   - `routes/admin/auth.js`
   - `GET /api/admin/setup-status`
   - `POST /api/admin/setup`
   - Hash password with bcrypt
   - Create first admin

4. Implement login/logout
   - `POST /api/admin/login`
   - `POST /api/admin/logout`
   - Verify credentials
   - Create/destroy sessions

5. Build setup page
   - `public/admin/setup.html`
   - Welcome message
   - Setup form
   - Password strength indicator

6. Build login page
   - `public/admin/login.html`
   - Clean, centered design
   - Username/password fields
   - Error display

7. Build setup/login JavaScript
   - `public/js/admin/setup.js`
   - `public/js/admin/login.js`
   - Form submission
   - Validation
   - Redirect handling

**Deliverables:**

- First-time setup working
- Admin can log in/out
- Protected routes functional
- Sessions persist correctly

**Testing:**

- First setup creates admin
- Cannot access setup again
- Login with correct credentials
- Login with wrong credentials (should fail)
- Logout clears session
- Protected routes require auth

---

### Phase 5: Admin Dashboard (6-8 hours)

**Tasks:**

1. Implement admin appointment endpoints
   - `routes/admin/appointments.js`
   - `GET /api/admin/appointments` (with filters, pagination)
   - `GET /api/admin/appointments/:id`
   - `PATCH /api/admin/appointments/:id` (update status)
   - `DELETE /api/admin/appointments/:id`

2. Update appointments service
   - Function: `getAppointments(filters, pagination)`
   - Function: `getAppointmentById(id)`
   - Function: `updateAppointmentStatus(id, status, reason)`
   - Function: `deleteAppointment(id)`
   - Function: `getClientHistory(email)`
   - Add history logging

3. Build dashboard HTML
   - `public/admin/dashboard.html`
   - Header with navigation
   - Tab navigation
   - Dashboard overview section
   - Pending appointments section
   - All appointments table
   - Filters

4. Build admin CSS
   - `public/css/pages/admin.css`
   - Dashboard layout
   - Table styles
   - Status badges
   - Modal styles
   - Responsive design

5. Build dashboard JavaScript
   - `public/js/admin/dashboard.js`
   - Tab switching
   - Load appointments
   - Apply filters
   - Pagination
   - Open detail modal
   - Approve/decline actions
   - Delete confirmation
   - Real-time updates

**Deliverables:**

- Admin can view all appointments
- Admin can filter/search
- Admin can accept/decline requests
- Status updates work correctly
- History is logged

**Testing:**

- View pending appointments
- View all appointments
- Filter by status
- Filter by date range
- Search by name/email
- Accept appointment (client receives email)
- Decline appointment (client receives email)
- Delete appointment
- View client history

---

### Phase 6: Email System (5-6 hours)

**Tasks:**

1. Set up Nodemailer
   - Configure Gmail SMTP
   - Test connection
   - Handle authentication

2. Create email service
   - `services/email.js`
   - Function: `sendEmail(to, subject, html, text)`
   - Function: `renderEmailTemplate(template, data)`
   - Template variable replacement

3. Create email queue service
   - `services/emailQueue.js`
   - Function: `queueEmail(recipient, subject, template, data)`
   - Function: `processEmailQueue()` - background processor
   - Start queue processor on server startup

4. Create email templates
   - `views/emails/booking-received.html` + `.txt`
   - `views/emails/booking-confirmed.html` + `.txt`
   - `views/emails/booking-declined.html` + `.txt`
   - `views/emails/booking-cancelled.html` + `.txt`
   - `views/emails/admin-new-booking.html` + `.txt`
   - `views/emails/admin-cancellation.html` + `.txt`
   - Use inline CSS for HTML versions
   - Include all necessary variables

5. Integrate emails into booking flow
   - After appointment creation → Queue emails
   - After status update → Queue emails
   - After cancellation → Queue emails

6. Test email delivery
   - Send test emails
   - Verify formatting
   - Check spam folder
   - Verify links work

**Deliverables:**

- All email notifications working
- Templates styled professionally
- Emails delivered reliably
- Queue handles retries

**Testing:**

- Create appointment (client + admin emails)
- Approve appointment (client email)
- Decline appointment (client email)
- Cancel appointment (admin email)
- Check all variables render correctly
- Test on multiple email clients
- Verify plain text fallback

---

### Phase 7: Cancellation System (3-4 hours)

**Tasks:**

1. Build cancellation page HTML
   - `public/cancel-appointment.html`
   - Show appointment details
   - Confirmation button
   - Success/error states

2. Build cancellation page CSS
   - Center layout
   - Appointment details card
   - Button styles
   - Status messages

3. Build cancellation page JavaScript
   - `public/js/cancel-appointment.js`
   - Parse token from URL
   - Fetch appointment details
   - Submit cancellation
   - Handle responses

4. Test cancellation flow
   - Valid token
   - Invalid token
   - Already cancelled
   - Past appointment

**Deliverables:**

- Clients can cancel via email link
- Admin notified of cancellations
- Error states handled

**Testing:**

- Click cancellation link (valid)
- Confirm cancellation
- Try to cancel again (should show already cancelled)
- Try invalid token
- Try to cancel past appointment
- Verify admin receives notification

---

### Phase 8: Availability Management (4-5 hours)

**Tasks:**

1. Implement availability admin endpoints
   - `routes/admin/availability.js`
   - `GET /api/admin/availability`
   - `PUT /api/admin/availability/schedule`
   - `POST /api/admin/availability/blocked-dates`
   - `DELETE /api/admin/availability/blocked-dates/:id`

2. Update availability service
   - Function: `getAvailabilitySettings()`
   - Function: `updateWeeklySchedule(schedule)`
   - Function: `blockDate(date, reason)`
   - Function: `unblockDate(id)`
   - Check for conflicts when blocking

3. Build availability settings HTML
   - `public/admin/availability.html`
   - Weekly schedule section
   - Blocked dates section
   - Forms and controls

4. Build availability settings JavaScript
   - `public/js/admin/availability.js`
   - Load current settings
   - Edit weekly schedule
   - Add blocked date
   - Remove blocked date
   - Save changes

5. Test schedule changes
   - Verify changes reflect in public calendar
   - Test conflict detection

**Deliverables:**

- Admin can modify weekly schedule
- Admin can block specific dates
- Changes reflect immediately

**Testing:**

- Change working hours
- Toggle working days on/off
- Block a date
- Try to block date with appointments (should warn)
- Unblock a date
- Verify public calendar updates

---

### Phase 9: Polish & Testing (4-6 hours)

**Tasks:**

1. Add navigation links
   - Update index.html with appointments link
   - Add admin links in dashboard
   - Ensure all pages interconnect

2. Responsive design testing
   - Test on mobile (320px, 375px, 414px)
   - Test on tablet (768px, 1024px)
   - Test on desktop (1280px, 1920px)
   - Fix layout issues

3. Accessibility improvements
   - Add ARIA labels
   - Test keyboard navigation
   - Test with screen reader
   - Ensure color contrast

4. Error handling improvements
   - User-friendly error messages
   - Network error handling
   - Timeout handling
   - Graceful degradation

5. Edge case testing
   - Concurrent booking attempts
   - Network failures
   - Invalid data
   - Database errors
   - Email failures

6. Performance optimization
   - Add database indexes (already in schema)
   - Optimize queries
   - Add loading states
   - Cache availability data (5 minutes)

7. Documentation
   - Create deployment guide
   - Document API endpoints
   - Add code comments
   - Create backup procedures

8. Security review
   - Test SQL injection protection
   - Test XSS protection
   - Test CSRF protection
   - Test rate limiting
   - Review session security

**Deliverables:**

- Fully integrated system
- Mobile-friendly
- Accessible
- Production-ready
- Documented

**Testing:**

- Complete end-to-end user flows
- Test all error scenarios
- Security testing
- Performance testing
- Browser compatibility testing

---

## 15. Total Estimated Time

| Phase                      | Hours           |
| -------------------------- | --------------- |
| Phase 1: Foundation        | 5-6             |
| Phase 2: Availability API  | 6-8             |
| Phase 3: Public Booking    | 7-9             |
| Phase 4: Admin Auth        | 4-5             |
| Phase 5: Admin Dashboard   | 6-8             |
| Phase 6: Email System      | 5-6             |
| Phase 7: Cancellation      | 3-4             |
| Phase 8: Availability Mgmt | 4-5             |
| Phase 9: Polish & Testing  | 4-6             |
| **Total**                  | **44-57 hours** |

**Recommended Schedule:**

- Week 1: Phases 1-3 (Foundation + Booking)
- Week 2: Phases 4-6 (Admin + Email)
- Week 3: Phases 7-9 (Cancellation + Polish)

---

## 16. Testing Checklist

### 16.1 Public Booking

- [ ] Calendar displays current month correctly
- [ ] Navigation between months works
- [ ] Past dates are disabled
- [ ] Dates beyond 60 days are disabled
- [ ] Weekends show as closed (if configured)
- [ ] Blocked dates show as unavailable
- [ ] Available slots display correctly
- [ ] Booked slots are hidden
- [ ] Real-time availability check works
- [ ] Form validation works (all fields)
- [ ] Successful booking creates pending appointment
- [ ] Duplicate slot booking is prevented (concurrent test)
- [ ] Success message displays correctly
- [ ] Client receives confirmation email
- [ ] Admin receives notification email

### 16.2 Admin Panel

- [ ] Setup wizard shows only when no admin exists
- [ ] Admin account creation works
- [ ] Login with correct credentials works
- [ ] Login with wrong credentials shows error
- [ ] Session persists across page refreshes
- [ ] Logout clears session
- [ ] Dashboard shows appointments correctly
- [ ] Filtering by status works
- [ ] Date range filtering works
- [ ] Search by name/email works
- [ ] Pagination works
- [ ] Appointment detail modal opens
- [ ] Client history displays
- [ ] Accept changes status to confirmed
- [ ] Decline changes status to declined
- [ ] Delete removes appointment
- [ ] All actions send appropriate emails

### 16.3 Email Notifications

- [ ] Booking received email sent to client
- [ ] New booking email sent to admin
- [ ] Confirmation email sent when accepted
- [ ] Decline email sent when declined
- [ ] Cancellation email sent to admin
- [ ] All emails display correctly (HTML)
- [ ] Plain text alternatives work
- [ ] Links in emails work
- [ ] Variables are replaced correctly
- [ ] Emails don't go to spam

### 16.4 Cancellation

- [ ] Cancellation link in email works
- [ ] Cancellation page shows appointment details
- [ ] Confirming cancellation updates status
- [ ] Invalid token shows error
- [ ] Already cancelled appointment shows message
- [ ] Past appointment cannot be cancelled
- [ ] Admin receives cancellation notification

### 16.5 Availability Management

- [ ] Weekly schedule displays correctly
- [ ] Toggling working days works
- [ ] Changing hours works
- [ ] Adding blocked date works
- [ ] Removing blocked date works
- [ ] Cannot block date with confirmed appointments
- [ ] Changes reflect in public calendar immediately
- [ ] Validation prevents invalid schedules

### 16.6 Security

- [ ] SQL injection attempts fail
- [ ] XSS attempts are sanitized
- [ ] Passwords are hashed (bcrypt)
- [ ] Sessions are secure (httpOnly, sameSite)
- [ ] Rate limiting works (booking endpoint)
- [ ] Rate limiting works (login endpoint)
- [ ] Protected routes require authentication
- [ ] CSRF tokens validate correctly
- [ ] Invalid tokens are rejected

### 16.7 Edge Cases

- [ ] Two users booking same slot → one succeeds, one fails
- [ ] Network error during booking → handled gracefully
- [ ] Email send failure → queued for retry
- [ ] Database connection lost → error message shown
- [ ] Invalid date formats → validation error
- [ ] Timezone edge cases handled correctly
- [ ] Long text in notes field → handled properly
- [ ] Special characters in input → sanitized
- [ ] Concurrent status updates → optimistic locking works

### 16.8 Performance

- [ ] Page load time < 2 seconds
- [ ] Calendar render time < 500ms
- [ ] API responses < 300ms
- [ ] Database queries use indexes
- [ ] No N+1 query problems
- [ ] Email queue processes efficiently
- [ ] Multiple concurrent bookings handled

### 16.9 Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] ARIA labels present
- [ ] Color contrast sufficient
- [ ] Focus indicators visible
- [ ] Error messages announced
- [ ] Success messages announced

### 16.10 Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### 16.11 Responsive Design

- [ ] Mobile (320px width)
- [ ] Mobile (375px width)
- [ ] Mobile (414px width)
- [ ] Tablet (768px width)
- [ ] Tablet (1024px width)
- [ ] Desktop (1280px width)
- [ ] Desktop (1920px width)

---

## 17. Deployment Guide

### 17.1 Pre-Deployment Checklist

- [ ] All environment variables documented
- [ ] `.env.example` created
- [ ] Database schema finalized
- [ ] All tests passing
- [ ] Security review completed
- [ ] Gmail App Password generated
- [ ] Production domain configured

### 17.2 Server Requirements

**Minimum:**

- Node.js 18.x or higher
- 512 MB RAM
- 1 GB disk space
- HTTPS support

**Recommended:**

- Node.js 20.x
- 1 GB RAM
- 2 GB disk space
- CDN for static assets

### 17.3 Deployment Steps

1. **Clone Repository**

   ```bash
   git clone <repository-url>
   cd nt-taxoffice-node
   ```

2. **Install Dependencies**

   ```bash
   npm install --production
   ```

3. **Configure Environment**

   ```bash
   cp .env.example .env
   # Edit .env with production values
   nano .env
   ```

4. **Initialize Database**

   ```bash
   node database/init.js
   ```

5. **Start Application**

   ```bash
   NODE_ENV=production npm start
   ```

6. **Set Up Process Manager (PM2)**

   ```bash
   npm install -g pm2
   pm2 start server.js --name nt-taxoffice
   pm2 save
   pm2 startup
   ```

7. **Configure Reverse Proxy (Nginx)**

   ```nginx
   server {
       listen 80;
       server_name appointments.ntallas.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Set Up SSL (Let's Encrypt)**
   ```bash
   sudo certbot --nginx -d appointments.ntallas.com
   ```

### 17.4 Monitoring

**What to Monitor:**

- Server uptime
- Database size
- Email queue length
- Failed email attempts
- Error logs
- Booking success rate
- Response times

**Tools:**

- PM2 for process monitoring
- `winston` for logging
- Database backup cron job

### 17.5 Backup Strategy

**Database Backup:**

```bash
# Daily backup cron job
0 2 * * * cp /path/to/nt-taxoffice.db /backups/nt-taxoffice-$(date +\%Y\%m\%d).db
```

**Keep:**

- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 12 months

---

## 18. Maintenance & Operations

### 18.1 Scheduled Maintenance Tasks

**Daily:**

- Check email queue for failures
- Review error logs
- Monitor disk space

**Weekly:**

- Review booking patterns
- Check for failed emails
- Update appointment statuses (mark past as completed)

**Monthly:**

- Database cleanup (old cancelled appointments)
- Backup verification
- Security updates

### 18.2 Database Cleanup Script

```javascript
// scripts/cleanup.js
const db = require('./services/database').getDb();

// Mark past appointments as completed
db.prepare(
  `
    UPDATE appointments 
    SET status = 'completed'
    WHERE status IN ('confirmed', 'pending')
    AND appointment_date < date('now', '-1 day')
`
).run();

// Delete very old cancelled appointments (optional, after 1 year)
db.prepare(
  `
    DELETE FROM appointments
    WHERE status IN ('cancelled', 'declined')
    AND created_at < date('now', '-1 year')
`
).run();

// Clean up old email queue entries (after 30 days)
db.prepare(
  `
    DELETE FROM email_queue
    WHERE status = 'sent'
    AND sent_at < date('now', '-30 days')
`
).run();

console.log('Cleanup completed');
```

**Run via Cron:**

```bash
0 3 * * * cd /path/to/nt-taxoffice-node && node scripts/cleanup.js
```

---

## 19. Future Enhancements (Out of Scope)

These features are not included in the initial implementation but could be added later:

1. **SMS Notifications** (via Twilio or similar)
   - Send SMS confirmations
   - Send SMS reminders 24h before

2. **Google Calendar Integration**
   - Sync appointments to Google Calendar
   - Two-way sync

3. **Multiple Staff Members**
   - Individual calendars
   - Staff selection during booking
   - Staff availability management

4. **Recurring Appointments**
   - Weekly/monthly recurring slots
   - Series management

5. **Online Payment**
   - Stripe integration
   - Prepayment for consultations
   - Cancellation refund policies

6. **Client Portal**
   - View booking history
   - Manage profile
   - Reschedule appointments

7. **Analytics Dashboard**
   - Booking trends
   - Popular times
   - Revenue tracking
   - Client retention metrics

8. **Automated Reminders**
   - 24h before appointment
   - 1h before appointment
   - Follow-up after appointment

9. **Waitlist Feature**
   - Join waitlist for fully booked days
   - Auto-notify when slot opens

10. **Multi-Language Support**
    - English option
    - Language switcher

11. **Video Conferencing Integration**
    - Zoom/Google Meet links
    - Virtual appointments

12. **Custom Service Duration**
    - 30 min / 1 hour / 2 hour slots
    - Different durations per service

---

## 20. Success Criteria

The appointment booking system will be considered successful when:

1. **Functionality:**
   - Clients can successfully book appointments
   - Admin can manage appointments
   - All emails are delivered reliably
   - No double-bookings occur

2. **Performance:**
   - Page loads in < 2 seconds
   - API responses in < 300ms
   - Can handle 10 concurrent bookings

3. **Usability:**
   - Mobile-friendly
   - Accessible (WCAG AA)
   - Intuitive interface
   - Clear error messages

4. **Reliability:**
   - 99.9% uptime
   - Zero data loss
   - Automatic error recovery
   - Backup system operational

5. **Security:**
   - No security vulnerabilities
   - Data encrypted in transit (HTTPS)
   - Passwords properly hashed
   - Sessions secure

---

## 21. Support & Troubleshooting

### 21.1 Common Issues

**Issue:** Emails not sending
**Solution:** Check Gmail App Password, verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `.env`

**Issue:** Concurrent bookings happening
**Solution:** Verify database has `PRAGMA foreign_keys = ON` and `PRAGMA journal_mode = WAL`

**Issue:** Times showing incorrectly
**Solution:** Check `TIMEZONE` environment variable is set to `Europe/Athens`

**Issue:** Admin can't log in
**Solution:** Check if setup was completed, verify password, check session configuration

**Issue:** Calendar not showing availability
**Solution:** Check if weekly schedule is configured, verify blocked dates, check for database errors

### 21.2 Log Locations

- Application logs: Console output (capture with PM2)
- Error logs: `logs/error.log` (if winston configured)
- Database: `database/nt-taxoffice.db`
- Email queue: Check `email_queue` table

### 21.3 Emergency Procedures

**Database Corruption:**

1. Stop application
2. Restore from latest backup
3. Restart application
4. Verify data integrity

**Email System Failure:**

1. Check Gmail credentials
2. Verify email queue table
3. Check for rate limiting from Gmail
4. Manually process failed emails if needed

---

## 22. Questions for Client

Before implementation begins, confirm the following:

1. **Service Types:**
   - Are the sample service types correct?
   - Any additions or changes needed?

2. **Operating Hours:**
   - Confirm Monday-Friday 09:00-17:00
   - Any exceptions or changes needed?

3. **Holidays:**
   - Provide list of Greek holidays to pre-block
   - Any company-specific holidays?

4. **Email Settings:**
   - Confirm Gmail account for sending: ntallas@ntallas.com
   - Gmail App Password has been generated?
   - Admin notification email: same as Gmail or different?

5. **Branding:**
   - Use existing NT - TAXOFFICE branding?
   - Any specific colors or styling preferences?

6. **Additional Requirements:**
   - Any features from "Future Enhancements" needed in initial release?
   - Any specific reporting requirements?

---

## End of Document

**Document Version:** 2.0  
**Last Updated:** November 25, 2025  
**Status:** Ready for Implementation  
**Next Step:** Begin Phase 1 - Foundation & Database
