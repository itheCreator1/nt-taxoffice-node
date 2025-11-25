/**
 * Timezone Utility
 * Handles all date/time operations in configured timezone (Europe/Athens)
 */

const moment = require('moment-timezone');
require('dotenv').config();

const TIMEZONE = process.env.TIMEZONE || 'Europe/Athens';
const BOOKING_WINDOW_DAYS = 60; // How far in advance can clients book
const MINIMUM_NOTICE_HOURS = 24; // Minimum notice required for booking

/**
 * Get current moment in configured timezone
 * @returns {moment.Moment}
 */
function now() {
    return moment.tz(TIMEZONE);
}

/**
 * Parse date string in timezone
 * @param {string} dateString - Date string to parse (YYYY-MM-DD)
 * @returns {moment.Moment}
 */
function parseDate(dateString) {
    return moment.tz(dateString, 'YYYY-MM-DD', TIMEZONE);
}

/**
 * Parse date and time in timezone
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @param {string} timeString - Time string (HH:mm:ss)
 * @returns {moment.Moment}
 */
function parseDateTime(dateString, timeString) {
    return moment.tz(`${dateString} ${timeString}`, 'YYYY-MM-DD HH:mm:ss', TIMEZONE);
}

/**
 * Format date for display (DD/MM/YYYY)
 * @param {moment.Moment|string|Date} date
 * @returns {string}
 */
function formatDate(date) {
    if (!date) return '';
    return moment.tz(date, TIMEZONE).format('DD/MM/YYYY');
}

/**
 * Format time for display (HH:mm)
 * @param {moment.Moment|string|Date} time
 * @returns {string}
 */
function formatTime(time) {
    if (!time) return '';
    return moment.tz(time, TIMEZONE).format('HH:mm');
}

/**
 * Format date and time for display
 * @param {moment.Moment|string|Date} datetime
 * @returns {string}
 */
function formatDateTime(datetime) {
    if (!datetime) return '';
    return moment.tz(datetime, TIMEZONE).format('DD/MM/YYYY HH:mm');
}

/**
 * Format date in Greek (e.g., "Δευτέρα 25 Δεκεμβρίου 2023")
 * @param {moment.Moment|string|Date} date
 * @returns {string}
 */
function formatGreekDate(date) {
    if (!date) return '';
    const m = moment.tz(date, TIMEZONE);
    const dayName = getGreekDayName(m.day());
    const monthName = getGreekMonthName(m.month());
    return `${dayName} ${m.date()} ${monthName} ${m.year()}`;
}

/**
 * Get Greek day name
 * @param {number} dayOfWeek - 0=Sunday, 6=Saturday
 * @returns {string}
 */
function getGreekDayName(dayOfWeek) {
    const greekDays = [
        'Κυριακή',    // Sunday
        'Δευτέρα',    // Monday
        'Τρίτη',      // Tuesday
        'Τετάρτη',    // Wednesday
        'Πέμπτη',     // Thursday
        'Παρασκευή',  // Friday
        'Σάββατο'     // Saturday
    ];
    return greekDays[dayOfWeek] || '';
}

/**
 * Get Greek month name
 * @param {number} month - 0=January, 11=December
 * @returns {string}
 */
function getGreekMonthName(month) {
    const greekMonths = [
        'Ιανουαρίου',   // January
        'Φεβρουαρίου',  // February
        'Μαρτίου',      // March
        'Απριλίου',     // April
        'Μαΐου',        // May
        'Ιουνίου',      // June
        'Ιουλίου',      // July
        'Αυγούστου',    // August
        'Σεπτεμβρίου',  // September
        'Οκτωβρίου',    // October
        'Νοεμβρίου',    // November
        'Δεκεμβρίου'    // December
    ];
    return greekMonths[month] || '';
}

/**
 * Convert to MySQL date format (YYYY-MM-DD)
 * @param {moment.Moment|string|Date} date
 * @returns {string}
 */
function toMySQLDate(date) {
    if (!date) return null;
    return moment.tz(date, TIMEZONE).format('YYYY-MM-DD');
}

/**
 * Convert to MySQL time format (HH:mm:ss)
 * @param {moment.Moment|string|Date} time
 * @returns {string}
 */
function toMySQLTime(time) {
    if (!time) return null;
    return moment.tz(time, TIMEZONE).format('HH:mm:ss');
}

/**
 * Convert to MySQL datetime format (YYYY-MM-DD HH:mm:ss)
 * @param {moment.Moment|string|Date} datetime
 * @returns {string}
 */
function toMySQLDateTime(datetime) {
    if (!datetime) return null;
    return moment.tz(datetime, TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Check if appointment date/time is in the past
 * @param {string} dateString - Date (YYYY-MM-DD)
 * @param {string} timeString - Time (HH:mm:ss)
 * @returns {boolean}
 */
function isInPast(dateString, timeString) {
    const appointmentDateTime = parseDateTime(dateString, timeString);
    return appointmentDateTime.isBefore(now());
}

/**
 * Check if date is beyond the booking window (60 days)
 * @param {string} dateString - Date (YYYY-MM-DD)
 * @returns {boolean}
 */
function isBeyondBookingWindow(dateString) {
    const appointmentDate = parseDate(dateString);
    const maxBookingDate = now().add(BOOKING_WINDOW_DAYS, 'days');
    return appointmentDate.isAfter(maxBookingDate);
}

/**
 * Check if appointment is within minimum notice period (24 hours)
 * @param {string} dateString - Date (YYYY-MM-DD)
 * @param {string} timeString - Time (HH:mm:ss)
 * @returns {boolean}
 */
function isWithinMinimumNotice(dateString, timeString) {
    const appointmentDateTime = parseDateTime(dateString, timeString);
    const minimumDateTime = now().add(MINIMUM_NOTICE_HOURS, 'hours');
    return appointmentDateTime.isBefore(minimumDateTime);
}

/**
 * Get start of day in timezone
 * @param {moment.Moment|string|Date} date
 * @returns {moment.Moment}
 */
function startOfDay(date) {
    return moment.tz(date, TIMEZONE).startOf('day');
}

/**
 * Get end of day in timezone
 * @param {moment.Moment|string|Date} date
 * @returns {moment.Moment}
 */
function endOfDay(date) {
    return moment.tz(date, TIMEZONE).endOf('day');
}

/**
 * Check if two dates are the same day
 * @param {moment.Moment|string|Date} date1
 * @param {moment.Moment|string|Date} date2
 * @returns {boolean}
 */
function isSameDay(date1, date2) {
    return moment.tz(date1, TIMEZONE).isSame(moment.tz(date2, TIMEZONE), 'day');
}

/**
 * Get day of week (0=Sunday, 6=Saturday)
 * @param {moment.Moment|string|Date} date
 * @returns {number}
 */
function getDayOfWeek(date) {
    return moment.tz(date, TIMEZONE).day();
}

/**
 * Add days to a date
 * @param {moment.Moment|string|Date} date
 * @param {number} days
 * @returns {moment.Moment}
 */
function addDays(date, days) {
    return moment.tz(date, TIMEZONE).add(days, 'days');
}

/**
 * Get current date as YYYY-MM-DD
 * @returns {string}
 */
function getCurrentDate() {
    return now().format('YYYY-MM-DD');
}

/**
 * Get current time as HH:mm:ss
 * @returns {string}
 */
function getCurrentTime() {
    return now().format('HH:mm:ss');
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateString
 * @returns {boolean}
 */
function isValidDate(dateString) {
    return moment(dateString, 'YYYY-MM-DD', true).isValid();
}

/**
 * Validate time format (HH:mm:ss or HH:mm)
 * @param {string} timeString
 * @returns {boolean}
 */
function isValidTime(timeString) {
    return moment(timeString, ['HH:mm:ss', 'HH:mm'], true).isValid();
}

module.exports = {
    // Constants
    TIMEZONE,
    BOOKING_WINDOW_DAYS,
    MINIMUM_NOTICE_HOURS,

    // Core functions
    now,
    parseDate,
    parseDateTime,

    // Formatting
    formatDate,
    formatTime,
    formatDateTime,
    formatGreekDate,
    getGreekDayName,
    getGreekMonthName,

    // MySQL conversion
    toMySQLDate,
    toMySQLTime,
    toMySQLDateTime,

    // Validation & checks
    isInPast,
    isBeyondBookingWindow,
    isWithinMinimumNotice,
    isValidDate,
    isValidTime,

    // Date manipulation
    startOfDay,
    endOfDay,
    isSameDay,
    getDayOfWeek,
    addDays,

    // Current values
    getCurrentDate,
    getCurrentTime
};
