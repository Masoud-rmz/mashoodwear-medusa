import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { syncIrrIrtForProducts } from "../../services/iran-price-sync"

/**
 * After product create (Admin), ensure each variant has both irt and irr.
 */
createProductsWorkflow.hooks.productsCreated(
  async ({ products }, { container }) => {
    const ids = (products || []).map((p) => p.id).filter(Boolean)
    await syncIrrIrtForProducts(container, ids)
  }
)
