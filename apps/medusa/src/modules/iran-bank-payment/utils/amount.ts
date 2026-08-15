import { BigNumberInput } from "@medusajs/framework/types"
import { convertIrrIrt, type IranCurrencyCode } from "../../../utils/money"

export function toNumericAmount(amount: BigNumberInput): number {
  if (typeof amount === "number") {
    return amount
  }

  if (typeof amount === "string") {
    return Number(amount)
  }

  if (amount && typeof amount === "object") {
    if ("value" in amount && amount.value != null) {
      return Number(amount.value)
    }

    if ("numeric" in amount && amount.numeric != null) {
      return Number(amount.numeric)
    }
  }

  return Number(amount)
}

export function toGatewayAmountIrr(
  amount: BigNumberInput,
  currencyCode: string
): number {
  const normalized = Math.trunc(toNumericAmount(amount))
  const code = currencyCode.toLowerCase() as IranCurrencyCode

  if (code === "irr") {
    return normalized
  }

  if (code === "irt") {
    return convertIrrIrt(normalized, "irt", "irr")
  }

  throw new Error(`Unsupported payment currency for Iran gateway: ${currencyCode}`)
}
