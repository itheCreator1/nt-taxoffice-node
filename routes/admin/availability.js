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
 * Get current availability settings
 */
router.get('/settings', asyncHandler(async (req, res) => {
    const db = getDb();

    const [settings] = await db.query(
        'SELECT * FROM availability_settings ORDER BY id DESC LIMIT 1'
    );

    if (settings.length === 0) {
        // Return default settings
        return res.json({
            success: true,
            data: {
                office_hours_start: '09:00:00',
                office_hours_end: '17:00:00',
                slot_duration: 60,
                working_days: 'monday,tuesday,wednesday,thursday,friday'
            }
        });
    }

    res.json({
        success: true,
        data: settings[0]
    });
}));

/**
 * PUT /api/admin/availability/settings
 * Update availability settings
 */
router.put('/settings', asyncHandler(async (req, res) => {
    const db = getDb();
    const { office_hours_start, office_hours_end, slot_duration, working_days } = req.body;

    // Validation
    if (!office_hours_start || !office_hours_end || !slot_duration || !working_days) {
        return res.status(400).json({
            success: false,
            message: 'Όλα τα πεδία είναι υποχρεωτικά.'
        });
    }

    // Validate slot duration
    if (slot_duration < 15 || slot_duration > 240) {
        return res.status(400).json({
            success: false,
            message: 'Η διάρκεια ραντεβού πρέπει να είναι μεταξύ 15 και 240 λεπτών.'
        });
    }

    // Check if settings exist
    const [existing] = await db.query('SELECT id FROM availability_settings LIMIT 1');

    if (existing.length === 0) {
        // Insert new settings
        await db.query(
            `INSERT INTO availability_settings
             (office_hours_start, office_hours_end, slot_duration, working_days)
             VALUES (?, ?, ?, ?)`,
            [office_hours_start, office_hours_end, slot_duration, working_days]
        );
    } else {
        // Update existing settings
        await db.query(
            `UPDATE availability_settings
             SET office_hours_start = ?, office_hours_end = ?,
                 slot_duration = ?, working_days = ?
             WHERE id = ?`,
            [office_hours_start, office_hours_end, slot_duration, working_days, existing[0].id]
        );
    }

    logSecurityEvent('Availability settings updated', {
        adminUsername: req.session.username,
        office_hours: `${office_hours_start} - ${office_hours_end}`,
        slot_duration
    });

    res.json({
        success: true,
        message: 'Οι ρυθμίσεις διαθεσιμότητας ενημερώθηκαν επιτυχώς.'
    });
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
