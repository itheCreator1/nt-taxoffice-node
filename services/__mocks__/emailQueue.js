/**
 * Mock Email Queue Service
 * Used in tests to prevent sending actual emails
 */

const queueEmail = jest.fn().mockResolvedValue({ id: 1, queued: true });

module.exports = {
  queueEmail,
};
