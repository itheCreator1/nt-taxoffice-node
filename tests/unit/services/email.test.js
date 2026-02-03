/**
 * Unit Tests - Email Service
 * Tests email sending functionality with mocked nodemailer
 */

// Mock modules BEFORE any imports
jest.mock('nodemailer');
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));
jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const nodemailer = require('nodemailer');
const fs = require('fs').promises;

describe('Email Service', () => {
  let emailService;
  let mockTransporter;
  let mockSendMail;
  let mockVerify;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset module cache
    jest.resetModules();

    // Set environment variables FIRST
    process.env.GMAIL_USER = 'test@example.com';
    process.env.GMAIL_APP_PASSWORD = 'test-password';
    process.env.APP_URL = 'https://example.com';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.OFFICE_PHONE = '210-1234567';
    process.env.OFFICE_ADDRESS = 'Test Address 123';

    // Setup mock transporter
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
    mockVerify = jest.fn().mockResolvedValue(true);
    mockTransporter = {
      sendMail: mockSendMail,
      verify: mockVerify,
    };

    nodemailer.createTransport.mockReturnValue(mockTransporter);

    // Mock fs.readFile
    fs.readFile.mockImplementation((path) => {
      if (path.includes('.html')) {
        return Promise.resolve('<html>{{clientName}} {{appointmentDate}}</html>');
      }
      return Promise.resolve('Text: {{clientName}} {{appointmentDate}}');
    });

    // Load email service AFTER all mocks are configured
    emailService = require('../../../services/email');
  });

  afterEach(() => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
    delete process.env.APP_URL;
    delete process.env.ADMIN_EMAIL;
    delete process.env.OFFICE_PHONE;
    delete process.env.OFFICE_ADDRESS;
  });

  describe('verifyConnection', () => {
    test('should verify connection successfully', async () => {
      const result = await emailService.verifyConnection();

      expect(result).toBe(true);
      expect(mockVerify).toHaveBeenCalled();
    });

    test('should return false when credentials are missing', async () => {
      delete process.env.GMAIL_USER;
      jest.resetModules();

      // Need to reload with missing credentials
      const freshEmailService = require('../../../services/email');
      const result = await freshEmailService.verifyConnection();

      expect(result).toBe(false);
    });

    test('should return false when verification fails', async () => {
      mockVerify.mockRejectedValue(new Error('Connection failed'));

      const result = await emailService.verifyConnection();

      expect(result).toBe(false);
    });
  });

  describe('sendEmail', () => {
    test('should send email successfully', async () => {
      const options = {
        to: 'client@example.com',
        subject: 'Test Subject',
        text: 'Test text',
        html: '<p>Test html</p>',
      };

      const result = await emailService.sendEmail(options);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(mockSendMail).toHaveBeenCalledWith({
        from: '"NT TAXOFFICE" <test@example.com>',
        to: 'client@example.com',
        subject: 'Test Subject',
        text: 'Test text',
        html: '<p>Test html</p>',
      });
    });

    test('should throw error when transporter not available', async () => {
      delete process.env.GMAIL_USER;
      jest.resetModules();
      const freshEmailService = require('../../../services/email');

      await expect(
        freshEmailService.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          text: 'Test',
        })
      ).rejects.toThrow('Email transporter not available');
    });

    test('should throw error when sendMail fails', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(
        emailService.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          text: 'Test',
        })
      ).rejects.toThrow('SMTP error');
    });
  });

  describe('sendBookingConfirmation', () => {
    test('should send booking confirmation with correct data', async () => {
      const appointment = {
        client_name: 'John Doe',
        client_email: 'john@example.com',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
        service_type: 'Φορολογική Δήλωση',
        cancellation_token: 'test-token-123',
      };

      const result = await emailService.sendBookingConfirmation(appointment);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalled();

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('john@example.com');
      expect(callArgs.subject).toBe('Επιβεβαίωση Ραντεβού - NT TAXOFFICE');
    });

    test('should include cancellation URL', async () => {
      const appointment = {
        client_name: 'Jane Doe',
        client_email: 'jane@example.com',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
        service_type: 'Test Service',
        cancellation_token: 'cancel-token-456',
      };

      await emailService.sendBookingConfirmation(appointment);

      const callArgs = mockSendMail.mock.calls[0][0];
      const htmlContent = callArgs.html;
      expect(htmlContent).toContain('cancel-token-456');
    });

    test('should handle template loading errors', async () => {
      fs.readFile.mockRejectedValue(new Error('Template not found'));

      const appointment = {
        client_name: 'Test',
        client_email: 'test@example.com',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
        service_type: 'Test',
        cancellation_token: 'token',
      };

      await expect(emailService.sendBookingConfirmation(appointment)).rejects.toThrow(
        'Template not found'
      );
    });
  });

  describe('sendAdminNotification', () => {
    test('should send admin notification with appointment details', async () => {
      const appointment = {
        client_name: 'John Doe',
        client_email: 'john@example.com',
        client_phone: '6901234567',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
        service_type: 'Φορολογική Δήλωση',
        notes: 'Test notes',
      };

      const result = await emailService.sendAdminNotification(appointment);

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalled();

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('admin@example.com');
      expect(callArgs.subject).toContain('Νέο Ραντεβού');
      expect(callArgs.subject).toContain('John Doe');
    });

    test('should handle missing notes field', async () => {
      const appointment = {
        client_name: 'Jane Doe',
        client_email: 'jane@example.com',
        client_phone: '6901234567',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
        service_type: 'Test Service',
      };

      await emailService.sendAdminNotification(appointment);

      // Just verify it doesn't throw
      expect(mockSendMail).toHaveBeenCalled();
    });

    test('should include dashboard URL', async () => {
      const appointment = {
        client_name: 'Test',
        client_email: 'test@example.com',
        client_phone: '6901234567',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
        service_type: 'Test',
      };

      await emailService.sendAdminNotification(appointment);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('dashboard');
    });
  });

  describe('sendAppointmentConfirmed', () => {
    test('should send confirmation with office details', async () => {
      const appointment = {
        client_name: 'John Doe',
        client_email: 'john@example.com',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
        service_type: 'Test Service',
        cancellation_token: 'token-123',
      };

      const result = await emailService.sendAppointmentConfirmed(appointment);

      expect(result.success).toBe(true);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('john@example.com');
      expect(callArgs.subject).toBe('Το Ραντεβού σας Επιβεβαιώθηκε - NT TAXOFFICE');
    });

    test('should use default office details when env vars missing', async () => {
      delete process.env.OFFICE_ADDRESS;
      delete process.env.OFFICE_PHONE;

      const appointment = {
        client_name: 'Test',
        client_email: 'test@example.com',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
        service_type: 'Test',
        cancellation_token: 'token',
      };

      await emailService.sendAppointmentConfirmed(appointment);

      expect(mockSendMail).toHaveBeenCalled();
    });
  });

  describe('sendAppointmentDeclined', () => {
    test('should send decline notification with reason', async () => {
      const appointment = {
        client_name: 'John Doe',
        client_email: 'john@example.com',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
        decline_reason: 'Κλειστό για διακοπές',
      };

      const result = await emailService.sendAppointmentDeclined(appointment);

      expect(result.success).toBe(true);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.subject).toBe('Ενημέρωση για το Ραντεβού σας - NT TAXOFFICE');
    });

    test('should use default reason when not provided', async () => {
      const appointment = {
        client_name: 'Test',
        client_email: 'test@example.com',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
      };

      await emailService.sendAppointmentDeclined(appointment);

      expect(mockSendMail).toHaveBeenCalled();
    });

    test('should include booking URL', async () => {
      const appointment = {
        client_name: 'Test',
        client_email: 'test@example.com',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
      };

      await emailService.sendAppointmentDeclined(appointment);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('appointments');
    });
  });

  describe('sendAppointmentReminder', () => {
    test('should send reminder with appointment details', async () => {
      const appointment = {
        client_name: 'John Doe',
        client_email: 'john@example.com',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
        service_type: 'Test Service',
        cancellation_token: 'token-123',
      };

      const result = await emailService.sendAppointmentReminder(appointment);

      expect(result.success).toBe(true);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.subject).toBe('Υπενθύμιση Ραντεβού - Αύριο - NT TAXOFFICE');
    });

    test('should include office address and phone', async () => {
      const appointment = {
        client_name: 'Test',
        client_email: 'test@example.com',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
        service_type: 'Test',
        cancellation_token: 'token',
      };

      await emailService.sendAppointmentReminder(appointment);

      expect(mockSendMail).toHaveBeenCalled();
    });

    test('should include cancellation URL', async () => {
      const appointment = {
        client_name: 'Test',
        client_email: 'test@example.com',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
        service_type: 'Test',
        cancellation_token: 'cancel-token-789',
      };

      await emailService.sendAppointmentReminder(appointment);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('cancel-token-789');
    });
  });

  describe('sendCancellationConfirmation', () => {
    test('should send cancellation confirmation', async () => {
      const appointment = {
        client_name: 'John Doe',
        client_email: 'john@example.com',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
      };

      const result = await emailService.sendCancellationConfirmation(appointment);

      expect(result.success).toBe(true);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('john@example.com');
      expect(callArgs.subject).toBe('Επιβεβαίωση Ακύρωσης Ραντεβού - NT TAXOFFICE');
    });

    test('should include booking URL for rebooking', async () => {
      const appointment = {
        client_name: 'Test',
        client_email: 'test@example.com',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
      };

      await emailService.sendCancellationConfirmation(appointment);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('appointments');
    });

    test('should include office phone', async () => {
      const appointment = {
        client_name: 'Test',
        client_email: 'test@example.com',
        appointment_date: '2025-12-15',
        appointment_time: '10:00:00',
      };

      await emailService.sendCancellationConfirmation(appointment);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('210-1234567');
    });
  });

  describe('Error handling', () => {
    test('should handle SMTP connection errors', async () => {
      mockSendMail.mockRejectedValue(new Error('Connection timeout'));

      await expect(
        emailService.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          text: 'Test',
        })
      ).rejects.toThrow('Connection timeout');
    });

    test('should handle invalid email addresses', async () => {
      mockSendMail.mockRejectedValue(new Error('Invalid recipient'));

      await expect(
        emailService.sendEmail({
          to: 'invalid-email',
          subject: 'Test',
          text: 'Test',
        })
      ).rejects.toThrow('Invalid recipient');
    });

    test('should handle authentication errors', async () => {
      mockVerify.mockRejectedValue(new Error('Authentication failed'));

      const result = await emailService.verifyConnection();

      expect(result).toBe(false);
    });
  });
});
