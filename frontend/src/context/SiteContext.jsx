import { createContext, useContext } from "react";

/** @type {import('react').Context<import('../types').SiteContextValue | null>} */
export const SiteContext = createContext(null);

/**
 * Site-wide settings loaded once in Layout.
 * @returns {import('../types').SiteContextValue}
 */
export function useSite() {
  const value = useContext(SiteContext);
  if (!value) {
    throw new Error("useSite must be used within SiteContext.Provider");
  }
  return value;
}
