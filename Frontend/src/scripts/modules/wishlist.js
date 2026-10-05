/**
 * Sonbhadra Connect — Wishlist Module
 * Handles local storage persistence, toggle actions, toast notifications,
 * auth guard pop-up modal, and backend synchronization in tourist document.
 */

import { isTouristLoggedIn } from '../utils/tourist-state.js';
import { TouristService } from '../../services/tourist.service.js';

const WISHLIST_STORAGE_KEY = 'sc_wishlist';

/**
 * Normalizes destination IDs (e.g. "dest-lakhaniya-dari" -> "lakhaniya-dari")
 * so card buttons and detail pages share the exact same identifier.
 * @param {string} id 
 * @returns {string}
 */
export function normalizeId(id) {
  return (id || '').replace(/^dest-/, '').trim().toLowerCase();
}

/**
 * Retrieve wishlist from localStorage cache
 * @returns {string[]} Array of normalized destination slugs
 */
export function getWishlist() {
  // If tourist is logged out, return empty list (guest cannot have wishlist)
  if (!isTouristLoggedIn()) {
    return [];
  }
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.map(normalizeId) : [];
  } catch (err) {
    console.warn('Could not read wishlist from localStorage:', err);
    return [];
  }
}

/**
 * Save wishlist array to localStorage cache
 * @param {string[]} list 
 */
export function saveWishlist(list) {
  try {
    const cleanList = Array.from(new Set((list || []).map(normalizeId)));
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(cleanList));
  } catch (err) {
    console.warn('Could not save wishlist to localStorage:', err);
  }
}

/**
 * Check if a destination is wishlisted
 * @param {string} id 
 * @returns {boolean}
 */
export function isWishlisted(id) {
  if (!id || !isTouristLoggedIn()) return false;
  const key = normalizeId(id);
  return getWishlist().includes(key);
}

/**
 * Injects modal styles once into document head
 */
function ensureModalStyles() {
  if (document.getElementById('sc-wishlist-modal-styles')) return;

  const style = document.createElement('style');
  style.id = 'sc-wishlist-modal-styles';
  style.textContent = `
    .sc-wishlist-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: rgba(5, 12, 9, 0.78);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .sc-wishlist-modal-backdrop.is-visible {
      opacity: 1;
      pointer-events: auto;
    }

    .sc-wishlist-modal {
      position: relative;
      width: 100%;
      max-width: 480px;
      background: linear-gradient(145deg, rgba(17, 30, 24, 0.96) 0%, rgba(10, 18, 14, 0.98) 100%);
      border: 1px solid rgba(231, 111, 81, 0.35);
      border-radius: 20px;
      padding: 2.2rem 2rem;
      color: #fff;
      font-family: var(--font-body, system-ui, -apple-system, sans-serif);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
      transform: scale(0.92) translateY(12px);
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .sc-wishlist-modal-backdrop.is-visible .sc-wishlist-modal {
      transform: scale(1) translateY(0);
    }

    .sc-wishlist-modal__close {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .sc-wishlist-modal__close:hover {
      background: rgba(231, 111, 81, 0.2);
      border-color: rgba(231, 111, 81, 0.5);
      color: #fff;
      transform: rotate(90deg);
    }

    .sc-wishlist-modal__header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .sc-wishlist-modal__icon-wrap {
      width: 64px;
      height: 64px;
      margin: 0 auto 1.2rem;
      border-radius: 50%;
      background: radial-gradient(circle at center, rgba(231, 111, 81, 0.25) 0%, rgba(231, 111, 81, 0.06) 70%);
      border: 1.5px solid rgba(231, 111, 81, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 24px rgba(231, 111, 81, 0.3);
      animation: heartGlowPulse 2.5s infinite ease-in-out;
    }

    @keyframes heartGlowPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(231, 111, 81, 0.25); }
      50% { transform: scale(1.06); box-shadow: 0 0 32px rgba(231, 111, 81, 0.45); }
    }

    .sc-wishlist-modal__title {
      font-family: var(--font-display, "Plus Jakarta Sans", sans-serif);
      font-size: 1.45rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.5rem;
      letter-spacing: -0.01em;
    }

    .sc-wishlist-modal__subtitle {
      font-size: 0.925rem;
      color: rgba(255, 255, 255, 0.72);
      line-height: 1.45;
      margin: 0;
    }

    .sc-wishlist-modal__subtitle strong {
      color: #F4A261;
      font-weight: 600;
    }

    .sc-wishlist-modal__benefits {
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 1.1rem;
      margin-bottom: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .sc-wishlist-benefit-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .sc-wishlist-benefit-icon {
      font-size: 1.15rem;
      line-height: 1;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .sc-wishlist-benefit-item strong {
      display: block;
      font-size: 0.86rem;
      color: rgba(255, 255, 255, 0.95);
      margin-bottom: 2px;
    }

    .sc-wishlist-benefit-item p {
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.55);
      margin: 0;
      line-height: 1.35;
    }

    .sc-wishlist-modal__actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .sc-modal-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.85rem 1.25rem;
      border-radius: 50px;
      font-family: var(--font-body, system-ui, sans-serif);
      font-size: 0.92rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.25s ease;
      text-align: center;
    }

    .sc-modal-btn--primary {
      background: linear-gradient(135deg, #E76F51 0%, #F4A261 100%);
      color: #0D1612;
      border: none;
      box-shadow: 0 4px 18px rgba(231, 111, 81, 0.35);
    }

    .sc-modal-btn--primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(231, 111, 81, 0.45);
      color: #000;
    }

    .sc-modal-btn--secondary {
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.16);
    }

    .sc-modal-btn--secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.3);
      color: #fff;
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Display the Tourist Account prompt modal when a logged-out user tries to wishlist
 * @param {string} destName 
 * @param {string} destId 
 */
export function showTouristAuthModal(destName, destId) {
  ensureModalStyles();

  let modalBackdrop = document.getElementById('scWishlistModal');
  if (!modalBackdrop) {
    modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'scWishlistModal';
    modalBackdrop.className = 'sc-wishlist-modal-backdrop';
    modalBackdrop.innerHTML = `
      <div class="sc-wishlist-modal" role="dialog" aria-modal="true" aria-labelledby="scModalTitle">
        <button class="sc-wishlist-modal__close" id="scModalCloseBtn" aria-label="Close dialog" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="sc-wishlist-modal__header">
          <div class="sc-wishlist-modal__icon-wrap">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#E76F51" stroke="#E76F51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <h3 id="scModalTitle" class="sc-wishlist-modal__title">Save to Your Wishlist</h3>
          <p class="sc-wishlist-modal__subtitle">
            Create a Tourist Account to add <strong id="scModalDestName">this destination</strong> to your personal wishlist and manage it in your Tourist Dashboard.
          </p>
        </div>

        <div class="sc-wishlist-modal__benefits">
          <div class="sc-wishlist-benefit-item">
            <span class="sc-wishlist-benefit-icon">📌</span>
            <div>
              <strong>Saved in Your Tourist Dashboard</strong>
              <p>Keep all your dream Sonbhadra spots organized with live count tracking.</p>
            </div>
          </div>
          <div class="sc-wishlist-benefit-item">
            <span class="sc-wishlist-benefit-icon">🧭</span>
            <div>
              <strong>Book Verified Native Tour Guides</strong>
              <p>Directly schedule local guides for secret waterfalls, rock art, and treks.</p>
            </div>
          </div>
          <div class="sc-wishlist-benefit-item">
            <span class="sc-wishlist-benefit-icon">🌱</span>
            <div>
              <strong>Earn Eco-Points & Perks</strong>
              <p>Collect reward badges for responsible, sustainable travel in Sonbhadra.</p>
            </div>
          </div>
        </div>

        <div class="sc-wishlist-modal__actions">
          <a href="/src/app/tourists/auth/index.html#signup" class="sc-modal-btn sc-modal-btn--primary" id="scModalSignupBtn">
            Create Free Tourist Account
          </a>
          <a href="/src/app/tourists/auth/index.html#signin" class="sc-modal-btn sc-modal-btn--secondary" id="scModalSigninBtn">
            Already have an account? Sign In
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(modalBackdrop);

    // Close logic
    const closeModal = () => modalBackdrop.classList.remove('is-visible');
    const closeBtn = modalBackdrop.querySelector('#scModalCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalBackdrop.classList.contains('is-visible')) {
        closeModal();
      }
    });
  }

  // Update dynamic destination name
  const nameEl = modalBackdrop.querySelector('#scModalDestName');
  if (nameEl) nameEl.textContent = destName || 'this destination';

  // Save pending slug so auth page can auto-add it upon signin/signup
  if (destId) {
    const cleanSlug = normalizeId(destId);
    try {
      sessionStorage.setItem('pending_wishlist_slug', cleanSlug);
    } catch {}
  }

  // Show modal
  modalBackdrop.classList.add('is-visible');
}

/**
 * Show a floating toast notification
 * @param {string} name Destination title
 * @param {boolean} added Whether it was added or removed
 */
export function showWishlistToast(name, added) {
  let toast = document.getElementById('wishlistToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'wishlistToast';
    toast.className = 'wishlist-toast';
    document.body.appendChild(toast);
  }

  const heartSvg = `
    <svg viewBox="0 0 24 24" fill="${added ? '#E76F51' : 'none'}" stroke="${added ? '#E76F51' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  `;

  toast.innerHTML = `
    ${heartSvg}
    <span>${added ? `<strong>${name}</strong> added to your wishlist` : `<strong>${name}</strong> removed from wishlist`}</span>
  `;

  toast.classList.add('is-visible');

  if (toast._dismissTimer) {
    clearTimeout(toast._dismissTimer);
  }

  toast._dismissTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 3200);
}

/**
 * Sync wishlist from live backend for the logged-in tourist
 */
export async function syncWishlistWithBackend() {
  if (!isTouristLoggedIn()) {
    // Clear wishlist cache if logged out
    saveWishlist([]);
    return [];
  }

  try {
    const res = await TouristService.getWishlist();
    if (res.ok && Array.isArray(res.data)) {
      const slugs = res.data.map(item => normalizeId(item.slug || item._id || item.id));
      saveWishlist(slugs);
      return slugs;
    }
  } catch (err) {
    console.warn('[Wishlist] Backend sync error:', err);
  }
  return getWishlist();
}

/**
 * Handles toggling wishlist with backend persistence & auth check
 * @param {string} rawDestId 
 * @param {string} destName 
 * @param {HTMLButtonElement} btn 
 * @param {Function} updateVisualCallback 
 */
export async function handleWishlistAction(rawDestId, destName, btn, updateVisualCallback) {
  const cleanId = normalizeId(rawDestId);

  // 1. Auth Guard: If logged out, display Tourist Account prompt modal
  if (!isTouristLoggedIn()) {
    showTouristAuthModal(destName, cleanId);
    return;
  }

  // 2. Logged-in Tourist: Toggle on backend and update document
  const currentlyWishlisted = isWishlisted(cleanId);
  const targetState = !currentlyWishlisted;

  // Optimistic UI update
  updateVisualCallback(targetState);

  try {
    let res;
    if (targetState) {
      res = await TouristService.addToWishlist(cleanId);
    } else {
      res = await TouristService.removeFromWishlist(cleanId);
    }

    if (res && res.ok) {
      // Update local cache
      const list = getWishlist();
      const idx = list.indexOf(cleanId);
      if (targetState && idx === -1) list.push(cleanId);
      else if (!targetState && idx > -1) list.splice(idx, 1);
      saveWishlist(list);

      // Trigger cross-page and dashboard sync
      window.dispatchEvent(new CustomEvent('sc:wishlist-updated', {
        detail: { id: cleanId, isAdded: targetState, list, count: list.length }
      }));

      showWishlistToast(destName, targetState);
    } else {
      // Revert on failure
      updateVisualCallback(currentlyWishlisted);
      showWishlistToast(res?.error || 'Could not update wishlist', false);
    }
  } catch (err) {
    console.error('[Wishlist] Action failed:', err);
    updateVisualCallback(currentlyWishlisted);
  }
}

/**
 * Set card button visual and accessibility state
 * @param {HTMLButtonElement} btn 
 * @param {boolean} active 
 */
function setCardButtonVisualState(btn, active) {
  btn.classList.toggle('is-wishlisted', active);
  btn.setAttribute('aria-pressed', String(active));
  const destName = btn.dataset.destName || 'destination';
  btn.setAttribute('aria-label', active ? `Remove ${destName} from wishlist` : `Add ${destName} to wishlist`);

  const span = btn.querySelector('.wishlist-text, span');
  if (span) {
    span.textContent = active ? 'Saved' : 'Wishlist';
  } else {
    const textNode = Array.from(btn.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
    if (textNode) {
      textNode.textContent = active ? ' Saved' : ' Wishlist';
    }
  }
}

/**
 * Initialize all destination card wishlist buttons on the destinations index page
 */
export async function initCardWishlistButtons() {
  const buttons = document.querySelectorAll('.dest-page-card__wishlist-btn');
  if (!buttons.length) return;

  // Sync with backend if tourist is logged in
  if (isTouristLoggedIn()) {
    await syncWishlistWithBackend();
  }

  // Restore state
  const currentWishlist = getWishlist();
  buttons.forEach(btn => {
    const rawId = btn.dataset.destId;
    const cleanId = normalizeId(rawId);
    const active = currentWishlist.includes(cleanId);
    setCardButtonVisualState(btn, active);

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const destName = btn.dataset.destName || 'Destination';
      await handleWishlistAction(cleanId, destName, btn, (newState) => {
        setCardButtonVisualState(btn, newState);
      });
    });
  });

  // Listen for storage / cross-tab or detail page changes
  window.addEventListener('storage', (e) => {
    if (e.key === WISHLIST_STORAGE_KEY) {
      const updatedList = getWishlist();
      buttons.forEach(btn => {
        const cleanId = normalizeId(btn.dataset.destId);
        setCardButtonVisualState(btn, updatedList.includes(cleanId));
      });
    }
  });

  window.addEventListener('sc:wishlist-updated', (e) => {
    const { id, isAdded } = e.detail;
    buttons.forEach(btn => {
      if (normalizeId(btn.dataset.destId) === id) {
        setCardButtonVisualState(btn, isAdded);
      }
    });
  });
}

/**
 * Initialize individual destination detail page wishlist button
 * @param {string} rawDestId 
 * @param {string} destName 
 */
export async function initDetailWishlistButton(rawDestId, destName) {
  const btn = document.getElementById('detailWishlistBtn');
  if (!btn) return;

  const destId = normalizeId(rawDestId);

  function updateState(active) {
    btn.classList.toggle('is-wishlisted', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.setAttribute('aria-label', active ? `Remove ${destName} from wishlist` : `Add ${destName} to wishlist`);
    const textSpan = btn.querySelector('span');
    if (textSpan) {
      textSpan.textContent = active ? 'Saved in Wishlist' : 'Add to Wishlist';
    }
  }

  // Sync backend if logged in
  if (isTouristLoggedIn()) {
    await syncWishlistWithBackend();
  }

  // Initial state
  updateState(isWishlisted(destId));

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    await handleWishlistAction(destId, destName, btn, (newState) => {
      updateState(newState);
    });
  });

  // Cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === WISHLIST_STORAGE_KEY) {
      updateState(isWishlisted(destId));
    }
  });

  window.addEventListener('sc:wishlist-updated', (e) => {
    if (e.detail.id === destId) {
      updateState(e.detail.isAdded);
    }
  });
}
