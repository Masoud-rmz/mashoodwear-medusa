import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { LanguageSwitcher } from "../components/language-switcher"

export const config = defineWidgetConfig({
  zone: "topbar",
})

export default LanguageSwitcher
