/**
 * Destinations Page Application Bootstrap
 * Initializes navigation, scroll reveals, category filters, and dropdown interactions
 */

import { initNavigation } from './modules/navigation.js';
import { initScrollReveals } from './animations/reveal.js';
import { initDestinationsPage } from './modules/destinations.js';

function boot() {
  // 1. Initialize Glassmorphic Header & Mobile Drawer
  initNavigation();

  // 2. Initialize Scroll Reveal Animations
  initScrollReveals();

  // 3. Initialize Destinations Controller (Filters, Dropdown, Hash Navigation)
  initDestinationsPage();

  console.info('🗺️ Sonbhadra Destinations Page initialized successfully.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
