/**
 * Admin Setup Page JavaScript
 * Handles first-time admin account creation
 */

// DOM elements
const setupForm = document.getElementById('setupForm');
const submitBtn = document.getElementById('submitBtn');
const messageDiv = document.getElementById('message');

// Form fields
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');

// Error displays
const usernameError = document.getElementById('username-error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const confirmPasswordError = document.getElementById('confirmPassword-error');

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
  clearFieldError(emailInput, emailError);
  clearFieldError(passwordInput, passwordError);
  clearFieldError(confirmPasswordInput, confirmPasswordError);
  hideMessage();
}

/**
 * Validate username
 */
function validateUsername(username) {
  if (!username || username.trim().length === 0) {
    return 'Το όνομα χρήστη είναι υποχρεωτικό.';
  }
  if (username.length < 3 || username.length > 50) {
    return 'Το όνομα χρήστη πρέπει να είναι 3-50 χαρακτήρες.';
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Το όνομα χρήστη μπορεί να περιέχει μόνο γράμματα, αριθμούς, _ και -.';
  }
  return null;
}

/**
 * Validate email
 */
function validateEmail(email) {
  if (!email || email.trim().length === 0) {
    return 'Το email είναι υποχρεωτικό.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Παρακαλώ εισάγετε έγκυρη διεύθυνση email.';
  }
  return null;
}

/**
 * Validate password
 */
function validatePassword(password) {
  if (!password || password.length === 0) {
    return 'Ο κωδικός πρόσβασης είναι υποχρεωτικός.';
  }
  if (password.length < 8) {
    return 'Ο κωδικός πρέπει να είναι τουλάχιστον 8 χαρακτήρες.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα κεφαλαίο γράμμα.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα πεζό γράμμα.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Ο κωδικός πρέπει να περιέχει τουλάχιστον έναν αριθμό.';
  }
  return null;
}

/**
 * Validate confirm password
 */
function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword || confirmPassword.length === 0) {
    return 'Η επιβεβαίωση κωδικού είναι υποχρεωτική.';
  }
  if (password !== confirmPassword) {
    return 'Οι κωδικοί δεν ταιριάζουν.';
  }
  return null;
}

/**
 * Validate entire form
 */
function validateForm() {
  clearAllErrors();
  let isValid = true;

  // Validate username
  const usernameValidation = validateUsername(usernameInput.value);
  if (usernameValidation) {
    showFieldError(usernameInput, usernameError, usernameValidation);
    isValid = false;
  }

  // Validate email
  const emailValidation = validateEmail(emailInput.value);
  if (emailValidation) {
    showFieldError(emailInput, emailError, emailValidation);
    isValid = false;
  }

  // Validate password
  const passwordValidation = validatePassword(passwordInput.value);
  if (passwordValidation) {
    showFieldError(passwordInput, passwordError, passwordValidation);
    isValid = false;
  }

  // Validate confirm password
  const confirmPasswordValidation = validateConfirmPassword(
    passwordInput.value,
    confirmPasswordInput.value
  );
  if (confirmPasswordValidation) {
    showFieldError(confirmPasswordInput, confirmPasswordError, confirmPasswordValidation);
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
    showMessage('Παρακαλώ διορθώστε τα σφάλματα στη φόρμα.', 'error');
    return;
  }

  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-spinner"></span>Δημιουργία λογαριασμού...';

  try {
    const response = await fetch('/api/admin/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showMessage(
        'Ο λογαριασμός διαχειριστή δημιουργήθηκε επιτυχώς! Ανακατεύθυνση στη σελίδα σύνδεσης...',
        'success'
      );

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/admin/login.html';
      }, 2000);
    } else {
      // Handle validation errors
      if (data.errors) {
        let hasErrors = false;

        if (data.errors.username) {
          showFieldError(usernameInput, usernameError, data.errors.username);
          hasErrors = true;
        }
        if (data.errors.email) {
          showFieldError(emailInput, emailError, data.errors.email);
          hasErrors = true;
        }
        if (data.errors.password) {
          showFieldError(passwordInput, passwordError, data.errors.password);
          hasErrors = true;
        }

        if (hasErrors) {
          showMessage(data.message || 'Παρακαλώ διορθώστε τα σφάλματα.', 'error');
        }
      } else {
        showMessage(data.message || 'Σφάλμα κατά τη δημιουργία λογαριασμού.', 'error');
      }

      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Δημιουργία λογαριασμού';
    }
  } catch (error) {
    console.error('Setup error:', error);
    showMessage('Σφάλμα σύνδεσης με τον διακομιστή. Παρακαλώ δοκιμάστε ξανά.', 'error');

    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Δημιουργία λογαριασμού';
  }
}

/**
 * Check if setup is already complete on page load
 */
async function checkSetupStatus() {
  try {
    const response = await fetch('/api/admin/check-setup');
    const data = await response.json();

    if (data.success && !data.setupRequired) {
      // Setup already complete, redirect to login
      showMessage('Η αρχική ρύθμιση έχει ήδη ολοκληρωθεί. Ανακατεύθυνση...', 'info');
      setTimeout(() => {
        window.location.href = '/admin/login.html';
      }, 2000);
    }
  } catch (error) {
    console.error('Error checking setup status:', error);
  }
}

/**
 * Initialize page
 */
function init() {
  // Check setup status
  checkSetupStatus();

  // Attach form submit handler
  setupForm.addEventListener('submit', handleSubmit);

  // Real-time validation on blur
  usernameInput.addEventListener('blur', () => {
    const error = validateUsername(usernameInput.value);
    if (error) {
      showFieldError(usernameInput, usernameError, error);
    } else {
      clearFieldError(usernameInput, usernameError);
    }
  });

  emailInput.addEventListener('blur', () => {
    const error = validateEmail(emailInput.value);
    if (error) {
      showFieldError(emailInput, emailError, error);
    } else {
      clearFieldError(emailInput, emailError);
    }
  });

  passwordInput.addEventListener('blur', () => {
    const error = validatePassword(passwordInput.value);
    if (error) {
      showFieldError(passwordInput, passwordError, error);
    } else {
      clearFieldError(passwordInput, passwordError);
    }
  });

  confirmPasswordInput.addEventListener('blur', () => {
    const error = validateConfirmPassword(passwordInput.value, confirmPasswordInput.value);
    if (error) {
      showFieldError(confirmPasswordInput, confirmPasswordError, error);
    } else {
      clearFieldError(confirmPasswordInput, confirmPasswordError);
    }
  });

  // Clear errors on input
  usernameInput.addEventListener('input', () => {
    if (usernameInput.classList.contains('error')) {
      clearFieldError(usernameInput, usernameError);
    }
  });

  emailInput.addEventListener('input', () => {
    if (emailInput.classList.contains('error')) {
      clearFieldError(emailInput, emailError);
    }
  });

  passwordInput.addEventListener('input', () => {
    if (passwordInput.classList.contains('error')) {
      clearFieldError(passwordInput, passwordError);
    }
  });

  confirmPasswordInput.addEventListener('input', () => {
    if (confirmPasswordInput.classList.contains('error')) {
      clearFieldError(confirmPasswordInput, confirmPasswordError);
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
