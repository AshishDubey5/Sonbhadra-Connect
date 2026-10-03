/**
 * Cinematic Hero Controller
 * Chapter sequence, crossfade transitions, progress bar animation, interactive chapter navigation
 */

import { $, $$, on } from '../utils/dom.js';

export const HERO_CHAPTERS = [
  {
    chapter: '01',
    category: 'waterfalls',
    name: 'THE WILD',
    title: 'DISCOVER SONBHADRA THROUGH LOCAL EYES.',
    lead: 'Where ancient Vindhyan forests meet untouched water corridors and towering cascades.',
    bg: '../../public/assets/images/destinations/lakhaniya-dari.webp',
    meta: 'LAKHANIYA DARI FALLS · SONBHADRA'
  },
  {
    chapter: '02',
    category: 'dams',
    name: 'THE WATER',
    title: 'WHERE HORIZONS MERGE INTO TRANQUILITY.',
    lead: 'One of Asia’s largest inland reservoirs, bathed in golden hour solitude and mist.',
    bg: '../../public/assets/images/destinations/rihand-dam.webp',
    meta: 'RIHAND DAM RESERVOIR · PIPRI'
  },
  {
    chapter: '03',
    category: 'heritage',
    name: 'THE SACRED',
    title: 'CENTURIES OF STORIES CARVED IN STONE.',
    lead: 'A 5th-century cliff citadel guarding 360-degree vistas over the mystic Son valley.',
    bg: '../../public/assets/images/destinations/vijaygarh-fort.webp',
    meta: 'VIJAYGARH FORT · MAU KALAN'
  },
  {
    chapter: '04',
    category: 'confluence',
    name: 'THE CONFLUENCE',
    title: 'ISLAND CITADELS ON RUSHING WATERS.',
    lead: 'Encircled by twin shimmering rivers, accessible only by local wooden boatmen.',
    bg: '../../public/assets/images/destinations/agori-fort.webp',
    meta: 'AGORI FORT · CHOPAN'
  },
  {
    chapter: '05',
    category: 'creators',
    name: 'THROUGH LOCAL EYES',
    title: 'EXPLORE WITH THOSE WHO KNOW IT BEST.',
    lead: 'Unlocking hidden trails, tribal cuisine, and secret gorges guided by local storytellers.',
    bg: '../../public/assets/images/creators/amit-rk-vlogs.webp',
    meta: 'LOCAL CREATORS NETWORK · SONBHADRA'
  }
];

export function initHero() {
  const slides = $$('.hero__slide');
  const chapterNumber = $('#heroChapterNumber');
  const chapterTitle = $('#heroChapterTitle');
  const heroTitle = $('#heroTitle');
  const heroLead = $('#heroLead');
  const progressFill = $('#heroProgressFill');
  const prevBtn = $('#heroPrev');
  const nextBtn = $('#heroNext');
  const playPauseBtn = $('#heroPlayPause');
  const muteBtn = $('#heroMute');
  const categoryBtns = $$('.hero__category-btn');

  if (slides.length === 0) return;

  let currentIndex = 0;
  let isPlaying = true;
  let isMuted = true;
  let progress = 0;
  const slideDuration = 6500; // 6.5s per slide
  let lastTime = performance.now();
  let animFrameId = null;

  function updateSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    const currentData = HERO_CHAPTERS[currentIndex];

    // Slide visibility
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === currentIndex);
    });

    // Content updates with micro-fade
    if (chapterNumber) chapterNumber.textContent = `CHAPTER ${currentData.chapter}`;
    if (chapterTitle) chapterTitle.textContent = currentData.name;
    if (heroTitle) heroTitle.innerHTML = currentData.title.replace('THROUGH LOCAL EYES', '<span class="hero__title-accent">THROUGH LOCAL EYES</span>');
    if (heroLead) heroLead.textContent = currentData.lead;

    // Category button active state
    categoryBtns.forEach(btn => {
      const cat = btn.getAttribute('data-category');
      btn.classList.toggle('is-active', cat === currentData.category);
    });

    progress = 0;
    if (progressFill) progressFill.style.width = '0%';
  }

  function tick(now) {
    if (isPlaying) {
      const delta = now - lastTime;
      progress += (delta / slideDuration) * 100;

      if (progress >= 100) {
        updateSlide(currentIndex + 1);
      } else if (progressFill) {
        progressFill.style.width = `${progress}%`;
      }
    }
    lastTime = now;
    animFrameId = requestAnimationFrame(tick);
  }

  // Controls
  if (nextBtn) {
    on(nextBtn, 'click', () => {
      updateSlide(currentIndex + 1);
    });
  }

  if (prevBtn) {
    on(prevBtn, 'click', () => {
      updateSlide(currentIndex - 1);
    });
  }

  if (playPauseBtn) {
    on(playPauseBtn, 'click', () => {
      isPlaying = !isPlaying;
      playPauseBtn.setAttribute('aria-label', isPlaying ? 'Pause Slideshow' : 'Play Slideshow');
      playPauseBtn.innerHTML = isPlaying
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    });
  }

  if (muteBtn) {
    on(muteBtn, 'click', () => {
      isMuted = !isMuted;
      muteBtn.setAttribute('aria-label', isMuted ? 'Unmute Audio' : 'Mute Audio');
      muteBtn.innerHTML = isMuted
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
    });
  }

  // Category bottom pills
  categoryBtns.forEach((btn, idx) => {
    on(btn, 'click', () => {
      updateSlide(idx);
    });
  });

  // Start sequence
  updateSlide(0);
  animFrameId = requestAnimationFrame(tick);
}
