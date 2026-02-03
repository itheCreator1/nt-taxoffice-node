/**
 * Unit Tests - Availability Service
 * Tests for availability calculation and slot generation
 */

const { createMockDbPool, resetAllMocks } = require('../../helpers/mocks');

// Mock dependencies
jest.mock('../../../services/database');
jest.mock('../../../utils/logger');

const database = require('../../../services/database');
const availability = require('../../../services/availability');

describe('Availability Service', () => {
  let mockPool;

  beforeEach(() => {
    resetAllMocks();
    mockPool = createMockDbPool();
    database.getDb.mockReturnValue(mockPool);
  });

  describe('getAvailabilitySettings', () => {
    test('should return all availability settings ordered by day', async () => {
      const mockSettings = [
        { day_of_week: 0, is_working_day: false, start_time: null, end_time: null },
        { day_of_week: 1, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
        { day_of_week: 2, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
      ];

      mockPool.query.mockResolvedValueOnce([mockSettings]);

      const result = await availability.getAvailabilitySettings();

      expect(result).toEqual(mockSettings);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT day_of_week, is_working_day, start_time, end_time')
      );
    });
  });

  describe('getAvailabilityForDay', () => {
    test('should return availability for specific day', async () => {
      const mockDay = {
        day_of_week: 1,
        is_working_day: true,
        start_time: '09:00:00',
        end_time: '17:00:00',
      };

      mockPool.query.mockResolvedValueOnce([[mockDay]]);

      const result = await availability.getAvailabilityForDay(1);

      expect(result).toEqual(mockDay);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE day_of_week = ?'),
        [1]
      );
    });

    test('should return null if day not found', async () => {
      mockPool.query.mockResolvedValueOnce([[]]);

      const result = await availability.getAvailabilityForDay(7);

      expect(result).toBeNull();
    });
  });

  describe('getBlockedDates', () => {
    test('should return all non-deleted blocked dates', async () => {
      const mockBlockedDates = [
        { blocked_date: '2025-12-25', reason: 'Christmas' },
        { blocked_date: '2025-01-01', reason: 'New Year' },
      ];

      mockPool.query.mockResolvedValueOnce([mockBlockedDates]);

      const result = await availability.getBlockedDates();

      expect(result).toEqual(mockBlockedDates);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE deleted_at IS NULL')
      );
    });
  });

  describe('isDateBlocked', () => {
    test('should return true for blocked date', async () => {
      mockPool.query.mockResolvedValueOnce([[{ id: 1 }]]);

      const result = await availability.isDateBlocked('2025-12-25');

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE blocked_date = ?'),
        ['2025-12-25']
      );
    });

    test('should return false for non-blocked date', async () => {
      mockPool.query.mockResolvedValueOnce([[]]);

      const result = await availability.isDateBlocked('2025-12-20');

      expect(result).toBe(false);
    });
  });

  describe('getBookedTimesForDate', () => {
    test('should return booked times for a date', async () => {
      const mockBookings = [
        { appointment_time: '09:00:00' },
        { appointment_time: '10:00:00' },
        { appointment_time: '14:00:00' },
      ];

      mockPool.query.mockResolvedValueOnce([mockBookings]);

      const result = await availability.getBookedTimesForDate('2025-12-15');

      expect(result).toEqual(['09:00:00', '10:00:00', '14:00:00']);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE appointment_date = ?'),
        ['2025-12-15']
      );
    });

    test('should return empty array if no bookings', async () => {
      mockPool.query.mockResolvedValueOnce([[]]);

      const result = await availability.getBookedTimesForDate('2025-12-15');

      expect(result).toEqual([]);
    });

    test('should only include pending and confirmed appointments', async () => {
      mockPool.query.mockResolvedValueOnce([[]]);

      await availability.getBookedTimesForDate('2025-12-15');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("status IN ('pending', 'confirmed')"),
        ['2025-12-15']
      );
    });
  });

  describe('generateTimeSlots', () => {
    test('should generate hourly slots', () => {
      const slots = availability.generateTimeSlots('09:00:00', '12:00:00');

      expect(slots).toEqual(['09:00:00', '10:00:00', '11:00:00']);
    });

    test('should handle afternoon times', () => {
      const slots = availability.generateTimeSlots('14:00:00', '17:00:00');

      expect(slots).toEqual(['14:00:00', '15:00:00', '16:00:00']);
    });

    test('should return empty array if end time equals start time', () => {
      const slots = availability.generateTimeSlots('09:00:00', '09:00:00');

      expect(slots).toEqual([]);
    });

    test('should handle single slot', () => {
      const slots = availability.generateTimeSlots('09:00:00', '10:00:00');

      expect(slots).toEqual(['09:00:00']);
    });
  });

  describe('isSlotAvailable', () => {
    test('should return true for available slot', async () => {
      // Queries are called in this order: isDateBlocked, getAvailabilityForDay, getBookedTimesForDate

      // Mock blocked dates - not blocked (called first)
      mockPool.query.mockResolvedValueOnce([[]]);

      // Mock day settings - working day (called second)
      mockPool.query.mockResolvedValueOnce([
        [
          {
            day_of_week: 1,
            is_working_day: true,
            start_time: '09:00:00',
            end_time: '17:00:00',
          },
        ],
      ]);

      // Mock booked times - no bookings (called third)
      mockPool.query.mockResolvedValueOnce([[]]);

      const result = await availability.isSlotAvailable('2025-12-15', '10:00:00');

      expect(result).toBe(true);
    });

    test('should return false for non-working day', async () => {
      // Mock day settings - non-working day
      mockPool.query.mockResolvedValueOnce([
        [
          {
            day_of_week: 0,
            is_working_day: false,
            start_time: null,
            end_time: null,
          },
        ],
      ]);

      const result = await availability.isSlotAvailable('2025-12-14', '10:00:00');

      expect(result).toBe(false);
    });

    test('should return false for blocked date', async () => {
      // Mock day settings - working day
      mockPool.query.mockResolvedValueOnce([
        [
          {
            day_of_week: 4,
            is_working_day: true,
            start_time: '09:00:00',
            end_time: '17:00:00',
          },
        ],
      ]);

      // Mock blocked dates - date is blocked
      mockPool.query.mockResolvedValueOnce([[{ id: 1 }]]);

      const result = await availability.isSlotAvailable('2025-12-25', '10:00:00');

      expect(result).toBe(false);
    });

    test('should return false for already booked slot', async () => {
      // Mock day settings - working day
      mockPool.query.mockResolvedValueOnce([
        [
          {
            day_of_week: 1,
            is_working_day: true,
            start_time: '09:00:00',
            end_time: '17:00:00',
          },
        ],
      ]);

      // Mock blocked dates - not blocked
      mockPool.query.mockResolvedValueOnce([[]]);

      // Mock booked times - slot is booked
      mockPool.query.mockResolvedValueOnce([[{ appointment_time: '10:00:00' }]]);

      const result = await availability.isSlotAvailable('2025-12-15', '10:00:00');

      expect(result).toBe(false);
    });
  });

  describe('getAvailableSlotsForDate', () => {
    test('should return available slots for working day', async () => {
      // Queries are called in this order: isDateBlocked, getAvailabilityForDay, getBookedTimesForDate

      // Mock blocked dates - not blocked (called first)
      mockPool.query.mockResolvedValueOnce([[]]);

      // Mock day settings (called second)
      mockPool.query.mockResolvedValueOnce([
        [
          {
            day_of_week: 1,
            is_working_day: true,
            start_time: '09:00:00',
            end_time: '12:00:00',
          },
        ],
      ]);

      // Mock booked times - one slot booked (called third)
      mockPool.query.mockResolvedValueOnce([[{ appointment_time: '10:00:00' }]]);

      const result = await availability.getAvailableSlotsForDate('2025-12-15');

      expect(result).toEqual(['09:00:00', '11:00:00']);
    });

    test('should return empty array for non-working day', async () => {
      // Mock day settings - non-working
      mockPool.query.mockResolvedValueOnce([
        [
          {
            day_of_week: 0,
            is_working_day: false,
            start_time: null,
            end_time: null,
          },
        ],
      ]);

      const result = await availability.getAvailableSlotsForDate('2025-12-14');

      expect(result).toEqual([]);
    });

    test('should return empty array for blocked date', async () => {
      // Mock day settings - working day
      mockPool.query.mockResolvedValueOnce([
        [
          {
            day_of_week: 4,
            is_working_day: true,
            start_time: '09:00:00',
            end_time: '17:00:00',
          },
        ],
      ]);

      // Mock blocked dates - date is blocked
      mockPool.query.mockResolvedValueOnce([[{ id: 1 }]]);

      const result = await availability.getAvailableSlotsForDate('2025-12-25');

      expect(result).toEqual([]);
    });
  });
});
