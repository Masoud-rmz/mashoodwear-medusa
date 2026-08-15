/**
 * Fail fast in production if CORS still points at local/dev or docs origins.
 */

const FORBIDDEN_SUBSTRINGS = [
  "docs.medusajs.com",
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
]

export type CorsEnv = {
  STORE_CORS?: string
  ADMIN_CORS?: string
  AUTH_CORS?: string
  NODE_ENV?: string
  /** Set to "0" to skip the production CORS guard (not recommended) */
  CORS_PRODUCTION_GUARD?: string
}

export type CorsGuardResult = {
  ok: boolean
  errors: string[]
}

export function assertProductionCors(env: CorsEnv = process.env): CorsGuardResult {
  const nodeEnv = env.NODE_ENV || "development"
  if (nodeEnv !== "production") {
    return { ok: true, errors: [] }
  }

  if (env.CORS_PRODUCTION_GUARD === "0") {
    return { ok: true, errors: [] }
  }

  const errors: string[] = []
  const pairs: Array<[string, string | undefined]> = [
    ["STORE_CORS", env.STORE_CORS],
    ["ADMIN_CORS", env.ADMIN_CORS],
    ["AUTH_CORS", env.AUTH_CORS],
  ]

  for (const [name, value] of pairs) {
    if (!value || !value.trim()) {
      errors.push(`${name} must be set to real HTTPS origins in production`)
      continue
    }

    for (const bad of FORBIDDEN_SUBSTRINGS) {
      if (value.toLowerCase().includes(bad)) {
        errors.push(
          `${name} must not include "${bad}" in production (got: ${value})`
        )
      }
    }

    const origins = value.split(",").map((o) => o.trim()).filter(Boolean)
    for (const origin of origins) {
      if (origin.startsWith("http://") && !origin.includes("localhost")) {
        errors.push(
          `${name} origin "${origin}" should use https:// in production`
        )
      }
    }
  }

  return { ok: errors.length === 0, errors }
}

export function enforceProductionCorsOrThrow(
  env: CorsEnv = process.env
): void {
  const result = assertProductionCors(env)
  if (!result.ok) {
    throw new Error(
      [
        "Production CORS guard failed. Set STORE_CORS / ADMIN_CORS / AUTH_CORS",
        "to real storefront/admin domains before public go-live.",
        ...result.errors.map((e) => ` - ${e}`),
      ].join("\n")
    )
  }
}
