/**
 * Baseline security headers for API/Admin responses.
 * HSTS is only set when the request is over HTTPS (or X-Forwarded-Proto=https).
 */

const BASE_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
}

export function applySecurityHeaders(
  req: {
    secure?: boolean
    protocol?: string
    headers?: Record<string, unknown>
  },
  res: {
    setHeader: (name: string, value: string) => void
  }
): void {
  for (const [name, value] of Object.entries(BASE_HEADERS)) {
    res.setHeader(name, value)
  }

  // Frame ancestors for CSP-aware clients (complements X-Frame-Options)
  res.setHeader("Content-Security-Policy", "frame-ancestors 'none'")

  if (isHttpsRequest(req)) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    )
  }
}

function isHttpsRequest(req: {
  secure?: boolean
  protocol?: string
  headers?: Record<string, unknown>
}): boolean {
  if (req.secure || req.protocol === "https") {
    return true
  }

  const proto = req.headers?.["x-forwarded-proto"]
  if (typeof proto === "string") {
    return proto.split(",")[0]?.trim().toLowerCase() === "https"
  }

  return false
}

export function securityHeadersMiddleware(
  req: {
    secure?: boolean
    protocol?: string
    headers?: Record<string, unknown>
  },
  res: {
    setHeader: (name: string, value: string) => void
  },
  next: () => void
): void {
  applySecurityHeaders(req, res)
  next()
}
