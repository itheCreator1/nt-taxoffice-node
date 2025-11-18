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