/**
 * Tourist Auth State Manager
 * Sonbhadra Tourism — Tourist Platform
 *
 * Manages tourist session state in sessionStorage and localStorage fallback.
 * The live source of truth is always the backend cookie + /api/v1/tourists/me endpoint.
 */

const SESSION_KEY = 'sbt_tourist_session';
const ACCESS_TOKEN_KEY = 'sbt_tourist_access_token';
const REFRESH_TOKEN_KEY = 'sbt_tourist_refresh_token';

/**
 * Store tourist data in storage
 * @param {object} touristData - sanitized tourist object (no password/refreshToken)
 */
export function setTourist(touristData) {
  try {
    const dataStr = JSON.stringify(touristData);
    sessionStorage.setItem(SESSION_KEY, dataStr);
    localStorage.setItem(SESSION_KEY, dataStr);
  } catch (e) {
    console.warn('[TouristAuthState] Failed to persist tourist session:', e);
  }
}

/**
 * Retrieve stored tourist data
 * @returns {object|null}
 */
export function getTourist() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Store access and refresh tokens
 * @param {{ accessToken?: string, refreshToken?: string }} tokens
 */
export function setTouristTokens({ accessToken, refreshToken } = {}) {
  try {
    if (accessToken) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch (e) {
    console.warn('[TouristAuthState] Failed to persist tokens:', e);
  }
}

/**
 * Get stored access token
 * @returns {string|null}
 */
export function getTouristAccessToken() {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Get stored refresh token
 * @returns {string|null}
 */
export function getTouristRefreshToken() {
  try {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Check if a tourist session exists locally
 * @returns {boolean}
 */
export function isTouristLoggedIn() {
  return getTourist() !== null;
}

/**
 * Clear local session and tokens (called on logout)
 */
export function clearTouristSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (e) {
    console.warn('[TouristAuthState] Failed to clear tourist session:', e);
  }
}

/**
 * Update a specific field in the stored tourist object
 * @param {object} updates - partial fields to merge
 */
export function updateTouristFields(updates) {
  const current = getTourist();
  if (current) {
    setTourist({ ...current, ...updates });
  }
}
