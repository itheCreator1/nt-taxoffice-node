/**
 * Integration Tests - Admin Appointments API
 * Tests for admin appointment management endpoints
 */

const request = require('supertest');
const { clearTestDatabase } = require('../../helpers/database');
const { createTestApp } = require('../../helpers/testApp');
const { getDb } = require('../../../services/database');
const { toMySQLDate } = require('../../../utils/timezone');
const { getTestDatabase } = require('../../helpers/testDatabase');
const { seedAdminUser } = require('../../helpers/seeders');

jest.mock('../../../services/emailQueue');

describe('Admin Appointments API Integration Tests', () => {
  let app;
  let agent;
  let adminCredentials;

  beforeAll(async () => {
    await getTestDatabase();
    app = createTestApp();

    // Create admin once and login once for all tests (unique username per test file)
    adminCredentials = await seedAdminUser({
      username: 'admin_appt',
      password: 'SecurePass123!',
      email: 'admin_appt@example.com',
    });

    // Create agent and login once
    agent = request.agent(app);
    await agent.post('/api/admin/login').send({
      username: adminCredentials.username,
      password: adminCredentials.password,
    });
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // Re-seed admin user (DB was cleared, but session is still valid)
    await seedAdminUser({
      username: adminCredentials.username,
      password: adminCredentials.password,
      email: adminCredentials.email,
    });
  });

  describe('GET /api/admin/appointments', () => {
    beforeEach(async () => {
      const db = getDb();
      // Create test appointments
      await db.query(
        `INSERT INTO appointments (client_name, client_email, client_phone,
                 appointment_date, appointment_time, service_type, status, created_at)
                VALUES
                ('John Doe', 'john@example.com', '1234567890', '2025-12-10', '10:00:00', 'tax_declaration', 'pending', NOW()),
                ('Jane Smith', 'jane@example.com', '0987654321', '2025-12-11', '11:00:00', 'consultation', 'confirmed', NOW()),
                ('Bob Wilson', 'bob@example.com', '1112223333', '2025-12-12', '14:00:00', 'tax_declaration', 'completed', NOW()),
                ('Alice Brown', 'alice@example.com', '4445556666', '2025-12-09', '09:00:00', 'consultation', 'declined', NOW())`
      );
    });

    test('should return all appointments with default pagination', async () => {
      const response = await agent.get('/api/admin/appointments').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(4);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 50,
        total: 4,
        totalPages: 1,
      });
    });

    test('should require authentication', async () => {
      const response = await request(app).get('/api/admin/appointments').expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should filter appointments by status', async () => {
      const response = await agent.get('/api/admin/appointments?status=pending').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(1);
      expect(response.body.data.appointments[0].status).toBe('pending');
    });

    test('should filter appointments by date range', async () => {
      const response = await agent
        .get('/api/admin/appointments?startDate=2025-12-10&endDate=2025-12-11')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(2);
    });

    test('should search appointments by client name', async () => {
      const response = await agent.get('/api/admin/appointments?search=John').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(1);
      expect(response.body.data.appointments[0].client_name).toBe('John Doe');
    });

    test('should search appointments by email', async () => {
      const response = await agent
        .get('/api/admin/appointments?search=jane@example.com')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(1);
      expect(response.body.data.appointments[0].client_email).toBe('jane@example.com');
    });

    test('should paginate results correctly', async () => {
      const response = await agent.get('/api/admin/appointments?page=1&limit=2').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 4,
        totalPages: 2,
      });
    });

    test('should sort appointments by date ascending', async () => {
      const response = await agent
        .get('/api/admin/appointments?sortBy=appointment_date&sortOrder=ASC')
        .expect(200);

      expect(response.body.success).toBe(true);
      const dates = response.body.data.appointments.map((a) => a.appointment_date);
      expect(dates[0]).toBe('2025-12-09');
      expect(dates[dates.length - 1]).toBe('2025-12-12');
    });

    test('should combine multiple filters', async () => {
      const response = await agent
        .get('/api/admin/appointments?status=confirmed&startDate=2025-12-11')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(1);
      expect(response.body.data.appointments[0].status).toBe('confirmed');
    });
  });

  describe('GET /api/admin/appointments/stats', () => {
    beforeEach(async () => {
      const db = getDb();
      const today = toMySQLDate(new Date());
      const tomorrow = toMySQLDate(new Date(Date.now() + 86400000));

      await db.query(
        `INSERT INTO appointments (client_name, client_email, client_phone,
                 appointment_date, appointment_time, service_type, status, created_at)
                VALUES
                ('Test 1', 'test1@example.com', '1234567890', ?, '10:00:00', 'tax_declaration', 'pending', NOW()),
                ('Test 2', 'test2@example.com', '0987654321', ?, '11:00:00', 'consultation', 'confirmed', NOW()),
                ('Test 3', 'test3@example.com', '1112223333', '2025-11-01', '14:00:00', 'tax_declaration', 'completed', NOW())`,
        [today, tomorrow]
      );
    });

    test('should return appointment statistics', async () => {
      const response = await agent.get('/api/admin/appointments/stats').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('statusCounts');
      expect(response.body.data).toHaveProperty('upcomingCount');
      expect(response.body.data).toHaveProperty('todayCount');
      expect(response.body.data).toHaveProperty('monthCount');
    });

    test('should require authentication', async () => {
      const response = await request(app).get('/api/admin/appointments/stats').expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should count appointments by status correctly', async () => {
      const response = await agent.get('/api/admin/appointments/stats').expect(200);

      expect(response.body.data.statusCounts.pending).toBe(1);
      expect(response.body.data.statusCounts.confirmed).toBe(1);
      expect(response.body.data.statusCounts.completed).toBe(1);
    });
  });

  describe('GET /api/admin/appointments/:id', () => {
    let appointmentId;

    beforeEach(async () => {
      const db = getDb();
      const [result] = await db.query(
        `INSERT INTO appointments (client_name, client_email, client_phone,
                 appointment_date, appointment_time, service_type, status, notes, created_at)
                VALUES ('John Doe', 'john@example.com', '1234567890', '2025-12-10',
                '10:00:00', 'tax_declaration', 'pending', 'Test notes', NOW())`
      );
      appointmentId = result.insertId;

      // Add history entry
      await db.query(
        `INSERT INTO appointment_history (appointment_id, old_status, new_status, changed_by, changed_at)
                VALUES (?, 'pending', 'confirmed', 'admin', NOW())`,
        [appointmentId]
      );
    });

    test('should return appointment details with history', async () => {
      const response = await agent.get(`/api/admin/appointments/${appointmentId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointment).toMatchObject({
        id: appointmentId,
        client_name: 'John Doe',
        client_email: 'john@example.com',
      });
      expect(response.body.data.history).toHaveLength(1);
      expect(response.body.data.history[0].old_status).toBe('pending');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/admin/appointments/${appointmentId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 for non-existent appointment', async () => {
      const response = await agent.get('/api/admin/appointments/99999').expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('δεν βρέθηκε');
    });
  });

  describe('PUT /api/admin/appointments/:id/status', () => {
    let appointmentId;

    beforeEach(async () => {
      const db = getDb();
      const [result] = await db.query(
        `INSERT INTO appointments (client_name, client_email, client_phone,
                 appointment_date, appointment_time, service_type, status, created_at)
                VALUES ('John Doe', 'john@example.com', '1234567890', '2025-12-10',
                '10:00:00', 'tax_declaration', 'pending', NOW())`
      );
      appointmentId = result.insertId;
    });

    test('should confirm appointment successfully', async () => {
      const response = await agent
        .put(`/api/admin/appointments/${appointmentId}/status`)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.newStatus).toBe('confirmed');
      expect(response.body.data.oldStatus).toBe('pending');

      // Verify in database
      const db = getDb();
      const [rows] = await db.query('SELECT status FROM appointments WHERE id = ?', [
        appointmentId,
      ]);
      expect(rows[0].status).toBe('confirmed');
    });

    test('should decline appointment with reason', async () => {
      const response = await agent
        .put(`/api/admin/appointments/${appointmentId}/status`)
        .send({
          status: 'declined',
          decline_reason: 'No availability',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.newStatus).toBe('declined');
    });

    test('should complete appointment successfully', async () => {
      const response = await agent
        .put(`/api/admin/appointments/${appointmentId}/status`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.newStatus).toBe('completed');
    });

    test('should require decline reason when declining', async () => {
      const response = await agent
        .put(`/api/admin/appointments/${appointmentId}/status`)
        .send({ status: 'declined' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('λόγο απόρριψης');
    });

    test('should reject invalid status', async () => {
      const response = await agent
        .put(`/api/admin/appointments/${appointmentId}/status`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Μη έγκυρη');
    });

    test('should record status change in history', async () => {
      await agent
        .put(`/api/admin/appointments/${appointmentId}/status`)
        .send({ status: 'confirmed' });

      const db = getDb();
      const [history] = await db.query(
        'SELECT * FROM appointment_history WHERE appointment_id = ?',
        [appointmentId]
      );

      expect(history).toHaveLength(1);
      expect(history[0].old_status).toBe('pending');
      expect(history[0].new_status).toBe('confirmed');
      expect(history[0].changed_by).toBe('admin');
    });

    test('should not allow status change for cancelled appointments', async () => {
      const db = getDb();
      await db.query('UPDATE appointments SET status = ? WHERE id = ?', [
        'cancelled',
        appointmentId,
      ]);

      const response = await agent
        .put(`/api/admin/appointments/${appointmentId}/status`)
        .send({ status: 'confirmed' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ακυρωμένου');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/admin/appointments/${appointmentId}/status`)
        .send({ status: 'confirmed' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/admin/appointments/:id', () => {
    let appointmentId;

    beforeEach(async () => {
      const db = getDb();
      const [result] = await db.query(
        `INSERT INTO appointments (client_name, client_email, client_phone,
                 appointment_date, appointment_time, service_type, status, created_at)
                VALUES ('John Doe', 'john@example.com', '1234567890', '2025-12-10',
                '10:00:00', 'tax_declaration', 'pending', NOW())`
      );
      appointmentId = result.insertId;
    });

    test('should update appointment details successfully', async () => {
      const response = await agent
        .put(`/api/admin/appointments/${appointmentId}`)
        .send({
          client_name: 'John Updated',
          client_email: 'updated@example.com',
          notes: 'Updated notes',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify in database
      const db = getDb();
      const [rows] = await db.query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
      expect(rows[0].client_name).toBe('John Updated');
      expect(rows[0].client_email).toBe('updated@example.com');
      expect(rows[0].notes).toBe('Updated notes');
    });

    test('should update appointment date and time', async () => {
      const response = await agent
        .put(`/api/admin/appointments/${appointmentId}`)
        .send({
          appointment_date: '2025-12-15',
          appointment_time: '14:00:00',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      const db = getDb();
      const [rows] = await db.query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
      expect(toMySQLDate(rows[0].appointment_date)).toBe('2025-12-15');
      expect(rows[0].appointment_time).toBe('14:00:00');
    });

    test('should reject update if new time slot is taken', async () => {
      const db = getDb();
      // Create another appointment at target time
      await db.query(
        `INSERT INTO appointments (client_name, client_email, client_phone,
                 appointment_date, appointment_time, service_type, status, created_at)
                VALUES ('Jane Smith', 'jane@example.com', '0987654321', '2025-12-15',
                '14:00:00', 'consultation', 'confirmed', NOW())`
      );

      const response = await agent
        .put(`/api/admin/appointments/${appointmentId}`)
        .send({
          appointment_date: '2025-12-15',
          appointment_time: '14:00:00',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('δεν είναι διαθέσιμη');
    });

    test('should return 400 if no changes provided', async () => {
      const response = await agent
        .put(`/api/admin/appointments/${appointmentId}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Δεν υπάρχουν αλλαγές');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/admin/appointments/${appointmentId}`)
        .send({ client_name: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/admin/appointments/:id', () => {
    let appointmentId;

    beforeEach(async () => {
      const db = getDb();
      const [result] = await db.query(
        `INSERT INTO appointments (client_name, client_email, client_phone,
                 appointment_date, appointment_time, service_type, status, created_at)
                VALUES ('John Doe', 'john@example.com', '1234567890', '2025-12-10',
                '10:00:00', 'tax_declaration', 'pending', NOW())`
      );
      appointmentId = result.insertId;

      // Add history entry
      await db.query(
        `INSERT INTO appointment_history (appointment_id, old_status, new_status, changed_by, changed_at)
                VALUES (?, 'pending', 'confirmed', 'admin', NOW())`,
        [appointmentId]
      );
    });

    test('should delete appointment successfully', async () => {
      const response = await agent.delete(`/api/admin/appointments/${appointmentId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('διαγράφηκε επιτυχώς');

      // Verify deletion
      const db = getDb();
      const [rows] = await db.query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
      expect(rows).toHaveLength(0);
    });

    test('should delete appointment history when deleting appointment', async () => {
      await agent.delete(`/api/admin/appointments/${appointmentId}`).expect(200);

      const db = getDb();
      const [history] = await db.query(
        'SELECT * FROM appointment_history WHERE appointment_id = ?',
        [appointmentId]
      );
      expect(history).toHaveLength(0);
    });

    test('should return 404 for non-existent appointment', async () => {
      const response = await agent.delete('/api/admin/appointments/99999').expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('δεν βρέθηκε');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/admin/appointments/${appointmentId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
