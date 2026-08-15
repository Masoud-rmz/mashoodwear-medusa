import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { syncIrrIrtForProducts } from "../../services/iran-price-sync"

/**
 * After product update / Edit prices save, ensure irt↔irr stay paired.
 */
updateProductsWorkflow.hooks.productsUpdated(
  async ({ products }, { container }) => {
    const ids = (products || []).map((p) => p.id).filter(Boolean)
    await syncIrrIrtForProducts(container, ids)
  }
)
