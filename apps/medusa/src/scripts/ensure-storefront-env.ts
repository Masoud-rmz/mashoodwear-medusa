import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
} from "@medusajs/medusa/core-flows"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { resolve } from "path"

/**
 * purpose --- ensure local Vite storefront has a valid publishable key + region for this DB ---
 */
export default async function ensureStorefrontEnv({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const defaultSalesChannel = (salesChannels as Array<{ id: string }>)?.[0]
  if (!defaultSalesChannel?.id) {
    throw new Error("No sales channel found — run db:migrate / seed first.")
  }

  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token", "type", "revoked_at", "title"],
    filters: { type: "publishable" },
  })

  let publishable = (
    apiKeys as Array<{
      id: string
      token?: string
      revoked_at?: string | null
    }>
  ).find((key) => key?.token && !key.revoked_at)

  if (!publishable?.token) {
    const {
      result: [created],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Storefront",
            type: "publishable",
            created_by: "script",
          },
        ],
      },
    })
    publishable = created
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: created.id,
        add: [defaultSalesChannel.id],
      },
    })
    console.log("Created publishable API key and linked sales channel.")
  } else {
    // purpose --- key may exist without sales-channel link after partial seed ---
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: publishable.id,
        add: [defaultSalesChannel.id],
      },
    })
    console.log("Reused existing publishable API key; ensured sales-channel link.")
  }

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
  })
  const iranRegion =
    (regions as Array<{ id: string; name?: string; currency_code?: string }>).find(
      (region) =>
        region.name?.toLowerCase().includes("iran") ||
        region.currency_code === "irt" ||
        region.currency_code === "irr"
    ) || (regions as Array<{ id: string }>)[0]

  if (!iranRegion?.id) {
    throw new Error("No region found.")
  }

  const envPath = resolve(process.cwd(), "../../frontend/.env")
  if (!existsSync(envPath)) {
    throw new Error(`Missing ${envPath}`)
  }

  let envText = readFileSync(envPath, "utf8")
  const setLine = (key: string, value: string) => {
    const line = `${key}=${value}`
    if (envText.match(new RegExp(`^${key}=`, "m"))) {
      envText = envText.replace(new RegExp(`^${key}=.*$`, "m"), line)
    } else {
      envText = `${envText.trimEnd()}\n${line}\n`
    }
  }

  setLine("VITE_MEDUSA_PUBLISHABLE_KEY", publishable.token as string)
  setLine("VITE_MEDUSA_REGION_ID", iranRegion.id)
  setLine("VITE_MEDUSA_BACKEND_URL", "http://localhost:9000")
  setLine("VITE_COMMERCE_PROVIDER", "medusa")
  writeFileSync(envPath, envText, "utf8")

  console.log(`Updated frontend/.env`)
  console.log(`Token: ${publishable.token}`)
  console.log(`Region: ${iranRegion.id}`)
}
