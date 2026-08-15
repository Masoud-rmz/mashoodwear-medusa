import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStubToken } from "../modules/iran-bank-payment/adapters/stub"
import { loadIranBankPaymentOptions } from "../modules/iran-bank-payment/config"
import IranBankPaymentProvider from "../modules/iran-bank-payment/provider"

export default async function phase3Smoke({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const options = loadIranBankPaymentOptions()
  const provider = new IranBankPaymentProvider({ logger }, options)

  const initiated = await provider.initiatePayment({
    amount: 1500,
    currency_code: "irt",
    data: { session_id: "phase3-smoke-session" },
    context: {},
  })

  const sessionData = initiated.data as {
    ref: string
    amount_irr: number
    redirect_url: string
  }

  const pending = await provider.authorizePayment({
    data: sessionData,
    context: {},
  })

  if (pending.status !== "error") {
    throw new Error(
      `Expected pending payment to fail authorization, got ${pending.status}`
    )
  }

  const token = createStubToken(
    options.secretKey,
    sessionData.ref,
    sessionData.amount_irr
  )

  const authorized = await provider.authorizePayment({
    data: {
      ...sessionData,
      callback: {
        ref: sessionData.ref,
        result: "success",
        token,
        amountIrr: sessionData.amount_irr,
      },
    },
    context: {},
  })

  if (authorized.status !== "authorized") {
    throw new Error(
      `Expected authorized payment after stub callback, got ${authorized.status}`
    )
  }

  const replay = await provider.authorizePayment({
    data: authorized.data,
    context: {},
  })

  const paymentModule = container.resolve(Modules.PAYMENT)
  const providers = await paymentModule.listPaymentProviders({}, { take: 20 })

  console.log(
    JSON.stringify(
      {
        ok: true,
        provider_id: "pp_iran-bank_iran",
        initiate: {
          id: initiated.id,
          status: initiated.status,
          redirect_url: sessionData.redirect_url,
          amount_irr: sessionData.amount_irr,
        },
        pending_authorize_status: pending.status,
        authorized_status: authorized.status,
        idempotent_replay: replay.data?.idempotent_replay === true,
        registered_providers: providers.map((entry) => entry.id),
      },
      null,
      2
    )
  )
}
