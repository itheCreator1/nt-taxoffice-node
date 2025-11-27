/**
 * Appointments Booking Module
 *
 * Handles 3-step appointment booking wizard:
 * - Step 1: Service selection
 * - Step 2: Date and time selection with DD/MM/YYYY format
 * - Step 3: Personal information
 *
 * Features:
 * - Flatpickr date picker with Greek date format (DD/MM/YYYY)
 * - Automatic weekend blocking
 * - Real-time summary updates
 * - Manual date entry validation
 * - Email confirmation queue
 *
 * @module appointments
 * @requires flatpickr
 *
 * @example
 * // Initialize on page load
 * document.addEventListener('DOMContentLoaded', init);
 */

// Flatpickr loaded as global variable from /js/vendor/flatpickr/flatpickr.min.js (UMD build)
// Available as window.flatpickr

/**
 * Booking form data structure
 * @typedef {Object} FormData
 * @property {string} service_type - Selected service (e.g., "Φορολογική Δήλωση")
 * @property {string} appointment_date - Date in YYYY-MM-DD format for API
 * @property {string} appointment_time - Time in HH:MM:SS format (e.g., "10:00:00")
 * @property {string} client_name - Client full name (min 2 chars)
 * @property {string} client_email - Client email address (validated)
 * @property {string} client_phone - Greek phone number (validated)
 * @property {string} notes - Optional notes (max 1000 chars)
 */

/**
 * Application state management
 * @typedef {Object} AppointmentState
 * @property {number} currentStep - Current wizard step (1-3)
 * @property {string[]} availableDates - Array of available dates in YYYY-MM-DD format
 * @property {FormData} formData - Booking form data
 */

/**
 * @type {AppointmentState}
 */
const state = {
    currentStep: 1,
    availableDates: [],
    formData: {
        service_type: '',
        appointment_date: '',
        appointment_time: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        notes: ''
    }
};

// DOM Elements
const elements = {
    form: null,
    steps: [],
    serviceType: null,
    appointmentDate: null,
    appointmentTime: null,
    clientName: null,
    clientEmail: null,
    clientPhone: null,
    notes: null,
    successMessage: null,
    errorMessage: null,
    loadingIndicator: null,
    bookingSummary: null,
    formContainer: null
};

/**
 * Initialize the appointments module
 */
function init() {
    // Get DOM elements
    elements.form = document.getElementById('booking-form');
    elements.steps = [
        document.getElementById('step-1'),
        document.getElementById('step-2'),
        document.getElementById('step-3')
    ];
    elements.serviceType = document.getElementById('service_type');
    elements.appointmentDate = document.getElementById('appointment_date');
    elements.appointmentTime = document.getElementById('appointment_time');
    elements.clientName = document.getElementById('client_name');
    elements.clientEmail = document.getElementById('client_email');
    elements.clientPhone = document.getElementById('client_phone');
    elements.notes = document.getElementById('notes');
    elements.successMessage = document.getElementById('success-message');
    elements.errorMessage = document.getElementById('error-message');
    elements.loadingIndicator = document.getElementById('loading-indicator');
    elements.bookingSummary = document.getElementById('booking-summary');
    elements.formContainer = document.getElementById('booking-form-container');

    // Set up event listeners
    setupEventListeners();

    // Load available dates
    loadAvailableDates();

    // Set min/max dates for date picker
    setupDatePicker();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Step navigation
    document.getElementById('next-to-step-2')?.addEventListener('click', () => {
        if (validateStep1()) {
            goToStep(2);
        }
    });

    document.getElementById('back-to-step-1')?.addEventListener('click', () => {
        goToStep(1);
    });

    document.getElementById('next-to-step-3')?.addEventListener('click', () => {
        if (validateStep2()) {
            showBookingSummary();
            goToStep(3);
        }
    });

    document.getElementById('back-to-step-2')?.addEventListener('click', () => {
        goToStep(2);
    });

    // Note: Date change is now handled by Flatpickr's onChange callback in setupDatePicker()

    // Manual date entry validation (fallback if user types instead of clicking)
    elements.appointmentDate?.addEventListener('blur', (e) => {
        const dateStr = e.target.value.trim();
        if (!dateStr) return;

        const validDate = validateManualDateEntry(dateStr);
        if (validDate) {
            // Convert to YYYY-MM-DD for API
            const year = validDate.getFullYear();
            const month = String(validDate.getMonth() + 1).padStart(2, '0');
            const day = String(validDate.getDate()).padStart(2, '0');
            const apiDate = `${year}-${month}-${day}`;

            state.formData.appointment_date = apiDate;
            loadAvailableTimesForDate(apiDate);
        } else if (dateStr.length > 0) {
            showError('Μη έγκυρη ημερομηνία. Χρησιμοποιήστε μορφή ΗΗ/ΜΜ/ΕΕΕΕ (Δευτέρα-Παρασκευή).');
            e.target.value = '';
        }
    });

    // Form submission
    elements.form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (validateStep3()) {
            await submitBooking();
        }
    });

    // Real-time summary updates for Step 3
    elements.clientName?.addEventListener('input', updateBookingSummary);
    elements.clientEmail?.addEventListener('input', updateBookingSummary);
    elements.clientPhone?.addEventListener('input', updateBookingSummary);
    elements.notes?.addEventListener('input', updateBookingSummary);
}

/**
 * Initializes Flatpickr date picker with DD/MM/YYYY format
 *
 * Configures:
 * - Date format: DD/MM/YYYY (Greek standard)
 * - Min date: Tomorrow (24-hour advance booking required)
 * - Max date: 60 days from today
 * - Disabled days: Weekends (Saturday, Sunday)
 * - First day of week: Monday
 *
 * On date selection:
 * - Converts display format (DD/MM/YYYY) to API format (YYYY-MM-DD)
 * - Updates state.formData.appointment_date
 * - Loads available time slots for selected date
 *
 * @throws {Error} If Flatpickr library fails to load
 * @returns {void}
 *
 * @example
 * setupDatePicker();
 * // Date picker initialized, calendar shows DD/MM/YYYY
 */
function setupDatePicker() {
    if (!elements.appointmentDate) {
        console.error('Date picker element not found');
        return;
    }

    // Verify flatpickr is available
    if (typeof flatpickr !== 'function') {
        console.error('Flatpickr library not loaded');
        showError('Σφάλμα φόρτωσης του επιλογέα ημερομηνίας. Παρακαλώ ανανεώστε τη σελίδα.');
        return;
    }

    try {
        const today = new Date();
        today.setDate(today.getDate() + 1); // Minimum: tomorrow

        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 60); // Maximum: 60 days ahead

        // Initialize Flatpickr with DD/MM/YYYY format
        const picker = flatpickr(elements.appointmentDate, {
            dateFormat: "d/m/Y",
            minDate: today,
            maxDate: maxDate,
            locale: {
                firstDayOfWeek: 1 // Monday
            },
            // Disable weekends
            disable: [
                function(date) {
                    return (date.getDay() === 0 || date.getDay() === 6);
                }
            ],
            // Trigger change event for available time slots
            onChange: function(selectedDates, dateStr, instance) {
                if (selectedDates.length > 0) {
                    // Convert to YYYY-MM-DD format for API
                    const date = selectedDates[0];
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const apiDate = `${year}-${month}-${day}`;

                    // Update state
                    state.formData.appointment_date = apiDate;

                    // Load available times for this date
                    loadAvailableTimesForDate(apiDate);
                }
            },
            onReady: function(selectedDates, dateStr, instance) {
                console.log('Flatpickr initialized successfully');
            }
        });

        // Store picker instance for potential cleanup
        elements.datePickerInstance = picker;

    } catch (error) {
        console.error('Error initializing Flatpickr:', error);
        showError('Σφάλμα αρχικοποίησης του επιλογέα ημερομηνίας. Παρακαλώ ανανεώστε τη σελίδα.');
    }
}

/**
 * Validates manually entered date in DD/MM/YYYY format
 *
 * Validation rules:
 * 1. Format: Must match DD/MM/YYYY (e.g., "29/11/2024")
 * 2. Date validity: Must be real date (no 32/13/2024)
 * 3. Day of week: Must not be weekend (Saturday/Sunday)
 * 4. Range: Must be between tomorrow and 60 days ahead
 *
 * @param {string} dateStr - Date string in DD/MM/YYYY format
 * @returns {Date|null} Valid Date object if all checks pass, null otherwise
 *
 * @example
 * const date = validateManualDateEntry('29/11/2024');
 * if (date) {
 *     console.log('Valid date:', date);
 * } else {
 *     console.log('Invalid date');
 * }
 *
 * @example
 * // Invalid cases
 * validateManualDateEntry('2024-11-29');  // Wrong format → null
 * validateManualDateEntry('30/11/2024');  // Saturday → null
 * validateManualDateEntry('32/11/2024');  // Invalid date → null
 */
function validateManualDateEntry(dateStr) {
    // Match DD/MM/YYYY format
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(dateRegex);

    if (!match) return null;

    const [_, day, month, year] = match;
    const date = new Date(year, month - 1, day);

    // Verify it's a valid date
    if (date.getDate() != day || date.getMonth() != (month - 1) || date.getFullYear() != year) {
        return null;
    }

    // Check it's not a weekend
    if (date.getDay() === 0 || date.getDay() === 6) {
        return null;
    }

    // Check it's within allowed range
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);
    maxDate.setHours(23, 59, 59, 999);

    if (date < tomorrow || date > maxDate) {
        return null;
    }

    return date;
}

/**
 * Navigate to a specific step
 */
function goToStep(stepNumber) {
    // Hide all steps
    elements.steps.forEach(step => step?.classList.remove('active'));

    // Show target step
    const targetStep = elements.steps[stepNumber - 1];
    targetStep?.classList.add('active');

    state.currentStep = stepNumber;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Validate Step 1 (Service Selection)
 */
function validateStep1() {
    const serviceType = elements.serviceType?.value;

    if (!serviceType) {
        showError('Παρακαλώ επιλέξτε τύπο υπηρεσίας.');
        return false;
    }

    state.formData.service_type = serviceType;
    return true;
}

/**
 * Validate Step 2 (Date and Time)
 */
function validateStep2() {
    const date = elements.appointmentDate?.value;
    const time = elements.appointmentTime?.value;

    if (!date) {
        showError('Παρακαλώ επιλέξτε ημερομηνία.');
        return false;
    }

    if (!time) {
        showError('Παρακαλώ επιλέξτε ώρα.');
        return false;
    }

    // Don't overwrite appointment_date if already set by Flatpickr in YYYY-MM-DD format
    // Only set it if not already set (fallback for manual entry)
    if (!state.formData.appointment_date) {
        state.formData.appointment_date = date;
    }
    state.formData.appointment_time = time;
    return true;
}

/**
 * Validate Step 3 (Personal Information)
 */
function validateStep3() {
    const name = elements.clientName?.value.trim();
    const email = elements.clientEmail?.value.trim();
    const phone = elements.clientPhone?.value.trim();

    if (!name || name.length < 2) {
        showError('Παρακαλώ εισάγετε έγκυρο όνομα (τουλάχιστον 2 χαρακτήρες).');
        return false;
    }

    if (!email || !isValidEmail(email)) {
        showError('Παρακαλώ εισάγετε έγκυρη διεύθυνση email.');
        return false;
    }

    if (!phone || !isValidGreekPhone(phone)) {
        showError('Παρακαλώ εισάγετε έγκυρο ελληνικό τηλέφωνο.');
        return false;
    }

    state.formData.client_name = name;
    state.formData.client_email = email;
    state.formData.client_phone = phone;
    state.formData.notes = elements.notes?.value.trim() || '';

    return true;
}

/**
 * Email validation
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Greek phone validation
 */
function isValidGreekPhone(phone) {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    const mobileRegex = /^(\+30|30)?6\d{9}$/;
    const landlineRegex = /^(\+30|30)?2\d{9}$/;
    return mobileRegex.test(cleaned) || landlineRegex.test(cleaned);
}

/**
 * Load available dates from API
 */
async function loadAvailableDates() {
    try {
        showLoading(true);

        const response = await fetch('/api/availability/dates');
        const data = await response.json();

        if (data.success) {
            state.availableDates = data.data;
            console.log(`Loaded ${data.count} available dates`);
        } else {
            throw new Error(data.message || 'Failed to load available dates');
        }
    } catch (error) {
        console.error('Error loading available dates:', error);
        showError('Αποτυχία φόρτωσης διαθέσιμων ημερομηνιών. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
        showLoading(false);
    }
}

/**
 * Load available times for a specific date
 */
async function loadAvailableTimesForDate(date) {
    try {
        const timeSelect = elements.appointmentTime;
        if (!timeSelect) return;

        // Disable and show loading
        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option value="">Φόρτωση...</option>';

        const response = await fetch(`/api/availability/slots/${date}`);
        const data = await response.json();

        if (data.success) {
            const slots = data.data.slots;

            if (slots.length === 0) {
                timeSelect.innerHTML = '<option value="">Δεν υπάρχουν διαθέσιμες ώρες</option>';
                document.getElementById('time-help-text').textContent = 'Δεν υπάρχουν διαθέσιμες ώρες για αυτή την ημερομηνία.';
            } else {
                timeSelect.innerHTML = '<option value="">-- Επιλέξτε ώρα --</option>';
                slots.forEach(slot => {
                    const option = document.createElement('option');
                    option.value = slot;
                    // Format time as HH:MM
                    option.textContent = slot.substring(0, 5);
                    timeSelect.appendChild(option);
                });
                timeSelect.disabled = false;
                document.getElementById('time-help-text').textContent = `${slots.length} διαθέσιμες ώρες`;
            }
        } else {
            throw new Error(data.message || 'Failed to load time slots');
        }
    } catch (error) {
        console.error('Error loading time slots:', error);
        showError('Αποτυχία φόρτωσης διαθέσιμων ωρών. Παρακαλώ δοκιμάστε ξανά.');
    }
}

/**
 * Show booking summary
 */
function showBookingSummary() {
    if (!elements.bookingSummary) return;

    // Format date as DD/MM/YYYY
    const dateObj = new Date(state.formData.appointment_date + 'T00:00:00');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // Format time
    const formattedTime = state.formData.appointment_time.substring(0, 5);

    // Update summary
    document.getElementById('summary-service').textContent = state.formData.service_type;
    document.getElementById('summary-date').textContent = formattedDate;
    document.getElementById('summary-time').textContent = formattedTime;
    document.getElementById('summary-name').textContent = state.formData.client_name;
    document.getElementById('summary-email').textContent = state.formData.client_email;
    document.getElementById('summary-phone').textContent = state.formData.client_phone;

    // Show summary
    elements.bookingSummary.style.display = 'block';
}

/**
 * Update booking summary in real-time
 */
function updateBookingSummary() {
    // Only update if we're on step 3
    if (state.currentStep !== 3) return;

    // Get current values from form inputs
    const name = elements.clientName?.value.trim() || '';
    const email = elements.clientEmail?.value.trim() || '';
    const phone = elements.clientPhone?.value.trim() || '';

    // Update summary elements
    const summaryName = document.getElementById('summary-name');
    const summaryEmail = document.getElementById('summary-email');
    const summaryPhone = document.getElementById('summary-phone');

    if (summaryName) summaryName.textContent = name || '-';
    if (summaryEmail) summaryEmail.textContent = email || '-';
    if (summaryPhone) summaryPhone.textContent = phone || '-';
}

/**
 * Submit booking to API
 */
async function submitBooking() {
    try {
        // Disable submit button
        const submitBtn = document.getElementById('submit-booking');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Υποβολή...';
        }

        const response = await fetch('/api/appointments/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state.formData)
        });

        const data = await response.json();

        if (data.success) {
            showSuccess(data.message, data.data);
            resetForm();
        } else {
            throw new Error(data.message || 'Booking failed');
        }
    } catch (error) {
        console.error('Error submitting booking:', error);
        showError(error.message || 'Αποτυχία κράτησης ραντεβού. Παρακαλώ δοκιμάστε ξανά.');

        // Re-enable submit button
        const submitBtn = document.getElementById('submit-booking');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Κλείσε Ραντεβού';
        }
    }
}

/**
 * Show success message
 */
function showSuccess(message, appointmentData) {
    hideError();
    hideLoading();

    if (elements.formContainer) {
        elements.formContainer.style.display = 'none';
    }

    if (elements.bookingSummary) {
        elements.bookingSummary.style.display = 'none';
    }

    if (elements.successMessage) {
        const successText = document.getElementById('success-text');
        if (successText) {
            successText.textContent = message;
        }
        elements.successMessage.style.display = 'flex';
        elements.successMessage.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Show error message
 */
function showError(message) {
    hideSuccess();

    if (elements.errorMessage) {
        const errorText = document.getElementById('error-text');
        if (errorText) {
            errorText.textContent = message;
        }
        elements.errorMessage.style.display = 'flex';
        elements.errorMessage.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Hide error message
 */
function hideError() {
    if (elements.errorMessage) {
        elements.errorMessage.style.display = 'none';
    }
}

/**
 * Hide success message
 */
function hideSuccess() {
    if (elements.successMessage) {
        elements.successMessage.style.display = 'none';
    }
}

/**
 * Show/hide loading indicator
 */
function showLoading(show) {
    if (elements.loadingIndicator) {
        elements.loadingIndicator.style.display = show ? 'block' : 'none';
    }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    showLoading(false);
}

/**
 * Reset form to initial state
 * Cleans up flatpickr instance to prevent memory leaks
 */
function resetForm() {
    // Clean up flatpickr instance to prevent memory leaks
    if (elements.datePickerInstance) {
        elements.datePickerInstance.destroy();
        elements.datePickerInstance = null;
    }

    if (elements.form) {
        elements.form.reset();
    }

    // Clear appointment time options
    if (elements.appointmentTime) {
        elements.appointmentTime.innerHTML = '<option value="">-- Επιλέξτε πρώτα ημερομηνία --</option>';
        elements.appointmentTime.disabled = true;
    }

    state.currentStep = 1;
    state.formData = {
        service_type: '',
        appointment_date: '',
        appointment_time: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        notes: ''
    };

    // Reinitialize date picker for next booking
    setupDatePicker();

    goToStep(1);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Handle module import errors
window.addEventListener('error', (e) => {
    if (e.message && e.message.includes('flatpickr')) {
        console.error('Failed to load Flatpickr module:', e);
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) {
            document.getElementById('error-text').textContent =
                'Σφάλμα φόρτωσης της βιβλιοθήκης ημερολογίου. Παρακαλώ ελέγξτε τη σύνδεσή σας στο Internet.';
            errorMsg.style.display = 'flex';
        }
    }
});
