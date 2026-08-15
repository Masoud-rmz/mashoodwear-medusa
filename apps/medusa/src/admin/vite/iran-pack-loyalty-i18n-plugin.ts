import fs from "fs"
import path from "path"
import type { Plugin, ResolvedConfig } from "vite"

import loyaltyMap from "../i18n/json/loyalty-i18n-map.json" with { type: "json" }

const LOYALTY_ADMIN_MARKER =
  "@medusajs/loyalty-plugin/.medusa/server/src/admin/index.mjs"
const LOYALTY_PREBUNDLE_MARKER = "@medusajs_loyalty-plugin_admin.js"

const ROUTE_LABEL_PATCHES: Array<{
  label: string
  key: string
}> = [
  { label: "Store Credits", key: "loyalty.menu.storeCredits" },
  { label: "Gift Cards", key: "loyalty.menu.giftCards" },
  { label: "Gift Card Products", key: "loyalty.menu.giftCardProducts" },
]

const SKIP_STRINGS = new Set([
  "...",
  "Map",
  "JSON",
  "NaN",
  "bigint",
  "bool",
  "date",
  "denomination",
  "esc",
  "float",
  "int",
  "null",
  "string",
  "undefined",
  "url",
])

const LOYALTY_I18N_IMPORT = (chunk: string | null) =>
  chunk
    ? `import { instance as __iranPackI18n } from "./${chunk}.js";\n`
    : `import i18n from "i18next";\nconst __iranPackI18n = i18n;\n`

/** Inject shared Medusa i18n instance import once at file top. */
export function injectLoyaltyI18nImport(
  code: string,
  i18nChunkName: string | null = null
): string {
  return ensureLoyaltyI18nImportAtTop(code, i18nChunkName)
}
export function isLoyaltyAdminModule(id: string): boolean {
  const normalized = id.replace(/\\/g, "/")
  return (
    normalized.includes(LOYALTY_ADMIN_MARKER) ||
    normalized.includes(LOYALTY_PREBUNDLE_MARKER)
  )
}

/** Gate patches so unrelated chunks are never touched. */
export function looksLikeUnpatchedLoyaltyAdmin(code: string): boolean {
  return (
    code.includes("defineRouteConfig") &&
    code.includes("Gift Card") &&
    code.includes('label: "Store Credits"') &&
    !code.includes("__iranPackI18n.t(")
  )
}

/** Medusa Admin initializes this shared i18next instance (chunk hash varies). */
export function findI18nInstanceChunkName(depsDir: string): string | null {
  if (!fs.existsSync(depsDir)) {
    return null
  }

  for (const name of fs.readdirSync(depsDir)) {
    if (!name.startsWith("chunk-") || !name.endsWith(".js")) {
      continue
    }

    const content = fs.readFileSync(path.join(depsDir, name), "utf8")
    const hasI18nextSource =
      content.includes("i18next/dist/esm/i18next.js") ||
      content.includes("i18next/dist/esm/i18next")
    const exportsInstance = /export\s*\{\s*instance\b/.test(content)

    if (hasI18nextSource && exportsInstance) {
      return name.replace(/\.js$/, "")
    }
  }

  return null
}

/** Repair first-pass patch that inserted helper between import statements. */
export function repairLegacyLoyaltyPatch(code: string): string {
  let repaired = code

  if (repaired.includes("__iranPackLoyaltyT")) {
    repaired = repaired
      .replace(
        /import \{ instance as __iranPackI18n \} from "\.\/chunk-[^"]+\.js";\nfunction __iranPackLoyaltyT\(key, fallback\) \{\n  return __iranPackI18n\.t\(key, \{ defaultValue: fallback \}\);\n\}\n/,
        ""
      )
      .replace(
        /__iranPackLoyaltyT\("([^"]+)", "((?:\\.|[^"\\])*)"\)/g,
        '__iranPackI18n.t("$1", { defaultValue: "$2" })'
      )
  }

  return repaired
}

const LOYALTY_I18N_ESBUILD_STUB =
  'const __iranPackI18n = { t: (key, opts) => (opts && opts.defaultValue) || key };\n'

/** Matches stub/fallback bindings esbuild may minify (var/const + renamed params). */
const LOYALTY_I18N_STUB_PATTERN =
  /(?:var|let|const)\s+__iranPackI18n\s*=\s*\{\s*t:\s*\([^)]*\)\s*=>[^;]*\};\n?/g

/** True when a local stub/fallback binding for __iranPackI18n already exists. */
export function hasLoyaltyI18nStub(code: string): boolean {
  LOYALTY_I18N_STUB_PATTERN.lastIndex = 0
  return LOYALTY_I18N_STUB_PATTERN.test(code)
}

/** Remove stale i18n bindings before attaching the shared Medusa instance import. */
export function stripLoyaltyI18nShims(code: string): string {
  // Reset sticky/global regex lastIndex before reuse.
  LOYALTY_I18N_STUB_PATTERN.lastIndex = 0

  return code
    .replace(
      /import \{ instance as __iranPackI18n \} from "\.\/chunk-[^"]+\.js";\n/g,
      ""
    )
    .replace(
      /import i18n from "i18next";\nconst __iranPackI18n = i18n;\n/g,
      ""
    )
    .replace(/var __iranPackI18n = instance;\n/g, "")
    .replace(/const __iranPackI18n = i18n;\n/g, "")
    .replace(LOYALTY_I18N_STUB_PATTERN, "")
}

/** True when the bundle already uses the shared Medusa i18next instance import. */
export function hasLoyaltyChunkImport(code: string): boolean {
  return (
    code.includes('import { instance as __iranPackI18n }') &&
    !code.includes("var __iranPackI18n = instance")
  )
}

/** True when bundle calls __iranPackI18n without any declaration. */
export function needsLoyaltyI18nImport(code: string): boolean {
  return (
    code.includes("__iranPackI18n.t(") &&
    !hasLoyaltyChunkImport(code) &&
    !hasLoyaltyI18nStub(code)
  )
}

/** Pre-bundle output should share Medusa's i18next instance, not a standalone import. */
export function needsLoyaltyChunkImportUpgrade(
  code: string,
  i18nChunkName: string | null
): boolean {
  if (!i18nChunkName || !code.includes("__iranPackI18n.t(")) {
    return false
  }

  // Upgrade when shared import is missing, or a leftover stub would double-declare.
  return !hasLoyaltyChunkImport(code) || hasLoyaltyI18nStub(code)
}

/** Ensure shared i18n import exists once at the top of the bundle. */
export function ensureLoyaltyI18nImportAtTop(
  code: string,
  i18nChunkName: string | null
): string {
  if (!code.includes("__iranPackI18n.t(")) {
    return code
  }

  if (i18nChunkName) {
    if (hasLoyaltyChunkImport(code) && !hasLoyaltyI18nStub(code)) {
      return code
    }

    const withoutShims = stripLoyaltyI18nShims(code)
    return `${LOYALTY_I18N_IMPORT(i18nChunkName)}${withoutShims}`
  }

  if (hasLoyaltyChunkImport(code) && hasLoyaltyI18nStub(code)) {
    const withoutShims = stripLoyaltyI18nShims(code)
    return `${LOYALTY_I18N_ESBUILD_STUB}${withoutShims}`
  }

  if (hasLoyaltyChunkImport(code) || hasLoyaltyI18nStub(code)) {
    return code
  }

  const withoutShims = stripLoyaltyI18nShims(code)
  return `${LOYALTY_I18N_ESBUILD_STUB}${withoutShims}`
}

/**
 * Sidebar reads menuItemModule, not defineRouteConfig — without translationNs
 * Medusa shows the raw label (English before patch, i18n keys after patch).
 */
export function patchLoyaltyMenuTranslationNs(code: string): string {
  if (
    !code.includes("menuItemModule") ||
    !code.includes("translationNs: void 0")
  ) {
    return code
  }

  const menuBlockMatch = code.match(
    /(?:var|const) menuItemModule = \{[\s\S]*?\n\};/
  )
  if (!menuBlockMatch) {
    return code
  }

  const patchedBlock = menuBlockMatch[0].replaceAll(
    "translationNs: void 0",
    'translationNs: "translation"'
  )

  return code.replace(menuBlockMatch[0], patchedBlock)
}

/** Route sidebar labels support translationNs in Medusa Admin. */
export function patchLoyaltyRouteLabels(code: string): string {
  let patched = code

  for (const { label, key } of ROUTE_LABEL_PATCHES) {
    const pattern = new RegExp(
      `(defineRouteConfig\\(\\{\\s*label:\\s*)"${escapeRegExp(label)}"`,
      "g"
    )
    patched = patched.replace(
      pattern,
      `$1"${key}", translationNs: "translation"`
    )
  }

  return patched
}

/** Shorten menu fallback labels in already-patched bundles. */
export function patchLoyaltyMenuDefaultValues(code: string): string {
  return code.replace(
    /__iranPackI18n\.t\("loyalty\.menu\.giftCardProducts", \{ defaultValue: "Gift Card Products", ns: "translation" \}\)/g,
    '__iranPackI18n.t("loyalty.menu.giftCardProducts", { defaultValue: "Gift Products", ns: "translation" })'
  )
}

/** Replace hardcoded UI strings with runtime i18n lookups (loyalty plugin has no i18n). */
export function patchLoyaltyUiStrings(code: string): string {
  const entries = [...loyaltyMap]
    .filter((entry) => !SKIP_STRINGS.has(entry.en))
    .sort((a, b) => b.en.length - a.en.length)

  let patched = code

  for (const entry of entries) {
    const { en, key } = entry
    const fallback =
      "defaultValue" in entry && typeof entry.defaultValue === "string"
        ? entry.defaultValue
        : en
    const escaped = escapeRegExp(en)
    const replacement = `__iranPackI18n.t("${key}", { defaultValue: "${escapeJsString(fallback)}", ns: "translation" })`

    for (const prop of [
      "children",
      "label",
      "title",
      "heading",
      "subtitle",
      "description",
    ]) {
      const pattern = new RegExp(`(${prop}:\\s*)"${escaped}"`, "g")
      patched = patched.replace(pattern, `$1${replacement}`)
    }
  }

  return patched
}

export function patchLoyaltyAdminSource(
  code: string,
  i18nChunkName: string | null = null,
  options: { allowChunkImport?: boolean } = {}
): string | null {
  const allowChunkImport = options.allowChunkImport ?? i18nChunkName !== null
  const resolvedChunkName = allowChunkImport ? i18nChunkName : null
  if (
    !code.includes("defineRouteConfig") ||
    !code.includes("Gift Card")
  ) {
    return null
  }

  let patched = repairLegacyLoyaltyPatch(code)
  const hadLegacyHelper = code.includes("__iranPackLoyaltyT")
  const needsRouteLabels = patched.includes('label: "Store Credits"')
  const needsUiStrings =
    patched.includes('children: "Gift Card Products"') ||
    patched.includes('title: "Store Credit Accounts"') ||
    patched.includes('heading: "Gift Card Products"')
  const needsImport = needsLoyaltyI18nImport(patched)
  const needsMenuTranslationNs = patched.includes(
    "menuItemModule") &&
    patched.includes("translationNs: void 0")
  const needsMenuDefaultValue = patched.includes(
    'loyalty.menu.giftCardProducts", { defaultValue: "Gift Card Products"'
  )
  const needsChunkUpgrade = needsLoyaltyChunkImportUpgrade(
    patched,
    resolvedChunkName
  )

  if (
    !hadLegacyHelper &&
    !needsRouteLabels &&
    !needsUiStrings &&
    !needsImport &&
    !needsMenuTranslationNs &&
    !needsMenuDefaultValue &&
    !needsChunkUpgrade
  ) {
    return null
  }

  patched = patchLoyaltyRouteLabels(patched)
  patched = patchLoyaltyMenuTranslationNs(patched)
  patched = patchLoyaltyUiStrings(patched)
  patched = patchLoyaltyMenuDefaultValues(patched)
  patched = ensureLoyaltyI18nImportAtTop(patched, resolvedChunkName)

  return patched === code ? null : patched
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function escapeJsString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

/** Patch stale optimizeDeps loyalty chunks (same issue as IRT currencies). */
export async function patchViteDependencyLoyaltyAdminChunks(
  projectRoot: string
): Promise<number> {
  const candidateDirs = [
    path.join(projectRoot, "node_modules", ".vite", "deps"),
    path.join(projectRoot, "apps", "backend", "node_modules", ".vite", "deps"),
    path.join(
      projectRoot,
      "node_modules",
      "@dtc",
      "backend",
      "node_modules",
      ".vite",
      "deps"
    ),
  ]

  let patchedCount = 0

  for (const dir of candidateDirs) {
    if (!fs.existsSync(dir)) {
      continue
    }

    const i18nChunkName = findI18nInstanceChunkName(dir)
    const names = await fs.promises.readdir(dir)

    for (const name of names) {
      if (!name.includes("loyalty-plugin_admin") || !name.endsWith(".js")) {
        continue
      }

      const filePath = path.join(dir, name)
      const code = await fs.promises.readFile(filePath, "utf8")

      if (
        !looksLikeUnpatchedLoyaltyAdmin(code) &&
        !code.includes("__iranPackLoyaltyT") &&
        !needsLoyaltyI18nImport(code) &&
        !needsLoyaltyChunkImportUpgrade(code, i18nChunkName) &&
        !code.includes('defaultValue: "Gift Card Products", ns: "translation" }') &&
        !(code.includes("menuItemModule") &&
          code.includes("translationNs: void 0"))
      ) {
        continue
      }

      const patched = patchLoyaltyAdminSource(code, i18nChunkName, {
        allowChunkImport: true,
      })
      if (!patched) {
        continue
      }

      await fs.promises.writeFile(filePath, patched, "utf8")
      patchedCount += 1
    }
  }

  return patchedCount
}

function createEsbuildPatchPlugin() {
  return {
    name: "iran-pack-loyalty-i18n-esbuild",
    setup(build: {
      onLoad: (
        options: { filter: RegExp },
        callback: (args: { path: string }) => Promise<{
          contents: string
          loader: "js"
        } | null>
      ) => void
    }) {
      build.onLoad(
        { filter: /loyalty-plugin.*admin.*\.m?js$/ },
        async (args) => {
          const contents = await fs.promises.readFile(args.path, "utf8")
          // Source lives under node_modules — chunk-*.js only exists in .vite/deps.
          const patched = patchLoyaltyAdminSource(contents, null, {
            allowChunkImport: false,
          })

          if (!patched) {
            return null
          }

          return { contents: patched, loader: "js" }
        }
      )
    },
  }
}

/**
 * Wraps loyalty-plugin admin UI strings with i18next lookups.
 * optimizeDeps pre-bundles the plugin, so we patch during pre-bundle, serve,
 * and by rewriting stale .vite/deps chunks on disk.
 */
export function iranPackLoyaltyI18nPlugin(): Plugin {
  let resolvedRoot = process.cwd()

  return {
    name: "iran-pack-loyalty-i18n",
    enforce: "pre",
    config() {
      return {
        optimizeDeps: {
          esbuildOptions: {
            plugins: [createEsbuildPatchPlugin()],
          },
        },
      }
    },
    configResolved(config: ResolvedConfig) {
      resolvedRoot = config.root || process.cwd()
    },
    async buildStart() {
      await patchViteDependencyLoyaltyAdminChunks(resolvedRoot)
      await patchViteDependencyLoyaltyAdminChunks(process.cwd())
    },
    async configureServer() {
      const count =
        (await patchViteDependencyLoyaltyAdminChunks(resolvedRoot)) +
        (await patchViteDependencyLoyaltyAdminChunks(process.cwd()))

      if (count > 0) {
        console.info(
          `[iran-pack-loyalty-i18n] Patched loyalty admin in ${count} Vite dep chunk(s)`
        )
      }
    },
    transform(code, id) {
      const normalized = id.replace(/\\/g, "/")
      const isPrebundle = normalized.includes(LOYALTY_PREBUNDLE_MARKER)

      // Never patch plugin source under node_modules — only pre-bundled deps.
      if (!isPrebundle) {
        return null
      }

      if (
        !looksLikeUnpatchedLoyaltyAdmin(code) &&
        !code.includes("__iranPackLoyaltyT") &&
        !needsLoyaltyI18nImport(code) &&
        !needsLoyaltyChunkImportUpgrade(
          code,
          findI18nInstanceChunkName(path.dirname(normalized))
        ) &&
        !code.includes('defaultValue: "Gift Card Products", ns: "translation" }') &&
        !(code.includes("menuItemModule") &&
          code.includes("translationNs: void 0"))
      ) {
        return null
      }

      const i18nChunkName = findI18nInstanceChunkName(path.dirname(normalized))
      const patched = patchLoyaltyAdminSource(code, i18nChunkName, {
        allowChunkImport: true,
      })
      if (!patched) {
        return null
      }

      return { code: patched, map: null }
    },
  }
}
