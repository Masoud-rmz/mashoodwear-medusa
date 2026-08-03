import { pool } from "../db/pool.js";

/**
 * Derive card stock label from total variant stock.
 * @param {number} totalStock
 * @returns {string}
 */
export function buildStockLabel(totalStock) {
  if (totalStock <= 0) {
    return "Sold out";
  }
  if (totalStock <= 3) {
    return `Only ${totalStock} left`;
  }
  return "In stock";
}

/**
 * Map a DB product row plus variants into the public API item shape.
 * @param {object} row
 * @param {Array<{ size: string, color: string, stock: number }>} variants
 * @returns {object}
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
 * Load variants for a list of product ids.
 * @param {number[]} productIds
 * @returns {Promise<Map<number, Array<{ size: string, color: string, stock: number }>>>}
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
 * Base SELECT for public product cards with first image path.
 * @param {string} whereClause
 * @param {unknown[]} params
 * @param {string} orderClause
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
async function queryProductRows(whereClause, params, orderClause, limit) {
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.price, p.status, p.is_featured, p.updated_at,
            (
              SELECT pi.file_path
              FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.display_order ASC, pi.id ASC
              LIMIT 1
            ) AS image_path
     FROM products p
     WHERE ${whereClause}
     ORDER BY ${orderClause}
     LIMIT ?`,
    [...params, limit]
  );
  return rows;
}

/**
 * Build public product items from raw rows.
 * @param {object[]} rows
 * @returns {Promise<object[]>}
 */
async function rowsToItems(rows) {
  const ids = rows.map((row) => row.id);
  const variantsMap = await loadVariantsByProductIds(ids);
  return rows.map((row) => mapProductItem(row, variantsMap.get(row.id) ?? []));
}

/**
 * Featured new-arrivals list with active-product backfill when fewer than 4 featured.
 * @param {number} limit
 * @returns {Promise<{ items: object[], total: number }>}
 */
async function listFeaturedWithBackfill(limit) {
  const featuredRows = await queryProductRows(
    "p.is_featured = TRUE AND p.status IN ('active', 'out_of_stock')",
    [],
    "p.featured_order IS NULL, p.featured_order ASC, p.updated_at DESC",
    limit
  );

  let combinedRows = [...featuredRows];

  if (featuredRows.length < 4) {
    const excludeIds = featuredRows.map((row) => row.id);
    const backfillLimit = limit - featuredRows.length;
    const notInClause =
      excludeIds.length > 0 ? "AND p.id NOT IN (?)" : "";
    const backfillRows = await queryProductRows(
      `p.status = 'active' ${notInClause}`,
      excludeIds.length > 0 ? [excludeIds] : [],
      "p.updated_at DESC",
      backfillLimit
    );
    combinedRows = [...featuredRows, ...backfillRows];
  }

  const items = await rowsToItems(combinedRows);
  return { items, total: items.length };
}

/**
 * List public products with optional filters.
 * @param {object} options
 * @returns {Promise<{ items: object[], total: number, page: number, limit: number }>}
 */
export async function listProducts(options = {}) {
  const {
    featured = false,
    category = null,
    size = null,
    color = null,
    minPrice = null,
    maxPrice = null,
    search = null,
    collection = null,
    page = 1,
    limit = 12,
  } = options;

  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
  const safePage = Math.max(Number(page) || 1, 1);

  if (featured) {
    const result = await listFeaturedWithBackfill(safeLimit);
    return { ...result, page: 1, limit: safeLimit };
  }

  const conditions = ["p.status IN ('active', 'out_of_stock')"];
  const params = [];

  if (category) {
    conditions.push("c.slug = ?");
    params.push(category);
  }

  if (search) {
    conditions.push("p.name LIKE ?");
    params.push(`%${search}%`);
  }

  if (minPrice !== null && minPrice !== undefined) {
    conditions.push("p.price >= ?");
    params.push(minPrice);
  }

  if (maxPrice !== null && maxPrice !== undefined) {
    conditions.push("p.price <= ?");
    params.push(maxPrice);
  }

  if (collection) {
    conditions.push(
      `EXISTS (
        SELECT 1 FROM product_collections pc
        INNER JOIN collections col ON col.id = pc.collection_id
        WHERE pc.product_id = p.id AND col.slug = ? AND col.is_active = TRUE
      )`
    );
    params.push(collection);
  }

  if (size) {
    conditions.push(
      `EXISTS (
        SELECT 1 FROM product_variants pv
        WHERE pv.product_id = p.id AND pv.size = ?
      )`
    );
    params.push(size);
  }

  if (color) {
    conditions.push(
      `EXISTS (
        SELECT 1 FROM product_variants pv
        WHERE pv.product_id = p.id AND pv.color = ?
      )`
    );
    params.push(color);
  }

  const whereClause = conditions.join(" AND ");
  const offset = (safePage - 1) * safeLimit;

  const joinCategory = category ? "INNER JOIN categories c ON c.id = p.category_id" : "";

  const [countRows] = await pool.query(
    `SELECT COUNT(DISTINCT p.id) AS total
     FROM products p
     ${joinCategory}
     WHERE ${whereClause}`,
    params
  );
  const total = Number(countRows[0]?.total ?? 0);

  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.price, p.status, p.is_featured, p.updated_at,
            (
              SELECT pi.file_path
              FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY pi.display_order ASC, pi.id ASC
              LIMIT 1
            ) AS image_path
     FROM products p
     ${joinCategory}
     WHERE ${whereClause}
     ORDER BY p.updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset]
  );

  const items = await rowsToItems(rows);
  return { items, total, page: safePage, limit: safeLimit };
}

/**
 * Load ordered image URLs for one product.
 * @param {number} productId
 * @returns {Promise<string[]>}
 */
async function loadProductImages(productId) {
  const [rows] = await pool.query(
    `SELECT file_path
     FROM product_images
     WHERE product_id = ?
     ORDER BY display_order ASC, id ASC`,
    [productId]
  );
  return rows.map((row) => row.file_path);
}

/**
 * Fetch a single public product by slug with images and variants.
 * @param {string} slug
 * @returns {Promise<object | null>}
 */
export async function getProductBySlug(slug) {
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.description, p.price, p.status, p.sizes, p.colors
     FROM products p
     WHERE p.slug = ? AND p.status IN ('active', 'out_of_stock')
     LIMIT 1`,
    [slug]
  );

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  const variantsMap = await loadVariantsByProductIds([row.id]);
  const variants = variantsMap.get(row.id) ?? [];
  const images = await loadProductImages(row.id);
  const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || "",
    price: Number(row.price),
    status: row.status,
    images,
    variants,
    totalStock,
    stockLabel: buildStockLabel(totalStock),
  };
}

/**
 * Append unique product rows until the target count is reached.
 * @param {object[]} combined
 * @param {object[]} candidates
 * @param {number} limit
 * @returns {object[]}
 */
function mergeUniqueProductRows(combined, candidates, limit) {
  const seenIds = new Set(combined.map((row) => row.id));
  const next = [...combined];

  for (const row of candidates) {
    if (next.length >= limit) {
      break;
    }
    if (seenIds.has(row.id)) {
      continue;
    }
    seenIds.add(row.id);
    next.push(row);
  }

  return next;
}

/**
 * Suggested products for a detail page: same category, then shared collections, then recent active.
 * @param {string} slug
 * @param {number} [limit=4]
 * @returns {Promise<{ items: object[] } | null>}
 */
export async function listSuggestedProducts(slug, limit = 4) {
  const safeLimit = Math.min(Math.max(Number(limit) || 4, 1), 12);

  const [sourceRows] = await pool.query(
    `SELECT p.id, p.category_id
     FROM products p
     WHERE p.slug = ? AND p.status IN ('active', 'out_of_stock')
     LIMIT 1`,
    [slug]
  );

  if (sourceRows.length === 0) {
    return null;
  }

  const source = sourceRows[0];
  /** @type {object[]} */
  let combinedRows = [];

  const categoryRows = await queryProductRows(
    "p.status IN ('active', 'out_of_stock') AND p.category_id = ? AND p.id != ?",
    [source.category_id, source.id],
    "p.updated_at DESC",
    safeLimit
  );
  combinedRows = mergeUniqueProductRows(combinedRows, categoryRows, safeLimit);

  if (combinedRows.length < safeLimit) {
    const excludeIds = [source.id, ...combinedRows.map((row) => row.id)];
    const remaining = safeLimit - combinedRows.length;
    const [collectionRows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.price, p.status, p.is_featured, p.updated_at,
              (
                SELECT pi.file_path
                FROM product_images pi
                WHERE pi.product_id = p.id
                ORDER BY pi.display_order ASC, pi.id ASC
                LIMIT 1
              ) AS image_path
       FROM products p
       WHERE p.status IN ('active', 'out_of_stock')
         AND p.id NOT IN (?)
         AND EXISTS (
           SELECT 1
           FROM product_collections pc
           WHERE pc.product_id = p.id
             AND pc.collection_id IN (
               SELECT source_pc.collection_id
               FROM product_collections source_pc
               WHERE source_pc.product_id = ?
             )
         )
       ORDER BY p.updated_at DESC
       LIMIT ?`,
      [excludeIds, source.id, remaining]
    );
    combinedRows = mergeUniqueProductRows(combinedRows, collectionRows, safeLimit);
  }

  if (combinedRows.length < safeLimit) {
    const excludeIds = [source.id, ...combinedRows.map((row) => row.id)];
    const remaining = safeLimit - combinedRows.length;
    const backfillRows = await queryProductRows(
      "p.status IN ('active', 'out_of_stock') AND p.id NOT IN (?)",
      [excludeIds],
      "p.is_featured DESC, p.updated_at DESC",
      remaining
    );
    combinedRows = mergeUniqueProductRows(combinedRows, backfillRows, safeLimit);
  }

  const items = await rowsToItems(combinedRows);
  return { items };
}
