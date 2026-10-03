/**
 * Destinations Page Controller Module
 * Manages category filters, Explore More dropdown toggle, and hash-anchor deep linking
 */

import { $, $$, on } from '../utils/dom.js';

export function initDestinationsPage() {
  const filterPills = $$('[data-dest-filter]');
  const allCards = $$('.dest-page-card[data-category]');
  const filterCount = $('#destFilterCount');
  const hiddenGrid = $('#destHiddenGrid');
  const exploreBtn = $('#destExploreMoreBtn');
  const exploreBtnText = $('#destExploreMoreText');

  // ===== 1. EXPAND / COLLAPSE HELPERS =====
  function expandHiddenDestinations() {
    if (hiddenGrid && !hiddenGrid.classList.contains('is-visible')) {
      hiddenGrid.classList.add('is-visible');
      const hiddenCards = hiddenGrid.querySelectorAll('.dest-page-card, .dest-reveal');
      hiddenCards.forEach(card => card.classList.add('is-visible', 'is-revealed'));
      if (exploreBtn) {
        exploreBtn.classList.add('is-expanded');
        exploreBtn.setAttribute('aria-expanded', 'true');
      }
      if (exploreBtnText) {
        exploreBtnText.textContent = 'Show Less';
      }
    }
  }

  function collapseHiddenDestinations() {
    if (hiddenGrid && hiddenGrid.classList.contains('is-visible')) {
      hiddenGrid.classList.remove('is-visible');
      if (exploreBtn) {
        exploreBtn.classList.remove('is-expanded');
        exploreBtn.setAttribute('aria-expanded', 'false');
      }
      if (exploreBtnText) {
        exploreBtnText.textContent = 'Explore More';
      }
    }
  }

  // ===== 2. EXPLORE MORE BUTTON TOGGLE =====
  if (exploreBtn && hiddenGrid) {
    on(exploreBtn, 'click', () => {
      const isExpanded = hiddenGrid.classList.contains('is-visible');
      if (isExpanded) {
        collapseHiddenDestinations();
      } else {
        expandHiddenDestinations();
        setTimeout(() => {
          hiddenGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    });
  }

  // ===== 2.5 CARD CLICK NAVIGATION =====
  const DEST_PAGE_MAP = {
    'dest-lakhaniya-dari': './lakhaniya-dari.html',
    'dest-rihand-dam': './rihand.html',
    'dest-vijaygarh-fort': './vijaygarh-fort.html',
    'dest-agori-fort': './agori-fort.html',
    'dest-mukha-falls': './mukha-falls.html',
    'dest-salkhan-fossils': './vijaygarh-fort.html',
    'dest-obra-dam': './rihand.html',
    'dest-chopan-ghats': './agori-fort.html',
    'dest-kaimur-sanctuary': './mukha-falls.html'
  };

  allCards.forEach(card => {
    card.style.cursor = 'pointer';
    const linkEl = card.querySelector('.dest-page-card__link');
    const targetUrl = (linkEl && linkEl.getAttribute('href') && linkEl.getAttribute('href') !== 'javascript:void(0);')
      ? linkEl.getAttribute('href')
      : (DEST_PAGE_MAP[card.id] || './rihand.html');

    if (linkEl && (!linkEl.getAttribute('href') || linkEl.getAttribute('href') === 'javascript:void(0);')) {
      linkEl.setAttribute('href', targetUrl);
    }

    on(card, 'click', (e) => {
      // If clicking directly on a link with an href, let default link handle it
      if (e.target.closest('a')) return;
      window.location.href = targetUrl;
    });
  });

  // ===== 3. CATEGORY FILTER =====
  if (filterPills.length > 0 && allCards.length > 0) {
    filterPills.forEach(pill => {
      on(pill, 'click', () => {
        // Toggle active styling
        filterPills.forEach(p => p.classList.remove('filter-pill--active'));
        pill.classList.add('filter-pill--active');

        const category = pill.getAttribute('data-dest-filter');
        let visibleCount = 0;

        allCards.forEach(card => {
          const cardCat = card.getAttribute('data-category');
          if (category === 'all' || cardCat === category) {
            card.style.display = '';
            visibleCount++;
          } else {
            card.style.display = 'none';
          }
        });

        // Update results counter
        if (filterCount) {
          filterCount.textContent = `${visibleCount} destination${visibleCount !== 1 ? 's' : ''}`;
        }

        // When filtering by a specific category, show the hidden grid so matching destinations appear
        if (category !== 'all') {
          expandHiddenDestinations();
        }
      });
    });
  }

  // ===== 4. HASH-ANCHOR DEEP LINKING =====
  function handleHashDestination() {
    if (!window.location.hash) return;
    const targetId = window.location.hash.substring(1);
    const targetCard = document.getElementById(targetId);
    if (!targetCard) return;

    // If destination is inside hidden grid, auto-reveal it
    if (hiddenGrid && hiddenGrid.contains(targetCard)) {
      expandHiddenDestinations();
    }

    // Reset filter to 'all' so destination isn't hidden by an active filter
    filterPills.forEach(p => p.classList.remove('filter-pill--active'));
    const allPill = document.querySelector('[data-dest-filter="all"]');
    if (allPill) allPill.classList.add('filter-pill--active');
    allCards.forEach(c => (c.style.display = ''));
    if (filterCount) filterCount.textContent = '9 destinations';

    // Scroll smoothly to target and pulse highlight
    setTimeout(() => {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetCard.classList.add('is-target-highlight');
      setTimeout(() => {
        targetCard.classList.remove('is-target-highlight');
      }, 3000);
    }, 250);
  }

  handleHashDestination();
  on(window, 'hashchange', handleHashDestination);
}
