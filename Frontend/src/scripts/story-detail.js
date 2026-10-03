/**
 * Story Detail Page Controller
 * Sonbhadra Tourism — Editorial Stories System
 *
 * Responsibilities:
 *  - Resolves story slug from URL query param (?slug=...)
 *  - Fetches story from StoryService
 *  - Updates all <head> meta tags: title, description, canonical, OG, Twitter
 *  - Injects Article + BreadcrumbList JSON-LD structured data
 *  - Renders: breadcrumbs, header, hero image, body (excerpt, at-a-glance,
 *             content paragraphs, pull quote, verification status)
 *  - Renders: related destination card + sibling stories
 *  - Manages loading / 404 / error states
 *  - Initialises navigation and scroll reveal
 *
 * Architecture note (Next.js migration):
 *  slug resolution   → file-based routing [slug].tsx
 *  meta tag updates  → generateMetadata() export
 *  JSON-LD injection → <script> in page component
 *  render functions  → React components with identical prop signatures
 */

import { StoryService }      from '../services/story.service.js';
import { initNavigation }    from './modules/navigation.js';
import { initScrollReveals } from './animations/reveal.js';

/* --------------------------------------------------------------------------
   Destination image fallback
   -------------------------------------------------------------------------- */

const DEST_IMAGE_MAP = {
    'rihand-dam':      '../../public/assets/images/destinations/rihand-dam.webp',
    'lakhaniya-dari':  '../../public/assets/images/destinations/lakhaniya-dari.webp',
    'vijaygarh-fort':  '../../public/assets/images/destinations/vijaygarh-fort.webp',
    'agori-fort':      '../../public/assets/images/destinations/agori-fort.webp',
    'mukha-falls':     '../../public/assets/images/destinations/mukha-falls.webp',
    'salkhan-fossils': '../../public/assets/images/destinations/salkhan-fossils.webp',
};

const FALLBACK_IMAGE = '../../public/assets/images/destinations/lakhaniya-dari.webp';

const ICON_CLOCK  = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const ICON_VERIFY = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
const ICON_INFO   = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
const ICON_ARROW  = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

function resolveSlug() {
    const params = new URLSearchParams(window.location.search);
    const slug   = params.get('slug');
    if (slug) return slug.trim();
    // Fallback: try data-story-slug on body (future: server-rendered)
    return document.body.dataset.storySlug || null;
}

function resolveImageSrc(story) {
    if (story.heroImage?.url) return story.heroImage.url;
    return DEST_IMAGE_MAP[story.destinationSlug] || FALLBACK_IMAGE;
}

function formatCategory(cat) {
    if (!cat) return '';
    return cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric',
        });
    } catch {
        return '';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* Verification status display config */
const VERIFICATION_CONFIG = {
    'verified': {
        label: 'Verified Information',
        note:  'The facts in this story have been confirmed by a primary or government source.',
        icon:  ICON_VERIFY,
        cls:   'story-verification--verified',
    },
    'source-based': {
        label: 'Source-Based',
        note:  'This information is based on reputable published sources.',
        icon:  ICON_INFO,
        cls:   'story-verification--source-based',
    },
    'oral-account': {
        label: 'Oral Account',
        note:  'This story draws from local oral history and community accounts.',
        icon:  ICON_INFO,
        cls:   'story-verification--oral-account',
    },
    'tradition-legend': {
        label: 'Tradition / Legend',
        note:  'This content reflects local tradition or folklore and should not be taken as historical fact.',
        icon:  ICON_INFO,
        cls:   'story-verification--tradition-legend',
    },
    'editorial': {
        label: 'Editorial Perspective',
        note:  'This represents an editorial interpretation or commentary by the author.',
        icon:  ICON_INFO,
        cls:   'story-verification--editorial',
    },
    'unverified': {
        label: 'Not Yet Verified',
        note:  'The facts in this story have not yet been verified by the editorial team.',
        icon:  ICON_INFO,
        cls:   'story-verification--unverified',
    },
};

/* --------------------------------------------------------------------------
   StoryDetailController
   -------------------------------------------------------------------------- */

class StoryDetailController {
    constructor() {
        this.slug    = resolveSlug();
        this.story   = null;
        this.related = [];
    }

    /* ── Init ─────────────────────────────────────────────────────────── */

    async init() {
        initNavigation();

        if (!this.slug) {
            this._renderNotFound('No story slug provided in the URL.');
            return;
        }

        const result = await StoryService.getBySlug(this.slug);

        if (!result.ok) {
            if (result.error?.includes('not found') || result.error?.includes('404')) {
                this._renderNotFound();
            } else {
                this._renderError(result.error);
            }
            return;
        }

        this.story = result.data;
        document.body.dataset.storySlug = this.slug;

        this._updatePageMeta();
        this._injectStructuredData();
        this._renderBreadcrumb();
        this._renderHeader();
        this._renderHeroImage();
        this._renderBody();
        await this._renderRelated();
        this._showCta();
        this._hideLoading();

        initScrollReveals();

        console.info(`📖 Story "${this.story.title}" loaded.`);
    }

    /* ── Meta Tag Updates ─────────────────────────────────────────────── */

    _updatePageMeta() {
        const s     = this.story;
        const title = s.seo?.metaTitle || `${s.title} — SonbhadraConnect`;
        const desc  = s.seo?.metaDescription || s.excerpt || `${s.title} — SonbhadraConnect editorial story.`;
        const image = s.seo?.ogImage || s.heroImage?.url || resolveImageSrc(s);
        const slug  = s.slug || s.storyId;
        const canon = `https://sonbhadraconnect.com/stories/${slug}`;

        // Title
        document.title = title;

        // Meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.content = desc;

        // Canonical
        const canonical = document.getElementById('canonicalTag');
        if (canonical) canonical.href = canon;

        // OG
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.content = val; };
        set('ogTitle', title);
        set('ogDesc',  desc);
        set('ogImage', image);
        set('ogUrl',   canon);

        // Twitter
        set('twTitle', title);
        set('twDesc',  desc);
        set('twImage', image);
    }

    /* ── JSON-LD Structured Data ──────────────────────────────────────── */

    _injectStructuredData() {
        const s     = this.story;
        const slug  = s.slug || s.storyId;
        const image = s.heroImage?.url || resolveImageSrc(s);
        const destName = s.destination?.name || s.destinationSlug || 'Sonbhadra';

        const jsonLd = {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "Article",
                    "@id": `https://sonbhadraconnect.com/stories/${slug}#article`,
                    "headline": s.title,
                    "description": s.excerpt || s.subtitle || '',
                    "image": image,
                    "url": `https://sonbhadraconnect.com/stories/${slug}`,
                    "datePublished": s.createdAt || '',
                    "dateModified":  s.updatedAt  || s.createdAt || '',
                    "inLanguage": "en-IN",
                    "about": {
                        "@type": "Place",
                        "name": destName,
                        "addressRegion": "Uttar Pradesh",
                        "addressCountry": "IN",
                    },
                    "publisher": {
                        "@id": "https://sonbhadraconnect.com/#organization"
                    },
                    "isPartOf": {
                        "@id": "https://sonbhadraconnect.com/stories/#collectionpage"
                    },
                },
                {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Home",    "item": "https://sonbhadraconnect.com/" },
                        { "@type": "ListItem", "position": 2, "name": "Stories", "item": "https://sonbhadraconnect.com/stories/" },
                        { "@type": "ListItem", "position": 3, "name": s.title,   "item": `https://sonbhadraconnect.com/stories/${slug}` },
                    ]
                }
            ]
        };

        const el = document.getElementById('storyJsonLd');
        if (el) el.textContent = JSON.stringify(jsonLd, null, 2);
    }

    /* ── Breadcrumbs ──────────────────────────────────────────────────── */

    _renderBreadcrumb() {
        const nav = document.getElementById('storyBreadcrumb');
        if (!nav) return;

        const destName = this.story.destination?.name || this.story.destinationSlug || '';
        const destSlug = this.story.destination?.slug || this.story.destinationSlug || '';

        const destCrumb = destName
            ? `<li class="story-breadcrumb__item">
                 <span class="story-breadcrumb__sep" aria-hidden="true">›</span>
                 <a href="../destinations/${destSlug}.html">${destName}</a>
               </li>`
            : '';

        nav.innerHTML = `
<div class="container">
  <ol class="story-breadcrumb__list" vocab="https://schema.org/" typeof="BreadcrumbList">
    <li class="story-breadcrumb__item" property="itemListElement" typeof="ListItem">
      <a href="../index.html" property="item" typeof="WebPage">
        <span property="name">Home</span>
      </a>
      <meta property="position" content="1" />
    </li>
    <li class="story-breadcrumb__item">
      <span class="story-breadcrumb__sep" aria-hidden="true">›</span>
      <a href="./index.html">Stories</a>
    </li>
    ${destCrumb}
    <li class="story-breadcrumb__item story-breadcrumb__item--current" aria-current="page">
      <span class="story-breadcrumb__sep" aria-hidden="true">›</span>
      <span>${escapeHtml(this.story.title)}</span>
    </li>
  </ol>
</div>`.trim();

        nav.hidden = false;
    }

    /* ── Story Header ─────────────────────────────────────────────────── */

    _renderHeader() {
        const header = document.getElementById('storyHeader');
        if (!header) return;

        const s        = this.story;
        const catLabel = formatCategory(s.category) || s.tag || '';
        const dateStr  = formatDate(s.createdAt);
        const readTime = s.readTime || '';

        const updatedStr = s.updatedAt && s.updatedAt !== s.createdAt
            ? `<span class="story-detail-header__meta-item">Updated ${formatDate(s.updatedAt)}</span>`
            : '';

        header.innerHTML = `
<div class="container">
  <div class="story-detail-header__category">
    ${catLabel ? `<span class="badge badge--glass">${catLabel}</span>` : ''}
    ${s.tag && s.tag !== catLabel ? `<span class="badge badge--sunset">${escapeHtml(s.tag)}</span>` : ''}
  </div>

  <h1 class="story-detail-header__h1">${escapeHtml(s.title)}</h1>

  ${s.subtitle ? `<p class="story-detail-header__subtitle">${escapeHtml(s.subtitle)}</p>` : ''}

  <div class="story-detail-header__meta">
    ${dateStr  ? `<span class="story-detail-header__meta-item">${dateStr}</span>` : ''}
    ${readTime ? `<span class="story-detail-header__meta-item">${ICON_CLOCK} ${escapeHtml(readTime)}</span>` : ''}
    ${updatedStr}
  </div>
</div>`.trim();

        header.hidden = false;
    }

    /* ── Hero Image ───────────────────────────────────────────────────── */

    _renderHeroImage() {
        const figure = document.getElementById('storyHeroImage');
        if (!figure) return;

        const s       = this.story;
        const imgSrc  = resolveImageSrc(s);
        const imgAlt  = s.heroImage?.alt || s.title;
        const caption = s.heroImage?.caption || '';
        const credit  = s.heroImage?.credit  || '';

        const captionText = [caption, credit ? `Photo: ${credit}` : ''].filter(Boolean).join(' · ');

        figure.innerHTML = `
<img
  src="${imgSrc}"
  alt="${escapeHtml(imgAlt)}"
  width="1280"
  height="720"
  loading="eager"
  fetchpriority="high"
/>
${captionText ? `<figcaption class="story-hero-image__caption">${escapeHtml(captionText)}</figcaption>` : ''}`.trim();

        figure.hidden = false;
    }

    /* ── Story Body ───────────────────────────────────────────────────── */

    _renderBody() {
        const article = document.getElementById('storyBody');
        if (!article) return;

        const s     = this.story;
        const inner = document.createElement('div');
        inner.className = 'story-body__inner container--narrow';

        // 1. Excerpt
        if (s.excerpt) {
            const p = document.createElement('p');
            p.className = 'story-excerpt';
            p.textContent = s.excerpt;
            inner.appendChild(p);
        }

        // 2. At a Glance (GEO/AI optimized structured facts)
        const atGlance = this._buildAtAGlance(s);
        if (atGlance) inner.innerHTML += atGlance;

        // 3. Content paragraphs (HTML allowed for inline [VERIFY] etc.)
        if (Array.isArray(s.content) && s.content.length > 0) {
            s.content.forEach((para, i) => {
                // Inject pull-quote after 3rd paragraph if story has one
                if (i === 3 && s.quote) {
                    inner.innerHTML += this._buildPullQuote(s.quote);
                }
                const p = document.createElement('p');
                p.className = 'story-paragraph';
                p.innerHTML = para; // HTML allowed — inline [VERIFY] badges
                inner.appendChild(p);
            });

            // If story has fewer than 3 paragraphs, show quote at end
            if (s.quote && s.content.length < 4) {
                inner.innerHTML += this._buildPullQuote(s.quote);
            }
        }

        // 4. Verification status (only shown when meaningful)
        const verStatus = s.verificationStatus || (s.isVerified ? 'verified' : null);
        if (verStatus && verStatus !== 'unverified') {
            inner.innerHTML += this._buildVerification(verStatus);
        }

        article.appendChild(inner);
        article.hidden = false;
    }

    _buildAtAGlance(s) {
        const rows = [];

        const destName = s.destination?.name || s.destinationSlug;
        if (destName) rows.push(['Location', `${destName}, Sonbhadra District, Uttar Pradesh, India`]);

        const catLabel = formatCategory(s.category) || s.tag;
        if (catLabel) rows.push(['Category', catLabel]);

        if (s.readTime) rows.push(['Reading Time', s.readTime]);

        const verLabel = VERIFICATION_CONFIG[s.verificationStatus]?.label;
        if (verLabel && s.verificationStatus && s.verificationStatus !== 'unverified') {
            rows.push(['Editorial Status', verLabel]);
        }

        const lastVer = formatDate(s.lastVerifiedAt);
        if (lastVer) rows.push(['Last Verified', lastVer]);

        if (rows.length === 0) return '';

        const rowsHtml = rows.map(([dt, dd]) =>
            `<dt class="story-at-a-glance__dt">${escapeHtml(dt)}</dt>
             <dd class="story-at-a-glance__dd">${escapeHtml(dd)}</dd>`
        ).join('\n');

        return `
<aside class="story-at-a-glance" aria-label="At a Glance">
  <div class="story-at-a-glance__title">At a Glance</div>
  <dl class="story-at-a-glance__dl">
    ${rowsHtml}
  </dl>
</aside>`.trim();
    }

    _buildPullQuote(quote) {
        return `
<blockquote class="story-pull-quote">
  <p class="story-pull-quote__text">${escapeHtml(quote)}</p>
</blockquote>`.trim();
    }

    _buildVerification(status) {
        const cfg = VERIFICATION_CONFIG[status] || VERIFICATION_CONFIG['editorial'];
        return `
<div class="story-verification ${cfg.cls}" role="note" aria-label="Editorial status: ${cfg.label}">
  <span class="story-verification__icon" aria-hidden="true">${cfg.icon}</span>
  <div>
    <span class="story-verification__label">${cfg.label}</span>
    <span>${cfg.note}</span>
  </div>
</div>`.trim();
    }

    /* ── Related Content ──────────────────────────────────────────────── */

    async _renderRelated() {
        const aside = document.getElementById('storyRelated');
        if (!aside) return;

        const s = this.story;

        // Fetch sibling stories from same destination
        const { ok, data: siblingStories = [] } = await StoryService.getByDestination(s.destinationSlug);
        // Filter out current story and cap at 3
        const related = ok
            ? (Array.isArray(siblingStories) ? siblingStories : [])
                .filter(r => r._id !== s._id && r.storyId !== s.storyId)
                .slice(0, 3)
            : [];

        // Destination card
        const destName  = s.destination?.name || s.destinationSlug || '';
        const destSlug  = s.destination?.slug || s.destinationSlug || '';
        const destImage = s.destination?.coverImage || DEST_IMAGE_MAP[s.destinationSlug] || FALLBACK_IMAGE;

        const destCardHtml = destName ? `
<a href="../destinations/${destSlug}.html" class="story-dest-card" aria-label="Explore ${destName}">
  <div class="story-dest-card__thumb">
    <img src="${destImage}" alt="${escapeHtml(destName)}" width="64" height="64" loading="lazy" />
  </div>
  <div>
    <div class="story-dest-card__label">Destination</div>
    <div class="story-dest-card__name">${escapeHtml(destName)}</div>
  </div>
</a>`.trim() : '';

        // Related story cards (minimal)
        const relatedCardsHtml = related.map(r => {
            const rSlug    = r.slug || r.storyId;
            const rHref    = `./story-detail.html?slug=${encodeURIComponent(rSlug)}`;
            const rImgSrc  = r.heroImage?.url || DEST_IMAGE_MAP[r.destinationSlug] || FALLBACK_IMAGE;
            const rImgAlt  = r.heroImage?.alt  || r.title;
            return `
<a href="${rHref}" class="story-dest-card" aria-label="${escapeHtml(r.title)}">
  <div class="story-dest-card__thumb">
    <img src="${rImgSrc}" alt="${escapeHtml(rImgAlt)}" width="64" height="64" loading="lazy" />
  </div>
  <div>
    <div class="story-dest-card__label">${formatCategory(r.category) || r.tag || 'Story'}</div>
    <div class="story-dest-card__name">${escapeHtml(r.title)}</div>
  </div>
</a>`.trim();
        }).join('');

        if (!destCardHtml && !relatedCardsHtml) return;

        aside.innerHTML = `
<div class="container">
  <div class="section-header reveal">
    <span class="section-eyebrow">Explore More</span>
    <h2 class="section-title">Related</h2>
  </div>
  <div class="story-related__grid reveal">
    ${destCardHtml}
    ${relatedCardsHtml}
    ${related.length === 0 ? `
    <a href="./index.html" class="stories-dest-card" aria-label="All Stories">
      <div class="stories-dest-card__thumb" style="display:flex;align-items:center;justify-content:center;background:var(--color-forest-dark);">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" opacity=".5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <div>
        <div class="stories-dest-card__name">All Stories</div>
        <div class="stories-dest-card__count">Browse the full archive</div>
      </div>
    </a>` : ''}
  </div>
</div>`.trim();

        aside.hidden = false;
    }

    /* ── Loading / Error / 404 States ─────────────────────────────────── */

    _hideLoading() {
        const loading = document.getElementById('storyLoadingState');
        if (loading) loading.hidden = true;
    }

    _showCta() {
        const cta = document.getElementById('storyCta');
        if (cta) cta.hidden = false;
    }

    _renderNotFound(msg) {
        const loading = document.getElementById('storyLoadingState');
        if (loading) {
            loading.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="1.5" aria-hidden="true" style="margin-bottom: var(--space-md); opacity: 0.4;">
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
</svg>
<h1 style="font-size: var(--text-xl); color: var(--color-text-primary); margin-bottom: var(--space-xs);">Story Not Found</h1>
<p style="color: var(--color-text-muted); max-width: 44ch; text-align: center; margin-bottom: var(--space-md);">
  ${msg || 'This story may have been archived or the link may be incorrect.'}
</p>
<a href="./index.html" class="btn btn--forest">Browse All Stories</a>`.trim();
        }
    }

    _renderError(message) {
        const loading = document.getElementById('storyLoadingState');
        if (loading) {
            loading.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="1.5" aria-hidden="true" style="margin-bottom: var(--space-md); opacity: 0.4;">
  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
</svg>
<h1 style="font-size: var(--text-xl); color: var(--color-text-primary); margin-bottom: var(--space-xs);">Unable to Load Story</h1>
<p style="color: var(--color-text-muted); max-width: 44ch; text-align: center; margin-bottom: var(--space-md);">
  ${message || 'Check your connection and try again.'}
</p>
<div style="display:flex;gap:var(--space-md);flex-wrap:wrap;justify-content:center;">
  <button class="btn btn--forest" id="detailRetryBtn">Try Again</button>
  <a href="./index.html" class="btn btn--outline-dark">All Stories</a>
</div>`.trim();

            document.getElementById('detailRetryBtn')?.addEventListener('click', () => {
                window.location.reload();
            });
        }
    }
}

/* --------------------------------------------------------------------------
   Bootstrap
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    const controller = new StoryDetailController();
    controller.init().catch(err => {
        console.error('[StoryDetail] Unexpected init error:', err);
    });

    console.info('📖 Sonbhadra Stories — Detail page initialized.');
});
