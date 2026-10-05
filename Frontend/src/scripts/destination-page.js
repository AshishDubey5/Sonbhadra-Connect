/**
 * Individual Destination Page Controller
 * 
 * Reusable, data-driven controller that powers all destination detail pages.
 * Handles lifecycle, DOM hydration, gallery scrolling, lightbox viewer,
 * coordinates copying, and interactive states.
 */

import { DestinationDetailService } from '../services/destination-detail.service.js';
import { CreatorService } from '../services/creator.service.js';
import { initDetailWishlistButton } from './modules/wishlist.js';

class DestinationPageController {
  constructor() {
    this.slug = this.resolveSlug();
    this.destination = null;
  }

  resolveSlug() {
    // 1. Check data-slug attribute on <body>
    if (document.body && document.body.dataset.slug) {
      return document.body.dataset.slug;
    }

    // 2. Check URL search param ?slug=...
    const urlParams = new URLSearchParams(window.location.search);
    const paramSlug = urlParams.get('slug');
    if (paramSlug) return paramSlug;

    // 3. Check filename from pathname (e.g. /destinations/rihand.html -> rihand-dam)
    const pathname = window.location.pathname;
    if (pathname.includes('rihand')) return 'rihand-dam';
    if (pathname.includes('lakhaniya')) return 'lakhaniya-dari';
    if (pathname.includes('vijaygarh')) return 'vijaygarh-fort';
    if (pathname.includes('agori')) return 'agori-fort';
    if (pathname.includes('mukha')) return 'mukha-falls';
    if (pathname.includes('salkhan')) return 'salkhan-fossils';

    return 'rihand-dam';
  }

  resolveImgUrl(url, fallback = '') {
    if (!url) return fallback || '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const publicIdx = url.indexOf('public/assets/');
    if (publicIdx !== -1) {
      return '../../../' + url.substring(publicIdx);
    }
    return url;
  }

  async init() {
    try {
      this.destination = await DestinationDetailService.getBySlug(this.slug);
      if (!this.destination) {
        this.renderErrorState();
        return;
      }

      this.updatePageMeta();
      this.renderHero();
      this.renderStories();
      await this.renderCreators();
      this.renderTouristGuideDashboard();
      this.renderLogistics();
      this.renderMap();
      this.renderGuidelines();
      await this.renderRelated();
      this.bindEvents();
      this.initNavigation();
    } catch (err) {
      console.error('Failed to initialize destination page:', err);
      this.renderErrorState();
    }
  }

  updatePageMeta() {
    const d = this.destination;
    document.title = `${d.name} — SonbhadraConnect`;
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', `${d.name} in Sonbhadra, UP: ${d.tagline}. Discover stories, local creators, timings, and how to reach.`);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', `${d.name} — SonbhadraConnect`);
  }

  renderHero() {
    const container = document.getElementById('destHeroContainer');
    if (!container) return;
    const d = this.destination;
    const qf = d.quickFacts || {};
    const gallery = d.gallery || [];
    const firstImg = gallery[0] || { url: '', alt: d.name, caption: d.tagline };
    const firstUrl = this.resolveImgUrl(firstImg.url, firstImg.fallback);
    const firstFallback = this.resolveImgUrl(firstImg.fallback || '');

    const thumbnailCards = gallery.map((img, idx) => {
      const fullUrl = this.resolveImgUrl(img.url, img.fallback);
      const fallbackUrl = this.resolveImgUrl(img.fallback || '');
      return `
      <div class="detail-gallery-thumb-card ${idx === 0 ? 'is-active' : ''}" data-index="${idx}" data-full="${fullUrl}" ${fallbackUrl ? `data-fallback="${fallbackUrl}"` : ''} data-caption="${img.caption || img.alt}">
        <img src="${fullUrl}" alt="${img.alt}" loading="lazy" ${fallbackUrl ? `data-fallback="${fallbackUrl}" onerror="if(this.dataset.fallback && this.src !== this.dataset.fallback){ this.src=this.dataset.fallback; }"` : ''} />
      </div>
    `;
    }).join('');

    const galleryCards = gallery.map((img, idx) => {
      const fullUrl = this.resolveImgUrl(img.url, img.fallback);
      const fallbackUrl = this.resolveImgUrl(img.fallback || '');
      return `
      <div class="detail-gallery-card" data-index="${idx}" data-full="${fullUrl}">
        <div class="detail-gallery-card__img-wrap">
          <img src="${fullUrl}" alt="${img.alt}" class="detail-gallery-card__img" loading="lazy" ${fallbackUrl ? `data-fallback="${fallbackUrl}" onerror="if(this.dataset.fallback && this.src !== this.dataset.fallback){ this.src=this.dataset.fallback; }"` : ''} />
        </div>
        <div class="detail-gallery-card__caption">
          <p class="detail-gallery-card__caption-text">${img.caption || img.alt}</p>
        </div>
      </div>
    `;
    }).join('');

    container.innerHTML = `
      <div class="container">
        <!-- Breadcrumbs -->
        <nav class="detail-breadcrumb" aria-label="Breadcrumb">
          <a href="./index.html">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            All Destinations
          </a>
          <span>/</span>
          <span style="color: #fff;">${d.shortName || d.name}</span>
        </nav>

        <div class="detail-hero__header">
          <div class="detail-hero__meta-row">
            <span class="detail-badge">${d.categoryBadge || d.category}</span>
            <span class="detail-badge detail-badge--verified">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Verified Destination
            </span>
            <span class="detail-hero__location">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              ${d.location}
            </span>
          </div>

          <h1 class="detail-hero__title">${d.name}</h1>
          <p class="detail-hero__tagline">${d.tagline}</p>
          <p class="detail-hero__summary">${d.summary}</p>

          <div class="detail-hero__wishlist-row">
            <button class="detail-wishlist-btn" id="detailWishlistBtn" data-dest-id="${this.slug}" data-dest-name="${d.name}" aria-label="Add ${d.name} to wishlist" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span>Add to Wishlist</span>
            </button>
          </div>
        </div>

        <!-- 5-6 Destination Images Showcase in Hero -->
        <div class="detail-hero-stage" id="heroStage" role="region" aria-label="Featured destination imagery" style="cursor: pointer;">
          <img src="${firstUrl}" alt="${firstImg.alt}" class="detail-hero-stage__img" id="heroStageImg" ${firstFallback ? `data-fallback="${firstFallback}" onerror="if(this.dataset.fallback && this.src !== this.dataset.fallback){ this.src=this.dataset.fallback; }"` : ''} />
          <div class="detail-hero-stage__overlay"></div>
          <div class="detail-hero-stage__caption-wrap">
            <div class="detail-hero-stage__caption" id="heroStageCaption">${firstImg.caption || firstImg.alt}</div>
            <div class="detail-hero-stage__counter" id="heroStageCounter">1 / ${gallery.length} Photos</div>
          </div>
        </div>

        <!-- Interactive 5-6 Images Thumbnail Selector -->
        <div class="detail-gallery-thumb-track" id="heroThumbTrack" role="tablist" aria-label="Destination image thumbnails">
          ${thumbnailCards}
        </div>

        <!-- Quick Chips Bar -->
        <div class="detail-chips-bar">
          <div class="detail-chip">
            <div class="detail-chip__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            </div>
            <div>
              <span class="detail-chip__label">Best Season</span>
              <span class="detail-chip__val">${qf.bestSeason ? qf.bestSeason.split('(')[0] : 'Oct – Mar'}</span>
            </div>
          </div>

          <div class="detail-chip">
            <div class="detail-chip__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <span class="detail-chip__label">Timings</span>
              <span class="detail-chip__val">${qf.timings ? qf.timings.split('(')[0] : '06:00 AM – 06:00 PM'}</span>
            </div>
          </div>

          <div class="detail-chip">
            <div class="detail-chip__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div>
              <span class="detail-chip__label">Difficulty</span>
              <span class="detail-chip__val">${qf.difficulty ? qf.difficulty.split('(')[0] : 'Easy'}</span>
            </div>
          </div>

          <div class="detail-chip">
            <div class="detail-chip__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="6" y2="8"/>
                <line x1="10" y1="8" x2="18" y2="8"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="6" y1="16" x2="12" y2="16"/>
              </svg>
            </div>
            <div>
              <span class="detail-chip__label">Entry Permit</span>
              <span class="detail-chip__val">${qf.entryFee ? qf.entryFee.split('(')[0] : 'Free Access'}</span>
            </div>
          </div>
        </div>

        <!-- Photographic Gallery Track -->
        <div class="detail-gallery-wrap">
          <div class="detail-gallery-header">
            <div>
              <span class="detail-section-kicker">Visual Archive</span>
              <h2 style="font-family: var(--font-display); font-size: 1.4rem; color: #fff;">Expanded Photographic Gallery</h2>
            </div>
            <div class="detail-gallery-nav">
              <button class="detail-gallery-btn" id="galleryPrevBtn" aria-label="Previous gallery image">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <button class="detail-gallery-btn" id="galleryNextBtn" aria-label="Next gallery image">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="detail-gallery-track" id="galleryTrack" role="region" aria-label="Destination photo gallery">
            ${galleryCards}
          </div>
        </div>
      </div>

      <!-- Lightbox Modal -->
      <div class="detail-lightbox" id="detailLightbox" aria-hidden="true" role="dialog">
        <button class="detail-lightbox__close" id="lightboxCloseBtn" aria-label="Close Lightbox">&times;</button>
        <img src="" alt="" class="detail-lightbox__img" id="lightboxImg" />
      </div>
    `;
  }

  renderStories() {
    const container = document.getElementById('destStoriesContainer');
    if (!container) return;
    const stories = this.destination.stories || [];

    if (stories.length === 0) {
      container.style.display = 'none';
      return;
    }

    const storyCards = stories.map(story => `
      <article class="detail-story-card">
        <span class="detail-story-card__tag">${story.tag} • ${story.readTime}</span>
        <h3 class="detail-story-card__title">${story.title}</h3>
        <p class="detail-story-card__subtitle">${story.subtitle}</p>
        ${story.quote ? `<blockquote class="detail-story-card__quote">“${story.quote}”</blockquote>` : ''}
        <div class="detail-story-card__body">
          ${story.content.map(p => `<p class="detail-story-card__paragraph">${p}</p>`).join('')}
        </div>
      </article>
    `).join('');

    container.innerHTML = `
      <div class="container">
        <div class="detail-section-header">
          <span class="detail-section-kicker">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Editorial Chronicles
          </span>
          <h2 class="detail-section-title">Stories of this Location</h2>
        </div>
        <div class="detail-stories-grid">
          ${storyCards}
        </div>
      </div>
    `;
  }

  async renderCreators() {
    const container = document.getElementById('destCreatorsContainer');
    if (!container) return;

    // Try to fetch top creators dynamically from the database
    let creators = [];
    try {
      const apiCreators = await CreatorService.getTopCreators(3);
      if (apiCreators && apiCreators.length > 0) {
        // Map API response to the card format used by the template
        creators = apiCreators.map(c => ({
          id: c.creatorName || c._id,
          name: c.fullName || c.creatorName,
          handle: `@${c.creatorName}`,
          hometown: c.coveringCity || 'Sonbhadra',
          avatar: c.avatar || '../../public/assets/images/creators/amit-rk-vlogs.webp',
          isVerified: true,
          primaryFocus: c.bio ? c.bio.substring(0, 60) + (c.bio.length > 60 ? '…' : '') : 'Local Tourism & Culture',
          bio: c.bio || `Documenting the beauty and heritage of Sonbhadra through authentic local storytelling.`,
          profileUrl: `../index.html#creators`,
          social: {
            instagram: (c.socialLinks && c.socialLinks.length > 0) ? c.socialLinks[0] : '',
            youtube: (c.socialLinks && c.socialLinks.length > 1) ? c.socialLinks[1] : ''
          },
          totalStories: c.totalStories || 0,
          totalMedia: c.totalMedia || 0,
          totalViews: c.totalViews || 0,
          totalLikes: c.totalLikes || 0,
          recentPosts: []
        }));
      }
    } catch (err) {
      console.warn('Could not fetch top creators from API, using static data:', err);
    }

    // Fallback to static destination data if API returned nothing
    if (creators.length === 0) {
      creators = this.destination.creators || [];
    }

    if (creators.length === 0) {
      container.style.display = 'none';
      return;
    }

    const creatorCards = creators.map(c => {
      // Format stats for API-sourced creators
      const hasStats = typeof c.totalStories === 'number';
      const statsHtml = hasStats ? `
        <div class="detail-creator-stats">
          <div class="detail-creator-stat">
            <span class="detail-creator-stat__val">${c.totalStories + (c.totalMedia || 0)}</span>
            <span class="detail-creator-stat__label">Posts</span>
          </div>
          <div class="detail-creator-stat">
            <span class="detail-creator-stat__val">${this.formatNumber(c.totalViews)}</span>
            <span class="detail-creator-stat__label">Views</span>
          </div>
          <div class="detail-creator-stat">
            <span class="detail-creator-stat__val">${this.formatNumber(c.totalLikes)}</span>
            <span class="detail-creator-stat__label">Likes</span>
          </div>
        </div>
      ` : '';

      return `
      <div class="detail-creator-card">
        <div class="detail-creator-profile">
          <div class="detail-creator-avatar-wrap">
            <img src="${this.resolveImgUrl(c.avatar)}" alt="${c.name}" class="detail-creator-avatar" />
          </div>
          <h3 class="detail-creator-name">${c.name}</h3>
          <span class="detail-creator-handle">${c.handle}</span>
          <span class="detail-creator-hometown">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            </svg>
            ${c.hometown}
          </span>
          <span class="detail-badge-creator">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Verified Local Creator
          </span>
          ${statsHtml}
        </div>

        <div class="detail-creator-content">
          <div class="detail-creator-focus">
            <span class="detail-creator-focus-label">Primary Media Focus:</span>
            <span class="detail-creator-focus-val">${c.primaryFocus}</span>
          </div>

          <p class="detail-creator-bio">${c.bio}</p>

          ${(c.recentPosts && c.recentPosts.length > 0) ? `
            <div>
              <div class="detail-creator-posts-header">Recent Posts From This Destination</div>
              <div class="detail-creator-posts-grid">
                ${c.recentPosts.map(p => `
                  <a href="${c.social.instagram}" target="_blank" rel="noopener" class="detail-creator-post-card">
                    <img src="${this.resolveImgUrl(p.thumbnail)}" alt="${p.title}" class="detail-creator-post-thumb" />
                    <div>
                      <div class="detail-creator-post-title">${p.title}</div>
                      <div class="detail-creator-post-views">${p.type} • ${p.views}</div>
                    </div>
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="detail-creator-actions">
            <a href="${c.profileUrl}" class="btn btn--primary" style="padding: 8px 18px; font-size: 0.85rem;">
              View Creator Profile
            </a>
            ${c.social.instagram ? `
              <a href="${c.social.instagram}" target="_blank" rel="noopener" class="btn btn--secondary" style="padding: 8px 16px; font-size: 0.85rem;">
                Follow on Instagram
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    }).join('');

    container.innerHTML = `
      <div class="container">
        <div class="detail-section-header">
          <span class="detail-section-kicker">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Grassroots Storytellers
          </span>
          <h2 class="detail-section-title">Documented by Local Creators</h2>
        </div>
        ${creatorCards}
      </div>
    `;
  }

  /** Format a number with K/M suffix */
  formatNumber(num) {
    if (!num || num === 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  renderTouristGuideDashboard() {
    const container = document.getElementById('destTouristGuideContainer');
    if (!container) return;
    const d = this.destination;
    const qf = d.quickFacts || {};

    const guideProfiles = {
      'lakhaniya-dari': {
        name: 'Rahul Baiga',
        exp: '11+ Years Forest Trek Guide',
        rating: '★ 4.9 (128 reviews)',
        avatar: '../../public/assets/images/creators/amit-rk-vlogs.webp',
        quote: 'Every stone in the gorge has a story, and every pool requires reverence.'
      },
      'rihand-dam': {
        name: 'Devendra Kashyap',
        exp: '14+ Years Reservoir Boat Captain',
        rating: '★ 4.9 (98 reviews)',
        avatar: '../../public/assets/images/creators/sonbhadra-drone-tales.webp',
        quote: 'Navigating 450 square kilometers of inland waters since early childhood.'
      },
      'vijaygarh-fort': {
        name: 'Dhananjay Kol',
        exp: '9+ Years Ancient Fort & Rock Art Guide',
        rating: '★ 4.8 (87 reviews)',
        avatar: '../../public/assets/images/creators/vindhya-heritage.webp',
        quote: 'Leading travelers through the Chandrakanta legends and hidden ridge reservoirs.'
      },
      'agori-fort': {
        name: 'Mangal Sahni',
        exp: '16+ Years River Confluence Boatman',
        rating: '★ 5.0 (142 reviews)',
        avatar: '../../public/assets/images/creators/sonbhadra-drone-tales.webp',
        quote: 'Crossing the sacred Son and Renu waters safely through all seasons.'
      },
      'mukha-falls': {
        name: 'Virendra Yadav',
        exp: '10+ Years Belan Canyon Specialist',
        rating: '★ 4.9 (76 reviews)',
        avatar: '../../public/assets/images/creators/amit-rk-vlogs.webp',
        quote: 'Unveiling the prehistoric canyon and Mesolithic rock art to conscious travelers.'
      }
    };

    const guide = guideProfiles[this.slug] || {
      name: 'Rameshwar Gond',
      exp: '12+ Years Vindhyan Field Guide',
      rating: '★ 4.9 (110 reviews)',
      avatar: '../../public/assets/images/creators/vindhya-heritage.webp',
      quote: 'Dedicated to preserving our indigenous forest pathways.'
    };

    const prices = {
      'lakhaniya-dari': 1499,
      'rihand-dam': 1699,
      'vijaygarh-fort': 1299,
      'agori-fort': 1399,
      'mukha-falls': 1499
    };
    const basePrice = prices[this.slug] || 1499;

    container.innerHTML = `
      <div class="container">
        <div class="detail-section-header">
          <span class="detail-section-kicker">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
            </svg>
            Verified Field Guidance
          </span>
          <h2 class="detail-section-title">Guide for Tourists Dashboard</h2>
          <p style="color: var(--color-text-light-secondary); font-size: 1.05rem; margin-top: 8px; max-width: 720px;">
            Connect with certified resident guides and verified local creators. Safe, authentic, and compliant with regional eco-tourism policies.
          </p>
        </div>

        <div class="tourist-guide-grid">
          <!-- Card 1: Certified Local Guide Profile -->
          <div class="tourist-guide-card">
            <div class="guide-profile-head">
              <img src="${this.resolveImgUrl(guide.avatar)}" alt="${guide.name}" class="guide-avatar" />
              <div>
                <h3 class="guide-name">${guide.name}</h3>
                <span class="guide-title">Resident Certified Guide</span>
                <div class="guide-rating">${guide.rating} • Verified</div>
              </div>
            </div>
            <div style="font-size: 0.9rem; line-height: 1.6; color: var(--color-text-light-secondary); margin-bottom: 16px;">
              <p><strong>Experience:</strong> ${guide.exp}</p>
              <p><strong>Languages:</strong> Hindi, Bhojpuri, English, Local Dialects</p>
              <p style="margin-top: 8px; font-style: italic; color: var(--color-text-light); background: rgba(244,162,97,0.06); padding: 8px 12px; border-radius: 8px; border-left: 2px solid var(--color-sunset);">
                “${guide.quote}”
              </p>
            </div>
            <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--color-dark-border);">
              <span class="detail-badge detail-badge--verified">Forest Dept Verified Guide</span>
            </div>
          </div>

          <!-- Card 2: Expedition Inclusions & Highlights -->
          <div class="tourist-guide-card">
            <h3 style="font-family: var(--font-display); font-size: 1.2rem; color: #fff; margin-bottom: 10px;">
              Expedition Highlights
            </h3>
            <ul class="inclusions-list">
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Full Day Guided Expedition with Ranger</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Forest Department Entry Clearances Included</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Trekking Poles, Ropes & First Aid Support</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Authentic Local Snacks & Mineral Hydration</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Small Groups (Max 8 travelers for safety)</span>
              </li>
            </ul>
            <div style="margin-top: auto; font-family: var(--font-meta); font-size: 0.8rem; color: var(--color-sunset);">
              ${qf.bestSeason ? qf.bestSeason.split('(')[0] : 'Best: October to March'}
            </div>
          </div>

          <!-- Card 3: Prominent Book Your Journey Box (Opens Book Now in a new window) -->
          <div class="tourist-guide-card tourist-guide-card--featured">
            <span class="tourist-guide-badge">Instant Staging</span>
            <div class="booking-action-box">
              <div>
                <h3 style="font-family: var(--font-display); font-size: 1.35rem; color: #fff; margin-bottom: 6px;">
                  Book Your Journey
                </h3>
                <p style="font-size: 0.88rem; color: var(--color-text-light-secondary); line-height: 1.5;">
                  Reserve your guided journey to ${d.shortName || d.name}. Instant confirmation and free rescheduling up to 48 hours prior.
                </p>

                <div class="booking-price-row">
                  <div>
                    <span style="font-family: var(--font-meta); font-size: 0.72rem; text-transform: uppercase; color: var(--color-text-light-muted); display: block;">Starting Rate</span>
                    <span class="booking-price-val">₹${basePrice.toLocaleString('en-IN')}</span>
                  </div>
                  <span class="booking-price-unit">Per person • All permits incl.</span>
                </div>

                <div style="background: rgba(0,0,0,0.28); border-radius: 10px; padding: 10px 12px; font-size: 0.82rem; color: var(--color-text-light-secondary); margin-bottom: 8px;">
                  ✨ Travel with Creator Addon available on checkout (+₹750 for 4K Drone Reels).
                </div>
              </div>

              <!-- Opens Book Now page in a new window/tab -->
              <a href="./book.html?dest=${this.slug}" target="_blank" rel="noopener" class="btn--book-now" id="bookNowBtn">
                <span>Book Now</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderLogistics() {
    const container = document.getElementById('destLogisticsContainer');
    if (!container) return;
    const qf = this.destination.quickFacts || {};

    container.innerHTML = `
      <div class="container">
        <div class="detail-section-header">
          <span class="detail-section-kicker">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
              <path d="M2 12h20"/>
            </svg>
            Essential Field Guide
          </span>
          <h2 class="detail-section-title">Quick Facts &amp; Logistics</h2>
        </div>

        <div class="detail-logistics-grid">
          <!-- Card 1: Visit Windows -->
          <div class="detail-logistics-card">
            <div class="detail-logistics-card__header">
              <div class="detail-logistics-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <h3 class="detail-logistics-card__title">Hours &amp; Seasonality</h3>
            </div>
            <div class="detail-logistics-card__body">
              <div class="detail-logistics-item">
                <span class="detail-logistics-item__label">Best Time To Visit</span>
                <span class="detail-logistics-item__val">${qf.bestSeason}</span>
              </div>
              <div class="detail-logistics-item">
                <span class="detail-logistics-item__label">Operational Timings</span>
                <span class="detail-logistics-item__val">${qf.timings}</span>
              </div>
              <div class="detail-logistics-item">
                <span class="detail-logistics-item__label">Entry Fee &amp; Permits</span>
                <span class="detail-logistics-item__val">${qf.entryFee}</span>
              </div>
            </div>
          </div>

          <!-- Card 2: Transit & Nearest Hubs -->
          <div class="detail-logistics-card">
            <div class="detail-logistics-card__header">
              <div class="detail-logistics-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
              </div>
              <h3 class="detail-logistics-card__title">Transit Access</h3>
            </div>
            <div class="detail-logistics-card__body">
              <div class="detail-logistics-item">
                <span class="detail-logistics-item__label">Nearest Railway Station</span>
                <span class="detail-logistics-item__val">${qf.nearestRailway}</span>
              </div>
              <div class="detail-logistics-item">
                <span class="detail-logistics-item__label">Nearest Airport</span>
                <span class="detail-logistics-item__val">${qf.nearestAirport}</span>
              </div>
              <div class="detail-logistics-item">
                <span class="detail-logistics-item__label">Trek / Terrain Difficulty</span>
                <span class="detail-logistics-item__val">${qf.difficulty}</span>
              </div>
            </div>
          </div>

          <!-- Card 3: Road Directions -->
          <div class="detail-logistics-card" style="grid-column: 1 / -1;">
            <div class="detail-logistics-card__header">
              <div class="detail-logistics-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
              <h3 class="detail-logistics-card__title">How to Reach</h3>
            </div>
            <div class="detail-logistics-card__body">
              <p style="color: var(--color-text-light-secondary); line-height: 1.7;">${qf.howToReach}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderMap() {
    const container = document.getElementById('destMapContainer');
    if (!container) return;
    const m = this.destination.mapDetails || {};
    const coords = this.destination.coordinates || { lat: 24.5, lng: 83.0 };

    const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(m.mapQuery || this.destination.name)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

    container.innerHTML = `
      <div class="container">
        <div class="detail-section-header">
          <span class="detail-section-kicker">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
            Geographic Context
          </span>
          <h2 class="detail-section-title">Location &amp; Coordinates</h2>
        </div>

        <div class="detail-map-grid">
          <div class="detail-map-viewport">
            <iframe 
              src="${mapSrc}" 
              class="detail-map-iframe" 
              loading="lazy" 
              allowfullscreen 
              title="Google Map View of ${this.destination.name}">
            </iframe>
          </div>

          <div class="detail-map-sidebar">
            <div class="detail-map-card">
              <h3 class="detail-map-card__title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><path d="M16.2 7.8l-2 6.3-6.4 2.1 2-6.3z"/>
                </svg>
                GPS Coordinates
              </h3>
              <div class="detail-coords-box">
                <span id="coordsDisplay">${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E</span>
                <button class="detail-copy-btn" id="copyCoordsBtn">Copy</button>
              </div>
            </div>

            <div class="detail-map-card">
              <h3 class="detail-map-card__title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Nearby Landmarks
              </h3>
              <ul class="detail-landmarks-list">
                ${(m.landmarks || []).map(lm => `<li>${lm}</li>`).join('')}
              </ul>
            </div>

            <div class="detail-map-card">
              <h3 class="detail-map-card__title" style="color: #ff9e80;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Terrain &amp; Safety Note
              </h3>
              <p style="font-size: 0.88rem; line-height: 1.6; color: var(--color-text-light-secondary);">
                ${m.safetyNotes || 'Follow local ranger instructions.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderGuidelines() {
    const container = document.getElementById('destGuidelinesContainer');
    if (!container) return;
    const g = this.destination.communityGuidelines || {};

    container.innerHTML = `
      <div class="container">
        <div class="detail-section-header">
          <span class="detail-section-kicker">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Conscious Travel
          </span>
          <h2 class="detail-section-title">Community Tips &amp; Guidelines</h2>
        </div>

        <div class="detail-guidelines-grid">
          <!-- Card 1: Etiquette -->
          <div class="detail-guideline-card">
            <div class="detail-guideline-card__header">
              <div class="detail-guideline-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3 class="detail-guideline-card__title">Local Etiquette</h3>
            </div>
            <ul class="detail-guideline-list">
              ${(g.etiquette || []).map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>

          <!-- Card 2: Eco-Rules -->
          <div class="detail-guideline-card detail-guideline-card--eco">
            <div class="detail-guideline-card__header">
              <div class="detail-guideline-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                </svg>
              </div>
              <h3 class="detail-guideline-card__title">Leave No Trace</h3>
            </div>
            <ul class="detail-guideline-list">
              ${(g.ecoRules || []).map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>

          <!-- Card 3: Safety Warnings -->
          <div class="detail-guideline-card detail-guideline-card--safety">
            <div class="detail-guideline-card__header">
              <div class="detail-guideline-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3 class="detail-guideline-card__title">Safety Warnings</h3>
            </div>
            <ul class="detail-guideline-list">
              ${(g.safetyWarnings || []).map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  async renderRelated() {
    const container = document.getElementById('destRelatedContainer');
    if (!container) return;
    const related = await DestinationDetailService.getRelated(this.destination.relatedSlugs);

    // Map destination slug to HTML file name
    const getPageUrl = (slug) => {
      const map = {
        'rihand-dam': './rihand.html',
        'lakhaniya-dari': './lakhaniya-dari.html',
        'vijaygarh-fort': './vijaygarh-fort.html',
        'agori-fort': './agori-fort.html',
        'mukha-falls': './mukha-falls.html'
      };
      return map[slug] || `./index.html?dest=${slug}`;
    };

    const cards = related.map(d => `
      <a href="${getPageUrl(d.slug || d.id)}" class="detail-related-card">
        <img src="${this.resolveImgUrl(d.image)}" alt="${d.name}" class="detail-related-card__thumb" loading="lazy" />
        <div class="detail-related-card__body">
          <span class="detail-related-card__tag">${d.category}</span>
          <h3 class="detail-related-card__name">${d.name}</h3>
          <span class="detail-related-card__loc">${d.location}</span>
        </div>
      </a>
    `).join('');

    container.innerHTML = `
      <div class="container">
        <div class="detail-section-header">
          <span class="detail-section-kicker">Sonbhadra Circuit</span>
          <h2 class="detail-section-title">Related Destinations</h2>
        </div>
        <div class="detail-related-grid">
          ${cards}
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Gallery horizontal buttons
    const track = document.getElementById('galleryTrack');
    const prevBtn = document.getElementById('galleryPrevBtn');
    const nextBtn = document.getElementById('galleryNextBtn');

    if (track && prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -360, behavior: 'smooth' });
      });
      nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: 360, behavior: 'smooth' });
      });
    }

    // Lightbox click
    const lightbox = document.getElementById('detailLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeBtn = document.getElementById('lightboxCloseBtn');

    if (lightbox && lightboxImg) {
      document.querySelectorAll('.detail-gallery-card').forEach(card => {
        card.addEventListener('click', () => {
          const fullUrl = card.dataset.full;
          if (fullUrl) {
            lightboxImg.src = fullUrl;
            lightbox.classList.add('is-open');
            lightbox.setAttribute('aria-hidden', 'false');
          }
        });
      });

      const closeLightbox = () => {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
      };

      if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
          closeLightbox();
        }
      });
    }

    // Hero 5-6 Images Thumbnail Selector & Stage Visual Swapper
    const stageImg = document.getElementById('heroStageImg');
    const stageCaption = document.getElementById('heroStageCaption');
    const stageCounter = document.getElementById('heroStageCounter');
    const thumbCards = document.querySelectorAll('.detail-gallery-thumb-card');
    const galleryCount = (this.destination.gallery || []).length;

    thumbCards.forEach((thumb, idx) => {
      thumb.addEventListener('click', () => {
        const fullUrl = thumb.dataset.full;
        const caption = thumb.dataset.caption;
        const fallback = thumb.dataset.fallback;
        if (stageImg && fullUrl) {
          stageImg.style.opacity = '0.3';
          setTimeout(() => {
            stageImg.src = fullUrl;
            if (fallback) {
              stageImg.dataset.fallback = fallback;
            } else {
              delete stageImg.dataset.fallback;
            }
            stageImg.style.opacity = '1';
          }, 150);
        }
        if (stageCaption && caption) stageCaption.textContent = caption;
        if (stageCounter) stageCounter.textContent = `${idx + 1} / ${galleryCount} Photos`;

        thumbCards.forEach(t => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
      });
    });

    // Clicking hero main stage opens lightbox
    const heroStage = document.getElementById('heroStage');
    if (heroStage && lightbox && lightboxImg) {
      heroStage.addEventListener('click', () => {
        if (stageImg) {
          lightboxImg.src = stageImg.src;
          lightbox.classList.add('is-open');
          lightbox.setAttribute('aria-hidden', 'false');
        }
      });
    }

    // Copy GPS Coordinates button
    const copyBtn = document.getElementById('copyCoordsBtn');
    const coordsDisplay = document.getElementById('coordsDisplay');
    if (copyBtn && coordsDisplay) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(coordsDisplay.textContent.trim()).then(() => {
          const original = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          copyBtn.style.background = 'var(--color-sunset)';
          copyBtn.style.color = '#000';
          setTimeout(() => {
            copyBtn.textContent = original;
            copyBtn.style.background = '';
            copyBtn.style.color = '';
          }, 2000);
        });
      });
    }

    // Wishlist Toggle Button
    initDetailWishlistButton(this.slug, this.destination.name);
  }

  initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    if (navToggle && mobileMenu) {
      navToggle.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('is-open');
        navToggle.classList.toggle('is-active', isOpen);
        navToggle.setAttribute('aria-expanded', String(isOpen));
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      });
    }
  }

  renderErrorState() {
    const hero = document.getElementById('destHeroContainer');
    if (hero) {
      hero.innerHTML = `
        <div class="container" style="padding: 100px 0; text-align: center;">
          <h1 style="font-family: var(--font-display); font-size: 2.5rem; color: #fff; margin-bottom: 16px;">
            Destination Not Found
          </h1>
          <p style="color: var(--color-text-light-secondary); margin-bottom: 24px;">
            The requested destination could not be located in our verified archives.
          </p>
          <a href="./index.html" class="btn btn--primary">Return to Destinations</a>
        </div>
      `;
    }
  }
}

// Auto-boot on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const controller = new DestinationPageController();
  controller.init();
});
