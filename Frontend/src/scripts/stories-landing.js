/**
 * Stories Landing Page Controller
 * Sonbhadra Tourism — Editorial Stories System
 *
 * Responsibilities:
 *  - Resolves initial URL params (category, destination)
 *  - Fetches stories from StoryService
 *  - Renders featured story and story grid
 *  - Manages category filter state (client-side on cached data)
 *  - Handles load-more pagination
 *  - Manages loading / empty / error states
 *  - Initialises navigation and scroll reveal animations
 *
 * Architecture note (Next.js migration):
 *  The fetch logic lives in StoryService. When migrating, replace
 *  the DOMContentLoaded bootstrap with getStaticProps/getServerSideProps
 *  and convert renderStoryCard() into a React component.
 */

import { StoryService }      from '../services/story.service.js';
import { initNavigation }    from './modules/navigation.js';
import { initScrollReveals } from './animations/reveal.js';

/* --------------------------------------------------------------------------
   Constants & Destination image fallback map
   -------------------------------------------------------------------------- */

const DEST_IMAGE_MAP = {
    'rihand-dam':      '../../public/assets/images/destinations/rihand-dam.webp',
    'lakhaniya-dari':  '../../public/assets/images/destinations/lakhaniya-dari.webp',
    'vijaygarh-fort':  '../../public/assets/images/destinations/vijaygarh-fort.webp',
    'agori-fort':      '../../public/assets/images/destinations/agori-fort.webp',
    'mukha-falls':     '../../public/assets/images/destinations/mukha-falls.webp',
    'salkhan-fossils': '../../public/assets/images/destinations/salkhan-fossils.webp',
    'sonbhadra':       '../../public/assets/images/destinations/sonbhadra-forests.webp',
};

const FALLBACK_IMAGE = '../../public/assets/images/destinations/lakhaniya-dari.webp';
const PAGE_SIZE      = 9;

/* --------------------------------------------------------------------------
   Icon SVGs (inline for performance — avoids extra network round trips)
   -------------------------------------------------------------------------- */

const ICON_CLOCK = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const ICON_TAG   = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
const ICON_ARROW = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

function resolveImageSrc(story) {
    if (story.heroImage?.url) return story.heroImage.url;
    return DEST_IMAGE_MAP[story.destinationSlug] || FALLBACK_IMAGE;
}

function resolveImageAlt(story) {
    if (story.heroImage?.alt) return story.heroImage.alt;
    return story.title;
}

function storyDetailUrl(story) {
    const slug = story.slug || story.storyId || story._id;
    return `./story-detail.html?slug=${encodeURIComponent(slug)}`;
}

function formatCategory(cat) {
    if (!cat) return '';
    return cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/* --------------------------------------------------------------------------
   Render: single story card (standard)
   -------------------------------------------------------------------------- */

function renderStoryCard(story, index) {
    const imgSrc  = resolveImageSrc(story);
    const imgAlt  = resolveImageAlt(story);
    const href    = storyDetailUrl(story);
    const catLabel = formatCategory(story.category) || story.tag || '';
    const excerpt  = story.excerpt
        || (Array.isArray(story.content) && story.content[0]
            ? story.content[0].replace(/<[^>]+>/g, '').substring(0, 160) + '…'
            : '');

    const verifiedDot = story.verificationStatus === 'verified'
        ? `<span class="story-card__verified-dot" title="Verified information" aria-label="Verified"></span>`
        : '';

    const readTimeMeta = story.readTime
        ? `<span class="story-card__meta-item">${ICON_CLOCK}${story.readTime}</span>`
        : '';

    const tagMeta = catLabel
        ? `<span class="story-card__meta-item">${ICON_TAG}${catLabel}</span>`
        : '';

    return `
<article class="story-card reveal" aria-label="${story.title}">
  <a href="${href}" class="story-card__media" aria-hidden="true" tabindex="-1">
    <img
      src="${imgSrc}"
      alt="${imgAlt}"
      width="640"
      height="360"
      loading="${index < 3 ? 'eager' : 'lazy'}"
    />
    ${catLabel ? `<span class="story-card__category-badge badge badge--glass">${catLabel}</span>` : ''}
  </a>

  <div class="story-card__body">
    ${story.tag && story.tag !== catLabel ? `<div class="story-card__tag">${story.tag}</div>` : ''}
    <h3 class="story-card__title">
      <a href="${href}" style="color: inherit; text-decoration: none;">${story.title}</a>
    </h3>
    ${excerpt ? `<p class="story-card__excerpt">${excerpt}</p>` : ''}

    <div class="story-card__footer">
      <div class="story-card__meta">
        ${readTimeMeta}
        ${tagMeta}
        ${verifiedDot}
      </div>
      <a href="${href}" class="story-card__read-link" aria-label="Read: ${story.title}">
        Read ${ICON_ARROW}
      </a>
    </div>
  </div>
</article>`.trim();
}

/* --------------------------------------------------------------------------
   Render: featured story card
   -------------------------------------------------------------------------- */

function renderFeaturedCard(story) {
    if (!story) return '';
    const imgSrc  = resolveImageSrc(story);
    const imgAlt  = resolveImageAlt(story);
    const href    = storyDetailUrl(story);
    const catLabel = formatCategory(story.category) || story.tag || '';
    const excerpt  = story.excerpt
        || (Array.isArray(story.content) && story.content[0]
            ? story.content[0].replace(/<[^>]+>/g, '').substring(0, 240) + '…'
            : '');

    const readTimeMeta = story.readTime
        ? `<span class="story-card__meta-item">${ICON_CLOCK}${story.readTime}</span>`
        : '';

    return `
<article class="story-card story-card--featured reveal" aria-label="Featured: ${story.title}">
  <a href="${href}" class="story-card__media" aria-hidden="true" tabindex="-1">
    <img
      src="${imgSrc}"
      alt="${imgAlt}"
      width="800"
      height="500"
      loading="eager"
      fetchpriority="high"
    />
  </a>

  <div class="story-card__body">
    ${catLabel ? `<div class="story-card__tag">${catLabel}</div>` : ''}
    <h3 class="story-card__title">
      <a href="${href}" style="color: inherit; text-decoration: none;">${story.title}</a>
    </h3>
    ${story.subtitle ? `<p style="font-size: var(--text-sm); font-style: italic; color: var(--color-text-light-muted); margin-bottom: var(--space-xs);">${story.subtitle}</p>` : ''}
    ${excerpt ? `<p class="story-card__excerpt">${excerpt}</p>` : ''}

    <div class="story-card__footer">
      <div class="story-card__meta">${readTimeMeta}</div>
      <a href="${href}" class="story-card__read-link btn btn--primary" style="font-size: var(--text-xs);" aria-label="Read featured story: ${story.title}">
        <span>Read Full Story</span>
        ${ICON_ARROW}
      </a>
    </div>
  </div>
</article>`.trim();
}

/* --------------------------------------------------------------------------
   Render: empty state
   -------------------------------------------------------------------------- */

function renderEmpty(category) {
    const catLabel = category ? `in <strong>${formatCategory(category)}</strong>` : '';
    return `
<div class="stories-state" style="grid-column: 1 / -1;" role="status">
  <svg class="stories-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
  <p class="stories-state__title">No stories found ${catLabel}</p>
  <p class="stories-state__desc">New stories are added regularly. Check back soon or explore a different category.</p>
</div>`.trim();
}

/* --------------------------------------------------------------------------
   Render: error state
   -------------------------------------------------------------------------- */

function renderError(message) {
    return `
<div class="stories-state" style="grid-column: 1 / -1;" role="alert">
  <svg class="stories-state__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
  <p class="stories-state__title">Unable to load stories</p>
  <p class="stories-state__desc">${message || 'Check your connection and try again.'}</p>
  <button class="btn btn--outline-dark" id="retryBtn" type="button">Try Again</button>
</div>`.trim();
}

/* --------------------------------------------------------------------------
   StoriesLandingController
   -------------------------------------------------------------------------- */

class StoriesLandingController {
    constructor() {
        // State
        this.allStories    = [];   // full fetched set (current filter)
        this.activeCategory = '';
        this.currentPage   = 1;
        this.hasMore       = false;
        this.isFetching    = false;

        // DOM refs
        this.grid         = document.getElementById('storiesGrid');
        this.featuredCard = document.getElementById('featuredStoryCard');
        this.filtersBar   = document.getElementById('storyFilters');
        this.loadMoreBtn  = document.getElementById('loadMoreBtn');
        this.loadMoreWrap = document.getElementById('loadMoreContainer');
        this.heroStat     = document.getElementById('heroStatStories');
    }

    /* ── Init ─────────────────────────────────────────────────────────── */

    async init() {
        // Read URL params for pre-selected category / destination
        const params   = new URLSearchParams(window.location.search);
        const initCat  = params.get('category') || '';
        const initDest = params.get('destination') || '';

        // Activate the correct filter pill if pre-selected
        if (initCat) {
            this._setActiveFilter(initCat);
            this.activeCategory = initCat;
        }

        await this._fetchAndRender({ category: initCat });

        this._bindFilters();
        this._bindLoadMore();
        initNavigation();
        initScrollReveals();
    }

    /* ── Fetch + Render ───────────────────────────────────────────────── */

    async _fetchAndRender({ category = '', page = 1 } = {}) {
        if (this.isFetching) return;
        this.isFetching = true;

        if (page === 1) {
            this._showLoading();
        }

        const result = await StoryService.getAllStories({
            category,
            limit: PAGE_SIZE,
            page,
        });

        this.isFetching = false;

        if (!result.ok) {
            this._renderError(result.error);
            return;
        }

        const { stories = [], total = 0, hasMore = false } = result.data || {};

        if (page === 1) {
            this.allStories = stories;
        } else {
            this.allStories = [...this.allStories, ...stories];
        }

        this.hasMore     = hasMore;
        this.currentPage = page;

        // Update hero stat counter
        if (this.heroStat && total > 0) {
            this.heroStat.textContent = String(total);
        }

        this._renderGrid(page > 1);
        this._updateLoadMore();
        initScrollReveals(); // re-init so newly injected cards animate
    }

    /* ── Grid rendering ───────────────────────────────────────────────── */

    _showLoading() {
        if (!this.grid) return;
        this.grid.innerHTML = [0, 1, 2].map(() => `
<div class="story-skeleton" aria-hidden="true">
  <div class="story-skeleton__media"></div>
  <div class="story-skeleton__body">
    <div class="story-skeleton__line story-skeleton__line--sm"></div>
    <div class="story-skeleton__line story-skeleton__line--xl"></div>
    <div class="story-skeleton__line story-skeleton__line--lg"></div>
    <div class="story-skeleton__line story-skeleton__line--md"></div>
  </div>
</div>`).join('');

        if (this.featuredCard) this.featuredCard.innerHTML = '';
    }

    _renderGrid(append = false) {
        if (!this.grid) return;

        if (this.allStories.length === 0) {
            this.grid.innerHTML = renderEmpty(this.activeCategory);
            if (this.featuredCard) this.featuredCard.innerHTML = '';
            return;
        }

        // First story on first page = featured card
        if (!append && this.currentPage === 1) {
            const featured = this.allStories[0];
            if (this.featuredCard) {
                this.featuredCard.innerHTML = renderFeaturedCard(featured);
            }
        }

        // The rest go into the grid (skip index 0 on first page — it's featured)
        const gridStories = (this.currentPage === 1 && !append)
            ? this.allStories.slice(1)
            : this.allStories;

        if (!append || this.currentPage === 1) {
            this.grid.innerHTML = gridStories.length === 0
                ? renderEmpty(this.activeCategory)
                : gridStories.map((s, i) => renderStoryCard(s, i)).join('');
        } else {
            // Append mode: only add the new batch (last PAGE_SIZE items)
            const newBatch = this.allStories.slice(-PAGE_SIZE);
            newBatch.forEach((s, i) => {
                const div = document.createElement('div');
                div.innerHTML = renderStoryCard(s, i);
                const card = div.firstChild;
                if (card) this.grid.appendChild(card);
            });
        }
    }

    _renderError(message) {
        if (this.grid) {
            this.grid.innerHTML = renderError(message);
            const retryBtn = document.getElementById('retryBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    this._fetchAndRender({ category: this.activeCategory });
                });
            }
        }
    }

    _updateLoadMore() {
        if (!this.loadMoreWrap || !this.loadMoreBtn) return;
        this.loadMoreWrap.hidden = !this.hasMore;
    }

    /* ── Filter interaction ───────────────────────────────────────────── */

    _setActiveFilter(category) {
        if (!this.filtersBar) return;
        const btns = this.filtersBar.querySelectorAll('.stories-filter-btn');
        btns.forEach(btn => {
            const isActive = btn.dataset.category === category;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-selected', String(isActive));
        });
    }

    _bindFilters() {
        if (!this.filtersBar) return;
        this.filtersBar.addEventListener('click', async (e) => {
            const btn = e.target.closest('.stories-filter-btn');
            if (!btn) return;

            const category = btn.dataset.category || '';
            if (category === this.activeCategory) return;

            this.activeCategory = category;
            this.currentPage    = 1;
            this._setActiveFilter(category);

            await this._fetchAndRender({ category });
        });
    }

    /* ── Load More ────────────────────────────────────────────────────── */

    _bindLoadMore() {
        if (!this.loadMoreBtn) return;
        this.loadMoreBtn.addEventListener('click', async () => {
            await this._fetchAndRender({
                category: this.activeCategory,
                page: this.currentPage + 1,
            });
        });
    }
}

/* --------------------------------------------------------------------------
   Bootstrap
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    const controller = new StoriesLandingController();
    controller.init().catch(err => {
        console.error('[StoriesLanding] Unexpected init error:', err);
    });

    console.info('📖 Sonbhadra Stories — Landing page initialized.');
});
