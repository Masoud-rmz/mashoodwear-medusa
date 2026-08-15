import { validateIranAddress } from "../validate-address"

const validAddress = {
  first_name: "علی",
  last_name: "رضایی",
  address_1: "خیابان ولیعصر، پلاک ۱۲",
  city: "تهران",
  province: "Tehran",
  postal_code: "1234567890",
  phone: "09121234567",
  country_code: "ir",
}

describe("Iran address validation", () => {
  it("accepts a complete Iran address", () => {
    expect(validateIranAddress(validAddress)).toEqual({ ok: true })
  })

  it("accepts Persian province names", () => {
    expect(
      validateIranAddress({
        ...validAddress,
        province: "تهران",
      })
    ).toEqual({ ok: true })
  })

  it("skips validation for non-Iran countries", () => {
    expect(
      validateIranAddress({
        country_code: "de",
        postal_code: "abc",
      })
    ).toEqual({ ok: true })
  })

  it("rejects invalid postal code", () => {
    const result = validateIranAddress({
      ...validAddress,
      postal_code: "1234",
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe("iran_address_invalid")
      expect(result.fields.postal_code).toBe("iran_postal_code_invalid")
    }
  })

  it("rejects invalid mobile phone", () => {
    const result = validateIranAddress({
      ...validAddress,
      phone: "02112345678",
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.fields.phone).toBe("iran_phone_invalid")
    }
  })

  it("accepts +98 mobile format", () => {
    expect(
      validateIranAddress({
        ...validAddress,
        phone: "+989121234567",
      })
    ).toEqual({ ok: true })
  })

  it("rejects unknown province", () => {
    const result = validateIranAddress({
      ...validAddress,
      province: "Unknown Province",
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.fields.province).toBe("iran_province_invalid")
    }
  })

  it("requires core fields for Iran addresses", () => {
    const result = validateIranAddress({
      country_code: "ir",
      city: "تهران",
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.fields.first_name).toBe("iran_address_required")
      expect(result.fields.address_1).toBe("iran_address_required")
    }
  })
})
