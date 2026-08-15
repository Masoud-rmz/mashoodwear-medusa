import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  validateIranAddress,
  type IranAddressInput,
} from "../../../../modules/iran-shipping"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as IranAddressInput
  const result = validateIranAddress(body, { requireAll: true })

  if (!result.ok) {
    res.status(400).json({ ok: false, ...result })
    return
  }

  res.json({ ok: true })
}
