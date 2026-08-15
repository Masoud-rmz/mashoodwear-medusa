/**
 * POST /store/iran/auth/otp/send
 * purpose --- issue OTP for register or login and send via SMS.ir (or stub) ---
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  customerExistsForPhone,
  getPhoneAuthJwtSecret,
  issueOtp,
  loadSmsIrConfig,
  normalizeIranMobile,
  sendSmsIrVerify,
} from "../../helpers"
import { messageForAuthError } from "../../messages"

type Body = {
  phone?: string
  /** "register" | "login" | "reset" — defaults to login */
  purpose?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Body
  const phone = normalizeIranMobile(body.phone)
  const purpose = String(body.purpose || "login").toLowerCase()

  if (!phone) {
    res.status(400).json({
      ok: false,
      error: "phone_invalid",
      message: messageForAuthError("phone_invalid"),
    })
    return
  }

  const exists = await customerExistsForPhone(req.scope, phone)

  if (purpose === "register" && exists) {
    res.status(409).json({
      ok: false,
      error: "already_registered",
      message: messageForAuthError("already_registered"),
    })
    return
  }

  if ((purpose === "login" || purpose === "reset") && !exists) {
    res.status(404).json({
      ok: false,
      error: "not_registered",
      message: messageForAuthError("not_registered"),
    })
    return
  }

  const jwtSecret = getPhoneAuthJwtSecret()
  const { otp } = issueOtp(phone, jwtSecret)

  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as {
    info: (msg: string) => void
    error: (msg: string) => void
  }

  const sms = await sendSmsIrVerify({
    phone,
    code: otp,
    config: loadSmsIrConfig(),
    logger,
  })

  if (!sms.ok) {
    res.status(502).json({
      ok: false,
      error: "otp_send_failed",
      message: messageForAuthError("otp_send_failed"),
    })
    return
  }

  res.json({
    ok: true,
    phone,
    stub: sms.stub,
    expires_in_sec: 180,
    // Dev-only hint so storefront smoke works without reading server logs
    ...(sms.stub && process.env.NODE_ENV !== "production"
      ? { debug_otp: otp }
      : {}),
  })
}
