/**
 * Auth State Manager
 * Sonbhadra Tourism — Creator Platform
 *
 * Manages creator session state in sessionStorage.
 * sessionStorage is cleared on tab close — works well for security.
 * The live source of truth is always the backend cookie + /current-creator endpoint.
 */

const SESSION_KEY = 'sbt_creator_session';
const ACCESS_TOKEN_KEY = 'sbt_creator_access_token';
const REFRESH_TOKEN_KEY = 'sbt_creator_refresh_token';

/**
 * Store creator data in sessionStorage
 * @param {object} creatorData - sanitized creator object (no password/refreshToken)
 */
export function setCreator(creatorData) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(creatorData));
  } catch (e) {
    console.warn('[AuthState] Failed to persist creator session:', e);
  }
}

/**
 * Retrieve stored creator data
 * @returns {object|null}
 */
export function getCreator() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Store access and refresh tokens
 * @param {{ accessToken?: string, refreshToken?: string }} tokens
 */
export function setTokens({ accessToken, refreshToken } = {}) {
  try {
    if (accessToken) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch (e) {
    console.warn('[AuthState] Failed to persist tokens:', e);
  }
}

/**
 * Get stored access token
 * @returns {string|null}
 */
export function getAccessToken() {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Get stored refresh token
 * @returns {string|null}
 */
export function getRefreshToken() {
  try {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Check if a creator session exists locally
 * NOTE: This is a fast local check only. Always validate with /current-creator on critical pages.
 * @returns {boolean}
 */
export function isLoggedIn() {
  return getCreator() !== null;
}

/**
 * Clear local session and tokens (called on logout)
 */
export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (e) {
    console.warn('[AuthState] Failed to clear session:', e);
  }
}

/**
 * Update a specific field in the stored creator object
 * (useful after partial profile updates — no need to re-fetch full creator)
 * @param {object} updates - partial fields to merge
 */
export function updateCreatorFields(updates) {
  const current = getCreator();
  if (current) {
    setCreator({ ...current, ...updates });
  }
}

