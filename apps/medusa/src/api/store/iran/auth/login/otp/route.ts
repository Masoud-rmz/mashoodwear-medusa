/**
 * POST /store/iran/auth/login/otp
 * purpose --- verify OTP for an existing customer and return JWT ---
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  findPhoneAuthIdentity,
  getPhoneAuthJwtSecret,
  issueCustomerToken,
  normalizeIranMobile,
  verifyOtp,
} from "../../helpers"
import { messageForAuthError } from "../../messages"

type Body = {
  phone?: string
  otp?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Body
  const phone = normalizeIranMobile(body.phone)
  const otp = String(body.otp || "").trim()

  if (!phone) {
    res.status(400).json({
      ok: false,
      error: "phone_invalid",
      message: messageForAuthError("phone_invalid"),
    })
    return
  }
  if (!otp) {
    res.status(400).json({
      ok: false,
      error: "otp_required",
      message: messageForAuthError("otp_required"),
    })
    return
  }

  const identity = await findPhoneAuthIdentity(req.scope, phone)
  if (!identity?.app_metadata?.customer_id) {
    res.status(404).json({
      ok: false,
      error: "not_registered",
      message: messageForAuthError("not_registered"),
    })
    return
  }

  const otpResult = verifyOtp(phone, otp, getPhoneAuthJwtSecret())
  if (!otpResult.ok) {
    res.status(400).json({
      ok: false,
      error: otpResult.error,
      message: messageForAuthError(otpResult.error),
    })
    return
  }

  const token = issueCustomerToken(req.scope, identity, "phone-auth")

  res.json({
    ok: true,
    token,
    customer_id: identity.app_metadata.customer_id,
  })
}
