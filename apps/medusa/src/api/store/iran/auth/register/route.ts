/**
 * POST /store/iran/auth/register
 * purpose --- create customer + phone/emailpass identities; OTP optional when password is set ---
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  createCustomerAccountWorkflow,
  setAuthAppMetadataWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  customerExistsForPhone,
  getPhoneAuthJwtSecret,
  issueCustomerToken,
  normalizeIranMobile,
  phoneToSyntheticEmail,
  verifyOtp,
} from "../helpers"
import { messageForAuthError } from "../messages"

type Body = {
  phone?: string
  otp?: string
  password?: string
  first_name?: string
  last_name?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Body
  const phone = normalizeIranMobile(body.phone)
  const otp = String(body.otp || "").trim()
  const password = String(body.password || "")
  const firstName = String(body.first_name || "").trim()
  const lastName = String(body.last_name || "").trim()

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
  if (password.length < 6) {
    res.status(400).json({
      ok: false,
      error: "password_too_short",
      message: messageForAuthError("password_too_short"),
    })
    return
  }
  if (!firstName) {
    res.status(400).json({
      ok: false,
      error: "name_required",
      message: messageForAuthError("name_required"),
    })
    return
  }

  if (await customerExistsForPhone(req.scope, phone)) {
    res.status(409).json({
      ok: false,
      error: "already_registered",
      message: messageForAuthError("already_registered"),
    })
    return
  }

  // OTP is optional: when present, verify; when absent, password-only register is allowed.
  if (otp) {
    const otpResult = verifyOtp(phone, otp, getPhoneAuthJwtSecret())
    if (!otpResult.ok) {
      res.status(400).json({
        ok: false,
        error: otpResult.error,
        message: messageForAuthError(otpResult.error),
      })
      return
    }
  }

  const authModule = req.scope.resolve(Modules.AUTH)

  const phoneRegister = await authModule.register("phone-auth", {
    body: { phone },
  })

  if (!phoneRegister.success || !phoneRegister.authIdentity) {
    res.status(400).json({
      ok: false,
      error: "auth_failed",
      message: phoneRegister.error || messageForAuthError("auth_failed"),
    })
    return
  }

  const email = phoneToSyntheticEmail(phone)

  const { result: customer } = await createCustomerAccountWorkflow(req.scope).run(
    {
      input: {
        authIdentityId: phoneRegister.authIdentity.id,
        customerData: {
          email,
          phone,
          first_name: firstName,
          last_name: lastName || undefined,
        },
      },
    }
  )

  const emailRegister = await authModule.register("emailpass", {
    body: { email, password },
  })

  if (emailRegister.success && emailRegister.authIdentity) {
    await setAuthAppMetadataWorkflow(req.scope).run({
      input: {
        authIdentityId: emailRegister.authIdentity.id,
        actorType: "customer",
        value: customer.id,
      },
    })
  }

  // Prefer emailpass identity for password login continuity when OTP was skipped.
  let tokenIdentity = phoneRegister.authIdentity
  let tokenProvider = "phone-auth"

  if (emailRegister.success && emailRegister.authIdentity) {
    const identities = await authModule.listAuthIdentities(
      { id: [emailRegister.authIdentity.id] },
      { relations: ["provider_identities"] }
    )
    tokenIdentity = identities[0] || emailRegister.authIdentity
    tokenProvider = "emailpass"
  } else {
    const identities = await authModule.listAuthIdentities(
      { id: [phoneRegister.authIdentity.id] },
      { relations: ["provider_identities"] }
    )
    tokenIdentity = identities[0] || phoneRegister.authIdentity
  }

  const token = issueCustomerToken(req.scope, tokenIdentity, tokenProvider)

  res.status(201).json({
    ok: true,
    token,
    customer: {
      id: customer.id,
      phone: customer.phone,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
    },
  })
}
