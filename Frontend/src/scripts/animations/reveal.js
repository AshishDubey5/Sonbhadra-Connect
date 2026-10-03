/**
 * Scroll Reveal Animation Engine
 * Uses modern IntersectionObserver with fallback and prefers-reduced-motion support
 */

import { $$ } from '../utils/dom.js';

export function initScrollReveals() {
  // Check prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = $$('.reveal, .dest-reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => {
      el.classList.add('is-revealed', 'is-visible');
    });
    return;
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.08
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed', 'is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  reveals.forEach(el => observer.observe(el));
}
