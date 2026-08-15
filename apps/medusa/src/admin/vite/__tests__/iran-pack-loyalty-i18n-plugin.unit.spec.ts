import {
  injectLoyaltyI18nImport,
  isLoyaltyAdminModule,
  looksLikeUnpatchedLoyaltyAdmin,
  patchLoyaltyAdminSource,
  patchLoyaltyMenuTranslationNs,
  patchLoyaltyRouteLabels,
  patchLoyaltyUiStrings,
  repairLegacyLoyaltyPatch,
  ensureLoyaltyI18nImportAtTop,
} from "../iran-pack-loyalty-i18n-plugin"

describe("iran-pack-loyalty-i18n-plugin", () => {
  it("detects loyalty admin bundle paths", () => {
    expect(
      isLoyaltyAdminModule(
        "/repo/node_modules/@medusajs/loyalty-plugin/.medusa/server/src/admin/index.mjs"
      )
    ).toBe(true)
    expect(
      isLoyaltyAdminModule(
        "/repo/apps/medusa/node_modules/.vite/deps/@medusajs_loyalty-plugin_admin.js"
      )
    ).toBe(true)
    expect(isLoyaltyAdminModule("/repo/some/other/file.mjs")).toBe(false)
  })

  it("detects unpatched loyalty admin source", () => {
    expect(
      looksLikeUnpatchedLoyaltyAdmin(`defineRouteConfig({ label: "Store Credits"`)
    ).toBe(false)

    expect(
      looksLikeUnpatchedLoyaltyAdmin(
        `defineRouteConfig({ label: "Store Credits", icon: X }); Gift Card`
      )
    ).toBe(true)
  })

  it("patches route labels with translationNs", () => {
    const input = `var config = defineRouteConfig({ label: "Store Credits", icon: StoreCreditIcon });`

    const patched = patchLoyaltyRouteLabels(input)
    expect(patched).toContain('label: "loyalty.menu.storeCredits"')
    expect(patched).toContain('translationNs: "translation"')
  })

  it("wraps hardcoded UI strings with i18n calls", () => {
    const input = injectLoyaltyI18nImport(`children: "Create Store Credit Account"`)
    const patched = patchLoyaltyUiStrings(input)

    expect(patched).toContain(
      '__iranPackI18n.t("loyalty.storeCreditAccounts.createTitle"'
    )
    expect(patched).toContain('defaultValue: "Create Store Credit Account"')
  })

  it("repairs legacy helper injection and keeps translations", () => {
    const legacy = `import { instance as __iranPackI18n } from "./chunk-ESFE44BG.js";
function __iranPackLoyaltyT(key, fallback) {
  return __iranPackI18n.t(key, { defaultValue: fallback });
}
children: __iranPackLoyaltyT("loyalty.menu.giftCards", "Gift Cards")`

    const repaired = repairLegacyLoyaltyPatch(legacy)
    expect(repaired).not.toContain("__iranPackLoyaltyT")
    expect(repaired).toContain(
      '__iranPackI18n.t("loyalty.menu.giftCards", { defaultValue: "Gift Cards" })'
    )
  })

  it("patches menuItemModule translationNs for sidebar labels", () => {
    const input = `var menuItemModule = {
  menuItems: [
    {
      label: "loyalty.menu.giftCards",
      icon: GiftCardIcon,
      path: "/gift-cards",
      nested: void 0,
      rank: void 0,
      translationNs: void 0
    }
  ]
};`

    const patched = patchLoyaltyMenuTranslationNs(input)
    expect(patched).toContain('translationNs: "translation"')
    expect(patched).not.toContain("translationNs: void 0")
  })

  it("removes bundled instance shim before adding chunk import", () => {
    const input = `import {
  LayoutComposer2
} from "./chunk-O5ADWNHI.js";
var instance = I18n.createInstance();
var __iranPackI18n = instance;
children: __iranPackI18n.t("loyalty.menu.giftCards", { defaultValue: "Gift Cards", ns: "translation" })`

    const patched = ensureLoyaltyI18nImportAtTop(input, "chunk-TEST")
    expect(patched.startsWith(
      'import { instance as __iranPackI18n } from "./chunk-TEST.js"'
    )).toBe(true)
    expect(patched).not.toContain("var __iranPackI18n = instance")
  })

  it("upgrades i18next fallback to shared chunk import in prebundle output", () => {
    const input = `import i18n from "i18next";
const __iranPackI18n = i18n;
children: __iranPackI18n.t("loyalty.menu.giftCards", { defaultValue: "Gift Cards", ns: "translation" })`

    const patched = ensureLoyaltyI18nImportAtTop(input, "chunk-TEST")
    expect(patched.startsWith(
      'import { instance as __iranPackI18n } from "./chunk-TEST.js"'
    )).toBe(true)
    expect(patched).not.toContain('import i18n from "i18next"')
  })

  it("strips esbuild-minified var stub before shared chunk import", () => {
    const input = `import { x } from "./chunk-OTHER.js";
var __iranPackI18n = { t: (key2, opts) => opts && opts.defaultValue || key2 };
children: __iranPackI18n.t("loyalty.menu.giftCards", { defaultValue: "Gift Cards", ns: "translation" })`

    const patched = ensureLoyaltyI18nImportAtTop(input, "chunk-TEST")
    expect(patched.startsWith(
      'import { instance as __iranPackI18n } from "./chunk-TEST.js"'
    )).toBe(true)
    expect(patched).not.toMatch(/var\s+__iranPackI18n\s*=/)
    expect((patched.match(/__iranPackI18n/g) || []).filter(() => true).length).toBeGreaterThan(0)
  })

  it("does not double-declare when import and minified stub both exist", () => {
    const input = `import { instance as __iranPackI18n } from "./chunk-TEST.js";
var __iranPackI18n = { t: (key2, opts) => opts && opts.defaultValue || key2 };
children: __iranPackI18n.t("loyalty.menu.giftCards", { defaultValue: "Gift Cards", ns: "translation" })`

    const patched = ensureLoyaltyI18nImportAtTop(input, "chunk-TEST")
    const declarations = patched.match(
      /(?:import \{ instance as __iranPackI18n \}|var\s+__iranPackI18n\s*=|const\s+__iranPackI18n\s*=)/g
    )
    expect(declarations).toHaveLength(1)
    expect(declarations?.[0]).toContain("import { instance as __iranPackI18n }")
  })

  it("patches prebundle-style loyalty admin code", () => {
    const input = `import { x } from "./chunk-TEST.js";
var config$3 = defineRouteConfig({
  label: "Store Credits",
  icon: StoreCreditIcon
});
children: "Gift Card Products"`

    const patched = patchLoyaltyAdminSource(input, "chunk-TEST")!
    expect(patched.startsWith('import { instance as __iranPackI18n } from "./chunk-TEST.js"')).toBe(true)
    expect(patched).toContain("__iranPackI18n.t(")
    expect(patched).not.toContain('label: "Store Credits"')
  })
})
