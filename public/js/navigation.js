/**
 * Navigation Module
 * Handles mobile menu toggle and smooth scrolling functionality
 */

export function initNavigation() {
    // Mobile menu toggle functionality
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            document.querySelector('.nav-menu').classList.toggle('active');
        });
    }

    // Smooth scrolling for anchor links
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
}
