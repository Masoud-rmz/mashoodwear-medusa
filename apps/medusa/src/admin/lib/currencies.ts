/**
 * Extends Medusa Admin's hardcoded currency map with Iran Pack currencies.
 * IRT (toman) is not in upstream @medusajs/dashboard — without this patch,
 * price cells crash on currencyInfo.symbol_native.
 *
 * Base map is loaded via @iran-pack/medusa-currencies-base (vite alias in
 * medusa-config.ts) to avoid circular resolution of this override file.
 */
export type { CurrencyInfo } from "@iran-pack/medusa-currencies-base"

import {
  currencies as baseCurrencies,
  getCurrencyDecimalDigits as baseGetCurrencyDecimalDigits,
  getCurrencySymbol as baseGetCurrencySymbol,
  type CurrencyInfo,
} from "@iran-pack/medusa-currencies-base"

/** Iranian Toman — display unit for Iran Pack (1 IRT = 10 IRR). */
export const IRT_CURRENCY: CurrencyInfo = {
  code: "IRT",
  name: "تومان",
  symbol_native: "ت",
  decimal_digits: 0,
}

export const currencies: Record<string, CurrencyInfo> = {
  ...baseCurrencies,
  IRT: IRT_CURRENCY,
}

function resolveCurrency(code: string): CurrencyInfo | undefined {
  return currencies[code.toUpperCase()]
}

export function getCurrencySymbol(code: string): string {
  const info = resolveCurrency(code)
  if (info) {
    return info.symbol_native
  }

  try {
    return baseGetCurrencySymbol(code)
  } catch {
    return code.toUpperCase()
  }
}

export function getCurrencyDecimalDigits(code: string): number {
  const info = resolveCurrency(code)
  if (info) {
    return info.decimal_digits
  }

  try {
    return baseGetCurrencyDecimalDigits(code)
  } catch {
    return 0
  }
}
