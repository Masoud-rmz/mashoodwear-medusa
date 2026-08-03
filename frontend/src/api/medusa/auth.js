/**
 * Iran Pack customer auth adapter (OTP + password).
 * purpose --- call /store/iran/auth/* without exposing SMS secrets ---
 */

import { medusaStoreFetch } from "./client.js"
import { setCustomerToken } from "./customerAuth.js"
import { messageForAuthError } from "./authMessages.js"

/**
 * @param {{ ok: boolean, status: number, body: Record<string, unknown> }} result
 * @returns {{ ok: true, data: Record<string, unknown> } | { ok: false, error: string, message: string, status: number }}
 */
function mapAuthResult(result) {
  if (result.ok && result.body?.ok !== false) {
    return { ok: true, data: result.body }
  }

  const error =
    (typeof result.body?.error === "string" && result.body.error) ||
    "auth_failed"
  const message =
    (typeof result.body?.message === "string" && result.body.message) ||
    messageForAuthError(error)

  return {
    ok: false,
    error,
    message,
    status: result.status,
  }
}

/**
 * @param {string} phone
 * @param {"register" | "login" | "reset"} [purpose]
 */
export async function sendCustomerOtp(phone, purpose = "login") {
  const result = await medusaStoreFetch("/store/iran/auth/otp/send", {
    method: "POST",
    body: JSON.stringify({ phone, purpose }),
  })
  return mapAuthResult(result)
}

/**
 * Reset password after OTP (Iran Pack). Does not auto-login.
 * @param {{ phone: string, otp: string, password: string }} payload
 */
export async function resetCustomerPassword(payload) {
  const result = await medusaStoreFetch("/store/iran/auth/password/reset", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return mapAuthResult(result)
}

/**
 * @param {{ phone: string, otp?: string, password: string, first_name: string, last_name?: string }} payload
 * OTP is optional — password-only register is supported.
 */
export async function registerCustomerWithOtp(payload) {
  const result = await medusaStoreFetch("/store/iran/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  const mapped = mapAuthResult(result)
  if (mapped.ok && typeof mapped.data.token === "string") {
    setCustomerToken(mapped.data.token)
  }
  return mapped
}

/**
 * Alias for password-first register (OTP optional).
 * @param {{ phone: string, password: string, first_name: string, last_name?: string, otp?: string }} payload
 */
export async function registerCustomer(payload) {
  return registerCustomerWithOtp(payload)
}

/**
 * @param {string} phone
 * @param {string} password
 */
export async function loginCustomerWithPassword(phone, password) {
  const result = await medusaStoreFetch("/store/iran/auth/login/password", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  })
  const mapped = mapAuthResult(result)
  if (mapped.ok && typeof mapped.data.token === "string") {
    setCustomerToken(mapped.data.token)
  }
  return mapped
}

/**
 * @param {string} phone
 * @param {string} otp
 */
export async function loginCustomerWithOtp(phone, otp) {
  const result = await medusaStoreFetch("/store/iran/auth/login/otp", {
    method: "POST",
    body: JSON.stringify({ phone, otp }),
  })
  const mapped = mapAuthResult(result)
  if (mapped.ok && typeof mapped.data.token === "string") {
    setCustomerToken(mapped.data.token)
  }
  return mapped
}
