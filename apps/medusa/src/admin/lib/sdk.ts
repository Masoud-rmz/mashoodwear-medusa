import Medusa from "@medusajs/js-sdk"

/**
 * Admin JS SDK — session auth for custom Medusa Admin widgets.
 * purpose --- same-origin "/" avoids __BACKEND_URL__ ReferenceError breaking the whole Admin SPA ---
 */
export const sdk = new Medusa({
  baseUrl: "/",
  auth: {
    type: "session",
  },
})
