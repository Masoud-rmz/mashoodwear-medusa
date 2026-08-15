export type IranAddressInput = {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  company?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  country_code?: string | null
  province?: string | null
  postal_code?: string | null
  metadata?: Record<string, unknown> | null
}

export type IranAddressFieldError =
  | "iran_address_required"
  | "iran_postal_code_invalid"
  | "iran_phone_invalid"
  | "iran_province_invalid"
  | "iran_country_mismatch"

export type IranAddressValidationResult =
  | { ok: true }
  | {
      ok: false
      error: "iran_address_invalid"
      message: string
      fields: Partial<Record<keyof IranAddressInput | "address", IranAddressFieldError>>
    }
