/**
 * Database Initialization Script
 * Run this to set up the MySQL database schema
 *
 * Usage: node database/init.js
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeSchema() {
    let connection;

    try {
        console.log('Starting database initialization...\n');

        // Connect to MySQL server (without database)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        console.log('✓ Connected to MySQL server');

        // Create database if it doesn't exist
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}
             CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        console.log(`✓ Database '${process.env.DB_NAME}' created/verified`);

        // Use the database
        await connection.query(`USE ${process.env.DB_NAME}`);

        // Read and execute schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
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
        console.log('\n✓✓✓ Database initialization complete! ✓✓✓\n');
        console.log('You can now start the application with: npm start\n');

    } catch (error) {
        console.error('\n✗ Database initialization error:');
        console.error('  Message:', error.message);
        console.error('  Code:', error.code);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run initialization if executed directly
if (require.main === module) {
    initializeSchema()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n✗✗✗ Database initialization failed ✗✗✗\n');
            process.exit(1);
        });
}

module.exports = { initializeSchema };
