/**
 * Unit Tests - Appointments Service
 * Tests for appointment business logic
 */

const { createMockDbPool, resetAllMocks } = require('../../helpers/mocks');
const { createAppointmentData } = require('../../helpers/fixtures');

// Mock dependencies before requiring the module
jest.mock('../../../services/database');
jest.mock('../../../services/availability');
jest.mock('../../../services/emailQueue', () => ({
    queueEmail: jest.fn().mockResolvedValue({ id: 1 })
}));
jest.mock('../../../utils/logger');

const database = require('../../../services/database');
const availability = require('../../../services/availability');
const emailQueue = require('../../../services/emailQueue');
const appointments = require('../../../services/appointments');

describe('Appointments Service', () => {
    let mockPool;
    let mockConnection;

    beforeEach(() => {
        resetAllMocks();
        mockPool = createMockDbPool();
        mockConnection = mockPool._mockConnection;
        database.getDb.mockReturnValue(mockPool);
    });

    describe('createAppointment', () => {
        test('should create appointment successfully', async () => {
            const appointmentData = createAppointmentData();

            // Mock SELECT FOR UPDATE - no existing appointment
            mockConnection.query.mockResolvedValueOnce([[]]); // No conflict

            // Mock INSERT - return insertId
            mockConnection.query.mockResolvedValueOnce([{ insertId: 1 }]);

            // Mock history INSERT
            mockConnection.query.mockResolvedValueOnce([{}]);

            const result = await appointments.createAppointment(appointmentData);

            expect(result).toMatchObject({
                id: 1,
                ...appointmentData,
                status: 'pending'
            });
            expect(result.cancellation_token).toBeDefined();
            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.commit).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
        });

        test('should rollback and throw error if slot already booked', async () => {
            const appointmentData = createAppointmentData();

            // Mock SELECT FOR UPDATE - existing appointment found
            mockConnection.query.mockResolvedValueOnce([[{ id: 999 }]]);

            await expect(appointments.createAppointment(appointmentData))
                .rejects.toThrow('SLOT_ALREADY_BOOKED');

            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(mockConnection.commit).not.toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
        });

        test('should rollback on database error', async () => {
            const appointmentData = createAppointmentData();

            mockConnection.query.mockRejectedValueOnce(new Error('Database error'));

            await expect(appointments.createAppointment(appointmentData))
                .rejects.toThrow('Database error');

            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
        });
    });

    describe('getAppointmentById', () => {
        test('should return appointment if found', async () => {
            const mockAppointment = {
                id: 1,
                client_name: 'Test Client',
                client_email: 'test@example.com',
                status: 'pending'
            };

            mockPool.query.mockResolvedValueOnce([[mockAppointment]]);

            const result = await appointments.getAppointmentById(1);

            expect(result).toEqual(mockAppointment);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM appointments'),
                [1]
            );
        });

        test('should return null if appointment not found', async () => {
            mockPool.query.mockResolvedValueOnce([[]]);

            const result = await appointments.getAppointmentById(999);

            expect(result).toBeNull();
        });
    });

    describe('getAppointmentByToken', () => {
        test('should return appointment if token valid', async () => {
            const mockAppointment = {
                id: 1,
                cancellation_token: 'test-token-123',
                status: 'pending'
            };

            mockPool.query.mockResolvedValueOnce([[mockAppointment]]);

            const result = await appointments.getAppointmentByToken('test-token-123');

            expect(result).toEqual(mockAppointment);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('cancellation_token = ?'),
                ['test-token-123']
            );
        });

        test('should return null for invalid token', async () => {
            mockPool.query.mockResolvedValueOnce([[]]);

            const result = await appointments.getAppointmentByToken('invalid-token');

            expect(result).toBeNull();
        });
    });

    describe('cancelAppointment', () => {
        test('should cancel appointment successfully', async () => {
            const mockAppointment = {
                id: 1,
                cancellation_token: 'test-token-123',
                status: 'pending',
                version: 1
            };

            // Mock SELECT FOR UPDATE
            mockConnection.query.mockResolvedValueOnce([[mockAppointment]]);

            // Mock UPDATE
            mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Mock history INSERT
            mockConnection.query.mockResolvedValueOnce([{}]);

            // Mock SELECT to get updated appointment
            mockConnection.query.mockResolvedValueOnce([[{ ...mockAppointment, status: 'cancelled' }]]);

            const result = await appointments.cancelAppointment('test-token-123');

            expect(result.status).toBe('cancelled');
            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.commit).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
        });

        test('should throw error if appointment not found', async () => {
            mockConnection.query.mockResolvedValueOnce([[]]); // No appointment

            await expect(appointments.cancelAppointment('invalid-token'))
                .rejects.toThrow('APPOINTMENT_NOT_FOUND');

            expect(mockConnection.rollback).toHaveBeenCalled();
        });

        test('should throw error if appointment already cancelled', async () => {
            const mockAppointment = {
                id: 1,
                status: 'cancelled',
                version: 1
            };

            mockConnection.query.mockResolvedValueOnce([[mockAppointment]]);

            await expect(appointments.cancelAppointment('test-token-123'))
                .rejects.toThrow('ALREADY_CANCELLED');

            expect(mockConnection.rollback).toHaveBeenCalled();
        });
    });

    describe('updateAppointmentStatus', () => {
        test('should update status successfully', async () => {
            const mockAppointment = {
                id: 1,
                status: 'pending',
                version: 1
            };

            // Mock SELECT FOR UPDATE
            mockConnection.query.mockResolvedValueOnce([[mockAppointment]]);

            // Mock UPDATE
            mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            // Mock history INSERT
            mockConnection.query.mockResolvedValueOnce([{}]);

            // Mock SELECT to get updated appointment
            mockConnection.query.mockResolvedValueOnce([[{ ...mockAppointment, status: 'confirmed' }]]);

            const result = await appointments.updateAppointmentStatus(1, 'confirmed');

            expect(result.status).toBe('confirmed');
            expect(mockConnection.commit).toHaveBeenCalled();
        });

        test('should throw error for invalid status', async () => {
            await expect(appointments.updateAppointmentStatus(1, 'invalid_status'))
                .rejects.toThrow();
        });

        test('should handle concurrent update (optimistic locking)', async () => {
            const mockAppointment = {
                id: 1,
                status: 'pending',
                version: 1
            };

            mockConnection.query.mockResolvedValueOnce([[mockAppointment]]);
            mockConnection.query.mockResolvedValueOnce([{ affectedRows: 0 }]); // Update affected 0 rows

            await expect(appointments.updateAppointmentStatus(1, 'confirmed'))
                .rejects.toThrow('CONCURRENT_MODIFICATION');

            expect(mockConnection.rollback).toHaveBeenCalled();
        });
    });

    describe('getAllAppointments', () => {
        test('should get all appointments', async () => {
            const mockAppointments = [
                { id: 1, client_name: 'Client 1', status: 'pending' },
                { id: 2, client_name: 'Client 2', status: 'confirmed' }
            ];

            mockPool.query.mockResolvedValueOnce([mockAppointments]);

            const result = await appointments.getAllAppointments();

            expect(result).toEqual(mockAppointments);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM appointments'),
                []
            );
        });
    });

    describe('countAppointments', () => {
        test('should count appointments', async () => {
            mockPool.query.mockResolvedValueOnce([[{ count: 42 }]]);

            const result = await appointments.countAppointments();

            expect(result).toBe(42);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('COUNT(*)'),
                []
            );
        });
    });

    describe('getAppointmentHistory', () => {
        test('should return appointment history', async () => {
            const mockHistory = [
                { id: 1, old_status: null, new_status: 'pending', changed_by: 'client' },
                { id: 2, old_status: 'pending', new_status: 'confirmed', changed_by: 'admin' }
            ];

            mockPool.query.mockResolvedValueOnce([mockHistory]);

            const result = await appointments.getAppointmentHistory(1);

            expect(result).toEqual(mockHistory);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('FROM appointment_history'),
                [1]
            );
        });
    });

    describe('declineAppointment', () => {
        test('should decline appointment with reason', async () => {
            const mockAppointment = {
                id: 1,
                status: 'pending',
                version: 1
            };

            mockConnection.query.mockResolvedValueOnce([[mockAppointment]]);
            mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            mockConnection.query.mockResolvedValueOnce([{}]);
            mockConnection.query.mockResolvedValueOnce([[{ ...mockAppointment, status: 'declined' }]]);

            const result = await appointments.declineAppointment(1, 'Fully booked');

            expect(result.status).toBe('declined');
            expect(mockConnection.commit).toHaveBeenCalled();
        });

        test('should handle concurrent modification', async () => {
            const mockAppointment = {
                id: 1,
                status: 'pending',
                version: 1
            };

            mockConnection.query.mockResolvedValueOnce([[mockAppointment]]);
            mockConnection.query.mockResolvedValueOnce([{ affectedRows: 0 }]); // Concurrent modification

            await expect(appointments.declineAppointment(1, 'Reason'))
                .rejects.toThrow('CONCURRENT_MODIFICATION');

            expect(mockConnection.rollback).toHaveBeenCalled();
        });
    });
});
