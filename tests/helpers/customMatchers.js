/**
 * Custom Jest Matchers for Domain-Specific Assertions
 * Provides readable, expressive test assertions
 */

const { getTestDatabaseSync } = require('./testDatabase');

expect.extend({
    /**
     * Check if an object is a valid appointment
     * @param {Object} received - Object to check
     */
    toBeValidAppointment(received) {
        const requiredFields = [
            'id',
            'client_name',
            'client_email',
            'client_phone',
            'appointment_date',
            'appointment_time',
            'service_type',
            'status'
        ];

        const missingFields = requiredFields.filter(field => !(field in received));

        const pass = missingFields.length === 0;

        if (pass) {
            return {
                message: () => `expected ${JSON.stringify(received)} not to be a valid appointment`,
                pass: true
            };
        } else {
            return {
                message: () =>
                    `expected ${JSON.stringify(received)} to be a valid appointment, but missing fields: ${missingFields.join(', ')}`,
                pass: false
            };
        }
    },

    /**
     * Check if an appointment exists in the database
     * @param {number} appointmentId - Appointment ID to check
     */
    async toExistInDatabase(appointmentId) {
        const pool = getTestDatabaseSync();

        try {
            const [rows] = await pool.query(
                'SELECT id FROM appointments WHERE id = ?',
                [appointmentId]
            );

            const pass = rows.length > 0;

            if (pass) {
                return {
                    message: () => `expected appointment ${appointmentId} not to exist in database`,
                    pass: true
                };
            } else {
                return {
                    message: () => `expected appointment ${appointmentId} to exist in database, but it was not found`,
                    pass: false
                };
            }
        } catch (error) {
            return {
                message: () => `database query failed: ${error.message}`,
                pass: false
            };
        }
    },

    /**
     * Check if an appointment has a specific status in the database
     * @param {number} appointmentId - Appointment ID
     * @param {string} expectedStatus - Expected status
     */
    async toHaveStatusInDatabase(appointmentId, expectedStatus) {
        const pool = getTestDatabaseSync();

        try {
            const [rows] = await pool.query(
                'SELECT status FROM appointments WHERE id = ?',
                [appointmentId]
            );

            if (rows.length === 0) {
                return {
                    message: () => `appointment ${appointmentId} not found in database`,
                    pass: false
                };
            }

            const actualStatus = rows[0].status;
            const pass = actualStatus === expectedStatus;

            if (pass) {
                return {
                    message: () =>
                        `expected appointment ${appointmentId} not to have status "${expectedStatus}", but it does`,
                    pass: true
                };
            } else {
                return {
                    message: () =>
                        `expected appointment ${appointmentId} to have status "${expectedStatus}", but has status "${actualStatus}"`,
                    pass: false
                };
            }
        } catch (error) {
            return {
                message: () => `database query failed: ${error.message}`,
                pass: false
            };
        }
    },

    /**
     * Check if a response matches appointment schema
     * @param {Object} received - Response object to check
     */
    toMatchAppointmentSchema(received) {
        const schema = {
            success: 'boolean',
            data: 'object'
        };

        const typeChecks = Object.keys(schema).map(key => {
            const expectedType = schema[key];
            const actualType = typeof received[key];
            return {
                key,
                expected: expectedType,
                actual: actualType,
                match: actualType === expectedType
            };
        });

        const failures = typeChecks.filter(check => !check.match);
        const pass = failures.length === 0 && received.data && typeof received.data === 'object';

        if (pass) {
            return {
                message: () => `expected response not to match appointment schema`,
                pass: true
            };
        } else {
            const failureMessages = failures.map(f => `${f.key}: expected ${f.expected}, got ${f.actual}`);
            return {
                message: () =>
                    `expected response to match appointment schema, but:\n${failureMessages.join('\n')}`,
                pass: false
            };
        }
    },

    /**
     * Check if a Greek phone number is valid
     * @param {string} phoneNumber - Phone number to check
     */
    toBeValidGreekPhone(phoneNumber) {
        // Greek mobile: 69XXXXXXXX (10 digits)
        // Greek landline: 2XXXXXXXXX (10 digits)
        const greekPhoneRegex = /^(69|2\d)\d{8}$/;

        const pass = greekPhoneRegex.test(phoneNumber);

        if (pass) {
            return {
                message: () => `expected ${phoneNumber} not to be a valid Greek phone number`,
                pass: true
            };
        } else {
            return {
                message: () =>
                    `expected ${phoneNumber} to be a valid Greek phone number (format: 69XXXXXXXX or 2XXXXXXXXX)`,
                pass: false
            };
        }
    },

    /**
     * Check if a date is a working day
     * @param {string} date - Date in YYYY-MM-DD format
     */
    toBeWorkingDay(date) {
        const dateObj = new Date(date + 'T00:00:00');
        const dayOfWeek = dateObj.getDay();

        // 0 = Sunday, 6 = Saturday
        const pass = dayOfWeek !== 0 && dayOfWeek !== 6;

        if (pass) {
            return {
                message: () => `expected ${date} not to be a working day`,
                pass: true
            };
        } else {
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
            return {
                message: () => `expected ${date} to be a working day, but it's a ${dayName}`,
                pass: false
            };
        }
    },

    /**
     * Check if an API response indicates success
     * @param {Object} response - API response object
     */
    toIndicateSuccess(response) {
        const hasBody = response && response.body;
        const hasSuccess = hasBody && response.body.success === true;

        const pass = hasSuccess;

        if (pass) {
            return {
                message: () => `expected response not to indicate success`,
                pass: true
            };
        } else {
            return {
                message: () =>
                    `expected response to indicate success, but got: ${JSON.stringify(response.body || response)}`,
                pass: false
            };
        }
    },

    /**
     * Check if an API response indicates error
     * @param {Object} response - API response object
     */
    toIndicateError(response) {
        const hasBody = response && response.body;
        const hasSuccess = hasBody && response.body.success === false;

        const pass = hasSuccess;

        if (pass) {
            return {
                message: () => `expected response not to indicate error`,
                pass: true
            };
        } else {
            return {
                message: () =>
                    `expected response to indicate error, but got: ${JSON.stringify(response.body || response)}`,
                pass: false
            };
        }
    }
});

module.exports = {};
