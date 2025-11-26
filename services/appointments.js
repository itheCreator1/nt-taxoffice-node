/**
 * Appointments Service
 * Handles all appointment-related business logic with MySQL transactions
 */

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./database');
const { isSlotAvailable } = require('./availability');
const { toMySQLDate, toMySQLTime, formatGreekDate } = require('../utils/timezone');
const { logAppointmentCreated, logAppointmentStatusChange, debug } = require('../utils/logger');
const { queueEmail } = require('./emailQueue');

/**
 * Create a new appointment with transaction protection
 * @param {object} appointmentData
 * @returns {Promise<object>}
 */
async function createAppointment(appointmentData) {
    const db = getDb();
    const connection = await db.getConnection();

    try {
        // Start transaction
        await connection.beginTransaction();

        // Lock the time slot for this date/time using SELECT FOR UPDATE
        const [existing] = await connection.query(
            `SELECT id FROM appointments
             WHERE appointment_date = ?
             AND appointment_time = ?
             AND status IN ('pending', 'confirmed')
             FOR UPDATE`,
            [appointmentData.appointment_date, appointmentData.appointment_time]
        );

        // If slot is already booked, rollback and throw error
        if (existing.length > 0) {
            await connection.rollback();
            throw new Error('SLOT_ALREADY_BOOKED');
        }

        // Generate cancellation token
        const cancellationToken = uuidv4();

        // Insert appointment
        const [result] = await connection.query(
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
                cancellationToken
            ]
        );

        const appointmentId = result.insertId;

        // Insert into appointment history
        await connection.query(
            `INSERT INTO appointment_history
             (appointment_id, old_status, new_status, changed_by, notes)
             VALUES (?, NULL, 'pending', 'client', 'Appointment created')`,
            [appointmentId]
        );

        // Commit transaction
        await connection.commit();

        // Log the creation
        logAppointmentCreated(
            appointmentData.client_name,
            appointmentData.appointment_date,
            appointmentData.appointment_time
        );

        const createdAppointment = {
            id: appointmentId,
            ...appointmentData,
            status: 'pending',
            cancellation_token: cancellationToken,
            version: 1
        };

        // Queue email notifications (async, non-blocking)
        queueEmail('booking-confirmation', appointmentData.client_email, createdAppointment).catch(err => {
            debug('Failed to queue booking confirmation email:', err);
        });

        queueEmail('admin-notification', process.env.ADMIN_EMAIL, createdAppointment).catch(err => {
            debug('Failed to queue admin notification email:', err);
        });

        // Return created appointment
        return createdAppointment;

    } catch (error) {
        // Rollback on error
        await connection.rollback();
        throw error;
    } finally {
        // Release connection
        connection.release();
    }
}

/**
 * Get appointment by ID
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function getAppointmentById(id) {
    const db = getDb();
    const [rows] = await db.query(
        `SELECT * FROM appointments WHERE id = ?`,
        [id]
    );
    return rows[0] || null;
}

/**
 * Get appointment by cancellation token
 * @param {string} token
 * @returns {Promise<object|null>}
 */
async function getAppointmentByToken(token) {
    const db = getDb();
    const [rows] = await db.query(
        `SELECT * FROM appointments WHERE cancellation_token = ?`,
        [token]
    );
    return rows[0] || null;
}

/**
 * Get appointments by email
 * @param {string} email
 * @returns {Promise<Array>}
 */
async function getAppointmentsByEmail(email) {
    const db = getDb();
    const [rows] = await db.query(
        `SELECT * FROM appointments
         WHERE client_email = ?
         ORDER BY appointment_date DESC, appointment_time DESC`,
        [email]
    );
    return rows;
}

/**
 * Cancel appointment (client-initiated)
 * @param {string} cancellationToken
 * @returns {Promise<object>}
 */
async function cancelAppointment(cancellationToken) {
    const db = getDb();
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Get appointment with lock
        const [rows] = await connection.query(
            `SELECT * FROM appointments WHERE cancellation_token = ? FOR UPDATE`,
            [cancellationToken]
        );

        if (rows.length === 0) {
            await connection.rollback();
            throw new Error('APPOINTMENT_NOT_FOUND');
        }

        const appointment = rows[0];

        // Check if already cancelled
        if (appointment.status === 'cancelled') {
            await connection.rollback();
            throw new Error('ALREADY_CANCELLED');
        }

        // Check if can be cancelled (not declined or completed)
        if (appointment.status === 'declined' || appointment.status === 'completed') {
            await connection.rollback();
            throw new Error('CANNOT_CANCEL');
        }

        // Update status to cancelled with optimistic locking
        const [updateResult] = await connection.query(
            `UPDATE appointments
             SET status = 'cancelled', version = version + 1
             WHERE id = ? AND version = ?`,
            [appointment.id, appointment.version]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            throw new Error('CONCURRENT_MODIFICATION');
        }

        // Add to history
        await connection.query(
            `INSERT INTO appointment_history
             (appointment_id, old_status, new_status, changed_by, notes)
             VALUES (?, ?, 'cancelled', 'client', 'Cancelled by client')`,
            [appointment.id, appointment.status]
        );

        await connection.commit();

        logAppointmentStatusChange(appointment.id, appointment.status, 'cancelled', 'client');

        const cancelledAppointment = {
            ...appointment,
            status: 'cancelled',
            version: appointment.version + 1
        };

        // Queue cancellation confirmation email (async, non-blocking)
        queueEmail('cancellation-confirmation', appointment.client_email, cancelledAppointment).catch(err => {
            debug('Failed to queue cancellation confirmation email:', err);
        });

        return cancelledAppointment;

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Get all appointments (admin)
 * @param {object} filters - { status, date, limit, offset }
 * @returns {Promise<Array>}
 */
async function getAllAppointments(filters = {}) {
    const db = getDb();
    let query = 'SELECT * FROM appointments WHERE 1=1';
    const params = [];

    // Apply filters
    if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
    }

    if (filters.date) {
        query += ' AND appointment_date = ?';
        params.push(filters.date);
    }

    if (filters.start_date) {
        query += ' AND appointment_date >= ?';
        params.push(filters.start_date);
    }

    if (filters.end_date) {
        query += ' AND appointment_date <= ?';
        params.push(filters.end_date);
    }

    // Order by date and time
    query += ' ORDER BY appointment_date DESC, appointment_time DESC';

    // Pagination
    if (filters.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(filters.limit));

        if (filters.offset) {
            query += ' OFFSET ?';
            params.push(parseInt(filters.offset));
        }
    }

    const [rows] = await db.query(query, params);
    return rows;
}

/**
 * Count appointments (admin)
 * @param {object} filters - { status, date }
 * @returns {Promise<number>}
 */
async function countAppointments(filters = {}) {
    const db = getDb();
    let query = 'SELECT COUNT(*) as count FROM appointments WHERE 1=1';
    const params = [];

    if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
    }

    if (filters.date) {
        query += ' AND appointment_date = ?';
        params.push(filters.date);
    }

    if (filters.start_date) {
        query += ' AND appointment_date >= ?';
        params.push(filters.start_date);
    }

    if (filters.end_date) {
        query += ' AND appointment_date <= ?';
        params.push(filters.end_date);
    }

    const [rows] = await db.query(query, params);
    return rows[0].count;
}

/**
 * Update appointment status (admin)
 * @param {number} id
 * @param {string} newStatus
 * @param {string} changedBy - 'admin' or 'system'
 * @param {string} notes
 * @returns {Promise<object>}
 */
async function updateAppointmentStatus(id, newStatus, changedBy = 'admin', notes = null) {
    const db = getDb();
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Get appointment with lock
        const [rows] = await connection.query(
            `SELECT * FROM appointments WHERE id = ? FOR UPDATE`,
            [id]
        );

        if (rows.length === 0) {
            await connection.rollback();
            throw new Error('APPOINTMENT_NOT_FOUND');
        }

        const appointment = rows[0];
        const oldStatus = appointment.status;

        // Update status with optimistic locking
        const [updateResult] = await connection.query(
            `UPDATE appointments
             SET status = ?, version = version + 1
             WHERE id = ? AND version = ?`,
            [newStatus, id, appointment.version]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            throw new Error('CONCURRENT_MODIFICATION');
        }

        // Add to history
        await connection.query(
            `INSERT INTO appointment_history
             (appointment_id, old_status, new_status, changed_by, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [id, oldStatus, newStatus, changedBy, notes]
        );

        await connection.commit();

        logAppointmentStatusChange(id, oldStatus, newStatus, changedBy);

        return {
            ...appointment,
            status: newStatus,
            version: appointment.version + 1
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Decline appointment with reason (admin)
 * @param {number} id
 * @param {string} reason
 * @returns {Promise<object>}
 */
async function declineAppointment(id, reason) {
    const db = getDb();
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Get appointment with lock
        const [rows] = await connection.query(
            `SELECT * FROM appointments WHERE id = ? FOR UPDATE`,
            [id]
        );

        if (rows.length === 0) {
            await connection.rollback();
            throw new Error('APPOINTMENT_NOT_FOUND');
        }

        const appointment = rows[0];
        const oldStatus = appointment.status;

        // Update status and decline reason
        const [updateResult] = await connection.query(
            `UPDATE appointments
             SET status = 'declined', decline_reason = ?, version = version + 1
             WHERE id = ? AND version = ?`,
            [reason, id, appointment.version]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            throw new Error('CONCURRENT_MODIFICATION');
        }

        // Add to history
        await connection.query(
            `INSERT INTO appointment_history
             (appointment_id, old_status, new_status, changed_by, notes)
             VALUES (?, ?, 'declined', 'admin', ?)`,
            [id, oldStatus, reason]
        );

        await connection.commit();

        logAppointmentStatusChange(id, oldStatus, 'declined', 'admin');

        return {
            ...appointment,
            status: 'declined',
            decline_reason: reason,
            version: appointment.version + 1
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Get appointment history
 * @param {number} appointmentId
 * @returns {Promise<Array>}
 */
async function getAppointmentHistory(appointmentId) {
    const db = getDb();
    const [rows] = await db.query(
        `SELECT * FROM appointment_history
         WHERE appointment_id = ?
         ORDER BY changed_at DESC`,
        [appointmentId]
    );
    return rows;
}

/**
 * Get appointment statistics (admin)
 * @returns {Promise<object>}
 */
async function getAppointmentStats() {
    const db = getDb();

    const [statusCounts] = await db.query(`
        SELECT status, COUNT(*) as count
        FROM appointments
        GROUP BY status
    `);

    const [todayCount] = await db.query(`
        SELECT COUNT(*) as count
        FROM appointments
        WHERE appointment_date = CURDATE()
        AND status IN ('pending', 'confirmed')
    `);

    const [upcomingCount] = await db.query(`
        SELECT COUNT(*) as count
        FROM appointments
        WHERE appointment_date > CURDATE()
        AND status IN ('pending', 'confirmed')
    `);

    return {
        byStatus: statusCounts.reduce((acc, row) => {
            acc[row.status] = row.count;
            return acc;
        }, {}),
        today: todayCount[0].count,
        upcoming: upcomingCount[0].count
    };
}

module.exports = {
    // Client operations
    createAppointment,
    getAppointmentById,
    getAppointmentByToken,
    getAppointmentsByEmail,
    cancelAppointment,

    // Admin operations
    getAllAppointments,
    countAppointments,
    updateAppointmentStatus,
    declineAppointment,
    getAppointmentHistory,
    getAppointmentStats
};
