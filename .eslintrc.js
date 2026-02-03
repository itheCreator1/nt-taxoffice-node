module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Allow console.log in Node.js backend
    'no-console': 'off',

    // Warn instead of error for consistent-return
    'consistent-return': 'warn',

    // Allow longer line lengths for readability
    'max-len': [
      'error',
      {
        code: 120,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],

    // Allow param reassignment for Express middleware (req, res)
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: ['req', 'res', 'acc'],
      },
    ],

    // Allow for...of loops
    'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],

    // Allow async functions without await
    'require-await': 'off',

    // Allow functions to be used before definition (hoisting)
    'no-use-before-define': ['error', { functions: false }],

    // Prefer destructuring but don't enforce strictly
    'prefer-destructuring': 'warn',

    // Allow underscore dangle for private properties
    'no-underscore-dangle': 'off',

    // Allow multiple classes per file (e.g., custom errors)
    'max-classes-per-file': 'off',

    // Allow certain patterns in backend code
    'no-continue': 'off', // Allow continue in loops for clarity
    'no-await-in-loop': 'warn', // Warn but don't error for sequential operations
    'no-plusplus': 'off', // Allow ++ operator
    'no-nested-ternary': 'off', // Allow nested ternaries (will refactor later)
    'no-useless-escape': 'off', // Allow escapes in regex for clarity
    'no-control-regex': 'off', // Allow control chars in sanitization regex
    radix: 'warn', // Warn about missing radix parameter
    camelcase: 'off', // Allow snake_case for database column names
  },
  overrides: [
    {
      // Playwright config - allow devDependencies
      files: ['playwright.config.js'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      // Browser JavaScript files (frontend)
      files: ['public/**/*.js'],
      env: {
        browser: true,
        es2021: true,
      },
      rules: {
        'no-alert': 'off', // Allow alert/confirm in browser code
        'no-restricted-globals': 'off', // Allow browser globals
        'no-plusplus': 'off', // Allow ++ operator in loops
        'no-param-reassign': 'off', // Allow param reassignment in frontend
        'no-unused-vars': 'warn', // Downgrade to warning for frontend
        'no-undef': 'warn', // Downgrade for global libraries like flatpickr
        eqeqeq: 'warn', // Downgrade == vs === to warning
        'default-case': 'off', // Allow switches without default
        'import/prefer-default-export': 'off', // Allow named exports
        'import/extensions': 'off', // Allow .js extensions in imports
      },
    },
    {
      // E2E test files (Playwright)
      files: ['tests/e2e/**/*.js', '**/*.spec.js'],
      env: {
        browser: true, // Allow browser globals
        node: true,
      },
      rules: {
        'no-undef': 'off', // Allow Playwright globals
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      // Test files have different rules
      files: ['tests/**/*.js', '**/*.test.js'],
      env: {
        jest: true,
      },
      rules: {
        // Allow any for testing
        'no-unused-expressions': 'off',
        'global-require': 'off',
        'import/no-dynamic-require': 'off',
        'no-unused-vars': 'warn', // Downgrade to warning for tests
        'no-shadow': 'warn', // Downgrade to warning for tests
        'no-plusplus': 'off', // Allow ++ in test loops
        'no-await-in-loop': 'off', // Allow await in loop for sequential test setup
        'no-promise-executor-return': 'warn', // Downgrade to warning
        'class-methods-use-this': 'off', // Allow for builder patterns
        'func-names': 'off', // Allow unnamed functions in tests
        'import/no-extraneous-dependencies': 'off', // Allow devDependencies
      },
    },
  ],
};
