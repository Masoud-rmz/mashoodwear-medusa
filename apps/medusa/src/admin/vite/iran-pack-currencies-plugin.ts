import fs from "fs"
import path from "path"
import type { Plugin, ResolvedConfig } from "vite"

/** Markers for Medusa dashboard currency map modules (source + hashed chunks). */
const CURRENCY_MAP_MARKERS = ["lib/data/currencies", "currencies.ts"] as const

export const IRT_BLOCK = `  IRT: {
    code: "IRT",
    name: "Iranian Toman",
    symbol_native: "\\u062A",
    decimal_digits: 0
  },`

export function isCurrencyMapModule(id: string): boolean {
  const normalized = id.replace(/\\/g, "/")
  return CURRENCY_MAP_MARKERS.some((marker) => normalized.includes(marker))
}

/** True when source looks like Medusa's static currency map without IRT yet. */
export function looksLikeUnpatchedCurrencyMap(code: string): boolean {
  return (
    code.includes("IRR:") &&
    code.includes("symbol_native") &&
    !code.includes("IRT:")
  )
}

/** Pre-bundled deps use hashed chunk names; detect by IRR export without IRT. */
export function isPrebundledCurrencyChunk(id: string, code: string): boolean {
  const normalized = id.replace(/\\/g, "/")
  return (
    normalized.includes("node_modules/.vite/deps/chunk-") &&
    looksLikeUnpatchedCurrencyMap(code)
  )
}

/**
 * Inject IRT next to IRR in Medusa's static currency map source.
 * Returns null when already patched or not a currency map.
 */
export function patchCurrenciesSource(code: string): string | null {
  if (code.includes("IRT:")) {
    return null
  }

  if (!code.includes("IRR:")) {
    return null
  }

  const patched = code.replace(/(IRR:\s*\{[\s\S]*?\},)/, `$1\n${IRT_BLOCK}`)
  return patched === code ? null : patched
}

/**
 * Patch already-written Vite optimizeDeps chunks on disk.
 * Needed because stale .vite caches skip esbuild plugins, and Windows
 * path separators used to miss chunk detection in transform.
 */
export async function patchViteDependencyCurrencyChunks(
  projectRoot: string
): Promise<number> {
  const candidateDirs = [
    path.join(projectRoot, "node_modules", ".vite", "deps"),
    path.join(projectRoot, "apps", "backend", "node_modules", ".vite", "deps"),
  ]

  let patchedCount = 0

  for (const dir of candidateDirs) {
    if (!fs.existsSync(dir)) {
      continue
    }

    const names = await fs.promises.readdir(dir)
    for (const name of names) {
      if (!name.endsWith(".js")) {
        continue
      }

      const filePath = path.join(dir, name)
      const code = await fs.promises.readFile(filePath, "utf8")
      if (!looksLikeUnpatchedCurrencyMap(code)) {
        continue
      }

      const patched = patchCurrenciesSource(code)
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
    name: "iran-pack-currencies-esbuild",
    setup(build: {
      onLoad: (
        options: { filter: RegExp },
        callback: (args: { path: string }) => Promise<{
          contents: string
          loader: "ts" | "js" | "tsx" | "jsx"
        } | null>
      ) => void
    }) {
      // Currencies source + any hashed chunk; content gate avoids false positives.
      build.onLoad(
        { filter: /(chunk-[A-Za-z0-9]+\.m?js$|currencies\.(m?js|ts)$)/ },
        async (args) => {
          const contents = await fs.promises.readFile(args.path, "utf8")

          if (!looksLikeUnpatchedCurrencyMap(contents)) {
            return null
          }

          const patched = patchCurrenciesSource(contents)
          if (!patched) {
            return null
          }

          const loader = args.path.endsWith(".ts")
            ? "ts"
            : args.path.endsWith(".tsx")
              ? "tsx"
              : "js"
          return { contents: patched, loader }
        }
      )
    },
  }
}

/**
 * Injects IRT into Medusa Admin's static currency map.
 * optimizeDeps pre-bundles @medusajs/dashboard, so resolve.alias alone cannot
 * override currencies — this plugin patches the map during pre-bundle, serve,
 * and by rewriting stale .vite/deps chunks on disk.
 */
export function iranPackCurrenciesPlugin(): Plugin {
  let resolvedRoot = process.cwd()

  return {
    name: "iran-pack-currencies",
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
      await patchViteDependencyCurrencyChunks(resolvedRoot)
      await patchViteDependencyCurrencyChunks(process.cwd())
    },
    async configureServer() {
      // Stale optimizeDeps caches skip esbuild plugins — patch chunks on disk.
      const count =
        (await patchViteDependencyCurrencyChunks(resolvedRoot)) +
        (await patchViteDependencyCurrencyChunks(process.cwd()))
      if (count > 0) {
        console.info(
          `[iran-pack-currencies] Patched IRT into ${count} Vite dep chunk(s)`
        )
      }
    },
    transform(code, id) {
      if (!isCurrencyMapModule(id) && !isPrebundledCurrencyChunk(id, code)) {
        if (!looksLikeUnpatchedCurrencyMap(code)) {
          return null
        }
        // Fallback: content-based patch when path checks miss (Windows slashes).
        if (!id.replace(/\\/g, "/").includes("currencies") && !id.includes("chunk-")) {
          return null
        }
      }

      const patched = patchCurrenciesSource(code)
      if (!patched) {
        return null
      }

      return { code: patched, map: null }
    },
  }
}
