import path from "path"
import {
  loadEnv,
  defineConfig,
  Modules,
  ContainerRegistrationKeys,
} from '@medusajs/framework/utils'
import { iranPackCurrenciesPlugin } from "./src/admin/vite/iran-pack-currencies-plugin"
import { iranPackLoyaltyI18nPlugin } from "./src/admin/vite/iran-pack-loyalty-i18n-plugin"
import { loadIranBankPaymentOptions } from "./src/modules/iran-bank-payment/config"
import { enforceProductionCorsOrThrow } from "./src/api/utils/cors-production"

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Phase 5: block public go-live with localhost / docs CORS
enforceProductionCorsOrThrow()

const iranBankPaymentOptions = loadIranBankPaymentOptions()

const dashboardCurrenciesPath = path.resolve(
  __dirname,
  "../../node_modules/@medusajs/dashboard/src/lib/data/currencies.ts"
)
const iranAdminCurrenciesPath = path.resolve(
  __dirname,
  "src/admin/lib/currencies.ts"
)

module.exports = defineConfig({
  admin: {
    vite: () => ({
      plugins: [iranPackCurrenciesPlugin(), iranPackLoyaltyI18nPlugin()],
      resolve: {
        alias: [
          {
            find: "@iran-pack/medusa-currencies-base",
            replacement: dashboardCurrenciesPath,
          },
          {
            find: dashboardCurrenciesPath,
            replacement: iranAdminCurrenciesPath,
          },
          {
            find: "@medusajs/dashboard/src/lib/data/currencies",
            replacement: iranAdminCurrenciesPath,
          },
        ],
      },
    }),
  },
  plugins: [
    {
      resolve: "@medusajs/loyalty-plugin",
      options: {},
    },
  ],
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
      // Keep admin on emailpass only; customers get phone OTP + password.
      authMethodsPerActor: {
        user: ["emailpass"],
        customer: ["emailpass", "phone-auth"],
      },
    }
  },
  // Iran Pack modules — enable per phase (see src/modules/IRAN-PACK.md)
  modules: [
    {
      resolve: "@medusajs/medusa/auth",
      dependencies: [
        Modules.CACHE,
        ContainerRegistrationKeys.LOGGER,
        Modules.EVENT_BUS,
      ],
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            id: "emailpass",
          },
          {
            resolve: "./src/modules/phone-auth",
            id: "phone-auth",
            options: {
              jwtSecret:
                process.env.PHONE_AUTH_JWT_SECRET ||
                process.env.JWT_SECRET ||
                "supersecret",
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/iran-bank-payment",
            id: "iran",
            options: iranBankPaymentOptions,
          },
          {
            resolve: "./src/modules/card-to-card-payment",
            id: "card-to-card",
          },
        ],
      },
    },
    // { resolve: "./src/modules/iran-store-config" },   // phase 1+
    // { resolve: "./src/modules/iran-shipping" },       // phase 4 — validation via middleware + src/modules/iran-shipping
  ],
})
