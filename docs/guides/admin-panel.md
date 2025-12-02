# Administrator Guide

Complete guide to managing the NT TaxOffice appointment system through the admin panel.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [First-Time Setup](#first-time-setup)
3. [Logging In](#logging-in)
4. [Dashboard Overview](#dashboard-overview)
5. [Managing Appointments](#managing-appointments)
6. [Configuring Availability](#configuring-availability)
7. [Managing Blocked Dates](#managing-blocked-dates)
8. [Understanding Appointment Statuses](#understanding-appointment-statuses)
9. [Email Notifications](#email-notifications)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Admin Panel

The admin panel is accessible at: `http://yourdomain.com/admin/`

**Security Note:** The admin panel is session-based, meaning:
- Your login session expires after 24 hours of inactivity
- Sessions are stored server-side for better security
- Cookies are HTTP-only (not accessible via JavaScript)
- CSRF protection via SameSite cookies

### System Requirements

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript enabled
- Cookies enabled (required for session management)
- Minimum screen resolution: 1280x720 (responsive design)

---

## First-Time Setup

### Initial Admin Account Creation

When you first deploy the application, you need to create an admin account:

1. Navigate to `http://yourdomain.com/admin/setup.html`
2. Fill in the setup form:
   - **Username**: Your admin login name (3-50 characters)
   - **Email**: Your admin email address (for notifications)
   - **Password**: Strong password (minimum 8 characters)

**Why This Process?**

The setup page is only accessible when NO admin accounts exist in the database. This prevents:
- Unauthorized account creation after deployment
- Multiple admin accounts (single admin design)
- Security vulnerabilities from always-accessible registration

**Security Considerations:**

- Passwords are hashed with bcrypt (12 rounds)
- Setup endpoint is rate-limited (3 attempts per 15 minutes)
- Once an admin exists, the setup page returns 403 Forbidden

### Post-Setup Steps

After creating your admin account:

1. **Configure Availability**: Set your working hours (see [Configuring Availability](#configuring-availability))
2. **Add Blocked Dates**: Mark holidays and special closures
3. **Test Booking Flow**: Make a test appointment as a client
4. **Verify Emails**: Check that email notifications work correctly

---

## Logging In

### Login Process

1. Navigate to `http://yourdomain.com/admin/login.html`
2. Enter your username and password
3. Click "Login"

**Rate Limiting:** 5 login attempts per 15 minutes per IP address

**Why Rate Limiting?**

This protects against brute-force attacks where an attacker tries many password combinations. After 5 failed attempts, the IP is temporarily blocked.

### Session Management

- Sessions last 24 hours from last activity
- Each action extends the session automatically
- Logout explicitly ends the session
- Closing the browser maintains the session (for convenience)

**Security Tip:** Always logout when using shared computers.

### Forgot Password?

**Current Implementation:** No self-service password reset.

**Why?**

This is a single-admin system. Password reset adds complexity and security risks (email-based resets can be intercepted).

**Solution:** Reset via database:

```bash
# Connect to MySQL
mysql -u nt_taxoffice -p nt_taxoffice_appointments

# Update password (replace 'newpassword' with your desired password)
# This requires generating a bcrypt hash manually or via Node.js
```

Or contact your system administrator to update the password directly in the database.

---

## Dashboard Overview

The dashboard (`/admin/dashboard.html`) is your central hub for managing appointments.

### Layout

```
┌─────────────────────────────────────────────────┐
│  Navigation Bar                                  │
│  [Dashboard] [Availability] [Logout]            │
├─────────────────────────────────────────────────┤
│  Filters Section                                 │
│  Status: [All ▼]  From: [____] To: [____]       │
│  Search: [_____________________] [Filter]       │
├─────────────────────────────────────────────────┤
│  Appointments Table                              │
│  │Date│Time│Client│Service│Status│Actions│      │
│  │... │... │...   │...    │...   │...    │      │
├─────────────────────────────────────────────────┤
│  Pagination                                      │
│  [Prev] Page 1 of 5 [Next]                      │
└─────────────────────────────────────────────────┘
```

### Key Features

1. **Real-time Filtering**: Filter by status, date range, or search term
2. **Sortable Columns**: Click column headers to sort
3. **Bulk Actions**: Manage multiple appointments efficiently
4. **Color-coded Status**: Visual indication of appointment states
5. **Quick Actions**: Approve, decline, or delete with one click

### Understanding the Interface

**Color Coding:**
- 🟡 **Yellow (Pending)**: New appointments awaiting your approval
- 🟢 **Green (Confirmed)**: Appointments you've approved
- 🔴 **Red (Declined)**: Appointments you've rejected
- 🔵 **Blue (Completed)**: Past appointments marked as done
- ⚫ **Gray (Cancelled)**: Client-initiated cancellations

**Why Color Coding?**

Visual cues help you quickly scan the appointment list without reading each status. This reduces cognitive load and speeds up management.

---

## Managing Appointments

### Appointment Lifecycle

```
┌─────────┐
│ Pending │ ←─ Client books appointment
└────┬────┘
     │
     ├─→ Confirm ──→ ┌───────────┐
     │               │ Confirmed │
     │               └─────┬─────┘
     │                     │
     │                     └──→ ┌───────────┐
     │                          │ Completed │
     │                          └───────────┘
     │
     └─→ Decline ──→ ┌──────────┐
                     │ Declined │
                     └──────────┘

Client can cancel at any time ──→ ┌───────────┐
                                   │ Cancelled │
                                   └───────────┘
```

### Viewing Appointments

**Default View:** All appointments sorted by date (newest first)

**Filtering Options:**

1. **By Status**:
   - All: Show everything
   - Pending: Only new appointments needing attention
   - Confirmed: Approved appointments
   - Declined: Rejected appointments
   - Completed: Finished appointments
   - Cancelled: Client cancellations

2. **By Date Range**:
   - From Date: Start of range (inclusive)
   - To Date: End of range (inclusive)
   - Useful for viewing appointments in a specific week/month

3. **By Search**:
   - Searches client name, email, phone, and notes
   - Case-insensitive
   - Partial matches work (e.g., "John" finds "John Doe")

**Pro Tip:** Combine filters for powerful queries:
- "Status: Pending + This Week" = Appointments needing approval soon
- "Status: Confirmed + Today" = Today's confirmed appointments
- "Search: 'tax consultation' + This Month" = All tax consultations this month

### Approving Appointments (Pending → Confirmed)

1. Locate the pending appointment in the dashboard
2. Click the green **"Approve"** button
3. Confirmation dialog appears
4. Click **"Yes, approve"**

**What Happens:**
- Appointment status changes to "confirmed"
- Client receives confirmation email with appointment details
- You receive admin notification email
- Appointment slot is locked (no other bookings for that time)

**When to Approve:**

✅ **Approve When:**
- Client information looks legitimate
- You have availability at that time
- Service type is appropriate
- No conflicts with other commitments

❌ **Don't Approve When:**
- Client information is incomplete or suspicious
- You won't actually be available
- Service type doesn't match your offerings

### Declining Appointments (Pending → Declined)

1. Locate the pending appointment
2. Click the red **"Decline"** button
3. Confirmation dialog appears
4. Click **"Yes, decline"**

**What Happens:**
- Appointment status changes to "declined"
- Client receives decline email (professional, non-specific)
- Time slot becomes available again for other clients
- Appointment remains in system for records

**When to Decline:**

Common reasons:
- Double-booking (client booked during blocked time)
- Service type mismatch
- Suspicious booking patterns
- No longer have availability at that time

**Communication Tip:** The decline email is intentionally generic to maintain professionalism. If you want to provide specific reasons, consider calling the client directly.

### Completing Appointments (Confirmed → Completed)

1. After the appointment occurs in real life
2. Locate the appointment in dashboard
3. Click **"Mark Complete"** button
4. Confirm the action

**Why Mark as Complete?**

- **Record Keeping**: Track your appointment history
- **Analytics**: Understand booking patterns and no-show rates
- **Client History**: If you add CRM features later, you'll have historical data
- **Professional Practice**: Maintain accurate business records

**Best Practice:** Mark appointments complete the same day they occur, or at end of week.

### Deleting Appointments

1. Locate the appointment (any status)
2. Click the **"Delete"** button (usually a trash icon)
3. Confirmation dialog with **WARNING**
4. Click **"Yes, delete permanently"**

**⚠️ WARNING: This is permanent!**

Deleted appointments are **removed from the database** and **cannot be recovered**.

**When to Delete:**
- Test appointments during initial setup
- Duplicate entries
- Spam bookings
- Data entry errors

**When NOT to Delete:**
- Real appointments you want to decline (use "Decline" instead)
- Past appointments for record-keeping (use "Complete" instead)
- Client cancellations (system already marks as "Cancelled")

**Why So Strict?**

Business records should generally be preserved for:
- Legal compliance (tax records, business documentation)
- Dispute resolution
- Analytics and reporting
- Historical reference

### Handling Cancellations

When a client cancels via the cancellation link:
- Status automatically becomes "cancelled"
- You receive notification email
- Time slot becomes available
- Client receives cancellation confirmation

**You don't need to do anything** - the system handles it automatically.

**However, you should:**
1. Review cancelled appointments regularly
2. Identify patterns (e.g., specific times with high cancellations)
3. Consider reaching out to frequent cancellers
4. Mark completed if cancellation was last-minute but you still met

---

## Configuring Availability

Navigate to `/admin/availability.html` to configure when clients can book appointments.

### Understanding Per-Day Configuration

The system uses a **7-day schedule** where each day of the week has individual settings:

| Day | Available | Start Time | End Time | Slot Duration |
|-----|-----------|------------|----------|---------------|
| Monday | ✓ | 09:00 | 17:00 | 30 min |
| Tuesday | ✓ | 09:00 | 17:00 | 30 min |
| Wednesday | ✓ | 09:00 | 17:00 | 30 min |
| Thursday | ✓ | 09:00 | 17:00 | 30 min |
| Friday | ✓ | 09:00 | 14:00 | 30 min |
| Saturday | ✗ | - | - | - |
| Sunday | ✗ | - | - | - |

**Why Per-Day Configuration?**

This provides flexibility for:
- Different schedules each day (e.g., shorter Fridays)
- Days off (weekends, specific weekdays)
- Seasonal schedule changes
- Special operating hours

### Setting Working Hours

For each day:

1. **Toggle Available**: Check = accepting appointments, Uncheck = day off
2. **Start Time**: When your day begins (e.g., 09:00)
3. **End Time**: When your day ends (e.g., 17:00)
4. **Slot Duration**: How long each appointment takes (minutes)

**Example Configuration:**

```
Monday - Friday: 09:00 - 17:00 (30 min slots)
= 16 slots per day (9:00, 9:30, 10:00, ..., 16:30)
= 80 slots per week
```

### Slot Duration Explained

**What is a Slot Duration?**

The time allocated for each appointment. This determines:
- Available booking times (9:00, 9:30, 10:00 for 30-min slots)
- How many appointments you can take per day
- Buffer time between appointments

**Common Durations:**

- **15 minutes**: Quick consultations, follow-ups
- **30 minutes**: Standard appointments (most common)
- **45 minutes**: Longer consultations
- **60 minutes**: Comprehensive meetings

**Choosing the Right Duration:**

Consider:
- Average appointment length in your experience
- Time for notes/paperwork between clients
- Buffer for appointments running over
- Transition time between clients

**Pro Tip:** Start with 30 minutes and adjust based on real-world experience. It's easier to extend slots than shorten them later.

### Breaks and Lunch

**Current Implementation:** No automatic lunch break.

**Workaround:** Use **Blocked Dates** to block your lunch hour:
1. Go to Blocked Dates section
2. Add date: (today or recurring pattern)
3. Specify times: 12:00 - 13:00
4. Reason: "Lunch break"

**Why No Built-in Breaks?**

Keeping the availability system simple makes it:
- Easier to understand
- Less prone to configuration errors
- More flexible (use blocked dates for any exception)

**Future Enhancement:** Version 1.1.0 may add explicit break configuration.

### Saving Changes

1. Configure all 7 days as desired
2. Click **"Save Availability Settings"**
3. System validates configuration:
   - End time must be after start time
   - Slot duration must be reasonable (5-240 minutes)
   - Times must be in HH:MM format

**What Happens After Saving:**

- Database updates atomically (all 7 days in one transaction)
- Changes take effect **immediately**
- Clients see updated availability on booking page
- Existing confirmed appointments are **not affected**

**Atomic Updates Explained:**

When you save, either:
- ✅ All 7 days update successfully, OR
- ❌ None update (if validation fails)

This prevents partial updates where some days save and others don't, which would create inconsistent schedules.

### Testing Your Configuration

After saving:

1. Open `/appointments.html` in a new browser window (not logged in)
2. Select tomorrow's date in the booking calendar
3. Verify available time slots match your configuration
4. Try selecting a day you marked as unavailable (should show "No slots available")

---

## Managing Blocked Dates

Blocked dates are specific dates/times when you're unavailable despite regular working hours.

**Common Use Cases:**
- Public holidays
- Vacation days
- Special events
- Conferences
- Emergency closures
- Maintenance windows

### Adding a Blocked Date

1. Navigate to **Availability** page
2. Scroll to **"Blocked Dates"** section
3. Click **"Add Blocked Date"**
4. Fill in the form:
   - **Date**: Specific date to block (date picker)
   - **Start Time**: When block begins (optional, blocks whole day if omitted)
   - **End Time**: When block ends (required if start time provided)
   - **Reason**: Why you're unavailable (shown to clients)
5. Click **"Add"**

**Examples:**

**Full Day Block:**
```
Date: 2025-12-25
Start Time: (leave empty)
End Time: (leave empty)
Reason: "Christmas Holiday"
```
Result: No appointments available on December 25

**Partial Day Block:**
```
Date: 2025-12-10
Start Time: 13:00
End Time: 15:00
Reason: "Conference Attendance"
```
Result: 9:00-13:00 available, 13:00-15:00 blocked, 15:00-17:00 available

### Viewing Blocked Dates

The blocked dates table shows:
- **Date**: When the block applies
- **Time Range**: Specific hours (or "All Day")
- **Reason**: Your explanation
- **Actions**: Delete button

**Sorted by Date:** Upcoming blocks appear first for easy reference.

### Removing a Blocked Date

1. Locate the blocked date in the table
2. Click the red **"Delete"** button
3. Confirmation dialog appears
4. Click **"Yes, delete"**

**What Happens:**
- Block is removed from database
- Time slots become available again
- Clients can now book during that time
- **Existing appointments during that block are NOT affected**

**Important:** If you accidentally deleted a block, re-add it immediately. Clients might book during that time in the interim.

### Blocked Dates vs. Availability Settings

**What's the Difference?**

| Aspect | Availability Settings | Blocked Dates |
|--------|----------------------|---------------|
| **Purpose** | Regular weekly schedule | Exceptions to regular schedule |
| **Scope** | Every week, ongoing | Specific dates only |
| **Example** | "Closed every Sunday" | "Closed December 25, 2025" |
| **Granularity** | Day-level | Date + time-level |

**Rule of Thumb:**
- Use **Availability** for your normal schedule
- Use **Blocked Dates** for exceptions and special circumstances

### Planning Ahead

**Best Practice:** Add blocked dates as soon as you know about them.

**Why?**
- Prevents client bookings you'll have to decline
- Shows professionalism (clients see "unavailable" not "declined")
- Reduces administrative overhead
- Better client experience

**Recommended Timeline:**
- Add public holidays at start of each year
- Add vacation dates as soon as planned
- Add conference dates when registered

---

## Understanding Appointment Statuses

### Status Definitions

| Status | Meaning | Triggered By | Can Change To |
|--------|---------|--------------|---------------|
| **Pending** | New booking, awaiting admin approval | Client books | Confirmed, Declined |
| **Confirmed** | Admin approved, appointment scheduled | Admin approves | Completed, Cancelled |
| **Declined** | Admin rejected the booking | Admin declines | (terminal state) |
| **Completed** | Appointment occurred and finished | Admin marks complete | (terminal state) |
| **Cancelled** | Client cancelled via email link | Client cancels | (terminal state) |

### Status Workflow Diagram

```
              ┌──────────────────────────────┐
              │   Client Books Appointment   │
              └──────────────┬───────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │   Pending   │◄──── Default initial state
                      └──────┬──────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
       ┌─────────────┐              ┌─────────────┐
       │  Confirmed  │              │  Declined   │
       └──────┬──────┘              └─────────────┘
              │                            │
      ┌───────┴────────┐                  │
      │                │                  │
      ▼                ▼                  ▼
┌─────────────┐  ┌─────────────┐   Terminal State
│  Completed  │  │  Cancelled  │   (no further changes)
└─────────────┘  └─────────────┘
      │                │
      ▼                ▼
Terminal States
```

### When to Use Each Status

**Pending → Confirmed:**
- ✅ Client information is complete and accurate
- ✅ You have availability at requested time
- ✅ Service type matches your offerings
- ✅ Ready to commit to the appointment

**Pending → Declined:**
- ❌ Client information is suspicious or incomplete
- ❌ Time slot is no longer available
- ❌ Service type doesn't match
- ❌ Can't accommodate the request

**Confirmed → Completed:**
- ✅ Appointment occurred in real life
- ✅ Service was provided
- ✅ Client attended (or note if no-show)

**Confirmed → Cancelled:**
- ❌ Client used cancellation link (automatic)
- ❌ Client contacted you to cancel (manual status change not available in current version)

### Status Filters and Reports

**Using Status Filters Effectively:**

**For Daily Operations:**
```
Status: Pending
Date Range: Today + Next 7 days
Result: Upcoming appointments needing approval
```

**For Weekly Review:**
```
Status: Confirmed
Date Range: This week
Result: This week's confirmed appointments
```

**For Record Keeping:**
```
Status: Completed
Date Range: Last month
Result: Monthly appointment history
```

**For Quality Analysis:**
```
Status: Cancelled
Date Range: Last 3 months
Result: Cancellation patterns (identify problem times)
```

### Analytics with Status Data

**Metrics You Can Track:**

1. **Approval Rate**: Confirmed / (Confirmed + Declined)
   - High rate = good availability alignment
   - Low rate = may need to adjust available times

2. **Cancellation Rate**: Cancelled / Confirmed
   - High rate = may indicate reminder issues or booking friction
   - Low rate = good client commitment

3. **Completion Rate**: Completed / Confirmed
   - Should be close to 100% (you mark them complete)
   - Track to ensure you're marking appointments complete

4. **Pending Time**: How long appointments stay pending
   - Goal: Approve/decline within 24 hours
   - Fast response improves client experience

**Future Enhancement:** Version 1.2.0 may include built-in analytics dashboard with these metrics automatically calculated.

---

## Email Notifications

The system sends automatic emails at various stages of the appointment lifecycle.

### Email Queue System

**How It Works:**

```
Event Occurs → Email Added to Queue → Background Worker Sends → Retry if Failed
```

**Why a Queue?**

Without a queue:
- Client waits for email to send before seeing success message
- Email failures block the HTTP response
- Server becomes unresponsive during email issues

With a queue:
- Client gets immediate response ("Appointment booked!")
- Emails send in background
- Failed emails automatically retry
- Server stays responsive

**Technical Details:**
- Queue checks every 60 seconds
- Up to 3 retry attempts per email
- Exponential backoff between retries (1 min, 5 min, 15 min)

### Email Templates

The system includes 10 email templates (HTML + text versions):

| Template | Recipient | Trigger | Purpose |
|----------|-----------|---------|---------|
| **booking_confirmation** | Client | Appointment booked | Confirm booking received |
| **appointment_confirmed** | Client | Admin approves | Notify of approval |
| **appointment_declined** | Client | Admin declines | Notify of decline |
| **appointment_reminder** | Client | 24h before | Reduce no-shows |
| **cancellation_confirmation** | Client | Client cancels | Confirm cancellation |
| **admin_new_appointment** | Admin | Appointment booked | Alert of new booking |

**Why Both HTML and Text?**

- HTML: Beautiful formatting, branding, colors
- Text: Fallback for email clients that don't support HTML
- Better deliverability: Multipart emails are less likely to be flagged as spam

### Email Configuration

Emails are sent via **Gmail SMTP**. Configuration in `.env`:

```bash
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
ADMIN_EMAIL=your-email@gmail.com
```

**Gmail App Password Setup:**

1. Enable 2-Factor Authentication on your Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Select "Mail" and "Other (Custom name)"
4. Generate password
5. Copy the 16-character code (no spaces)
6. Add to `.env` as `GMAIL_APP_PASSWORD`

**Why App Password?**

Regular Gmail passwords don't work for SMTP due to security policies. App passwords provide secure authentication for third-party applications.

**Alternative Email Providers:**

The system uses Nodemailer, which supports:
- Gmail SMTP (current)
- SendGrid API
- Mailgun API
- AWS SES
- Custom SMTP servers

To switch providers, modify `services/email.js` transporter configuration.

### Viewing Email Queue Status

**Current Implementation:** No admin interface for email queue.

**Checking Email Status:**

Via database query:
```sql
SELECT * FROM email_queue
WHERE status = 'failed'
ORDER BY created_at DESC;
```

**Email Queue Statuses:**
- `pending`: Waiting to be sent
- `sending`: Currently being sent
- `sent`: Successfully delivered
- `failed`: Failed after 3 retries

**Troubleshooting Failed Emails:**

Common reasons for failures:
1. **Invalid Gmail credentials**: Check `.env` configuration
2. **Gmail security block**: Verify App Password is correct
3. **Network issues**: Check server internet connection
4. **Rate limiting**: Gmail has sending limits (500/day for free accounts)
5. **Invalid recipient email**: Client provided wrong address

**Monitoring Recommendation:**

Set up a daily cron job to check for failed emails:
```bash
# Add to crontab
0 9 * * * mysql -u nt_taxoffice -p'password' nt_taxoffice_appointments -e "SELECT COUNT(*) FROM email_queue WHERE status='failed'" | mail -s "Failed Emails Report" admin@example.com
```

### Email Customization

Email templates are located in `views/emails/` directory:

```
views/emails/
├── booking_confirmation.html.ejs
├── booking_confirmation.text.ejs
├── appointment_confirmed.html.ejs
├── appointment_confirmed.text.ejs
└── ...
```

**To Customize:**

1. Open the `.ejs` template file
2. Modify HTML/text content
3. Use EJS variables: `<%= client_name %>`, `<%= appointment_date %>`, etc.
4. Save file
5. Restart server to load changes

**Available Variables:**

Each template has access to different variables. Common ones:
- `client_name`: Client's full name
- `appointment_date`: Formatted date (DD/MM/YYYY)
- `appointment_time`: Time (HH:MM)
- `service_type`: Type of appointment
- `app_name`: Your business name
- `app_url`: Your website URL
- `cancellation_url`: Cancellation link (client emails only)

**Branding Tips:**
- Add your logo to HTML templates
- Use your brand colors in email styles
- Include social media links in email footers
- Maintain consistent tone across all templates

---

## Best Practices

### Daily Routine

**Morning (Start of Day):**
1. Log into admin dashboard
2. Review pending appointments (approve/decline)
3. Check today's confirmed appointments
4. Verify email queue has no failures

**During Day:**
5. Check dashboard periodically for new bookings
6. Respond to client inquiries
7. Mark appointments as complete after they occur

**End of Day:**
8. Mark any remaining completed appointments
9. Review tomorrow's schedule
10. Add any newly known blocked dates

### Weekly Routine

**Start of Week:**
1. Review this week's confirmed appointments
2. Identify any conflicts or issues
3. Check blocked dates for upcoming weeks
4. Review cancellation patterns

**End of Week:**
5. Mark all week's appointments as complete
6. Review appointment statistics
7. Plan next week's schedule adjustments

### Monthly Routine

**Start of Month:**
1. Add known blocked dates for the month
2. Review last month's appointment trends
3. Adjust availability if needed
4. Check email queue for any persistent failures

**End of Month:**
5. Generate appointment reports (via database)
6. Calculate metrics (completion rate, cancellation rate)
7. Archive/backup old appointments
8. Update availability for next month if needed

### Response Time Goals

**Target Response Times:**
- **Pending Approvals**: Within 24 hours
- **Client Inquiries**: Within 4 business hours
- **Same-Day Bookings**: Within 2 hours

**Why Fast Response Matters:**
- Better client experience
- Reduces client anxiety
- Prevents double-booking attempts
- Shows professionalism

### Communication Tips

**When Approving:**
- Clients receive automatic confirmation email
- No need to call unless special circumstances
- Email includes all appointment details

**When Declining:**
- Consider calling to explain (decline email is generic)
- Offer alternative times
- Maintain professional, friendly tone

**When Clients Cancel:**
- Don't take it personally (life happens)
- No need to follow up unless pattern emerges
- Track cancellation reasons if they volunteer them

### Security Best Practices

1. **Strong Password**: Use 12+ characters, mix of types
2. **Regular Logout**: Especially on shared computers
3. **Session Awareness**: Be aware of 24-hour session timeout
4. **Access Control**: Don't share admin credentials
5. **Regular Updates**: Keep server and dependencies updated
6. **Backup Database**: Regular backups prevent data loss
7. **Monitor Logs**: Check for suspicious activity

### Performance Optimization

**Keep Dashboard Fast:**
- Use date range filters to limit results
- Avoid loading all appointments at once
- Use pagination (50 per page is default)

**Database Maintenance:**
- Archive old completed appointments (> 1 year old)
- Optimize database tables periodically
- Monitor database size

**Email Queue:**
- Monitor for growing queue (indicates sending issues)
- Clear old sent emails periodically (> 90 days)

---

## Troubleshooting

### Cannot Access Admin Panel

**Symptom:** `/admin/` redirects to login or shows 403

**Solutions:**

1. **Check if admin account exists:**
   ```sql
   SELECT * FROM admins;
   ```
   If empty, visit `/admin/setup.html` to create admin

2. **Check if logged in:**
   - Sessions expire after 24 hours
   - Clear browser cookies and re-login

3. **Check database connection:**
   ```bash
   docker-compose logs mysql
   ```
   Look for connection errors

### Appointments Not Appearing

**Symptom:** Dashboard shows no appointments despite clients booking

**Solutions:**

1. **Check database:**
   ```sql
   SELECT * FROM appointments ORDER BY created_at DESC LIMIT 10;
   ```
   Verify appointments exist

2. **Check filters:**
   - Reset all filters (Status: All, no date range, no search)
   - Click "Filter" button

3. **Check JavaScript errors:**
   - Open browser console (F12)
   - Look for red error messages
   - Refresh page and check again

### Cannot Approve/Decline Appointments

**Symptom:** Clicking approve/decline buttons does nothing

**Solutions:**

1. **Check JavaScript console:**
   - Open developer tools (F12)
   - Look for CSP violations or errors

2. **Check session:**
   - You might be logged out
   - Refresh page (session check)
   - Re-login if necessary

3. **Check database locks:**
   - Another request might be processing
   - Wait 5 seconds and try again

### Availability Not Saving

**Symptom:** Changes to availability don't persist after clicking save

**Solutions:**

1. **Check validation errors:**
   - Browser console will show validation errors
   - Ensure end time > start time
   - Ensure slot duration is reasonable (5-240 min)

2. **Check database connection:**
   ```bash
   docker-compose logs app
   ```
   Look for MySQL errors

3. **Check transaction failures:**
   - MySQL might be rejecting the transaction
   - Check MySQL error logs

### Blocked Dates Not Working

**Symptom:** Clients can still book during blocked dates

**Solutions:**

1. **Check date format:**
   - Must be YYYY-MM-DD format
   - Use the date picker to ensure correct format

2. **Check time ranges:**
   - If partial block, ensure times don't overlap with availability gaps
   - Use 24-hour format (HH:MM)

3. **Clear browser cache:**
   - Client booking page might be cached
   - Tell clients to hard refresh (Ctrl+Shift+R)

### Emails Not Sending

**Symptom:** Clients report not receiving emails

**Solutions:**

1. **Check email queue:**
   ```sql
   SELECT * FROM email_queue
   WHERE status = 'failed'
   ORDER BY created_at DESC
   LIMIT 20;
   ```

2. **Check Gmail configuration:**
   - Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `.env`
   - Ensure App Password is correct (16 characters, no spaces)
   - Check Gmail account isn't locked

3. **Check spam folders:**
   - Ask clients to check spam/junk folders
   - Add your email to their contacts

4. **Check Gmail sending limits:**
   - Free Gmail: 500 emails/day
   - Google Workspace: 2000 emails/day
   - If exceeded, emails queue until next day

5. **Test email configuration:**
   ```bash
   # From project directory
   node -e "require('./services/email').testConnection()"
   ```

### Session Expires Too Quickly

**Symptom:** Getting logged out frequently

**Solutions:**

1. **Check session configuration:**
   - Sessions expire after 24 hours of inactivity
   - Each action extends the session

2. **Check system clock:**
   - Ensure server clock is correct
   - Time drift can cause session issues

3. **Check SESSION_SECRET:**
   - Ensure `.env` has `SESSION_SECRET` set
   - If changed, all existing sessions invalidate

### Performance Issues

**Symptom:** Dashboard loads slowly

**Solutions:**

1. **Use date range filters:**
   - Don't load all appointments at once
   - Filter to recent dates

2. **Check database indexes:**
   ```sql
   SHOW INDEX FROM appointments;
   ```
   Ensure indexes exist on `appointment_date`, `status`

3. **Check database size:**
   ```sql
   SELECT
     table_name,
     ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
   FROM information_schema.TABLES
   WHERE table_schema = "nt_taxoffice_appointments"
   ORDER BY (data_length + index_length) DESC;
   ```

4. **Archive old appointments:**
   - Export completed appointments > 1 year old
   - Delete from database after backup

### Getting Help

**Support Resources:**

1. **Documentation:**
   - README.md: Project overview
   - API.md: API endpoint reference
   - DEPLOYMENT.md: Production deployment guide

2. **Database:**
   ```bash
   # View all tables
   mysql -u nt_taxoffice -p nt_taxoffice_appointments -e "SHOW TABLES"

   # View table structure
   mysql -u nt_taxoffice -p nt_taxoffice_appointments -e "DESCRIBE appointments"
   ```

3. **Server Logs:**
   ```bash
   # Docker logs
   docker-compose logs app
   docker-compose logs mysql

   # System logs (if not using Docker)
   pm2 logs
   ```

4. **GitHub Issues:**
   - Report bugs: https://github.com/itheCreator1/nt-taxoffice-node/issues
   - Feature requests: Same URL

---

## Appendix

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Dashboard | (no shortcut, bookmark /admin/dashboard.html) |
| Open Availability | (no shortcut, bookmark /admin/availability.html) |
| Logout | (no shortcut, use logout button) |
| Refresh Dashboard | F5 or Ctrl+R |
| Focus Search Box | Click search field |

**Future Enhancement:** Keyboard shortcuts may be added in version 1.1.0.

### Admin API Endpoints

For developers integrating with the admin panel:

- `POST /admin/api/auth/login` - Login
- `POST /admin/api/auth/logout` - Logout
- `GET /admin/api/appointments` - List appointments
- `PATCH /admin/api/appointments/:id/status` - Update status
- `DELETE /admin/api/appointments/:id` - Delete appointment
- `GET /admin/api/availability` - Get availability settings
- `POST /admin/api/availability` - Update availability settings
- `GET /admin/api/availability/blocked-dates` - List blocked dates
- `POST /admin/api/availability/blocked-dates` - Add blocked date
- `DELETE /admin/api/availability/blocked-dates/:id` - Remove blocked date

See [API.md](./API.md) for complete endpoint documentation.

### Database Schema Reference

**Core Tables:**
- `admins`: Admin user accounts
- `appointments`: All appointment records
- `availability_settings`: Per-day working hours
- `blocked_dates`: Exception dates (holidays, etc.)
- `email_queue`: Outgoing email queue

**Future Enhancement:** Version 1.1.0 may include docs/DATABASE.md with complete schema documentation.

---

**Last Updated:** December 1, 2025
**Version:** 1.0.0
**Author:** NT TaxOffice Development Team
