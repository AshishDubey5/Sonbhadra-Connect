/**
 * Tourist Service & API Client
 * Sonbhadra Tourism — Tourist Platform
 *
 * Handles tourist authentication, profile management, wishlist,
 * bookings, and eco-points tracking with automatic token refresh.
 */

import {
  getTouristAccessToken,
  getTouristRefreshToken,
  setTouristTokens,
  clearTouristSession,
  setTourist,
} from '../scripts/utils/tourist-state.js';

export const API_BASE = 'http://localhost:4242/api/v1';

let _isRefreshing = false;
let _refreshQueue = [];

function flushQueue(error) {
  _refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  _refreshQueue = [];
}

async function attemptRefresh() {
  try {
    const refreshToken = getTouristRefreshToken();
    const headers = { 'Content-Type': 'application/json' };
    const body = refreshToken ? JSON.stringify({ refreshToken }) : JSON.stringify({});

    const res = await fetch(`${API_BASE}/tourists/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body,
    });

    if (!res.ok) throw new Error('Tourist refresh failed');
    const json = await res.json();
    const tokenData = json?.data;
    if (tokenData?.accessToken) {
      setTouristTokens({
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken || refreshToken,
      });
    }
    return true;
  } catch {
    clearTouristSession();
    return false;
  }
}

/**
 * Core Tourist Request Runner
 */
async function touristRequest(endpoint, options = {}, _isRetry = false) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {};

  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const accessToken = getTouristAccessToken();
  if (accessToken) {
    defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  const config = {
    credentials: 'include',
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, config);

    // 401: Token expired, attempt refresh once
    if (response.status === 401 && !_isRetry) {
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject });
        }).then(() => touristRequest(endpoint, options, true));
      }

      _isRefreshing = true;
      const refreshed = await attemptRefresh();
      _isRefreshing = false;

      if (refreshed) {
        flushQueue(null);
        return touristRequest(endpoint, options, true);
      } else {
        flushQueue(new Error('Tourist session expired'));
        return { ok: false, data: null, error: 'Session expired. Please log in again.' };
      }
    }

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      return {
        ok: false,
        data: null,
        error: data?.message || `Request failed with status ${response.status}`,
      };
    }

    return { ok: true, data: data?.data ?? data, error: null };
  } catch (err) {
    return { ok: false, data: null, error: err.message || 'Network error. Please check your connection.' };
  }
}

export const TouristService = {
  /**
   * Register a new tourist
   * @param {FormData|object} payload
   */
  async register(payload) {
    let body = payload;
    let headers = {};
    if (!(payload instanceof FormData)) {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, v);
      });
      body = fd;
    }
    return touristRequest('/tourists/register', {
      method: 'POST',
      body,
    });
  },

  /**
   * Log in tourist with email and password
   * @param {{ email: string, password: string }} credentials
   */
  async login({ email, password }) {
    const res = await touristRequest('/tourists/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (res.ok && res.data) {
      const { tourist, accessToken, refreshToken } = res.data;
      if (tourist) setTourist(tourist);
      if (accessToken) setTouristTokens({ accessToken, refreshToken });
    }

    return res;
  },

  /**
   * Log out current tourist
   */
  async logout() {
    try {
      await touristRequest('/tourists/logout', { method: 'POST' });
    } catch (e) {
      console.warn('[TouristService] Logout network error:', e);
    } finally {
      clearTouristSession();
    }
    return { ok: true };
  },

  /**
   * Get current logged-in tourist profile
   */
  async getCurrentTourist() {
    const res = await touristRequest('/tourists/me', { method: 'GET' });
    if (res.ok && res.data) {
      setTourist(res.data);
    }
    return res;
  },

  /**
   * Update profile fields (fullName, phone, hometown)
   * @param {{ fullName?: string, phone?: string, hometown?: string }} updates
   */
  async updateProfile(updates) {
    return touristRequest('/tourists/update-profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Update avatar image
   * @param {File} avatarFile
   */
  async updateAvatar(avatarFile) {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    return touristRequest('/tourists/update-avatar', {
      method: 'PATCH',
      body: formData,
    });
  },

  /**
   * Change password
   * @param {{ oldPassword: string, newPassword: string }} payload
   */
  async changePassword({ oldPassword, newPassword }) {
    return touristRequest('/tourists/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },

  /**
   * Get tourist wishlist
   */
  async getWishlist() {
    return touristRequest('/tourists/wishlist', { method: 'GET' });
  },

  /**
   * Add destination to wishlist
   * @param {string} destinationId
   */
  async addToWishlist(destinationId) {
    return touristRequest(`/tourists/wishlist/${destinationId}`, { method: 'POST' });
  },

  /**
   * Remove destination from wishlist
   * @param {string} destinationId
   */
  async removeFromWishlist(destinationId) {
    return touristRequest(`/tourists/wishlist/${destinationId}`, { method: 'DELETE' });
  },

  /**
   * Get bookings placed by this tourist
   */
  async getBookings(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const endpoint = `/tourists/bookings${qs ? '?' + qs : ''}`;
    return touristRequest(endpoint, { method: 'GET' });
  },

  /**
   * Get eco-points
   */
  async getEcoPoints() {
    return touristRequest('/tourists/eco-points', { method: 'GET' });
  },
};
