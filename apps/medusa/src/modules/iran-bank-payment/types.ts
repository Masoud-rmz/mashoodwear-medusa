import type { IranCurrencyCode } from "../../utils/money"

export type IranBankAdapterName = "stub" | (string & {})

export type IranBankPaymentOptions = {
  adapter: IranBankAdapterName
  merchantId: string
  terminalId: string
  secretKey: string
  callbackBaseUrl: string
}

export type GatewayInitiateInput = {
  ref: string
  amountIrr: number
  currencyCode: IranCurrencyCode
  sessionId?: string
  returnUrl?: string
}

export type GatewayInitiateResult = {
  ref: string
  redirectUrl: string
  amountIrr: number
}

export type GatewayCallbackPayload = {
  ref: string
  result: "success" | "fail"
  bankRef?: string
  token?: string
  amountIrr?: number
}

export type GatewayVerifyInput = {
  ref: string
  expectedAmountIrr: number
  callback?: GatewayCallbackPayload
}

export type GatewayVerifyResult =
  | {
      ok: true
      ref: string
      bankRef: string
      amountIrr: number
      alreadyVerified?: boolean
    }
  | {
      ok: false
      code: "not_found" | "amount_mismatch" | "failed" | "invalid_token" | "pending"
      message: string
    }

export type TransactionInquiryResult =
  | {
      ok: true
      ref: string
      status: "pending" | "success" | "failed"
      amountIrr: number
      bankRef?: string
    }
  | {
      ok: false
      code: "not_found"
      message: string
    }

export type IranBankPaymentSessionData = {
  ref: string
  amount_irr: number
  currency_code: string
  redirect_url: string
  adapter: IranBankAdapterName
  callback?: GatewayCallbackPayload
  verified?: boolean
  bank_ref?: string
  error?: string
}
