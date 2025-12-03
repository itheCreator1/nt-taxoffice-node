/**
 * Integration Tests - Public Availability API
 * Tests for public availability checking endpoints
 */

const request = require('supertest');
const { clearTestDatabase } = require('../../helpers/database');
const { createTestApp } = require('../../helpers/testApp');
const { getFutureWorkingDate } = require('../../helpers/fixtures');
const { getTestDatabase } = require('../../helpers/testDatabase');

// Mock email queue
jest.mock('../../../services/emailQueue');

describe('Public Availability API Integration Tests', () => {
    let app;

    beforeAll(async () => {
        await getTestDatabase();
        app = createTestApp();
    });

    beforeEach(async () => {
        await clearTestDatabase();
    });

    describe('GET /api/availability/dates', () => {
        test('should return available dates', async () => {
            const response = await request(app)
                .get('/api/availability/dates')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.count).toBeDefined();
        });

        test('should return dates with slots array', async () => {
            const response = await request(app)
                .get('/api/availability/dates')
                .expect(200);

            if (response.body.data.length > 0) {
                const firstDate = response.body.data[0];
                expect(firstDate).toHaveProperty('date');
                expect(firstDate).toHaveProperty('availableSlots');
                expect(Array.isArray(firstDate.availableSlots)).toBe(true);
            }
        });

        test('should return dates within booking window', async () => {
            const response = await request(app)
                .get('/api/availability/dates')
                .expect(200);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const maxDate = new Date();
            maxDate.setDate(maxDate.getDate() + 60);
            maxDate.setHours(23, 59, 59, 999);

            response.body.data.forEach(item => {
                const itemDate = new Date(item.date + 'T00:00:00');
                expect(itemDate >= today).toBe(true);
                expect(itemDate <= maxDate).toBe(true);
            });
        });
    });

    describe('GET /api/availability/slots/:date', () => {
        test('should return available slots for valid future date', async () => {
            const futureDate = getFutureWorkingDate(5);

            const response = await request(app)
                .get(`/api/availability/slots/${futureDate}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.date).toBe(futureDate);
            expect(Array.isArray(response.body.data.slots)).toBe(true);
            expect(response.body.count).toBeDefined();
        });

        test('should return slots in correct format', async () => {
            const futureDate = getFutureWorkingDate(3);

            const response = await request(app)
                .get(`/api/availability/slots/${futureDate}`)
                .expect(200);

            if (response.body.data.slots.length > 0) {
                const firstSlot = response.body.data.slots[0];
                expect(typeof firstSlot).toBe('string');
                expect(firstSlot).toMatch(/^\d{2}:\d{2}(:\d{2})?$/); // HH:MM or HH:MM:SS format
            }
        });

        test('should reject invalid date format', async () => {
            const response = await request(app)
                .get('/api/availability/slots/invalid-date')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBeDefined();
        });

        test('should handle past dates', async () => {
            const pastDate = '2020-01-01';

            const response = await request(app)
                .get(`/api/availability/slots/${pastDate}`)
                .expect(200);

            // API returns slots but they won't be bookable
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('slots');
            expect(Array.isArray(response.body.data.slots)).toBe(true);
        });

        test('should handle weekend dates (if weekends are blocked)', async () => {
            // Find next Saturday
            const date = new Date();
            date.setDate(date.getDate() + ((6 - date.getDay() + 7) % 7 || 7));
            const saturday = date.toISOString().split('T')[0];

            const response = await request(app)
                .get(`/api/availability/slots/${saturday}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            // Weekends should have no slots (based on default availability)
            expect(response.body.data.slots.length).toBe(0);
        });
    });

    describe('POST /api/availability/check', () => {
        test('should check slot availability successfully', async () => {
            const futureDate = getFutureWorkingDate(5);

            const response = await request(app)
                .post('/api/availability/check')
                .send({
                    date: futureDate,
                    time: '10:00'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                date: futureDate,
                time: '10:00',
                available: expect.any(Boolean)
            });
        });

        test('should return availability status for slot', async () => {
            const futureDate = getFutureWorkingDate(10);

            const response = await request(app)
                .post('/api/availability/check')
                .send({
                    date: futureDate,
                    time: '09:00'
                })
                .expect(200);

            // Should return boolean (true or false based on slot status)
            expect(typeof response.body.data.available).toBe('boolean');
        });

        test('should reject request without date', async () => {
            const response = await request(app)
                .post('/api/availability/check')
                .send({
                    time: '10:00'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should reject request without time', async () => {
            const futureDate = getFutureWorkingDate(5);

            const response = await request(app)
                .post('/api/availability/check')
                .send({
                    date: futureDate
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBeDefined();
        });

        test('should reject invalid date format', async () => {
            const response = await request(app)
                .post('/api/availability/check')
                .send({
                    date: 'not-a-date',
                    time: '10:00'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should handle past dates', async () => {
            const response = await request(app)
                .post('/api/availability/check')
                .send({
                    date: '2020-01-01',
                    time: '10:00'
                })
                .expect(200);

            // Past dates should return available: false
            expect(response.body.success).toBe(true);
            expect(response.body.data.available).toBe(false);
        });
    });

    describe('GET /api/availability/next', () => {
        test('should return next available slot', async () => {
            const response = await request(app)
                .get('/api/availability/next')
                .expect(200);

            expect(response.body.success).toBe(true);

            if (response.body.data) {
                expect(response.body.data).toHaveProperty('date');
                expect(response.body.data).toHaveProperty('time');
                expect(response.body.data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                expect(response.body.data.time).toMatch(/^\d{2}:\d{2}(:\d{2})?$/); // HH:MM or HH:MM:SS
            }
        });

        test('should return future date', async () => {
            const response = await request(app)
                .get('/api/availability/next')
                .expect(200);

            if (response.body.data) {
                const slotDate = new Date(response.body.data.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                expect(slotDate >= today).toBe(true);
            }
        });

        test('should handle no available slots gracefully', async () => {
            // This test verifies the endpoint handles the case when no slots exist
            // In a real scenario with blocked dates filling the entire booking window
            const response = await request(app)
                .get('/api/availability/next')
                .expect(200);

            expect(response.body.success).toBe(true);
            // data can be null if no slots available
            if (response.body.data === null) {
                expect(response.body.message).toBeDefined();
            }
        });
    });
});
