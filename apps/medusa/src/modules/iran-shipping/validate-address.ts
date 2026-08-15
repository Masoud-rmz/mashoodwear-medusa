import { isKnownIranProvince } from "./provinces"
import type { IranAddressInput, IranAddressValidationResult } from "./types"

const IRAN_COUNTRY = "ir"
const IRAN_POSTAL_CODE = /^\d{10}$/
const IRAN_MOBILE =
  /^(?:\+98|0098|98|0)?9\d{9}$/

function isIranCountry(countryCode: unknown): boolean {
  return String(countryCode || "").trim().toLowerCase() === IRAN_COUNTRY
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0
}

function normalizePhone(value: string): string {
  return value.replace(/[\s\-()]/g, "")
}

/**
 * Validate an Iran shipping/billing address.
 * Non-Iran country codes pass through without Iran-specific checks.
 */
export function validateIranAddress(
  address: IranAddressInput | null | undefined,
  options: { requireAll?: boolean } = {}
): IranAddressValidationResult {
  if (!address || typeof address !== "object") {
    return { ok: true }
  }

  const countryCode = address.country_code

  if (!countryCode || !isIranCountry(countryCode)) {
    return { ok: true }
  }

  const requireAll = options.requireAll ?? true
  const fields: NonNullable<
    Extract<IranAddressValidationResult, { ok: false }>["fields"]
  > = {}

  const requiredFields: Array<keyof IranAddressInput> = requireAll
    ? [
        "first_name",
        "last_name",
        "address_1",
        "city",
        "province",
        "postal_code",
        "phone",
      ]
    : []

  for (const key of requiredFields) {
    if (!hasText(address[key])) {
      fields[key] = "iran_address_required"
    }
  }

  if (hasText(address.postal_code)) {
    const postal = String(address.postal_code).trim().replace(/\D/g, "")
    if (!IRAN_POSTAL_CODE.test(postal)) {
      fields.postal_code = "iran_postal_code_invalid"
    }
  } else if (requireAll) {
    fields.postal_code = "iran_address_required"
  }

  if (hasText(address.phone)) {
    const phone = normalizePhone(String(address.phone))
    if (!IRAN_MOBILE.test(phone)) {
      fields.phone = "iran_phone_invalid"
    }
  } else if (requireAll) {
    fields.phone = "iran_address_required"
  }

  if (hasText(address.province)) {
    if (!isKnownIranProvince(String(address.province))) {
      fields.province = "iran_province_invalid"
    }
  } else if (requireAll) {
    fields.province = "iran_address_required"
  }

  if (Object.keys(fields).length > 0) {
    return {
      ok: false,
      error: "iran_address_invalid",
      message: "Iran address validation failed.",
      fields,
    }
  }

  return { ok: true }
}

/** Collect address objects from cart/customer request bodies. */
export function extractAddressesFromBody(
  body: Record<string, unknown> | null | undefined
): IranAddressInput[] {
  if (!body || typeof body !== "object") {
    return []
  }

  const addresses: IranAddressInput[] = []

  if (body.shipping_address && typeof body.shipping_address === "object") {
    addresses.push(body.shipping_address as IranAddressInput)
  }

  if (body.billing_address && typeof body.billing_address === "object") {
    addresses.push(body.billing_address as IranAddressInput)
  }

  // Customer address create/update — body is the address itself.
  if (
    !body.shipping_address &&
    !body.billing_address &&
    (body.country_code != null || body.address_1 != null)
  ) {
    addresses.push(body as IranAddressInput)
  }

  return addresses
}

export function validateAddressesInBody(
  body: Record<string, unknown> | null | undefined
): IranAddressValidationResult {
  const addresses = extractAddressesFromBody(body)

  for (const address of addresses) {
    const result = validateIranAddress(address)
    if (!result.ok) {
      return result
    }
  }

  return { ok: true }
}
