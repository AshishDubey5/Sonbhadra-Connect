/**
 * Creator Service
 * Sonbhadra Tourism — Creator Platform
 *
 * Handles all creator-related API calls.
 * Static data methods (getAll, getFeatured, etc.) preserved from original.
 * Auth + Dashboard API methods added below.
 */

import { CREATORS_DATA } from '../data/creators.js';
import { get, post, postForm, patch, patchForm } from '../scripts/utils/api.js';

/* --------------------------------------------------------------------------
   STATIC DATA METHODS (original — preserved)
   -------------------------------------------------------------------------- */

export const CreatorService = {
  async getAll() {
    return Promise.resolve(CREATORS_DATA);
  },

  async getFeatured() {
    return Promise.resolve(CREATORS_DATA.filter(c => c.featured));
  },

  async getByCategory(categorySlug) {
    if (!categorySlug || categorySlug === 'all') return Promise.resolve(CREATORS_DATA);
    return Promise.resolve(CREATORS_DATA.filter(c => c.categorySlug === categorySlug));
  },

  async getBySlug(slug) {
    return Promise.resolve(CREATORS_DATA.find(c => c.slug === slug));
  },

  /**
   * Fetch top creators directly from the database
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getTopCreators(limit = 3) {
    const { ok, data } = await get(`/creators/top?limit=${limit}`);
    if (ok && Array.isArray(data) && data.length > 0) {
      return data;
    }
    return [];
  },

  /* --------------------------------------------------------------------------
     AUTH METHODS
     -------------------------------------------------------------------------- */

  /**
   * Register a new creator
   * @param {FormData} formData - Must include: creatorName, email, fullName, phone, password, avatar (File)
   *                              Optional: coveringCity, bio, socialLinks (JSON string), address (JSON string)
   * @returns {{ ok, data, error }}
   */
  async register(formData) {
    return postForm('/creators/register', formData);
  },

  /**
   * Log in with email or creatorName + password
   * @param {{ emailOrUsername: string, password: string }} credentials
   * @returns {{ ok, data, error }}
   */
  async login({ emailOrUsername, password }) {
    // Detect if user entered email or username
    const isEmail = emailOrUsername.includes('@');
    const body = isEmail
      ? { email: emailOrUsername, password }
      : { creatorName: emailOrUsername, password };
    return post('/creators/login', body);
  },

  /**
   * Log out the current creator (clears DB token + cookies)
   * @returns {{ ok, data, error }}
   */
  async logout() {
    return post('/creators/logout', {});
  },

  /**
   * Get the currently authenticated creator's profile
   * @returns {{ ok, data, error }}
   */
  async getCurrentCreator() {
    return get('/creators/current-creator');
  },

  /* --------------------------------------------------------------------------
     PROFILE / DASHBOARD METHODS
     -------------------------------------------------------------------------- */

  /**
   * Get creator's public channel profile with aggregated stats
   * (totalPosts, totalViews, totalLikes from Media collection)
   * @param {string} creatorName
   * @returns {{ ok, data, error }}
   */
  async getChannelProfile(creatorName) {
    return get(`/creators/c/${encodeURIComponent(creatorName)}`);
  },

  /**
   * Update account details (fullName, phone, address)
   * @param {{ fullName?: string, phone?: string, address?: object }} details
   * @returns {{ ok, data, error }}
   */
  async updateAccountDetails(details) {
    return patch('/creators/update-account', details);
  },

  /**
   * Update creator avatar
   * @param {File} avatarFile
   * @returns {{ ok, data, error }}
   */
  async updateAvatar(avatarFile) {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    return patchForm('/creators/update-avatar', formData);
  },

  /**
   * Update covering city
   * @param {string} coveringCity
   * @returns {{ ok, data, error }}
   */
  async updateCoveringCity(coveringCity) {
    return patch('/creators/covering-city', { coveringCity });
  },

  /**
   * Add bio (first time)
   * @param {string} bio
   * @returns {{ ok, data, error }}
   */
  async addBio(bio) {
    return post('/creators/add-bio', { bio });
  },

  /**
   * Update bio and/or social links
   * @param {{ bio?: string, socialLinks?: string[] }} payload
   * @returns {{ ok, data, error }}
   */
  async updateBio({ bio, socialLinks }) {
    return patch('/creators/update-bio', { bio, socialLinks });
  },

  /**
   * Change creator password
   * @param {{ oldPassword: string, newPassword: string }} payload
   * @returns {{ ok, data, error }}
   */
  async changePassword({ oldPassword, newPassword }) {
    return post('/creators/change-password', { oldPassword, newPassword });
  },
};
