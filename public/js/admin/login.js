/**
 * Admin Login Page JavaScript
 * Handles admin authentication
 */

// DOM elements
const loginForm = document.getElementById('loginForm');
const submitBtn = document.getElementById('submitBtn');
const messageDiv = document.getElementById('message');

// Form fields
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('rememberMe');

// Error displays
const usernameError = document.getElementById('username-error');
const passwordError = document.getElementById('password-error');

/**
 * Show message to user
 */
function showMessage(text, type = 'info') {
    messageDiv.textContent = text;
    messageDiv.className = `alert alert-${type} show`;
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hide message
 */
function hideMessage() {
    messageDiv.className = 'alert';
}

/**
 * Show field error
 */
function showFieldError(input, errorElement, message) {
    input.classList.add('error');
    errorElement.textContent = message;
}

/**
 * Clear field error
 */
function clearFieldError(input, errorElement) {
    input.classList.remove('error');
    errorElement.textContent = '';
}

/**
 * Clear all errors
 */
function clearAllErrors() {
    clearFieldError(usernameInput, usernameError);
    clearFieldError(passwordInput, passwordError);
    hideMessage();
}

/**
 * Validate form
 */
function validateForm() {
    clearAllErrors();
    let isValid = true;

    // Validate username
    if (!usernameInput.value || usernameInput.value.trim().length === 0) {
        showFieldError(usernameInput, usernameError, 'Παρακαλώ εισάγετε το όνομα χρήστη σας.');
        isValid = false;
    }

    // Validate password
    if (!passwordInput.value || passwordInput.value.length === 0) {
        showFieldError(passwordInput, passwordError, 'Παρακαλώ εισάγετε τον κωδικό πρόσβασης σας.');
        isValid = false;
    }

    return isValid;
}

/**
 * Handle form submission
 */
async function handleSubmit(e) {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
        showMessage('Παρακαλώ συμπληρώστε όλα τα απαιτούμενα πεδία.', 'error');
        return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span>Σύνδεση...';

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput.value.trim(),
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showMessage('Σύνδεση επιτυχής! Ανακατεύθυνση...', 'success');

            // Get redirect URL from query parameter or default to dashboard
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect') || '/admin/dashboard.html';

            // Redirect after brief delay
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);
        } else {
            // Handle error
            if (response.status === 401) {
                showMessage(
                    data.message || 'Λάθος όνομα χρήστη ή κωδικός πρόσβασης.',
                    'error'
                );
            } else if (response.status === 429) {
                showMessage(
                    data.message || 'Πάρα πολλές προσπάθειες σύνδεσης. Παρακαλώ δοκιμάστε αργότερα.',
                    'error'
                );
            } else if (response.status === 503 && data.setupRequired) {
                showMessage(
                    'Απαιτείται αρχική ρύθμιση του συστήματος. Ανακατεύθυνση...',
                    'warning'
                );
                setTimeout(() => {
                    window.location.href = '/admin/setup.html';
                }, 2000);
            } else {
                showMessage(
                    data.message || 'Σφάλμα κατά τη σύνδεση. Παρακαλώ δοκιμάστε ξανά.',
                    'error'
                );
            }

            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Σύνδεση';

            // Clear password field on error
            passwordInput.value = '';
            passwordInput.focus();
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage(
            'Σφάλμα σύνδεσης με τον διακομιστή. Παρακαλώ δοκιμάστε ξανά.',
            'error'
        );

        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Σύνδεση';

        // Clear password field on error
        passwordInput.value = '';
    }
}

/**
 * Check if user is already logged in
 */
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/admin/me');
        const data = await response.json();

        if (data.success && data.authenticated) {
            // Already logged in, redirect to dashboard
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect') || '/admin/dashboard.html';
            window.location.href = redirectUrl;
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

/**
 * Check if setup is required
 */
async function checkSetupRequired() {
    try {
        const response = await fetch('/api/admin/check-setup');
        const data = await response.json();

        if (data.success && data.setupRequired) {
            // Setup required, show message and redirect
            showMessage(
                'Απαιτείται αρχική ρύθμιση του συστήματος. Ανακατεύθυνση...',
                'warning'
            );
            setTimeout(() => {
                window.location.href = '/admin/setup.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error checking setup status:', error);
    }
}

/**
 * Load remember me preference
 */
function loadRememberMe() {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
        usernameInput.value = rememberedUsername;
        rememberMeCheckbox.checked = true;
        passwordInput.focus();
    }
}

/**
 * Save remember me preference
 */
function saveRememberMe(username) {
    if (rememberMeCheckbox.checked) {
        localStorage.setItem('rememberedUsername', username);
    } else {
        localStorage.removeItem('rememberedUsername');
    }
}

/**
 * Check for success message from URL parameter
 */
function checkUrlMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const type = urlParams.get('type') || 'info';

    if (message) {
        showMessage(decodeURIComponent(message), type);

        // Remove message from URL without reloading
        const newUrl = window.location.pathname +
            (urlParams.get('redirect') ? `?redirect=${urlParams.get('redirect')}` : '');
        window.history.replaceState({}, '', newUrl);
    }
}

/**
 * Initialize page
 */
function init() {
    // Check if already authenticated
    checkAuthStatus();

    // Check if setup is required
    checkSetupRequired();

    // Load remember me preference
    loadRememberMe();

    // Check for URL message
    checkUrlMessage();

    // Attach form submit handler
    loginForm.addEventListener('submit', (e) => {
        handleSubmit(e);

        // Save remember me preference
        if (usernameInput.value.trim()) {
            saveRememberMe(usernameInput.value.trim());
        }
    });

    // Clear errors on input
    usernameInput.addEventListener('input', () => {
        if (usernameInput.classList.contains('error')) {
            clearFieldError(usernameInput, usernameError);
        }
    });

    passwordInput.addEventListener('input', () => {
        if (passwordInput.classList.contains('error')) {
            clearFieldError(passwordInput, passwordError);
        }
    });

    // Handle Enter key on remember me checkbox
    rememberMeCheckbox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            rememberMeCheckbox.checked = !rememberMeCheckbox.checked;
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
