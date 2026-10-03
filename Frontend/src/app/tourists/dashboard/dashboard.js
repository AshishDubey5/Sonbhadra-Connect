/**
 * Tourist Dashboard Controller
 * Sonbhadra Tourism — Personalized Tourist Experience
 */

import { TouristService } from '../../../services/tourist.service.js';
import {
  getTourist,
  isTouristLoggedIn,
  updateTouristFields,
} from '../../../scripts/utils/tourist-state.js';
import { DESTINATIONS_DATA } from '../../../data/destinations.js';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

let currentTourist = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Auth Guard
  if (!isTouristLoggedIn()) {
    redirectToAuth();
    return;
  }

  // 2. Load stored session and verify with live backend
  currentTourist = getTourist();
  renderTouristData(currentTourist);

  // Background live sync with API
  try {
    const res = await TouristService.getCurrentTourist();
    if (res.ok && res.data) {
      currentTourist = res.data;
      renderTouristData(currentTourist);
    } else if (res.error && res.error.includes('Session expired')) {
      showToast('Session expired. Redirecting to login...', 'error');
      setTimeout(redirectToAuth, 1200);
      return;
    }
  } catch (e) {
    console.warn('[Dashboard] Could not verify live tourist session:', e);
  }

  // 3. Initialize components
  initTabs();
  initDropdown();
  initLogout();
  initModals();
  initProfileForm();
  initAvatarUpload();
  initPasswordForm();
  initRecommendations();
  loadBookings();
  loadWishlist();
});

/* --------------------------------------------------------------------------
   AUTH REDIRECT
   -------------------------------------------------------------------------- */
function redirectToAuth() {
  window.location.href = '../auth/index.html?redirect=dashboard';
}

/* --------------------------------------------------------------------------
   RENDER PERSONALIZED TOURIST DATA
   -------------------------------------------------------------------------- */
function renderTouristData(tourist) {
  if (!tourist) return;

  const { fullName = 'Explorer', email = '', phone = '', hometown = '', avatar = '', ecoPoints = 0, createdAt } = tourist;
  const initials = fullName
    ? fullName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'T';

  // Greeting based on time of day
  const hour = new Date().getHours();
  let timeOfDay = 'morning';
  if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17) timeOfDay = 'evening';

  const greetingEl = $('#hero-greeting');
  if (greetingEl) {
    greetingEl.innerHTML = `Good ${timeOfDay}, <span id="hero-name">${escapeHTML(fullName)}</span>! 🌄`;
  }

  // Header Elements
  const headerName = $('#header-name');
  if (headerName) headerName.textContent = fullName.split(' ')[0] || 'Tourist';

  const dropdownFullName = $('#dropdown-fullname');
  if (dropdownFullName) dropdownFullName.textContent = fullName;

  const dropdownEmail = $('#dropdown-email');
  if (dropdownEmail) dropdownEmail.textContent = email;

  // Hero Elements
  const heroHometown = $('#hero-hometown');
  if (heroHometown) heroHometown.textContent = hometown ? `From ${hometown}` : 'Explorer';

  const heroEmail = $('#hero-email');
  if (heroEmail) heroEmail.textContent = email;

  const heroJoined = $('#hero-joined');
  if (heroJoined && createdAt) {
    const d = new Date(createdAt);
    const month = d.toLocaleString('default', { month: 'short' });
    heroJoined.textContent = `Member since ${month} ${d.getFullYear()}`;
  }

  // Tier Badge
  const heroTierBadge = $('#hero-tier-badge');
  const tierName = getTierName(ecoPoints);
  if (heroTierBadge) {
    heroTierBadge.textContent = `🌿 ${tierName}`;
  }

  // Stats Strip
  const statEcoPoints = $('#stat-eco-points');
  if (statEcoPoints) statEcoPoints.textContent = ecoPoints;

  const ovPointsBig = $('#ov-points-big');
  if (ovPointsBig) ovPointsBig.textContent = `${ecoPoints} PTS`;

  const ovPointsPill = $('#ov-points-pill');
  if (ovPointsPill) ovPointsPill.textContent = `${ecoPoints} Points`;

  // Eco Progress Bar
  const ovTierNext = $('#ov-tier-next');
  const ovProgressFill = $('#ov-progress-fill');
  if (ovProgressFill) {
    const pct = Math.min(100, Math.max(10, (ecoPoints / 300) * 100));
    ovProgressFill.style.width = `${pct}%`;
  }
  if (ovTierNext) {
    if (ecoPoints < 200) ovTierNext.textContent = `Next Tier at 200 PTS (${200 - ecoPoints} pts left)`;
    else if (ecoPoints < 500) ovTierNext.textContent = `Gold Guardian at 500 PTS (${500 - ecoPoints} pts left)`;
    else ovTierNext.textContent = `Top Tier Guardian 🌟`;
  }

  // Overview Tab Fields
  const ovFullName = $('#ov-fullname');
  if (ovFullName) ovFullName.textContent = fullName;

  const ovEmail = $('#ov-email');
  if (ovEmail) ovEmail.textContent = email;

  const ovPhone = $('#ov-phone');
  if (ovPhone) ovPhone.textContent = phone || 'Not provided';

  const ovHometown = $('#ov-hometown');
  if (ovHometown) ovHometown.textContent = hometown || 'Not specified';

  // Profile Form Fields
  const editFullName = $('#edit-fullname');
  if (editFullName) editFullName.value = fullName;

  const editEmail = $('#edit-email');
  if (editEmail) editEmail.value = email;

  const editPhone = $('#edit-phone');
  if (editPhone) editPhone.value = phone || '';

  const editHometown = $('#edit-hometown');
  if (editHometown) editHometown.value = hometown || '';

  // Avatar Renders
  applyAvatarImage('#header-avatar', '#header-initials', avatar, initials);
  applyAvatarImage('#hero-avatar', '#hero-initials', avatar, initials);
  applyAvatarImage('#avatar-edit-preview', '#avatar-edit-initials', avatar, initials);
}

function applyAvatarImage(imgSel, initialsSel, avatarUrl, initials) {
  const img = $(imgSel);
  const initialsEl = $(initialsSel);

  if (avatarUrl && avatarUrl.trim()) {
    if (img) {
      img.src = avatarUrl;
      img.classList.remove('is-hidden');
    }
    if (initialsEl) initialsEl.classList.add('is-hidden');
  } else {
    if (img) img.classList.add('is-hidden');
    if (initialsEl) {
      initialsEl.textContent = initials || 'T';
      initialsEl.classList.remove('is-hidden');
    }
  }
}

function getTierName(points) {
  if (points >= 500) return 'Gold Guardian • Tier 3';
  if (points >= 200) return 'Silver Rover • Tier 2';
  return 'Eco Explorer • Tier 1';
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[tag] || tag));
}

/* --------------------------------------------------------------------------
   TAB SWITCHING
   -------------------------------------------------------------------------- */
function initTabs() {
  const tabBtns = $$('.td-tab-btn');
  const panels = $$('.td-panel');

  function switchTab(tabId) {
    tabBtns.forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    panels.forEach(panel => {
      const isActive = panel.id === `panel-${tabId}`;
      panel.classList.toggle('is-active', isActive);
    });

    // Update URL hash without scroll jump
    history.replaceState(null, '', `#${tabId}`);
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Dropdown shortcuts
  $$('[data-tab-trigger]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tabTrigger);
      $('#tdUserDropdown')?.classList.remove('is-active');
    });
  });

  // Overview quick edit link
  $('#ov-edit-profile-link')?.addEventListener('click', () => switchTab('profile'));

  // Sync with URL Hash on load
  const hash = window.location.hash.toLowerCase().replace('#', '');
  if (['overview', 'bookings', 'wishlist', 'profile'].includes(hash)) {
    switchTab(hash);
  }
}

/* --------------------------------------------------------------------------
   USER HEADER DROPDOWN
   -------------------------------------------------------------------------- */
function initDropdown() {
  const dropdown = $('#tdUserDropdown');
  const btn = $('#tdUserBtn');

  if (!dropdown || !btn) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('is-active');
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('is-active');
    }
  });
}

/* --------------------------------------------------------------------------
   LOGOUT ACTION
   -------------------------------------------------------------------------- */
function initLogout() {
  const logoutBtn = $('#dropdown-logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    showToast('Logging out...', 'info');
    await TouristService.logout();
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 600);
  });
}

/* --------------------------------------------------------------------------
   MODALS (Quick Edit Profile)
   -------------------------------------------------------------------------- */
function initModals() {
  const modal = $('#quick-edit-modal');
  const openBtn = $('#hero-edit-profile-btn');
  const closeBtn = $('#modal-close-btn');
  const cancelBtn = $('#modal-cancel-btn');
  const backdrop = $('#modal-backdrop');
  const form = $('#modal-edit-form');

  if (!modal) return;

  function openModal() {
    if (currentTourist) {
      $('#modal-fullname').value = currentTourist.fullName || '';
      $('#modal-phone').value = currentTourist.phone || '';
      $('#modal-hometown').value = currentTourist.hometown || '';
    }
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
  }

  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = $('#modal-fullname').value.trim();
    const phone = $('#modal-phone').value.trim();
    const hometown = $('#modal-hometown').value.trim();

    if (!fullName) {
      showToast('Full name is required', 'error');
      return;
    }

    const saveBtn = $('#modal-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const res = await TouristService.updateProfile({ fullName, phone, hometown });
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';

    if (res.ok && res.data) {
      currentTourist = res.data;
      updateTouristFields(res.data);
      renderTouristData(currentTourist);
      closeModal();
      showToast('Profile updated successfully! ✨', 'success');
    } else {
      showToast(res.error || 'Failed to update profile', 'error');
    }
  });
}

/* --------------------------------------------------------------------------
   PROFILE FORM (Tab 4)
   -------------------------------------------------------------------------- */
function initProfileForm() {
  const form = $('#edit-profile-form');
  const submitBtn = $('#save-profile-btn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = $('#edit-fullname').value.trim();
    const phone = $('#edit-phone').value.trim();
    const hometown = $('#edit-hometown').value.trim();

    if (!fullName) {
      showToast('Full name is required', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving Changes...';

    const res = await TouristService.updateProfile({ fullName, phone, hometown });
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Profile Changes';

    if (res.ok && res.data) {
      currentTourist = res.data;
      updateTouristFields(res.data);
      renderTouristData(currentTourist);
      showToast('Profile information saved! ✨', 'success');
    } else {
      showToast(res.error || 'Failed to update profile', 'error');
    }
  });
}

/* --------------------------------------------------------------------------
   AVATAR UPLOAD
   -------------------------------------------------------------------------- */
function initAvatarUpload() {
  const fileInput = $('#avatar-file-input');
  const heroChangeBtn = $('#hero-change-photo-btn');
  const confirmBtn = $('#avatar-upload-confirm-btn');
  const previewImg = $('#avatar-edit-preview');

  heroChangeBtn?.addEventListener('click', () => {
    const tabBtn = $('#tab-btn-profile');
    if (tabBtn) tabBtn.click();
    fileInput?.click();
  });

  if (!fileInput) return;

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image (JPG, PNG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImg) {
        previewImg.src = e.target.result;
        previewImg.classList.remove('is-hidden');
      }
      $('#avatar-edit-initials')?.classList.add('is-hidden');
      confirmBtn?.classList.remove('is-hidden');
    };
    reader.readAsDataURL(file);
  });

  confirmBtn?.addEventListener('click', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Uploading...';

    const res = await TouristService.updateAvatar(file);
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Upload & Save Photo';

    if (res.ok && res.data) {
      confirmBtn.classList.add('is-hidden');
      currentTourist = res.data;
      updateTouristFields(res.data);
      renderTouristData(currentTourist);
      showToast('Profile photo updated! 📸', 'success');
    } else {
      showToast(res.error || 'Failed to upload photo', 'error');
    }
  });
}

/* --------------------------------------------------------------------------
   PASSWORD FORM
   -------------------------------------------------------------------------- */
function initPasswordForm() {
  const form = $('#change-pwd-form');
  const btn = $('#change-pwd-btn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPassword = $('#pwd-old').value;
    const newPassword = $('#pwd-new').value;

    if (!oldPassword || !newPassword) {
      showToast('Both old and new passwords are required', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Updating...';

    const res = await TouristService.changePassword({ oldPassword, newPassword });
    btn.disabled = false;
    btn.textContent = 'Update Password';

    if (res.ok) {
      form.reset();
      showToast('Password changed successfully! 🔒', 'success');
    } else {
      showToast(res.error || 'Failed to update password', 'error');
    }
  });
}

/* --------------------------------------------------------------------------
   LOAD BOOKINGS
   -------------------------------------------------------------------------- */
async function loadBookings() {
  const container = $('#bookings-list-container');
  const counter = $('#tab-counter-bookings');
  const statBookings = $('#stat-bookings');
  const ovJourney = $('#ov-journey-container');

  try {
    const res = await TouristService.getBookings();
    if (res.ok && res.data) {
      const bookings = res.data.bookings || [];
      const total = bookings.length;

      if (counter) counter.textContent = total;
      if (statBookings) statBookings.textContent = total;

      if (bookings.length === 0) {
        if (container) {
          container.innerHTML = `
            <div class="td-card">
              <div class="td-empty-box">
                <div class="td-empty-icon">🎒</div>
                <h4>No Journeys Booked Yet</h4>
                <p>Explore native routes across Sonbhadra’s ancient fortresses and deep river gorges led by verified local creators.</p>
                <a href="/src/app/destinations/index.html" class="td-btn td-btn--primary">
                  Explore Destinations & Book
                </a>
              </div>
            </div>
          `;
        }
      } else {
        renderBookingsList(bookings, container);
        renderActiveJourneyPreview(bookings[0], ovJourney);
      }
    }
  } catch (err) {
    console.warn('[Dashboard] Could not load bookings:', err);
  }
}

function renderBookingsList(bookings, container) {
  if (!container) return;
  container.innerHTML = bookings.map(b => {
    const dest = b.destination || {};
    const creator = b.creator || {};
    const dateStr = b.date ? new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Flexible Date';
    const statusClass = b.status === 'confirmed' ? 'td-booking-status--confirmed' : 'td-booking-status--pending';

    return `
      <div class="td-booking-item">
        <img src="${dest.coverImage || '/public/assets/images/destinations/lakhaniya-dari.webp'}" alt="${dest.name || 'Destination'}" class="td-booking-item__img" />
        <div class="td-booking-item__info">
          <h4>${escapeHTML(dest.name || 'Sonbhadra Expedition')}</h4>
          <div class="td-booking-item__meta">
            <span>📅 ${dateStr}</span>
            <span>🧭 Guide: ${escapeHTML(creator.fullName || creator.creatorName || 'Local Guide')}</span>
            <span>👥 ${b.guests || 1} Traveler(s)</span>
          </div>
        </div>
        <div>
          <span class="td-booking-status ${statusClass}">${b.status || 'Confirmed'}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderActiveJourneyPreview(booking, container) {
  if (!container || !booking) return;
  const dest = booking.destination || {};
  const creator = booking.creator || {};
  const dateStr = booking.date ? new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Upcoming';

  container.innerHTML = `
    <div class="td-booking-item" style="border: none; padding: 0; background: transparent;">
      <img src="${dest.coverImage || '/public/assets/images/destinations/lakhaniya-dari.webp'}" alt="${dest.name || 'Destination'}" class="td-booking-item__img" />
      <div class="td-booking-item__info">
        <h4>${escapeHTML(dest.name || 'Sonbhadra Expedition')}</h4>
        <div class="td-booking-item__meta">
          <span>📅 ${dateStr}</span>
          <span>🧭 ${escapeHTML(creator.fullName || 'Certified Native Guide')}</span>
        </div>
        <p style="font-size: 0.8125rem; color: #a7f3d0; margin-top: 6px;">
          🌿 50 Eco-Points will be credited upon journey completion.
        </p>
      </div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   LOAD WISHLIST
   -------------------------------------------------------------------------- */
async function loadWishlist() {
  const container = $('#wishlist-grid-container');
  const counter = $('#tab-counter-wishlist');
  const statWishlist = $('#stat-wishlist');

  try {
    const res = await TouristService.getWishlist();
    if (res.ok && Array.isArray(res.data)) {
      const items = res.data;
      const count = items.length;

      if (counter) counter.textContent = count;
      if (statWishlist) statWishlist.textContent = count;

      if (count === 0) {
        if (container) {
          container.innerHTML = `
            <div class="td-card" style="grid-column: 1 / -1;">
              <div class="td-empty-box">
                <div class="td-empty-icon">⭐</div>
                <h4>Your Wishlist is Empty</h4>
                <p>Save places you want to visit in Sonbhadra. Tap the heart icon or choose from our recommendations below.</p>
                <a href="/src/app/destinations/index.html" class="td-btn td-btn--primary">
                  Browse All Destinations
                </a>
              </div>
            </div>
          `;
        }
      } else {
        renderWishlistGrid(items, container);
      }
    }
  } catch (err) {
    console.warn('[Dashboard] Could not load wishlist:', err);
  }
}

function renderWishlistGrid(items, container) {
  if (!container) return;
  container.innerHTML = items.map(dest => {
    const name = dest.name || 'Sonbhadra Destination';
    const img = dest.coverImage || dest.image || '/public/assets/images/destinations/lakhaniya-dari.webp';
    const cat = dest.category || 'Sightseeing';
    const tagline = dest.tagline || 'Experience the untouched beauty of Sonbhadra';
    const slug = dest.slug || '';

    return `
      <div class="td-wish-card" data-dest-id="${dest._id || dest.id}">
        <div class="td-wish-card__img-wrap">
          <img src="${img}" alt="${escapeHTML(name)}" class="td-wish-card__img" />
          <button type="button" class="td-wish-card__remove-btn" title="Remove from wishlist" data-remove-id="${dest._id || dest.id}">
            ✕
          </button>
        </div>
        <div class="td-wish-card__body">
          <div>
            <h4 class="td-wish-card__title">${escapeHTML(name)}</h4>
            <span class="td-wish-card__cat">${escapeHTML(cat)}</span>
            <p class="td-wish-card__desc">${escapeHTML(tagline)}</p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <a href="/src/app/destinations/${slug ? slug + '.html' : 'index.html'}" class="td-btn td-btn--outline" style="flex: 1; padding: 0.45rem 0.65rem; font-size: 0.8125rem;">
              View Details
            </a>
            <a href="/src/app/destinations/${slug ? slug + '.html#destTouristGuideContainer' : 'index.html'}" class="td-btn td-btn--primary" style="padding: 0.45rem 0.75rem; font-size: 0.8125rem;">
              Book Guide
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Remove event listeners
  container.querySelectorAll('[data-remove-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.removeId;
      btn.disabled = true;
      const res = await TouristService.removeFromWishlist(id);
      if (res.ok) {
        showToast('Removed from wishlist', 'info');
        loadWishlist();
      } else {
        btn.disabled = false;
        showToast(res.error || 'Failed to remove', 'error');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   RECOMMENDATIONS STRIP
   -------------------------------------------------------------------------- */
function initRecommendations() {
  const container = $('#ov-recommendations-grid');
  if (!container) return;

  const topSpots = DESTINATIONS_DATA.slice(0, 4);

  container.innerHTML = topSpots.map(d => {
    return `
      <div class="td-rec-card">
        <img src="${d.image.replace('../../public', '/public')}" alt="${escapeHTML(d.name)}" class="td-rec-card__img" />
        <div class="td-rec-card__body">
          <h5 class="td-rec-card__title">${escapeHTML(d.name)}</h5>
          <span class="td-rec-card__cat">${escapeHTML(d.category)}</span>
          <a href="/src/app/destinations/${d.slug}.html" class="td-btn td-btn--outline td-rec-card__btn">
            Explore Destination
          </a>
        </div>
      </div>
    `;
  }).join('');
}

/* --------------------------------------------------------------------------
   TOAST NOTIFICATION HELPER
   -------------------------------------------------------------------------- */
function showToast(message, type = 'info') {
  const container = $('#toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `td-toast td-toast--${type}`;
  toast.innerHTML = `
    <span>${escapeHTML(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}
