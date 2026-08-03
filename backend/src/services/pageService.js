import { pool } from "../db/pool.js";
import { sanitizeMarkdown } from "../utils/sanitize.js";

const ALLOWED_SLUGS = new Set(["about", "contact", "how-to-buy", "lookbook"]);

/**
 * Get public page by slug.
 * @param {string} slug
 */
export async function getPageBySlug(slug) {
  if (!ALLOWED_SLUGS.has(slug)) {
    return null;
  }
  const [rows] = await pool.query(
    "SELECT slug, title, content, updated_at AS updatedAt FROM pages WHERE slug = ? LIMIT 1",
    [slug]
  );
  return rows[0] ?? null;
}

/**
 * List all pages for admin editor.
 */
export async function listAdminPages() {
  const [rows] = await pool.query(
    "SELECT slug, title, content, updated_at AS updatedAt FROM pages ORDER BY slug"
  );
  return rows;
}

/**
 * Update page content.
 * @param {string} slug
 * @param {{ title?: string, content?: string }} input
 */
export async function updatePage(slug, input) {
  if (!ALLOWED_SLUGS.has(slug)) {
    return { ok: false, status: 404, error: "not_found" };
  }

  const [existing] = await pool.query("SELECT id FROM pages WHERE slug = ? LIMIT 1", [slug]);
  const title = input.title?.trim();
  const content = sanitizeMarkdown(input.content ?? "");

  if (existing.length === 0) {
    await pool.query("INSERT INTO pages (slug, title, content) VALUES (?, ?, ?)", [
      slug,
      title || slug,
      content,
    ]);
    return { ok: true };
  }

  const fields = [];
  const values = [];
  if (title) {
    fields.push("title = ?");
    values.push(title);
  }
  if (input.content !== undefined) {
    fields.push("content = ?");
    values.push(content);
  }
  if (fields.length === 0) {
    return { ok: true };
  }
  values.push(slug);
  await pool.query(`UPDATE pages SET ${fields.join(", ")} WHERE slug = ?`, values);
  return { ok: true };
}
