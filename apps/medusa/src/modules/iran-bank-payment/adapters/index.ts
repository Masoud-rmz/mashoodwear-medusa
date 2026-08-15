import { createStubAdapter, type StubBankAdapter } from "./stub"
import type { IranBankPaymentOptions } from "../types"

export type IranBankAdapter = StubBankAdapter

export function resolveIranBankAdapter(
  options: IranBankPaymentOptions
): IranBankAdapter {
  const adapter = options.adapter || "stub"

  if (adapter === "stub") {
    return createStubAdapter({
      secretKey: options.secretKey,
      callbackBaseUrl: options.callbackBaseUrl,
    })
  }

  throw new Error(
    `Unsupported Iran bank adapter "${adapter}". Phase 3 only ships with stub.`
  )
}
