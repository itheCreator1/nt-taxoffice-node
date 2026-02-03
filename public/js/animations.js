/**
 * Animations Module
 * Handles scroll-based animations using Intersection Observer API
 */

export function initAnimations() {
  const sections = document.querySelectorAll('section');
  if (sections.length === 0) {
    return; // No sections to animate
  }

  // Create intersection observer for scroll animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    },
    { threshold: 0.1 }
  );

  // Observe all sections
  sections.forEach((section) => {
    observer.observe(section);
  });
}
