import {
  RATE_LIMITS,
  checkRateLimit,
  resetRateLimitStore,
} from "../rate-limit"

describe("rate-limit", () => {
  beforeEach(() => {
    resetRateLimitStore()
  })

  it("allows requests under the limit", () => {
    const opts = { name: "t", limit: 3, windowMs: 60_000 }
    expect(checkRateLimit("1.1.1.1", opts, 1000).allowed).toBe(true)
    expect(checkRateLimit("1.1.1.1", opts, 1001).allowed).toBe(true)
    expect(checkRateLimit("1.1.1.1", opts, 1002).allowed).toBe(true)
  })

  it("blocks when limit exceeded and reports retry-after", () => {
    const opts = { name: "t", limit: 2, windowMs: 10_000 }
    checkRateLimit("2.2.2.2", opts, 0)
    checkRateLimit("2.2.2.2", opts, 1)
    const blocked = checkRateLimit("2.2.2.2", opts, 2)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSec).toBeGreaterThan(0)
  })

  it("resets after the window", () => {
    const opts = { name: "t", limit: 1, windowMs: 1000 }
    expect(checkRateLimit("3.3.3.3", opts, 0).allowed).toBe(true)
    expect(checkRateLimit("3.3.3.3", opts, 500).allowed).toBe(false)
    expect(checkRateLimit("3.3.3.3", opts, 1000).allowed).toBe(true)
  })

  it("isolates buckets by client and by name", () => {
    const a = { name: "auth", limit: 1, windowMs: 60_000 }
    const b = { name: "checkout", limit: 1, windowMs: 60_000 }
    expect(checkRateLimit("ip-a", a).allowed).toBe(true)
    expect(checkRateLimit("ip-a", a).allowed).toBe(false)
    expect(checkRateLimit("ip-b", a).allowed).toBe(true)
    expect(checkRateLimit("ip-a", b).allowed).toBe(true)
  })

  it("exposes sensible defaults for auth and checkout", () => {
    expect(RATE_LIMITS.authLogin.limit).toBeGreaterThan(0)
    expect(RATE_LIMITS.checkout.windowMs).toBe(60_000)
  })
})
