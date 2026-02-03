/**
 * Admin Appointments Routes
 * Protected routes for managing appointments
 */

const express = require('express');

const router = express.Router();
const { asyncHandler } = require('../../middleware/errorHandler');
const { requireAuth } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimiter');
const { getDb } = require('../../services/database');
const { toMySQLDate, formatGreekDate, formatGreekDateTime } = require('../../utils/timezone');
const { logAppointmentStatusChange, logSecurityEvent, warn } = require('../../utils/logger');
const { queueEmail } = require('../../services/emailQueue');

// Apply authentication to all routes
router.use(requireAuth);
router.use(apiLimiter);

/**
 * GET /api/admin/appointments
 * Get all appointments with filtering and pagination
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const db = getDb();
    const {
      status,
      startDate,
      endDate,
      search,
      sortBy = 'appointment_date',
      sortOrder = 'DESC',
    } = req.query;

    // Validate and sanitize pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (startDate) {
      conditions.push('appointment_date >= ?');
      params.push(toMySQLDate(startDate));
    }

    if (endDate) {
      conditions.push('appointment_date <= ?');
      params.push(toMySQLDate(endDate));
    }

    if (search) {
      conditions.push('(client_name LIKE ? OR client_email LIKE ? OR client_phone LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort fields
    const allowedSortFields = [
      'appointment_date',
      'appointment_time',
      'created_at',
      'status',
      'client_name',
    ];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'appointment_date';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM appointments ${whereClause}`,
      params
    );
    const { total } = countResult[0];

    // Get appointments
    const [appointments] = await db.query(
      `SELECT id, client_name, client_email, client_phone,
                appointment_date, appointment_time, service_type,
                notes, status, decline_reason, cancellation_token,
                created_at, updated_at
         FROM appointments
         ${whereClause}
         ORDER BY ${safeSortBy} ${safeSortOrder}, appointment_time ${safeSortOrder}
         LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Format dates to YYYY-MM-DD for consistent API response
    const formattedAppointments = appointments.map((apt) => ({
      ...apt,
      appointment_date: toMySQLDate(apt.appointment_date),
    }));

    res.json({
      success: true,
      data: {
        appointments: formattedAppointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  })
);

/**
 * GET /api/admin/appointments/stats
 * Get appointment statistics
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const db = getDb();

    // Get counts by status
    const [statusCounts] = await db.query(`
        SELECT status, COUNT(*) as count
        FROM appointments
        GROUP BY status
    `);

    // Get upcoming appointments count (next 7 days)
    const [upcomingCount] = await db.query(`
        SELECT COUNT(*) as count
        FROM appointments
        WHERE appointment_date >= CURDATE()
        AND appointment_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        AND status IN ('pending', 'confirmed')
    `);

    // Get today's appointments count
    const [todayCount] = await db.query(`
        SELECT COUNT(*) as count
        FROM appointments
        WHERE appointment_date = CURDATE()
        AND status IN ('pending', 'confirmed')
    `);

    // Get this month's appointments count
    const [monthCount] = await db.query(`
        SELECT COUNT(*) as count
        FROM appointments
        WHERE YEAR(appointment_date) = YEAR(CURDATE())
        AND MONTH(appointment_date) = MONTH(CURDATE())
    `);

    res.json({
      success: true,
      data: {
        statusCounts: statusCounts.reduce((acc, row) => {
          acc[row.status] = row.count;
          return acc;
        }, {}),
        upcomingCount: upcomingCount[0].count,
        todayCount: todayCount[0].count,
        monthCount: monthCount[0].count,
      },
    });
  })
);

/**
 * GET /api/admin/appointments/:id
 * Get single appointment details
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;

    const [appointments] = await db.query(`SELECT * FROM appointments WHERE id = ?`, [id]);

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Το ραντεβού δεν βρέθηκε.',
      });
    }

    // Get appointment history
    const [history] = await db.query(
      `SELECT * FROM appointment_history
         WHERE appointment_id = ?
         ORDER BY changed_at DESC`,
      [id]
    );

    // Format appointment date
    const appointment = {
      ...appointments[0],
      appointment_date: toMySQLDate(appointments[0].appointment_date),
    };

    res.json({
      success: true,
      data: {
        appointment,
        history,
      },
    });
  })
);

/**
 * PUT /api/admin/appointments/:id/status
 * Update appointment status (confirm, decline, complete)
 */
router.put(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const db = getDb();
    const connection = await db.getConnection();
    const { id } = req.params;
    const { status, decline_reason } = req.body;

    // Validate status
    const validStatuses = ['confirmed', 'declined', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Μη έγκυρη κατάσταση ραντεβού.',
      });
    }

    // Validate decline reason if declining
    if (status === 'declined' && !decline_reason) {
      return res.status(400).json({
        success: false,
        message: 'Παρακαλώ παρέχετε λόγο απόρριψης.',
      });
    }

    try {
      await connection.beginTransaction();

      // Get current appointment
      const [appointments] = await connection.query(
        'SELECT * FROM appointments WHERE id = ? FOR UPDATE',
        [id]
      );

      if (appointments.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Το ραντεβού δεν βρέθηκε.',
        });
      }

      const appointment = appointments[0];
      const oldStatus = appointment.status;

      // Don't allow status change if already cancelled
      if (oldStatus === 'cancelled') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Δεν είναι δυνατή η αλλαγή κατάστασης ακυρωμένου ραντεβού.',
        });
      }

      // Update appointment
      await connection.query(
        `UPDATE appointments
             SET status = ?, decline_reason = ?, version = version + 1
             WHERE id = ? AND version = ?`,
        [status, decline_reason || null, id, appointment.version]
      );

      // Record in history
      await connection.query(
        `INSERT INTO appointment_history
             (appointment_id, old_status, new_status, changed_by, changed_at, notes)
             VALUES (?, ?, ?, 'admin', NOW(), ?)`,
        [id, oldStatus, status, decline_reason || null]
      );

      await connection.commit();

      logAppointmentStatusChange(id, oldStatus, status, req.session.username);

      // Queue email notification based on new status (async, non-blocking)
      if (status === 'confirmed') {
        queueEmail('appointment-confirmed', appointment.client_email, appointment).catch((err) => {
          warn('Failed to queue appointment confirmed email:', {
            error: err.message,
            email: appointment.client_email,
          });
        });
      } else if (status === 'declined') {
        queueEmail('appointment-declined', appointment.client_email, {
          ...appointment,
          decline_reason,
        }).catch((err) => {
          warn('Failed to queue appointment declined email:', {
            error: err.message,
            email: appointment.client_email,
          });
        });
      }

      res.json({
        success: true,
        message: 'Η κατάσταση του ραντεβού ενημερώθηκε επιτυχώς.',
        data: {
          id,
          oldStatus,
          newStatus: status,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

/**
 * PUT /api/admin/appointments/:id
 * Update appointment details (date, time, client info)
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const db = getDb();
    const connection = await db.getConnection();
    const { id } = req.params;
    const {
      appointment_date,
      appointment_time,
      client_name,
      client_email,
      client_phone,
      service_type,
      notes,
    } = req.body;

    try {
      await connection.beginTransaction();

      // Get current appointment
      const [appointments] = await connection.query(
        'SELECT * FROM appointments WHERE id = ? FOR UPDATE',
        [id]
      );

      if (appointments.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Το ραντεβού δεν βρέθηκε.',
        });
      }

      const appointment = appointments[0];

      // If changing date/time, check if new slot is available
      if (appointment_date || appointment_time) {
        const newDate = appointment_date
          ? toMySQLDate(appointment_date)
          : appointment.appointment_date;
        const newTime = appointment_time || appointment.appointment_time;

        // Check if slot is available (excluding current appointment)
        const [conflicting] = await connection.query(
          `SELECT id FROM appointments
                 WHERE appointment_date = ?
                 AND appointment_time = ?
                 AND status IN ('pending', 'confirmed')
                 AND id != ?`,
          [newDate, newTime, id]
        );

        if (conflicting.length > 0) {
          await connection.rollback();
          return res.status(409).json({
            success: false,
            message: 'Η επιλεγμένη χρονική υποδοχή δεν είναι διαθέσιμη.',
          });
        }
      }

      // Build update query
      const updates = [];
      const params = [];

      if (appointment_date) {
        updates.push('appointment_date = ?');
        params.push(toMySQLDate(appointment_date));
      }
      if (appointment_time) {
        updates.push('appointment_time = ?');
        params.push(appointment_time);
      }
      if (client_name) {
        updates.push('client_name = ?');
        params.push(client_name);
      }
      if (client_email) {
        updates.push('client_email = ?');
        params.push(client_email);
      }
      if (client_phone) {
        updates.push('client_phone = ?');
        params.push(client_phone);
      }
      if (service_type) {
        updates.push('service_type = ?');
        params.push(service_type);
      }
      if (notes !== undefined) {
        updates.push('notes = ?');
        params.push(notes || null);
      }

      if (updates.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Δεν υπάρχουν αλλαγές για ενημέρωση.',
        });
      }

      updates.push('version = version + 1');
      params.push(id, appointment.version);

      await connection.query(
        `UPDATE appointments SET ${updates.join(', ')} WHERE id = ? AND version = ?`,
        params
      );

      await connection.commit();

      logSecurityEvent('Appointment updated by admin', {
        appointmentId: id,
        adminUsername: req.session.username,
      });

      res.json({
        success: true,
        message: 'Το ραντεβού ενημερώθηκε επιτυχώς.',
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

/**
 * DELETE /api/admin/appointments/:id
 * Delete appointment (admin only - hard delete for GDPR compliance)
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const db = getDb();
    const { id } = req.params;

    // Delete appointment history first (foreign key constraint)
    await db.query('DELETE FROM appointment_history WHERE appointment_id = ?', [id]);

    // Delete appointment
    const [result] = await db.query('DELETE FROM appointments WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Το ραντεβού δεν βρέθηκε.',
      });
    }

    logSecurityEvent('Appointment deleted by admin', {
      appointmentId: id,
      adminUsername: req.session.username,
    });

    res.json({
      success: true,
      message: 'Το ραντεβού διαγράφηκε επιτυχώς.',
    });
  })
);

module.exports = router;
