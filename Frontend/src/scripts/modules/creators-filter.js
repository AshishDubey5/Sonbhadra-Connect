/**
 * Creator Filtering & Dynamic Hydration Controller
 * Filters creator cards seamlessly and keeps top creators synced with MongoDB
 */

import { $$, on } from '../utils/dom.js';
import { CreatorService } from '../../services/creator.service.js';

export function initCreatorsFilter() {
  const filterBtns = $$('[data-creator-filter]');
  const creatorCards = $$('[data-creator-category]');

  if (filterBtns.length === 0 || creatorCards.length === 0) return;

  filterBtns.forEach(btn => {
    on(btn, 'click', () => {
      const category = btn.getAttribute('data-creator-filter');

      // Toggle active state
      filterBtns.forEach(b => b.classList.remove('filter-pill--active'));
      btn.classList.add('filter-pill--active');

      // Filter cards
      const allCards = $$('[data-creator-category]');
      allCards.forEach(card => {
        const cardCat = card.getAttribute('data-creator-category');
        if (category === 'all' || cardCat === category) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(12px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });

  // Dynamically sync latest creator profiles from MongoDB
  syncCreatorsWithDB();
}

async function syncCreatorsWithDB() {
  try {
    const creators = await CreatorService.getTopCreators(3);
    if (!creators || !Array.isArray(creators) || creators.length === 0) return;

    const cards = document.querySelectorAll('.creators-grid .creator-card');
    if (!cards || cards.length === 0) return;

    const slotConfigs = [
      { category: 'trekking', defaultArea: 'Renukoot, Pipri & Rihand' },
      { category: 'cinematic', defaultArea: 'Chopan & Son River' },
      { category: 'heritage', defaultArea: 'Ghorawal & Robertsganj' }
    ];

    creators.forEach((creator, idx) => {
      if (idx >= cards.length) return;
      const card = cards[idx];
      const cfg = slotConfigs[idx] || slotConfigs[0];

      // Update avatar
      const img = card.querySelector('.creator-card__header img');
      if (img && creator.avatar) {
        img.src = creator.avatar;
        img.alt = `${creator.fullName || creator.creatorName} Portrait`;
      }

      // Update name
      const nameEl = card.querySelector('.creator-card__name');
      if (nameEl) nameEl.textContent = creator.fullName || creator.creatorName;

      // Update handle
      const handleEl = card.querySelector('.creator-card__handle');
      if (handleEl) handleEl.textContent = `@${creator.creatorName}`;

      // Update bio
      const bioEl = card.querySelector('.creator-card__bio');
      if (bioEl && creator.bio) bioEl.textContent = creator.bio;

      // Update covering city / top area
      const areaEl = card.querySelector('.creator-card__footer .text-meta');
      if (areaEl) {
        areaEl.textContent = `Top Area: ${creator.coveringCity || cfg.defaultArea}`;
      }

      // Update "View Guides" link to creator's profile
      const linkEl = card.querySelector('.creator-card__footer .btn-text-link');
      const slug = creator.creatorName || creator.slug;
      if (slug) {
        const staticSlugs = ['creator5776', 'creator_2', 'edgeknow880', 'new_creator'];
        const isSrcApp = window.location.pathname.includes('/src/app/');
        const prefix = isSrcApp ? './Creators/creator/profiles/' : './src/app/Creators/creator/profiles/';
        const profileUrl = staticSlugs.includes(slug)
          ? `${prefix}${slug}.html`
          : `${prefix}profile.html?creator=${encodeURIComponent(slug)}`;

        if (linkEl) {
          linkEl.href = profileUrl;
          linkEl.setAttribute('aria-label', `View ${creator.fullName || creator.creatorName}'s profile`);
        }

        // Also make header (avatar) and creator name clickable to open profile
        const headerEl = card.querySelector('.creator-card__header');
        if (headerEl) {
          headerEl.style.cursor = 'pointer';
          headerEl.title = `View ${creator.fullName || creator.creatorName}'s profile`;
          headerEl.onclick = () => { window.location.href = profileUrl; };
        }
        if (nameEl) {
          nameEl.style.cursor = 'pointer';
          nameEl.title = `View ${creator.fullName || creator.creatorName}'s profile`;
          nameEl.onclick = () => { window.location.href = profileUrl; };
        }
      }
    });
  } catch (err) {
    console.debug('Dynamic creators sync fallback to HTML:', err);
  }
}

