/**
 * Form Validation Module
 * Handles contact form submission and validation
 */

export function initFormValidation() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) {
    return; // Form not present on this page
  }

  // Form submission handling
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const formValues = {};
    formData.forEach((value, key) => {
      formValues[key] = value;
    });

    const isValid = validateForm();

    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');

    if (isValid) {
      console.log('Form submitted:', formValues);

      successMessage.style.display = 'block';
      errorMessage.style.display = 'none';
      this.reset();
      successMessage.scrollIntoView({ behavior: 'smooth' });

      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 5000);
    } else {
      errorMessage.style.display = 'block';
      successMessage.style.display = 'none';
    }
  });

  // Input change listeners to clear error states
  const allInputs = contactForm.querySelectorAll('input, textarea, select');
  allInputs.forEach((input) => {
    input.addEventListener('input', function () {
      this.classList.remove('invalid');
      document.getElementById('error-message').style.display = 'none';
    });
  });
}

/**
 * Validates the contact form fields
 * @returns {boolean} True if form is valid, false otherwise
 */
function validateForm() {
  let isValid = true;
  const requiredFields = ['name', 'email', 'subject', 'message'];

  // Check required fields
  requiredFields.forEach((field) => {
    const input = document.getElementById(field);
    if (!input.value.trim()) {
      input.classList.add('invalid');
      isValid = false;
    } else {
      input.classList.remove('invalid');
    }
  });

  // Validate email format
  const emailInput = document.getElementById('email');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(emailInput.value)) {
    emailInput.classList.add('invalid');
    isValid = false;
  }

  return isValid;
}
