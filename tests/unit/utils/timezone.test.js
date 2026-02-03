/**
 * Unit Tests - Timezone Utility
 * Tests for date/time handling functions
 */

const moment = require('moment-timezone');
const timezone = require('../../../utils/timezone');

describe('Timezone Utility', () => {
  // Mock current time for consistent testing
  const MOCK_NOW = '2025-06-15T10:00:00';
  let realDateNow;

  beforeAll(() => {
    // Save original Date.now
    realDateNow = Date.now;
  });

  beforeEach(() => {
    // Set fixed time for tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date(MOCK_NOW));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    // Restore original Date.now
    Date.now = realDateNow;
  });

  describe('Constants', () => {
    test('should have correct timezone constant', () => {
      expect(timezone.TIMEZONE).toBe('Europe/Athens');
    });

    test('should have correct booking window', () => {
      expect(timezone.BOOKING_WINDOW_DAYS).toBe(60);
    });

    test('should have correct minimum notice', () => {
      expect(timezone.MINIMUM_NOTICE_HOURS).toBe(24);
    });
  });

  describe('now', () => {
    test('should return current moment in Athens timezone', () => {
      const result = timezone.now();
      expect(result.tz()).toBe('Europe/Athens');
    });
  });

  describe('parseDate', () => {
    test('should parse date string correctly', () => {
      const result = timezone.parseDate('2025-12-25');
      expect(result.format('YYYY-MM-DD')).toBe('2025-12-25');
      expect(result.tz()).toBe('Europe/Athens');
    });
  });

  describe('parseDateTime', () => {
    test('should parse date and time correctly', () => {
      const result = timezone.parseDateTime('2025-12-25', '14:30:00');
      expect(result.format('YYYY-MM-DD HH:mm:ss')).toBe('2025-12-25 14:30:00');
      expect(result.tz()).toBe('Europe/Athens');
    });
  });

  describe('formatDate', () => {
    test('should format date as DD/MM/YYYY', () => {
      const date = '2025-12-25';
      expect(timezone.formatDate(date)).toBe('25/12/2025');
    });

    test('should return empty string for null', () => {
      expect(timezone.formatDate(null)).toBe('');
    });
  });

  describe('formatTime', () => {
    test('should format time as HH:mm', () => {
      const datetime = '2025-06-15 14:30:00';
      expect(timezone.formatTime(datetime)).toBe('14:30');
    });

    test('should return empty string for null', () => {
      expect(timezone.formatTime(null)).toBe('');
    });
  });

  describe('formatDateTime', () => {
    test('should format datetime as DD/MM/YYYY HH:mm', () => {
      const datetime = '2025-12-25 14:30:00';
      expect(timezone.formatDateTime(datetime)).toBe('25/12/2025 14:30');
    });
  });

  describe('formatGreekDate', () => {
    test('should format date in Greek', () => {
      const date = '2025-12-25';
      const result = timezone.formatGreekDate(date);
      expect(result).toContain('Δεκεμβρίου');
      expect(result).toContain('25');
      expect(result).toContain('2025');
    });

    test('should return empty string for null', () => {
      expect(timezone.formatGreekDate(null)).toBe('');
    });
  });

  describe('getGreekDayName', () => {
    test('should return correct Greek day names', () => {
      expect(timezone.getGreekDayName(0)).toBe('Κυριακή');
      expect(timezone.getGreekDayName(1)).toBe('Δευτέρα');
      expect(timezone.getGreekDayName(2)).toBe('Τρίτη');
      expect(timezone.getGreekDayName(3)).toBe('Τετάρτη');
      expect(timezone.getGreekDayName(4)).toBe('Πέμπτη');
      expect(timezone.getGreekDayName(5)).toBe('Παρασκευή');
      expect(timezone.getGreekDayName(6)).toBe('Σάββατο');
    });

    test('should return empty string for invalid day', () => {
      expect(timezone.getGreekDayName(7)).toBe('');
      expect(timezone.getGreekDayName(-1)).toBe('');
    });
  });

  describe('getGreekMonthName', () => {
    test('should return correct Greek month names', () => {
      expect(timezone.getGreekMonthName(0)).toBe('Ιανουαρίου');
      expect(timezone.getGreekMonthName(11)).toBe('Δεκεμβρίου');
    });

    test('should return empty string for invalid month', () => {
      expect(timezone.getGreekMonthName(12)).toBe('');
      expect(timezone.getGreekMonthName(-1)).toBe('');
    });
  });

  describe('toMySQLDate', () => {
    test('should convert to MySQL date format', () => {
      const date = new Date('2025-12-25');
      expect(timezone.toMySQLDate(date)).toBe('2025-12-25');
    });

    test('should return null for null input', () => {
      expect(timezone.toMySQLDate(null)).toBe(null);
    });
  });

  describe('toMySQLTime', () => {
    test('should convert to MySQL time format', () => {
      const time = '2025-12-25 14:30:00';
      expect(timezone.toMySQLTime(time)).toBe('14:30:00');
    });

    test('should return null for null input', () => {
      expect(timezone.toMySQLTime(null)).toBe(null);
    });
  });

  describe('toMySQLDateTime', () => {
    test('should convert to MySQL datetime format', () => {
      const datetime = '2025-12-25 14:30:00';
      expect(timezone.toMySQLDateTime(datetime)).toBe('2025-12-25 14:30:00');
    });

    test('should return null for null input', () => {
      expect(timezone.toMySQLDateTime(null)).toBe(null);
    });
  });

  describe('isInPast', () => {
    test('should return true for past date/time', () => {
      // Mock now is 2025-06-15 10:00:00
      expect(timezone.isInPast('2025-06-14', '10:00:00')).toBe(true);
      expect(timezone.isInPast('2025-06-15', '09:00:00')).toBe(true);
    });

    test('should return false for future date/time', () => {
      // Mock now is 2025-06-15 10:00:00
      expect(timezone.isInPast('2025-06-16', '10:00:00')).toBe(false);
      expect(timezone.isInPast('2025-06-15', '11:00:00')).toBe(false);
    });
  });

  describe('isBeyondBookingWindow', () => {
    test('should return false for dates within 60 days', () => {
      // Mock now is 2025-06-15
      expect(timezone.isBeyondBookingWindow('2025-07-15')).toBe(false);
      expect(timezone.isBeyondBookingWindow('2025-08-14')).toBe(false);
    });

    test('should return true for dates beyond 60 days', () => {
      // Mock now is 2025-06-15, so 60 days ahead = 2025-08-14
      // 2025-08-15 is 61 days, should be beyond window
      expect(timezone.isBeyondBookingWindow('2025-08-20')).toBe(true);
      expect(timezone.isBeyondBookingWindow('2025-09-01')).toBe(true);
    });
  });

  describe('isWithinMinimumNotice', () => {
    test('should return true for appointments within 24 hours', () => {
      // Mock now is 2025-06-15 10:00:00
      expect(timezone.isWithinMinimumNotice('2025-06-15', '11:00:00')).toBe(true);
      expect(timezone.isWithinMinimumNotice('2025-06-16', '09:00:00')).toBe(true);
    });

    test('should return false for appointments beyond 24 hours', () => {
      // Mock now is 2025-06-15 10:00:00
      expect(timezone.isWithinMinimumNotice('2025-06-16', '11:00:00')).toBe(false);
      expect(timezone.isWithinMinimumNotice('2025-06-17', '10:00:00')).toBe(false);
    });
  });

  describe('isValidDate', () => {
    test('should return true for valid date strings', () => {
      expect(timezone.isValidDate('2025-12-25')).toBe(true);
      expect(timezone.isValidDate('2025-01-01')).toBe(true);
      expect(timezone.isValidDate('2025-02-29')).toBe(false); // Not leap year
      expect(timezone.isValidDate('2024-02-29')).toBe(true); // Leap year
    });

    test('should return false for invalid date strings', () => {
      expect(timezone.isValidDate('invalid')).toBe(false);
      expect(timezone.isValidDate('2025/12/25')).toBe(false);
      expect(timezone.isValidDate('25-12-2025')).toBe(false);
      expect(timezone.isValidDate('2025-13-01')).toBe(false); // Invalid month
    });
  });

  describe('isValidTime', () => {
    test('should return true for valid time strings', () => {
      expect(timezone.isValidTime('14:30:00')).toBe(true);
      expect(timezone.isValidTime('14:30')).toBe(true);
      expect(timezone.isValidTime('00:00:00')).toBe(true);
      expect(timezone.isValidTime('23:59:59')).toBe(true);
    });

    test('should return false for invalid time strings', () => {
      expect(timezone.isValidTime('invalid')).toBe(false);
      expect(timezone.isValidTime('25:00:00')).toBe(false);
      expect(timezone.isValidTime('14:60:00')).toBe(false);
      expect(timezone.isValidTime('14:30:60')).toBe(false);
    });
  });

  describe('startOfDay', () => {
    test('should return start of day', () => {
      const result = timezone.startOfDay('2025-12-25');
      expect(result.format('HH:mm:ss')).toBe('00:00:00');
    });
  });

  describe('endOfDay', () => {
    test('should return end of day', () => {
      const result = timezone.endOfDay('2025-12-25');
      expect(result.format('HH:mm:ss')).toBe('23:59:59');
    });
  });

  describe('isSameDay', () => {
    test('should return true for same day', () => {
      expect(timezone.isSameDay('2025-12-25 10:00:00', '2025-12-25 14:00:00')).toBe(true);
    });

    test('should return false for different days', () => {
      expect(timezone.isSameDay('2025-12-25', '2025-12-26')).toBe(false);
    });
  });

  describe('getDayOfWeek', () => {
    test('should return correct day of week', () => {
      // 2025-06-15 is a Sunday
      expect(timezone.getDayOfWeek('2025-06-15')).toBe(0);
      // 2025-06-16 is a Monday
      expect(timezone.getDayOfWeek('2025-06-16')).toBe(1);
    });
  });

  describe('addDays', () => {
    test('should add days correctly', () => {
      const result = timezone.addDays('2025-12-25', 5);
      expect(result.format('YYYY-MM-DD')).toBe('2025-12-30');
    });

    test('should handle negative days (subtract)', () => {
      const result = timezone.addDays('2025-12-25', -5);
      expect(result.format('YYYY-MM-DD')).toBe('2025-12-20');
    });
  });

  describe('getCurrentDate', () => {
    test('should return current date as YYYY-MM-DD', () => {
      expect(timezone.getCurrentDate()).toBe('2025-06-15');
    });
  });

  describe('getCurrentTime', () => {
    test('should return current time as HH:mm:ss', () => {
      const result = timezone.getCurrentTime();
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });
});
