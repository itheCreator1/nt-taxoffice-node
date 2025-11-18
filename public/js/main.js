/**
 * NT - TAXOFFICE Main Entry Point
 * Initializes all application modules
 */

import { initNavigation } from './navigation.js';
import { initFormValidation } from './form-validation.js';
import { initAnimations } from './animations.js';

/**
 * Initialize application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initNavigation();
    initFormValidation();
    initAnimations();
});
