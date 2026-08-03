/**
 * Create local SVG placeholder images for seeded products and collections.
 * Run after migrations so /uploads paths resolve in dev and production.
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.resolve(__dirname, "../uploads");

/** @type {Array<{ relativePath: string, label: string, accent?: string }>} */
const PLACEHOLDERS = [
  { relativePath: "products/street-hoodie-black.svg", label: "Street Hoodie" },
  { relativePath: "products/urban-tee-cream.svg", label: "Urban Tee" },
  { relativePath: "products/drift-cargo-pants.svg", label: "Cargo Pants" },
  { relativePath: "products/night-run-crop.svg", label: "Night Run Crop" },
  { relativePath: "products/logo-sticker-pack.svg", label: "Sticker Pack" },
  { relativePath: "collections/drift-cover.svg", label: "Drift", accent: "#330000" },
  { relativePath: "collections/urban-night-cover.svg", label: "Urban Night", accent: "#1a1a2e" },
];

/**
 * Build a dark placeholder SVG with a product/collection label.
 * @param {string} label
 * @param {string} [accent]
 * @returns {string}
 */
function buildPlaceholderSvg(label, accent = "#330000") {
  const safeLabel = label.replace(/[<>&"]/g, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000" role="img" aria-label="${safeLabel}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#bg)"/>
  <rect x="48" y="48" width="704" height="904" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
  <text x="400" y="500" fill="rgba(255,255,255,0.55)" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="36" letter-spacing="4">${safeLabel}</text>
  <text x="400" y="548" fill="rgba(255,255,255,0.28)" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="16" letter-spacing="6">MASHHOODWEAR</text>
</svg>`;
}

async function seedPlaceholderImages() {
  let created = 0;

  for (const item of PLACEHOLDERS) {
    const targetPath = path.join(uploadRoot, item.relativePath);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });

    try {
      await fs.access(targetPath);
      continue;
    } catch {
      // file missing — create it
    }

    await fs.writeFile(
      targetPath,
      buildPlaceholderSvg(item.label, item.accent),
      "utf8"
    );
    created += 1;
    console.log(`created: uploads/${item.relativePath}`);
  }

  console.log(
    created > 0
      ? `Placeholder images ready (${created} new).`
      : "Placeholder images already present."
  );
}

seedPlaceholderImages().catch((error) => {
  console.error("seed-placeholder-images failed:", error.message);
  process.exit(1);
});
