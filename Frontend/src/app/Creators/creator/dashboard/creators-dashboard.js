/**
 * Creators Dashboard — Tourist View
 * Sonbhadra Tourism
 *
 * Fetches all registered creators from the backend API.
 * Falls back to local static data if the API is unavailable.
 * Renders creator cards with search + category filter.
 */

import { CREATORS_DATA } from '../../../../data/creators.js';
import { get } from '../../../../scripts/utils/api.js';

/* --------------------------------------------------------------------------
   DOM HELPERS
   -------------------------------------------------------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* --------------------------------------------------------------------------
   STATE
   -------------------------------------------------------------------------- */
let allCreators = [];
let activeFilter = 'all';
let searchQuery = '';

/* --------------------------------------------------------------------------
   COVER GRADIENT MAP (by categorySlug)
   -------------------------------------------------------------------------- */
const COVER_CLASS_MAP = {
  trekking:  'cd-creator-card__cover--trekking',
  cinematic: 'cd-creator-card__cover--cinematic',
  heritage:  'cd-creator-card__cover--heritage',
  nature:    'cd-creator-card__cover--nature',
};

/* --------------------------------------------------------------------------
   SOCIAL ICON HELPER
   -------------------------------------------------------------------------- */
function getSocialIcon(url = '') {
  const lower = url.toLowerCase();
  if (lower.includes('instagram')) {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`;
  }
  if (lower.includes('youtube')) {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>`;
  }
  if (lower.includes('twitter') || lower.includes('x.com')) {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>`;
  }
  // Generic link
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
}

function getSocialLabel(url = '') {
  const lower = url.toLowerCase();
  if (lower.includes('instagram')) return 'Instagram';
  if (lower.includes('youtube')) return 'YouTube';
  if (lower.includes('twitter') || lower.includes('x.com')) return 'Twitter';
  return 'Portfolio';
}

/* --------------------------------------------------------------------------
   BUILD CREATOR CARD HTML
   -------------------------------------------------------------------------- */
function buildCreatorCard(creator) {
  const coverClass = COVER_CLASS_MAP[creator.categorySlug] || '';
  const staticSlugs = ['creator5776', 'creator_2', 'edgeknow880', 'new_creator'];
  const profileUrl = staticSlugs.includes(creator.slug)
    ? `../profiles/${creator.slug}.html`
    : `../profiles/profile.html?creator=${encodeURIComponent(creator.slug)}`;

  // Social links (if available)
  let socialsHtml = '';
  if (creator.socialLinks && creator.socialLinks.length > 0) {
    const linksHtml = creator.socialLinks
      .slice(0, 3)
      .map(url => `
        <a href="${url}" class="cd-creator-card__social-link" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
          ${getSocialIcon(url)}
          ${getSocialLabel(url)}
        </a>
      `).join('');
    socialsHtml = `<div class="cd-creator-card__socials">${linksHtml}</div>`;
  }

  // Area tags
  const areasHtml = (creator.areasCovered || [])
    .map(area => `
      <span class="cd-creator-card__area-tag">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${area}
      </span>
    `).join('');

  const verifiedBadge = creator.verified
    ? `<span class="cd-creator-card__verified-badge" title="Verified Creator">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
       </span>`
    : '';

  const featuredTag = creator.featured
    ? `<span class="cd-creator-card__featured-tag">⭐ Featured</span>`
    : '';

  return `
    <a
      href="${profileUrl}"
      class="cd-creator-card"
      role="listitem"
      aria-label="View ${creator.name}'s creator profile"
      data-category="${creator.categorySlug || ''}"
      data-name="${(creator.name || '').toLowerCase()}"
      data-handle="${(creator.handle || '').toLowerCase()}"
      data-areas="${(creator.areasCovered || []).join(' ').toLowerCase()}"
    >
      <!-- Cover Banner -->
      <div class="cd-creator-card__cover ${coverClass}">
        <div class="cd-creator-card__cover-pattern" aria-hidden="true"></div>
        <div class="cd-creator-card__cover-overlay" aria-hidden="true"></div>
        <span class="cd-creator-card__cat-badge">${creator.category || 'Creator'}</span>
      </div>

      <!-- Avatar overlapping cover -->
      <div class="cd-creator-card__avatar-wrap">
        <img
          src="${creator.image || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1 1\'%3E%3C/svg%3E'}"
          alt="${creator.name} avatar"
          class="cd-creator-card__avatar"
          loading="lazy"
          width="72"
          height="72"
        />
        ${verifiedBadge}
      </div>

      <!-- Body -->
      <div class="cd-creator-card__body">
        <div class="cd-creator-card__header">
          <div>
            <h3 class="cd-creator-card__name">${creator.name}</h3>
            <span class="cd-creator-card__handle">${creator.handle}</span>
          </div>
          ${featuredTag}
        </div>

        <p class="cd-creator-card__bio">${creator.bio || 'A passionate storyteller documenting Sonbhadra.'}</p>

        ${areasHtml ? `<div class="cd-creator-card__areas">${areasHtml}</div>` : ''}

        ${socialsHtml}

        <div class="cd-creator-card__footer">
          <span class="cd-creator-card__role">${creator.expeditionsCount || 'Community Guide'}</span>
          <span class="cd-creator-card__cta">
            View Profile
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </span>
        </div>
      </div>
    </a>
  `;
}

/* --------------------------------------------------------------------------
   RENDER CREATORS
   -------------------------------------------------------------------------- */
function renderCreators(creators) {
  const grid = $('#cd-creators-grid');
  const emptyState = $('#cd-empty-state');

  if (!grid) return;

  if (creators.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  grid.innerHTML = creators.map(buildCreatorCard).join('');

  // Update count
  const countEl = $('#cd-count-num');
  if (countEl) countEl.textContent = creators.length;
}

/* --------------------------------------------------------------------------
   FILTER LOGIC
   -------------------------------------------------------------------------- */
function applyFilters() {
  let filtered = allCreators;

  // Category filter
  if (activeFilter !== 'all') {
    filtered = filtered.filter(c => c.categorySlug === activeFilter);
  }

  // Search filter
  if (searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.handle || '').toLowerCase().includes(q) ||
      (c.bio || '').toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q) ||
      (c.areasCovered || []).some(a => a.toLowerCase().includes(q))
    );
  }

  renderCreators(filtered);
}

/* --------------------------------------------------------------------------
   ENRICH CREATOR DATA (Combines API response with known metadata or smart defaults)
   -------------------------------------------------------------------------- */
function enrichCreator(c) {
  const known = CREATORS_DATA.find(k => k.slug === c.creatorName || k.id === c.creatorName);

  const text = `${c.bio || ''} ${c.coveringCity || ''}`.toLowerCase();
  let defaultCategory = 'Local Explorer & Guide';
  let defaultCategorySlug = 'nature';

  if (text.includes('cinemat') || text.includes('film') || text.includes('drone') || text.includes('video') || text.includes('photo')) {
    defaultCategory = 'Aerial & Cinematic Filmmaker';
    defaultCategorySlug = 'cinematic';
  } else if (text.includes('heritage') || text.includes('histor') || text.includes('rock') || text.includes('art') || text.includes('fort') || text.includes('cave')) {
    defaultCategory = 'History & Rock Art Researcher';
    defaultCategorySlug = 'heritage';
  } else if (text.includes('nature') || text.includes('wild') || text.includes('forest') || text.includes('waterfall') || text.includes('river')) {
    defaultCategory = 'Nature & Wildlife Specialist';
    defaultCategorySlug = 'nature';
  } else if (text.includes('trek') || text.includes('trail') || text.includes('hike') || text.includes('mountain') || text.includes('peak')) {
    defaultCategory = 'Trail & Trekking Specialist';
    defaultCategorySlug = 'trekking';
  }

  const category = c.category || known?.category || defaultCategory;
  const categorySlug = c.categorySlug || known?.categorySlug || defaultCategorySlug;
  const bio = (c.bio && c.bio.trim()) || known?.bio || 'Passionate local creator uncovering and documenting Sonbhadra’s hidden wonders.';
  const areasCovered = (c.coveringCity && c.coveringCity.trim())
    ? [c.coveringCity.trim()]
    : (known?.areasCovered || (Array.isArray(c.areasCovered) && c.areasCovered.length ? c.areasCovered : ['Sonbhadra District']));

  return {
    id: c._id || c.id || c.creatorName,
    slug: c.creatorName || c.slug,
    name: c.fullName || known?.name || c.creatorName,
    handle: `@${c.creatorName || c.handle?.replace('@', '')}`,
    category,
    categorySlug,
    bio,
    image: c.avatar || known?.image || c.image || '',
    areasCovered,
    socialLinks: Array.isArray(c.socialLinks) && c.socialLinks.length ? c.socialLinks : (known?.socialLinks || []),
    expeditionsCount: c.expeditionsCount || known?.expeditionsCount || 'Community Guide',
    verified: c.verified ?? true,
    featured: c.featured ?? known?.featured ?? false,
    totalStories: c.totalStories || 0,
    totalViews: c.totalViews || 0,
    totalLikes: c.totalLikes || 0,
  };
}

/* --------------------------------------------------------------------------
   FETCH CREATORS FROM API (with local fallback)
   -------------------------------------------------------------------------- */
async function fetchCreators() {
  try {
    // Try the live API first
    const { ok, data } = await get('/creators/all');
    if (ok && Array.isArray(data) && data.length > 0) {
      return data.map(enrichCreator);
    }
  } catch (err) {
    console.warn('[CreatorsDashboard] API unavailable, using local data:', err);
  }

  // Fallback to static local data
  return CREATORS_DATA;
}

/* --------------------------------------------------------------------------
   HERO STATS
   -------------------------------------------------------------------------- */
function updateHeroStats(creators) {
  const totalEl = $('#stat-total-creators');
  const featuredEl = $('#stat-featured-creators');

  if (totalEl) totalEl.textContent = creators.length;
  if (featuredEl) featuredEl.textContent = creators.filter(c => c.featured).length;

  const countEl = $('#cd-count-num');
  if (countEl) countEl.textContent = creators.length;
}

/* --------------------------------------------------------------------------
   FILTER PILLS
   -------------------------------------------------------------------------- */
function initFilterPills() {
  $$('.cd-filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.cd-filter-pill').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeFilter = btn.dataset.filter || 'all';
      applyFilters();
    });
  });
}

/* --------------------------------------------------------------------------
   SEARCH INPUT
   -------------------------------------------------------------------------- */
function initSearch() {
  const input = $('#cd-search-input');
  if (!input) return;

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = input.value;
      applyFilters();
    }, 220);
  });
}

/* --------------------------------------------------------------------------
   INIT
   -------------------------------------------------------------------------- */
async function init() {
  initFilterPills();
  initSearch();

  // Fetch + render
  allCreators = await fetchCreators();
  updateHeroStats(allCreators);
  renderCreators(allCreators);
}

init();
