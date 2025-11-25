/**
 * Availability API Routes
 * Public endpoints for checking appointment availability
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../middleware/errorHandler');
const {
    getAvailableDatesAndSlots,
    getAvailableSlotsForDate,
    isSlotAvailable,
    getNextAvailableSlot
} = require('../../services/availability');
const { validateAppointmentDate } = require('../../utils/validation');

/**
 * GET /api/availability/dates
 * Get all available dates with their time slots for the booking window
 */
router.get('/dates', asyncHandler(async (req, res) => {
    const availability = await getAvailableDatesAndSlots();

    res.json({
        success: true,
        data: availability,
        count: availability.length
    });
}));

/**
 * GET /api/availability/slots/:date
 * Get available time slots for a specific date
 */
router.get('/slots/:date', asyncHandler(async (req, res) => {
    const { date } = req.params;

    // Validate date format
    const validation = validateAppointmentDate(date);
    if (!validation.valid) {
        return res.status(400).json({
            success: false,
            message: validation.error
        });
    }

    const slots = await getAvailableSlotsForDate(date);

    res.json({
        success: true,
        data: {
            date,
            slots
        },
        count: slots.length
    });
}));

/**
 * POST /api/availability/check
 * Check if a specific date and time slot is available
 * Body: { date, time }
 */
router.post('/check', asyncHandler(async (req, res) => {
    const { date, time } = req.body;

    // Validate date
    const dateValidation = validateAppointmentDate(date);
    if (!dateValidation.valid) {
        return res.status(400).json({
            success: false,
            message: dateValidation.error
        });
    }

    // Check if time is provided
    if (!time) {
        return res.status(400).json({
            success: false,
            message: 'Παρακαλώ καθορίστε ώρα.'
        });
    }

    const available = await isSlotAvailable(date, time);

    res.json({
        success: true,
        data: {
            date,
            time,
            available
        }
    });
}));

/**
 * GET /api/availability/next
 * Get the next available appointment slot
 */
router.get('/next', asyncHandler(async (req, res) => {
    const nextSlot = await getNextAvailableSlot();

    if (!nextSlot) {
        return res.json({
            success: true,
            data: null,
            message: 'Δεν υπάρχουν διαθέσιμες θέσεις αυτή τη στιγμή.'
        });
    }

    res.json({
        success: true,
        data: nextSlot
    });
}));

module.exports = router;
