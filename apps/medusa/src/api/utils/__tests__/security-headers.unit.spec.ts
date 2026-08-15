import { applySecurityHeaders } from "../security-headers"

describe("applySecurityHeaders", () => {
  function capture() {
    const headers: Record<string, string> = {}
    return {
      headers,
      res: {
        setHeader: (name: string, value: string) => {
          headers[name] = value
        },
      },
    }
  }

  it("sets baseline headers without HSTS on http", () => {
    const { headers, res } = capture()
    applySecurityHeaders({ protocol: "http", headers: {} }, res)
    expect(headers["X-Frame-Options"]).toBe("DENY")
    expect(headers["X-Content-Type-Options"]).toBe("nosniff")
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors")
    expect(headers["Strict-Transport-Security"]).toBeUndefined()
  })

  it("sets HSTS when X-Forwarded-Proto is https", () => {
    const { headers, res } = capture()
    applySecurityHeaders(
      { headers: { "x-forwarded-proto": "https" } },
      res
    )
    expect(headers["Strict-Transport-Security"]).toContain("max-age=")
  })
})
