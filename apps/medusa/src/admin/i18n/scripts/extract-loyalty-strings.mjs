import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const loyaltyAdmin = path.resolve(
  __dirname,
  "../../../../../../node_modules/@medusajs/loyalty-plugin/.medusa/server/src/admin/index.mjs"
)

const code = fs.readFileSync(loyaltyAdmin, "utf8")
const patterns = [
  /children:\s*"([^"]{3,})"/g,
  /label:\s*"([^"]{3,})"/g,
  /title:\s*"([^"]{3,})"/g,
  /heading:\s*"([^"]{3,})"/g,
  /subtitle:\s*"([^"]{3,})"/g,
  /description:\s*"([^"]{3,})"/g,
]

const all = new Set()
for (const pattern of patterns) {
  for (const match of code.matchAll(pattern)) {
    all.add(match[1])
  }
}

console.log([...all].sort().join("\n"))
console.error("count:", all.size)
