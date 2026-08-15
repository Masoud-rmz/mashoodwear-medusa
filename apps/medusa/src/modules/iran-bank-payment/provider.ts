import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import { resolveIranBankAdapter } from "./adapters"
import { createStubPaymentRef } from "./adapters/stub"
import type { IranBankPaymentOptions, IranBankPaymentSessionData } from "./types"
import { toGatewayAmountIrr } from "./utils/amount"
import { redactPaymentLogPayload } from "./utils/logging"

type InjectedDependencies = {
  logger: Logger
}

export default class IranBankPaymentProvider extends AbstractPaymentProvider<IranBankPaymentOptions> {
  static identifier = "iran-bank"

  protected logger_: Logger
  protected options_: IranBankPaymentOptions
  protected adapter_: ReturnType<typeof resolveIranBankAdapter>

  constructor(container: InjectedDependencies, options: IranBankPaymentOptions) {
    super(container, options)

    this.logger_ = container.logger
    this.options_ = options
    this.adapter_ = resolveIranBankAdapter(options)
  }

  static validateOptions(options: Record<string, unknown>): void {
    const adapter = String(options.adapter || "stub")

    if (!options.callbackBaseUrl) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Iran bank payment provider requires callbackBaseUrl."
      )
    }

    if (adapter === "stub") {
      return
    }

    for (const key of ["merchantId", "terminalId", "secretKey"] as const) {
      if (!options[key]) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Iran bank payment provider requires ${key}.`
        )
      }
    }
  }

  async initiatePayment({
    amount,
    currency_code,
    data,
    context,
  }: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const ref = createStubPaymentRef()
    const amountIrr = toGatewayAmountIrr(amount, currency_code)

    this.logger_.info(
      `Iran bank initiate ref=${ref} amount_irr=${amountIrr} currency=${currency_code} context=${JSON.stringify(
        redactPaymentLogPayload({
          adapter: this.options_.adapter,
          merchantId: this.options_.merchantId,
          terminalId: this.options_.terminalId,
          session_id: data?.session_id,
          customer_id: context?.customer?.id,
        })
      )}`
    )

    const initiated = this.adapter_.initiate({
      ref,
      amountIrr,
      currencyCode: currency_code.toLowerCase() as "irr" | "irt",
      sessionId: typeof data?.session_id === "string" ? data.session_id : undefined,
      returnUrl:
        typeof data?.return_url === "string" ? data.return_url : undefined,
    })

    const sessionData: IranBankPaymentSessionData = {
      ref: initiated.ref,
      amount_irr: initiated.amountIrr,
      currency_code: currency_code.toLowerCase(),
      redirect_url: initiated.redirectUrl,
      adapter: this.options_.adapter,
    }

    return {
      id: initiated.ref,
      status: PaymentSessionStatus.REQUIRES_MORE,
      data: sessionData,
    }
  }

  async authorizePayment({
    data,
  }: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const sessionData = (data || {}) as IranBankPaymentSessionData
    const ref = sessionData.ref

    if (!ref || sessionData.amount_irr == null) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Payment session is missing Iran gateway reference data."
      )
    }

    this.logger_.info(
      `Iran bank authorize ref=${ref} payload=${JSON.stringify(
        redactPaymentLogPayload({
          ref,
          amount_irr: sessionData.amount_irr,
          callback_result: sessionData.callback?.result,
        })
      )}`
    )

    const verified = this.adapter_.verify({
      ref,
      expectedAmountIrr: sessionData.amount_irr,
      callback: sessionData.callback,
    })

    if (!verified.ok) {
      return {
        status: PaymentSessionStatus.ERROR,
        data: {
          ...sessionData,
          error: verified.code,
          verified: false,
        },
      }
    }

    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: {
        ...sessionData,
        verified: true,
        bank_ref: verified.bankRef,
        amount_irr: verified.amountIrr,
        idempotent_replay: verified.alreadyVerified === true,
      },
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return { data: input.data || {} }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data || {} }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data || {} }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    return { data: input.data || {} }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: input.data || {} }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const current = (input.data || {}) as IranBankPaymentSessionData
    const amountIrr = toGatewayAmountIrr(input.amount, input.currency_code)

    return {
      status: PaymentSessionStatus.REQUIRES_MORE,
      data: {
        ...current,
        amount_irr: amountIrr,
        currency_code: input.currency_code.toLowerCase(),
      },
    }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const sessionData = (input.data || {}) as IranBankPaymentSessionData

    if (sessionData.verified) {
      return { status: PaymentSessionStatus.AUTHORIZED }
    }

    if (sessionData.error) {
      return { status: PaymentSessionStatus.ERROR }
    }

    return { status: PaymentSessionStatus.REQUIRES_MORE }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    this.logger_.info(
      `Iran bank webhook received payload=${JSON.stringify(
        redactPaymentLogPayload(payload.data)
      )}`
    )

    return { action: "not_supported" }
  }
}
