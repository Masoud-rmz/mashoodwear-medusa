import { pool } from "../db/pool.js";
import { slugify, uniqueSlug } from "../utils/slug.js";

/**
 * List all categories for admin.
 */
export async function listAdminCategories() {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.slug, c.display_order AS displayOrder,
            (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS productCount
     FROM categories c
     ORDER BY c.display_order ASC, c.name ASC`
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    displayOrder: row.displayOrder,
    productCount: Number(row.productCount),
  }));
}

/**
 * Create category.
 * @param {{ name: string, slug?: string, displayOrder?: number }} input
 */
export async function createCategory(input) {
  const name = input.name?.trim();
  if (!name || name.length < 2) {
    return { ok: false, status: 400, error: "name", message: "Name is required" };
  }

  const baseSlug = slugify(input.slug || name);
  const slug = await uniqueSlug(baseSlug, async (candidate) => {
    const [rows] = await pool.query("SELECT id FROM categories WHERE slug = ? LIMIT 1", [
      candidate,
    ]);
    return rows.length > 0;
  });

  const [result] = await pool.query(
    "INSERT INTO categories (name, slug, display_order) VALUES (?, ?, ?)",
    [name, slug, Number(input.displayOrder) || 0]
  );

  return { ok: true, id: result.insertId, slug };
}

/**
 * Update category.
 * @param {number} id
 * @param {{ name?: string, slug?: string, displayOrder?: number }} input
 */
export async function updateCategory(id, input) {
  const [existing] = await pool.query("SELECT id FROM categories WHERE id = ? LIMIT 1", [id]);
  if (existing.length === 0) {
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
      "SELECT id FROM categories WHERE slug = ? AND id <> ? LIMIT 1",
      [slug, id]
    );
    if (dup.length > 0) {
      return { ok: false, status: 400, error: "slug", message: "Slug already in use" };
    }
    fields.push("slug = ?");
    values.push(slug);
  }
  if (input.displayOrder !== undefined) {
    fields.push("display_order = ?");
    values.push(Number(input.displayOrder) || 0);
  }

  if (fields.length === 0) {
    return { ok: true };
  }

  values.push(id);
  await pool.query(`UPDATE categories SET ${fields.join(", ")} WHERE id = ?`, values);
  return { ok: true };
}

/**
 * Delete category when no products reference it.
 * @param {number} id
 */
export async function deleteCategory(id) {
  const [products] = await pool.query(
    "SELECT COUNT(*) AS count FROM products WHERE category_id = ?",
    [id]
  );
  if (Number(products[0].count) > 0) {
    return {
      ok: false,
      status: 400,
      message: "Move or remove products in this category first.",
    };
  }

  const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [id]);
  if (result.affectedRows === 0) {
    return { ok: false, status: 404, error: "not_found" };
  }
  return { ok: true };
}
