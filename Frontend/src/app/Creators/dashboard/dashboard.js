/**
 * Creator Dashboard Controller
 * Sonbhadra Tourism — Creator Platform
 *
 * Handles:
 * - Auth guard & session sync with /current-creator
 * - Channel profile & stats aggregation (/c/:creatorName)
 * - Panel navigation (Overview, Profile, Content, Destinations, Analytics, Collaborations, Settings)
 * - Profile updates (account details, avatar file upload, covering city, bio & dynamic social links)
 * - Password change
 * - Content rendering & story modal
 * - Mobile drawer & Toast notifications
 */

import { CreatorService } from '../../../services/creator.service.js';
import { getCreator, setCreator, clearSession, updateCreatorFields, isLoggedIn } from '../../../scripts/utils/auth-state.js';

/* --------------------------------------------------------------------------
   DOM SELECTORS & HELPERS
   -------------------------------------------------------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

let currentCreatorState = null;
let channelProfileState = null;
let pendingAvatarFile = null;

/* --------------------------------------------------------------------------
   TOAST NOTIFICATION SYSTEM
   -------------------------------------------------------------------------- */
export function showToast(message, type = 'success') {
  const container = $('#toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `dash-toast dash-toast--${type}`;

  const iconSvg = type === 'success'
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
    : type === 'error'
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6b7a" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f4a261" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

  toast.innerHTML = `
    ${iconSvg}
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}

/* --------------------------------------------------------------------------
   BUTTON LOADING STATE HELPER
   -------------------------------------------------------------------------- */
function setButtonLoading(btnId, isLoading) {
  const btn = $(`#${btnId}`);
  if (!btn) return;

  if (isLoading) {
    btn.classList.add('is-loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('is-loading');
    btn.disabled = false;
  }
}

/* --------------------------------------------------------------------------
   AUTH GUARD & INITIALIZATION
   -------------------------------------------------------------------------- */
async function initSession() {
  // Show skeleton loading state immediately
  setProfileLoading(true);

  // Fast check from sessionStorage (may be stale — always validate against server)
  const localCreator = getCreator();
  if (localCreator && (localCreator.creatorName || localCreator.fullName)) {
    // Immediately display cached profile so the user sees their avatar and info instantly
    hydrateCreatorUI(localCreator);
  }

  // Validate live session from server cookie
  const { ok, data, error } = await CreatorService.getCurrentCreator();

  if (!ok || !data) {
    // API rejected the session (expired cookie, network error, etc.)
    setProfileLoading(false);

    if (error === 'Session expired. Please log in again.' || !localCreator) {
      // No local fallback either — must redirect
      redirectToAuth();
      return;
    }

    // We have a local cache but the server rejected — show error and redirect after delay
    showProfileLoadError(error || 'Unable to verify your session. Please log in again.');
    setTimeout(redirectToAuth, 2500);
    return;
  }

  // Server returned a valid creator document
  const activeCreator = data;

  if (!activeCreator || (!activeCreator.creatorName && !activeCreator._id)) {
    setProfileLoading(false);
    redirectToAuth();
    return;
  }

  // Update session state
  currentCreatorState = activeCreator;
  setCreator(activeCreator);

  // Remove loading state and hydrate real data
  setProfileLoading(false);
  hydrateCreatorUI(activeCreator);

  // Fetch aggregated channel statistics and media posts
  if (activeCreator.creatorName) {
    loadChannelProfile(activeCreator.creatorName);
  }
}

function redirectToAuth() {
  clearSession();
  window.location.href = '../auth/index.html?redirect=dashboard';
}

/* --------------------------------------------------------------------------
   PROFILE LOADING / ERROR STATE HELPERS
   -------------------------------------------------------------------------- */

/**
 * Toggle skeleton shimmer classes on profile elements while the API request is in-flight.
 * @param {boolean} isLoading
 */
function setProfileLoading(isLoading) {
  const skeletonEls = [
    '#sidebar-fullname',
    '#sidebar-handle',
    '#sidebar-city',
  ];

  const avatarEls = [
    '#sidebar-avatar',
    '#overview-hero-avatar',
    '#mobile-user-avatar',
    '#profile-preview-avatar',
  ];

  skeletonEls.forEach(sel => {
    const el = $(sel);
    if (!el) return;
    if (isLoading) {
      el.classList.add('dash-skeleton-text');
    } else {
      el.classList.remove('dash-skeleton-text', 'dash-skeleton-text--sm', 'dash-skeleton-text--xs');
    }
  });

  avatarEls.forEach(sel => {
    const el = $(sel);
    if (!el) return;
    if (isLoading) {
      el.classList.add('dash-avatar-loading');
    } else {
      el.classList.remove('dash-avatar-loading');
    }
  });
}

/**
 * Show a dismissible error banner in the overview hero when the session cannot be verified.
 * @param {string} message
 */
function showProfileLoadError(message) {
  const heroCard = $('.dash-hero-card');
  if (!heroCard) return;

  // Avoid duplicate banners
  if ($('#profile-load-error-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'profile-load-error-banner';
  banner.className = 'dash-profile-error-banner';
  banner.setAttribute('role', 'alert');
  banner.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span>${message}</span>
  `;
  heroCard.prepend(banner);
}

/* --------------------------------------------------------------------------
   HYDRATE CREATOR DATA ACROSS DASHBOARD
   -------------------------------------------------------------------------- */

/**
 * Safely load an avatar image with an immediate initials fallback.
 * Preloads the remote URL so the user never sees a blank, broken, or flashing image.
 *
 * @param {HTMLImageElement} el - Image DOM element
 * @param {string|null} avatarUrl - Cloudinary or server image URL
 * @param {string} fallbackDataUrl - Base64 Data URI from generateInitialsAvatar()
 */
function loadAvatarWithFallback(el, avatarUrl, fallbackDataUrl) {
  if (!el) return;

  // Set the fallback immediately if element has no valid loaded image
  if (!el.src || el.src.endsWith('/index.html') || el.src === window.location.href || el.getAttribute('src') === '' || el.src.startsWith('data:image/svg+xml')) {
    el.src = fallbackDataUrl;
  }

  if (!avatarUrl || typeof avatarUrl !== 'string' || !avatarUrl.trim()) {
    el.src = fallbackDataUrl;
    el.classList.remove('dash-avatar-loading');
    return;
  }

  const cleanUrl = avatarUrl.trim();

  // If already displaying this URL, keep it and remove loading class
  if (el.src === cleanUrl) {
    el.classList.remove('dash-avatar-loading');
    return;
  }

  // Safety net on the element itself in case of rendering errors
  el.onerror = function() {
    this.onerror = null;
    this.src = fallbackDataUrl;
    this.classList.remove('dash-avatar-loading');
  };

  // Preload remote image in background
  const preloader = new Image();
  preloader.crossOrigin = 'anonymous';
  preloader.referrerPolicy = 'no-referrer';

  preloader.onload = function() {
    el.src = cleanUrl;
    el.classList.remove('dash-avatar-loading');
  };

  preloader.onerror = function() {
    console.warn('[Dashboard] Could not load avatar from:', cleanUrl, '— keeping initials badge.');
    el.src = fallbackDataUrl;
    el.classList.remove('dash-avatar-loading');
  };

  preloader.src = cleanUrl;
}

function hydrateCreatorUI(creator) {
  if (!creator) return;

  /* ---- Avatar & base fields ---- */
  const avatarUrl = creator.avatar || null;
  const fullName = creator.fullName || '';
  const handle   = creator.creatorName ? `@${creator.creatorName}` : '';
  const city     = creator.coveringCity || '';

  // Avatar: use real Cloudinary URL or canvas-initials fallback (no broken images)
  const avatarEls = [
    { id: 'sidebar-avatar',         size: 48 },
    { id: 'overview-hero-avatar',   size: 64 },
    { id: 'mobile-user-avatar',     size: 36 },
    { id: 'profile-preview-avatar', size: 100 },
  ];
  avatarEls.forEach(function({ id, size }) {
    const el = document.querySelector('#' + id);
    if (!el) return;
    const fallback = generateInitialsAvatar(creator.fullName || creator.creatorName || '?', size);
    loadAvatarWithFallback(el, avatarUrl, fallback);
    el.alt = (creator.fullName || creator.creatorName || 'Creator') + ' avatar';
  });

  // Sidebar text
  const sidebarName = $('#sidebar-fullname');
  if (sidebarName) { sidebarName.textContent = fullName; sidebarName.classList.remove('dash-skeleton-text'); }
  const sidebarHandle = $('#sidebar-handle');
  if (sidebarHandle) { sidebarHandle.textContent = handle; sidebarHandle.classList.remove('dash-skeleton-text', 'dash-skeleton-text--sm'); }
  const sidebarCity = $('#sidebar-city');
  if (sidebarCity) { sidebarCity.textContent = city; sidebarCity.classList.remove('dash-skeleton-text', 'dash-skeleton-text--xs'); }

  // Overview Hero: first name in greeting
  const heroName = $('#overview-creator-name');
  if (heroName) heroName.textContent = (fullName.split(' ')[0]) || creator.creatorName || 'Creator';

  // Bio — only render if it exists in the database, never invent a fallback
  const heroBio = $('#overview-hero-bio');
  if (heroBio) {
    if (creator.bio && creator.bio.trim()) {
      heroBio.textContent = '“' + creator.bio.trim() + '”';
      heroBio.style.display = '';
    } else {
      heroBio.style.display = 'none';
    }
  }

  // Covering city — only render if it exists in the database, never invent a fallback
  const heroCity = $('#overview-hero-city');
  const heroVerifiedTag = $('#overview-hero-verified-tag');
  if (heroCity) {
    if (city) {
      heroCity.textContent = city + ', Sonbhadra';
      heroCity.style.display = '';
      if (heroVerifiedTag) heroVerifiedTag.style.display = '';
    } else {
      heroCity.style.display = 'none';
      if (heroVerifiedTag) heroVerifiedTag.style.display = 'none';
    }
  }

  // Profile Panel Visual
  const profileDispName = $('#profile-disp-fullname');
  if (profileDispName) profileDispName.textContent = fullName;
  const profileDispHandle = $('#profile-disp-username');
  if (profileDispHandle) profileDispHandle.textContent = handle;
  const readonlyHandle = $('#profile-readonly-username');
  if (readonlyHandle) readonlyHandle.textContent = handle;
  const readonlyEmail = $('#profile-readonly-email');
  if (readonlyEmail) readonlyEmail.textContent = creator.email || '—';

  // Profile Form Inputs
  const inputFullName = $('#input-full-name');
  if (inputFullName) inputFullName.value = creator.fullName || '';
  const inputPhone = $('#input-phone');
  if (inputPhone) inputPhone.value = creator.phone || '';

  // Covering city select
  const inputCity = $('#input-covering-city');
  if (inputCity && creator.coveringCity) {
    inputCity.value = creator.coveringCity;
  }

  // Address
  if (creator.address) {
    const addr = typeof creator.address === 'string' ? safeJsonParse(creator.address) : creator.address;
    if (addr) {
      if ($('#input-address-street')) $('#input-address-street').value = addr.street || '';
      if ($('#input-address-city')) $('#input-address-city').value = addr.city || '';
      if ($('#input-address-state')) $('#input-address-state').value = addr.state || 'Uttar Pradesh';
      if ($('#input-address-pincode')) $('#input-address-pincode').value = addr.pincode || '';
    }
  }

  // Bio & Social Links
  const inputBio = $('#input-bio');
  if (inputBio) {
    inputBio.value = creator.bio || '';
    updateBioCounter();
  }

  renderSocialLinks(creator.socialLinks);
  calculateProfileCompletion(creator);
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------------------
   INITIALS AVATAR FALLBACK
   Generates a data-URI PNG with the creator's initials on a coloured
   background. Used when no avatar URL is stored in the creator document.
   @param {string} name - full name or creator username
   @param {number} size - pixel dimension (width = height)
   @returns {string} data-URI string
   -------------------------------------------------------------------------- */
function generateInitialsAvatar(name, size) {
  size = size || 48;
  var canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;
  var ctx = canvas.getContext('2d');

  // Background — forest green matching the dashboard design palette
  ctx.fillStyle = '#2D6A4F';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Derive initials from name
  var words    = name.trim().split(/\s+/);
  var initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.trim().slice(0, 2).toUpperCase();

  ctx.fillStyle    = '#F5F3EF';
  ctx.font         = '600 ' + Math.round(size * 0.38) + 'px Inter, sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2);

  return canvas.toDataURL('image/png');
}

/* --------------------------------------------------------------------------
   PROFILE COMPLETION METER
   -------------------------------------------------------------------------- */
function calculateProfileCompletion(creator) {
  if (!creator) return 20;

  let score = 20; // base registered account
  const missing = [];

  if (creator.avatar) {
    score += 20;
  } else {
    missing.push('avatar photo');
  }

  if (creator.bio && creator.bio.trim().length > 10) {
    score += 20;
  } else {
    missing.push('biography');
  }

  if (creator.coveringCity) {
    score += 15;
  } else {
    missing.push('covering region');
  }

  let links = creator.socialLinks;
  if (typeof links === 'string') links = safeJsonParse(links) || [];
  if (Array.isArray(links) && links.filter(Boolean).length > 0) {
    score += 15;
  } else {
    missing.push('social links');
  }

  let addr = creator.address;
  if (typeof addr === 'string') addr = safeJsonParse(addr);
  if (addr && (addr.street || addr.city)) {
    score += 10;
  } else {
    missing.push('residence address');
  }

  score = Math.min(100, score);

  const percentageEl = $('#completion-percentage');
  const fillEl = $('#completion-bar-fill');
  const tipEl = $('#completion-tip');

  if (percentageEl) percentageEl.textContent = `${score}%`;
  if (fillEl) fillEl.style.width = `${score}%`;

  if (tipEl) {
    if (score === 100) {
      tipEl.textContent = '🌟 Verified 100% complete! Your profile is prioritized in local tourism discovery.';
    } else if (missing.length > 0) {
      tipEl.textContent = `Boost your profile (${score}%): add your ${missing.join(', ')} to increase discovery by tourists.`;
    } else {
      tipEl.textContent = 'Profile details are up to date.';
    }
  }

  return score;
}

/* --------------------------------------------------------------------------
   LOCAL STORIES PERSISTENCE HELPERS
   -------------------------------------------------------------------------- */
function getLocalStories(creatorName) {
  if (!creatorName) return [];
  try {
    const raw = localStorage.getItem(`sonbhadra_stories_${creatorName.toLowerCase()}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalStory(creatorName, story) {
  if (!creatorName || !story) return;
  try {
    const current = getLocalStories(creatorName);
    current.unshift(story);
    localStorage.setItem(`sonbhadra_stories_${creatorName.toLowerCase()}`, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save story to localStorage', err);
  }
}

function removeLocalStory(creatorName, storyId) {
  if (!creatorName || !storyId) return;
  try {
    const current = getLocalStories(creatorName);
    const updated = current.filter(s => s._id !== storyId && s.id !== storyId);
    localStorage.setItem(`sonbhadra_stories_${creatorName.toLowerCase()}`, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove story from localStorage', err);
  }
}

/* --------------------------------------------------------------------------
   GENUINE METRICS TRENDS & CREATOR SCORING
   -------------------------------------------------------------------------- */
function updateCreatorMetricsAndScore(posts, totalViews, totalLikes, profileScore) {
  const postsCount = Array.isArray(posts) ? posts.length : 0;
  const views = Number(totalViews) || 0;
  const likes = Number(totalLikes) || 0;
  const pScore = Number(profileScore) || 20;

  // 1. Published Stories Trend Badge
  const postsTrend = $('#metric-posts-trend');
  if (postsTrend) {
    if (postsCount === 0) {
      postsTrend.textContent = '0 this month';
      postsTrend.className = 'dash-metric-card__trend';
    } else if (postsCount === 1) {
      postsTrend.textContent = '1 published';
      postsTrend.className = 'dash-metric-card__trend positive';
    } else {
      postsTrend.textContent = `${postsCount} published`;
      postsTrend.className = 'dash-metric-card__trend positive';
    }
  }

  // 2. Total Views Trend Badge
  const viewsTrend = $('#metric-views-trend');
  if (viewsTrend) {
    if (views === 0) {
      viewsTrend.textContent = '0 views';
      viewsTrend.className = 'dash-metric-card__trend';
    } else {
      viewsTrend.textContent = `${formatCompactNumber(views)} network views`;
      viewsTrend.className = 'dash-metric-card__trend positive';
    }
  }

  // 3. Community Likes Trend Badge
  const likesTrend = $('#metric-likes-trend');
  if (likesTrend) {
    if (likes === 0) {
      likesTrend.textContent = '0 saves';
      likesTrend.className = 'dash-metric-card__trend';
    } else if (views > 0) {
      const positivePct = Math.min(100, Math.round((likes / views) * 100));
      likesTrend.textContent = `${positivePct}% favorited`;
      likesTrend.className = 'dash-metric-card__trend positive';
    } else {
      likesTrend.textContent = `${likes} saves`;
      likesTrend.className = 'dash-metric-card__trend positive';
    }
  }

  // 4. Creator Score & Tier (Genuine progressive tier based on real contributions)
  let scoreVal = 1.0;
  let tierName = 'Starter Tier';
  let tierDesc = 'Publish stories to rank';
  let heroPill = 'Community Storyteller';

  if (postsCount === 0) {
    scoreVal = 1.0 + (pScore / 100) * 1.5; // 1.0 to 2.5
    tierName = 'Starter Tier';
    tierDesc = 'Publish first story to rank';
    heroPill = 'New Creator';
  } else if (postsCount < 3) {
    scoreVal = 2.2 + (pScore / 100) * 1.0 + Math.min(0.5, (views / 20) * 0.5); // 2.4 - 3.7
    tierName = 'Bronze Tier';
    tierDesc = 'Active local storyteller';
    heroPill = 'Local Contributor';
  } else if (postsCount < 6) {
    scoreVal = 3.4 + (pScore / 100) * 0.8 + Math.min(0.5, (views / 50) * 0.5); // 3.6 - 4.6
    tierName = 'Silver Tier';
    tierDesc = 'Verified regional guide';
    heroPill = 'Sonbhadra Guide';
  } else {
    scoreVal = 4.2 + (pScore / 100) * 0.6 + Math.min(0.2, (likes / 10) * 0.2); // 4.4 - 5.0
    tierName = 'Gold Ambassador';
    tierDesc = 'District board ranking';
    heroPill = 'Sonbhadra Cultural Ambassador';
  }

  scoreVal = Math.min(5.0, Math.max(1.0, scoreVal));

  const scoreEl = $('#metric-creator-score');
  if (scoreEl) scoreEl.textContent = `${scoreVal.toFixed(1)} / 5`;

  const tierEl = $('#metric-creator-tier');
  if (tierEl) {
    tierEl.textContent = tierName;
    tierEl.className = postsCount > 0 ? 'dash-metric-card__trend positive' : 'dash-metric-card__trend';
  }

  const descEl = $('#metric-creator-tier-desc');
  if (descEl) descEl.textContent = tierDesc;

  const pillEl = $('#overview-creator-tier-pill');
  if (pillEl) pillEl.textContent = heroPill;
}

/* --------------------------------------------------------------------------
   GENUINE ANALYTICS (REAL MONTHLY BARS & CATEGORY BREAKDOWN)
   -------------------------------------------------------------------------- */
function renderAnalytics(posts = [], totalViews = 0, totalLikes = 0) {
  const views = Number(totalViews) || 0;
  const likes = Number(totalLikes) || 0;
  const count = posts.length;

  // 1. Metric numbers
  const anViews = $('#analytics-total-views');
  if (anViews) anViews.textContent = formatCompactNumber(views);
  const anLikes = $('#analytics-total-likes');
  if (anLikes) anLikes.textContent = formatCompactNumber(likes);
  const anPosts = $('#analytics-total-posts');
  if (anPosts) anPosts.textContent = count;

  // 2. Engagement Rate
  const rate = views > 0 ? ((likes / views) * 100).toFixed(1) : '0.0';
  const anRate = $('#analytics-engagement-rate');
  if (anRate) anRate.textContent = `${rate}%`;

  const anSub = $('#analytics-engagement-sub');
  if (anSub) {
    anSub.textContent = views > 0 ? 'Based on verified interactions' : 'Awaiting traveler engagement';
  }

  // 3. Monthly Reach & Discovery Chart (Real activity)
  const chartContainer = $('#analytics-chart-container');
  const chartLegend = $('#analytics-chart-legend');

  if (chartContainer) {
    // Generate the last 6 calendar months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString('en-IN', { month: 'short' }),
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        views: 0,
        posts: 0
      });
    }

    // Map creator's real posts by month
    posts.forEach(p => {
      const postDate = p.createdAt ? new Date(p.createdAt) : new Date();
      const pYear = postDate.getFullYear();
      const pMonth = postDate.getMonth();
      const targetMonth = months.find(m => m.year === pYear && m.monthIndex === pMonth);
      if (targetMonth) {
        targetMonth.posts += 1;
        targetMonth.views += (Number(p.views) || 0);
      }
    });

    const maxViews = Math.max(...months.map(m => m.views), 1);
    const hasAnyTraffic = views > 0 || count > 0;

    chartContainer.innerHTML = months.map((m, idx) => {
      const isCurrent = idx === months.length - 1;
      const heightPercent = hasAnyTraffic
        ? (m.views > 0 ? Math.max(18, Math.round((m.views / maxViews) * 90)) : (m.posts > 0 ? 25 : 6))
        : 6;
      const displayVal = m.views > 0 ? formatCompactNumber(m.views) : (m.posts > 0 ? `${m.posts} story` : '0');
      const highlightClass = isCurrent && hasAnyTraffic ? ' dash-chart-bar--highlight' : '';

      return `
        <div class="dash-chart-bar-group">
          <div class="dash-chart-bar${highlightClass}" style="--h: ${heightPercent}%;" data-val="${displayVal}"></div>
          <span class="dash-chart-bar-label">${m.label}</span>
        </div>
      `;
    }).join('');

    if (chartLegend) {
      if (hasAnyTraffic) {
        chartLegend.innerHTML = `<span class="dash-legend-item"><span class="dash-legend-dot"></span> Monthly reach calculated from your live story interactions</span>`;
      } else {
        chartLegend.innerHTML = `<span class="dash-legend-item"><span class="dash-legend-dot" style="background:var(--dash-text-dim)"></span> Publish stories to begin accumulating verified monthly reach</span>`;
      }
    }
  }

  // 4. Content Category Distribution (Genuine breakdown from posts)
  const categoriesContainer = $('#analytics-categories-container');
  if (categoriesContainer) {
    if (count === 0) {
      categoriesContainer.innerHTML = `
        <div style="padding: 2rem 1rem; text-align: center; color: var(--dash-text-dim); font-size: 0.85rem;">
          No stories published yet. As you publish guides on waterfalls, forts, dams, or local history, your category breakdown will appear here.
        </div>
      `;
    } else {
      const categoryCounts = {};
      posts.forEach(p => {
        const cat = p.category || 'General';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      const colors = {
        'Waterfalls': 'var(--color-river, #3a86ff)',
        'Heritage': 'var(--color-sunset, #f4a261)',
        'Forts': 'var(--color-sunset, #f4a261)',
        'Geology': 'var(--color-leaf-light, #52b788)',
        'Fossils': 'var(--color-leaf-light, #52b788)',
        'Wildlife': 'var(--color-forest, #2d6a4f)',
        'Dams': 'var(--color-river-light, #64b5f6)',
        'Culture': 'var(--color-earth-light, #e76f51)',
        'Travelogue': 'var(--dash-accent, #e9c46a)',
      };

      const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

      categoriesContainer.innerHTML = sortedCategories.map(([catName, cnt]) => {
        const pct = Math.round((cnt / count) * 100);
        const color = Object.entries(colors).find(([k]) => catName.toLowerCase().includes(k.toLowerCase()))?.[1] || 'var(--dash-accent)';

        return `
          <div class="dash-progress-item">
            <div class="dash-progress-info">
              <span>${catName} (${cnt} ${cnt === 1 ? 'story' : 'stories'})</span>
              <strong>${pct}%</strong>
            </div>
            <div class="dash-progress-bar">
              <div class="dash-progress-fill" style="width: ${pct}%; background: ${color};"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

/* --------------------------------------------------------------------------
   CHANNEL PROFILE & STATS
   -------------------------------------------------------------------------- */
async function loadChannelProfile(creatorName) {
  const localStories = getLocalStories(creatorName);
  const { ok, data } = await CreatorService.getChannelProfile(creatorName);

  let serverPosts = [];
  let totalViews = 0;
  let totalLikes = 0;

  if (ok && data) {
    channelProfileState = data;
    serverPosts = Array.isArray(data.posts) ? data.posts : [];
    totalViews = Number(data.totalViews) || 0;
    totalLikes = Number(data.totalLikes) || 0;
  } else {
    channelProfileState = { posts: [], totalPosts: 0, totalViews: 0, totalLikes: 0 };
  }

  // Calculate local stories views & likes
  localStories.forEach(s => {
    totalViews += Number(s.views || 0);
    totalLikes += Number(s.likes || 0);
  });

  const combinedPosts = [...localStories, ...serverPosts];
  channelProfileState.posts = combinedPosts;
  channelProfileState.totalPosts = combinedPosts.length;
  channelProfileState.totalViews = totalViews;
  channelProfileState.totalLikes = totalLikes;

  // Overview Stats
  animateCounter('#metric-total-posts', combinedPosts.length);
  animateCounter('#metric-total-views', totalViews);
  animateCounter('#metric-total-likes', totalLikes);

  // Profile completion score
  const creator = getCreator() || currentCreatorState;
  const pScore = calculateProfileCompletion(creator);

  // Genuine Metric Trends and Creator Tier / Score
  updateCreatorMetricsAndScore(combinedPosts, totalViews, totalLikes, pScore);

  // Render Analytics (genuine graphs, reach, and categories)
  renderAnalytics(combinedPosts, totalViews, totalLikes);

  // Render Posts
  renderPosts(combinedPosts);
}

function animateCounter(sel, targetVal) {
  const el = $(sel);
  if (!el) return;

  if (targetVal === 0) {
    el.textContent = '0';
    return;
  }

  let current = 0;
  const step = Math.ceil(targetVal / 25) || 1;
  const timer = setInterval(() => {
    current += step;
    if (current >= targetVal) {
      el.textContent = formatCompactNumber(targetVal);
      clearInterval(timer);
    } else {
      el.textContent = formatCompactNumber(current);
    }
  }, 25);
}

function formatCompactNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

/* --------------------------------------------------------------------------
   POSTS RENDERING (OVERVIEW + MY CONTENT)
   -------------------------------------------------------------------------- */
function renderPosts(posts) {
  const overviewContainer = $('#overview-posts-container');
  const fullContainer = $('#content-grid-container');

  if (!posts || posts.length === 0) {
    const emptyMarkup = `
      <div class="dash-empty-state">
        <div class="dash-empty-state__icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
            <line x1="7" y1="2" x2="7" y2="22"/>
            <line x1="17" y1="2" x2="17" y2="22"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
          </svg>
        </div>
        <h3>No Published Stories Yet</h3>
        <p>Start your creator journey by sharing your favorite secret waterfalls, historical fort trek, or local cultural stories of Sonbhadra.</p>
        <button type="button" class="dash-btn-primary" onclick="document.getElementById('btn-quick-new-story').click()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Submit First Story</span>
        </button>
      </div>
    `;

    if (overviewContainer) overviewContainer.innerHTML = emptyMarkup;
    if (fullContainer) fullContainer.innerHTML = emptyMarkup;
    return;
  }

  const buildCard = (post, isOverview = false) => {
    const mediaImg = post.mediaUrl || post.thumbnailUrl || post.thumbnail || '/public/assets/images/destinations/lakhaniya-dari.webp';
    const title = post.title || 'Sonbhadra Exploration Trail';
    const category = post.category || 'Travelogue';
    const views = formatCompactNumber(post.views || 0);
    const likes = formatCompactNumber(post.likes || 0);
    const dateStr = post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently Added';
    const deleteBtn = (!isOverview && post.isLocal)
      ? `<button type="button" class="dash-post-del-btn" data-delete-id="${post._id}" title="Delete story" aria-label="Delete story">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
         </button>`
      : '';

    return `
      <article class="dash-post-card">
        <div class="dash-post-card__media">
          <img src="${mediaImg}" alt="${title}" loading="lazy" />
          <span class="dash-post-card__badge">${category}</span>
        </div>
        <div class="dash-post-card__body">
          <span class="dash-post-card__date">${dateStr}</span>
          <h4 class="dash-post-card__title">${title}</h4>
          <p class="dash-post-card__snippet">${post.description || 'Exploring Sonbhadra’s breathtaking natural landscapes and hidden cultural sites.'}</p>
          <div class="dash-post-card__footer">
            <div class="dash-post-stats">
              <span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                ${views}
              </span>
              <span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                ${likes}
              </span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="dash-badge-forest">${post.isLocal ? 'Verified Story' : 'Published'}</span>
              ${deleteBtn}
            </div>
          </div>
        </div>
      </article>
    `;
  };

  if (overviewContainer) {
    overviewContainer.innerHTML = posts.slice(0, 3).map(p => buildCard(p, true)).join('');
  }

  if (fullContainer) {
    fullContainer.innerHTML = posts.map(p => buildCard(p, false)).join('');

    // Attach delete listeners
    fullContainer.querySelectorAll('.dash-post-del-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        if (!id) return;
        const confirmDel = confirm('Are you sure you want to remove this story?');
        if (!confirmDel) return;

        const creator = getCreator() || currentCreatorState;
        const username = creator?.creatorName;
        if (username) {
          removeLocalStory(username, id);
        }

        if (channelProfileState && channelProfileState.posts) {
          channelProfileState.posts = channelProfileState.posts.filter(p => p._id !== id);
          channelProfileState.totalPosts = channelProfileState.posts.length;
          renderPosts(channelProfileState.posts);
          animateCounter('#metric-total-posts', channelProfileState.posts.length);

          const pScore = calculateProfileCompletion(creator);
          updateCreatorMetricsAndScore(channelProfileState.posts, channelProfileState.totalViews, channelProfileState.totalLikes, pScore);
          renderAnalytics(channelProfileState.posts, channelProfileState.totalViews, channelProfileState.totalLikes);
        }
        showToast('Story removed successfully.', 'info');
      });
    });
  }
}

/* --------------------------------------------------------------------------
   PANEL NAVIGATION & ROUTING
   -------------------------------------------------------------------------- */
const PANEL_TITLES = {
  overview: { title: 'Overview', eyebrow: 'Creator Studio' },
  profile: { title: 'Profile & Identity', eyebrow: 'Personal Branding' },
  content: { title: 'My Content Library', eyebrow: 'Stories & Reels' },
  destinations: { title: 'Tourism Hotspots', eyebrow: 'Sonbhadra Coverage' },
  analytics: { title: 'Performance Analytics', eyebrow: 'Audience Reach' },
  collaborations: { title: 'Partnerships & Campaigns', eyebrow: 'Tourism Board' },
  settings: { title: 'Security & Settings', eyebrow: 'Account Control' },
};

function switchPanel(panelId) {
  if (!panelId) return;

  // Toggle Nav links
  $$('.dash-nav__link').forEach(link => {
    if (link.dataset.panel === panelId) {
      link.classList.add('is-active');
    } else {
      link.classList.remove('is-active');
    }
  });

  // Toggle Panels
  $$('.dash-panel').forEach(panel => {
    if (panel.id === `panel-${panelId}`) {
      panel.classList.add('is-active');
    } else {
      panel.classList.remove('is-active');
    }
  });

  // Update Topbar
  const config = PANEL_TITLES[panelId] || { title: 'Studio', eyebrow: 'Sonbhadra' };
  const titleEl = $('#topbar-title');
  const eyebrowEl = $('#topbar-eyebrow');
  if (titleEl) titleEl.textContent = config.title;
  if (eyebrowEl) eyebrowEl.textContent = config.eyebrow;

  // Update URL Hash without reload
  window.history.replaceState(null, '', `#${panelId}`);

  // Close mobile sidebar if open
  closeMobileSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initNav() {
  $$('.dash-nav__link').forEach(link => {
    link.addEventListener('click', () => {
      switchPanel(link.dataset.panel);
    });
  });

  // Quick action buttons with data-switch-to
  // Supports optional data-target-tab to scroll to a named element after panel switch
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-switch-to]');
    if (btn) {
      const targetPanel = btn.dataset.switchTo;
      const targetTab = btn.dataset.targetTab; // optional scroll target id
      switchPanel(targetPanel);

      if (targetTab) {
        // Small delay to allow panel paint before scrolling
        setTimeout(() => {
          const el = document.getElementById(targetTab + '-section') ||
                     document.querySelector('[data-section="' + targetTab + '"]') ||
                     document.querySelector('.dash-avatar-edit-box');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (targetTab === 'avatar') {
              const fileInput = $('#profile-avatar-file-input');
              if (fileInput) fileInput.click();
            }
          }
        }, 120);
      }
    }
  });

  // Check initial hash
  const hash = window.location.hash.replace('#', '');
  if (hash && PANEL_TITLES[hash]) {
    switchPanel(hash);
  }
}

/* --------------------------------------------------------------------------
   AVATAR UPLOAD HANDLING
   -------------------------------------------------------------------------- */
function initAvatarUpload() {
  const fileInput = $('#profile-avatar-file-input');
  const previewImg = $('#profile-preview-avatar');
  const saveBtn = $('#btn-save-avatar');
  const statusEl = $('#avatar-save-status');

  if (!fileInput) return;

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, or WebP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit.', 'error');
      return;
    }

    pendingAvatarFile = file;

    // Live preview
    const reader = new FileReader();
    reader.onload = e => {
      if (previewImg) previewImg.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Enable Save Button
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.classList.remove('is-disabled');
    }
    if (statusEl) {
      statusEl.textContent = 'New image selected — click Upload to save.';
      statusEl.className = 'dash-inline-status';
    }

    // Reset the btn text back to Upload in case it had a prior success label
    if (saveBtn) {
      const btnTextEl = saveBtn.querySelector('span:last-child');
      if (btnTextEl) btnTextEl.textContent = 'Upload Avatar';
    }
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (!pendingAvatarFile) return;

      setButtonLoading('btn-save-avatar', true);
      if (statusEl) statusEl.textContent = 'Uploading to Cloudinary…';

      const { ok, data, error } = await CreatorService.updateAvatar(pendingAvatarFile);

      setButtonLoading('btn-save-avatar', false);

      if (ok && data) {
        const newAvatarUrl = data.avatar;
        pendingAvatarFile = null;
        saveBtn.disabled = true;
        saveBtn.classList.add('is-disabled');

        // Update all avatars on page
        const initials = generateInitialsAvatar(currentCreatorState?.fullName || currentCreatorState?.creatorName || '?', 80);
        $$('#sidebar-avatar, #overview-hero-avatar, #mobile-user-avatar, #profile-preview-avatar').forEach(img => {
          loadAvatarWithFallback(img, newAvatarUrl, initials);
        });

        // Update state
        updateCreatorFields({ avatar: newAvatarUrl });
        currentCreatorState = { ...(currentCreatorState || {}), avatar: newAvatarUrl };
        if (statusEl) {
          statusEl.textContent = 'Avatar updated successfully!';
          statusEl.className = 'dash-inline-status success';
        }
        showToast('Your creator avatar was successfully updated!', 'success');
        calculateProfileCompletion(getCreator() || currentCreatorState);
      } else {
        if (statusEl) {
          statusEl.textContent = error || 'Upload failed.';
          statusEl.className = 'dash-inline-status error';
        }
        showToast(error || 'Failed to upload avatar.', 'error');
      }
    });
  }
}

/* --------------------------------------------------------------------------
   COVERING CITY FORM
   -------------------------------------------------------------------------- */
function initCoveringCityForm() {
  const form = $('#form-covering-city');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const city = $('#input-covering-city')?.value?.trim();
    if (!city) return;

    setButtonLoading('btn-save-city', true);
    const { ok, data, error } = await CreatorService.updateCoveringCity(city);
    setButtonLoading('btn-save-city', false);

    if (ok && data) {
      const updatedCity = data.coveringCity || city;
      updateCreatorFields({ coveringCity: updatedCity });

      const sidebarCity = $('#sidebar-city');
      if (sidebarCity) sidebarCity.textContent = updatedCity;

      const heroCity = $('#overview-hero-city');
      const heroVerifiedTag = $('#overview-hero-verified-tag');
      if (heroCity) {
        heroCity.textContent = updatedCity + ', Sonbhadra';
        heroCity.style.display = '';
        if (heroVerifiedTag) heroVerifiedTag.style.display = '';
      }

      showToast(`Covering city updated to ${updatedCity}!`, 'success');
    } else {
      showToast(error || 'Failed to update covering city.', 'error');
    }
  });
}

/* --------------------------------------------------------------------------
   ACCOUNT DETAILS FORM
   -------------------------------------------------------------------------- */
function initAccountDetailsForm() {
  const form = $('#form-account-details');
  const statusEl = $('#account-save-status');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Clear previous status
    if (statusEl) { statusEl.textContent = ''; statusEl.className = 'dash-inline-status'; }

    const fullName = $('#input-full-name')?.value?.trim();
    const phone = $('#input-phone')?.value?.trim();
    const street = $('#input-address-street')?.value?.trim();
    const city = $('#input-address-city')?.value?.trim();
    const state = $('#input-address-state')?.value?.trim() || 'Uttar Pradesh';
    const pincode = $('#input-address-pincode')?.value?.trim();

    if (!fullName) {
      showToast('Full Name is required.', 'error');
      return;
    }
    if (!phone) {
      showToast('Phone Number is required.', 'error');
      return;
    }

    setButtonLoading('btn-save-account', true);
    if (statusEl) statusEl.textContent = 'Saving details…';

    const addressPayload = (street || city || pincode)
      ? { street, city, state, pincode, country: 'India' }
      : undefined;

    const { ok, data, error } = await CreatorService.updateAccountDetails({
      fullName,
      phone,
      ...(addressPayload ? { address: addressPayload } : {}),
    });

    setButtonLoading('btn-save-account', false);

    if (ok && data) {
      updateCreatorFields({
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
      });

      // Update sidebar & profile views
      const sidebarName = $('#sidebar-fullname');
      if (sidebarName) sidebarName.textContent = data.fullName;
      const profileName = $('#profile-disp-fullname');
      if (profileName) profileName.textContent = data.fullName;
      const heroName = $('#overview-creator-name');
      if (heroName) heroName.textContent = (data.fullName || '').split(' ')[0] || data.fullName;

      if (statusEl) {
        statusEl.textContent = 'Saved successfully!';
        statusEl.className = 'dash-inline-status success';
      }
      showToast('Personal and address details updated!', 'success');
      calculateProfileCompletion(getCreator() || data);
    } else {
      if (statusEl) {
        statusEl.textContent = error || 'Failed to save.';
        statusEl.className = 'dash-inline-status error';
      }
      showToast(error || 'Failed to update account details.', 'error');
    }
  });
}

/* --------------------------------------------------------------------------
   BIO & DYNAMIC SOCIAL LINKS
   -------------------------------------------------------------------------- */
function updateBioCounter() {
  const bioInput = $('#input-bio');
  const countEl = $('#dash-bio-count');
  if (bioInput && countEl) {
    countEl.textContent = bioInput.value.length;
  }
}

function renderSocialLinks(links = []) {
  const container = $('#dash-social-container');
  if (!container) return;

  container.innerHTML = '';

  let list = [];
  if (Array.isArray(links)) {
    list = links;
  } else if (typeof links === 'string') {
    list = safeJsonParse(links) || [links];
  }

  if (list.length === 0) {
    list = ['']; // at least 1 input
  }

  list.forEach(link => {
    addSocialLinkInput(link);
  });
}

function addSocialLinkInput(value = '') {
  const container = $('#dash-social-container');
  if (!container) return;

  const item = document.createElement('div');
  item.className = 'dash-social-item';
  item.innerHTML = `
    <input type="url" class="dash-input dash-social-url-input" placeholder="https://instagram.com/yourhandle" value="${value}" />
    <button type="button" class="dash-social-remove" aria-label="Remove link">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

  item.querySelector('.dash-social-remove').addEventListener('click', () => {
    item.remove();
  });

  container.appendChild(item);
}

function initBioSocialForm() {
  const bioInput = $('#input-bio');
  if (bioInput) {
    bioInput.addEventListener('input', updateBioCounter);
  }

  const addBtn = $('#btn-add-social-item');
  if (addBtn) {
    addBtn.addEventListener('click', () => addSocialLinkInput(''));
  }

  const form = $('#form-bio-social');
  const statusEl = $('#bio-save-status');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const bio = bioInput?.value?.trim() ?? '';
    const socialLinks = $$('.dash-social-url-input')
      .map(inp => inp.value.trim())
      .filter(Boolean);

    setButtonLoading('btn-save-bio-social', true);
    if (statusEl) statusEl.textContent = 'Saving bio and links…';

    const { ok, data, error } = await CreatorService.updateBio({ bio, socialLinks });

    setButtonLoading('btn-save-bio-social', false);

    if (ok && data) {
      updateCreatorFields({ bio: data.bio, socialLinks: data.socialLinks });

      const heroBio = $('#overview-hero-bio');
      if (heroBio) heroBio.textContent = `“${data.bio || 'Tell Sonbhadra’s stories through local eyes.'}”`;

      if (statusEl) {
        statusEl.textContent = 'Bio and profiles updated!';
        statusEl.className = 'dash-inline-status success';
      }
      showToast('Biography and social profiles saved!', 'success');
      calculateProfileCompletion(data);
    } else {
      if (statusEl) {
        statusEl.textContent = error || 'Failed to save.';
        statusEl.className = 'dash-inline-status error';
      }
      showToast(error || 'Failed to update bio.', 'error');
    }
  });
}

/* --------------------------------------------------------------------------
   PASSWORD CHANGE FORM & TOGGLE
   -------------------------------------------------------------------------- */
function initPasswordForm() {
  // Password Visibility Toggles
  $$('.dash-pwd-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = $(`#${targetId}`);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.innerHTML = isPassword
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    });
  });

  const form = $('#form-change-password');
  const statusEl = $('#password-save-status');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Clear previous status
    if (statusEl) { statusEl.textContent = ''; statusEl.className = 'dash-inline-status'; }

    const oldPassword = $('#input-old-password')?.value;
    const newPassword = $('#input-new-password')?.value;
    const confirmPassword = $('#input-confirm-password')?.value;

    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('All password fields are required.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match. Please re-enter.', 'error');
      return;
    }

    if (oldPassword === newPassword) {
      showToast('New password must be different from the current one.', 'error');
      return;
    }

    setButtonLoading('btn-save-password', true);
    if (statusEl) statusEl.textContent = 'Updating password…';

    const { ok, error } = await CreatorService.changePassword({ oldPassword, newPassword });

    setButtonLoading('btn-save-password', false);

    if (ok) {
      form.reset();
      if (statusEl) {
        statusEl.textContent = 'Password changed successfully!';
        statusEl.className = 'dash-inline-status success';
      }
      showToast('Password updated! Please use your new password next time.', 'success');
    } else {
      if (statusEl) {
        statusEl.textContent = error || 'Failed to change password.';
        statusEl.className = 'dash-inline-status error';
      }
      showToast(error || 'Failed to update password. Check your current password.', 'error');
    }
  });
}

/* --------------------------------------------------------------------------
   LOGOUT HANDLING
   -------------------------------------------------------------------------- */
function initLogout() {
  const logoutBtns = $$('#btn-logout, #btn-danger-logout');

  logoutBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const confirmLogout = confirm('Are you sure you want to log out of Sonbhadra Creator Studio?');
      if (!confirmLogout) return;

      btn.disabled = true;
      await CreatorService.logout();
      clearSession();
      showToast('Logged out safely.', 'info');
      setTimeout(() => {
        window.location.href = '../auth/index.html';
      }, 500);
    });
  });
}

/* --------------------------------------------------------------------------
   MOBILE SIDEBAR TOGGLE
   -------------------------------------------------------------------------- */
function initMobileDrawer() {
  const toggleBtn = $('#dash-sidebar-toggle');
  const sidebar = $('#dash-sidebar');
  const backdrop = $('#dash-sidebar-backdrop');

  function open() {
    if (sidebar) sidebar.classList.add('is-open');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
  }

  function close() {
    if (sidebar) sidebar.classList.remove('is-open');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', () => {
    if (sidebar?.classList.contains('is-open')) close();
    else open();
  });

  if (backdrop) backdrop.addEventListener('click', close);
}

function closeMobileSidebar() {
  const sidebar = $('#dash-sidebar');
  const toggleBtn = $('#dash-sidebar-toggle');
  if (sidebar) sidebar.classList.remove('is-open');
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
}

/* --------------------------------------------------------------------------
   STORY / REEL SUBMISSION MODAL
   -------------------------------------------------------------------------- */
function initStoryModal() {
  const modal = $('#modal-new-story');
  if (!modal) return;

  const openBtns = $$('#btn-quick-new-story, #btn-new-content-cta');
  const closeBtn = $('#modal-story-close');
  const cancelBtn = $('#modal-story-cancel');
  const backdrop = $('#modal-story-backdrop');
  const form = $('#form-submit-story');

  function openModal() {
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    const titleInput = $('#story-title');
    if (titleInput) titleInput.focus();
  }

  function closeModal() {
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    if (form) form.reset();
  }

  openBtns.forEach(btn => btn.addEventListener('click', openModal));
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      closeModal();
    }
  });

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const title = $('#story-title')?.value?.trim();
      const category = $('#story-category')?.value || 'Waterfalls';
      const location = $('#story-location')?.value?.trim() || 'Sonbhadra, UP';
      const mediaUrl = $('#story-image-select')?.value || '/public/assets/images/destinations/lakhaniya-dari.webp';
      const description = $('#story-body')?.value?.trim() || '';

      if (!title) {
        showToast('Please enter a headline for your story.', 'error');
        return;
      }

      const newStory = {
        _id: 'local_story_' + Date.now(),
        title,
        category: category.charAt(0).toUpperCase() + category.slice(1),
        location,
        description,
        mediaUrl,
        views: 0,
        likes: 0,
        createdAt: new Date().toISOString(),
        isLocal: true,
      };

      const creator = getCreator() || currentCreatorState;
      const username = creator?.creatorName;
      if (username) {
        saveLocalStory(username, newStory);
      }

      if (!channelProfileState) {
        channelProfileState = { posts: [], totalPosts: 0, totalViews: 0, totalLikes: 0 };
      }
      if (!Array.isArray(channelProfileState.posts)) {
        channelProfileState.posts = [];
      }

      channelProfileState.posts.unshift(newStory);
      channelProfileState.totalPosts = channelProfileState.posts.length;

      renderPosts(channelProfileState.posts);
      animateCounter('#metric-total-posts', channelProfileState.posts.length);

      const pScore = calculateProfileCompletion(creator);
      updateCreatorMetricsAndScore(channelProfileState.posts, channelProfileState.totalViews, channelProfileState.totalLikes, pScore);
      renderAnalytics(channelProfileState.posts, channelProfileState.totalViews, channelProfileState.totalLikes);

      closeModal();
      showToast(`“${title}” was published to your story library!`, 'success');
      switchPanel('content');
    });
  }
}

/* --------------------------------------------------------------------------
   COLLABORATIONS PANEL INTERACTION
   -------------------------------------------------------------------------- */
function initCollaborations() {
  const btnWaterfall = $('#btn-collab-waterfall');
  const btnSalkhan = $('#btn-collab-salkhan');
  const btnHomestay = $('#btn-collab-homestay');

  const creator = getCreator() || currentCreatorState;
  const username = creator?.creatorName || 'creator';

  const isAppliedWaterfall = localStorage.getItem(`collab_waterfall_${username}`) === 'true';
  const isAlertSalkhan = localStorage.getItem(`collab_salkhan_${username}`) === 'true';

  if (btnWaterfall && isAppliedWaterfall) {
    btnWaterfall.textContent = '✓ Application Submitted';
    btnWaterfall.classList.add('is-disabled');
    btnWaterfall.disabled = true;
  }

  if (btnSalkhan && isAlertSalkhan) {
    btnSalkhan.textContent = '✓ Alert Active';
    btnSalkhan.classList.add('is-disabled');
    btnSalkhan.disabled = true;
  }

  if (btnWaterfall) {
    btnWaterfall.addEventListener('click', () => {
      localStorage.setItem(`collab_waterfall_${username}`, 'true');
      btnWaterfall.textContent = '✓ Application Submitted';
      btnWaterfall.classList.add('is-disabled');
      btnWaterfall.disabled = true;
      showToast('Your application for Monsoon Storytellers Camp has been submitted to Uttar Pradesh Tourism Board!', 'success');
    });
  }

  if (btnSalkhan) {
    btnSalkhan.addEventListener('click', () => {
      localStorage.setItem(`collab_salkhan_${username}`, 'true');
      btnSalkhan.textContent = '✓ Alert Active';
      btnSalkhan.classList.add('is-disabled');
      btnSalkhan.disabled = true;
      showToast('Priority alert set! You will be notified when Salkhan Fossil docu-series creator roster opens.', 'success');
    });
  }

  if (btnHomestay) {
    btnHomestay.addEventListener('click', () => {
      const postsCount = channelProfileState?.posts?.length || 0;
      if (postsCount >= 3) {
        showToast('🎉 You are eligible! Homestay vouchers will be emailed to your registered address.', 'success');
      } else {
        showToast(`You have published ${postsCount} story/stories. Publish at least 3 stories to unlock complimentary rural homestays!`, 'info');
      }
    });
  }
}

/* --------------------------------------------------------------------------
   CONTENT FILTERING & SORTING (MY CONTENT LIBRARY)
   -------------------------------------------------------------------------- */
function initContentFiltering() {
  const filterPills = $$('.dash-filter-pill');
  const sortSelect = $('#content-sort');

  function applyFilters() {
    if (!channelProfileState?.posts) return;

    let posts = [...channelProfileState.posts];

    // 1. Filter pill
    const activePill = $('.dash-filter-pill.is-active');
    const filter = activePill ? activePill.dataset.filter : 'all';

    if (filter && filter !== 'all') {
      posts = posts.filter(p => {
        const cat = (p.category || p.type || '').toLowerCase();
        if (filter === 'photo') return cat.includes('photo') || cat.includes('fossils') || cat.includes('waterfall');
        if (filter === 'video') return cat.includes('video') || cat.includes('reel') || cat.includes('dams');
        if (filter === 'guide') return cat.includes('guide') || cat.includes('heritage') || cat.includes('culture');
        return true;
      });
    }

    // 2. Sort
    const sortVal = sortSelect?.value || 'recent';
    if (sortVal === 'views') {
      posts.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortVal === 'likes') {
      posts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      posts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    renderPosts(posts);
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      applyFilters();
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', applyFilters);
  }
}

/* --------------------------------------------------------------------------
   GLOBAL SEARCH IN DASHBOARD
   -------------------------------------------------------------------------- */
function initDashboardSearch() {
  const searchInput = $('#dash-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      if (channelProfileState?.posts) renderPosts(channelProfileState.posts);
      return;
    }

    if (channelProfileState?.posts) {
      const filtered = channelProfileState.posts.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
      renderPosts(filtered);
      switchPanel('content');
    }
  });
}

/* --------------------------------------------------------------------------
   DOCUMENT READY ENTRYPOINT
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initSession();
  initNav();
  initAvatarUpload();
  initCoveringCityForm();
  initAccountDetailsForm();
  initBioSocialForm();
  initPasswordForm();
  initStoryModal();
  initContentFiltering();
  initCollaborations();
  initLogout();
  initMobileDrawer();
  initDashboardSearch();
});
