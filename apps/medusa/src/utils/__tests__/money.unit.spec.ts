import { convertIrrIrt, formatMoney } from "../money"

describe("convertIrrIrt", () => {
  it("converts toman to rial", () => {
    expect(convertIrrIrt(10, "irt", "irr")).toBe(100)
  })

  it("converts rial to toman with floor", () => {
    expect(convertIrrIrt(105, "irr", "irt")).toBe(10)
  })
})

describe("formatMoney", () => {
  it("formats toman with Persian label", () => {
    expect(formatMoney(1500, "irt")).toBe("1,500 تومان")
  })

  it("formats rial with Persian label", () => {
    expect(formatMoney(15000, "irr")).toBe("15,000 ریال")
  })
})
