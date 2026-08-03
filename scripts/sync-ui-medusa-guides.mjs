/**
 * Sync numbered copies in doc/ui-medusa-guides/ from canonical sources.
 * purpose --- one pack for Agent when building / mounting a storefront UI on Medusa ---
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const packDirectory = path.join(projectRoot, "doc", "ui-medusa-guides");

const learningDocsSource = path.join(
  "C:",
  "Users",
  "KASRA",
  "Desktop",
  "AI learning docs",
  "05-Web-Development",
  "medusa-ui-testbed-then-custom-storefront.md"
);

const storefrontApiContractSource = path.join(
  "F:",
  "medusa-develop",
  "my-medusa-store",
  "docs",
  "phase-a-iran-pack",
  "storefront-api-contract.md"
);

/** @type {Array<{ from: string, to: string }>} */
const copies = [
  { from: path.join(projectRoot, "AGENTS.md"), to: path.join(packDirectory, "01-AGENTS.md") },
  {
    from: path.join(projectRoot, "doc", "PURPOSE.md"),
    to: path.join(packDirectory, "02-PURPOSE.md"),
  },
  {
    from: path.join(projectRoot, "doc", "implementation_plan.md"),
    to: path.join(packDirectory, "03-implementation_plan.md"),
  },
  {
    from: path.join(projectRoot, "doc", "admin-split.md"),
    to: path.join(packDirectory, "04-admin-split.md"),
  },
  {
    from: storefrontApiContractSource,
    to: path.join(packDirectory, "05-storefront-api-contract.md"),
  },
  {
    from: path.join(projectRoot, "doc", "storefront-feature-checklist.md"),
    to: path.join(packDirectory, "06-storefront-feature-checklist.md"),
  },
  {
    from: path.join(projectRoot, "doc", "storefront-extras-guide.md"),
    to: path.join(packDirectory, "07-storefront-extras-guide.md"),
  },
  {
    from: path.join(projectRoot, "doc", "auth-otp.md"),
    to: path.join(packDirectory, "08-auth-otp.md"),
  },
  {
    from: path.join(projectRoot, "doc", "payment-smoke-checklist.md"),
    to: path.join(packDirectory, "09-payment-smoke-checklist.md"),
  },
  {
    from: path.join(projectRoot, "doc", "handshake-learnings.md"),
    to: path.join(packDirectory, "10-handshake-learnings.md"),
  },
  {
    from: path.join(projectRoot, "doc", "tasks-medusa.md"),
    to: path.join(packDirectory, "11-tasks-medusa.md"),
  },
  {
    from: learningDocsSource,
    to: path.join(packDirectory, "12-medusa-ui-testbed-then-custom-storefront.md"),
  },
];

fs.mkdirSync(packDirectory, { recursive: true });

let copiedCount = 0;
for (const item of copies) {
  if (!fs.existsSync(item.from)) {
    console.warn(`skip missing source: ${item.from}`);
    continue;
  }
  fs.copyFileSync(item.from, item.to);
  copiedCount += 1;
  console.log(`synced ${path.basename(item.to)}`);
}

console.log(`ui-medusa-guides sync done (${copiedCount}/${copies.length})`);
