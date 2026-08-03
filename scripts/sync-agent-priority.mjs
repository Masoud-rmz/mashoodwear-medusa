/**
 * Sync numbered copies in doc/agent-priority/ from canonical sources.
 * purpose --- keep the human-facing priority pack aligned after each session ---
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const packDirectory = path.join(projectRoot, "doc", "agent-priority");

const learningDocsSource = path.join(
  "C:",
  "Users",
  "KASRA",
  "Desktop",
  "AI learning docs",
  "05-Web-Development",
  "medusa-ui-testbed-then-custom-storefront.md"
);

/** @type {Array<{ from: string, to: string }>} */
const copies = [
  { from: path.join(projectRoot, "AGENTS.md"), to: path.join(packDirectory, "01-AGENTS.md") },
  {
    from: path.join(projectRoot, ".cursor", "rules", "mashoodwear-medusa.mdc"),
    to: path.join(packDirectory, "02-cursor-rule-mashoodwear-medusa.mdc"),
  },
  {
    from: path.join(projectRoot, "doc", "handshake-learnings.md"),
    to: path.join(packDirectory, "03-handshake-learnings.md"),
  },
  {
    from: path.join(projectRoot, "doc", "PURPOSE.md"),
    to: path.join(packDirectory, "04-PURPOSE.md"),
  },
  {
    from: path.join(projectRoot, "doc", "tasks-medusa.md"),
    to: path.join(packDirectory, "04-tasks-medusa.md"),
  },
  {
    from: learningDocsSource,
    to: path.join(packDirectory, "05-medusa-ui-testbed-then-custom-storefront.md"),
  },
  {
    from: path.join(projectRoot, "doc", "auth-otp.md"),
    to: path.join(packDirectory, "06-auth-otp.md"),
  },
  {
    from: path.join(projectRoot, "doc", "storefront-extras-guide.md"),
    to: path.join(packDirectory, "07-storefront-extras-guide.md"),
  },
  {
    from: path.join(projectRoot, "doc", "storefront-feature-checklist.md"),
    to: path.join(packDirectory, "08-storefront-feature-checklist.md"),
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

console.log(`agent-priority sync done (${copiedCount}/${copies.length})`);
