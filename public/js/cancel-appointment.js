/**
 * Cancellation Page JavaScript
 * Handles appointment cancellation via token
 */

// DOM Elements
const messageDiv = document.getElementById('message');
const loadingContainer = document.getElementById('loadingContainer');
const appointmentDetails = document.getElementById('appointmentDetails');
const warningBox = document.getElementById('warningBox');
const actionsContainer = document.getElementById('actionsContainer');
const successContainer = document.getElementById('successContainer');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');

// Detail fields
const clientName = document.getElementById('clientName');
const clientEmail = document.getElementById('clientEmail');
const appointmentDate = document.getElementById('appointmentDate');
const appointmentTime = document.getElementById('appointmentTime');
const serviceType = document.getElementById('serviceType');

// State
let currentToken = null;
let appointment = null;

/**
 * Show message
 */
function showMessage(text, type = 'info') {
    messageDiv.textContent = text;
    messageDiv.className = `alert alert-${type} show`;
}

/**
 * Hide message
 */
function hideMessage() {
    messageDiv.className = 'alert';
}

/**
 * Get token from URL
 */
function getTokenFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('el-GR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
}

/**
 * Format time
 */
function formatTime(timeString) {
    return timeString.substring(0, 5);
}

/**
 * Load appointment details
 */
async function loadAppointment(token) {
    try {
        const response = await fetch(`/api/appointments/${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Το ραντεβού δεν βρέθηκε.');
        }

        appointment = data.data;

        // Check if already cancelled
        if (appointment.status === 'cancelled') {
            showMessage('Αυτό το ραντεβού έχει ήδη ακυρωθεί.', 'info');
            successContainer.classList.add('show');
            return;
        }

        // Check if can be cancelled
        if (appointment.status === 'declined' || appointment.status === 'completed') {
            showMessage(
                `Δεν μπορείτε να ακυρώσετε αυτό το ραντεβού (Κατάσταση: ${getStatusLabel(appointment.status)}).`,
                'error'
            );
            return;
        }

        // Display appointment details
        clientName.textContent = appointment.client_name;
        clientEmail.textContent = appointment.client_email;
        appointmentDate.textContent = formatDate(appointment.appointment_date);
        appointmentTime.textContent = formatTime(appointment.appointment_time);
        serviceType.textContent = appointment.service_type;

        // Show UI elements
        appointmentDetails.classList.add('show');
        warningBox.classList.add('show');
        actionsContainer.style.display = 'flex';

    } catch (error) {
        console.error('Error loading appointment:', error);
        showMessage(error.message || 'Σφάλμα φόρτωσης ραντεβού.', 'error');
    } finally {
        loadingContainer.style.display = 'none';
    }
}

/**
 * Cancel appointment
 */
async function cancelAppointment() {
    if (!currentToken) {
        showMessage('Μη έγκυρο token ακύρωσης.', 'error');
        return;
    }

    // Disable button
    confirmCancelBtn.disabled = true;
    confirmCancelBtn.innerHTML = '<span class="spinner" style="width:16px;height:16px;margin-right:8px;"></span>Ακύρωση...';

    try {
        const response = await fetch(`/api/appointments/${currentToken}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Σφάλμα κατά την ακύρωση.');
        }

        // Hide current UI
        appointmentDetails.classList.remove('show');
        warningBox.classList.remove('show');
        actionsContainer.style.display = 'none';
        hideMessage();

        // Show success
        successContainer.classList.add('show');

    } catch (error) {
        console.error('Error cancelling appointment:', error);
        showMessage(error.message || 'Σφάλμα κατά την ακύρωση του ραντεβού.', 'error');

        // Re-enable button
        confirmCancelBtn.disabled = false;
        confirmCancelBtn.textContent = 'Επιβεβαίωση Ακύρωσης';
    }
}

/**
 * Get status label
 */
function getStatusLabel(status) {
    const labels = {
        pending: 'Εκκρεμής',
        confirmed: 'Επιβεβαιωμένο',
        declined: 'Απορριφθέν',
        completed: 'Ολοκληρωμένο',
        cancelled: 'Ακυρωμένο'
    };
    return labels[status] || status;
}

/**
 * Initialize page
 */
async function init() {
    // Get token from URL
    currentToken = getTokenFromUrl();

    if (!currentToken) {
        loadingContainer.style.display = 'none';
        showMessage('Μη έγκυρος σύνδεσμος ακύρωσης. Παρακαλώ χρησιμοποιήστε τον σύνδεσμο από το email σας.', 'error');
        return;
    }

    // Load appointment
    await loadAppointment(currentToken);
}

// Attach event listener
confirmCancelBtn.addEventListener('click', cancelAppointment);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
