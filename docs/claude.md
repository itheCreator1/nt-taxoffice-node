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

 

## Notes for AI Assistant

 

- The project uses a simple Express setup with static file serving

- No database or backend API currently implemented

- Focus on frontend improvements and user experience

- Maintain the professional, clean aesthetic

- Keep accessibility in mind for all changes

- Test responsive design when making layout changes

- Follow the established modular patterns for CSS and JS