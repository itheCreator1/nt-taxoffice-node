/**
 * Unit Tests - Validation Utility
 * Tests for input validation functions
 */

const validation = require('../../../utils/validation');

describe('Validation Utility', () => {
  describe('isValidEmail', () => {
    test('should return true for valid email addresses', () => {
      expect(validation.isValidEmail('test@example.com')).toBe(true);
      expect(validation.isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(validation.isValidEmail('test+tag@example.com')).toBe(true);
      expect(validation.isValidEmail('user_123@test-domain.com')).toBe(true);
    });

    test('should return false for invalid email addresses', () => {
      expect(validation.isValidEmail('')).toBe(false);
      expect(validation.isValidEmail('invalid')).toBe(false);
      expect(validation.isValidEmail('@nodomain.com')).toBe(false);
      expect(validation.isValidEmail('spaces in@email.com')).toBe(false);
      expect(validation.isValidEmail('double@@domain.com')).toBe(false);
      expect(validation.isValidEmail('missing@')).toBe(false);
    });

    test('should return false for non-string inputs', () => {
      expect(validation.isValidEmail(null)).toBe(false);
      expect(validation.isValidEmail(undefined)).toBe(false);
      expect(validation.isValidEmail(123)).toBe(false);
      expect(validation.isValidEmail({})).toBe(false);
    });

    test('should reject emails longer than 255 characters', () => {
      const longEmail = `${'a'.repeat(250)}@test.com`;
      expect(validation.isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    test('should return true for valid Greek mobile numbers', () => {
      expect(validation.isValidPhone('6912345678')).toBe(true);
      expect(validation.isValidPhone('306912345678')).toBe(true);
      expect(validation.isValidPhone('+306912345678')).toBe(true);
      expect(validation.isValidPhone('691 234 5678')).toBe(true);
      expect(validation.isValidPhone('691-234-5678')).toBe(true);
    });

    test('should return true for valid Greek landline numbers', () => {
      expect(validation.isValidPhone('2101234567')).toBe(true);
      expect(validation.isValidPhone('302101234567')).toBe(true);
      expect(validation.isValidPhone('+302101234567')).toBe(true);
      expect(validation.isValidPhone('210 123 4567')).toBe(true);
    });

    test('should return false for invalid phone numbers', () => {
      expect(validation.isValidPhone('123')).toBe(false);
      expect(validation.isValidPhone('5912345678')).toBe(false); // Doesn't start with 2 or 6
      expect(validation.isValidPhone('691234567')).toBe(false); // Too short
      expect(validation.isValidPhone('69123456789')).toBe(false); // Too long
      expect(validation.isValidPhone('+44123456789')).toBe(false); // Wrong country code
    });

    test('should return false for non-string inputs', () => {
      expect(validation.isValidPhone(null)).toBe(false);
      expect(validation.isValidPhone(undefined)).toBe(false);
      expect(validation.isValidPhone(123456789)).toBe(false);
    });
  });

  describe('isValidName', () => {
    test('should return true for valid names', () => {
      expect(validation.isValidName('John Smith')).toBe(true);
      expect(validation.isValidName('Maria-Elena')).toBe(true);
      expect(validation.isValidName("O'Connor")).toBe(true);
      expect(validation.isValidName('Test Name')).toBe(true);
    });

    test('should return false for names that are too short', () => {
      expect(validation.isValidName('A')).toBe(false);
    });

    test('should return false for names that are too long', () => {
      const longName = 'A'.repeat(256);
      expect(validation.isValidName(longName)).toBe(false);
    });

    test('should return false for names with invalid characters', () => {
      expect(validation.isValidName('John123')).toBe(false);
      expect(validation.isValidName('Name@Test')).toBe(false);
      expect(validation.isValidName('Name.Test')).toBe(false);
    });

    test('should return false for non-string inputs', () => {
      expect(validation.isValidName(null)).toBe(false);
      expect(validation.isValidName(undefined)).toBe(false);
      expect(validation.isValidName(123)).toBe(false);
    });

    test('should trim whitespace before validation', () => {
      expect(validation.isValidName('  Valid Name  ')).toBe(true);
    });
  });

  describe('isValidServiceType', () => {
    test('should return true for valid service types', () => {
      expect(validation.isValidServiceType('Φορολογική Δήλωση')).toBe(true);
      expect(validation.isValidServiceType('Λογιστική Υποστήριξη')).toBe(true);
      expect(validation.isValidServiceType('Έναρξη Επιχείρησης')).toBe(true);
      expect(validation.isValidServiceType('Μισθοδοσία')).toBe(true);
      expect(validation.isValidServiceType('Γενική Συμβουλευτική')).toBe(true);
    });

    test('should return false for invalid service types', () => {
      expect(validation.isValidServiceType('Invalid Service')).toBe(false);
      expect(validation.isValidServiceType('')).toBe(false);
      expect(validation.isValidServiceType(null)).toBe(false);
    });
  });

  describe('isValidStatus', () => {
    test('should return true for valid statuses', () => {
      expect(validation.isValidStatus('pending')).toBe(true);
      expect(validation.isValidStatus('confirmed')).toBe(true);
      expect(validation.isValidStatus('declined')).toBe(true);
      expect(validation.isValidStatus('cancelled')).toBe(true);
      expect(validation.isValidStatus('completed')).toBe(true);
    });

    test('should return false for invalid statuses', () => {
      expect(validation.isValidStatus('invalid')).toBe(false);
      expect(validation.isValidStatus('PENDING')).toBe(false); // Case sensitive
      expect(validation.isValidStatus('')).toBe(false);
      expect(validation.isValidStatus(null)).toBe(false);
    });
  });

  describe('validateBookingRequest', () => {
    // Use a date 7 days in the future - within the 60-day booking window
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const futureDate = tomorrow.toISOString().split('T')[0];

    const validBookingData = {
      client_name: 'John Smith',
      client_email: 'test@example.com',
      client_phone: '6912345678',
      service_type: 'Φορολογική Δήλωση',
      appointment_date: futureDate,
      appointment_time: '10:00:00',
      notes: 'Test notes',
    };

    test('should validate correct booking request', () => {
      const result = validation.validateBookingRequest(validBookingData);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('should reject request with invalid client name', () => {
      const data = { ...validBookingData, client_name: 'A' };
      const result = validation.validateBookingRequest(data);
      expect(result.valid).toBe(false);
      expect(result.errors.client_name).toBeDefined();
    });

    test('should reject request with invalid email', () => {
      const data = { ...validBookingData, client_email: 'invalid-email' };
      const result = validation.validateBookingRequest(data);
      expect(result.valid).toBe(false);
      expect(result.errors.client_email).toBeDefined();
    });

    test('should reject request with invalid phone', () => {
      const data = { ...validBookingData, client_phone: '123' };
      const result = validation.validateBookingRequest(data);
      expect(result.valid).toBe(false);
      expect(result.errors.client_phone).toBeDefined();
    });

    test('should reject request with invalid service type', () => {
      const data = { ...validBookingData, service_type: 'Invalid' };
      const result = validation.validateBookingRequest(data);
      expect(result.valid).toBe(false);
      expect(result.errors.service_type).toBeDefined();
    });

    test('should reject request with missing date or time', () => {
      const data = { ...validBookingData, appointment_date: '' };
      const result = validation.validateBookingRequest(data);
      expect(result.valid).toBe(false);
      expect(result.errors.appointment).toBeDefined();
    });

    test('should reject request with notes too long', () => {
      const data = { ...validBookingData, notes: 'A'.repeat(1001) };
      const result = validation.validateBookingRequest(data);
      expect(result.valid).toBe(false);
      expect(result.errors.notes).toBeDefined();
    });

    test('should accept request without notes', () => {
      const data = { ...validBookingData, notes: undefined };
      const result = validation.validateBookingRequest(data);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateDeclineRequest', () => {
    test('should validate correct decline request', () => {
      const data = { decline_reason: 'This is a valid reason for declining' };
      const result = validation.validateDeclineRequest(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('should reject decline reason that is too short', () => {
      const data = { decline_reason: 'Short' };
      const result = validation.validateDeclineRequest(data);
      expect(result.valid).toBe(false);
      expect(result.errors.decline_reason).toBeDefined();
    });

    test('should reject decline reason that is too long', () => {
      const data = { decline_reason: 'A'.repeat(501) };
      const result = validation.validateDeclineRequest(data);
      expect(result.valid).toBe(false);
      expect(result.errors.decline_reason).toBeDefined();
    });

    test('should reject missing decline reason', () => {
      const result = validation.validateDeclineRequest({});
      expect(result.valid).toBe(false);
      expect(result.errors.decline_reason).toBeDefined();
    });
  });

  describe('validateAvailabilitySettings', () => {
    test('should validate correct working day settings', () => {
      const data = {
        day_of_week: 1,
        is_working_day: true,
        start_time: '09:00:00',
        end_time: '17:00:00',
      };
      const result = validation.validateAvailabilitySettings(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('should validate correct non-working day settings', () => {
      const data = {
        day_of_week: 0,
        is_working_day: false,
        start_time: null,
        end_time: null,
      };
      const result = validation.validateAvailabilitySettings(data);
      expect(result.valid).toBe(true);
    });

    test('should reject invalid day of week', () => {
      const data = {
        day_of_week: 7,
        is_working_day: true,
        start_time: '09:00:00',
        end_time: '17:00:00',
      };
      const result = validation.validateAvailabilitySettings(data);
      expect(result.valid).toBe(false);
      expect(result.errors.day_of_week).toBeDefined();
    });

    test('should reject working day without start time', () => {
      const data = {
        day_of_week: 1,
        is_working_day: true,
        end_time: '17:00:00',
      };
      const result = validation.validateAvailabilitySettings(data);
      expect(result.valid).toBe(false);
      expect(result.errors.start_time).toBeDefined();
    });

    test('should reject working day with end time before start time', () => {
      const data = {
        day_of_week: 1,
        is_working_day: true,
        start_time: '17:00:00',
        end_time: '09:00:00',
      };
      const result = validation.validateAvailabilitySettings(data);
      expect(result.valid).toBe(false);
      expect(result.errors.time_range).toBeDefined();
    });
  });

  describe('validateBlockedDate', () => {
    test('should validate correct blocked date', () => {
      const data = {
        blocked_date: '2025-12-25',
        reason: 'Christmas Holiday',
      };
      const result = validation.validateBlockedDate(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('should validate blocked date without reason', () => {
      const data = {
        blocked_date: '2025-12-25',
      };
      const result = validation.validateBlockedDate(data);
      expect(result.valid).toBe(true);
    });

    test('should reject invalid date format', () => {
      const data = {
        blocked_date: 'invalid-date',
        reason: 'Holiday',
      };
      const result = validation.validateBlockedDate(data);
      expect(result.valid).toBe(false);
      expect(result.errors.blocked_date).toBeDefined();
    });

    test('should reject reason that is too long', () => {
      const data = {
        blocked_date: '2025-12-25',
        reason: 'A'.repeat(256),
      };
      const result = validation.validateBlockedDate(data);
      expect(result.valid).toBe(false);
      expect(result.errors.reason).toBeDefined();
    });
  });

  describe('validateAdminCredentials', () => {
    test('should validate correct admin credentials', () => {
      const data = {
        username: 'admin123',
        email: 'admin@example.com',
        password: 'SecurePassword123',
      };
      const result = validation.validateAdminCredentials(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('should reject username that is too short', () => {
      const data = {
        username: 'ab',
        email: 'admin@example.com',
        password: 'SecurePassword123',
      };
      const result = validation.validateAdminCredentials(data);
      expect(result.valid).toBe(false);
      expect(result.errors.username).toBeDefined();
    });

    test('should reject username with invalid characters', () => {
      const data = {
        username: 'admin@123',
        email: 'admin@example.com',
        password: 'SecurePassword123',
      };
      const result = validation.validateAdminCredentials(data);
      expect(result.valid).toBe(false);
      expect(result.errors.username).toBeDefined();
    });

    test('should reject invalid email', () => {
      const data = {
        username: 'admin123',
        email: 'invalid',
        password: 'SecurePassword123',
      };
      const result = validation.validateAdminCredentials(data);
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    test('should reject password that is too short', () => {
      const data = {
        username: 'admin123',
        email: 'admin@example.com',
        password: 'Short1',
      };
      const result = validation.validateAdminCredentials(data);
      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    test('should reject password that is too long', () => {
      const data = {
        username: 'admin123',
        email: 'admin@example.com',
        password: 'A'.repeat(129),
      };
      const result = validation.validateAdminCredentials(data);
      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });
  });

  describe('sanitizeString', () => {
    test('should trim whitespace from strings', () => {
      expect(validation.sanitizeString('  test  ')).toBe('test');
      expect(validation.sanitizeString('test')).toBe('test');
      expect(validation.sanitizeString('\n\ttest\n\t')).toBe('test');
    });

    test('should return empty string for non-string inputs', () => {
      expect(validation.sanitizeString(null)).toBe('');
      expect(validation.sanitizeString(undefined)).toBe('');
      expect(validation.sanitizeString(123)).toBe('');
      expect(validation.sanitizeString({})).toBe('');
    });
  });
});
