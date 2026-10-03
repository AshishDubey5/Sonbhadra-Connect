/**
 * Destination Detail Service Layer
 * 
 * Abstraction layer for fetching rich individual destination documents.
 * Designed to seamlessly transition to MongoDB / Express REST API:
 * Just replace `return DESTINATION_DETAILS[slug]` with `fetch('/api/destinations/' + slug)`.
 */

import { DESTINATION_DETAILS } from '../data/destination-detail.data.js';
import { DESTINATIONS_DATA } from '../data/destinations.js';

export class DestinationDetailService {
  /**
   * Get complete destination document by slug
   * @param {string} slug 
   * @returns {Promise<Object|null>}
   */
  static async getBySlug(slug) {
    // Simulated async network delay for realistic lifecycle & skeleton transitions
    await new Promise(resolve => setTimeout(resolve, 10));

    if (DESTINATION_DETAILS[slug]) {
      return DESTINATION_DETAILS[slug];
    }

    // Fallback: match against flat destination list if specific detailed document not authored yet
    const fallback = DESTINATIONS_DATA.find(d => d.slug === slug || d.id === slug);
    if (fallback) {
      return {
        slug: fallback.slug,
        name: fallback.name,
        shortName: fallback.name,
        tagline: fallback.tagline,
        category: fallback.category,
        categoryBadge: fallback.categorySlug,
        location: fallback.location,
        coordinates: { lat: 24.5, lng: 83.0, label: fallback.location },
        summary: fallback.description,
        gallery: [
          { url: fallback.image, alt: fallback.name, caption: fallback.tagline, type: 'featured' }
        ],
        stories: [],
        creators: [],
        quickFacts: {
          bestSeason: fallback.bestSeason || 'October to March',
          timings: '06:00 AM – 06:00 PM',
          entryFee: 'Nominal / Free [VERIFY]',
          difficulty: fallback.difficulty || 'Moderate',
          nearestRailway: 'Robertsganj / Chunar',
          nearestAirport: 'Varanasi (LBS)',
          howToReach: 'Connected via state highways from Robertsganj.'
        },
        mapDetails: {
          lat: 24.5,
          lng: 83.0,
          mapQuery: fallback.name + ', Sonbhadra',
          terrain: 'Vindhyan terrain',
          landmarks: [],
          safetyNotes: 'Follow standard forest and outdoor guidelines.'
        },
        communityGuidelines: {
          etiquette: ['Respect local traditions.'],
          ecoRules: ['Do not litter. Carry trash back.'],
          safetyWarnings: ['Exercise caution near cliffs and water.']
        },
        relatedSlugs: []
      };
    }

    return null;
  }

  /**
   * Get related destinations for recommendation cards
   * @param {string[]} slugs 
   * @returns {Promise<Array>}
   */
  static async getRelated(slugs = []) {
    if (!slugs || slugs.length === 0) {
      // Default to first 3 from listing
      return DESTINATIONS_DATA.slice(0, 3);
    }
    
    return DESTINATIONS_DATA.filter(dest => slugs.includes(dest.slug) || slugs.includes(dest.id));
  }
}
