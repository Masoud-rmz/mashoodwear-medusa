import { loadSmsIrConfig, sendSmsIrVerify } from "../sms-ir"
import { issueOtp, resetOtpStore, verifyOtp } from "../otp-store"

describe("sms-ir stub + otp store", () => {
  beforeEach(() => {
    resetOtpStore()
  })

  it("uses stub when API key is missing", () => {
    const config = loadSmsIrConfig({
      SMS_IR_API_KEY: "",
      SMS_IR_TEMPLATE_ID: "123",
    } as NodeJS.ProcessEnv)
    expect(config.stub).toBe(true)
  })

  it("sends stub OTP without HTTP", async () => {
    const logs: string[] = []
    const result = await sendSmsIrVerify({
      phone: "09121234567",
      code: "123456",
      config: { stub: true },
      logger: {
        info: (msg) => logs.push(msg),
        error: () => undefined,
      },
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.stub).toBe(true)
    }
    expect(logs.some((line) => line.includes("123456"))).toBe(true)
  })

  it("issues and verifies OTP", () => {
    const secret = "test-secret"
    const { otp } = issueOtp("09121234567", secret, 60)
    expect(otp).toMatch(/^\d{6}$/)
    expect(verifyOtp("09121234567", otp, secret)).toEqual({ ok: true })
    expect(verifyOtp("09121234567", otp, secret).ok).toBe(false)
  })

  it("rejects wrong OTP", () => {
    issueOtp("09121234567", "test-secret", 60)
    expect(verifyOtp("09121234567", "000000", "test-secret")).toEqual({
      ok: false,
      error: "otp_invalid",
    })
  })
})
