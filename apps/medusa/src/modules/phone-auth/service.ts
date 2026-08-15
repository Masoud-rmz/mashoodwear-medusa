/**
 * Phone Authentication Module Provider (Medusa Auth).
 * purpose --- OTP login identity keyed by Iran mobile; SMS via event bus ---
 */

import {
  AbstractAuthModuleProvider,
  MedusaError,
} from "@medusajs/framework/utils"
import type { Logger } from "@medusajs/types"
import type {
  AuthenticationInput,
  AuthIdentityProviderService,
  AuthenticationResponse,
} from "@medusajs/types"
import jwt from "jsonwebtoken"
import { normalizeIranMobile } from "./phone"

type InjectedDependencies = {
  logger: Logger
  event_bus: {
    emit: (
      eventData: unknown,
      options?: unknown
    ) => Promise<unknown> | unknown
  }
}

type Options = {
  jwtSecret: string
}

class PhoneAuthService extends AbstractAuthModuleProvider {
  static DISPLAY_NAME = "Phone Auth"
  static identifier = "phone-auth"

  protected options_: Options
  protected logger_: Logger
  protected eventBus_: InjectedDependencies["event_bus"]

  constructor(container: InjectedDependencies, options: Options) {
    // @ts-expect-error Medusa AbstractAuthModuleProvider spreads container args
    super(...arguments)
    this.options_ = options
    this.logger_ = container.logger
    this.eventBus_ = container.event_bus
  }

  static validateOptions(options: Record<string, unknown>): void | never {
    if (!options.jwtSecret || typeof options.jwtSecret !== "string") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PHONE_AUTH jwtSecret is required"
      )
    }
  }

  async register(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const phone = normalizeIranMobile(
      (data.body as Record<string, unknown> | undefined)?.phone
    )

    if (!phone) {
      return { success: false, error: "Phone number is required" }
    }

    try {
      await authIdentityProviderService.retrieve({ entity_id: phone })
      return {
        success: false,
        error: "User with phone number already exists",
      }
    } catch {
      const user = await authIdentityProviderService.create({
        entity_id: phone,
      })
      return { success: true, authIdentity: user }
    }
  }

  async authenticate(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const phone = normalizeIranMobile(
      (data.body as Record<string, unknown> | undefined)?.phone
    )

    if (!phone) {
      return { success: false, error: "Phone number is required" }
    }

    try {
      await authIdentityProviderService.retrieve({ entity_id: phone })
    } catch {
      return {
        success: false,
        error: "User with phone number does not exist",
      }
    }

    const { hashedOTP, otp } = await this.generateOTP()

    await authIdentityProviderService.update(phone, {
      provider_metadata: { otp: hashedOTP },
    })

    await this.eventBus_.emit(
      {
        name: "phone-auth.otp.generated",
        data: { otp, phone },
      },
      {}
    )

    return { success: true, location: "otp" }
  }

  async validateCallback(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const query = (data.query || {}) as Record<string, unknown>
    const body = (data.body || {}) as Record<string, unknown>
    const phone = normalizeIranMobile(query.phone ?? body.phone)
    const otp = String(query.otp ?? body.otp ?? "")

    if (!phone || !otp) {
      return {
        success: false,
        error: "Phone number and OTP are required",
      }
    }

    let user
    try {
      user = await authIdentityProviderService.retrieve({ entity_id: phone })
    } catch {
      return {
        success: false,
        error: "User with phone number does not exist",
      }
    }

    const userProvider = user.provider_identities?.find(
      (provider) => provider.provider === this.identifier
    )
    if (!userProvider?.provider_metadata?.otp) {
      return {
        success: false,
        error: "User with phone number does not have a pending OTP",
      }
    }

    try {
      const decodedOTP = jwt.verify(
        userProvider.provider_metadata.otp as string,
        this.options_.jwtSecret
      ) as { otp: string }

      if (decodedOTP.otp !== otp) {
        throw new Error("Invalid OTP")
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message || "Invalid OTP" : "Invalid OTP",
      }
    }

    const updatedUser = await authIdentityProviderService.update(phone, {
      provider_metadata: { otp: null },
    })

    return { success: true, authIdentity: updatedUser }
  }

  async generateOTP(): Promise<{ hashedOTP: string; otp: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    this.logger_.info(`[phone-auth] Generated OTP for debug: ${otp}`)

    const hashedOTP = jwt.sign({ otp }, this.options_.jwtSecret, {
      expiresIn: "180s",
    })

    return { hashedOTP, otp }
  }
}

export default PhoneAuthService
