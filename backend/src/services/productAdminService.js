import { pool } from "../db/pool.js";
import { slugify, uniqueSlug } from "../utils/slug.js";
import { parseStoredStringArray } from "../utils/parseForm.js";
import { deleteUploadFile } from "../middleware/upload.js";
import { syncProductCollections } from "./collectionAdminService.js";

/**
 * Apply stock-based status sync rules from design.md §6.9.
 * @param {string} status
 * @param {Array<{ stock: number }>} variants
 * @returns {string}
 */
export function syncProductStatus(status, variants) {
  if (status === "inactive") {
    return "inactive";
  }
  const totalStock = variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
  if (totalStock <= 0) {
    return "out_of_stock";
  }
  if (status === "out_of_stock") {
    return "active";
  }
  return status || "active";
}

/**
 * Validate variants cover all size×color pairs.
 * @param {string[]} sizes
 * @param {string[]} colors
 * @param {Array<{ size: string, color: string, stock: number }>} variants
 */
function validateVariants(sizes, colors, variants) {
  const expected = sizes.length * colors.length;
  if (variants.length !== expected) {
    return "Variants must include every size and color combination";
  }

  for (const size of sizes) {
    for (const color of colors) {
      const match = variants.find((variant) => variant.size === size && variant.color === color);
      if (!match) {
        return `Missing variant for ${size} / ${color}`;
      }
      if (Number(match.stock) < 0) {
        return "Stock cannot be negative";
      }
    }
  }
  return null;
}

/**
 * Load product images.
 * @param {number} productId
 */
async function loadImages(productId) {
  const [rows] = await pool.query(
    "SELECT id, file_path AS url, display_order AS displayOrder FROM product_images WHERE product_id = ? ORDER BY display_order, id",
    [productId]
  );
  return rows;
}

/**
 * Load variants.
 * @param {number} productId
 */
async function loadVariants(productId) {
  const [rows] = await pool.query(
    "SELECT size, color, stock FROM product_variants WHERE product_id = ? ORDER BY size, color",
    [productId]
  );
  return rows.map((row) => ({ ...row, stock: Number(row.stock) }));
}

/**
 * Dashboard stats for admin home.
 */
export async function getDashboardStats() {
  const [[productCount]] = await pool.query("SELECT COUNT(*) AS count FROM products");
  const [[categoryCount]] = await pool.query("SELECT COUNT(*) AS count FROM categories");
  const [[collectionCount]] = await pool.query(
    "SELECT COUNT(*) AS count FROM collections WHERE is_active = TRUE"
  );
  const [[outOfStock]] = await pool.query(
    "SELECT COUNT(*) AS count FROM products WHERE status = 'out_of_stock'"
  );
  const [[lowStock]] = await pool.query(
    `SELECT COUNT(DISTINCT p.id) AS count
     FROM products p
     INNER JOIN product_variants pv ON pv.product_id = p.id
     WHERE pv.stock BETWEEN 1 AND 3`
  );
  const [recent] = await pool.query(
    `SELECT id, name, slug, updated_at AS updatedAt
     FROM products ORDER BY updated_at DESC LIMIT 5`
  );
  return {
    totalProducts: Number(productCount.count),
    totalCategories: Number(categoryCount.count),
    activeCollections: Number(collectionCount.count),
    outOfStockCount: Number(outOfStock.count),
    lowStockCount: Number(lowStock.count),
    recentProducts: recent,
  };
}

/**
 * List products for admin table.
 * @param {{ search?: string, page?: number, limit?: number }} options
 */
export async function listAdminProducts(options = {}) {
  const search = options.search?.trim();
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
  const offset = (page - 1) * limit;

  const conditions = ["1=1"];
  const params = [];
  if (search) {
    conditions.push("p.name LIKE ?");
    params.push(`%${search}%`);
  }

  const where = conditions.join(" AND ");
  const [[countRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p WHERE ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.price, p.status, p.is_featured AS isFeatured, p.updated_at AS updatedAt,
            c.name AS categoryName,
            (SELECT file_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY display_order, id LIMIT 1) AS imageUrl,
            (SELECT COALESCE(SUM(stock), 0) FROM product_variants pv WHERE pv.product_id = p.id) AS totalStock
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     WHERE ${where}
     ORDER BY p.updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    items: rows.map((row) => ({
      ...row,
      price: Number(row.price),
      isFeatured: Boolean(row.isFeatured),
      totalStock: Number(row.totalStock),
    })),
    total: Number(countRow.total),
    page,
    limit,
  };
}

/**
 * Get full product for edit form.
 * @param {number} id
 */
export async function getAdminProduct(id) {
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.description, p.price, p.category_id AS categoryId,
            p.sizes, p.colors, p.status, p.is_featured AS isFeatured, p.featured_order AS featuredOrder
     FROM products p WHERE p.id = ? LIMIT 1`,
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  const row = rows[0];
  const [collectionRows] = await pool.query(
    "SELECT collection_id FROM product_collections WHERE product_id = ?",
    [id]
  );
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    price: Number(row.price),
    categoryId: row.categoryId,
    sizes: parseStoredStringArray(row.sizes),
    colors: parseStoredStringArray(row.colors),
    status: row.status,
    isFeatured: Boolean(row.isFeatured),
    featuredOrder: row.featuredOrder,
    variants: await loadVariants(id),
    images: await loadImages(id),
    collectionIds: collectionRows.map((item) => item.collection_id),
  };
}

/**
 * Insert variants for product.
 * @param {import("mysql2/promise").Pool | import("mysql2/promise").PoolConnection} [db]
 */
async function saveVariants(productId, variants, db = pool) {
  await db.query("DELETE FROM product_variants WHERE product_id = ?", [productId]);
  if (variants.length === 0) {
    return;
  }
  const values = variants.map((variant) => [
    productId,
    variant.size,
    variant.color,
    Number(variant.stock) || 0,
  ]);
  await db.query("INSERT INTO product_variants (product_id, size, color, stock) VALUES ?", [values]);
}

/**
 * Save uploaded images for a product.
 * @param {number} productId
 * @param {string[]} imagePaths
 * @param {import("mysql2/promise").Pool | import("mysql2/promise").PoolConnection} [db]
 * @param {number} [startOrder=0]
 */
async function insertImages(productId, imagePaths, db = pool, startOrder = 0) {
  if (imagePaths.length === 0) {
    return;
  }
  const values = imagePaths.map((filePath, index) => [productId, filePath, startOrder + index]);
  await db.query(
    "INSERT INTO product_images (product_id, file_path, display_order) VALUES ?",
    [values]
  );
}

/**
 * Create product with images and variants.
 * @param {object} input
 * @param {string[]} imagePaths
 */
export async function createProduct(input, imagePaths) {
  const name = input.name?.trim();
  if (!name || name.length < 3) {
    return { ok: false, status: 400, message: "Name must be at least 3 characters" };
  }
  if (!imagePaths?.length) {
    return { ok: false, status: 400, message: "At least one image is required" };
  }

  const price = Number(input.price);
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, status: 400, message: "Price must be greater than 0" };
  }

  const sizes = input.sizes || [];
  const colors = input.colors || [];
  const variants = input.variants || [];
  if (!sizes.length || !colors.length) {
    return { ok: false, status: 400, message: "At least one size and color required" };
  }

  const variantError = validateVariants(sizes, colors, variants);
  if (variantError) {
    return { ok: false, status: 400, message: variantError };
  }

  const baseSlug = slugify(input.slug || name);
  const slug = await uniqueSlug(baseSlug, async (candidate) => {
    const [rows] = await pool.query("SELECT id FROM products WHERE slug = ? LIMIT 1", [candidate]);
    return rows.length > 0;
  });

  const status = syncProductStatus(input.status || "active", variants);

  const [result] = await pool.query(
    `INSERT INTO products (name, slug, description, price, category_id, sizes, colors, status, is_featured, featured_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      slug,
      (input.description || "").slice(0, 1000),
      price,
      Number(input.categoryId),
      JSON.stringify(sizes),
      JSON.stringify(colors),
      status,
      input.isFeatured ? 1 : 0,
      input.featuredOrder ?? null,
    ]
  );

  const productId = result.insertId;
  await saveVariants(productId, variants);
  await insertImages(productId, imagePaths);
  if (input.collectionIds) {
    await syncProductCollections(productId, input.collectionIds.map(Number));
  }

  return { ok: true, id: productId, slug };
}

/**
 * Update product.
 * @param {number} id
 * @param {object} input
 * @param {string[]} newImagePaths
 */
export async function updateProduct(id, input, newImagePaths = []) {
  const existing = await getAdminProduct(id);
  if (!existing) {
    return { ok: false, status: 404, error: "not_found" };
  }

  const sizes = input.sizes ?? existing.sizes;
  const colors = input.colors ?? existing.colors;
  const variants = input.variants ?? existing.variants;
  const variantError = validateVariants(sizes, colors, variants);
  if (variantError) {
    return { ok: false, status: 400, message: variantError };
  }

  const status = syncProductStatus(input.status ?? existing.status, variants);

  if (input.slug !== undefined) {
    const slug = slugify(input.slug);
    const [dup] = await pool.query("SELECT id FROM products WHERE slug = ? AND id <> ? LIMIT 1", [
      slug,
      id,
    ]);
    if (dup.length > 0) {
      return { ok: false, status: 400, message: "Slug already in use" };
    }
  }

  const removeIds = new Set((input.removeImageIds || []).map(Number));
  const keptImageCount = existing.images.filter((image) => !removeIds.has(image.id)).length;
  const remainingImageCount = keptImageCount + newImagePaths.length;
  if (remainingImageCount === 0) {
    return { ok: false, status: 400, message: "At least one image must remain" };
  }
  if (remainingImageCount > 5) {
    return { ok: false, status: 400, message: "Maximum 5 images per product" };
  }

  const fields = [];
  const values = [];

  if (input.name !== undefined) {
    fields.push("name = ?");
    values.push(input.name.trim());
  }
  if (input.slug !== undefined) {
    fields.push("slug = ?");
    values.push(slugify(input.slug));
  }
  if (input.description !== undefined) {
    fields.push("description = ?");
    values.push(String(input.description).slice(0, 1000));
  }
  if (input.price !== undefined) {
    fields.push("price = ?");
    values.push(Number(input.price));
  }
  if (input.categoryId !== undefined) {
    fields.push("category_id = ?");
    values.push(Number(input.categoryId));
  }
  if (input.sizes !== undefined) {
    fields.push("sizes = ?");
    values.push(JSON.stringify(sizes));
  }
  if (input.colors !== undefined) {
    fields.push("colors = ?");
    values.push(JSON.stringify(colors));
  }
  fields.push("status = ?");
  values.push(status);
  if (input.isFeatured !== undefined) {
    fields.push("is_featured = ?");
    values.push(input.isFeatured ? 1 : 0);
  }
  if (input.featuredOrder !== undefined) {
    fields.push("featured_order = ?");
    values.push(input.featuredOrder);
  }

  const filesToDelete = existing.images
    .filter((image) => removeIds.has(image.id))
    .map((image) => image.url);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (fields.length > 0) {
      values.push(id);
      await connection.query(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    await saveVariants(id, variants, connection);

    if (input.removeImageIds?.length) {
      await connection.query("DELETE FROM product_images WHERE product_id = ? AND id IN (?)", [
        id,
        input.removeImageIds.map(Number),
      ]);
    }

    if (input.imageOrder?.length) {
      for (let index = 0; index < input.imageOrder.length; index += 1) {
        await connection.query(
          "UPDATE product_images SET display_order = ? WHERE id = ? AND product_id = ?",
          [index, Number(input.imageOrder[index]), id]
        );
      }
    }

    if (newImagePaths.length > 0) {
      await insertImages(id, newImagePaths, connection, keptImageCount);
    }

    if (input.collectionIds !== undefined) {
      await syncProductCollections(id, input.collectionIds.map(Number), connection);
    }

    await connection.commit();

    for (const filePath of filesToDelete) {
      deleteUploadFile(filePath);
    }

    return { ok: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Delete product and related files.
 * @param {number} id
 */
export async function deleteProduct(id) {
  const [rows] = await pool.query("SELECT id FROM products WHERE id = ? LIMIT 1", [id]);
  if (rows.length === 0) {
    return { ok: false, status: 404, error: "not_found" };
  }

  const images = await loadImages(id);
  for (const image of images) {
    deleteUploadFile(image.url);
  }

  await pool.query("DELETE FROM product_variants WHERE product_id = ?", [id]);
  await pool.query("DELETE FROM product_images WHERE product_id = ?", [id]);
  await pool.query("DELETE FROM product_collections WHERE product_id = ?", [id]);
  await pool.query("DELETE FROM products WHERE id = ?", [id]);
  return { ok: true };
}
