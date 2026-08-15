import type { IranBankPaymentOptions, TransactionInquiryResult } from "./types"
import { resolveIranBankAdapter } from "./adapters"

export type IranBankTransactionClient = {
  inquiry(ref: string): TransactionInquiryResult
}

export function createIranBankTransactionClient(
  options: IranBankPaymentOptions
): IranBankTransactionClient {
  const adapter = resolveIranBankAdapter(options)

  return {
    inquiry(ref: string): TransactionInquiryResult {
      return adapter.inquiry(ref)
    },
  }
}
