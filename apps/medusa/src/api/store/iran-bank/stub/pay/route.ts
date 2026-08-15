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
  const returnUrl =
    typeof req.query.return_url === "string" ? req.query.return_url : undefined

  if (!ref) {
    res.status(400).json({ ok: false, error: "missing_ref" })
    return
  }

  const adapter = resolveIranBankAdapter(loadIranBankPaymentOptions())
  const inquiry = adapter.inquiry(ref)

  if (!inquiry.ok) {
    res.status(404).json({ ok: false, error: "not_found" })
    return
  }

  adapter.applyCallback({
    ref,
    result,
    token,
    amountIrr: inquiry.amountIrr,
    bankRef: result === "success" ? `STUB-${ref.slice(0, 8)}` : undefined,
  })

  if (returnUrl) {
    const url = new URL(returnUrl)
    url.searchParams.set("ref", ref)
    url.searchParams.set("result", result)
    res.redirect(302, url.toString())
    return
  }

  res.json({
    ok: true,
    ref,
    result,
    amount_irr: inquiry.amountIrr,
  })
}
