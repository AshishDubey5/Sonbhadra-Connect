/**
 * Navigation Component Controller
 * Scroll-aware glassmorphic header, mobile full-screen drawer, and smooth anchor scrolling
 */

import { $, $$, on } from '../utils/dom.js';
import { getTourist, isTouristLoggedIn, clearTouristSession } from '../utils/tourist-state.js';

export function initNavigation() {
  const header = $('#siteHeader');
  const navToggle = $('#navToggle');
  const mobileMenu = $('#mobileMenu');

  if (!header) return;

  // 1. Scroll-triggered glassmorphism
  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateHeader() {
    if (window.scrollY > 40) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
    ticking = false;
  }

  on(window, 'scroll', () => {
    lastScrollY = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });

  // Initial check
  updateHeader();

  // 2. Mobile Drawer Toggle
  if (navToggle && mobileMenu) {
    on(navToggle, 'click', () => {
      const isOpen = navToggle.classList.toggle('is-open');
      mobileMenu.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    $$('.mobile-menu__link').forEach(link => {
      on(link, 'click', () => {
        navToggle.classList.remove('is-open');
        mobileMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // 3. Active Section Highlighting
  const sections = $$('section[id]');
  if ('IntersectionObserver' in window && sections.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          $$('.nav-link').forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('is-active');
            } else {
              link.classList.remove('is-active');
            }
          });
        }
      });
    }, { threshold: 0.3 });

    sections.forEach(sec => observer.observe(sec));
  }

  // 4. Dropdowns (Tourist & Creator)
  const dropdowns = $$('.nav-dropdown');

  dropdowns.forEach(dropdown => {
    const btn = dropdown.querySelector('.nav-dropdown__btn');
    if (!btn) return;

    on(btn, 'click', (e) => {
      e.stopPropagation();
      const wasActive = dropdown.classList.contains('is-active');

      // Close all dropdowns first
      dropdowns.forEach(d => {
        d.classList.remove('is-active');
        const b = d.querySelector('.nav-dropdown__btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      });

      if (!wasActive) {
        dropdown.classList.add('is-active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Close dropdowns when clicking anywhere outside
  on(document, 'click', (e) => {
    if (!e.target.closest('.nav-dropdown')) {
      dropdowns.forEach(d => {
        d.classList.remove('is-active');
        const b = d.querySelector('.nav-dropdown__btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Close dropdowns on Escape key
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape') {
      dropdowns.forEach(d => {
        d.classList.remove('is-active');
        const b = d.querySelector('.nav-dropdown__btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // 5. Tourist Portal Integration (Sign In / Sign Up & Logged-in State)
  setupTouristPortal(dropdowns);
}

/**
 * Configure Tourist Menu depending on authentication state
 */
function setupTouristPortal(dropdowns) {
  const touristDropdown = $('#navTouristDropdown');
  const loggedIn = isTouristLoggedIn();
  const tourist = getTourist();

  if (touristDropdown && loggedIn && tourist) {
    const btnSpan = touristDropdown.querySelector('.nav-dropdown__btn--tourist span');
    const menu = touristDropdown.querySelector('.nav-dropdown__menu');
    const firstName = (tourist.fullName || 'Tourist').split(' ')[0];

    if (btnSpan) {
      btnSpan.textContent = `🌿 ${firstName}`;
    }

    if (menu) {
      menu.innerHTML = `
        <a href="/src/app/tourists/dashboard/index.html" class="nav-dropdown__item" role="menuitem">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>My Dashboard</span>
        </a>
        <a href="/src/app/tourists/dashboard/index.html#bookings" class="nav-dropdown__item" role="menuitem">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <span>My Bookings</span>
        </a>
        <a href="/src/app/tourists/dashboard/index.html#wishlist" class="nav-dropdown__item" role="menuitem">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>My Wishlist</span>
        </a>
        <button type="button" class="nav-dropdown__item nav-dropdown__item--signout" id="navTouristSignOutBtn" style="width:100%; border:none; background:none; text-align:left; cursor:pointer; color:#f87171;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Sign Out</span>
        </button>
      `;

      // Handle sign out
      $('#navTouristSignOutBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        clearTouristSession();
        showNavToast('Logged out successfully', 'info');
        setTimeout(() => window.location.reload(), 500);
      });
    }

    // Update Mobile Menu Tourist Actions if present
    const mobileTouristWrap = $('.mobile-menu__portal:first-of-type .mobile-menu__portal-actions');
    if (mobileTouristWrap) {
      mobileTouristWrap.innerHTML = `
        <a href="/src/app/tourists/dashboard/index.html" class="btn btn--outline-light w-full">My Dashboard (${firstName})</a>
        <button type="button" class="btn btn--outline-light w-full" id="mobileTouristSignOutBtn" style="color:#f87171; border-color:rgba(239,68,68,0.3);">Sign Out</button>
      `;
      $('#mobileTouristSignOutBtn')?.addEventListener('click', () => {
        clearTouristSession();
        window.location.reload();
      });
    }
  }

  // Handle click on tourist action links (if not logged in)
  on(document, 'click', (e) => {
    const touristAction = e.target.closest('[data-tourist-action]');
    if (touristAction) {
      e.preventDefault();
      const actionType = touristAction.dataset.touristAction === 'signup' ? '#signup' : '#signin';

      // Dismiss any open dropdowns or mobile drawer
      dropdowns.forEach(d => {
        d.classList.remove('is-active');
        const b = d.querySelector('.nav-dropdown__btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      });

      window.location.href = `/src/app/tourists/auth/index.html${actionType}`;
    }
  });
}

/**
 * Toast Notification Helper for Navbar interactions
 */
export function showNavToast(message, type = 'info') {
  let container = document.getElementById('nav-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'nav-toast-container';
    container.className = 'nav-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `nav-toast nav-toast--${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('is-hiding');
    setTimeout(() => toast.remove(), 280);
  }, 3200);
}
