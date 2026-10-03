/**
 * Creator Profile Page Controller — Shared
 * Sonbhadra Tourism
 *
 * Each individual creator profile page (creator5776.html, creator_2.html, etc.)
 * calls init(creatorSlug) to hydrate the page from API data.
 * Falls back to local CREATORS_DATA if the API is unavailable.
 */

import { CREATORS_DATA } from '../../../../data/creators.js';
import { get } from '../../../../scripts/utils/api.js';

/* --------------------------------------------------------------------------
   HELPERS
   -------------------------------------------------------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);

function setText(id, val) {
  const el = $(id);
  if (el && val !== undefined && val !== null) el.textContent = val;
}

function setAttr(id, attr, val) {
  const el = $(id);
  if (el && val) el.setAttribute(attr, val);
}

function show(id) {
  const el = $(id);
  if (el) el.style.display = '';
}

function hide(id) {
  const el = $(id);
  if (el) el.style.display = 'none';
}

/* --------------------------------------------------------------------------
   SOCIAL ICONS
   -------------------------------------------------------------------------- */
function getSocialIcon(url = '') {
  const lower = url.toLowerCase();
  if (lower.includes('instagram'))
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`;
  if (lower.includes('youtube'))
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>`;
  if (lower.includes('twitter') || lower.includes('x.com'))
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>`;
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
}

function getSocialLabel(url = '') {
  const lower = url.toLowerCase();
  if (lower.includes('instagram')) return 'Instagram';
  if (lower.includes('youtube')) return 'YouTube';
  if (lower.includes('twitter') || lower.includes('x.com')) return 'Twitter / X';
  return 'Portfolio';
}

/* --------------------------------------------------------------------------
   FETCH CREATOR DATA
   -------------------------------------------------------------------------- */
async function fetchCreator(slug) {
  // Try API first (by creatorName)
  try {
    const { ok, data } = await get(`/creators/c/${encodeURIComponent(slug)}`);
    if (ok && data) {
      const known = CREATORS_DATA.find(c => c.slug === slug || c.id === slug);

      const text = `${data.bio || ''} ${data.coveringCity || ''}`.toLowerCase();
      let defaultCat = 'Local Explorer & Guide';
      let defaultCatSlug = 'nature';
      if (text.includes('cinemat') || text.includes('film') || text.includes('drone') || text.includes('video')) {
        defaultCat = 'Aerial & Cinematic Filmmaker';
        defaultCatSlug = 'cinematic';
      } else if (text.includes('heritage') || text.includes('histor') || text.includes('rock') || text.includes('art') || text.includes('fort')) {
        defaultCat = 'History & Rock Art Researcher';
        defaultCatSlug = 'heritage';
      } else if (text.includes('trek') || text.includes('trail') || text.includes('hike')) {
        defaultCat = 'Trail & Trekking Specialist';
        defaultCatSlug = 'trekking';
      }

      return {
        id: data._id || slug,
        slug: data.creatorName || slug,
        name: data.fullName || known?.name || data.creatorName,
        handle: `@${data.creatorName || slug}`,
        category: data.category || known?.category || defaultCat,
        categorySlug: data.categorySlug || known?.categorySlug || defaultCatSlug,
        bio: (data.bio && data.bio.trim()) || known?.bio || 'Passionate local creator uncovering and documenting Sonbhadra’s hidden wonders.',
        image: data.avatar || known?.image || data.image || '',
        areasCovered: (data.coveringCity && data.coveringCity.trim()) ? [data.coveringCity.trim()] : (known?.areasCovered || ['Sonbhadra District']),
        socialLinks: Array.isArray(data.socialLinks) && data.socialLinks.length ? data.socialLinks : (known?.socialLinks || []),
        expeditionsCount: data.expeditionsCount || known?.expeditionsCount || 'Community Guide',
        verified: data.verified ?? true,
        featured: data.featured ?? known?.featured ?? false,
        totalPosts: data.totalPosts || 0,
        totalViews: data.totalViews || 0,
        totalLikes: data.totalLikes || 0,
      };
    }
  } catch (err) {
    console.warn('[CreatorProfile] API unavailable, using local data:', err);
  }

  // Fallback: local static data
  return CREATORS_DATA.find(c => c.slug === slug || c.id === slug) || null;
}

/* --------------------------------------------------------------------------
   HYDRATE PAGE
   -------------------------------------------------------------------------- */
async function hydratePage(creator) {
  if (!creator) {
    document.title = 'Creator Not Found — SonbhadraConnect';
    const main = document.querySelector('.cp-page');
    if (main) {
      main.innerHTML = `
        <div style="text-align:center;padding:8rem 1rem;">
          <h2 style="font-family:'Outfit',sans-serif;color:#F2F0EC;">Creator not found</h2>
          <p style="color:#8A9C92;margin-bottom:2rem;">This creator profile doesn't exist or may have been removed.</p>
          <a href="../dashboard/index.html" style="color:#F4A261;">← Back to all creators</a>
        </div>
      `;
    }
    return;
  }

  // Page title & meta
  document.title = `${creator.name} (${creator.handle}) — SonbhadraConnect Creator`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', `Discover ${creator.name}'s travel stories, photography, and guides from Sonbhadra. ${creator.bio || ''}`);

  // Cover class
  const cover = document.querySelector('.cp-cover');
  if (cover && creator.categorySlug) cover.classList.add(`cp-cover--${creator.categorySlug}`);

  const catTag = document.querySelector('.cp-cover__cat-tag');
  if (catTag) catTag.textContent = creator.category || 'Creator';

  // Avatar
  const avatarEl = document.querySelector('.cp-avatar');
  if (avatarEl && creator.image) {
    avatarEl.src = creator.image;
    avatarEl.alt = `${creator.name}'s photo`;
  }

  // Verified badge visibility
  const verifiedBadge = document.querySelector('.cp-verified-badge');
  if (verifiedBadge) verifiedBadge.style.display = creator.verified ? 'flex' : 'none';

  const verifiedLabel = document.querySelector('.cp-verified-label');
  if (verifiedLabel) verifiedLabel.style.display = creator.verified ? 'inline-flex' : 'none';

  const featuredLabel = document.querySelector('.cp-featured-label');
  if (featuredLabel) featuredLabel.style.display = creator.featured ? 'inline-flex' : 'none';

  // Name, handle, category
  setText('#cp-creator-name', creator.name);
  setText('#cp-creator-handle', creator.handle);
  setText('#cp-creator-category', creator.category);
  setText('#cp-creator-bio', creator.bio || 'A passionate storyteller documenting the wonders of Sonbhadra district.');
  setText('#cp-creator-role', creator.expeditionsCount || 'Community Guide');

  // Breadcrumb
  setText('#cp-breadcrumb-name', creator.name);

  // Stats
  setText('#cp-stat-posts', creator.totalPosts ?? '—');
  setText('#cp-stat-views', creator.totalViews
    ? (creator.totalViews >= 1000 ? (creator.totalViews / 1000).toFixed(1) + 'k' : creator.totalViews)
    : '—');
  setText('#cp-stat-likes', creator.totalLikes ?? '—');

  // Areas covered
  const areasEl = document.querySelector('#cp-areas-list');
  if (areasEl) {
    const areas = creator.areasCovered || [];
    if (areas.length > 0) {
      areasEl.innerHTML = areas.map(a => `
        <span class="cp-area-tag">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${a}
        </span>
      `).join('');
    } else {
      document.querySelector('#cp-areas-card')?.style.setProperty('display', 'none');
    }
  }

  // Social links
  const socialsEl = document.querySelector('#cp-social-list');
  if (socialsEl) {
    const links = creator.socialLinks || [];
    if (links.length > 0) {
      socialsEl.innerHTML = links.map(url => `
        <a href="${url}" class="cp-social-link" target="_blank" rel="noopener noreferrer">
          ${getSocialIcon(url)}
          <span>${getSocialLabel(url)}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;opacity:0.4"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      `).join('');
    } else {
      document.querySelector('#cp-social-card')?.style.setProperty('display', 'none');
    }
  }

  // Hire CTA link
  const hireBtn = document.querySelector('#cp-btn-hire');
  if (hireBtn) hireBtn.href = `/src/app/tourists/bookNow.html?creator=${encodeURIComponent(creator.handle)}`;

  // Share button
  const shareBtn = document.querySelector('#cp-btn-share');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      if (navigator.share) {
        await navigator.share({ title: `${creator.name} on SonbhadraConnect`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        shareBtn.textContent = 'Link copied!';
        setTimeout(() => shareBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share`, 2000);
      }
    });
  }
}

/* --------------------------------------------------------------------------
   EXPORTED INIT — called by each profile page
   -------------------------------------------------------------------------- */
export async function init(slug) {
  const creator = await fetchCreator(slug);
  await hydratePage(creator);
}
