import { pool } from "../db/pool.js";
import { slugify, uniqueSlug } from "../utils/slug.js";
import { deleteUploadFile } from "../middleware/upload.js";

/**
 * Sync product_collections for a product.
 * @param {number} productId
 * @param {number[]} collectionIds
 */
export async function syncProductCollections(productId, collectionIds, db = pool) {
  await db.query("DELETE FROM product_collections WHERE product_id = ?", [productId]);
  if (!collectionIds?.length) {
    return;
  }
  const values = collectionIds.map((collectionId) => [productId, collectionId]);
  await db.query("INSERT INTO product_collections (product_id, collection_id) VALUES ?", [values]);
}

/**
 * Sync product_collections for a collection.
 * @param {number} collectionId
 * @param {number[]} productIds
 */
async function syncCollectionProducts(collectionId, productIds) {
  await pool.query("DELETE FROM product_collections WHERE collection_id = ?", [collectionId]);
  if (!productIds?.length) {
    return;
  }
  const values = productIds.map((productId) => [productId, collectionId]);
  await pool.query("INSERT INTO product_collections (product_id, collection_id) VALUES ?", [
    values,
  ]);
}

/**
 * List collections for admin.
 */
export async function listAdminCollections() {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.slug, c.cover_image_path AS coverImageUrl, c.description,
            c.display_order AS displayOrder, c.is_active AS isActive,
            (SELECT COUNT(*) FROM product_collections pc WHERE pc.collection_id = c.id) AS productCount
     FROM collections c
     ORDER BY c.display_order ASC, c.name ASC`
  );
  return rows.map((row) => ({
    ...row,
    isActive: Boolean(row.isActive),
    productCount: Number(row.productCount),
  }));
}

/**
 * Get one collection with product ids.
 * @param {number} id
 */
export async function getAdminCollection(id) {
  const [rows] = await pool.query(
    `SELECT id, name, slug, cover_image_path AS coverImageUrl, description,
            display_order AS displayOrder, is_active AS isActive
     FROM collections WHERE id = ? LIMIT 1`,
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  const [productRows] = await pool.query(
    "SELECT product_id FROM product_collections WHERE collection_id = ?",
    [id]
  );
  return {
    ...rows[0],
    isActive: Boolean(rows[0].isActive),
    productIds: productRows.map((row) => row.product_id),
  };
}

/**
 * Create collection.
 * @param {object} input
 * @param {string | null} coverPath
 */
export async function createCollection(input, coverPath) {
  if (!coverPath) {
    return { ok: false, status: 400, message: "Cover image is required" };
  }

  const name = input.name?.trim();
  if (!name) {
    return { ok: false, status: 400, message: "Name is required" };
  }

  const baseSlug = slugify(input.slug || name);
  const slug = await uniqueSlug(baseSlug, async (candidate) => {
    const [rows] = await pool.query("SELECT id FROM collections WHERE slug = ? LIMIT 1", [
      candidate,
    ]);
    return rows.length > 0;
  });

  const [result] = await pool.query(
    `INSERT INTO collections (name, slug, cover_image_path, description, display_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      name,
      slug,
      coverPath,
      input.description || "",
      Number(input.displayOrder) || 0,
      input.isActive === false ? 0 : 1,
    ]
  );

  const collectionId = result.insertId;
  if (input.productIds?.length) {
    await syncCollectionProducts(collectionId, input.productIds.map(Number));
  }

  return { ok: true, id: collectionId, slug };
}

/**
 * Update collection.
 * @param {number} id
 * @param {object} input
 * @param {string | null} coverPath
 */
export async function updateCollection(id, input, coverPath) {
  const existing = await getAdminCollection(id);
  if (!existing) {
    return { ok: false, status: 404, error: "not_found" };
  }

  const fields = [];
  const values = [];

  if (input.name !== undefined) {
    fields.push("name = ?");
    values.push(input.name.trim());
  }
  if (input.slug !== undefined) {
    const slug = slugify(input.slug);
    const [dup] = await pool.query(
      "SELECT id FROM collections WHERE slug = ? AND id <> ? LIMIT 1",
      [slug, id]
    );
    if (dup.length > 0) {
      return { ok: false, status: 400, message: "Slug already in use" };
    }
    fields.push("slug = ?");
    values.push(slug);
  }
  if (input.description !== undefined) {
    fields.push("description = ?");
    values.push(input.description);
  }
  if (input.displayOrder !== undefined) {
    fields.push("display_order = ?");
    values.push(Number(input.displayOrder) || 0);
  }
  if (input.isActive !== undefined) {
    fields.push("is_active = ?");
    values.push(input.isActive ? 1 : 0);
  }
  if (coverPath) {
    if (existing.coverImageUrl) {
      deleteUploadFile(existing.coverImageUrl);
    }
    fields.push("cover_image_path = ?");
    values.push(coverPath);
  }

  if (fields.length > 0) {
    values.push(id);
    await pool.query(`UPDATE collections SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  if (input.productIds !== undefined) {
    await syncCollectionProducts(id, input.productIds.map(Number));
  }

  return { ok: true };
}

/**
 * Delete collection and cover image.
 * @param {number} id
 */
export async function deleteCollection(id) {
  const existing = await getAdminCollection(id);
  if (!existing) {
    return { ok: false, status: 404, error: "not_found" };
  }

  await pool.query("DELETE FROM product_collections WHERE collection_id = ?", [id]);
  await pool.query("DELETE FROM collections WHERE id = ?", [id]);
  if (existing.coverImageUrl) {
    deleteUploadFile(existing.coverImageUrl);
  }
  return { ok: true };
}
