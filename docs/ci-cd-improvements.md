# CI/CD Pipeline Improvement Plan

**Status:** Planned for future implementation
**Date Created:** 2025-12-09
**Priority:** Medium

## Overview

This document outlines planned improvements to enhance the GitHub Actions CI/CD pipeline with three "quick wins" that will improve testing coverage, compatibility validation, and resource efficiency.

## Current State

### Existing Configuration

- **Workflow file:** `.github/workflows/test.yml`
- **Current tests:** Unit tests, integration tests, coverage report (70% threshold)
- **Node.js version:** Only testing on v18
- **Linting:** ESLint (Airbnb style guide)
- **Formatting:** Prettier
- **Security:** npm audit (high-level vulnerabilities)
- **Database:** MySQL 8.0 service in CI

### What's Working Well

- Comprehensive test suite with good coverage
- Pre-commit hooks enforce code quality
- Security vulnerability scanning
- Database integration testing
- Conventional commit validation

### Gaps Identified

1. E2E tests configured but not running in CI
2. Single Node.js version testing (compatibility risk)
3. No concurrency controls (wasted CI minutes)

## Planned Improvements

### Quick Win #1: Concurrency Controls

**Effort:** 5 minutes | **Impact:** High | **Risk:** Low

**Problem:**
When multiple commits are pushed to the same branch, all CI runs execute to completion, wasting CI minutes and delaying feedback on the latest changes.

**Solution:**
Add concurrency controls to automatically cancel outdated builds when new commits are pushed.

**Implementation:**

```yaml
# Add to .github/workflows/test.yml after 'on:' section
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**Benefits:**

- Reduces CI queue buildup
- Faster feedback on latest changes
- Saves CI minutes (especially important for free/limited plans)
- Prevents confusion from outdated build results

---

### Quick Win #2: Node.js Version Matrix

**Effort:** 10 minutes | **Impact:** High | **Risk:** Low

**Problem:**
Currently only testing on Node.js 18. If dependencies or code use features specific to newer Node versions, compatibility issues may go undetected until production.

**Solution:**
Test on multiple Node.js versions (18, 20, 22) using GitHub Actions matrix strategy.

**Implementation:**

```yaml
jobs:
  test:
    name: Run Tests (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20, 22]

    steps:
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      # ... rest of steps
```

**Benefits:**

- Ensures compatibility across LTS and current versions
- Node 18: Active LTS (maintenance until April 2025)
- Node 20: Active LTS (maintenance until April 2026)
- Node 22: Current release
- Matrix jobs run in parallel (no wall-clock time increase)
- Early detection of version-specific issues

**Considerations:**

- Free GitHub accounts have concurrent job limits
- May need to adjust if hitting limits
- All three versions should pass before merge

---

### Quick Win #3: E2E Tests in CI

**Effort:** 30-45 minutes | **Impact:** High | **Risk:** Medium

**Problem:**
Playwright E2E tests are configured (`tests/e2e/appointmentBooking.spec.js`) but not running in CI. This means critical user flows aren't validated before merge.

**Current E2E Setup:**

- Playwright installed: `@playwright/test: ^1.57.0`
- Config file: `playwright.config.js`
- Test script: `npm run test:e2e`
- Local setup: Uses `docker compose up` to start app + MySQL

**Challenge:**
The Playwright config uses `docker compose up` which starts both MySQL and the app. However, GitHub Actions already runs MySQL as a service with different credentials. This creates a port conflict (both trying to use 3306).

**Recommended Solution (Option A):**
Modify `playwright.config.js` to detect CI environment and adjust behavior:

```javascript
// In playwright.config.js
webServer: {
  command: process.env.CI ? 'npm start' : 'docker compose up',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120000,
},
```

**Workflow Changes:**

```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
    DB_HOST: 127.0.0.1
    DB_PORT: 3306
    DB_USER: root
    DB_PASSWORD: testpassword
    DB_NAME: nt_taxoffice_test
    SESSION_SECRET: test-secret-key-for-ci
    # ... other env vars

- name: Upload Playwright report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report-node-${{ matrix.node-version }}
    path: playwright-report/
    retention-days: 30
```

**Alternative Solution (Option B):**
Manually start the app in the workflow instead of using Playwright's webServer feature. More explicit but more code in the workflow.

**Benefits:**

- Validates critical user flows before merge
- Catches integration issues that unit tests miss
- Provides confidence in production-like scenarios
- Visual regression detection (if configured)

**Considerations:**

- E2E tests are slower (should run after unit/integration)
- May need iteration to get working in CI
- Recommend implementing after Quick Wins #1 and #2 are stable

## Implementation Roadmap

### Phase 1: Low-Hanging Fruit (15 minutes)

1. Add concurrency controls
2. Add Node.js version matrix
3. Validate both work correctly

### Phase 2: E2E Tests (45 minutes)

1. Modify `playwright.config.js` for CI detection
2. Add E2E test steps to workflow
3. Test and iterate until passing
4. Add artifact upload for test reports

### Phase 3: Validation (1 week)

1. Monitor builds on multiple branches
2. Ensure matrix tests pass consistently
3. Verify E2E tests catch real issues
4. Adjust timeouts/retries if needed

## Files to Modify

1. **`.github/workflows/test.yml`** (required)
   - Add concurrency controls (2 lines)
   - Add matrix strategy (~5 lines)
   - Add E2E test steps (~20-30 lines)

2. **`playwright.config.js`** (for Option A)
   - Modify webServer command to detect CI (~3 lines)

## Success Criteria

- ✅ Concurrent builds are canceled when new commits are pushed
- ✅ Tests pass on Node.js 18, 20, and 22
- ✅ E2E tests run successfully in CI
- ✅ All existing tests continue to pass
- ✅ Workflow remains readable and maintainable
- ✅ Build times remain reasonable (< 10 minutes per matrix job)

## Additional Future Improvements

Beyond these quick wins, consider:

1. **Automated Releases**
   - Use conventional commits to auto-generate changelogs
   - Auto-create GitHub releases on version tags
   - Notify team of new releases

2. **Performance Testing**
   - Lighthouse CI for frontend performance
   - API response time benchmarks
   - Database query performance tracking

3. **Deployment Automation**
   - Auto-deploy to staging on merge to `testing`
   - Auto-deploy to production on merge to `main` (with approval)
   - Rollback capability

4. **Test Result Reporting**
   - Upload test results to GitHub Actions summary
   - Comment PR with coverage changes
   - Slack/email notifications for failures

5. **Security Enhancements**
   - CodeQL analysis
   - Dependency vulnerability alerts
   - SAST (Static Application Security Testing)

## References

- **GitHub Actions Documentation:** https://docs.github.com/en/actions
- **Playwright CI Documentation:** https://playwright.dev/docs/ci
- **Node.js Release Schedule:** https://nodejs.org/en/about/previous-releases
- **Current Workflow:** `.github/workflows/test.yml`
- **Playwright Config:** `playwright.config.js`

## Changelog

- **2025-12-09:** Initial plan created based on CI/CD analysis
