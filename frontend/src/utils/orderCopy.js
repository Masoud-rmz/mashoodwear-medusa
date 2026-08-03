import { formatPrice, formatPriceWithToman } from "./formatPrice.js";

/**
 * Build plain-text order summary for Instagram/Telegram DM.
 * @param {import('../types').CartLineItem[]} items
 * @returns {string}
 */
export function buildOrderCopyText(items) {
  const lines = items.map((item) => {
    const lineTotal = item.price * item.quantity;
    return [
      item.name,
      `Size: ${item.selectedSize}`,
      `Color: ${item.selectedColor}`,
      `Qty: ${item.quantity}`,
      `Unit: ${formatPrice(item.price)} Toman`,
      `Line total: ${formatPriceWithToman(lineTotal)}`,
    ].join("\n");
  });

  const grandTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return [
    "Mashoodwear order",
    "",
    ...lines.map((block, index) => `${index + 1}. ${block}`),
    "",
    `Grand total: ${formatPriceWithToman(grandTotal)}`,
  ].join("\n");
}
