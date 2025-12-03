/**
 * Integration Tests - Admin Availability API
 * Tests for admin availability settings and blocked dates management
 */

const request = require('supertest');
const { clearTestDatabase } = require('../../helpers/database');
const { createTestApp } = require('../../helpers/testApp');
const { getDb } = require('../../../services/database');
const { toMySQLDate } = require('../../../utils/timezone');
const { getTestDatabase } = require('../../helpers/testDatabase');
const { seedAdminUser } = require('../../helpers/seeders');

jest.mock('../../../services/emailQueue');

describe('Admin Availability API Integration Tests', () => {
    let app;
    let agent;
    let adminCredentials;

    beforeAll(async () => {
        await getTestDatabase();
        app = createTestApp();

        // Create admin once and login once for all tests
        adminCredentials = await seedAdminUser({
            username: 'admin',
            password: 'SecurePass123!',
            email: 'admin@example.com'
        });

        // Create agent and login once
        agent = request.agent(app);
        await agent
            .post('/api/admin/login')
            .send({
                username: adminCredentials.username,
                password: adminCredentials.password
            });
    });

    beforeEach(async () => {
        await clearTestDatabase();

        // Re-seed admin user (DB was cleared, but session is still valid)
        await seedAdminUser({
            username: adminCredentials.username,
            password: adminCredentials.password,
            email: adminCredentials.email
        });
    });

    describe('GET /api/admin/availability/settings', () => {
        test('should return availability settings for all 7 days', async () => {
            const response = await agent
                .get('/api/admin/availability/settings')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.days).toHaveLength(7);
            expect(response.body.data.days[0]).toHaveProperty('day_of_week');
            expect(response.body.data.days[0]).toHaveProperty('is_working_day');
            expect(response.body.data.days[0]).toHaveProperty('start_time');
            expect(response.body.data.days[0]).toHaveProperty('end_time');
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .get('/api/admin/availability/settings')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should return days in order (0-6)', async () => {
            const response = await agent
                .get('/api/admin/availability/settings')
                .expect(200);

            const days = response.body.data.days;
            for (let i = 0; i < days.length; i++) {
                expect(days[i].day_of_week).toBe(i);
            }
        });

        test('should return boolean for is_working_day', async () => {
            const response = await agent
                .get('/api/admin/availability/settings')
                .expect(200);

            const days = response.body.data.days;
            days.forEach(day => {
                expect(typeof day.is_working_day).toBe('boolean');
            });
        });
    });

    describe('PUT /api/admin/availability/settings', () => {
        test('should update availability settings successfully', async () => {
            const settings = {
                days: [
                    { day_of_week: 0, is_working_day: false, start_time: null, end_time: null },
                    { day_of_week: 1, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 2, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 3, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 4, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 5, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 6, is_working_day: false, start_time: null, end_time: null }
                ]
            };

            const response = await agent
                .put('/api/admin/availability/settings')
                .send(settings)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('ενημερώθηκαν επιτυχώς');

            // Verify in database
            const db = getDb();
            const [rows] = await db.query('SELECT * FROM availability_settings WHERE day_of_week = 1');
            expect(rows[0].is_working_day).toBe(1);
            expect(rows[0].start_time).toBe('09:00:00');
            expect(rows[0].end_time).toBe('17:00:00');
        });

        test('should require all 7 days', async () => {
            const settings = {
                days: [
                    { day_of_week: 0, is_working_day: false, start_time: null, end_time: null },
                    { day_of_week: 1, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' }
                ]
            };

            const response = await agent
                .put('/api/admin/availability/settings')
                .send(settings)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('7 ημέρες');
        });

        test('should reject working day without start time', async () => {
            const settings = {
                days: [
                    { day_of_week: 0, is_working_day: false, start_time: null, end_time: null },
                    { day_of_week: 1, is_working_day: true, start_time: null, end_time: '17:00:00' },
                    { day_of_week: 2, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 3, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 4, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 5, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 6, is_working_day: false, start_time: null, end_time: null }
                ]
            };

            const response = await agent
                .put('/api/admin/availability/settings')
                .send(settings)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('ώρες λειτουργίας');
        });

        test('should reject working day without end time', async () => {
            const settings = {
                days: [
                    { day_of_week: 0, is_working_day: false, start_time: null, end_time: null },
                    { day_of_week: 1, is_working_day: true, start_time: '09:00:00', end_time: null },
                    { day_of_week: 2, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 3, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 4, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 5, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 6, is_working_day: false, start_time: null, end_time: null }
                ]
            };

            const response = await agent
                .put('/api/admin/availability/settings')
                .send(settings)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('ώρες λειτουργίας');
        });

        test('should allow non-working day without hours', async () => {
            const settings = {
                days: [
                    { day_of_week: 0, is_working_day: false, start_time: null, end_time: null },
                    { day_of_week: 1, is_working_day: false, start_time: null, end_time: null },
                    { day_of_week: 2, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 3, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 4, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 5, is_working_day: true, start_time: '09:00:00', end_time: '17:00:00' },
                    { day_of_week: 6, is_working_day: false, start_time: null, end_time: null }
                ]
            };

            const response = await agent
                .put('/api/admin/availability/settings')
                .send(settings)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('should require authentication', async () => {
            const settings = {
                days: Array(7).fill(null).map((_, i) => ({
                    day_of_week: i,
                    is_working_day: true,
                    start_time: '09:00:00',
                    end_time: '17:00:00'
                }))
            };

            const response = await request(app)
                .put('/api/admin/availability/settings')
                .send(settings)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('should update existing settings not create duplicates', async () => {
            const settings = {
                days: Array(7).fill(null).map((_, i) => ({
                    day_of_week: i,
                    is_working_day: i > 0 && i < 6,
                    start_time: i > 0 && i < 6 ? '09:00:00' : null,
                    end_time: i > 0 && i < 6 ? '17:00:00' : null
                }))
            };

            // Update twice
            await agent.put('/api/admin/availability/settings').send(settings);
            await agent.put('/api/admin/availability/settings').send(settings);

            // Verify still only 7 rows
            const db = getDb();
            const [rows] = await db.query('SELECT COUNT(*) as count FROM availability_settings');
            expect(rows[0].count).toBe(7);
        });
    });

    describe('GET /api/admin/availability/blocked-dates', () => {
        beforeEach(async () => {
            const db = getDb();
            await db.query(
                `INSERT INTO blocked_dates (blocked_date, reason, created_at)
                VALUES
                ('2025-12-25', 'Christmas', NOW()),
                ('2026-01-01', 'New Year', NOW()),
                ('2024-12-20', 'Past date', NOW())`
            );
        });

        test('should return only future blocked dates', async () => {
            const response = await agent
                .get('/api/admin/availability/blocked-dates')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(0);
            // All returned dates should be >= today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            response.body.data.forEach(item => {
                const blockedDate = new Date(item.blocked_date);
                expect(blockedDate >= today || item.blocked_date === toMySQLDate(today)).toBe(true);
            });
        });

        test('should return blocked dates in ascending order', async () => {
            const response = await agent
                .get('/api/admin/availability/blocked-dates')
                .expect(200);

            expect(response.body.success).toBe(true);
            const dates = response.body.data.map(d => d.blocked_date);
            const sortedDates = [...dates].sort();
            expect(dates).toEqual(sortedDates);
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .get('/api/admin/availability/blocked-dates')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/admin/availability/blocked-dates', () => {
        test('should add blocked date successfully', async () => {
            const response = await agent
                .post('/api/admin/availability/blocked-dates')
                .send({
                    blocked_date: '2025-12-25',
                    reason: 'Christmas Holiday'
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('αποκλείστηκε επιτυχώς');
            expect(response.body.data).toMatchObject({
                id: expect.any(Number),
                blocked_date: '2025-12-25',
                reason: 'Christmas Holiday'
            });

            // Verify in database
            const db = getDb();
            const [rows] = await db.query('SELECT * FROM blocked_dates WHERE blocked_date = ?', ['2025-12-25']);
            expect(rows).toHaveLength(1);
            expect(rows[0].reason).toBe('Christmas Holiday');
        });

        test('should add blocked date without reason', async () => {
            const response = await agent
                .post('/api/admin/availability/blocked-dates')
                .send({
                    blocked_date: '2025-12-25'
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.reason).toBeNull();
        });

        test('should reject missing blocked_date', async () => {
            const response = await agent
                .post('/api/admin/availability/blocked-dates')
                .send({
                    reason: 'Holiday'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('υποχρεωτική');
        });

        test('should reject duplicate blocked date', async () => {
            const date = '2025-12-25';

            // Add first time
            await agent
                .post('/api/admin/availability/blocked-dates')
                .send({ blocked_date: date, reason: 'First' })
                .expect(201);

            // Try to add again
            const response = await agent
                .post('/api/admin/availability/blocked-dates')
                .send({ blocked_date: date, reason: 'Second' })
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('ήδη αποκλεισμένη');
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .post('/api/admin/availability/blocked-dates')
                .send({ blocked_date: '2025-12-25', reason: 'Holiday' })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/admin/availability/blocked-dates/:id', () => {
        let blockedDateId;

        beforeEach(async () => {
            const db = getDb();
            const [result] = await db.query(
                `INSERT INTO blocked_dates (blocked_date, reason, created_at)
                VALUES ('2025-12-25', 'Christmas', NOW())`
            );
            blockedDateId = result.insertId;
        });

        test('should remove blocked date successfully', async () => {
            const response = await agent
                .delete(`/api/admin/availability/blocked-dates/${blockedDateId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('αφαιρέθηκε');

            // Verify deletion
            const db = getDb();
            const [rows] = await db.query('SELECT * FROM blocked_dates WHERE id = ?', [blockedDateId]);
            expect(rows).toHaveLength(0);
        });

        test('should return 404 for non-existent blocked date', async () => {
            const response = await agent
                .delete('/api/admin/availability/blocked-dates/99999')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('δεν βρέθηκε');
        });

        test('should require authentication', async () => {
            const response = await request(app)
                .delete(`/api/admin/availability/blocked-dates/${blockedDateId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
