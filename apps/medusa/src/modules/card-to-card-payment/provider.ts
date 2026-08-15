/**
 * Offline card-to-card payment provider — Mashoodwear.
 * purpose --- authorize immediately so cart can complete; merchant verifies receipt via IG/TG ---
 */
import {
  AbstractPaymentProvider,
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
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"

/** Provider id registered on region: pp_card-to-card_card-to-card */
export const CARD_TO_CARD_PROVIDER_ID = "pp_card-to-card_card-to-card"

type InjectedDependencies = {
  logger: Logger
}

type CardToCardSessionData = {
  method: "card_to_card"
  ref: string
  amount: number | string
  currency_code: string
  authorized?: boolean
}

function createCardTransferRef(): string {
  return `ctc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export default class CardToCardPaymentProvider extends AbstractPaymentProvider {
  static identifier = "card-to-card"

  protected logger_: Logger

  constructor(container: InjectedDependencies, options: Record<string, unknown>) {
    super(container, options)
    this.logger_ = container.logger
  }

  async initiatePayment({
    amount,
    currency_code,
  }: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const ref = createCardTransferRef()
    const data: CardToCardSessionData = {
      method: "card_to_card",
      ref,
      amount: amount as number | string,
      currency_code: String(currency_code || "").toLowerCase(),
      authorized: true,
    }

    this.logger_.info(`Card-to-card initiate ref=${ref}`)

    return {
      id: ref,
      status: PaymentSessionStatus.AUTHORIZED,
      data,
    }
  }

  async authorizePayment({
    data,
  }: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: {
        ...(data || {}),
        method: "card_to_card",
        authorized: true,
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
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: {
        ...(input.data || {}),
        method: "card_to_card",
        amount: input.amount,
        currency_code: input.currency_code,
      },
    }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const session = (input.data || {}) as CardToCardSessionData
    if (session.authorized) {
      return { status: PaymentSessionStatus.AUTHORIZED }
    }
    return { status: PaymentSessionStatus.PENDING }
  }

  async getWebhookActionAndData(
    _payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return { action: "not_supported" }
  }
}
