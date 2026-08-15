/** Iran Pack admin locales — design §8ج: fa (default) + en only in our switcher. */
export const IRAN_PACK_LOCALES = ["fa", "en"] as const

export type IranPackLocale = (typeof IRAN_PACK_LOCALES)[number]

export const IRAN_PACK_DEFAULT_LOCALE: IranPackLocale = "fa"

const RTL_LOCALES = new Set<IranPackLocale>(["fa"])

export function isIranPackLocale(code: string): code is IranPackLocale {
  return (IRAN_PACK_LOCALES as readonly string[]).includes(code)
}

export function getDocumentDirection(locale: string): "ltr" | "rtl" {
  return RTL_LOCALES.has(locale as IranPackLocale) ? "rtl" : "ltr"
}

const LANGUAGE_STORAGE_KEY = "lng"

/** True when the user has not chosen a language (cookie/localStorage). */
export function hasStoredLanguagePreference(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  if (window.localStorage.getItem(LANGUAGE_STORAGE_KEY)) {
    return true
  }

  return document.cookie.split(";").some((part) => {
    const trimmed = part.trim()
    return trimmed.startsWith(`${LANGUAGE_STORAGE_KEY}=`) && trimmed.length > 4
  })
}
