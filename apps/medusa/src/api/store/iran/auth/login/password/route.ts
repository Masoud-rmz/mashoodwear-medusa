/**
 * POST /store/iran/auth/login/password
 * purpose --- phone + password login via emailpass synthetic email ---
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  issueCustomerToken,
  normalizeIranMobile,
  phoneToSyntheticEmail,
} from "../../helpers"
import { messageForAuthError } from "../../messages"

type Body = {
  phone?: string
  password?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Body
  const phone = normalizeIranMobile(body.phone)
  const password = String(body.password || "")

  if (!phone) {
    res.status(400).json({
      ok: false,
      error: "phone_invalid",
      message: messageForAuthError("phone_invalid"),
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

  const authModule = req.scope.resolve(Modules.AUTH)
  const email = phoneToSyntheticEmail(phone)

  const result = await authModule.authenticate("emailpass", {
    body: { email, password },
  })

  if (!result.success || !result.authIdentity) {
    res.status(401).json({
      ok: false,
      error: "invalid_credentials",
      message: messageForAuthError("invalid_credentials"),
    })
    return
  }

  if (!result.authIdentity.app_metadata?.customer_id) {
    res.status(401).json({
      ok: false,
      error: "not_registered",
      message: messageForAuthError("not_registered"),
    })
    return
  }

  const token = issueCustomerToken(req.scope, result.authIdentity, "emailpass")

  res.json({
    ok: true,
    token,
    customer_id: result.authIdentity.app_metadata.customer_id,
  })
}
