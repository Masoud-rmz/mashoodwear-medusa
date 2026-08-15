const SENSITIVE_KEYS = new Set([
  "secretkey",
  "secret_key",
  "merchantkey",
  "merchant_key",
  "apikey",
  "api_key",
  "password",
  "token",
])

export function redactPaymentLogPayload(
  value: unknown,
  depth = 0
): unknown {
  if (depth > 6 || value == null) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactPaymentLogPayload(entry, depth + 1))
  }

  if (typeof value !== "object") {
    return value
  }

  const result: Record<string, unknown> = {}

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = "[REDACTED]"
      continue
    }

    result[key] = redactPaymentLogPayload(entry, depth + 1)
  }

  return result
}
