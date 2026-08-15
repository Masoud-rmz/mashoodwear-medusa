/**
 * Iran mobile helpers for phone-auth.
 * purpose --- normalize buyer phone to a stable auth entity_id ---
 */

const IRAN_MOBILE = /^(?:\+98|0098|98|0)?9\d{9}$/

/**
 * Strip spaces/dashes/parentheses from a phone string.
 */
export function stripPhoneDecorations(value: string): string {
  return String(value || "").replace(/[\s\-()]/g, "")
}

/**
 * Normalize Iranian mobile to `09xxxxxxxxx`.
 * Returns null when the number is not a valid IR mobile.
 */
export function normalizeIranMobile(value: unknown): string | null {
  const raw = stripPhoneDecorations(String(value || ""))
  if (!IRAN_MOBILE.test(raw)) {
    return null
  }

  const digits = raw.replace(/^\+/, "").replace(/^00/, "")
  if (digits.startsWith("98") && digits.length === 12) {
    return `0${digits.slice(2)}`
  }
  if (digits.startsWith("9") && digits.length === 10) {
    return `0${digits}`
  }
  if (digits.startsWith("09") && digits.length === 11) {
    return digits
  }
  return null
}

/**
 * Synthetic email used only server-side for emailpass password auth.
 * purpose --- keep phone as the only identity shown in the UI ---
 */
export function phoneToSyntheticEmail(phone: string): string {
  return `${phone}@phone.local`
}

/**
 * SMS.ir expects mobile without leading 0 (e.g. 912xxxxxxx).
 */
export function phoneToSmsIrMobile(phone: string): string {
  const normalized = normalizeIranMobile(phone) || stripPhoneDecorations(phone)
  return normalized.startsWith("0") ? normalized.slice(1) : normalized
}
