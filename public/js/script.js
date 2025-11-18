/**
 * NT - TAXOFFICE Main JavaScript File
 * Contains functionality for both index.html and contact.html
 */

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle functionality
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            document.querySelector('.nav-menu').classList.toggle('active');
        });
    }

    // Smooth scrolling for anchor links (only on index.html)
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    if (anchorLinks.length > 0) {
        anchorLinks.forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId !== '#' && document.querySelector(targetId)) {
                    e.preventDefault();
                    document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
                    document.querySelector('.nav-menu').classList.remove('active');
                }
            });
        });
    }

    // Contact form handling (only on contact.html)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const formValues = {};
            formData.forEach((value, key) => {
                formValues[key] = value;
            });

            let isValid = true;
            const requiredFields = ['name', 'email', 'subject', 'message'];

            requiredFields.forEach(field => {
                const input = document.getElementById(field);
                if (!input.value.trim()) {
                    input.classList.add('invalid');
                    isValid = false;
                } else {
                    input.classList.remove('invalid');
                }
            });

            const emailInput = document.getElementById('email');
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailInput.value)) {
                emailInput.classList.add('invalid');
                isValid = false;
            }

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

        const allInputs = contactForm.querySelectorAll('input, textarea, select');
        allInputs.forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('invalid');
                document.getElementById('error-message').style.display = 'none';
            });
        });
    }

    // Animation on scroll using Intersection Observer API
    const sections = document.querySelectorAll('section');
    if (sections.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, { threshold: 0.1 });

        sections.forEach(section => {
            observer.observe(section);
        });
    }
});

