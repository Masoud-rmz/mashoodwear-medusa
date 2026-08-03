import { pool } from "../db/pool.js";

/**
 * List public categories sorted for filter UI.
 * @returns {Promise<Array<{ id: number, name: string, slug: string, displayOrder: number }>>}
 */
export async function listCategories() {
  const [rows] = await pool.query(
    `SELECT id, name, slug, display_order
     FROM categories
     ORDER BY display_order ASC, name ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    displayOrder: row.display_order,
  }));
}
