import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  planIrrIrtSibling,
  type SyncablePrice,
} from "../utils/iran-price-sync"
import type { IranCurrencyCode } from "../utils/money"

/** Prevent recursive sync when our own addPrices emits price events. */
const inFlightPriceSets = new Set<string>()

type PricingModule = {
  listPrices: (
    filters: Record<string, unknown>,
    config?: { relations?: string[]; take?: number | null }
  ) => Promise<
    Array<{
      id: string
      amount?: number | string
      currency_code?: string
      price_set_id?: string
      price_list_id?: string | null
      min_quantity?: number | string | null
      max_quantity?: number | string | null
    }>
  >
  retrievePriceSet: (
    id: string,
    config?: { relations?: string[] }
  ) => Promise<{
    id: string
    prices?: SyncablePrice[]
  }>
  addPrices: (data: {
    priceSetId: string
    prices: Array<{ amount: number; currency_code: string }>
  }) => Promise<unknown>
}

function asIranCurrency(code?: string | null): IranCurrencyCode | null {
  const normalized = code?.toLowerCase()
  if (normalized === "irt" || normalized === "irr") {
    return normalized
  }
  return null
}

/**
 * Ensure a price set has matching base irt + irr (1 toman = 10 rials).
 */
export async function syncIrrIrtForPriceSet(
  container: MedusaContainer,
  priceSetId: string,
  preferred?: IranCurrencyCode
): Promise<boolean> {
  if (!priceSetId || inFlightPriceSets.has(priceSetId)) {
    return false
  }

  const pricing = container.resolve(Modules.PRICING) as PricingModule
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  inFlightPriceSets.add(priceSetId)
  try {
    const priceSet = await pricing.retrievePriceSet(priceSetId, {
      relations: ["prices"],
    })

    const action = planIrrIrtSibling(priceSet.prices || [], preferred)
    if (!action) {
      return false
    }

    await pricing.addPrices({
      priceSetId,
      prices: [
        {
          amount: action.amount,
          currency_code: action.currency_code,
        },
      ],
    })

    logger.info(
      `Iran Pack: synced ${action.currency_code}=${action.amount} on price set ${priceSetId}`
    )
    return true
  } catch (error: any) {
    logger.warn(
      `Iran Pack: failed to sync irt/irr for ${priceSetId}: ${error?.message || error}`
    )
    return false
  } finally {
    inFlightPriceSets.delete(priceSetId)
  }
}

/**
 * After a single price create/update event, sync its price set sibling.
 */
export async function syncIrrIrtFromPriceId(
  container: MedusaContainer,
  priceId: string
): Promise<boolean> {
  if (!priceId) {
    return false
  }

  const pricing = container.resolve(Modules.PRICING) as PricingModule
  const [price] = await pricing.listPrices(
    { id: [priceId] },
    { take: 1 }
  )

  if (!price?.price_set_id) {
    return false
  }

  if (price.price_list_id) {
    return false
  }

  const preferred = asIranCurrency(price.currency_code)
  if (!preferred) {
    return false
  }

  return syncIrrIrtForPriceSet(container, price.price_set_id, preferred)
}

/**
 * Sync all variants linked to the given product ids.
 */
export async function syncIrrIrtForProducts(
  container: MedusaContainer,
  productIds: string[]
): Promise<number> {
  if (!productIds.length) {
    return 0
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "variants.price_set.id"],
    filters: { id: productIds },
  })

  let synced = 0
  for (const product of products as Array<{
    variants?: Array<{ price_set?: { id?: string } }>
  }>) {
    for (const variant of product.variants || []) {
      const priceSetId = variant.price_set?.id
      if (!priceSetId) {
        continue
      }
      if (await syncIrrIrtForPriceSet(container, priceSetId)) {
        synced += 1
      }
    }
  }

  return synced
}
