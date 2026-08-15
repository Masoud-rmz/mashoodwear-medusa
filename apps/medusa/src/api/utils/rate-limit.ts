/**
 * In-memory fixed-window rate limiter for sensitive auth/checkout routes.
 * For multi-instance production, prefer reverse-proxy limits (nginx/CDN) as well.
 */

export type RateLimitOptions = {
  /** Max requests per window */
  limit: number
  /** Window length in milliseconds */
  windowMs: number
  /** Stable key prefix so routes don't share buckets unintentionally */
  name: string
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSec: number
  limit: number
}

type Bucket = {
  count: number
  resetAt: number
}

const store = new Map<string, Bucket>()

/** Test/helper: clear all buckets */
export function resetRateLimitStore(): void {
  store.clear()
}

function clientKey(req: {
  ip?: string
  headers?: Record<string, unknown> | { get?: (name: string) => string | undefined }
}): string {
  const forwarded =
    typeof req.headers?.get === "function"
      ? req.headers.get("x-forwarded-for")
      : (req.headers as Record<string, unknown> | undefined)?.["x-forwarded-for"]

  const fromHeader =
    typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : undefined

  return fromHeader || req.ip || "unknown"
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
  now = Date.now()
): RateLimitResult {
  const bucketKey = `${options.name}:${key}`
  const existing = store.get(bucketKey)

  if (!existing || now >= existing.resetAt) {
    store.set(bucketKey, { count: 1, resetAt: now + options.windowMs })
    return {
      allowed: true,
      remaining: options.limit - 1,
      retryAfterSec: Math.ceil(options.windowMs / 1000),
      limit: options.limit,
    }
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      limit: options.limit,
    }
  }

  existing.count += 1
  return {
    allowed: true,
    remaining: options.limit - existing.count,
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    limit: options.limit,
  }
}

export function createRateLimitMiddleware(options: RateLimitOptions) {
  return function rateLimitMiddleware(
    req: {
      ip?: string
      headers?: Record<string, unknown>
    },
    res: {
      setHeader: (name: string, value: string | number) => void
      status: (code: number) => { json: (body: unknown) => void }
    },
    next: () => void
  ) {
    const result = checkRateLimit(clientKey(req), options)

    res.setHeader("X-RateLimit-Limit", result.limit)
    res.setHeader("X-RateLimit-Remaining", Math.max(0, result.remaining))

    if (!result.allowed) {
      res.setHeader("Retry-After", result.retryAfterSec)
      res.status(429).json({
        ok: false,
        type: "rate_limit_exceeded",
        message: "Too many requests. Please try again later.",
        retry_after: result.retryAfterSec,
      })
      return
    }

    next()
  }
}

/** Defaults tuned for abuse resistance without blocking normal checkout */
export const RATE_LIMITS = {
  authLogin: { name: "auth-login", limit: 20, windowMs: 60_000 },
  authRegister: { name: "auth-register", limit: 10, windowMs: 60_000 },
  customerCreate: { name: "customer-create", limit: 10, windowMs: 60_000 },
  checkout: { name: "checkout", limit: 30, windowMs: 60_000 },
  iranAuthOtp: { name: "iran-auth-otp", limit: 8, windowMs: 60_000 },
  iranAuthLogin: { name: "iran-auth-login", limit: 20, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitOptions>
