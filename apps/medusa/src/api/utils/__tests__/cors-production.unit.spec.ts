import { assertProductionCors } from "../cors-production"

describe("assertProductionCors", () => {
  it("skips non-production", () => {
    expect(
      assertProductionCors({
        NODE_ENV: "development",
        STORE_CORS: "http://localhost:8000",
      })
    ).toEqual({ ok: true, errors: [] })
  })

  it("rejects localhost and docs origins in production", () => {
    const result = assertProductionCors({
      NODE_ENV: "production",
      STORE_CORS: "http://localhost:8000",
      ADMIN_CORS: "https://docs.medusajs.com",
      AUTH_CORS: "https://shop.example.com",
    })
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes("STORE_CORS"))).toBe(true)
    expect(result.errors.some((e) => e.includes("docs.medusajs.com"))).toBe(
      true
    )
  })

  it("accepts real HTTPS origins in production", () => {
    expect(
      assertProductionCors({
        NODE_ENV: "production",
        STORE_CORS: "https://shop.example.com",
        ADMIN_CORS: "https://admin.example.com",
        AUTH_CORS: "https://shop.example.com,https://admin.example.com",
      })
    ).toEqual({ ok: true, errors: [] })
  })

  it("can be disabled with CORS_PRODUCTION_GUARD=0", () => {
    expect(
      assertProductionCors({
        NODE_ENV: "production",
        CORS_PRODUCTION_GUARD: "0",
        STORE_CORS: "http://localhost:8000",
      })
    ).toEqual({ ok: true, errors: [] })
  })
})
