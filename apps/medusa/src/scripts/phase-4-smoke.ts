import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStubToken } from "../modules/iran-bank-payment/adapters/stub"
import { IRAN_BANK_PROVIDER_ID } from "../modules/iran-bank-payment/config"

type Json = Record<string, unknown>

const BASE_URL = process.env.IRAN_BANK_CALLBACK_BASE_URL || "http://localhost:9000"

const VALID_IRAN_ADDRESS = {
  first_name: "علی",
  last_name: "رضایی",
  address_1: "خیابان ولیعصر، پلاک ۱۲",
  city: "تهران",
  province: "Tehran",
  postal_code: "1234567890",
  phone: "09121234567",
  country_code: "ir",
}

async function storeFetch(
  publishableKey: string,
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; body: Json }> {
  const headers = new Headers(init.headers)
  headers.set("x-publishable-api-key", publishableKey)
  headers.set("content-type", "application/json")

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
  })

  let body: Json = {}
  const text = await response.text()

  if (text) {
    try {
      body = JSON.parse(text) as Json
    } catch {
      body = { raw: text }
    }
  }

  return { status: response.status, body }
}

function assertOk(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

export default async function phase4Smoke({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const regionModule = container.resolve(Modules.REGION)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)

  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token", "type"],
    filters: { type: "publishable" },
  })

  const publishableKey = apiKeys.find((k: any) => k?.token)?.token as string

  if (!publishableKey) {
    throw new Error("Phase 4 smoke: no publishable API key found.")
  }

  const regions = await regionModule.listRegions({ name: "Iran" }, { take: 1 })
  const iranRegion = regions[0]

  if (!iranRegion) {
    throw new Error('Phase 4 smoke: "Iran" region not found.')
  }

  const shippingOptions = await fulfillmentModule.listShippingOptions(
    {},
    { take: 50 }
  )
  const iranShipping = shippingOptions.find((option: any) => {
    const name = String(option?.name || "")
    const code = String(option?.type?.code || option?.data?.code || "")
    return (
      name.includes("ایران") ||
      name.toLowerCase().includes("iran") ||
      code.startsWith("iran-")
    )
  })

  if (!iranShipping) {
    throw new Error("Phase 4 smoke: Iran shipping option not found.")
  }

  const results: Record<string, unknown> = {}

  // C-01 — products + Iran region/currency
  const productsRes = await storeFetch(
    publishableKey,
    "/store/products?limit=1&fields=id,title,*variants.prices"
  )
  assertOk(productsRes.status === 200, `C-01 products failed: ${productsRes.status}`)
  const products = productsRes.body.products as any[]
  assertOk(Array.isArray(products) && products.length > 0, "C-01: no products")

  const regionRes = await storeFetch(
    publishableKey,
    `/store/regions/${iranRegion.id}`
  )
  assertOk(regionRes.status === 200, `C-01 region failed: ${regionRes.status}`)
  const regionBody = regionRes.body.region as any
  assertOk(
    String(regionBody?.currency_code).toLowerCase() === "irt",
    "C-01: Iran region currency should be irt"
  )
  results["C-01"] = {
    product_count: products.length,
    region_currency: regionBody?.currency_code,
  }

  // C-02 — cart create + line item
  const cartRes = await storeFetch(publishableKey, "/store/carts", {
    method: "POST",
    body: JSON.stringify({ region_id: iranRegion.id }),
  })
  assertOk(cartRes.status === 200, `C-02 cart create failed: ${cartRes.status}`)
  const cart = cartRes.body.cart as any
  const cartId = cart?.id as string
  assertOk(!!cartId, "C-02: cart id missing")

  const variant = products[0]?.variants?.[0]
  assertOk(variant?.id, "C-02: variant missing")

  const lineRes = await storeFetch(
    publishableKey,
    `/store/carts/${cartId}/line-items`,
    {
      method: "POST",
      body: JSON.stringify({ variant_id: variant.id, quantity: 1 }),
    }
  )
  assertOk(lineRes.status === 200, `C-02 line item failed: ${lineRes.status}`)
  results["C-02"] = { cart_id: cartId, variant_id: variant.id }

  // C-03 — Iran address validation (reject invalid, accept valid)
  const invalidAddressRes = await storeFetch(
    publishableKey,
    `/store/carts/${cartId}`,
    {
      method: "POST",
      body: JSON.stringify({
        shipping_address: {
          ...VALID_IRAN_ADDRESS,
          postal_code: "1234",
        },
        email: "phase4@example.local",
      }),
    }
  )
  assertOk(
    invalidAddressRes.status === 400,
    `C-03 invalid address should return 400, got ${invalidAddressRes.status}`
  )
  assertOk(
    invalidAddressRes.body.error === "iran_address_invalid",
    "C-03: expected iran_address_invalid error code"
  )

  const addressRes = await storeFetch(
    publishableKey,
    `/store/carts/${cartId}`,
    {
      method: "POST",
      body: JSON.stringify({
        shipping_address: VALID_IRAN_ADDRESS,
        billing_address: VALID_IRAN_ADDRESS,
        email: "phase4@example.local",
      }),
    }
  )
  assertOk(addressRes.status === 200, `C-03 valid address failed: ${addressRes.status}`)
  results["C-03"] = {
    invalid_error: invalidAddressRes.body.error,
    address_saved: true,
  }

  // C-04 — shipping options for cart
  const shippingRes = await storeFetch(
    publishableKey,
    `/store/shipping-options?cart_id=${cartId}`
  )
  assertOk(shippingRes.status === 200, `C-04 shipping options failed`)
  const shippingList = shippingRes.body.shipping_options as any[]
  assertOk(
    Array.isArray(shippingList) &&
      shippingList.some((o) => o.id === iranShipping.id),
    "C-04: Iran shipping option not returned for cart"
  )

  const shipMethodRes = await storeFetch(
    publishableKey,
    `/store/carts/${cartId}/shipping-methods`,
    {
      method: "POST",
      body: JSON.stringify({ option_id: iranShipping.id }),
    }
  )
  assertOk(shipMethodRes.status === 200, `C-04 add shipping failed`)
  results["C-04"] = {
    option_id: iranShipping.id,
    options_count: shippingList.length,
  }

  // C-05 — initiate Iran bank payment session
  const paymentRes = await storeFetch(
    publishableKey,
    `/store/payment-collections`,
    {
      method: "POST",
      body: JSON.stringify({ cart_id: cartId }),
    }
  )
  assertOk(paymentRes.status === 200, `C-05 payment collection failed`)
  const paymentCollection = paymentRes.body.payment_collection as any
  const collectionId = paymentCollection?.id as string
  assertOk(!!collectionId, "C-05: payment collection id missing")

  const sessionRes = await storeFetch(
    publishableKey,
    `/store/payment-collections/${collectionId}/payment-sessions`,
    {
      method: "POST",
      body: JSON.stringify({ provider_id: IRAN_BANK_PROVIDER_ID }),
    }
  )
  assertOk(sessionRes.status === 200, `C-05 payment session failed`)
  const paymentCollectionAfter = sessionRes.body.payment_collection as any
  const sessions = paymentCollectionAfter?.payment_sessions as any[]
  const paymentSession = sessions?.find(
    (s) => s?.provider_id === IRAN_BANK_PROVIDER_ID
  ) || sessions?.[0]
  const sessionData = paymentSession?.data as any
  assertOk(sessionData?.redirect_url, `C-05: redirect_url missing (session keys: ${Object.keys(sessionData || {}).join(",")})`)
  results["C-05"] = {
    provider_id: IRAN_BANK_PROVIDER_ID,
    redirect_url: sessionData.redirect_url,
    amount_irr: sessionData.amount_irr,
  }

  // C-06 — stub callback success + failed verify paths
  const ref = sessionData.ref as string
  const amountIrr = sessionData.amount_irr as number
  const successToken = createStubToken(
    process.env.IRAN_BANK_SECRET_KEY || "stub-secret-local-dev-only",
    ref,
    amountIrr
  )

  const callbackOkRes = await storeFetch(
    publishableKey,
    `/store/iran-bank/stub/callback?ref=${encodeURIComponent(ref)}&result=success&token=${encodeURIComponent(successToken)}&amount=${amountIrr}`
  )
  assertOk(callbackOkRes.status === 200, "C-06 callback success failed")
  assertOk(callbackOkRes.body.ok === true, "C-06 callback should be ok")

  const failRef = `${ref}-fail`
  const callbackFailRes = await storeFetch(
    publishableKey,
    `/store/iran-bank/stub/callback?ref=${encodeURIComponent(failRef)}&result=fail`
  )
  assertOk(
    callbackFailRes.status === 404 || callbackFailRes.body.ok === false,
    "C-06 failed callback should not report success"
  )
  results["C-06"] = {
    callback_ok: callbackOkRes.body.ok,
    callback_result: callbackOkRes.body.result,
  }

  // C-07 — cart/order retrieval with payment status fields
  const cartStatusRes = await storeFetch(
    publishableKey,
    `/store/carts/${cartId}?fields=*payment_collection,*payment_collection.payment_sessions`
  )
  assertOk(cartStatusRes.status === 200, "C-07 cart retrieve failed")
  results["C-07"] = {
    cart_id: cartId,
    has_payment_collection: !!(
      cartStatusRes.body.cart as any
    )?.payment_collection,
  }

  // C-08 — stable error codes (already tested in C-03)
  const validateRes = await storeFetch(
    publishableKey,
    "/store/iran/validate-address",
    {
      method: "POST",
      body: JSON.stringify({
        country_code: "ir",
        phone: "invalid",
      }),
    }
  )
  assertOk(validateRes.status === 400, "C-08 validate endpoint should reject")
  assertOk(
    validateRes.body.error === "iran_address_invalid",
    "C-08: stable error code missing"
  )
  results["C-08"] = {
    error: validateRes.body.error,
    fields: validateRes.body.fields,
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        base_url: BASE_URL,
        flows: results,
      },
      null,
      2
    )
  )
}
