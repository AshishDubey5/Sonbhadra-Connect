/**
 * Main Application Bootstrap
 * Initializes all modules, animations, and ecosystem components
 */

import { initNavigation } from './modules/navigation.js';
import { initHero } from './modules/hero.js';
import { initScrollReveals } from './animations/reveal.js';
import { initCreatorsFilter } from './modules/creators-filter.js';
import { initVideoModal } from './modules/video-modal.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Navigation
  initNavigation();

  // 2. Initialize Cinematic Hero Player
  initHero();

  // 3. Initialize Scroll Reveal Animations
  initScrollReveals();

  // 4. Initialize Interactive Filters
  initCreatorsFilter();

  // 5. Initialize Interactive Video Modal
  initVideoModal();

  console.info('🌲 SonbhadraConnect Platform initialized successfully.');
});
