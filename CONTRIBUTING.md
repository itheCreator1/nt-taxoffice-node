# Contributing to nt-taxoffice-node

Thank you for your interest in contributing to nt-taxoffice-node! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Branch Strategy](#branch-strategy)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Code Review Checklist](#code-review-checklist)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and collaborative environment. Please be considerate and constructive in all interactions.

---

## Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **MySQL**: 8.0 or higher
- **Docker** (optional): For containerized development

### First-Time Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:

   ```bash
   git clone https://github.com/YOUR-USERNAME/nt-taxoffice-node.git
   cd nt-taxoffice-node
   ```

3. **Add upstream remote**:

   ```bash
   git remote add upstream https://github.com/itheCreator1/nt-taxoffice-node.git
   ```

4. **Install dependencies**:

   ```bash
   npm install
   ```

5. **Configure environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

6. **Start MySQL** (Docker):

   ```bash
   docker-compose up -d mysql
   ```

7. **Initialize database**:

   ```bash
   npm run test:db:init
   ```

8. **Run tests** to verify setup:
   ```bash
   npm test
   ```

If all tests pass, you're ready to start contributing!

---

## Development Setup

### Running the Application

**Development mode** (with auto-reload):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests
npm run test:e2e

# Watch mode (for TDD)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Database Management

```bash
# Initialize test database
npm run test:db:init

# Reset test database
npm run test:db:reset
```

---

## Branch Strategy

We follow a **Git Flow-inspired** branching model:

### Branch Types

- **`main`** - Production-ready code
  - Always stable and deployable
  - Protected branch (requires PR with reviews)
  - Tagged with semantic versions (v1.0.0, v1.1.0, etc.)

- **`testing`** - Integration/staging environment
  - Pre-production testing
  - Merged to `main` after QA approval
  - CI/CD runs on every push

- **`feature/*`** - New features
  - Branch from: `testing`
  - Merge to: `testing`
  - Naming: `feature/description-of-feature`
  - Example: `feature/add-sms-notifications`

- **`fix/*`** - Bug fixes
  - Branch from: `testing`
  - Merge to: `testing`
  - Naming: `fix/description-of-bug`
  - Example: `fix/appointment-timezone-issue`

- **`hotfix/*`** - Urgent production fixes
  - Branch from: `main`
  - Merge to: both `main` AND `testing`
  - Naming: `hotfix/critical-bug-name`
  - Example: `hotfix/sql-injection-vulnerability`

- **`docs/*`** - Documentation updates
  - Branch from: `testing`
  - Merge to: `testing`
  - Naming: `docs/description-of-changes`
  - Example: `docs/update-api-endpoints`

### Creating a Feature Branch

```bash
# Update testing branch
git checkout testing
git pull upstream testing

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your changes...
git add .
git commit -m "feat: add your feature"

# Push to your fork
git push origin feature/your-feature-name
```

### Keeping Your Branch Updated

```bash
# Fetch latest changes
git fetch upstream

# Rebase on testing
git checkout feature/your-feature-name
git rebase upstream/testing

# Resolve conflicts if any, then:
git push origin feature/your-feature-name --force-with-lease
```

---

## Commit Message Guidelines

We follow **Conventional Commits** specification for clear and structured commit history.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes only
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **test**: Adding or updating tests
- **chore**: Changes to build process, dependencies, or tooling
- **ci**: Changes to CI/CD configuration

### Scope (optional)

The scope specifies the area of the codebase:

- `auth` - Authentication/authorization
- `booking` - Appointment booking
- `admin` - Admin panel
- `email` - Email notifications
- `db` - Database
- `api` - API routes
- `ui` - User interface

### Subject

- Use imperative mood: "add feature" not "added feature"
- Don't capitalize first letter
- No period (.) at the end
- Maximum 72 characters

### Examples

**Good commits**:

```
feat(booking): add SMS notification support
fix(auth): resolve session timeout issue
docs(api): update endpoint documentation
test(admin): add tests for user management
```

**Bad commits**:

```
Fixed stuff
WIP
Updated files
asdfasdf
```

### Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the footer:

```
feat(api): change appointment response format

BREAKING CHANGE: The API now returns ISO 8601 timestamps instead of Unix timestamps.
```

---

## Coding Standards

### General Principles

1. **Write clear, readable code** - Code is read more often than written
2. **Keep functions small** - Each function should do one thing well
3. **Use meaningful names** - Variables and functions should be self-documenting
4. **Follow existing patterns** - Consistency is key
5. **Comment complex logic** - If it's not obvious, explain why (not what)

### JavaScript Style

- **Indentation**: 2 spaces (configured in `.editorconfig`)
- **Quotes**: Single quotes for strings
- **Semicolons**: Always use semicolons
- **Line length**: Maximum 100 characters
- **Naming**:
  - Variables/functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Classes: `PascalCase`
  - Files: `kebab-case.js` or `camelCase.js`

### Code Organization

```
nt-taxoffice-node/
├── database/          # Database schemas and migrations
├── middleware/        # Express middleware
├── public/           # Static assets (HTML, CSS, JS)
├── routes/           # API route handlers
│   ├── admin/       # Admin-only routes
│   └── api/         # Public API routes
├── services/         # Business logic layer
├── utils/            # Helper utilities
└── views/            # Email templates
```

### Error Handling

Always handle errors gracefully:

```javascript
// ✅ Good
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  logger.error('Operation failed:', error);
  throw new Error('User-friendly error message');
}

// ❌ Bad
const result = await someAsyncOperation(); // Unhandled promise rejection
```

### Input Validation

**Always** validate and sanitize user input:

```javascript
const { sanitizeEmail, sanitizeName } = require('../utils/sanitization');

// ✅ Good
const email = sanitizeEmail(req.body.email);
const name = sanitizeName(req.body.name);

// ❌ Bad
const email = req.body.email; // Potential XSS/SQL injection
```

### Security Guidelines

1. **Never commit secrets** - Use environment variables
2. **Validate all input** - Use `utils/validation.js` and `utils/sanitization.js`
3. **Use parameterized queries** - Prevent SQL injection
4. **Escape HTML output** - Prevent XSS attacks
5. **Rate limiting** - Already configured, don't disable
6. **Session security** - Use secure, HttpOnly cookies
7. **Dependencies** - Run `npm audit` before committing

---

## Testing Requirements

### Coverage Requirements

- **Minimum coverage**: 70% across all metrics (branches, functions, lines, statements)
- **New features**: Must include tests
- **Bug fixes**: Must include regression tests

### Test Structure

```
tests/
├── unit/
│   ├── services/      # Service layer unit tests
│   ├── middleware/    # Middleware tests
│   └── utils/         # Utility function tests
├── integration/
│   ├── api/          # API endpoint tests
│   └── admin/        # Admin panel tests
├── e2e/
│   └── *.spec.js     # End-to-end tests (Playwright)
└── helpers/          # Test utilities and fixtures
```

### Writing Tests

**Unit tests** - Test individual functions in isolation:

```javascript
describe('sanitizeEmail', () => {
  it('should remove whitespace', () => {
    expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
  });

  it('should convert to lowercase', () => {
    expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
  });
});
```

**Integration tests** - Test API endpoints:

```javascript
describe('POST /api/appointments', () => {
  it('should create appointment with valid data', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .send(validAppointmentData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });
});
```

### Running Tests Before Committing

```bash
# Quick unit tests
npm run test:unit

# Full test suite
npm test

# Coverage check
npm run test:coverage
```

**All tests must pass** before submitting a PR.

---

## Pull Request Process

### Before Creating a PR

1. **Update your branch** with latest `testing`:

   ```bash
   git fetch upstream
   git rebase upstream/testing
   ```

2. **Run all tests**:

   ```bash
   npm test
   ```

3. **Check code coverage**:

   ```bash
   npm run test:coverage
   ```

4. **Lint your code** (once configured):

   ```bash
   npm run lint
   ```

5. **Update documentation** if needed

### Creating the PR

1. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open PR** on GitHub targeting `testing` branch

3. **Fill out PR template** with:
   - Clear description of changes
   - Link to related issues
   - Screenshots (if UI changes)
   - Testing instructions

4. **Add appropriate labels**: `feature`, `bug`, `documentation`, etc.

### PR Title Format

Follow conventional commit format:

```
feat(booking): add SMS notification support
fix(auth): resolve session timeout issue
docs(api): update endpoint documentation
```

### PR Description Template

```markdown
## Description

Brief description of what this PR does and why.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues

Closes #123
Relates to #456

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing
- [ ] Coverage threshold met (70%)

## Screenshots (if applicable)

[Add screenshots for UI changes]

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex logic
- [ ] Documentation updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
```

### Review Process

1. **Automated checks** will run (CI/CD)
2. **Code review** by maintainers
3. **Address feedback** - Make requested changes
4. **Approval** - At least 1 approval required
5. **Merge** - Squash and merge to `testing`

### After Merge

1. **Delete feature branch**:

   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

2. **Update local testing branch**:
   ```bash
   git checkout testing
   git pull upstream testing
   ```

---

## Code Review Checklist

When reviewing PRs (or self-reviewing), check:

### Functionality

- [ ] Code solves the intended problem
- [ ] No unintended side effects
- [ ] Edge cases are handled

### Code Quality

- [ ] Code follows existing style conventions
- [ ] Functions are small and focused
- [ ] Variable/function names are clear and descriptive
- [ ] No code duplication (DRY principle)
- [ ] Comments explain "why" not "what"

### Security

- [ ] All input is validated and sanitized
- [ ] No hardcoded secrets or sensitive data
- [ ] SQL queries are parameterized
- [ ] HTML output is escaped
- [ ] No new security vulnerabilities (`npm audit` passes)

### Testing

- [ ] Tests are added/updated
- [ ] All tests pass
- [ ] Coverage threshold is met (70%)
- [ ] Tests are meaningful (not just for coverage)

### Documentation

- [ ] README updated (if needed)
- [ ] API docs updated (if endpoints changed)
- [ ] Inline comments for complex logic
- [ ] CHANGELOG updated (for releases)

### Performance

- [ ] No unnecessary database queries
- [ ] No memory leaks
- [ ] Efficient algorithms
- [ ] Rate limiting considered

### Error Handling

- [ ] Error handling is comprehensive
- [ ] Error messages are user-friendly
- [ ] Errors are logged appropriately
- [ ] No silent failures

---

## Getting Help

### Resources

- **Documentation**: Check the `/docs` directory
- **README**: See [README.md](README.md) for project overview
- **API Docs**: See [docs/api/endpoints.md](docs/api/endpoints.md)
- **Testing Guide**: See [docs/guides/testing.md](docs/guides/testing.md)

### Questions?

- **Open an issue** on GitHub for bugs or feature requests
- **Start a discussion** for questions or ideas
- **Check existing issues** - your question may already be answered

---

## Recognition

Contributors will be acknowledged in:

- Git commit history
- Release notes (for significant contributions)
- Project documentation (for major features)

Thank you for contributing to nt-taxoffice-node! 🎉

---

**Last Updated**: December 3, 2025
