/**
 * Centralized API Fetch Utility
 * Sonbhadra Tourism — Creator Platform
 *
 * - Sends credentials (cookies) with every request
 * - Handles 401 → attempts refresh-token once, then retries
 * - Returns { ok: boolean, data, error } — no need for try/catch in callers
 */

import { getAccessToken, getRefreshToken, setTokens, clearSession } from './auth-state.js';

// Always point to the backend on localhost — do NOT use window.location.hostname
// because `npx serve` may bind to a link-local 169.254.x.x IP which breaks CORS.
export const API_BASE = 'http://localhost:4242/api/v1';

let _isRefreshing = false;
let _refreshQueue = [];

/**
 * Flush queued requests after a token refresh attempt
 */
function flushQueue(error) {
  _refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  _refreshQueue = [];
}

/**
 * Attempt to refresh the access token using the refresh cookie or refresh token in body
 */
async function attemptRefresh() {
  try {
    const refreshToken = getRefreshToken();
    const headers = { 'Content-Type': 'application/json' };
    const body = refreshToken ? JSON.stringify({ refreshToken }) : JSON.stringify({});

    const res = await fetch(`${API_BASE}/creators/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body,
    });
    if (!res.ok) throw new Error('Refresh failed');
    const json = await res.json();
    const tokenData = json?.data;
    if (tokenData?.accessToken) {
      setTokens({
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken || refreshToken,
      });
    }
    return true;
  } catch {
    clearSession();
    return false;
  }
}

/**
 * Core request function
 * @param {string} endpoint  - e.g. '/creators/current-creator'
 * @param {RequestInit} options - fetch options (method, body, headers, etc.)
 * @param {boolean} _isRetry - internal flag to prevent infinite loops
 */
export async function request(endpoint, options = {}, _isRetry = false) {
  const url = `${API_BASE}${endpoint}`;

  const defaultHeaders = {};
  // Don't set Content-Type for FormData (browser sets multipart boundary automatically)
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  // Attach Authorization header if access token exists
  const accessToken = getAccessToken();
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

    // Token expired — try to refresh once
    if (response.status === 401 && !_isRetry) {
      if (_isRefreshing) {
        // Queue this request until refresh is done
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject });
        }).then(() => request(endpoint, options, true));
      }

      _isRefreshing = true;
      const refreshed = await attemptRefresh();
      _isRefreshing = false;

      if (refreshed) {
        flushQueue(null);
        return request(endpoint, options, true);
      } else {
        flushQueue(new Error('Session expired'));
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
    return { ok: false, data: null, error: err.message || 'Network error. Check your connection.' };
  }
}

/** Convenience: GET */
export const get = (endpoint) => request(endpoint, { method: 'GET' });

/** Convenience: POST with JSON body */
export const post = (endpoint, body) =>
  request(endpoint, { method: 'POST', body: JSON.stringify(body) });

/** Convenience: POST with FormData (file upload) */
export const postForm = (endpoint, formData) =>
  request(endpoint, { method: 'POST', body: formData });

/** Convenience: PATCH with JSON body */
export const patch = (endpoint, body) =>
  request(endpoint, { method: 'PATCH', body: JSON.stringify(body) });

/** Convenience: PATCH with FormData (file upload) */
export const patchForm = (endpoint, formData) =>
  request(endpoint, { method: 'PATCH', body: formData });
