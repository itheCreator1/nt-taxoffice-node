/**
 * Validation Utility
 * Input validation functions for appointments system
 */

const {
  isValidDate,
  isValidTime,
  isInPast,
  isBeyondBookingWindow,
  isWithinMinimumNotice,
} = require('./timezone');

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;

  // RFC 5322 compliant email regex (simplified)
  const emailRegex =
    // eslint-disable-next-line max-len
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate Greek phone number
 * Accepts formats: +30XXXXXXXXXX, 30XXXXXXXXXX, XXXXXXXXXX, XXX XXX XXXX
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;

  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Greek phone patterns
  // Mobile: +306XXXXXXXXX or 6XXXXXXXXX (10 digits starting with 6)
  // Landline: +302XXXXXXXXX or 2XXXXXXXXX (10 digits starting with 2)
  const greekMobileRegex = /^(\+30|30)?6\d{9}$/;
  const greekLandlineRegex = /^(\+30|30)?2\d{9}$/;

  return greekMobileRegex.test(cleaned) || greekLandlineRegex.test(cleaned);
}

/**
 * Validate person name (Greek and English letters)
 * @param {string} name
 * @returns {boolean}
 */
function isValidName(name) {
  if (!name || typeof name !== 'string') return false;

  const trimmed = name.trim();

  // Must be 2-255 characters
  if (trimmed.length < 2 || trimmed.length > 255) return false;

  // Allow Greek letters, English letters, spaces, hyphens, apostrophes
  const nameRegex = /^[Α-Ωα-ωA-Za-z\s\-']+$/;

  return nameRegex.test(trimmed);
}

/**
 * Validate service type
 * @param {string} serviceType
 * @returns {boolean}
 */
function isValidServiceType(serviceType) {
  const validServices = [
    'Φορολογική Δήλωση',
    'Λογιστική Υποστήριξη',
    'Έναρξη Επιχείρησης',
    'Μισθοδοσία',
    'Γενική Συμβουλευτική',
  ];

  return validServices.includes(serviceType);
}

/**
 * Validate appointment status
 * @param {string} status
 * @returns {boolean}
 */
function isValidStatus(status) {
  const validStatuses = ['pending', 'confirmed', 'declined', 'cancelled', 'completed'];
  return validStatuses.includes(status);
}

/**
 * Validate appointment date
 * @param {string} dateString - YYYY-MM-DD format
 * @returns {object} { valid: boolean, error: string }
 */
function validateAppointmentDate(dateString) {
  // Check format
  if (!isValidDate(dateString)) {
    return {
      valid: false,
      error: 'Μη έγκυρη μορφή ημερομηνίας. Χρησιμοποιήστε YYYY-MM-DD.',
    };
  }

  // Check if beyond booking window (60 days)
  if (isBeyondBookingWindow(dateString)) {
    return {
      valid: false,
      error: 'Η ημερομηνία ξεπερνά το όριο κράτησης των 60 ημερών.',
    };
  }

  return { valid: true };
}

/**
 * Validate appointment time
 * @param {string} timeString - HH:mm:ss or HH:mm format
 * @returns {object} { valid: boolean, error: string }
 */
function validateAppointmentTime(timeString) {
  // Check format
  if (!isValidTime(timeString)) {
    return {
      valid: false,
      error: 'Μη έγκυρη μορφή ώρας. Χρησιμοποιήστε HH:mm.',
    };
  }

  return { valid: true };
}

/**
 * Validate appointment date and time together
 * @param {string} dateString - YYYY-MM-DD format
 * @param {string} timeString - HH:mm:ss format
 * @returns {object} { valid: boolean, error: string }
 */
function validateAppointmentDateTime(dateString, timeString) {
  // Validate date
  const dateValidation = validateAppointmentDate(dateString);
  if (!dateValidation.valid) {
    return dateValidation;
  }

  // Validate time
  const timeValidation = validateAppointmentTime(timeString);
  if (!timeValidation.valid) {
    return timeValidation;
  }

  // Check if in the past
  if (isInPast(dateString, timeString)) {
    return {
      valid: false,
      error: 'Δεν μπορείτε να κλείσετε ραντεβού σε παρελθούσα ημερομηνία ή ώρα.',
    };
  }

  // Check minimum notice (24 hours)
  if (isWithinMinimumNotice(dateString, timeString)) {
    return {
      valid: false,
      error: 'Απαιτείται τουλάχιστον 24 ώρες προειδοποίηση για κράτηση ραντεβού.',
    };
  }

  return { valid: true };
}

/**
 * Validate appointment booking request
 * @param {object} data - Appointment data
 * @returns {object} { valid: boolean, errors: object }
 */
function validateBookingRequest(data) {
  const errors = {};

  // Validate client name
  if (!data.client_name || !isValidName(data.client_name)) {
    errors.client_name = 'Παρακαλώ εισάγετε έγκυρο όνομα (2-255 χαρακτήρες).';
  }

  // Validate client email
  if (!data.client_email || !isValidEmail(data.client_email)) {
    errors.client_email = 'Παρακαλώ εισάγετε έγκυρη διεύθυνση email.';
  }

  // Validate client phone
  if (!data.client_phone || !isValidPhone(data.client_phone)) {
    errors.client_phone = 'Παρακαλώ εισάγετε έγκυρο ελληνικό τηλέφωνο.';
  }

  // Validate service type
  if (!data.service_type || !isValidServiceType(data.service_type)) {
    errors.service_type = 'Παρακαλώ επιλέξτε έγκυρο τύπο υπηρεσίας.';
  }

  // Validate date and time
  if (!data.appointment_date || !data.appointment_time) {
    errors.appointment = 'Παρακαλώ επιλέξτε ημερομηνία και ώρα ραντεβού.';
  } else {
    const dateTimeValidation = validateAppointmentDateTime(
      data.appointment_date,
      data.appointment_time
    );
    if (!dateTimeValidation.valid) {
      errors.appointment = dateTimeValidation.error;
    }
  }

  // Validate notes (optional, but limit length)
  if (data.notes && data.notes.length > 1000) {
    errors.notes = 'Οι σημειώσεις δεν μπορούν να υπερβαίνουν τους 1000 χαρακτήρες.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate admin decline request
 * @param {object} data - Decline data
 * @returns {object} { valid: boolean, errors: object }
 */
function validateDeclineRequest(data) {
  const errors = {};

  // Decline reason is required
  if (!data.decline_reason || typeof data.decline_reason !== 'string') {
    errors.decline_reason = 'Παρακαλώ εισάγετε λόγο απόρριψης.';
  } else if (data.decline_reason.trim().length < 10) {
    errors.decline_reason = 'Ο λόγος απόρριψης πρέπει να είναι τουλάχιστον 10 χαρακτήρες.';
  } else if (data.decline_reason.length > 500) {
    errors.decline_reason = 'Ο λόγος απόρριψης δεν μπορεί να υπερβαίνει τους 500 χαρακτήρες.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate availability settings
 * @param {object} data - Availability data
 * @returns {object} { valid: boolean, errors: object }
 */
function validateAvailabilitySettings(data) {
  const errors = {};

  // Validate day of week
  if (typeof data.day_of_week !== 'number' || data.day_of_week < 0 || data.day_of_week > 6) {
    errors.day_of_week = 'Μη έγκυρη ημέρα εβδομάδας (0-6).';
  }

  // Validate is_working_day
  if (typeof data.is_working_day !== 'boolean') {
    errors.is_working_day = 'Το πεδίο εργάσιμης ημέρας πρέπει να είναι boolean.';
  }

  // If working day, validate times
  if (data.is_working_day) {
    if (!data.start_time || !isValidTime(data.start_time)) {
      errors.start_time = 'Παρακαλώ εισάγετε έγκυρη ώρα έναρξης.';
    }

    if (!data.end_time || !isValidTime(data.end_time)) {
      errors.end_time = 'Παρακαλώ εισάγετε έγκυρη ώρα λήξης.';
    }

    // Check that end time is after start time
    if (data.start_time && data.end_time && data.start_time >= data.end_time) {
      errors.time_range = 'Η ώρα λήξης πρέπει να είναι μετά την ώρα έναρξης.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate blocked date
 * @param {object} data - Blocked date data
 * @returns {object} { valid: boolean, errors: object }
 */
function validateBlockedDate(data) {
  const errors = {};

  // Validate date
  if (!data.blocked_date || !isValidDate(data.blocked_date)) {
    errors.blocked_date = 'Παρακαλώ εισάγετε έγκυρη ημερομηνία.';
  }

  // Validate reason (optional, but limit length)
  if (data.reason && data.reason.length > 255) {
    errors.reason = 'Ο λόγος δεν μπορεί να υπερβαίνει τους 255 χαρακτήρες.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate admin credentials
 * @param {object} data - Admin credentials
 * @returns {object} { valid: boolean, errors: object }
 */
function validateAdminCredentials(data) {
  const errors = {};

  // Validate username
  if (!data.username || typeof data.username !== 'string') {
    errors.username = 'Παρακαλώ εισάγετε όνομα χρήστη.';
  } else if (data.username.length < 3 || data.username.length > 50) {
    errors.username = 'Το όνομα χρήστη πρέπει να είναι 3-50 χαρακτήρες.';
  } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
    errors.username = 'Το όνομα χρήστη μπορεί να περιέχει μόνο γράμματα, αριθμούς και κάτω παύλα.';
  }

  // Validate email
  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Παρακαλώ εισάγετε έγκυρη διεύθυνση email.';
  }

  // Validate password
  if (!data.password || typeof data.password !== 'string') {
    errors.password = 'Παρακαλώ εισάγετε κωδικό πρόσβασης.';
  } else if (data.password.length < 8) {
    errors.password = 'Ο κωδικός πρέπει να είναι τουλάχιστον 8 χαρακτήρες.';
  } else if (data.password.length > 128) {
    errors.password = 'Ο κωδικός δεν μπορεί να υπερβαίνει τους 128 χαρακτήρες.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Sanitize string for output (trim whitespace)
 * @param {string} str
 * @returns {string}
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

module.exports = {
  // Basic validation
  isValidEmail,
  isValidPhone,
  isValidName,
  isValidServiceType,
  isValidStatus,

  // Date/time validation
  validateAppointmentDate,
  validateAppointmentTime,
  validateAppointmentDateTime,

  // Complex validation
  validateBookingRequest,
  validateDeclineRequest,
  validateAvailabilitySettings,
  validateBlockedDate,
  validateAdminCredentials,

  // Utilities
  sanitizeString,
};
