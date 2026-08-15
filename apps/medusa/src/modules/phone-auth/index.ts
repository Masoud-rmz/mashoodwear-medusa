import PhoneAuthService from "./service"
import { ModuleProvider, Modules } from "@medusajs/framework/utils"

export default ModuleProvider(Modules.AUTH, {
  services: [PhoneAuthService],
})

export { normalizeIranMobile, phoneToSyntheticEmail, phoneToSmsIrMobile } from "./phone"
export { loadSmsIrConfig, sendSmsIrVerify } from "./sms-ir"
export { issueOtp, verifyOtp, resetOtpStore, hasPendingOtp } from "./otp-store"
