#!/usr/bin/env node

/**
 * Test Database Initialization Script
 * Sets up a clean test database for integration tests
 *
 * Usage: npm run test:db:init
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.test' });

async function initializeTestDatabase() {
    let connection;

    try {
        console.log('\n🧪 Initializing test database...\n');

        // Connect to MySQL server (without database)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        console.log('✓ Connected to MySQL server');

        // Drop test database if it exists (clean slate)
        await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
        console.log(`✓ Dropped existing test database '${process.env.DB_NAME}' (if any)`);

        // Create test database
        await connection.query(
            `CREATE DATABASE ${process.env.DB_NAME}
             CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        console.log(`✓ Created test database '${process.env.DB_NAME}'`);

        // Use the test database
        await connection.query(`USE ${process.env.DB_NAME}`);

        // Read and execute schema.sql
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Remove comment lines and split by semicolons
        const cleanedSchema = schema
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n');

        const statements = cleanedSchema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        console.log(`\nExecuting ${statements.length} SQL statements...\n`);

        for (const statement of statements) {
            await connection.query(statement);
        }

        console.log('✓ Database tables created successfully');
        console.log('✓ Default availability settings inserted');
        console.log('\n✅✅✅ Test database initialization complete! ✅✅✅\n');
        console.log('Database:', process.env.DB_NAME);
        console.log('Host:', process.env.DB_HOST);
        console.log('Port:', process.env.DB_PORT);
        console.log('\nYou can now run integration tests with: npm run test:integration\n');

    } catch (error) {
        console.error('\n❌ Test database initialization error:');
        console.error('  Message:', error.message);
        console.error('  Code:', error.code);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n  Make sure Docker Compose MySQL is running:');
            console.error('  docker-compose up -d mysql\n');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n  MySQL connection refused. Start Docker Compose:');
            console.error('  docker-compose up -d mysql\n');
        }

        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run initialization if executed directly
if (require.main === module) {
    initializeTestDatabase()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌❌❌ Test database initialization failed ❌❌❌\n');
            process.exit(1);
        });
}

module.exports = { initializeTestDatabase };
