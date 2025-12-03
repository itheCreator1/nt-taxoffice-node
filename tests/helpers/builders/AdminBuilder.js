/**
 * AdminBuilder - Fluent API for building admin user test data
 * Uses faker for realistic data
 */

const { faker } = require('@faker-js/faker');

class AdminBuilder {
    constructor() {
        // Set default values
        this.data = {
            username: 'admin',
            password: 'Admin123!@#',
            email: 'admin@taxoffice.gr'
        };
    }

    /**
     * Set username
     * @param {string} username
     * @returns {AdminBuilder}
     */
    withUsername(username) {
        this.data.username = username;
        return this;
    }

    /**
     * Set password
     * @param {string} password
     * @returns {AdminBuilder}
     */
    withPassword(password) {
        this.data.password = password;
        return this;
    }

    /**
     * Set email
     * @param {string} email
     * @returns {AdminBuilder}
     */
    withEmail(email) {
        this.data.email = email;
        return this;
    }

    /**
     * Use random credentials
     * @returns {AdminBuilder}
     */
    withRandomCredentials() {
        this.data.username = faker.internet.userName().toLowerCase();
        this.data.email = faker.internet.email().toLowerCase();
        // Generate a strong password
        this.data.password = faker.internet.password({ length: 12 }) + 'A1!';
        return this;
    }

    /**
     * Use Greek email domain
     * @returns {AdminBuilder}
     */
    withGreekEmail() {
        const username = faker.internet.userName().toLowerCase();
        this.data.email = `${username}@taxoffice.gr`;
        return this;
    }

    /**
     * Build and return the admin data object
     * @returns {Object}
     */
    build() {
        return { ...this.data };
    }
}

module.exports = AdminBuilder;
