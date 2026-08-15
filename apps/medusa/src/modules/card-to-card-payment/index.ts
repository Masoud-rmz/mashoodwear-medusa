import CardToCardPaymentProvider from "./provider"
import { ModuleProvider, Modules } from "@medusajs/framework/utils"

export default ModuleProvider(Modules.PAYMENT, {
  services: [CardToCardPaymentProvider],
})

export { CARD_TO_CARD_PROVIDER_ID } from "./provider"
