import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { resolve } from "path"

/**
 * Writes the first active publishable API key into the storefront .env.local.
 * Avoids logging the full token.
 */
export default async function syncStorefrontPublishableKey({
  container,
}: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token", "type", "revoked_at"],
    filters: { type: "publishable" },
  })

  const key = (apiKeys as Array<{ token?: string; revoked_at?: string | null }>).find(
    (k) => k?.token && !k.revoked_at
  )

  if (!key?.token) {
    throw new Error(
      "No active publishable API key found. Create one in Admin → Settings → Publishable API Keys."
    )
  }

  const envPath = resolve(process.cwd(), "../storefront/.env.local")

  if (!existsSync(envPath)) {
    throw new Error(`Storefront env not found at ${envPath}`)
  }

  const current = readFileSync(envPath, "utf8")
  const line = `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${key.token}`
  const next = current.match(/^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=/m)
    ? current.replace(/^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*$/m, line)
    : `${current.trimEnd()}\n${line}\n`

  writeFileSync(envPath, next, "utf8")

  const prefix = key.token.slice(0, 8)
  console.log(
    `Synced publishable key (${prefix}…) into apps/storefront/.env.local — restart the storefront.`
  )
}
