const TOKEN_KEY = "mashood_admin_token";

/**
 * Read admin JWT from sessionStorage.
 * @returns {string | null}
 */
export function getAdminToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Persist admin JWT.
 * @param {string} token
 */
export function setAdminToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

/**
 * Clear admin session.
 */
export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

/**
 * Whether admin token exists.
 */
export function isAdminAuthenticated() {
  return Boolean(getAdminToken());
}
