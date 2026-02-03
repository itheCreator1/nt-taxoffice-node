# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of nt-taxoffice-node seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by:

1. **Email**: Send details to the repository maintainer
2. **GitHub Security Advisory**: Use the [GitHub Security Advisory](https://github.com/itheCreator1/nt-taxoffice-node/security/advisories/new) feature (preferred)

### What to Include

When reporting a vulnerability, please include:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact and severity assessment
- Any suggested fixes or mitigations (optional)
- Your contact information for follow-up questions

### Response Timeline

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within **48 hours**
- **Initial Assessment**: We will provide an initial assessment within **5 business days**
- **Fix Timeline**:
  - Critical vulnerabilities: **7-14 days**
  - High severity: **14-30 days**
  - Medium/Low severity: **30-90 days**

### What to Expect

1. **Confirmation**: We'll confirm the vulnerability and assess its severity
2. **Development**: We'll work on a fix in a private repository
3. **Testing**: We'll thoroughly test the fix to ensure it resolves the issue
4. **Disclosure**: We'll coordinate public disclosure with you
5. **Release**: We'll release a patched version
6. **Credit**: We'll publicly acknowledge your responsible disclosure (unless you prefer to remain anonymous)

## Security Update Policy

- Security updates are released as patch versions (e.g., 1.0.1)
- Critical security fixes may be backported to previous minor versions if necessary
- Security advisories will be published through GitHub Security Advisories
- Users are strongly encouraged to update to the latest version

## Security Best Practices

When deploying nt-taxoffice-node, please follow these security best practices:

1. **Environment Variables**: Never commit `.env` files or hardcode secrets
2. **Dependencies**: Regularly run `npm audit` and update dependencies
3. **HTTPS**: Always use HTTPS in production environments
4. **Session Secrets**: Use strong, randomly generated session secrets
5. **Rate Limiting**: Keep rate limiting enabled (configured by default)
6. **Input Validation**: Never disable input sanitization
7. **Database**: Use strong database passwords and restrict network access
8. **Updates**: Subscribe to repository notifications for security updates

## Security Features

This project includes several built-in security features:

- **Helmet.js**: Content Security Policy (CSP) protection
- **Rate Limiting**: Multiple rate limiters for different endpoints
- **Input Sanitization**: Comprehensive input validation and sanitization
- **Session Security**: Secure session configuration with HttpOnly cookies
- **Password Hashing**: bcrypt with configurable rounds
- **XSS Protection**: HTML escaping and CSP headers
- **SQL Injection Protection**: Parameterized database queries

## Hall of Fame

We'd like to thank the following individuals for responsibly disclosing security vulnerabilities:

_No reports yet_

---

**Last Updated**: December 3, 2025
