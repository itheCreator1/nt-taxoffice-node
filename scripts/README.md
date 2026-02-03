# Scripts

Utility scripts for the NT-TaxOffice project.

## Coverage Report Script

**File**: `coverage-report.sh`

Generates and displays comprehensive test coverage reports with color-coded output.

### Usage

**Run tests and generate report**:

```bash
npm run coverage:report
```

Or directly:

```bash
./scripts/coverage-report.sh
```

**View existing coverage (without running tests)**:

```bash
npm run coverage:view
```

Or directly:

```bash
./scripts/coverage-report.sh no
```

### Features

- ✅ Runs tests with coverage collection
- ✅ Displays coverage summary (statements, branches, functions, lines)
- ✅ Checks against coverage thresholds (70% minimum)
- ✅ Lists files with low coverage (<70%)
- ✅ Color-coded output (green for pass, red for fail, yellow for warnings)
- ✅ Option to open HTML report in browser
- ✅ Exit codes for CI/CD integration (0 = pass, 1 = fail)

### Output Example

```
================================
NT-TaxOffice Coverage Report
================================

Running tests with coverage...

Coverage Summary:

  Statements   : 85.2% (1245/1461)
  Branches     : 78.3% (234/299)
  Functions    : 82.1% (156/190)
  Lines        : 85.1% (1234/1450)

Coverage Analysis:

  ✓ statements   : 85.2% (threshold: 70%)
  ✓ branches     : 78.3% (threshold: 70%)
  ✓ functions    : 82.1% (threshold: 70%)
  ✓ lines        : 85.1% (threshold: 70%)

✓ All coverage thresholds met!

Files with coverage below 70%:

  ✓ No files with low coverage!

================================

HTML Report: coverage/lcov-report/index.html
Open HTML report in browser? (y/n)
```

### Coverage Thresholds

The script checks the following minimum thresholds:

- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

### CI/CD Integration

The script exits with:

- **Exit code 0**: All thresholds met
- **Exit code 1**: One or more thresholds not met

Use in CI/CD pipelines:

```bash
npm run coverage:report || exit 1
```

---

## Test Setup Script

**File**: `test-setup.sh`

Sets up the test environment and initializes the test database.

### Usage

```bash
npm run test:setup
```

---

## Test Database Scripts

**Files**: `init-test-db.js`

Initialize or reset the test database.

### Usage

**Initialize test database**:

```bash
npm run test:db:init
```

**Reset test database**:

```bash
npm run test:db:reset
```

---

## Requirements

- **Node.js**: 18+
- **Bash**: For shell scripts
- **MySQL**: 8.0+ for test database

---

## Adding New Scripts

When adding new scripts:

1. Place script file in `scripts/` directory
2. Make script executable: `chmod +x scripts/your-script.sh`
3. Add npm script to `package.json`:
   ```json
   "your-script": "bash scripts/your-script.sh"
   ```
4. Document the script in this README

---

**Last Updated**: December 2025
