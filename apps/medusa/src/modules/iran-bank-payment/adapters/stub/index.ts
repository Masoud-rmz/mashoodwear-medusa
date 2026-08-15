import { createHmac, randomUUID } from "crypto"
import type {
  GatewayCallbackPayload,
  GatewayInitiateInput,
  GatewayInitiateResult,
  GatewayVerifyInput,
  GatewayVerifyResult,
  IranBankPaymentOptions,
  TransactionInquiryResult,
} from "../../types"

export type StubTransactionRecord = {
  ref: string
  amountIrr: number
  currencyCode: string
  status: "pending" | "success" | "failed"
  bankRef?: string
  verifiedCount: number
}

type StubAdapterOptions = Pick<
  IranBankPaymentOptions,
  "secretKey" | "callbackBaseUrl"
>

export class StubTransactionStore {
  private readonly records = new Map<string, StubTransactionRecord>()

  create(record: StubTransactionRecord): void {
    this.records.set(record.ref, record)
  }

  get(ref: string): StubTransactionRecord | undefined {
    return this.records.get(ref)
  }

  applyCallback(payload: GatewayCallbackPayload): StubTransactionRecord | undefined {
    const record = this.records.get(payload.ref)

    if (!record) {
      return undefined
    }

    if (payload.amountIrr != null && payload.amountIrr !== record.amountIrr) {
      record.status = "failed"
      return record
    }

    record.status = payload.result === "success" ? "success" : "failed"
    record.bankRef = payload.bankRef || `STUB-${payload.ref.slice(0, 8)}`

    return record
  }

  clear(): void {
    this.records.clear()
  }
}

export const stubTransactionStore = new StubTransactionStore()

export function createStubToken(
  secretKey: string,
  ref: string,
  amountIrr: number
): string {
  return createHmac("sha256", secretKey)
    .update(`${ref}:${amountIrr}`)
    .digest("hex")
    .slice(0, 32)
}

export function verifyStubToken(
  secretKey: string,
  ref: string,
  amountIrr: number,
  token?: string
): boolean {
  if (!token) {
    return false
  }

  return token === createStubToken(secretKey, ref, amountIrr)
}

export function createStubAdapter(options: StubAdapterOptions) {
  const baseUrl = options.callbackBaseUrl.replace(/\/$/, "")

  return {
    initiate(input: GatewayInitiateInput): GatewayInitiateResult {
      stubTransactionStore.create({
        ref: input.ref,
        amountIrr: input.amountIrr,
        currencyCode: input.currencyCode,
        status: "pending",
        verifiedCount: 0,
      })

      const redirectUrl = new URL(`${baseUrl}/store/iran-bank/stub/pay`)
      redirectUrl.searchParams.set("ref", input.ref)
      redirectUrl.searchParams.set(
        "token",
        createStubToken(options.secretKey, input.ref, input.amountIrr)
      )

      if (input.returnUrl) {
        redirectUrl.searchParams.set("return_url", input.returnUrl)
      }

      return {
        ref: input.ref,
        redirectUrl: redirectUrl.toString(),
        amountIrr: input.amountIrr,
      }
    },

    applyCallback(payload: GatewayCallbackPayload): StubTransactionRecord | undefined {
      const record = stubTransactionStore.get(payload.ref)

      if (!record) {
        return undefined
      }

      if (
        payload.token &&
        !verifyStubToken(
          options.secretKey,
          payload.ref,
          record.amountIrr,
          payload.token
        )
      ) {
        record.status = "failed"
        return record
      }

      return stubTransactionStore.applyCallback(payload)
    },

    verify(input: GatewayVerifyInput): GatewayVerifyResult {
      const record = stubTransactionStore.get(input.ref)

      if (!record) {
        return {
          ok: false,
          code: "not_found",
          message: "Transaction reference was not found.",
        }
      }

      if (input.expectedAmountIrr !== record.amountIrr) {
        return {
          ok: false,
          code: "amount_mismatch",
          message: "Gateway amount does not match the cart amount.",
        }
      }

      if (input.callback) {
        const callbackRecord = this.applyCallback(input.callback)

        if (!callbackRecord) {
          return {
            ok: false,
            code: "not_found",
            message: "Transaction reference was not found.",
          }
        }

        if (callbackRecord.status === "failed") {
          return {
            ok: false,
            code: "failed",
            message: "Payment was rejected by the stub gateway.",
          }
        }
      }

      if (record.status === "pending") {
        return {
          ok: false,
          code: "pending",
          message: "Payment is still pending gateway confirmation.",
        }
      }

      if (record.status === "failed") {
        return {
          ok: false,
          code: "failed",
          message: "Payment was rejected by the stub gateway.",
        }
      }

      record.verifiedCount += 1

      return {
        ok: true,
        ref: record.ref,
        bankRef: record.bankRef || `STUB-${record.ref.slice(0, 8)}`,
        amountIrr: record.amountIrr,
        alreadyVerified: record.verifiedCount > 1,
      }
    },

    inquiry(ref: string): TransactionInquiryResult {
      const record = stubTransactionStore.get(ref)

      if (!record) {
        return {
          ok: false,
          code: "not_found",
          message: "Transaction reference was not found.",
        }
      }

      return {
        ok: true,
        ref: record.ref,
        status: record.status,
        amountIrr: record.amountIrr,
        bankRef: record.bankRef,
      }
    },
  }
}

export type StubBankAdapter = ReturnType<typeof createStubAdapter>

export function createStubPaymentRef(): string {
  return randomUUID()
}
