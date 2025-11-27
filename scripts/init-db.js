#!/usr/bin/env node

/**
 * Database Initialization Script Wrapper
 * This wrapper is used by docker-entrypoint.sh to initialize the database
 * It calls the main initialization script in database/init.js
 */

const { initializeSchema } = require('../database/init');

initializeSchema()
    .then(() => {
        console.log('\nDatabase initialization completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nDatabase initialization failed:', error.message);
        process.exit(1);
    });
