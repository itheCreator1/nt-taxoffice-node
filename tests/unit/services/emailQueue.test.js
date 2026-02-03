/**
 * Unit Tests - Email Queue Service
 * Tests email queue management with retry logic
 */

// Mock dependencies
jest.mock('../../../services/database');
jest.mock('../../../services/email');
jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const { getDb } = require('../../../services/database');
const emailService = require('../../../services/email');

describe('Email Queue Service', () => {
  let emailQueue;
  let mockDb;
  let mockQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Setup mock database
    mockQuery = jest.fn();
    mockDb = { query: mockQuery };
    getDb.mockReturnValue(mockDb);

    // Load email queue module
    emailQueue = require('../../../services/emailQueue');

    // Stop any running processor
    emailQueue.stopProcessor();
  });

  afterEach(() => {
    // Ensure processor is stopped after each test
    emailQueue.stopProcessor();
  });

  describe('queueEmail', () => {
    test('should queue email successfully', async () => {
      mockQuery.mockResolvedValue([{ insertId: 123 }]);

      const result = await emailQueue.queueEmail('booking-confirmation', 'test@example.com', {
        client_name: 'John Doe',
      });

      expect(result).toBe(123);
      expect(mockQuery).toHaveBeenCalled();
      const query = mockQuery.mock.calls[0][0];
      expect(query).toContain('INSERT INTO email_queue');
    });

    test('should serialize data as JSON', async () => {
      mockQuery.mockResolvedValue([{ insertId: 456 }]);

      const data = {
        client_name: 'Jane Doe',
        appointment_date: '2025-12-15',
        nested: { value: 'test' },
      };

      await emailQueue.queueEmail('test-type', 'jane@example.com', data);

      const callArgs = mockQuery.mock.calls[0][1];
      expect(callArgs[2]).toBe(JSON.stringify(data));
    });

    test('should set status to pending and attempts to 0', async () => {
      mockQuery.mockResolvedValue([{ insertId: 789 }]);

      await emailQueue.queueEmail('test', 'test@example.com', {});

      const query = mockQuery.mock.calls[0][0];
      expect(query).toContain("'pending'");
    });

    test('should throw error when database insert fails', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(emailQueue.queueEmail('test', 'test@example.com', {})).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('processQueue', () => {
    test('should process pending emails', async () => {
      const pendingEmails = [
        {
          id: 1,
          email_type: 'booking-confirmation',
          recipient: 'test1@example.com',
          data: { client_name: 'Test 1' },
          attempts: 0,
        },
      ];

      mockQuery
        .mockResolvedValueOnce([pendingEmails]) // SELECT pending emails
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE to 'sent'

      emailService.sendBookingConfirmation.mockResolvedValue({ success: true });

      await emailQueue.processQueue();

      // Verify SELECT was called
      const selectCall = mockQuery.mock.calls[0][0];
      expect(selectCall).toContain('SELECT * FROM email_queue');

      // Verify email was sent
      expect(emailService.sendBookingConfirmation).toHaveBeenCalledWith(pendingEmails[0].data);
    });

    test('should skip processing if already in progress', async () => {
      const pendingEmails = [
        {
          id: 1,
          email_type: 'booking-confirmation',
          recipient: 'test@example.com',
          data: {},
          attempts: 0,
        },
      ];

      let callCount = 0;
      mockQuery.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve([pendingEmails]);
        }
        return Promise.resolve([{ affectedRows: 1 }]);
      });

      emailService.sendBookingConfirmation.mockImplementation(() => {
        return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 50));
      });

      // Start first processing
      const promise1 = emailQueue.processQueue();

      // Try to start second processing immediately
      await new Promise((resolve) => setTimeout(resolve, 10));
      const promise2 = emailQueue.processQueue();

      await Promise.all([promise1, promise2]);

      // Should only process once
      expect(emailService.sendBookingConfirmation).toHaveBeenCalledTimes(1);
    });

    test('should handle empty queue gracefully', async () => {
      mockQuery.mockResolvedValue([[]]); // Empty pending emails

      await expect(emailQueue.processQueue()).resolves.not.toThrow();
    });

    test('should limit to 10 emails per batch', async () => {
      mockQuery.mockResolvedValue([[]]);

      await emailQueue.processQueue();

      const query = mockQuery.mock.calls[0][0];
      expect(query).toContain('LIMIT 10');
    });

    test('should order by created_at ASC', async () => {
      mockQuery.mockResolvedValue([[]]);

      await emailQueue.processQueue();

      const query = mockQuery.mock.calls[0][0];
      expect(query).toContain('ORDER BY created_at ASC');
    });

    test('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValue(new Error('Database connection lost'));

      await expect(emailQueue.processQueue()).resolves.not.toThrow();
    });
  });

  describe('processEmail - email type handling', () => {
    test('should handle all email types', async () => {
      const emailTypes = [
        { type: 'booking-confirmation', method: 'sendBookingConfirmation' },
        { type: 'admin-notification', method: 'sendAdminNotification' },
        { type: 'appointment-confirmed', method: 'sendAppointmentConfirmed' },
        { type: 'appointment-declined', method: 'sendAppointmentDeclined' },
        { type: 'appointment-reminder', method: 'sendAppointmentReminder' },
        { type: 'cancellation-confirmation', method: 'sendCancellationConfirmation' },
      ];

      for (const { type, method } of emailTypes) {
        jest.clearAllMocks();

        const queueItem = {
          id: 1,
          email_type: type,
          recipient: 'test@example.com',
          data: { client_name: 'Test' },
          attempts: 0,
        };

        mockQuery.mockResolvedValueOnce([[queueItem]]).mockResolvedValue([{ affectedRows: 1 }]);

        emailService[method].mockResolvedValue({ success: true });

        await emailQueue.processQueue();

        expect(emailService[method]).toHaveBeenCalledWith(queueItem.data);
      }
    });

    test('should handle unknown email type', async () => {
      const queueItem = {
        id: 6,
        email_type: 'unknown-type',
        recipient: 'test@example.com',
        data: {},
        attempts: 0,
      };

      mockQuery.mockResolvedValueOnce([[queueItem]]).mockResolvedValue([{ affectedRows: 1 }]);

      await emailQueue.processQueue();

      // Should update with error (attempts incremented)
      const updateCalls = mockQuery.mock.calls.filter(
        (call) => call[0].includes('UPDATE') && call[0].includes('attempts')
      );
      expect(updateCalls.length).toBeGreaterThan(0);
    });
  });

  describe('processEmail - retry logic', () => {
    test('should increment attempts on failure', async () => {
      const queueItem = {
        id: 1,
        email_type: 'booking-confirmation',
        recipient: 'test@example.com',
        data: {},
        attempts: 0,
      };

      mockQuery.mockResolvedValueOnce([[queueItem]]).mockResolvedValue([{ affectedRows: 1 }]);
      emailService.sendBookingConfirmation.mockRejectedValue(new Error('SMTP error'));

      await emailQueue.processQueue();

      // Should update with attempts = 1
      const updateCalls = mockQuery.mock.calls.filter((call) =>
        call[0].includes('SET attempts = ?')
      );
      expect(updateCalls.length).toBeGreaterThan(0);
      expect(updateCalls[0][1][0]).toBe(1);
    });

    test('should mark as failed after max retries', async () => {
      const queueItem = {
        id: 1,
        email_type: 'booking-confirmation',
        recipient: 'test@example.com',
        data: {},
        attempts: 2, // Already tried twice
      };

      mockQuery.mockResolvedValueOnce([[queueItem]]).mockResolvedValue([{ affectedRows: 1 }]);
      emailService.sendBookingConfirmation.mockRejectedValue(new Error('SMTP error'));

      await emailQueue.processQueue();

      // Should mark as failed (attempts = 3)
      const updateCalls = mockQuery.mock.calls.filter((call) =>
        call[0].includes("status = 'failed'")
      );
      expect(updateCalls.length).toBeGreaterThan(0);
    });

    test('should set next_attempt_at for retry', async () => {
      const queueItem = {
        id: 1,
        email_type: 'booking-confirmation',
        recipient: 'test@example.com',
        data: {},
        attempts: 0,
      };

      mockQuery.mockResolvedValueOnce([[queueItem]]).mockResolvedValue([{ affectedRows: 1 }]);
      emailService.sendBookingConfirmation.mockRejectedValue(new Error('Temporary error'));

      await emailQueue.processQueue();

      // Should set next_attempt_at
      const updateCalls = mockQuery.mock.calls.filter((call) =>
        call[0].includes('next_attempt_at')
      );
      expect(updateCalls.length).toBeGreaterThan(0);
    });

    test('should store error message', async () => {
      const queueItem = {
        id: 1,
        email_type: 'booking-confirmation',
        recipient: 'test@example.com',
        data: {},
        attempts: 0,
      };

      mockQuery.mockResolvedValueOnce([[queueItem]]).mockResolvedValue([{ affectedRows: 1 }]);
      emailService.sendBookingConfirmation.mockRejectedValue(new Error('Connection timeout'));

      await emailQueue.processQueue();

      // Should store error message
      const updateCalls = mockQuery.mock.calls.filter((call) => call[0].includes('error_message'));
      expect(updateCalls.length).toBeGreaterThan(0);
    });
  });

  describe('getQueueStats', () => {
    test('should return queue statistics', async () => {
      mockQuery
        .mockResolvedValueOnce([
          [
            // Status counts
            { status: 'pending', count: 5 },
            { status: 'sent', count: 100 },
            { status: 'failed', count: 3 },
          ],
        ])
        .mockResolvedValueOnce([
          [
            // Total count
            { total: 108 },
          ],
        ])
        .mockResolvedValueOnce([
          [
            // Failed last 24h
            { count: 2 },
          ],
        ]);

      const stats = await emailQueue.getQueueStats();

      expect(stats).toEqual({
        byStatus: {
          pending: 5,
          sent: 100,
          failed: 3,
        },
        total: 108,
        failedLast24h: 2,
      });
    });

    test('should handle empty queue', async () => {
      mockQuery
        .mockResolvedValueOnce([[]]) // No status counts
        .mockResolvedValueOnce([[{ total: 0 }]]) // Zero total
        .mockResolvedValueOnce([[{ count: 0 }]]); // Zero failed

      const stats = await emailQueue.getQueueStats();

      expect(stats).toEqual({
        byStatus: {},
        total: 0,
        failedLast24h: 0,
      });
    });

    test('should throw error on database failure', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(emailQueue.getQueueStats()).rejects.toThrow('Database error');
    });
  });

  describe('retryFailedEmails', () => {
    test('should reset failed emails to pending', async () => {
      mockQuery.mockResolvedValue([{ affectedRows: 5 }]);

      const result = await emailQueue.retryFailedEmails(10);

      expect(result).toBe(5);
      const query = mockQuery.mock.calls[0][0];
      expect(query).toContain("SET status = 'pending'");
      expect(query).toContain('attempts = 0');
    });

    test('should use default limit of 10', async () => {
      mockQuery.mockResolvedValue([{ affectedRows: 3 }]);

      await emailQueue.retryFailedEmails();

      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), [10]);
    });

    test('should clear error_message and next_attempt_at', async () => {
      mockQuery.mockResolvedValue([{ affectedRows: 2 }]);

      await emailQueue.retryFailedEmails(5);

      const query = mockQuery.mock.calls[0][0];
      expect(query).toContain('error_message = NULL');
      expect(query).toContain('next_attempt_at = NULL');
    });

    test('should order by created_at DESC', async () => {
      mockQuery.mockResolvedValue([{ affectedRows: 1 }]);

      await emailQueue.retryFailedEmails();

      const query = mockQuery.mock.calls[0][0];
      expect(query).toContain('ORDER BY created_at DESC');
    });

    test('should throw error on database failure', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(emailQueue.retryFailedEmails()).rejects.toThrow('Database error');
    });
  });

  describe('cleanOldEmails', () => {
    test('should delete old sent and failed emails', async () => {
      mockQuery.mockResolvedValue([{ affectedRows: 15 }]);

      const result = await emailQueue.cleanOldEmails(30);

      expect(result).toBe(15);
      const query = mockQuery.mock.calls[0][0];
      expect(query).toContain("WHERE status IN ('sent', 'failed')");
    });

    test('should use default of 30 days', async () => {
      mockQuery.mockResolvedValue([{ affectedRows: 10 }]);

      await emailQueue.cleanOldEmails();

      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), [30]);
    });

    test('should use custom days parameter', async () => {
      mockQuery.mockResolvedValue([{ affectedRows: 5 }]);

      await emailQueue.cleanOldEmails(7);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INTERVAL ? DAY'), [7]);
    });

    test('should not delete pending emails', async () => {
      mockQuery.mockResolvedValue([{ affectedRows: 0 }]);

      await emailQueue.cleanOldEmails();

      const query = mockQuery.mock.calls[0][0];
      expect(query).toContain("status IN ('sent', 'failed')");
      expect(query).not.toContain('pending');
    });

    test('should throw error on database failure', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(emailQueue.cleanOldEmails()).rejects.toThrow('Database error');
    });
  });
});
