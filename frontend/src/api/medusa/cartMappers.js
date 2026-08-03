/**
 * Map Medusa cart payloads to Mashhoodwear CartLineItem shapes.
 * purpose --- keep Cart/Checkout UI stable while line items come from Store Cart API ---
 */

/**
 * Read size/color from cart line variant option values or title.
 * @param {object} item
 * @returns {{ size: string, color: string }}
 */
export function extractCartLineOptions(item) {
  const optionValues = item?.variant_option_values;
  if (optionValues && typeof optionValues === "object" && !Array.isArray(optionValues)) {
    let size = "";
    let color = "";
    for (const [key, rawValue] of Object.entries(optionValues)) {
      const title = String(key).toLowerCase();
      const value = String(rawValue || "").trim();
      if (!value) {
        continue;
      }
      if (title.includes("size") || title.includes("سایز")) {
        size = value;
      } else if (
        title.includes("color") ||
        title.includes("colour") ||
        title.includes("رنگ")
      ) {
        color = value;
      }
    }
    if (size || color) {
      return {
        size: size || "One size",
        color: color || "Default",
      };
    }
  }

  const variantOptions = Array.isArray(item?.variant?.options)
    ? item.variant.options
    : [];
  if (variantOptions.length > 0) {
    let size = "";
    let color = "";
    for (const option of variantOptions) {
      const title = String(option?.option?.title || option?.title || "").toLowerCase();
      const value = String(option?.value || "").trim();
      if (!value) {
        continue;
      }
      if (title.includes("size") || title.includes("سایز")) {
        size = value;
      } else if (
        title.includes("color") ||
        title.includes("colour") ||
        title.includes("رنگ")
      ) {
        color = value;
      }
    }
    if (size || color) {
      return {
        size: size || "One size",
        color: color || "Default",
      };
    }
  }

  const title = String(item?.variant_title || item?.variant?.title || item?.subtitle || "").trim();
  if (title.includes(" / ")) {
    const [sizePart, colorPart] = title.split(" / ");
    return {
      size: (sizePart || "One size").trim() || "One size",
      color: (colorPart || "Default").trim() || "Default",
    };
  }

  return {
    size: title || "One size",
    color: "Default",
  };
}

/**
 * Unit price for display (Medusa store amount for the region currency).
 * @param {object} item
 * @returns {number}
 */
export function extractCartLineUnitPrice(item) {
  if (item?.unit_price !== undefined && item?.unit_price !== null) {
    return Number(item.unit_price) || 0;
  }
  if (item?.subtotal !== undefined && item?.quantity) {
    return Number(item.subtotal) / Number(item.quantity) || 0;
  }
  return 0;
}

/**
 * Map one Medusa cart line item → CartLineItem.
 * @param {object} item
 * @returns {import('../../types').CartLineItem}
 */
export function mapMedusaCartLineItem(item) {
  const { size, color } = extractCartLineOptions(item);
  return {
    lineItemId: String(item?.id || ""),
    productId: String(item?.product_id || item?.product?.id || ""),
    quantity: Math.max(0, Number(item?.quantity) || 0),
    selectedSize: size,
    selectedColor: color,
    name: String(item?.product_title || item?.product?.title || item?.title || ""),
    price: extractCartLineUnitPrice(item),
    slug: String(item?.product_handle || item?.product?.handle || ""),
    imageUrl: item?.thumbnail || item?.product?.thumbnail || null,
    variantId: item?.variant_id
      ? String(item.variant_id)
      : item?.variant?.id
        ? String(item.variant.id)
        : undefined,
  };
}

/**
 * Map full Medusa cart → UI line items (qty > 0 only).
 * @param {object | null | undefined} cart
 * @returns {import('../../types').CartLineItem[]}
 */
export function mapMedusaCartToLineItems(cart) {
  const items = Array.isArray(cart?.items) ? cart.items : [];
  return items
    .map(mapMedusaCartLineItem)
    .filter((line) => line.quantity > 0 && line.lineItemId);
}

/**
 * Sum quantities for header badge.
 * @param {import('../../types').CartLineItem[]} items
 * @returns {number}
 */
export function sumCartLineQuantities(items) {
  return items.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
}
