import {
  normalizeIranMobile,
  phoneToSmsIrMobile,
  phoneToSyntheticEmail,
} from "../phone"

describe("phone helpers", () => {
  it("normalizes common Iran mobile formats to 09xxxxxxxxx", () => {
    expect(normalizeIranMobile("09121234567")).toBe("09121234567")
    expect(normalizeIranMobile("+989121234567")).toBe("09121234567")
    expect(normalizeIranMobile("989121234567")).toBe("09121234567")
    expect(normalizeIranMobile("9121234567")).toBe("09121234567")
    expect(normalizeIranMobile("0912 123 4567")).toBe("09121234567")
  })

  it("rejects invalid numbers", () => {
    expect(normalizeIranMobile("02112345678")).toBeNull()
    expect(normalizeIranMobile("abc")).toBeNull()
    expect(normalizeIranMobile("")).toBeNull()
  })

  it("builds synthetic email and SMS.ir mobile", () => {
    expect(phoneToSyntheticEmail("09121234567")).toBe("09121234567@phone.local")
    expect(phoneToSmsIrMobile("09121234567")).toBe("9121234567")
  })
})
