import IranBankPaymentProvider from "./provider"
import { ModuleProvider, Modules } from "@medusajs/framework/utils"

export default ModuleProvider(Modules.PAYMENT, {
  services: [IranBankPaymentProvider],
})
