import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { LanguageSwitcher } from "../components/language-switcher"

/** Default fa + language pick on the login screen (design §8ج). */
export const config = defineWidgetConfig({
  zone: "login.after",
})

export default function LoginLocaleWidget() {
  return <LanguageSwitcher variant="login" />
}
