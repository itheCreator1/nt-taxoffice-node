# NT - TAXOFFICE

 

A modern, professional web platform for NT - TAXOFFICE, providing comprehensive accounting, tax, and consulting services to businesses and individuals across Greece.

 

## About

 

NT - TAXOFFICE is a leading accounting firm specializing in:

- Professional accounting and bookkeeping

- Tax planning and compliance

- Payroll and employment services

- Financial consulting and business advisory

 

This website serves as the digital presence for the firm, showcasing their services and enabling clients to connect with their team.

 

## Technology

 

Built with a modern, lightweight stack:

 

- **Node.js & Express** - Fast, scalable server framework

- **Vanilla JavaScript** - ES6 modules for clean, maintainable code

- **Modular CSS** - Organized stylesheet architecture

- **Font Awesome** - Professional iconography

- **Google Fonts** - Poppins and Roboto typography

 

## Quick Start

 

Install dependencies:

```bash

npm install

```

 

Run the server:

```bash

npm start

```

 

Visit `http://localhost:3000` in your browser.

 

For development with a custom port:

```bash

PORT=8080 npm run dev

```

 

## Architecture

 

### Directory Structure

 

```

nt-taxoffice-node/

├── public/                 # Static assets

│   ├── css/

│   │   ├── base/          # Variables, typography, reset

│   │   ├── layout/        # Header, navigation, footer

│   │   ├── components/    # Buttons, cards, forms, badges, icons

│   │   └── utilities/     # Animations, responsive, accessibility, print

│   ├── js/

│   │   ├── main.js        # Application entry point

│   │   ├── navigation.js  # Mobile menu and nav logic

│   │   ├── animations.js  # Scroll animations and effects

│   │   └── form-validation.js  # Client-side validation

│   └── *.html             # Page templates

├── routes/

│   └── index.js           # Route definitions

└── server.js              # Express application setup

```

 

### CSS Architecture

 

The stylesheets follow a modular pattern:

 

- **Base**: Foundation styles (variables, typography, normalization)

- **Layout**: Page structure (header, footer, navigation)

- **Components**: Reusable UI elements (buttons, cards, forms)

- **Utilities**: Helper classes (animations, responsive utilities)

 

### JavaScript Modules

 

Client-side code is organized into ES6 modules:

 

- `main.js` - Initializes and coordinates all modules

- `navigation.js` - Handles mobile menu and navigation interactions

- `animations.js` - Manages scroll animations and visual effects

- `form-validation.js` - Validates contact forms before submission

 

## Pages

 

| Route | Page | Description |

|-------|------|-------------|

| `/` | Home | Service overview and company introduction |

| `/contact` | Contact | Contact form and office information |

| `/media` | Media | Press releases and media resources |

 

## Services

 

### For Businesses & Professionals

 

- Company formation and registration

- Ongoing bookkeeping and accounting

- Tax compliance and planning

- Financial analysis and reporting

- Business restructuring support

 

### Payroll Services

 

- Employee onboarding and registration

- Monthly payroll processing

- Social security submissions (EFKA)

- ERGANI system management

- Employment contract preparation

 

### For Individuals

 

- Personal tax returns

- Property tax declarations (E9, ENFIA)

- Social benefit applications

- Tax planning for employees and retirees

 

### Consulting Services

 

- Financial strategy and planning

- Legal and regulatory compliance

- Business optimization

- Specialized problem-solving

 

## Features



- **Responsive Design** - Optimized for desktop, tablet, and mobile

- **Accessibility** - WCAG compliant with proper ARIA labels

- **Performance** - Lightweight and fast-loading

- **SEO Optimized** - Proper meta tags and semantic HTML

- **Modern UI** - Clean, professional design with smooth animations

- **Appointment System** - Complete booking and management system



## Appointment System



The platform includes a comprehensive appointment booking system for clients to schedule consultations.



### Features



- **Client Self-Service Booking** - 3-step form for scheduling appointments

- **Admin Dashboard** - Complete appointment management interface

- **Email Notifications** - Automated emails for booking, confirmation, and reminders

- **Availability Management** - Configure office hours, working days, and blocked dates

- **Cancellation System** - Token-based self-service cancellation

- **Real-Time Availability** - Shows only available time slots based on settings



### Setup Requirements



1. **MySQL Database** (8.0 or higher)

2. **Email Service** (Gmail SMTP or similar)

3. **Node.js Environment Variables**



### Environment Configuration



Create a `.env` file in the project root:



```bash

# Database Configuration

DB_HOST=localhost

DB_USER=your_mysql_user

DB_PASSWORD=your_mysql_password

DB_NAME=nt_taxoffice

DB_PORT=3306



# Session Configuration

SESSION_SECRET=your-secure-random-session-secret-here



# Email Configuration (Gmail SMTP)

EMAIL_HOST=smtp.gmail.com

EMAIL_PORT=587

EMAIL_SECURE=false

EMAIL_USER=your-email@gmail.com

EMAIL_PASSWORD=your-app-specific-password

ADMIN_EMAIL=admin@example.com

OFFICE_EMAIL=office@example.com

OFFICE_PHONE=+30 210 8222 950



# Application Configuration

APP_URL=http://localhost:3000

NODE_ENV=development

PORT=3000

```



**Important**: For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.



### Database Setup



1. Create the MySQL database:

```sql

CREATE DATABASE nt_taxoffice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

```



2. Run the database initialization script:

```bash

node scripts/init-db.js

```



This creates all required tables:

- `admins` - Admin user accounts

- `availability_settings` - Office hours and working days

- `blocked_dates` - Dates when office is closed

- `appointments` - Client bookings

- `appointment_history` - Status change audit log

- `email_queue` - Background email processing queue

- `sessions` - Express session storage



### Admin Account Setup



1. Start the server:

```bash

npm start

```



2. Navigate to the setup page:

```

http://localhost:3000/admin/setup.html

```



3. Create your first admin account with:

   - Username (3+ characters)

   - Valid email address

   - Strong password (8+ characters, uppercase, lowercase, number, special character)



4. Login at `/admin/login.html`



### Client Booking Flow



1. **Book Appointment** - Client visits `/appointments.html`

   - Step 1: Select date, time, and service type

   - Step 2: Enter personal information

   - Step 3: Review and confirm booking



2. **Confirmation Email** - Client receives booking confirmation with cancellation link



3. **Admin Review** - Admin receives notification and reviews in dashboard



4. **Status Update** - Admin confirms or declines appointment



5. **Client Notification** - Client receives confirmation or decline email



6. **Reminder** (Optional) - Automated reminder email before appointment



### Admin Dashboard



Access the admin dashboard at `/admin/dashboard.html`:



- **Statistics** - View pending, confirmed, today's, and monthly appointments

- **Filtering** - Filter by status, date range, and search by client name/email

- **Status Management** - Confirm, decline, or mark appointments as completed

- **Details View** - See full appointment information and history

- **GDPR Compliance** - Delete appointments with full data removal



### Availability Management



Configure availability at `/admin/availability.html`:



- **Office Hours** - Set start and end times

- **Slot Duration** - Configure appointment length (15-240 minutes)

- **Working Days** - Select which days of the week are available

- **Blocked Dates** - Add specific dates when office is closed (holidays, etc.)



### Email Queue System



The appointment system uses a background email queue for reliability:



- **Automatic Retry** - Failed emails are retried up to 3 times

- **Delay Between Retries** - 5 minutes between each attempt

- **Background Processing** - Processes queue every 30 seconds

- **Email Types**:

  - Booking confirmation

  - Admin notifications

  - Appointment confirmed

  - Appointment declined

  - Appointment reminders

  - Cancellation confirmation



### API Endpoints



**Public Endpoints:**

- `GET /api/appointments/available-slots` - Get available time slots

- `POST /api/appointments/book` - Create new appointment

- `GET /api/appointments/:token` - Get appointment by cancellation token

- `POST /api/appointments/:token/cancel` - Cancel appointment



**Admin Endpoints (Authentication Required):**

- `GET /api/admin/appointments` - List appointments (with filtering)

- `GET /api/admin/appointments/stats` - Get dashboard statistics

- `GET /api/admin/appointments/:id` - Get appointment details

- `PUT /api/admin/appointments/:id/status` - Update appointment status

- `PUT /api/admin/appointments/:id` - Update appointment details

- `DELETE /api/admin/appointments/:id` - Delete appointment

- `GET /api/admin/availability/settings` - Get availability settings

- `PUT /api/admin/availability/settings` - Update availability settings

- `GET /api/admin/availability/blocked-dates` - List blocked dates

- `POST /api/admin/availability/blocked-dates` - Add blocked date

- `DELETE /api/admin/availability/blocked-dates/:id` - Remove blocked date



### Security Features



- **Authentication** - bcrypt password hashing (12 rounds)

- **Session Management** - Secure session storage with MySQL

- **Rate Limiting** - API endpoint protection

- **CSRF Protection** - Token-based request validation

- **SQL Injection Prevention** - Parameterized queries

- **Security Headers** - Helmet middleware with CSP

- **Optimistic Locking** - Version control on appointments

- **Transaction Safety** - Database transactions for critical operations



### Timezone



The system uses `Europe/Athens` timezone for all date/time operations.



### Troubleshooting



**Database connection fails:**

- Verify MySQL is running

- Check DB credentials in `.env`

- Ensure database exists and user has permissions



**Emails not sending:**

- Verify SMTP credentials in `.env`

- For Gmail, ensure App Password is used

- Check email queue logs: `SELECT * FROM email_queue WHERE status = 'failed'`



**No available slots showing:**

- Check availability settings in admin panel

- Verify working days are configured

- Check for blocked dates

- Ensure office hours are set correctly



**Admin setup page not accessible:**

- Ensure `/admin/setup.html` route is accessible

- Check if admin account already exists

- Verify database connection



## Contact

 

**NT - TAXOFFICE**

 

📍 3ης Σεπτεμβρίου 103

📞 +30 210 8222 950

✉️ ntallas@ntallas.com

 

## Development

 

### Adding New Routes

 

Add route handlers in `routes/index.js`:

 

```javascript

router.get('/new-page', (req, res) => {

  res.sendFile(path.join(__dirname, '../public/new-page.html'));

});

```

 

### Styling Guidelines

 

- Follow the existing modular CSS structure

- Use CSS variables defined in `base/variables.css`

- Keep components self-contained

- Use utility classes for common patterns

 

### Code Standards

 

- Use ES6+ JavaScript features

- Keep functions small and focused

- Comment complex logic

- Follow existing naming conventions

 

## Browser Compatibility

 

- Chrome (latest)

- Firefox (latest)

- Safari (latest)

- Edge (latest)

- Mobile browsers (iOS Safari, Chrome Mobile)

 

## License

 

ISC

 

## Credits

 

**Author**: itheCreator1

**Year**: 2025

 

---

 

© 2025 NT - TAXOFFICE. All rights reserved.