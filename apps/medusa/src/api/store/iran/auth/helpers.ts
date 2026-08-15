/**
 * Shared helpers for Iran Pack auth store routes.
 * purpose --- normalize phone, issue JWT, and hide synthetic email from UI ---
 */

import {
  ContainerRegistrationKeys,
  Modules,
  generateJwtToken,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import type { AuthIdentityDTO } from "@medusajs/types"
import {
  normalizeIranMobile,
  phoneToSyntheticEmail,
} from "../../../../modules/phone-auth/phone"
import {
  issueOtp,
  verifyOtp,
  resetOtpStore,
  hasPendingOtp,
} from "../../../../modules/phone-auth/otp-store"
import {
  loadSmsIrConfig,
  sendSmsIrVerify,
} from "../../../../modules/phone-auth/sms-ir"

export {
  normalizeIranMobile,
  phoneToSyntheticEmail,
  issueOtp,
  verifyOtp,
  resetOtpStore,
  hasPendingOtp,
  loadSmsIrConfig,
  sendSmsIrVerify,
}

export function getPhoneAuthJwtSecret(
  env: NodeJS.ProcessEnv = process.env
): string {
  return (
    env.PHONE_AUTH_JWT_SECRET ||
    env.JWT_SECRET ||
    "supersecret"
  )
}

/**
 * Issue a customer JWT for a linked auth identity.
 */
export function issueCustomerToken(
  container: MedusaContainer,
  authIdentity: AuthIdentityDTO,
  authProvider: string
): string {
  const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE) as {
    projectConfig: {
      http: {
        jwtSecret?: string
        jwtExpiresIn?: string | number
        jwtOptions?: Record<string, unknown>
      }
    }
  }
  const { http } = config.projectConfig
  const customerId = authIdentity.app_metadata?.customer_id as
    | string
    | undefined

  return generateJwtToken(
    {
      actor_id: customerId || "",
      actor_type: "customer",
      auth_identity_id: authIdentity.id,
      auth_provider: authProvider,
      app_metadata: {
        ...(authIdentity.app_metadata || {}),
        customer_id: customerId,
      },
    },
    {
      secret: http.jwtSecret,
      expiresIn: http.jwtExpiresIn || "24h",
      jwtOptions: http.jwtOptions as never,
    }
  )
}

/**
 * Look up phone-auth identity by normalized phone entity_id.
 */
export async function findPhoneAuthIdentity(
  container: MedusaContainer,
  phone: string
): Promise<AuthIdentityDTO | null> {
  const auth = container.resolve(Modules.AUTH) as {
    listAuthIdentities: (
      filters: Record<string, unknown>,
      config?: Record<string, unknown>
    ) => Promise<AuthIdentityDTO[]>
  }

  const identities = await auth.listAuthIdentities(
    {
      provider_identities: {
        provider: "phone-auth",
        entity_id: phone,
      },
    },
    {
      relations: ["provider_identities"],
    }
  )

  return identities[0] || null
}

/**
 * Look up emailpass identity by synthetic email.
 */
export async function findEmailPassAuthIdentity(
  container: MedusaContainer,
  phone: string
): Promise<AuthIdentityDTO | null> {
  const auth = container.resolve(Modules.AUTH) as {
    listAuthIdentities: (
      filters: Record<string, unknown>,
      config?: Record<string, unknown>
    ) => Promise<AuthIdentityDTO[]>
  }
  const email = phoneToSyntheticEmail(phone)

  const identities = await auth.listAuthIdentities(
    {
      provider_identities: {
        provider: "emailpass",
        entity_id: email,
      },
    },
    {
      relations: ["provider_identities"],
    }
  )

  return identities[0] || null
}

/**
 * Whether a customer account already exists for this phone.
 */
export async function customerExistsForPhone(
  container: MedusaContainer,
  phone: string
): Promise<boolean> {
  const identity = await findPhoneAuthIdentity(container, phone)
  return Boolean(identity?.app_metadata?.customer_id)
}
