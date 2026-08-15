export type IranCurrencyCode = "irr" | "irt"

/**
 * Fixed ratio for the Iran Pack.
 * 1 toman (irt) = 10 rials (irr)
 */
export const IRT_TO_IRR_RATIO = 10

export function convertIrrIrt(
  amount: number,
  from: IranCurrencyCode,
  to: IranCurrencyCode
): number {
  if (from === to) return amount

  if (from === "irt" && to === "irr") {
    return amount * IRT_TO_IRR_RATIO
  }

  if (from === "irr" && to === "irt") {
    // Money values are stored as integers in this pack.
    return Math.floor(amount / IRT_TO_IRR_RATIO)
  }

  // Should be unreachable because IranCurrencyCode is a union.
  throw new Error(`Unsupported currency conversion: ${from} -> ${to}`)
}

const CURRENCY_LABELS: Record<IranCurrencyCode, string> = {
  irr: "ریال",
  irt: "تومان",
}

export function formatMoney(
  amount: number,
  currencyCode: IranCurrencyCode
): string {
  // Avoid Intl dependencies that may not exist in some environments.
  const normalized = Math.trunc(amount)
  const label = CURRENCY_LABELS[currencyCode]
  return `${normalized.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${label}`
}

