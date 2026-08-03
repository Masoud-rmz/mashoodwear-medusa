/**
 * Export Express MySQL products to a Medusa-oriented JSON snapshot.
 * purpose --- optional one-way migration aid; Medusa remains commerce SoT ---
 *
 * Usage (from repo root or backend/):
 *   node scripts/export-express-products-for-medusa.mjs
 *   npm run export:products-for-medusa
 *
 * Does not call Medusa Admin API — review the JSON then create products in
 * Medusa Admin or a separate Admin import script with a valid admin token.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(backendRoot, ".env") });

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function parseJsonArray(value) {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "mashoodwear",
    password: process.env.DB_PASS || "mashoodwear_dev",
    database: process.env.DB_NAME || "mashoodwear",
  });

  try {
    const [productRows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.description, p.price, p.status,
              p.is_featured, p.sizes, p.colors, c.slug AS category_slug, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.id ASC`
    );

    const [variantRows] = await pool.query(
      `SELECT product_id, size, color, stock
       FROM product_variants
       ORDER BY product_id, size, color`
    );

    const [imageRows] = await pool.query(
      `SELECT product_id, file_path, display_order
       FROM product_images
       ORDER BY product_id, display_order ASC, id ASC`
    );

    /** @type {Map<number, Array<{ size: string, color: string, stock: number }>>} */
    const variantsByProduct = new Map();
    for (const row of variantRows) {
      const list = variantsByProduct.get(row.product_id) ?? [];
      list.push({ size: row.size, color: row.color, stock: Number(row.stock) });
      variantsByProduct.set(row.product_id, list);
    }

    /** @type {Map<number, Array<{ filePath: string, displayOrder: number }>>} */
    const imagesByProduct = new Map();
    for (const row of imageRows) {
      const list = imagesByProduct.get(row.product_id) ?? [];
      list.push({
        filePath: row.file_path,
        displayOrder: Number(row.display_order),
      });
      imagesByProduct.set(row.product_id, list);
    }

    const products = productRows.map((row) => {
      const variants = variantsByProduct.get(row.id) ?? [];
      const sizes = [...new Set([
        ...parseJsonArray(row.sizes),
        ...variants.map((variant) => variant.size),
      ])];
      const colors = [...new Set([
        ...parseJsonArray(row.colors),
        ...variants.map((variant) => variant.color),
      ])];

      return {
        expressId: row.id,
        title: row.name,
        handle: row.slug,
        description: row.description || "",
        status: row.status === "active" ? "published" : "draft",
        isFeatured: Boolean(row.is_featured),
        category: row.category_slug
          ? { slug: row.category_slug, name: row.category_name }
          : null,
        /** Price in store currency units as stored in Express (IRT for this brand). */
        priceAmount: Number(row.price),
        currencyCode: "irt",
        options: [
          { title: "Size", values: sizes },
          { title: "Color", values: colors },
        ],
        variants: variants.map((variant) => ({
          title: `${variant.size} / ${variant.color}`,
          sku: `${row.slug}-${variant.size}-${variant.color}`.toLowerCase(),
          options: { Size: variant.size, Color: variant.color },
          manageInventory: true,
          inventoryQuantity: variant.stock,
          prices: [{ amount: Number(row.price), currency_code: "irt" }],
        })),
        images: (imagesByProduct.get(row.id) ?? []).map((image) => ({
          url: image.filePath,
          note: "Relative Express /uploads path — re-upload or map to Medusa file storage",
        })),
        tags: row.is_featured ? ["featured"] : [],
      };
    });

    const payload = {
      exportedAt: new Date().toISOString(),
      source: "mashoodwear-medusa Express MySQL",
      targetHint: "Medusa Admin / Admin API product create — review before import",
      productCount: products.length,
      products,
    };

    const outDir = path.join(backendRoot, "exports");
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, "medusa-products-from-express.json");
    await fs.writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

    console.log(`Exported ${products.length} products → ${outPath}`);
    console.log("Next: create/import in Medusa Admin (:9000/app). Express is no longer catalog SoT.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Export failed:", error.message || error);
  process.exitCode = 1;
});
