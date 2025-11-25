/**
 * Sanitization Utility
 * Functions for sanitizing user input to prevent XSS and injection attacks
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    if (typeof str !== 'string') return '';

    const htmlEscapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };

    return str.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * Sanitize string by trimming and removing control characters
 * @param {string} str
 * @returns {string}
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return '';

    // Trim whitespace
    let sanitized = str.trim();

    // Remove control characters (except newlines and tabs for notes/descriptions)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized;
}

/**
 * Sanitize name (person or business)
 * Allows Greek and English letters, spaces, hyphens, apostrophes
 * @param {string} name
 * @returns {string}
 */
function sanitizeName(name) {
    if (typeof name !== 'string') return '';

    // Trim and remove control characters
    let sanitized = sanitizeString(name);

    // Remove any characters that are not Greek letters, English letters, spaces, hyphens, or apostrophes
    sanitized = sanitized.replace(/[^Α-Ωα-ωA-Za-z\s\-']/g, '');

    // Replace multiple spaces with single space
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Limit length
    if (sanitized.length > 255) {
        sanitized = sanitized.substring(0, 255);
    }

    return sanitized.trim();
}

/**
 * Sanitize email address
 * @param {string} email
 * @returns {string}
 */
function sanitizeEmail(email) {
    if (typeof email !== 'string') return '';

    // Convert to lowercase and trim
    let sanitized = email.toLowerCase().trim();

    // Remove any whitespace
    sanitized = sanitized.replace(/\s/g, '');

    // Limit length
    if (sanitized.length > 255) {
        sanitized = sanitized.substring(0, 255);
    }

    return sanitized;
}

/**
 * Sanitize phone number
 * Removes spaces, dashes, parentheses but keeps + sign
 * @param {string} phone
 * @returns {string}
 */
function sanitizePhone(phone) {
    if (typeof phone !== 'string') return '';

    // Remove spaces, dashes, parentheses
    let sanitized = phone.replace(/[\s\-\(\)]/g, '');

    // Keep only digits and + sign at the beginning
    sanitized = sanitized.replace(/[^\d+]/g, '');

    // Ensure + is only at the beginning
    if (sanitized.includes('+')) {
        const hasLeadingPlus = sanitized.startsWith('+');
        sanitized = sanitized.replace(/\+/g, '');
        if (hasLeadingPlus) {
            sanitized = '+' + sanitized;
        }
    }

    // Limit length
    if (sanitized.length > 50) {
        sanitized = sanitized.substring(0, 50);
    }

    return sanitized;
}

/**
 * Sanitize notes/comments field
 * Preserves newlines but removes potentially dangerous content
 * @param {string} notes
 * @returns {string}
 */
function sanitizeNotes(notes) {
    if (typeof notes !== 'string') return '';

    // Trim and remove control characters except newlines
    let sanitized = notes.trim();
    sanitized = sanitized.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Replace multiple newlines with maximum of 2
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

    // Replace multiple spaces with single space
    sanitized = sanitized.replace(/[^\S\n]+/g, ' ');

    // Limit length
    if (sanitized.length > 1000) {
        sanitized = sanitized.substring(0, 1000);
    }

    return sanitized.trim();
}

/**
 * Sanitize decline reason
 * Similar to notes but with stricter length limit
 * @param {string} reason
 * @returns {string}
 */
function sanitizeDeclineReason(reason) {
    if (typeof reason !== 'string') return '';

    // Use same logic as notes
    let sanitized = sanitizeNotes(reason);

    // Stricter length limit
    if (sanitized.length > 500) {
        sanitized = sanitized.substring(0, 500);
    }

    return sanitized;
}

/**
 * Sanitize username
 * Only allows alphanumeric and underscore
 * @param {string} username
 * @returns {string}
 */
function sanitizeUsername(username) {
    if (typeof username !== 'string') return '';

    // Trim and convert to lowercase
    let sanitized = username.trim().toLowerCase();

    // Keep only alphanumeric and underscore
    sanitized = sanitized.replace(/[^a-z0-9_]/g, '');

    // Limit length
    if (sanitized.length > 50) {
        sanitized = sanitized.substring(0, 50);
    }

    return sanitized;
}

/**
 * Sanitize appointment booking request
 * @param {object} data
 * @returns {object}
 */
function sanitizeBookingRequest(data) {
    return {
        client_name: sanitizeName(data.client_name || ''),
        client_email: sanitizeEmail(data.client_email || ''),
        client_phone: sanitizePhone(data.client_phone || ''),
        appointment_date: sanitizeString(data.appointment_date || ''),
        appointment_time: sanitizeString(data.appointment_time || ''),
        service_type: sanitizeString(data.service_type || ''),
        notes: sanitizeNotes(data.notes || '')
    };
}

/**
 * Sanitize admin credentials
 * @param {object} data
 * @returns {object}
 */
function sanitizeAdminCredentials(data) {
    return {
        username: sanitizeUsername(data.username || ''),
        email: sanitizeEmail(data.email || ''),
        password: data.password || '' // Don't sanitize password, just pass through
    };
}

/**
 * Sanitize availability settings
 * @param {object} data
 * @returns {object}
 */
function sanitizeAvailabilitySettings(data) {
    return {
        day_of_week: parseInt(data.day_of_week, 10) || 0,
        is_working_day: Boolean(data.is_working_day),
        start_time: sanitizeString(data.start_time || ''),
        end_time: sanitizeString(data.end_time || '')
    };
}

/**
 * Sanitize blocked date
 * @param {object} data
 * @returns {object}
 */
function sanitizeBlockedDate(data) {
    return {
        blocked_date: sanitizeString(data.blocked_date || ''),
        reason: sanitizeString(data.reason || '')
    };
}

/**
 * Remove SQL special characters (additional protection beyond parameterized queries)
 * @param {string} str
 * @returns {string}
 */
function sanitizeSql(str) {
    if (typeof str !== 'string') return '';

    // Remove SQL comment sequences
    let sanitized = str.replace(/--/g, '');
    sanitized = sanitized.replace(/\/\*/g, '');
    sanitized = sanitized.replace(/\*\//g, '');

    // Remove semicolons (statement separators)
    sanitized = sanitized.replace(/;/g, '');

    return sanitized;
}

/**
 * Strip all HTML tags from string
 * @param {string} str
 * @returns {string}
 */
function stripHtmlTags(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize for safe display in HTML context
 * Combines escaping and tag stripping
 * @param {string} str
 * @returns {string}
 */
function sanitizeForDisplay(str) {
    if (typeof str !== 'string') return '';

    // First strip any existing HTML tags
    let sanitized = stripHtmlTags(str);

    // Then escape HTML special characters
    sanitized = escapeHtml(sanitized);

    return sanitized;
}

/**
 * Validate and sanitize integer
 * @param {any} value
 * @param {number} defaultValue
 * @returns {number}
 */
function sanitizeInteger(value, defaultValue = 0) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validate and sanitize boolean
 * @param {any} value
 * @returns {boolean}
 */
function sanitizeBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const lower = value.toLowerCase();
        return lower === 'true' || lower === '1' || lower === 'yes';
    }
    if (typeof value === 'number') return value !== 0;
    return false;
}

module.exports = {
    // Basic sanitization
    escapeHtml,
    sanitizeString,
    stripHtmlTags,
    sanitizeForDisplay,

    // Field-specific sanitization
    sanitizeName,
    sanitizeEmail,
    sanitizePhone,
    sanitizeNotes,
    sanitizeDeclineReason,
    sanitizeUsername,

    // Complex object sanitization
    sanitizeBookingRequest,
    sanitizeAdminCredentials,
    sanitizeAvailabilitySettings,
    sanitizeBlockedDate,

    // Additional security
    sanitizeSql,

    // Type conversion
    sanitizeInteger,
    sanitizeBoolean
};
