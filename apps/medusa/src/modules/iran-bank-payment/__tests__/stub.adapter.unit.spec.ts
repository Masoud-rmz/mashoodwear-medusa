import {
  createStubAdapter,
  createStubPaymentRef,
  createStubToken,
  stubTransactionStore,
} from "../adapters/stub"
import { toGatewayAmountIrr } from "../utils/amount"
import { redactPaymentLogPayload } from "../utils/logging"

const stubOptions = {
  secretKey: "test-secret",
  callbackBaseUrl: "http://localhost:9000",
}

describe("Iran bank stub adapter", () => {
  beforeEach(() => {
    stubTransactionStore.clear()
  })

  it("initiates a redirect URL and stores pending transaction", () => {
    const adapter = createStubAdapter(stubOptions)
    const ref = createStubPaymentRef()

    const result = adapter.initiate({
      ref,
      amountIrr: 10000,
      currencyCode: "irt",
    })

    expect(result.redirectUrl).toContain("/store/iran-bank/stub/pay")
    expect(result.amountIrr).toBe(10000)

    const inquiry = adapter.inquiry(ref)
    expect(inquiry.ok).toBe(true)

    if (inquiry.ok) {
      expect(inquiry.status).toBe("pending")
    }
  })

  it("authorizes a successful payment after callback", () => {
    const adapter = createStubAdapter(stubOptions)
    const ref = createStubPaymentRef()

    adapter.initiate({
      ref,
      amountIrr: 25000,
      currencyCode: "irr",
    })

    adapter.applyCallback({
      ref,
      result: "success",
      token: createStubToken(stubOptions.secretKey, ref, 25000),
      amountIrr: 25000,
    })

    const verified = adapter.verify({
      ref,
      expectedAmountIrr: 25000,
    })

    expect(verified.ok).toBe(true)
  })

  it("returns failed for unsuccessful callback", () => {
    const adapter = createStubAdapter(stubOptions)
    const ref = createStubPaymentRef()

    adapter.initiate({
      ref,
      amountIrr: 15000,
      currencyCode: "irr",
    })

    adapter.applyCallback({
      ref,
      result: "fail",
      token: createStubToken(stubOptions.secretKey, ref, 15000),
      amountIrr: 15000,
    })

    const verified = adapter.verify({
      ref,
      expectedAmountIrr: 15000,
    })

    expect(verified.ok).toBe(false)

    if (!verified.ok) {
      expect(verified.code).toBe("failed")
    }
  })

  it("detects amount mismatch", () => {
    const adapter = createStubAdapter(stubOptions)
    const ref = createStubPaymentRef()

    adapter.initiate({
      ref,
      amountIrr: 30000,
      currencyCode: "irr",
    })

    adapter.applyCallback({
      ref,
      result: "success",
      token: createStubToken(stubOptions.secretKey, ref, 30000),
      amountIrr: 30000,
    })

    const verified = adapter.verify({
      ref,
      expectedAmountIrr: 29999,
    })

    expect(verified.ok).toBe(false)

    if (!verified.ok) {
      expect(verified.code).toBe("amount_mismatch")
    }
  })

  it("is idempotent on repeated verify", () => {
    const adapter = createStubAdapter(stubOptions)
    const ref = createStubPaymentRef()

    adapter.initiate({
      ref,
      amountIrr: 5000,
      currencyCode: "irr",
    })

    adapter.applyCallback({
      ref,
      result: "success",
      token: createStubToken(stubOptions.secretKey, ref, 5000),
      amountIrr: 5000,
    })

    const first = adapter.verify({
      ref,
      expectedAmountIrr: 5000,
    })
    const second = adapter.verify({
      ref,
      expectedAmountIrr: 5000,
    })

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)

    if (first.ok && second.ok) {
      expect(second.alreadyVerified).toBe(true)
    }
  })
})

describe("Iran bank amount helpers", () => {
  it("converts irt cart totals to rials for gateway", () => {
    expect(toGatewayAmountIrr(1250, "irt")).toBe(12500)
    expect(toGatewayAmountIrr(1250, "irr")).toBe(1250)
  })
})

describe("Iran bank logging redaction", () => {
  it("redacts sensitive payment config keys", () => {
    const redacted = redactPaymentLogPayload({
      merchantId: "merchant-1",
      secretKey: "super-secret",
      nested: {
        api_key: "abc",
      },
    }) as Record<string, unknown>

    expect(redacted.secretKey).toBe("[REDACTED]")
    expect(redacted.merchantId).toBe("merchant-1")
    expect((redacted.nested as Record<string, unknown>).api_key).toBe(
      "[REDACTED]"
    )
  })
})
