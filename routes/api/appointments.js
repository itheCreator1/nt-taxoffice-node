/**
 * Appointments API Routes
 * Public endpoints for booking and managing appointments
 */

const express = require('express');

const router = express.Router();
const { asyncHandler, conflict, notFound, badRequest } = require('../../middleware/errorHandler');
const { bookingLimiter, cancellationLimiter } = require('../../middleware/rateLimiter');
const {
  createAppointment,
  getAppointmentByToken,
  cancelAppointment,
} = require('../../services/appointments');
const { isSlotAvailable } = require('../../services/availability');
const { validateBookingRequest } = require('../../utils/validation');
const { sanitizeBookingRequest } = require('../../utils/sanitization');

/**
 * POST /api/appointments/book
 * Create a new appointment booking
 * Rate limited to prevent spam
 */
router.post(
  '/book',
  bookingLimiter,
  asyncHandler(async (req, res) => {
    // Sanitize input
    const sanitized = sanitizeBookingRequest(req.body);

    // Validate input
    const validation = validateBookingRequest(sanitized);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Μη έγκυρα δεδομένα.',
        errors: validation.errors,
      });
    }

    // Double-check slot availability
    const available = await isSlotAvailable(sanitized.appointment_date, sanitized.appointment_time);

    if (!available) {
      throw conflict(
        'Αυτή η χρονική υποδοχή δεν είναι πλέον διαθέσιμη. Παρακαλώ επιλέξτε άλλη ώρα.'
      );
    }

    // Create appointment
    try {
      const appointment = await createAppointment(sanitized);

      res.status(201).json({
        success: true,
        message: 'Το ραντεβού σας δημιουργήθηκε επιτυχώς! Θα λάβετε email επιβεβαίωσης σύντομα.',
        data: {
          id: appointment.id,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          service_type: appointment.service_type,
          status: appointment.status,
          cancellation_token: appointment.cancellation_token,
        },
      });
    } catch (error) {
      // Handle race condition
      if (error.message === 'SLOT_ALREADY_BOOKED') {
        throw conflict(
          'Αυτή η χρονική υποδοχή μόλις κρατήθηκε από άλλον χρήστη. Παρακαλώ επιλέξτε άλλη ώρα.'
        );
      }
      throw error;
    }
  })
);

/**
 * GET /api/appointments/:token
 * Get appointment details by cancellation token
 */
router.get(
  '/:token',
  asyncHandler(async (req, res) => {
    const { token } = req.params;

    if (!token || token.length !== 36) {
      throw badRequest('Μη έγκυρο token ακύρωσης.');
    }

    const appointment = await getAppointmentByToken(token);

    if (!appointment) {
      throw notFound('Το ραντεβού δεν βρέθηκε.');
    }

    // Return safe subset of appointment data
    res.json({
      success: true,
      data: {
        id: appointment.id,
        client_name: appointment.client_name,
        client_email: appointment.client_email,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        service_type: appointment.service_type,
        status: appointment.status,
        decline_reason: appointment.decline_reason,
        created_at: appointment.created_at,
      },
    });
  })
);

/**
 * POST /api/appointments/:token/cancel
 * Cancel an appointment using cancellation token
 * Rate limited to prevent abuse
 */
router.post(
  '/:token/cancel',
  cancellationLimiter,
  asyncHandler(async (req, res) => {
    const { token } = req.params;

    if (!token || token.length !== 36) {
      throw badRequest('Μη έγκυρο token ακύρωσης.');
    }

    try {
      const appointment = await cancelAppointment(token);

      res.json({
        success: true,
        message: 'Το ραντεβού σας ακυρώθηκε επιτυχώς.',
        data: {
          id: appointment.id,
          status: appointment.status,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
        },
      });
    } catch (error) {
      if (error.message === 'APPOINTMENT_NOT_FOUND') {
        throw notFound('Το ραντεβού δεν βρέθηκε.');
      }
      if (error.message === 'ALREADY_CANCELLED') {
        throw badRequest('Το ραντεβού έχει ήδη ακυρωθεί.');
      }
      if (error.message === 'CANNOT_CANCEL') {
        throw badRequest('Αυτό το ραντεβού δεν μπορεί να ακυρωθεί.');
      }
      if (error.message === 'CONCURRENT_MODIFICATION') {
        throw conflict('Το ραντεβού τροποποιήθηκε από άλλον χρήστη. Παρακαλώ δοκιμάστε ξανά.');
      }
      throw error;
    }
  })
);

module.exports = router;
