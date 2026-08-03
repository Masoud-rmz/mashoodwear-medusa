import { pool } from "../db/pool.js";
import { buildStockLabel } from "./productService.js";

/**
 * Load variants for product ids (shared shape for collection detail).
 * @param {number[]} productIds
 */
async function loadVariantsByProductIds(productIds) {
  if (productIds.length === 0) {
    return new Map();
  }

  const [variantRows] = await pool.query(
    `SELECT product_id, size, color, stock
     FROM product_variants
     WHERE product_id IN (?)
     ORDER BY product_id, size, color`,
    [productIds]
  );

  /** @type {Map<number, Array<{ size: string, color: string, stock: number }>>} */
  const map = new Map();
  for (const row of variantRows) {
    const list = map.get(row.product_id) ?? [];
    list.push({ size: row.size, color: row.color, stock: row.stock });
    map.set(row.product_id, list);
  }
  return map;
}

/**
 * Map product row to public card shape.
 * @param {object} row
 * @param {Array<{ size: string, color: string, stock: number }>} variants
 */
function mapProductItem(row, variants) {
  const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: Number(row.price),
    imageUrl: row.image_path || null,
    variants,
    totalStock,
    stockLabel: buildStockLabel(totalStock),
  };
}

/**
 * Count active/out_of_stock products per collection.
 * @param {number[]} collectionIds
 * @returns {Promise<Map<number, number>>}
 */
async function loadProductCounts(collectionIds) {
  if (collectionIds.length === 0) {
    return new Map();
  }

  const [rows] = await pool.query(
    `SELECT pc.collection_id, COUNT(DISTINCT p.id) AS product_count
     FROM product_collections pc
     INNER JOIN products p ON p.id = pc.product_id
     WHERE pc.collection_id IN (?)
       AND p.status IN ('active', 'out_of_stock')
     GROUP BY pc.collection_id`,
    [collectionIds]
  );

  /** @type {Map<number, number>} */
  const map = new Map();
  for (const row of rows) {
    map.set(row.collection_id, Number(row.product_count));
  }
  return map;
}

/**
 * List active brand collections for the public storefront.
 * @returns {Promise<{ items: object[] }>}
 */
export async function listActiveCollections() {
  const [rows] = await pool.query(
    `SELECT id, name, slug, cover_image_path, description, display_order
     FROM collections
     WHERE is_active = TRUE
     ORDER BY display_order ASC, name ASC`
  );

  const counts = await loadProductCounts(rows.map((row) => row.id));

  const items = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    coverImageUrl: row.cover_image_path,
    description: row.description || "",
    productCount: counts.get(row.id) ?? 0,
  }));

  return { items };
}

/**
 * Fetch one active collection with its products.
 * @param {string} slug
 * @returns {Promise<object | null>}
 */
export async function getCollectionBySlug(slug) {
  const [collectionRows] = await pool.query(
    `SELECT id, name, slug, cover_image_path, description
     FROM collections
     WHERE slug = ? AND is_active = TRUE
     LIMIT 1`,
    [slug]
  );

  if (collectionRows.length === 0) {
    return null;
  }

  const collection = collectionRows[0];

  const [productRows] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.price, p.status,
            (
              SELECT pi.file_path
              FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.display_order ASC, pi.id ASC
              LIMIT 1
            ) AS image_path
     FROM products p
     INNER JOIN product_collections pc ON pc.product_id = p.id
     WHERE pc.collection_id = ?
       AND p.status IN ('active', 'out_of_stock')
     ORDER BY p.updated_at DESC`,
    [collection.id]
  );

  const variantsMap = await loadVariantsByProductIds(productRows.map((row) => row.id));
  const products = productRows.map((row) =>
    mapProductItem(row, variantsMap.get(row.id) ?? [])
  );

  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    coverImageUrl: collection.cover_image_path,
    description: collection.description || "",
    productCount: products.length,
    products,
  };
}
