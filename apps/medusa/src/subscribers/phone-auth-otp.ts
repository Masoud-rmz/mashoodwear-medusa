/**
 * Send OTP SMS when phone-auth emits phone-auth.otp.generated.
 * purpose --- keep SMS gateway out of the auth provider service ---
 */

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendSmsIrVerify, loadSmsIrConfig } from "../modules/phone-auth/sms-ir"

type OtpEvent = {
  otp: string
  phone: string
}

export default async function phoneAuthOtpHandler({
  event: { data },
  container,
}: SubscriberArgs<OtpEvent>) {
  const logger = container.resolve("logger")
  const result = await sendSmsIrVerify({
    phone: data.phone,
    code: data.otp,
    config: loadSmsIrConfig(),
    logger,
  })

  if (!result.ok) {
    logger.error(`[phone-auth subscriber] failed to send OTP: ${result.error}`)
  }
}

export const config: SubscriberConfig = {
  event: "phone-auth.otp.generated",
}
