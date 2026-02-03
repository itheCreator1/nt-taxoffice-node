module.exports = {
  // Run tests in projects mode to support both backend and frontend
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup-backend.js'],
      testMatch: ['**/tests/unit/**/*.test.js', '**/tests/integration/**/*.test.js'],
      collectCoverageFrom: [
        'services/**/*.js',
        'utils/**/*.js',
        'middleware/**/*.js',
        'routes/**/*.js',
        '!**/node_modules/**',
      ],
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testMatch: ['**/tests/frontend/**/*.test.js'],
      testPathIgnorePatterns: ['/node_modules/', '/tests/unit/', '/tests/integration/'],
      collectCoverageFrom: ['public/js/**/*.js', '!public/js/vendor/**'],
      moduleNameMapper: {
        '^/js/vendor/flatpickr/flatpickr\\.esm\\.js$':
          '<rootDir>/public/js/vendor/flatpickr/flatpickr.esm.js',
      },
      transform: {},
    },
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
