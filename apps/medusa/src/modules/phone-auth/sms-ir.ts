/**
 * SMS.ir VERIFY client with stub mode for local development.
 * purpose --- never expose API key to the storefront; allow OTP without real SMS ---
 */

import { phoneToSmsIrMobile } from "./phone"

export type SmsIrSendResult =
  | { ok: true; stub: boolean; messageId?: number; cost?: number }
  | { ok: false; error: string }

export type SmsIrConfig = {
  apiKey?: string
  templateId?: number
  /** Force stub even when credentials exist */
  stub?: boolean
}

const SMS_IR_VERIFY_URL = "https://api.sms.ir/v1/send/verify"

/**
 * Resolve SMS.ir config from environment.
 */
export function loadSmsIrConfig(
  env: NodeJS.ProcessEnv = process.env
): SmsIrConfig {
  const stubFlag = String(env.SMS_IR_STUB || "").toLowerCase()
  const stubForced = ["1", "true", "yes"].includes(stubFlag)
  const apiKey = env.SMS_IR_API_KEY?.trim() || undefined
  const templateRaw = env.SMS_IR_TEMPLATE_ID?.trim()
  const templateId = templateRaw ? Number(templateRaw) : undefined

  return {
    apiKey,
    templateId:
      typeof templateId === "number" && Number.isFinite(templateId)
        ? templateId
        : undefined,
    stub: stubForced || !apiKey || !templateId,
  }
}

/**
 * Send a verification OTP via SMS.ir VERIFY API (or stub log).
 */
export async function sendSmsIrVerify(input: {
  phone: string
  code: string
  config?: SmsIrConfig
  logger?: { info: (msg: string) => void; error: (msg: string) => void }
}): Promise<SmsIrSendResult> {
  const config = input.config || loadSmsIrConfig()
  const mobile = phoneToSmsIrMobile(input.phone)
  const code = String(input.code).slice(0, 25)

  if (config.stub) {
    input.logger?.info(
      `[sms-ir stub] OTP for ${input.phone} (mobile=${mobile}): ${code}`
    )
    return { ok: true, stub: true }
  }

  try {
    const response = await fetch(SMS_IR_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/plain",
        "x-api-key": config.apiKey as string,
      },
      body: JSON.stringify({
        mobile,
        templateId: config.templateId,
        parameters: [{ name: "Code", value: code }],
      }),
    })

    const body = (await response.json().catch(() => ({}))) as {
      status?: number
      message?: string
      data?: { messageId?: number; cost?: number }
    }

    if (!response.ok || body.status !== 1) {
      const error =
        body.message || `SMS.ir verify failed (HTTP ${response.status})`
      input.logger?.error(`[sms-ir] ${error}`)
      return { ok: false, error }
    }

    return {
      ok: true,
      stub: false,
      messageId: body.data?.messageId,
      cost: body.data?.cost,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMS.ir network error"
    input.logger?.error(`[sms-ir] ${message}`)
    return { ok: false, error: message }
  }
}
