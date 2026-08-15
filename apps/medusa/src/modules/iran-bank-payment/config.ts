import type { IranBankPaymentOptions } from "./types"

export function loadIranBankPaymentOptions(
  env: NodeJS.ProcessEnv = process.env
): IranBankPaymentOptions {
  return {
    adapter: (env.IRAN_BANK_ADAPTER || "stub") as IranBankPaymentOptions["adapter"],
    merchantId: env.IRAN_BANK_MERCHANT_ID || "stub-merchant",
    terminalId: env.IRAN_BANK_TERMINAL_ID || "stub-terminal",
    secretKey: env.IRAN_BANK_SECRET_KEY || "stub-secret-change-me",
    callbackBaseUrl:
      env.IRAN_BANK_CALLBACK_BASE_URL || "http://localhost:9000",
  }
}

export const IRAN_BANK_PROVIDER_ID = "pp_iran-bank_iran"
