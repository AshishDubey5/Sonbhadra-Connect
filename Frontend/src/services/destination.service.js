import { DESTINATIONS_DATA } from '../data/destinations.js';

export const DestinationService = {
  async getAll() {
    return Promise.resolve(DESTINATIONS_DATA);
  },

  async getFeatured() {
    return Promise.resolve(DESTINATIONS_DATA.filter(d => d.featured));
  },

  async getHero() {
    return Promise.resolve(DESTINATIONS_DATA.find(d => d.isHero) || DESTINATIONS_DATA[0]);
  },

  async getByCategory(categorySlug) {
    if (!categorySlug || categorySlug === 'all') return Promise.resolve(DESTINATIONS_DATA);
    return Promise.resolve(DESTINATIONS_DATA.filter(d => d.categorySlug === categorySlug));
  },

  async getBySlug(slug) {
    return Promise.resolve(DESTINATIONS_DATA.find(d => d.slug === slug));
  }
};
