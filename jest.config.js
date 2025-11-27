module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'public/js/**/*.js',
        '!public/js/vendor/**'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    transform: {},
    moduleNameMapper: {
        '^/js/vendor/flatpickr/flatpickr\\.esm\\.js$': '<rootDir>/public/js/vendor/flatpickr/flatpickr.esm.js'
    },
    testMatch: [
        '**/tests/**/*.test.js'
    ]
};
