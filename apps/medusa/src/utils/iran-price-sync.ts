import { convertIrrIrt, type IranCurrencyCode } from "./money"

export type SyncablePrice = {
  id?: string
  amount?: number | string | null
  currency_code?: string | null
  price_list_id?: string | null
  min_quantity?: number | string | null
  max_quantity?: number | string | null
}

export type SiblingPriceAction = {
  currency_code: IranCurrencyCode
  amount: number
  /** Existing price id when updating rather than creating */
  id?: string
}

function toNumber(amount: number | string | null | undefined): number | null {
  if (amount === null || amount === undefined || amount === "") {
    return null
  }
  const n = typeof amount === "number" ? amount : Number(amount)
  return Number.isFinite(n) ? n : null
}

/** Default (non–price-list) currency rows only — Iran Pack dual pricing. */
export function isBaseCurrencyPrice(price: SyncablePrice): boolean {
  if (price.price_list_id) {
    return false
  }
  const min = toNumber(price.min_quantity)
  const max = toNumber(price.max_quantity)
  if (min !== null && min !== 0) {
    return false
  }
  if (max !== null) {
    return false
  }
  return true
}

/**
 * Given prices on a price set, return the missing/mismatched sibling (irt↔irr).
 * When both exist and disagree, `preferred` (the currency that just changed) wins;
 * otherwise IRT (store display default) is the source of truth.
 */
export function planIrrIrtSibling(
  prices: SyncablePrice[],
  preferred?: IranCurrencyCode
): SiblingPriceAction | null {
  const base = prices.filter(isBaseCurrencyPrice)
  const irt = base.find((p) => p.currency_code?.toLowerCase() === "irt")
  const irr = base.find((p) => p.currency_code?.toLowerCase() === "irr")

  const irtAmount = toNumber(irt?.amount)
  const irrAmount = toNumber(irr?.amount)

  if (irtAmount === null && irrAmount === null) {
    return null
  }

  if (irtAmount !== null && irrAmount === null) {
    return {
      currency_code: "irr",
      amount: convertIrrIrt(irtAmount, "irt", "irr"),
    }
  }

  if (irrAmount !== null && irtAmount === null) {
    return {
      currency_code: "irt",
      amount: convertIrrIrt(irrAmount, "irr", "irt"),
    }
  }

  // Both present — enforce 1:10 using preferred / IRT as source of truth.
  const source: IranCurrencyCode =
    preferred ?? (irtAmount !== null ? "irt" : "irr")

  if (source === "irt" && irtAmount !== null) {
    const expectedIrr = convertIrrIrt(irtAmount, "irt", "irr")
    if (irrAmount === expectedIrr) {
      return null
    }
    return {
      currency_code: "irr",
      amount: expectedIrr,
      id: irr?.id,
    }
  }

  if (source === "irr" && irrAmount !== null) {
    const expectedIrt = convertIrrIrt(irrAmount, "irr", "irt")
    if (irtAmount === expectedIrt) {
      return null
    }
    return {
      currency_code: "irt",
      amount: expectedIrt,
      id: irt?.id,
    }
  }

  return null
}
