/**
 * POST /store/iran/auth/password/reset
 * purpose --- verify OTP then update emailpass password for synthetic phone email ---
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  customerExistsForPhone,
  findEmailPassAuthIdentity,
  getPhoneAuthJwtSecret,
  normalizeIranMobile,
  phoneToSyntheticEmail,
  verifyOtp,
} from "../../helpers"
import { messageForAuthError } from "../../messages"

type Body = {
  phone?: string
  otp?: string
  password?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Body
  const phone = normalizeIranMobile(body.phone)
  const otp = String(body.otp || "").trim()
  const password = String(body.password || "")

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
  if (!password) {
    res.status(400).json({
      ok: false,
      error: "password_required",
      message: messageForAuthError("password_required"),
    })
    return
  }
  if (password.length < 6) {
    res.status(400).json({
      ok: false,
      error: "password_too_short",
      message: messageForAuthError("password_too_short"),
    })
    return
  }

  if (!(await customerExistsForPhone(req.scope, phone))) {
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

  const authModule = req.scope.resolve(Modules.AUTH) as {
    updateProvider: (
      provider: string,
      data: Record<string, unknown>
    ) => Promise<{ success: boolean; error?: string }>
    register: (
      provider: string,
      data: { body: Record<string, unknown> }
    ) => Promise<{ success: boolean; error?: string; authIdentity?: unknown }>
  }

  const email = phoneToSyntheticEmail(phone)
  const existingEmailPass = await findEmailPassAuthIdentity(req.scope, phone)

  if (existingEmailPass) {
    const updated = await authModule.updateProvider("emailpass", {
      entity_id: email,
      password,
    })
    if (!updated.success) {
      res.status(400).json({
        ok: false,
        error: "auth_failed",
        message: updated.error || messageForAuthError("auth_failed"),
      })
      return
    }
  } else {
    const registered = await authModule.register("emailpass", {
      body: { email, password },
    })
    if (!registered.success) {
      res.status(400).json({
        ok: false,
        error: "auth_failed",
        message: registered.error || messageForAuthError("auth_failed"),
      })
      return
    }
  }

  res.json({
    ok: true,
    phone,
    message: "رمز عبور با موفقیت به‌روزرسانی شد.",
  })
}
