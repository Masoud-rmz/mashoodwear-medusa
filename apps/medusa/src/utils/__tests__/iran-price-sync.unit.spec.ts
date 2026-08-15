import { planIrrIrtSibling } from "../iran-price-sync"

describe("planIrrIrtSibling", () => {
  it("creates irr from irt at 1:10", () => {
    expect(
      planIrrIrtSibling([{ currency_code: "irt", amount: 1500 }])
    ).toEqual({ currency_code: "irr", amount: 15000 })
  })

  it("creates irt from irr at 1:10", () => {
    expect(
      planIrrIrtSibling([{ currency_code: "irr", amount: 15000 }])
    ).toEqual({ currency_code: "irt", amount: 1500 })
  })

  it("returns null when pair already matches", () => {
    expect(
      planIrrIrtSibling([
        { currency_code: "irt", amount: 100 },
        { currency_code: "irr", amount: 1000 },
      ])
    ).toBeNull()
  })

  it("fixes mismatched irr using preferred irt", () => {
    expect(
      planIrrIrtSibling(
        [
          { id: "p_irt", currency_code: "irt", amount: 200 },
          { id: "p_irr", currency_code: "irr", amount: 999 },
        ],
        "irt"
      )
    ).toEqual({ currency_code: "irr", amount: 2000, id: "p_irr" })
  })

  it("ignores price-list rows", () => {
    expect(
      planIrrIrtSibling([
        {
          currency_code: "irt",
          amount: 100,
          price_list_id: "plist_1",
        },
      ])
    ).toBeNull()
  })

  it("ignores quantity-tier rows", () => {
    expect(
      planIrrIrtSibling([
        { currency_code: "irt", amount: 100, min_quantity: 10 },
      ])
    ).toBeNull()
  })
})
