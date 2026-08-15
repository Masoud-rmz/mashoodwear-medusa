import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolveIranBankAdapter } from "../../../../../modules/iran-bank-payment/adapters"
import { loadIranBankPaymentOptions } from "../../../../../modules/iran-bank-payment/config"

function parseResult(value: unknown): "success" | "fail" {
  return value === "fail" ? "fail" : "success"
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const ref = String(req.query.ref || "")
  const token =
    typeof req.query.token === "string" ? req.query.token : undefined
  const result = parseResult(req.query.result)
  const amountIrr =
    typeof req.query.amount === "string"
      ? Number(req.query.amount)
      : undefined

  if (!ref) {
    res.status(400).json({ ok: false, error: "missing_ref" })
    return
  }

  const adapter = resolveIranBankAdapter(loadIranBankPaymentOptions())
  const record = adapter.applyCallback({
    ref,
    result,
    token,
    amountIrr,
    bankRef: result === "success" ? `STUB-${ref.slice(0, 8)}` : undefined,
  })

  if (!record) {
    res.status(404).json({ ok: false, error: "not_found" })
    return
  }

  res.json({
    ok: record.status === "success",
    ref,
    result: record.status,
    amount_irr: record.amountIrr,
    bank_ref: record.bankRef,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Record<string, unknown>
  const ref = String(body.ref || "")
  const token = typeof body.token === "string" ? body.token : undefined
  const result = parseResult(body.result)
  const amountIrr =
    body.amount_irr != null ? Number(body.amount_irr) : undefined

  if (!ref) {
    res.status(400).json({ ok: false, error: "missing_ref" })
    return
  }

  const adapter = resolveIranBankAdapter(loadIranBankPaymentOptions())
  const record = adapter.applyCallback({
    ref,
    result,
    token,
    amountIrr,
    bankRef: result === "success" ? `STUB-${ref.slice(0, 8)}` : undefined,
  })

  if (!record) {
    res.status(404).json({ ok: false, error: "not_found" })
    return
  }

  res.json({
    ok: record.status === "success",
    ref,
    result: record.status,
    amount_irr: record.amountIrr,
    bank_ref: record.bankRef,
  })
}
