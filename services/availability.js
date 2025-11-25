/**
 * Availability Service
 * Calculate available appointment slots based on business hours, blocked dates, and existing appointments
 */

const { getDb } = require('./database');
const {
    parseDate,
    addDays,
    getDayOfWeek,
    toMySQLDate,
    getCurrentDate,
    BOOKING_WINDOW_DAYS
} = require('../utils/timezone');
const { debug } = require('../utils/logger');

// Appointment slot duration in minutes
const SLOT_DURATION = 60; // 1 hour slots

/**
 * Get availability settings for all days of the week
 * @returns {Promise<Array>}
 */
async function getAvailabilitySettings() {
    const db = getDb();
    const [rows] = await db.query(
        'SELECT day_of_week, is_working_day, start_time, end_time FROM availability_settings ORDER BY day_of_week'
    );
    return rows;
}

/**
 * Get availability settings for a specific day of week
 * @param {number} dayOfWeek - 0=Sunday, 6=Saturday
 * @returns {Promise<object|null>}
 */
async function getAvailabilityForDay(dayOfWeek) {
    const db = getDb();
    const [rows] = await db.query(
        'SELECT day_of_week, is_working_day, start_time, end_time FROM availability_settings WHERE day_of_week = ?',
        [dayOfWeek]
    );
    return rows[0] || null;
}

/**
 * Get all blocked dates (holidays, closures)
 * @returns {Promise<Array>}
 */
async function getBlockedDates() {
    const db = getDb();
    const [rows] = await db.query(
        'SELECT blocked_date, reason FROM blocked_dates WHERE deleted_at IS NULL ORDER BY blocked_date'
    );
    return rows;
}

/**
 * Check if a date is blocked
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<boolean>}
 */
async function isDateBlocked(date) {
    const db = getDb();
    const [rows] = await db.query(
        'SELECT id FROM blocked_dates WHERE blocked_date = ? AND deleted_at IS NULL',
        [date]
    );
    return rows.length > 0;
}

/**
 * Get booked appointment times for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} - Array of time strings (HH:mm:ss)
 */
async function getBookedTimesForDate(date) {
    const db = getDb();
    const [rows] = await db.query(
        `SELECT appointment_time
         FROM appointments
         WHERE appointment_date = ?
         AND status IN ('pending', 'confirmed')
         ORDER BY appointment_time`,
        [date]
    );
    return rows.map(row => row.appointment_time);
}

/**
 * Generate time slots for a given time range
 * @param {string} startTime - Start time (HH:mm:ss)
 * @param {string} endTime - End time (HH:mm:ss)
 * @returns {Array} - Array of time slot strings (HH:mm:ss)
 */
function generateTimeSlots(startTime, endTime) {
    const slots = [];

    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (true) {
        // Format current time
        const timeSlot = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;

        // Check if we've reached or passed the end time
        if (currentHour > endHour || (currentHour === endHour && currentMinute >= endMinute)) {
            break;
        }

        slots.push(timeSlot);

        // Add slot duration
        currentMinute += SLOT_DURATION;
        if (currentMinute >= 60) {
            currentHour += Math.floor(currentMinute / 60);
            currentMinute = currentMinute % 60;
        }
    }

    return slots;
}

/**
 * Get available slots for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} - Array of available time slots
 */
async function getAvailableSlotsForDate(date) {
    // Check if date is blocked
    const blocked = await isDateBlocked(date);
    if (blocked) {
        return [];
    }

    // Get day of week
    const dayOfWeek = getDayOfWeek(date);

    // Get availability settings for this day
    const settings = await getAvailabilityForDay(dayOfWeek);

    // If not a working day, return empty array
    if (!settings || !settings.is_working_day) {
        return [];
    }

    // Generate all possible time slots for this day
    const allSlots = generateTimeSlots(settings.start_time, settings.end_time);

    // Get already booked times
    const bookedTimes = await getBookedTimesForDate(date);

    // Filter out booked slots
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    debug('Available slots calculated', {
        date,
        dayOfWeek,
        totalSlots: allSlots.length,
        bookedSlots: bookedTimes.length,
        availableSlots: availableSlots.length
    });

    return availableSlots;
}

/**
 * Get available dates and slots for the next N days
 * @param {number} days - Number of days to look ahead (default: BOOKING_WINDOW_DAYS)
 * @returns {Promise<Array>} - Array of objects with date and available slots
 */
async function getAvailableDatesAndSlots(days = BOOKING_WINDOW_DAYS) {
    const availability = [];
    const today = parseDate(getCurrentDate());

    for (let i = 0; i < days; i++) {
        const date = addDays(today, i);
        const dateStr = toMySQLDate(date);

        const slots = await getAvailableSlotsForDate(dateStr);

        if (slots.length > 0) {
            availability.push({
                date: dateStr,
                dayOfWeek: getDayOfWeek(date),
                availableSlots: slots
            });
        }
    }

    return availability;
}

/**
 * Check if a specific date and time is available
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:mm:ss format
 * @returns {Promise<boolean>}
 */
async function isSlotAvailable(date, time) {
    const availableSlots = await getAvailableSlotsForDate(date);
    return availableSlots.includes(time);
}

/**
 * Get next available appointment slot
 * @returns {Promise<object|null>} - {date, time} or null if no slots available
 */
async function getNextAvailableSlot() {
    const today = parseDate(getCurrentDate());

    for (let i = 0; i < BOOKING_WINDOW_DAYS; i++) {
        const date = addDays(today, i);
        const dateStr = toMySQLDate(date);

        const slots = await getAvailableSlotsForDate(dateStr);

        if (slots.length > 0) {
            return {
                date: dateStr,
                time: slots[0]
            };
        }
    }

    return null;
}

/**
 * Get availability statistics
 * @returns {Promise<object>}
 */
async function getAvailabilityStats() {
    const today = parseDate(getCurrentDate());
    let totalSlots = 0;
    let availableSlots = 0;
    let bookedSlots = 0;

    for (let i = 0; i < BOOKING_WINDOW_DAYS; i++) {
        const date = addDays(today, i);
        const dateStr = toMySQLDate(date);

        // Check if date is blocked
        if (await isDateBlocked(dateStr)) {
            continue;
        }

        // Get day of week
        const dayOfWeek = getDayOfWeek(date);
        const settings = await getAvailabilityForDay(dayOfWeek);

        if (!settings || !settings.is_working_day) {
            continue;
        }

        // Count slots for this day
        const allSlots = generateTimeSlots(settings.start_time, settings.end_time);
        const bookedTimes = await getBookedTimesForDate(dateStr);

        totalSlots += allSlots.length;
        bookedSlots += bookedTimes.length;
        availableSlots += (allSlots.length - bookedTimes.length);
    }

    return {
        totalSlots,
        availableSlots,
        bookedSlots,
        utilizationRate: totalSlots > 0 ? ((bookedSlots / totalSlots) * 100).toFixed(2) : 0
    };
}

module.exports = {
    // Settings
    getAvailabilitySettings,
    getAvailabilityForDay,

    // Blocked dates
    getBlockedDates,
    isDateBlocked,

    // Slot availability
    getAvailableSlotsForDate,
    getAvailableDatesAndSlots,
    isSlotAvailable,
    getNextAvailableSlot,

    // Booked times
    getBookedTimesForDate,

    // Stats
    getAvailabilityStats,

    // Utilities
    generateTimeSlots,
    SLOT_DURATION
};
