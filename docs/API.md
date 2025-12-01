# API Documentation

Complete reference for the NT TaxOffice Node REST API.

**Last Updated:** December 1, 2025

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Client API](#client-api)
  - [Availability Endpoints](#availability-endpoints)
  - [Appointment Booking](#appointment-booking)
- [Admin API](#admin-api)
  - [Authentication](#admin-authentication)
  - [Appointment Management](#appointment-management)
  - [Availability Configuration](#availability-configuration)

---

## Overview

The NT TaxOffice API provides two sets of endpoints:

1. **Client API** (Public) - For booking appointments and checking availability
2. **Admin API** (Protected) - For managing appointments and configuring the system

All endpoints return JSON responses and follow RESTful conventions.

**Base URL:** `http://localhost:3000` (or your deployed domain)

---

## Authentication

### Client API
No authentication required. These endpoints are publicly accessible.

### Admin API
Requires session-based authentication. After logging in via `/api/admin/login`, a session cookie is set that must be included in all subsequent requests.

**Session Cookie:** `connect.sid` (HTTP-only, secure in production)

**How Sessions Work:**
- Login creates a server-side session stored in memory
- Session ID is sent to client as HTTP-only cookie
- Client automatically includes cookie in subsequent requests
- Sessions expire after 24 hours of inactivity

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse.

| Endpoint Type | Window | Max Requests | Why? |
|---------------|--------|--------------|------|
| Booking | 1 hour | 5 | Prevents spam bookings |
| Cancellation | 1 hour | 10 | Allows legitimate cancellations |
| Login | 15 minutes | 5 | Prevents brute-force attacks |
| Setup | 15 minutes | 3 | First-time setup is rare |
| General Admin API | 15 minutes | 100 | Normal admin usage |

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1638360000
```

**When Rate Limited:**
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Optional success message",
  "data": { },
  "count": 10  // Optional, for lists
}
```

### Error Response
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": {  // Optional, for validation errors
    "field_name": "Error description"
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created (e.g., new appointment) |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Not logged in (admin endpoints) |
| 403 | Forbidden | Logged in but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Slot already booked, race condition |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

### Common Error Scenarios

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Invalid data provided.",
  "errors": {
    "client_email": "Invalid email format",
    "client_phone": "Phone number must be 10 digits"
  }
}
```

**Conflict Error (409):**
```json
{
  "success": false,
  "message": "This time slot was just booked by another user. Please select another time."
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "message": "Authentication required. Please log in."
}
```

---

# Client API

Public endpoints for checking availability and booking appointments.

## Availability Endpoints

### GET /api/availability/dates

Get all available dates with time slots for the booking window (next 30 days).

**Use Case:** Initial calendar population in booking interface.

**Authentication:** None required

**Rate Limiting:** General rate limit (100 requests per 15 minutes)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-12-15",
      "dayOfWeek": 1,  // 0 = Sunday, 6 = Saturday
      "slots": ["09:00", "09:30", "10:00", "10:30"],
      "availableCount": 4
    },
    {
      "date": "2025-12-16",
      "dayOfWeek": 2,
      "slots": ["09:00", "09:30", "10:00"],
      "availableCount": 3
    }
  ],
  "count": 2
}
```

**Example:**
```bash
curl http://localhost:3000/api/availability/dates
```

---

### GET /api/availability/slots/:date

Get available time slots for a specific date.

**Use Case:** When user selects a date in the booking calendar.

**Authentication:** None required

**Parameters:**
- `date` (URL parameter) - Date in YYYY-MM-DD format

**Validation:**
- Date must be in future
- Date must be within booking window (30 days)
- Date must be a working day

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-12-15",
    "slots": ["09:00", "09:30", "10:00", "10:30", "11:00"]
  },
  "count": 5
}
```

**Error - Invalid Date:**
```json
{
  "success": false,
  "message": "Date must be in the future."
}
```

**Example:**
```bash
curl http://localhost:3000/api/availability/slots/2025-12-15
```

---

### POST /api/availability/check

Check if a specific date and time slot is available.

**Use Case:** Real-time availability check before booking submission.

**Authentication:** None required

**Request Body:**
```json
{
  "date": "2025-12-15",
  "time": "09:00"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-12-15",
    "time": "09:00",
    "available": true
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/availability/check \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-12-15","time":"09:00"}'
```

---

### GET /api/availability/next

Get the next available appointment slot.

**Use Case:** "Next available" feature in booking interface.

**Authentication:** None required

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-12-15",
    "time": "09:00",
    "dayOfWeek": 1
  }
}
```

**Response - No Availability:**
```json
{
  "success": true,
  "data": null,
  "message": "No available slots at this time."
}
```

**Example:**
```bash
curl http://localhost:3000/api/availability/next
```

---

## Appointment Booking

### POST /api/appointments/book

Create a new appointment booking.

**Use Case:** Final step of booking flow - submit appointment request.

**Authentication:** None required

**Rate Limiting:** 5 requests per hour per IP

**Request Body:**
```json
{
  "client_name": "John Doe",
  "client_email": "john@example.com",
  "client_phone": "2101234567",
  "appointment_date": "2025-12-15",
  "appointment_time": "09:00",
  "service_type": "tax_consultation",
  "notes": "Optional notes about the appointment"
}
```

**Field Validation:**

| Field | Rules | Example |
|-------|-------|---------|
| `client_name` | Required, 2-100 chars, letters and spaces | "John Doe" |
| `client_email` | Required, valid email format | "john@example.com" |
| `client_phone` | Required, 10 digits | "2101234567" |
| `appointment_date` | Required, future date, YYYY-MM-DD | "2025-12-15" |
| `appointment_time` | Required, HH:MM format | "09:00" |
| `service_type` | Required, one of predefined types | "tax_consultation" |
| `notes` | Optional, max 500 chars | "Need help with VAT" |

**Service Types:**
- `tax_consultation` - Tax Consultation
- `annual_tax_return` - Annual Tax Return
- `payroll` - Payroll Services
- `vat_return` - VAT Return
- `other` - Other Services

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Your appointment was created successfully! You will receive a confirmation email soon.",
  "data": {
    "id": 123,
    "appointment_date": "2025-12-15",
    "appointment_time": "09:00",
    "service_type": "tax_consultation",
    "status": "pending",
    "cancellation_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

**Error - Validation Failed (400):**
```json
{
  "success": false,
  "message": "Invalid data provided.",
  "errors": {
    "client_email": "Invalid email format",
    "appointment_date": "Date must be in the future"
  }
}
```

**Error - Slot No Longer Available (409):**
```json
{
  "success": false,
  "message": "This time slot was just booked by another user. Please select another time."
}
```

**Why 409 Conflict?**
This can happen due to a race condition when two users try to book the same slot simultaneously. The application uses database-level locking to prevent double bookings, but one user will get a 409 error.

**Example:**
```bash
curl -X POST http://localhost:3000/api/appointments/book \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "John Doe",
    "client_email": "john@example.com",
    "client_phone": "2101234567",
    "appointment_date": "2025-12-15",
    "appointment_time": "09:00",
    "service_type": "tax_consultation",
    "notes": "Need assistance with annual tax return"
  }'
```

---

### GET /api/appointments/:token

Get appointment details using the cancellation token.

**Use Case:** Appointment details page, accessible via email link.

**Authentication:** None required (token provides authorization)

**Parameters:**
- `token` (URL parameter) - UUID cancellation token (36 characters)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "client_name": "John Doe",
    "client_email": "john@example.com",
    "client_phone": "2101234567",
    "appointment_date": "2025-12-15",
    "appointment_time": "09:00",
    "service_type": "tax_consultation",
    "notes": "Need assistance with annual tax return",
    "status": "pending",
    "created_at": "2025-12-01T10:30:00.000Z"
  }
}
```

**Error - Invalid Token (400):**
```json
{
  "success": false,
  "message": "Invalid cancellation token format."
}
```

**Error - Not Found (404):**
```json
{
  "success": false,
  "message": "Appointment not found."
}
```

**Example:**
```bash
curl http://localhost:3000/api/appointments/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### DELETE /api/appointments/cancel/:token

Cancel an appointment using the cancellation token.

**Use Case:** User clicks "Cancel Appointment" link in email.

**Authentication:** None required (token provides authorization)

**Rate Limiting:** 10 requests per hour per IP

**Parameters:**
- `token` (URL parameter) - UUID cancellation token

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Your appointment has been cancelled successfully.",
  "data": {
    "id": 123,
    "status": "cancelled",
    "cancelled_at": "2025-12-01T12:00:00.000Z"
  }
}
```

**Error - Already Cancelled (400):**
```json
{
  "success": false,
  "message": "This appointment has already been cancelled."
}
```

**Error - Cannot Cancel (400):**
```json
{
  "success": false,
  "message": "Cannot cancel appointments that are completed or declined."
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/appointments/cancel/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

# Admin API

Protected endpoints for managing the appointment system. All endpoints require authentication.

## Admin Authentication

### POST /api/admin/setup

Create the first admin user. Only works when no admin account exists.

**Use Case:** Initial system setup - creates the first admin account.

**Authentication:** None required (but only works if no admin exists)

**Rate Limiting:** 3 requests per 15 minutes

**Request Body:**
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**Field Validation:**
- `username`: 3-30 characters, alphanumeric and underscores
- `email`: Valid email format
- `password`: Minimum 8 characters

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Admin user created successfully! You can now log in.",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

**Error - Admin Already Exists (400):**
```json
{
  "success": false,
  "message": "Admin account already exists."
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "SecurePassword123!"
  }'
```

---

### POST /api/admin/login

Authenticate admin user and create a session.

**Use Case:** Admin panel login page.

**Authentication:** None required (this creates the session)

**Rate Limiting:** 5 requests per 15 minutes (prevents brute-force)

**Request Body:**
```json
{
  "username": "admin",
  "password": "SecurePassword123!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

**Sets Session Cookie:**
```http
Set-Cookie: connect.sid=s%3A...; Path=/; HttpOnly; SameSite=Strict
```

**Error - Invalid Credentials (401):**
```json
{
  "success": false,
  "message": "Incorrect username or password."
}
```

**Security Notes:**
- Failed login attempts are logged for security monitoring
- Password is hashed with bcrypt (12 rounds by default)
- Session cookie is HTTP-only (not accessible via JavaScript)

**Example:**
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"SecurePassword123!"}' \
  -c cookies.txt  # Save cookies for subsequent requests
```

---

### POST /api/admin/logout

End the current admin session.

**Use Case:** Admin panel logout button.

**Authentication:** Required (must be logged in)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/admin/logout \
  -b cookies.txt  # Include session cookie
```

---

### GET /api/admin/check-setup

Check if initial setup is complete (admin account exists).

**Use Case:** Redirect to setup page if no admin exists.

**Authentication:** None required

**Response - Setup Complete:**
```json
{
  "success": true,
  "setupComplete": true
}
```

**Response - Setup Needed:**
```json
{
  "success": true,
  "setupComplete": false
}
```

**Example:**
```bash
curl http://localhost:3000/api/admin/check-setup
```

---

## Appointment Management

All endpoints in this section require authentication (valid admin session).

### GET /api/admin/appointments

List all appointments with filtering, sorting, and pagination.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `status` | string | Filter by status | `pending`, `confirmed`, `declined`, `completed`, `cancelled` |
| `startDate` | string | Filter by date range (start) | `2025-12-01` |
| `endDate` | string | Filter by date range (end) | `2025-12-31` |
| `search` | string | Search in name, email, phone | `John` |
| `page` | number | Page number (default: 1) | `1` |
| `limit` | number | Results per page (default: 50) | `20` |
| `sortBy` | string | Sort field | `appointment_date`, `created_at`, `status`, `client_name` |
| `sortOrder` | string | Sort direction | `ASC`, `DESC` |

**Response:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": 123,
        "client_name": "John Doe",
        "client_email": "john@example.com",
        "client_phone": "2101234567",
        "appointment_date": "2025-12-15",
        "appointment_time": "09:00",
        "service_type": "tax_consultation",
        "notes": "Need assistance with annual tax return",
        "status": "pending",
        "decline_reason": null,
        "cancellation_token": "a1b2c3d4-...",
        "created_at": "2025-12-01T10:30:00.000Z",
        "updated_at": "2025-12-01T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 42,
      "totalPages": 1
    }
  }
}
```

**Example - Get Pending Appointments:**
```bash
curl http://localhost:3000/api/admin/appointments?status=pending \
  -b cookies.txt
```

**Example - Search and Sort:**
```bash
curl "http://localhost:3000/api/admin/appointments?search=John&sortBy=created_at&sortOrder=DESC" \
  -b cookies.txt
```

---

### GET /api/admin/appointments/:id

Get detailed information about a specific appointment.

**Authentication:** Required

**Parameters:**
- `id` (URL parameter) - Appointment ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "client_name": "John Doe",
    "client_email": "john@example.com",
    "client_phone": "2101234567",
    "appointment_date": "2025-12-15",
    "appointment_time": "09:00",
    "service_type": "tax_consultation",
    "notes": "Need assistance with annual tax return",
    "status": "pending",
    "decline_reason": null,
    "cancellation_token": "a1b2c3d4-...",
    "created_at": "2025-12-01T10:30:00.000Z",
    "updated_at": "2025-12-01T10:30:00.000Z",
    "version": 1
  }
}
```

**Error - Not Found (404):**
```json
{
  "success": false,
  "message": "Appointment not found."
}
```

**Example:**
```bash
curl http://localhost:3000/api/admin/appointments/123 \
  -b cookies.txt
```

---

### PUT /api/admin/appointments/:id/status

Update the status of an appointment (approve, decline, complete).

**Authentication:** Required

**Parameters:**
- `id` (URL parameter) - Appointment ID

**Request Body:**
```json
{
  "status": "confirmed",
  "decline_reason": "Optional reason if declining"
}
```

**Valid Status Transitions:**

| From | To | Notes |
|------|-----|-------|
| `pending` | `confirmed` | Approve booking |
| `pending` | `declined` | Reject booking (requires `decline_reason`) |
| `confirmed` | `completed` | Mark as completed |
| `confirmed` | `declined` | Cancel confirmed appointment |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Appointment status updated to confirmed.",
  "data": {
    "id": 123,
    "status": "confirmed",
    "updated_at": "2025-12-01T14:00:00.000Z"
  }
}
```

**Error - Invalid Transition (400):**
```json
{
  "success": false,
  "message": "Cannot change status from cancelled to confirmed."
}
```

**Error - Missing Decline Reason (400):**
```json
{
  "success": false,
  "message": "Decline reason is required when declining an appointment."
}
```

**Email Notifications:**
- `confirmed`: Client receives appointment confirmation email
- `declined`: Client receives decline notification with reason
- `completed`: No automatic email (manual process)

**Example - Confirm Appointment:**
```bash
curl -X PUT http://localhost:3000/api/admin/appointments/123/status \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}' \
  -b cookies.txt
```

**Example - Decline with Reason:**
```bash
curl -X PUT http://localhost:3000/api/admin/appointments/123/status \
  -H "Content-Type: application/json" \
  -d '{
    "status":"declined",
    "decline_reason":"Unfortunately, we cannot accommodate this time slot."
  }' \
  -b cookies.txt
```

---

### DELETE /api/admin/appointments/:id

Permanently delete an appointment.

**Authentication:** Required

**Parameters:**
- `id` (URL parameter) - Appointment ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Appointment deleted successfully."
}
```

**Warning:** This permanently deletes the appointment. Consider using status updates instead for audit trail.

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/admin/appointments/123 \
  -b cookies.txt
```

---

## Availability Configuration

### GET /api/admin/availability/settings

Get current working hours configuration for all days of the week.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "days": [
      {
        "day_of_week": 0,  // 0 = Sunday
        "is_working_day": false,
        "start_time": null,
        "end_time": null
      },
      {
        "day_of_week": 1,  // 1 = Monday
        "is_working_day": true,
        "start_time": "09:00:00",
        "end_time": "17:00:00"
      },
      {
        "day_of_week": 2,  // 2 = Tuesday
        "is_working_day": true,
        "start_time": "09:00:00",
        "end_time": "17:00:00"
      }
      // ... 7 days total
    ]
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/admin/availability/settings \
  -b cookies.txt
```

---

### PUT /api/admin/availability/settings

Update working hours configuration for all days.

**Authentication:** Required

**Request Body:**
```json
{
  "days": [
    {
      "day_of_week": 0,
      "is_working_day": false,
      "start_time": null,
      "end_time": null
    },
    {
      "day_of_week": 1,
      "is_working_day": true,
      "start_time": "09:00:00",
      "end_time": "17:00:00"
    }
    // ... must include all 7 days
  ]
}
```

**Validation Rules:**
- Must provide exactly 7 days (0-6)
- Working days must have `start_time` and `end_time`
- Times must be in HH:MM:SS format
- At least one working day required

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Availability settings updated successfully."
}
```

**Error - Validation Failed (400):**
```json
{
  "success": false,
  "message": "Day 1 is a working day but has no operating hours."
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/admin/availability/settings \
  -H "Content-Type: application/json" \
  -d '{
    "days": [
      {"day_of_week": 0, "is_working_day": false, "start_time": null, "end_time": null},
      {"day_of_week": 1, "is_working_day": true, "start_time": "09:00:00", "end_time": "17:00:00"},
      {"day_of_week": 2, "is_working_day": true, "start_time": "09:00:00", "end_time": "17:00:00"},
      {"day_of_week": 3, "is_working_day": true, "start_time": "09:00:00", "end_time": "17:00:00"},
      {"day_of_week": 4, "is_working_day": true, "start_time": "09:00:00", "end_time": "17:00:00"},
      {"day_of_week": 5, "is_working_day": true, "start_time": "09:00:00", "end_time": "14:00:00"},
      {"day_of_week": 6, "is_working_day": false, "start_time": null, "end_time": null}
    ]
  }' \
  -b cookies.txt
```

---

### GET /api/admin/availability/blocked-dates

Get list of blocked dates (holidays, closures).

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "2025-12-25",
      "reason": "Christmas",
      "created_at": "2025-11-01T10:00:00.000Z"
    },
    {
      "id": 2,
      "date": "2026-01-01",
      "reason": "New Year",
      "created_at": "2025-11-01T10:00:00.000Z"
    }
  ],
  "count": 2
}
```

**Example:**
```bash
curl http://localhost:3000/api/admin/availability/blocked-dates \
  -b cookies.txt
```

---

### POST /api/admin/availability/blocked-dates

Add a new blocked date.

**Authentication:** Required

**Request Body:**
```json
{
  "date": "2025-12-25",
  "reason": "Christmas holiday"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Blocked date added successfully.",
  "data": {
    "id": 1,
    "date": "2025-12-25",
    "reason": "Christmas holiday"
  }
}
```

**Error - Date Already Blocked (400):**
```json
{
  "success": false,
  "message": "This date is already blocked."
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/admin/availability/blocked-dates \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-12-25","reason":"Christmas holiday"}' \
  -b cookies.txt
```

---

### DELETE /api/admin/availability/blocked-dates/:id

Remove a blocked date.

**Authentication:** Required

**Parameters:**
- `id` (URL parameter) - Blocked date ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Blocked date removed successfully."
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/admin/availability/blocked-dates/1 \
  -b cookies.txt
```

---

## Best Practices

### Error Handling
Always check the `success` field before processing data:
```javascript
const response = await fetch('/api/appointments/book', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

const result = await response.json();

if (!result.success) {
  // Handle error
  console.error(result.message);
  if (result.errors) {
    // Display validation errors
    Object.entries(result.errors).forEach(([field, error]) => {
      console.error(`${field}: ${error}`);
    });
  }
} else {
  // Process successful response
  console.log(result.data);
}
```

### Rate Limiting
Implement exponential backoff when rate limited:
```javascript
async function makeRequest(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status !== 429) {
      return response;
    }

    // Wait before retry (exponential backoff)
    const delay = Math.pow(2, i) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  throw new Error('Rate limit exceeded');
}
```

### Session Management
Store and include session cookies:
```javascript
// Login
const loginResponse = await fetch('/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
  credentials: 'include'  // Important: include cookies
});

// Subsequent requests
const appointmentsResponse = await fetch('/api/admin/appointments', {
  credentials: 'include'  // Include session cookie
});
```

---

## Support

For additional help:
- **Main Documentation:** [README.md](../README.md)
- **Admin Guide:** [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
- **Deployment:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issues:** [GitHub Issues](https://github.com/itheCreator1/nt-taxoffice-node/issues)

---

**Built with ❤️ for modern tax office management**
