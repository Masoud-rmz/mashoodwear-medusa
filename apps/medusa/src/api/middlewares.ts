import { defineMiddlewares } from "@medusajs/framework/http"
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { validateAddressesInBody } from "../modules/iran-shipping"
import {
  RATE_LIMITS,
  createRateLimitMiddleware,
} from "./utils/rate-limit"
import { securityHeadersMiddleware } from "./utils/security-headers"

async function validateIranAddressMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const body = (req.body || {}) as Record<string, unknown>
  const result = validateAddressesInBody(body)

  if (!result.ok) {
    res.status(400).json({
      ok: false,
      ...result,
    })
    return
  }

  next()
}

const rateLimitAuthLogin = createRateLimitMiddleware(RATE_LIMITS.authLogin)
const rateLimitAuthRegister = createRateLimitMiddleware(
  RATE_LIMITS.authRegister
)
const rateLimitCustomerCreate = createRateLimitMiddleware(
  RATE_LIMITS.customerCreate
)
const rateLimitCheckout = createRateLimitMiddleware(RATE_LIMITS.checkout)
const rateLimitIranAuthOtp = createRateLimitMiddleware(RATE_LIMITS.iranAuthOtp)
const rateLimitIranAuthLogin = createRateLimitMiddleware(
  RATE_LIMITS.iranAuthLogin
)

export default defineMiddlewares({
  routes: [
    // Phase 5 — security headers on all API traffic
    {
      matcher: "*",
      middlewares: [securityHeadersMiddleware],
    },
    // Phase 5 — rate limits on login / register / checkout
    {
      matcher: "/auth/:actor_type/:auth_provider",
      method: "POST",
      middlewares: [rateLimitAuthLogin],
    },
    {
      matcher: "/auth/:actor_type/:auth_provider/register",
      method: "POST",
      middlewares: [rateLimitAuthRegister],
    },
    {
      matcher: "/store/customers",
      method: "POST",
      middlewares: [rateLimitCustomerCreate],
    },
    {
      matcher: "/store/carts/:id/complete",
      method: "POST",
      middlewares: [rateLimitCheckout],
    },
    // Iran Pack — customer phone OTP / password auth
    {
      matcher: "/store/iran/auth/otp/send",
      method: "POST",
      middlewares: [rateLimitIranAuthOtp],
    },
    {
      matcher: "/store/iran/auth/register",
      method: "POST",
      middlewares: [rateLimitAuthRegister],
    },
    {
      matcher: "/store/iran/auth/login/*",
      method: "POST",
      middlewares: [rateLimitIranAuthLogin],
    },
    // Phase 4 — Iran address validation
    {
      matcher: "/store/carts",
      method: "POST",
      middlewares: [validateIranAddressMiddleware],
    },
    {
      matcher: "/store/carts/:id",
      method: "POST",
      middlewares: [validateIranAddressMiddleware],
    },
    {
      matcher: "/store/customers/me/addresses",
      method: "POST",
      middlewares: [validateIranAddressMiddleware],
    },
    {
      matcher: "/store/customers/me/addresses/:address_id",
      method: "POST",
      middlewares: [validateIranAddressMiddleware],
    },
  ],
})
