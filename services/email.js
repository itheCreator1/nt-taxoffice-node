/**
 * Email Service
 * Handles email sending via Nodemailer with Gmail SMTP
 */

const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const { formatGreekDate, formatGreekTime } = require('../utils/timezone');
const { info, error: logError } = require('../utils/logger');

// Email configuration
const EMAIL_CONFIG = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
};

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 */
function getTransporter() {
  if (!transporter) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      logError('Email credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD.');
      return null;
    }

    transporter = nodemailer.createTransport(EMAIL_CONFIG);
    info('Email transporter initialized');
  }
  return transporter;
}

/**
 * Verify email connection
 * @returns {Promise<boolean>}
 */
async function verifyConnection() {
  const transport = getTransporter();
  if (!transport) {
    return false;
  }

  try {
    await transport.verify();
    info('Email connection verified successfully');
    return true;
  } catch (error) {
    logError('Email connection verification failed:', error);
    return false;
  }
}

/**
 * Load email template
 * @param {string} templateName - Template filename without extension
 * @param {string} format - 'html' or 'txt'
 * @returns {Promise<string>}
 */
async function loadTemplate(templateName, format = 'html') {
  const templatePath = path.join(__dirname, '..', 'views', 'emails', `${templateName}.${format}`);
  try {
    const content = await fs.readFile(templatePath, 'utf8');
    return content;
  } catch (error) {
    logError(`Failed to load template ${templateName}.${format}:`, error);
    throw error;
  }
}

/**
 * Replace placeholders in template
 * @param {string} template - Template content
 * @param {object} data - Replacement data
 * @returns {string}
 */
function replacePlaceholders(template, data) {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, value || '');
  }
  return result;
}

/**
 * Send email
 * @param {object} options - Email options
 * @returns {Promise<object>}
 */
async function sendEmail(options) {
  const transport = getTransporter();
  if (!transport) {
    throw new Error('Email transporter not available');
  }

  const mailOptions = {
    from: `"NT TAXOFFICE" <${process.env.GMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const result = await transport.sendMail(mailOptions);
    info(`Email sent to ${options.to}: ${options.subject}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    logError(`Failed to send email to ${options.to}:`, error);
    throw error;
  }
}

/**
 * Send booking confirmation email to client
 * @param {object} appointment - Appointment data
 * @returns {Promise<object>}
 */
async function sendBookingConfirmation(appointment) {
  const htmlTemplate = await loadTemplate('booking-confirmation', 'html');
  const txtTemplate = await loadTemplate('booking-confirmation', 'txt');

  const data = {
    clientName: appointment.client_name,
    appointmentDate: formatGreekDate(appointment.appointment_date),
    appointmentTime: formatGreekTime(appointment.appointment_time),
    serviceType: appointment.service_type,
    cancellationUrl: `${process.env.APP_URL}/cancel-appointment.html?token=${appointment.cancellation_token}`,
    officePhone: process.env.OFFICE_PHONE || '210-1234567',
    officeEmail: process.env.ADMIN_EMAIL,
  };

  const html = replacePlaceholders(htmlTemplate, data);
  const text = replacePlaceholders(txtTemplate, data);

  return sendEmail({
    to: appointment.client_email,
    subject: 'Επιβεβαίωση Ραντεβού - NT TAXOFFICE',
    html,
    text,
  });
}

/**
 * Send booking confirmation email to admin
 * @param {object} appointment - Appointment data
 * @returns {Promise<object>}
 */
async function sendAdminNotification(appointment) {
  const htmlTemplate = await loadTemplate('admin-new-appointment', 'html');
  const txtTemplate = await loadTemplate('admin-new-appointment', 'txt');

  const data = {
    clientName: appointment.client_name,
    clientEmail: appointment.client_email,
    clientPhone: appointment.client_phone,
    appointmentDate: formatGreekDate(appointment.appointment_date),
    appointmentTime: formatGreekTime(appointment.appointment_time),
    serviceType: appointment.service_type,
    notes: appointment.notes || 'Χωρίς σημειώσεις',
    dashboardUrl: `${process.env.APP_URL}/admin/dashboard.html`,
  };

  const html = replacePlaceholders(htmlTemplate, data);
  const text = replacePlaceholders(txtTemplate, data);

  return sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `Νέο Ραντεβού: ${appointment.client_name} - ${formatGreekDate(appointment.appointment_date)}`,
    html,
    text,
  });
}

/**
 * Send appointment confirmed email to client
 * @param {object} appointment - Appointment data
 * @returns {Promise<object>}
 */
async function sendAppointmentConfirmed(appointment) {
  const htmlTemplate = await loadTemplate('appointment-confirmed', 'html');
  const txtTemplate = await loadTemplate('appointment-confirmed', 'txt');

  const data = {
    clientName: appointment.client_name,
    appointmentDate: formatGreekDate(appointment.appointment_date),
    appointmentTime: formatGreekTime(appointment.appointment_time),
    serviceType: appointment.service_type,
    officeAddress: process.env.OFFICE_ADDRESS || 'Οδός Παραδείγματος 123, Αθήνα',
    officePhone: process.env.OFFICE_PHONE || '210-1234567',
    cancellationUrl: `${process.env.APP_URL}/cancel-appointment.html?token=${appointment.cancellation_token}`,
  };

  const html = replacePlaceholders(htmlTemplate, data);
  const text = replacePlaceholders(txtTemplate, data);

  return sendEmail({
    to: appointment.client_email,
    subject: 'Το Ραντεβού σας Επιβεβαιώθηκε - NT TAXOFFICE',
    html,
    text,
  });
}

/**
 * Send appointment declined email to client
 * @param {object} appointment - Appointment data
 * @returns {Promise<object>}
 */
async function sendAppointmentDeclined(appointment) {
  const htmlTemplate = await loadTemplate('appointment-declined', 'html');
  const txtTemplate = await loadTemplate('appointment-declined', 'txt');

  const data = {
    clientName: appointment.client_name,
    appointmentDate: formatGreekDate(appointment.appointment_date),
    appointmentTime: formatGreekTime(appointment.appointment_time),
    declineReason: appointment.decline_reason || 'Δεν υπάρχει διαθεσιμότητα.',
    bookingUrl: `${process.env.APP_URL}/appointments.html`,
    officePhone: process.env.OFFICE_PHONE || '210-1234567',
  };

  const html = replacePlaceholders(htmlTemplate, data);
  const text = replacePlaceholders(txtTemplate, data);

  return sendEmail({
    to: appointment.client_email,
    subject: 'Ενημέρωση για το Ραντεβού σας - NT TAXOFFICE',
    html,
    text,
  });
}

/**
 * Send appointment reminder email (24h before)
 * @param {object} appointment - Appointment data
 * @returns {Promise<object>}
 */
async function sendAppointmentReminder(appointment) {
  const htmlTemplate = await loadTemplate('appointment-reminder', 'html');
  const txtTemplate = await loadTemplate('appointment-reminder', 'txt');

  const data = {
    clientName: appointment.client_name,
    appointmentDate: formatGreekDate(appointment.appointment_date),
    appointmentTime: formatGreekTime(appointment.appointment_time),
    serviceType: appointment.service_type,
    officeAddress: process.env.OFFICE_ADDRESS || 'Οδός Παραδείγματος 123, Αθήνα',
    officePhone: process.env.OFFICE_PHONE || '210-1234567',
    cancellationUrl: `${process.env.APP_URL}/cancel-appointment.html?token=${appointment.cancellation_token}`,
  };

  const html = replacePlaceholders(htmlTemplate, data);
  const text = replacePlaceholders(txtTemplate, data);

  return sendEmail({
    to: appointment.client_email,
    subject: 'Υπενθύμιση Ραντεβού - Αύριο - NT TAXOFFICE',
    html,
    text,
  });
}

/**
 * Send cancellation confirmation email to client
 * @param {object} appointment - Appointment data
 * @returns {Promise<object>}
 */
async function sendCancellationConfirmation(appointment) {
  const htmlTemplate = await loadTemplate('cancellation-confirmation', 'html');
  const txtTemplate = await loadTemplate('cancellation-confirmation', 'txt');

  const data = {
    clientName: appointment.client_name,
    appointmentDate: formatGreekDate(appointment.appointment_date),
    appointmentTime: formatGreekTime(appointment.appointment_time),
    bookingUrl: `${process.env.APP_URL}/appointments.html`,
    officePhone: process.env.OFFICE_PHONE || '210-1234567',
  };

  const html = replacePlaceholders(htmlTemplate, data);
  const text = replacePlaceholders(txtTemplate, data);

  return sendEmail({
    to: appointment.client_email,
    subject: 'Επιβεβαίωση Ακύρωσης Ραντεβού - NT TAXOFFICE',
    html,
    text,
  });
}

module.exports = {
  verifyConnection,
  sendEmail,
  sendBookingConfirmation,
  sendAdminNotification,
  sendAppointmentConfirmed,
  sendAppointmentDeclined,
  sendAppointmentReminder,
  sendCancellationConfirmation,
};
