module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['airbnb-base'],
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
    'max-len': ['error', {
      code: 120,
      ignoreComments: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    }],

    // Allow param reassignment for Express middleware (req, res)
    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: ['req', 'res', 'acc'],
    }],

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
  },
  overrides: [
    {
      // Test files have different rules
      files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
      },
      rules: {
        // Allow any for testing
        'no-unused-expressions': 'off',
        'global-require': 'off',
        'import/no-dynamic-require': 'off',
      },
    },
  ],
};
