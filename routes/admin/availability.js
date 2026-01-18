/**
 * Admin Availability Routes
 * Protected routes for managing office hours and blocked dates
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../middleware/errorHandler');
const { requireAuth } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');
const { getDb } = require('../../services/database');
const { toMySQLDate } = require('../../utils/timezone');
const { logSecurityEvent } = require('../../utils/logger');

// Apply authentication to all routes
router.use(requireAuth);
router.use(apiLimiter);

/**
 * GET /api/admin/availability/settings
 * Get current availability settings (per-day structure)
 */
router.get('/settings', asyncHandler(async (req, res) => {
    const db = getDb();

    // Fetch all 7 days
    const [settings] = await db.query(
        'SELECT day_of_week, is_working_day, start_time, end_time FROM availability_settings ORDER BY day_of_week'
    );

    if (settings.length === 0) {
        // Return empty structure (should not happen if schema populated correctly)
        return res.json({
            success: true,
            data: { days: [] }
        });
    }

    // Transform to admin-friendly format
    const days = settings.map(row => ({
        day_of_week: row.day_of_week,
        is_working_day: Boolean(row.is_working_day),
        start_time: row.start_time,
        end_time: row.end_time
    }));

    res.json({
        success: true,
        data: { days }
    });
}));

/**
 * PUT /api/admin/availability/settings
 * Update availability settings (per-day structure)
 */
router.put('/settings', asyncHandler(async (req, res) => {
    const db = getDb();
    const { days } = req.body;

    // Validation: must have all 7 days
    if (!days || !Array.isArray(days) || days.length !== 7) {
        return res.status(400).json({
            success: false,
            message: 'Πρέπει να παρέχετε ρυθμίσεις για όλες τις 7 ημέρες.'
        });
    }

    // Validate each working day has hours
    for (const day of days) {
        if (day.is_working_day && (!day.start_time || !day.end_time)) {
            return res.status(400).json({
                success: false,
                message: `Η ημέρα ${day.day_of_week} είναι εργάσιμη αλλά δεν έχει ώρες λειτουργίας.`
            });
        }
    }

    // Update each day using transaction with proper connection handling
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        for (const day of days) {
            await connection.query(
                `UPDATE availability_settings
                 SET is_working_day = ?, start_time = ?, end_time = ?
                 WHERE day_of_week = ?`,
                [
                    day.is_working_day,
                    day.is_working_day ? day.start_time : null,
                    day.is_working_day ? day.end_time : null,
                    day.day_of_week
                ]
            );
        }

        await connection.commit();

        logSecurityEvent('Availability settings updated', {
            adminUsername: req.session.username,
            changes: days.filter(d => d.is_working_day).length + ' working days configured'
        });

        res.json({
            success: true,
            message: 'Οι ρυθμίσεις διαθεσιμότητας ενημερώθηκαν επιτυχώς.'
        });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}));

/**
 * GET /api/admin/availability/blocked-dates
 * Get all blocked dates
 */
router.get('/blocked-dates', asyncHandler(async (req, res) => {
    const db = getDb();

    const [blockedDates] = await db.query(
        `SELECT * FROM blocked_dates
         WHERE blocked_date >= CURDATE()
         ORDER BY blocked_date ASC`
    );

    res.json({
        success: true,
        data: blockedDates
    });
}));

/**
 * POST /api/admin/availability/blocked-dates
 * Add a blocked date
 */
router.post('/blocked-dates', asyncHandler(async (req, res) => {
    const db = getDb();
    const { blocked_date, reason } = req.body;

    if (!blocked_date) {
        return res.status(400).json({
            success: false,
            message: 'Η ημερομηνία είναι υποχρεωτική.'
        });
    }

    const mysqlDate = toMySQLDate(blocked_date);

    // Check if already blocked
    const [existing] = await db.query(
        'SELECT id FROM blocked_dates WHERE blocked_date = ?',
        [mysqlDate]
    );

    if (existing.length > 0) {
        return res.status(409).json({
            success: false,
            message: 'Αυτή η ημερομηνία είναι ήδη αποκλεισμένη.'
        });
    }

    // Insert blocked date
    const [result] = await db.query(
        `INSERT INTO blocked_dates (blocked_date, reason)
         VALUES (?, ?)`,
        [mysqlDate, reason || null]
    );

    logSecurityEvent('Blocked date added', {
        adminUsername: req.session.username,
        blocked_date: mysqlDate,
        reason: reason || 'No reason provided'
    });

    res.status(201).json({
        success: true,
        message: 'Η ημερομηνία αποκλείστηκε επιτυχώς.',
        data: {
            id: result.insertId,
            blocked_date: mysqlDate,
            reason: reason || null
        }
    });
}));

/**
 * DELETE /api/admin/availability/blocked-dates/:id
 * Remove a blocked date
 */
router.delete('/blocked-dates/:id', asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM blocked_dates WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: 'Η αποκλεισμένη ημερομηνία δεν βρέθηκε.'
        });
    }

    logSecurityEvent('Blocked date removed', {
        adminUsername: req.session.username,
        blockedDateId: id
    });

    res.json({
        success: true,
        message: 'Η ημερομηνία αφαιρέθηκε από τον αποκλεισμό.'
    });
}));

module.exports = router;
