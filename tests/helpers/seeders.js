/**
 * Test Database Seeders
 * Helper functions to seed the database with test data
 * Optimized for speed by using direct database inserts
 */

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { getTestDatabaseSync } = require('./testDatabase');

// Cache hashed passwords to avoid expensive bcrypt operations
// Key: plain password, Value: hashed password
const passwordCache = new Map();

/**
 * Get or create hashed password (with caching for performance)
 * @param {string} plainPassword
 * @returns {Promise<string>}
 */
async function getHashedPassword(plainPassword) {
  if (!passwordCache.has(plainPassword)) {
    // Use minimal bcrypt rounds for testing (faster)
    const hashed = await bcrypt.hash(plainPassword, 4);
    passwordCache.set(plainPassword, hashed);
  }
  return passwordCache.get(plainPassword);
}

/**
 * Seed an admin user directly into the database
 * Much faster than going through HTTP endpoints with full bcrypt rounds
 * Uses password caching to avoid expensive re-hashing
 * @param {Object} [overrides] - Override default admin data
 * @returns {Promise<Object>} Created admin user data
 */
async function seedAdminUser(overrides = {}) {
  const pool = getTestDatabaseSync();

  const adminData = {
    username: 'admin',
    password: 'Admin123!@#',
    email: 'admin@taxoffice.gr',
    ...overrides,
  };

  // Get cached hashed password (or hash if not cached)
  const hashedPassword = await getHashedPassword(adminData.password);

  // Use INSERT ... ON DUPLICATE KEY UPDATE to handle re-seeding
  const [result] = await pool.query(
    `INSERT INTO admin_users (username, password_hash, email, is_active, created_at)
         VALUES (?, ?, ?, TRUE, NOW())
         ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         email = VALUES(email),
         is_active = TRUE`,
    [adminData.username, hashedPassword, adminData.email]
  );

  // Get the actual ID (for both INSERT and UPDATE cases)
  let adminId = result.insertId;
  if (adminId === 0) {
    // Update case - fetch the ID
    const [rows] = await pool.query('SELECT id FROM admin_users WHERE username = ?', [
      adminData.username,
    ]);
    adminId = rows[0].id;
  }

  return {
    id: adminId,
    username: adminData.username,
    password: adminData.password, // Return plain password for login tests
    email: adminData.email,
  };
}

/**
 * Seed multiple appointments into the database
 * @param {number} [count=5] - Number of appointments to create
 * @param {Object} [baseData] - Base data to use for all appointments
 * @returns {Promise<Array>} Created appointment IDs
 */
async function seedAppointments(count = 5, baseData = {}) {
  const pool = getTestDatabaseSync();
  const { createAppointmentData, getFutureWorkingDate } = require('./fixtures');

  const appointmentIds = [];
  const queries = [];

  for (let i = 0; i < count; i += 1) {
    const appointmentData = createAppointmentData({
      appointment_date: getFutureWorkingDate(i + 1),
      appointment_time: '10:00:00',
      ...baseData,
    });

    queries.push(
      pool.query(
        `INSERT INTO appointments
                 (client_name, client_email, client_phone, appointment_date, appointment_time,
                  service_type, notes, status, cancellation_token, version)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, 1)`,
        [
          appointmentData.client_name,
          appointmentData.client_email,
          appointmentData.client_phone,
          appointmentData.appointment_date,
          appointmentData.appointment_time,
          appointmentData.service_type,
          appointmentData.notes || null,
          uuidv4(),
        ]
      )
    );
  }

  const results = await Promise.all(queries);
  results.forEach(([result]) => {
    appointmentIds.push(result.insertId);
  });

  return appointmentIds;
}

/**
 * Seed a fully booked day with appointments
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} [startTime='09:00:00'] - Start time
 * @param {string} [endTime='17:00:00'] - End time
 * @param {number} [slotDuration=60] - Duration of each slot in minutes
 * @returns {Promise<Array>} Created appointment IDs
 */
async function seedFullyBookedDay(
  date,
  startTime = '09:00:00',
  endTime = '17:00:00',
  slotDuration = 60
) {
  const pool = getTestDatabaseSync();
  const { createAppointmentData } = require('./fixtures');

  // Calculate number of slots
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const slots = Math.floor((end - start) / (slotDuration * 60 * 1000));

  const appointmentIds = [];
  const queries = [];

  for (let i = 0; i < slots; i += 1) {
    const slotTime = new Date(start.getTime() + i * slotDuration * 60 * 1000);
    const timeString = slotTime.toTimeString().slice(0, 8);

    const appointmentData = createAppointmentData({
      appointment_date: date,
      appointment_time: timeString,
    });

    queries.push(
      pool.query(
        `INSERT INTO appointments
                 (client_name, client_email, client_phone, appointment_date, appointment_time,
                  service_type, notes, status, cancellation_token, version)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, 1)`,
        [
          appointmentData.client_name,
          appointmentData.client_email,
          appointmentData.client_phone,
          appointmentData.appointment_date,
          timeString,
          appointmentData.service_type,
          appointmentData.notes || null,
          uuidv4(),
        ]
      )
    );
  }

  const results = await Promise.all(queries);
  results.forEach(([result]) => {
    appointmentIds.push(result.insertId);
  });

  return appointmentIds;
}

/**
 * Seed availability settings (default schedule already inserted by clearTestDatabase)
 * This function updates existing settings
 * @param {Array<Object>} settings - Array of {day_of_week, is_working_day, start_time, end_time}
 * @returns {Promise<void>}
 */
async function seedAvailabilitySettings(settings) {
  const pool = getTestDatabaseSync();

  const queries = settings.map((setting) =>
    pool.query(
      `UPDATE availability_settings
             SET is_working_day = ?, start_time = ?, end_time = ?
             WHERE day_of_week = ?`,
      [setting.is_working_day, setting.start_time, setting.end_time, setting.day_of_week]
    )
  );

  await Promise.all(queries);
}

/**
 * Seed blocked dates (holidays, vacations)
 * @param {Array<Object>} dates - Array of {date, reason, all_day}
 * @returns {Promise<Array>} Created blocked date IDs
 */
async function seedBlockedDates(dates) {
  const pool = getTestDatabaseSync();
  const blockedIds = [];

  const queries = dates.map((dateInfo) =>
    pool.query(
      `INSERT INTO blocked_dates (date, reason, all_day, created_at)
             VALUES (?, ?, ?, NOW())`,
      [
        dateInfo.date,
        dateInfo.reason || 'Test blocked date',
        dateInfo.all_day !== false, // Default to true
      ]
    )
  );

  const results = await Promise.all(queries);
  results.forEach(([result]) => {
    blockedIds.push(result.insertId);
  });

  return blockedIds;
}

/**
 * Seed appointment history entries
 * @param {number} appointmentId - Appointment ID
 * @param {Array<Object>} statusChanges - Array of {status, notes, changed_by}
 * @returns {Promise<void>}
 */
async function seedAppointmentHistory(appointmentId, statusChanges) {
  const pool = getTestDatabaseSync();

  const queries = statusChanges.map((change) =>
    pool.query(
      `INSERT INTO appointment_history
             (appointment_id, status, notes, changed_by, changed_at)
             VALUES (?, ?, ?, ?, NOW())`,
      [appointmentId, change.status, change.notes || null, change.changed_by || 'system']
    )
  );

  await Promise.all(queries);
}

/**
 * Quick setup: Create admin user and return login-ready data
 * @returns {Promise<Object>} Admin credentials for testing
 */
async function quickAdminSetup() {
  return seedAdminUser();
}

module.exports = {
  seedAdminUser,
  seedAppointments,
  seedFullyBookedDay,
  seedAvailabilitySettings,
  seedBlockedDates,
  seedAppointmentHistory,
  quickAdminSetup,
};
