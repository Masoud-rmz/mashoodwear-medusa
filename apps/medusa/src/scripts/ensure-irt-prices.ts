import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { updateStoresWorkflow } from "@medusajs/medusa/core-flows"
import { planIrrIrtSibling } from "../utils/iran-price-sync"

/**
 * Backfill: ensure every variant has matching irt+irr, and store currencies are Iran-only.
 *
 *   npx medusa exec ./src/scripts/ensure-irt-prices.ts
 */
export default async function ensureIrtPrices({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pricingModule = container.resolve(Modules.PRICING)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "supported_currencies.currency_code"],
  })

  const store = stores?.[0] as { id?: string } | undefined
  if (store?.id) {
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: {
          supported_currencies: [
            { currency_code: "irr", is_default: false },
            { currency_code: "irt", is_default: true },
          ],
        },
      },
    })
    logger.info(
      `Store ${store.id}: supported_currencies set to irr+irt (default irt).`
    )
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "handle",
      "variants.id",
      "variants.title",
      "variants.price_set.id",
      "variants.price_set.prices.id",
      "variants.price_set.prices.amount",
      "variants.price_set.prices.currency_code",
      "variants.price_set.prices.price_list_id",
      "variants.price_set.prices.min_quantity",
      "variants.price_set.prices.max_quantity",
    ],
  })

  let created = 0

  for (const product of products as Array<{
    handle?: string
    variants?: Array<{
      id: string
      title?: string
      price_set?: {
        id?: string
        prices?: Array<{
          id?: string
          amount?: number
          currency_code?: string
          price_list_id?: string | null
          min_quantity?: number | null
          max_quantity?: number | null
        }>
      }
    }>
  }>) {
    for (const variant of product.variants || []) {
      const priceSetId = variant.price_set?.id
      const prices = variant.price_set?.prices || []
      if (!priceSetId) {
        console.log(`SKIP ${product.handle}/${variant.id}: no price_set`)
        continue
      }

      const action = planIrrIrtSibling(prices)
      if (!action) {
        continue
      }

      await pricingModule.addPrices({
        priceSetId,
        prices: [
          {
            amount: action.amount,
            currency_code: action.currency_code,
          },
        ],
      })

      created += 1
      console.log(
        `SYNC ${action.currency_code}=${action.amount} → ${product.handle}/${variant.title || variant.id}`
      )
    }
  }

  console.log(`Done. Synced ${created} irt/irr price(s).`)
}
