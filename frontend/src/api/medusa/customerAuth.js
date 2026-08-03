/**
 * Customer JWT persistence for the Vite storefront.
 * purpose --- keep buyer session in localStorage separate from admin CMS auth ---
 */

const CUSTOMER_TOKEN_KEY = "mashood_customer_token"

/**
 * @returns {string | null}
 */
export function getCustomerToken() {
  try {
    return localStorage.getItem(CUSTOMER_TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * @param {string} token
 */
export function setCustomerToken(token) {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token)
}

/**
 * Clear customer JWT.
 */
export function clearCustomerToken() {
  try {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY)
  } catch {
    // ignore
  }
}

/**
 * @returns {boolean}
 */
export function isCustomerLoggedIn() {
  return Boolean(getCustomerToken())
}

export { CUSTOMER_TOKEN_KEY }
