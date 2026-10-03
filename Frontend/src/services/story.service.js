/**
 * Story Service Layer
 * Sonbhadra Tourism — Editorial Stories System
 *
 * Abstraction over the stories REST API.
 * All methods return { ok: boolean, data, error } — consistent with api.js.
 *
 * Migration note: when moving to Next.js, replace the fetch calls here with
 * the same logic inside getStaticProps / getServerSideProps. The shape of
 * the returned data objects stays identical.
 */

import { API_BASE } from '../scripts/utils/api.js';

/* --------------------------------------------------------------------------
   Internal helper — thin fetch wrapper that doesn't require auth cookies.
   Stories are all public endpoints; no JWT needed.
   -------------------------------------------------------------------------- */
async function publicGet(path) {
    try {
        const res  = await fetch(`${API_BASE}${path}`, { method: 'GET' });
        const json = await res.json().catch(() => null);

        if (!res.ok) {
            return {
                ok: false,
                data: null,
                error: json?.message || `Request failed (${res.status})`,
            };
        }

        return { ok: true, data: json?.data ?? json, error: null };
    } catch (err) {
        return { ok: false, data: null, error: err.message || 'Network error.' };
    }
}

/* --------------------------------------------------------------------------
   StoryService
   -------------------------------------------------------------------------- */
export const StoryService = {

    /**
     * Fetch paginated, optionally filtered list of published stories.
     * Used by: Stories landing page.
     *
     * @param {Object} params
     * @param {string}  [params.category]  - e.g. 'history', 'nature'
     * @param {number}  [params.limit=12]
     * @param {number}  [params.page=1]
     * @returns {Promise<{ok, data: { stories, total, page, limit, hasMore }, error}>}
     */
    async getAllStories({ category = '', limit = 12, page = 1 } = {}) {
        const qs = new URLSearchParams();
        if (category) qs.set('category', category);
        qs.set('limit', String(limit));
        qs.set('page',  String(page));

        const result = await publicGet(`/stories?${qs.toString()}`);

        // Normalise: backend returns data.stories[] inside data wrapper
        if (result.ok && result.data && !Array.isArray(result.data)) {
            // data = { stories, total, page, limit, hasMore }
            return result;
        }

        // Fallback: if somehow data is already an array (older API shape)
        if (result.ok && Array.isArray(result.data)) {
            return {
                ...result,
                data: {
                    stories: result.data,
                    total:   result.data.length,
                    page:    1,
                    limit:   result.data.length,
                    hasMore: false,
                },
            };
        }

        return result;
    },

    /**
     * Fetch a single story by its URL-safe canonical slug.
     * Used by: Story detail page.
     *
     * @param {string} slug - e.g. 'rihand-dam-history'
     * @returns {Promise<{ok, data: Story, error}>}
     */
    async getBySlug(slug) {
        if (!slug) return { ok: false, data: null, error: 'Slug is required.' };
        return publicGet(`/stories/slug/${encodeURIComponent(slug)}`);
    },

    /**
     * Fetch all published stories for a given destination.
     * Used by: Destination detail page story section.
     *
     * @param {string} destinationSlug - e.g. 'rihand-dam'
     * @returns {Promise<{ok, data: Story[], error}>}
     */
    async getByDestination(destinationSlug) {
        if (!destinationSlug) return { ok: false, data: [], error: 'Destination slug required.' };
        return publicGet(`/stories/destination/${encodeURIComponent(destinationSlug)}`);
    },

    /**
     * Fetch a single story by destination slug + storyId string.
     * Used by: Deep link from destination detail page.
     *
     * @param {string} destinationSlug
     * @param {string} storyId
     */
    async getByDestinationAndStoryId(destinationSlug, storyId) {
        return publicGet(
            `/stories/destination/${encodeURIComponent(destinationSlug)}/id/${encodeURIComponent(storyId)}`
        );
    },
};
