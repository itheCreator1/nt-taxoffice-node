/**
 * Test Fixtures
 * Provides test data factories for consistent test data generation
 */

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a valid appointment data object
 * @param {object} overrides - Override default values
 * @returns {object}
 */
function createAppointmentData(overrides = {}) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');

    return {
        client_name: 'Ιωάννης Παπαδόπουλος',
        client_email: 'test@example.com',
        client_phone: '6912345678',
        appointment_date: `${year}-${month}-${day}`,
        appointment_time: '10:00:00',
        service_type: 'Φορολογική Δήλωση',
        notes: 'Test appointment',
        ...overrides
    };
}

/**
 * Generate multiple appointment data objects
 * @param {number} count
 * @param {object} baseOverrides
 * @returns {Array<object>}
 */
function createMultipleAppointments(count, baseOverrides = {}) {
    const appointments = [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (let i = 0; i < count; i++) {
        const date = new Date(tomorrow);
        date.setDate(date.getDate() + Math.floor(i / 8)); // 8 slots per day

        const hour = 9 + (i % 8); // 09:00 to 16:00
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        appointments.push(createAppointmentData({
            client_name: `Test Client ${i + 1}`,
            client_email: `test${i + 1}@example.com`,
            appointment_date: `${year}-${month}-${day}`,
            appointment_time: `${String(hour).padStart(2, '0')}:00:00`,
            ...baseOverrides
        }));
    }

    return appointments;
}

/**
 * Generate admin user data
 * @param {object} overrides
 * @returns {Promise<object>}
 */
async function createAdminData(overrides = {}) {
    const password = overrides.password || 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(password, 4); // Low rounds for testing

    return {
        username: 'testadmin',
        password_hash: hashedPassword,
        is_active: true,
        ...overrides,
        // Return plain password for login tests
        _plainPassword: password
    };
}

/**
 * Generate availability settings data
 * @returns {Array<object>}
 */
function createAvailabilitySettings() {
    return [
        { day_of_week: 0, is_working_day: false, start_time: null, end_time: null },
        { day_of_week: 1, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
        { day_of_week: 2, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
        { day_of_week: 3, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
        { day_of_week: 4, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
        { day_of_week: 5, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
        { day_of_week: 6, is_working_day: false, start_time: null, end_time: null }
    ];
}

/**
 * Generate blocked date data
 * @param {object} overrides
 * @returns {object}
 */
function createBlockedDate(overrides = {}) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');

    return {
        blocked_date: `${year}-${month}-${day}`,
        reason: 'Public Holiday',
        ...overrides
    };
}

/**
 * Generate email queue data
 * @param {object} overrides
 * @returns {object}
 */
function createEmailQueueData(overrides = {}) {
    return {
        email_type: 'booking_confirmation',
        recipient_email: 'test@example.com',
        email_data: JSON.stringify({
            clientName: 'Test Client',
            appointmentDate: '2025-12-15',
            appointmentTime: '10:00'
        }),
        status: 'pending',
        attempt_count: 0,
        ...overrides
    };
}

/**
 * Generate cancellation token
 * @returns {string}
 */
function generateCancellationToken() {
    return uuidv4();
}

/**
 * Get future date (working day)
 * @param {number} daysAhead
 * @returns {string} YYYY-MM-DD format
 */
function getFutureWorkingDate(daysAhead = 1) {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);

    // Skip weekends
    while (date.getDay() === 0 || date.getDay() === 6) {
        date.setDate(date.getDate() + 1);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Get past date
 * @param {number} daysAgo
 * @returns {string} YYYY-MM-DD format
 */
function getPastDate(daysAgo = 1) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

module.exports = {
    createAppointmentData,
    createMultipleAppointments,
    createAdminData,
    createAvailabilitySettings,
    createBlockedDate,
    createEmailQueueData,
    generateCancellationToken,
    getFutureWorkingDate,
    getPastDate
};
