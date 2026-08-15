/**
 * In-memory OTP store for Iran Pack auth routes.
 * purpose --- allow register OTP before an auth identity exists ---
 */

import jwt from "jsonwebtoken"

type OtpEntry = {
  hashedOtp: string
  createdAt: number
}

const store = new Map<string, OtpEntry>()

const DEFAULT_TTL_SEC = 180

/** Test helper: clear pending OTPs */
export function resetOtpStore(): void {
  store.clear()
}

/**
 * Generate a 6-digit OTP and store a signed hash keyed by phone.
 */
export function issueOtp(
  phone: string,
  jwtSecret: string,
  ttlSec = DEFAULT_TTL_SEC
): { otp: string } {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const hashedOtp = jwt.sign({ otp, phone }, jwtSecret, {
    expiresIn: ttlSec,
  })
  store.set(phone, { hashedOtp, createdAt: Date.now() })
  return { otp }
}

/**
 * Verify a user-supplied OTP against the pending store entry.
 */
export function verifyOtp(
  phone: string,
  otp: string,
  jwtSecret: string
): { ok: true } | { ok: false; error: string } {
  const entry = store.get(phone)
  if (!entry?.hashedOtp) {
    return { ok: false, error: "otp_not_found" }
  }

  try {
    const decoded = jwt.verify(entry.hashedOtp, jwtSecret) as {
      otp: string
      phone: string
    }
    if (decoded.phone !== phone || decoded.otp !== String(otp)) {
      return { ok: false, error: "otp_invalid" }
    }
    store.delete(phone)
    return { ok: true }
  } catch {
    store.delete(phone)
    return { ok: false, error: "otp_expired" }
  }
}

/**
 * Whether a pending OTP exists for the phone (does not validate).
 */
export function hasPendingOtp(phone: string): boolean {
  return store.has(phone)
}
