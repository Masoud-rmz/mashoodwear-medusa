import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { PricingEvents } from "@medusajs/framework/utils"
import { syncIrrIrtFromPriceId } from "../services/iran-price-sync"

/**
 * When Admin saves an IRT or IRR price, create/update the sibling at 1:10.
 */
export default async function syncIranCurrencyPrices({
  event: { data },
  container,
}: SubscriberArgs<{ id: string } | { id: string }[]>) {
  const payloads = Array.isArray(data) ? data : [data]

  for (const payload of payloads) {
    const id = payload?.id
    if (!id) {
      continue
    }
    await syncIrrIrtFromPriceId(container, id)
  }
}

export const config: SubscriberConfig = {
  event: [PricingEvents.PRICE_CREATED, PricingEvents.PRICE_UPDATED],
}
