/**
 * Enable card-to-card payment provider on the Iran region (existing DBs).
 * Run: npx medusa exec ./src/scripts/enable-card-to-card-provider.ts
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { CARD_TO_CARD_PROVIDER_ID } from "../modules/card-to-card-payment"

export default async function enableCardToCardProvider({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const regionModule = container.resolve(Modules.REGION)
  const paymentModule = container.resolve(Modules.PAYMENT)

  const regions = await regionModule.listRegions({}, { take: 50 })
  const iran =
    regions.find((region) => region.name === "Iran") ||
    regions.find((region) => region.currency_code === "irt") ||
    regions[0]

  if (!iran) {
    logger.error("No region found to attach card-to-card provider.")
    return
  }

  const providers = await paymentModule.listPaymentProviders({
    id: [CARD_TO_CARD_PROVIDER_ID, "pp_iran-bank_iran", "pp_system_default"],
  })

  const providerIds = providers.map((provider) => provider.id)
  if (!providerIds.includes(CARD_TO_CARD_PROVIDER_ID)) {
    logger.warn(
      `Provider ${CARD_TO_CARD_PROVIDER_ID} not registered yet — restart Medusa, then re-run this script.`
    )
  }

  await regionModule.updateRegions(iran.id, {
    payment_providers: Array.from(
      new Set([...providerIds, CARD_TO_CARD_PROVIDER_ID, "pp_iran-bank_iran"])
    ),
  })

  logger.info(
    `Enabled payment providers on region ${iran.name} (${iran.id}): ${CARD_TO_CARD_PROVIDER_ID}`
  )
}
