/**
 * Integration Tests - Appointments API
 * Tests for appointment booking API endpoints
 */

const request = require('supertest');
const { clearTestDatabase, query } = require('../../helpers/database');
const { createAppointmentData, getFutureWorkingDate } = require('../../helpers/fixtures');
const { createTestApp } = require('../../helpers/testApp');
const { getTestDatabase } = require('../../helpers/testDatabase');

// Mock email queue to prevent sending emails during tests
jest.mock('../../../services/emailQueue');

describe('Appointments API Integration Tests', () => {
  let app;

  beforeAll(async () => {
    // Initialize shared test database pool
    await getTestDatabase();

    // Create Express app with routes and middleware
    app = createTestApp();
  });

  beforeEach(async () => {
    // Clear database before each test
    await clearTestDatabase();
  });

  describe('POST /api/appointments/book', () => {
    test('should create appointment successfully', async () => {
      const appointmentData = createAppointmentData({
        appointment_date: getFutureWorkingDate(2),
        appointment_time: '10:00:00',
      });

      const response = await request(app)
        .post('/api/appointments/book')
        .send(appointmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        status: 'pending',
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentData.appointment_time,
        service_type: appointmentData.service_type,
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.cancellation_token).toBeDefined();

      // Verify in database
      const [rows] = await query('SELECT * FROM appointments WHERE id = ?', [
        response.body.data.id,
      ]);
      expect(rows.length).toBe(1);
      expect(rows[0].client_email).toBe(appointmentData.client_email);
    });

    test('should reject appointment with invalid email', async () => {
      const appointmentData = createAppointmentData({
        client_email: 'invalid-email',
      });

      const response = await request(app)
        .post('/api/appointments/book')
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.client_email).toBeDefined();
    });

    test('should reject appointment with invalid phone', async () => {
      const appointmentData = createAppointmentData({
        client_phone: '123',
      });

      const response = await request(app)
        .post('/api/appointments/book')
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.client_phone).toBeDefined();
    });

    test('should reject duplicate booking for same slot', async () => {
      const appointmentData = createAppointmentData({
        appointment_date: getFutureWorkingDate(2),
        appointment_time: '10:00:00',
      });

      // First booking should succeed
      await request(app).post('/api/appointments/book').send(appointmentData).expect(201);

      // Second booking for same slot should fail
      const response = await request(app)
        .post('/api/appointments/book')
        .send({
          ...appointmentData,
          client_email: 'different@example.com',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    test('should reject missing required fields', async () => {
      const response = await request(app).post('/api/appointments/book').send({}).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(Object.keys(response.body.errors).length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/appointments/:token', () => {
    test('should return appointment by valid token', async () => {
      // Create appointment first
      const appointmentData = createAppointmentData({
        appointment_date: getFutureWorkingDate(2),
      });

      const createResponse = await request(app)
        .post('/api/appointments/book')
        .send(appointmentData)
        .expect(201);

      const token = createResponse.body.data.cancellation_token;

      // Get appointment by token
      const response = await request(app).get(`/api/appointments/${token}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        client_email: appointmentData.client_email,
        status: 'pending',
      });
    });

    test('should return 404 for invalid token', async () => {
      const response = await request(app)
        .get('/api/appointments/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should reject token with invalid format', async () => {
      const response = await request(app).get('/api/appointments/short').expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/appointments/cancel/:token', () => {
    test('should cancel appointment successfully', async () => {
      // Create appointment
      const appointmentData = createAppointmentData({
        appointment_date: getFutureWorkingDate(2),
      });

      const createResponse = await request(app)
        .post('/api/appointments/book')
        .send(appointmentData)
        .expect(201);

      const token = createResponse.body.data.cancellation_token;

      // Cancel appointment
      const response = await request(app).post(`/api/appointments/${token}/cancel`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();

      // Verify in database
      const [rows] = await query('SELECT * FROM appointments WHERE cancellation_token = ?', [
        token,
      ]);
      expect(rows[0].status).toBe('cancelled');
    });

    test('should return 404 for non-existent token', async () => {
      const response = await request(app)
        .post('/api/appointments/00000000-0000-0000-0000-000000000000/cancel')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should not allow cancelling already cancelled appointment', async () => {
      // Create and cancel appointment
      const appointmentData = createAppointmentData({
        appointment_date: getFutureWorkingDate(2),
      });

      const createResponse = await request(app)
        .post('/api/appointments/book')
        .send(appointmentData)
        .expect(201);

      const token = createResponse.body.data.cancellation_token;

      await request(app).post(`/api/appointments/${token}/cancel`).expect(200);

      // Try to cancel again
      const response = await request(app).post(`/api/appointments/${token}/cancel`).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });
  });
});
