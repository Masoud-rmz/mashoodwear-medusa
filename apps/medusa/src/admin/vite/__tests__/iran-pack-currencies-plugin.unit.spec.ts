import {

  isPrebundledCurrencyChunk,

  looksLikeUnpatchedCurrencyMap,

  patchCurrenciesSource,

} from "../iran-pack-currencies-plugin"



describe("patchCurrenciesSource", () => {

  const sample = `export const currencies = {

  IRR: {

    code: "IRR",

    name: "Iranian Rial",

    symbol_native: "﷼",

    decimal_digits: 0

  },

  USD: {

    code: "USD",

    name: "US Dollar",

    symbol_native: "$",

    decimal_digits: 2

  },

}`



  it("injects IRT after IRR", () => {

    const patched = patchCurrenciesSource(sample)

    expect(patched).toContain("IRT:")

    expect(patched).toContain('code: "IRT"')

    expect(patched!.indexOf("IRT:")).toBeGreaterThan(patched!.indexOf("IRR:"))

  })



  it("is idempotent when IRT already present", () => {

    const once = patchCurrenciesSource(sample)!

    expect(patchCurrenciesSource(once)).toBeNull()

  })



  it("returns null when IRR is missing", () => {

    expect(patchCurrenciesSource("export const currencies = {}")).toBeNull()

  })

})



describe("currency map detection", () => {

  const map = `IRR: { code: "IRR", symbol_native: "﷼", decimal_digits: 0 },`



  it("detects unpatched maps", () => {

    expect(looksLikeUnpatchedCurrencyMap(map)).toBe(true)

    expect(looksLikeUnpatchedCurrencyMap(map + "\nIRT: {}")).toBe(false)

  })



  it("detects vite chunks on Windows paths", () => {

    const winPath =

      "F:\\medusa\\apps\\backend\\node_modules\\.vite\\deps\\chunk-ABC123.js"

    expect(isPrebundledCurrencyChunk(winPath, map)).toBe(true)

  })

})

