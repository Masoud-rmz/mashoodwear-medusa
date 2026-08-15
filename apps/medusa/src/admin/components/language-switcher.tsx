import { Select, Text } from "@medusajs/ui"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  IRAN_PACK_DEFAULT_LOCALE,
  IRAN_PACK_LOCALES,
  type IranPackLocale,
  getDocumentDirection,
  hasStoredLanguagePreference,
} from "../lib/locale"

type LanguageSwitcherProps = {
  /** Compact trigger for top bar; centered select on login. */
  variant?: "topbar" | "login"
}

function applyDefaultLocaleIfNeeded(changeLanguage: (code: string) => Promise<unknown>) {
  if (hasStoredLanguagePreference()) {
    return
  }

  // Persist default so refresh stays on fa (Medusa fallbackLng is en).
  try {
    window.localStorage.setItem("lng", IRAN_PACK_DEFAULT_LOCALE)
    document.cookie = `lng=${IRAN_PACK_DEFAULT_LOCALE};path=/;max-age=31536000;SameSite=Lax`
    document.documentElement.setAttribute(
      "dir",
      getDocumentDirection(IRAN_PACK_DEFAULT_LOCALE)
    )
  } catch {
    // ignore storage errors in private mode
  }

  void changeLanguage(IRAN_PACK_DEFAULT_LOCALE)
}

export function LanguageSwitcher({ variant = "topbar" }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()

  useEffect(() => {
    applyDefaultLocaleIfNeeded(i18n.changeLanguage.bind(i18n))
  }, [i18n])

  const current = IRAN_PACK_LOCALES.includes(i18n.language as IranPackLocale)
    ? (i18n.language as IranPackLocale)
    : IRAN_PACK_DEFAULT_LOCALE

  const handleChange = (code: string) => {
    void i18n.changeLanguage(code)
  }

  if (variant === "login") {
    return (
      <div className="flex flex-col items-center gap-y-2 pb-2">
        <Text size="small" className="text-ui-fg-subtle">
          {t("iranPack.languageSwitcher.label")}
        </Text>
        <Select size="small" value={current} onValueChange={handleChange}>
          <Select.Trigger className="w-[160px]">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {IRAN_PACK_LOCALES.map((code) => (
              <Select.Item key={code} value={code}>
                {t(`iranPack.languageSwitcher.${code}`)}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>
    )
  }

  return (
    <Select size="small" value={current} onValueChange={handleChange}>
      <Select.Trigger
        className="text-ui-fg-subtle hover:text-ui-fg-base h-7 min-w-[72px] border-0 bg-transparent px-2 shadow-none"
        aria-label={t("iranPack.languageSwitcher.label")}
      >
        <Select.Value>{t(`iranPack.languageSwitcher.${current}`)}</Select.Value>
      </Select.Trigger>
      <Select.Content align="end">
        {IRAN_PACK_LOCALES.map((code) => (
          <Select.Item key={code} value={code}>
            {t(`iranPack.languageSwitcher.${code}`)}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  )
}
