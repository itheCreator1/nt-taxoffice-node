/**
 * Email Queue Service
 * Manages queued email sending with retry logic
 */

const { getDb } = require('./database');
const emailService = require('./email');
const { info, error: logError, debug } = require('../utils/logger');

// Queue processing configuration
const PROCESSING_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 300000; // 5 minutes

let processingTimer = null;
let isProcessing = false;

/**
 * Queue an email for sending
 * @param {string} type - Email type
 * @param {string} recipient - Recipient email
 * @param {object} data - Email data
 * @returns {Promise<number>} - Queue item ID
 */
async function queueEmail(type, recipient, data) {
    const db = getDb();

    try {
        const [result] = await db.query(
            `INSERT INTO email_queue (email_type, recipient, data, status, attempts)
             VALUES (?, ?, ?, 'pending', 0)`,
            [type, recipient, JSON.stringify(data)]
        );

        info(`Email queued: ${type} to ${recipient}`);
        return result.insertId;
    } catch (error) {
        logError('Failed to queue email:', error);
        throw error;
    }
}

/**
 * Process a single email from queue
 * @param {object} queueItem - Queue item from database
 * @returns {Promise<boolean>} - Success status
 */
async function processEmail(queueItem) {
    const db = getDb();
    const data = JSON.parse(queueItem.data);

    try {
        debug(`Processing email: ${queueItem.email_type} to ${queueItem.recipient}`);

        // Select appropriate email function based on type
        let result;
        switch (queueItem.email_type) {
            case 'booking-confirmation':
                result = await emailService.sendBookingConfirmation(data);
                break;

            case 'admin-notification':
                result = await emailService.sendAdminNotification(data);
                break;

            case 'appointment-confirmed':
                result = await emailService.sendAppointmentConfirmed(data);
                break;

            case 'appointment-declined':
                result = await emailService.sendAppointmentDeclined(data);
                break;

            case 'appointment-reminder':
                result = await emailService.sendAppointmentReminder(data);
                break;

            case 'cancellation-confirmation':
                result = await emailService.sendCancellationConfirmation(data);
                break;

            default:
                throw new Error(`Unknown email type: ${queueItem.email_type}`);
        }

        // Mark as sent
        await db.query(
            `UPDATE email_queue
             SET status = 'sent', sent_at = NOW(), error_message = NULL
             WHERE id = ?`,
            [queueItem.id]
        );

        info(`Email sent successfully: ${queueItem.email_type} to ${queueItem.recipient}`);
        return true;

    } catch (error) {
        logError(`Failed to send email ${queueItem.id}:`, error);

        // Increment attempts
        const newAttempts = queueItem.attempts + 1;

        if (newAttempts >= MAX_RETRIES) {
            // Mark as failed after max retries
            await db.query(
                `UPDATE email_queue
                 SET status = 'failed', attempts = ?, error_message = ?
                 WHERE id = ?`,
                [newAttempts, error.message, queueItem.id]
            );
            logError(`Email ${queueItem.id} failed after ${MAX_RETRIES} attempts`);
        } else {
            // Schedule for retry
            const nextAttempt = new Date(Date.now() + RETRY_DELAY);
            await db.query(
                `UPDATE email_queue
                 SET attempts = ?, error_message = ?, next_attempt_at = ?
                 WHERE id = ?`,
                [newAttempts, error.message, nextAttempt, queueItem.id]
            );
            debug(`Email ${queueItem.id} scheduled for retry ${newAttempts}/${MAX_RETRIES}`);
        }

        return false;
    }
}

/**
 * Process pending emails from queue
 */
async function processQueue() {
    // Prevent concurrent processing
    if (isProcessing) {
        debug('Queue processing already in progress, skipping');
        return;
    }

    isProcessing = true;

    try {
        const db = getDb();

        // Get pending emails ready for sending
        const [pendingEmails] = await db.query(
            `SELECT * FROM email_queue
             WHERE status = 'pending'
             AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
             ORDER BY created_at ASC
             LIMIT 10`
        );

        if (pendingEmails.length === 0) {
            debug('No pending emails in queue');
            return;
        }

        info(`Processing ${pendingEmails.length} emails from queue`);

        // Process each email
        for (const email of pendingEmails) {
            await processEmail(email);
        }

        info(`Queue processing complete: ${pendingEmails.length} emails processed`);

    } catch (error) {
        logError('Error processing email queue:', error);
    } finally {
        isProcessing = false;
    }
}

/**
 * Start queue processor
 */
function startProcessor() {
    if (processingTimer) {
        info('Email queue processor already running');
        return;
    }

    info(`Starting email queue processor (interval: ${PROCESSING_INTERVAL}ms)`);

    // Process immediately on start
    processQueue();

    // Then process at regular intervals
    processingTimer = setInterval(processQueue, PROCESSING_INTERVAL);
}

/**
 * Stop queue processor
 */
function stopProcessor() {
    if (processingTimer) {
        clearInterval(processingTimer);
        processingTimer = null;
        info('Email queue processor stopped');
    }
}

/**
 * Get queue statistics
 * @returns {Promise<object>}
 */
async function getQueueStats() {
    const db = getDb();

    try {
        const [stats] = await db.query(`
            SELECT
                status,
                COUNT(*) as count
            FROM email_queue
            GROUP BY status
        `);

        const [totalCount] = await db.query(
            'SELECT COUNT(*) as total FROM email_queue'
        );

        const [failedRecent] = await db.query(`
            SELECT COUNT(*) as count
            FROM email_queue
            WHERE status = 'failed'
            AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `);

        return {
            byStatus: stats.reduce((acc, row) => {
                acc[row.status] = row.count;
                return acc;
            }, {}),
            total: totalCount[0].total,
            failedLast24h: failedRecent[0].count
        };
    } catch (error) {
        logError('Error getting queue stats:', error);
        throw error;
    }
}

/**
 * Retry failed emails
 * @param {number} limit - Max number of emails to retry
 * @returns {Promise<number>} - Number of emails reset
 */
async function retryFailedEmails(limit = 10) {
    const db = getDb();

    try {
        const [result] = await db.query(
            `UPDATE email_queue
             SET status = 'pending', attempts = 0, error_message = NULL, next_attempt_at = NULL
             WHERE status = 'failed'
             ORDER BY created_at DESC
             LIMIT ?`,
            [limit]
        );

        info(`Reset ${result.affectedRows} failed emails for retry`);
        return result.affectedRows;
    } catch (error) {
        logError('Error retrying failed emails:', error);
        throw error;
    }
}

/**
 * Clean old emails from queue
 * @param {number} daysOld - Delete emails older than this many days
 * @returns {Promise<number>} - Number of emails deleted
 */
async function cleanOldEmails(daysOld = 30) {
    const db = getDb();

    try {
        const [result] = await db.query(
            `DELETE FROM email_queue
             WHERE status IN ('sent', 'failed')
             AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [daysOld]
        );

        info(`Cleaned ${result.affectedRows} old emails from queue`);
        return result.affectedRows;
    } catch (error) {
        logError('Error cleaning old emails:', error);
        throw error;
    }
}

module.exports = {
    queueEmail,
    processQueue,
    startProcessor,
    stopProcessor,
    getQueueStats,
    retryFailedEmails,
    cleanOldEmails
};
