import { pool } from "../db/pool.js";
import { getPageBySlug } from "./pageService.js";
import { deleteUploadFile } from "../middleware/upload.js";

const MAX_LOOKBOOK_IMAGES = 12;

/**
 * Public lookbook payload.
 */
export async function getPublicLookbook() {
  const page = await getPageBySlug("lookbook");
  const [images] = await pool.query(
    `SELECT id, file_path AS url, caption, display_order AS displayOrder
     FROM lookbook_images ORDER BY display_order ASC, id ASC`
  );
  return {
    title: page?.title || "Lookbook",
    content: page?.content || "",
    images,
  };
}

/**
 * List lookbook images for admin.
 */
export async function listLookbookImages() {
  const [rows] = await pool.query(
    `SELECT id, file_path AS url, caption, display_order AS displayOrder
     FROM lookbook_images ORDER BY display_order ASC, id ASC`
  );
  return rows;
}

/**
 * Add lookbook image.
 * @param {string} filePath
 * @param {string | null} caption
 */
export async function createLookbookImage(filePath, caption) {
  const [[countRow]] = await pool.query("SELECT COUNT(*) AS count FROM lookbook_images");
  if (Number(countRow.count) >= MAX_LOOKBOOK_IMAGES) {
    return { ok: false, status: 400, message: "Maximum 12 lookbook images" };
  }
  const [[orderRow]] = await pool.query(
    "SELECT COALESCE(MAX(display_order), -1) + 1 AS nextOrder FROM lookbook_images"
  );
  const [result] = await pool.query(
    "INSERT INTO lookbook_images (file_path, caption, display_order) VALUES (?, ?, ?)",
    [filePath, caption || null, Number(orderRow.nextOrder)]
  );
  return { ok: true, id: result.insertId };
}

/**
 * Update lookbook image metadata.
 * @param {number} id
 * @param {{ caption?: string, displayOrder?: number }} input
 */
export async function updateLookbookImage(id, input) {
  const [rows] = await pool.query("SELECT id FROM lookbook_images WHERE id = ? LIMIT 1", [id]);
  if (rows.length === 0) {
    return { ok: false, status: 404, error: "not_found" };
  }
  const fields = [];
  const values = [];
  if (input.caption !== undefined) {
    fields.push("caption = ?");
    values.push(input.caption || null);
  }
  if (input.displayOrder !== undefined) {
    fields.push("display_order = ?");
    values.push(Number(input.displayOrder));
  }
  if (fields.length === 0) {
    return { ok: true };
  }
  values.push(id);
  await pool.query(`UPDATE lookbook_images SET ${fields.join(", ")} WHERE id = ?`, values);
  return { ok: true };
}

/**
 * Delete lookbook image.
 * @param {number} id
 */
export async function deleteLookbookImage(id) {
  const [rows] = await pool.query(
    "SELECT file_path FROM lookbook_images WHERE id = ? LIMIT 1",
    [id]
  );
  if (rows.length === 0) {
    return { ok: false, status: 404, error: "not_found" };
  }
  deleteUploadFile(rows[0].file_path);
  await pool.query("DELETE FROM lookbook_images WHERE id = ?", [id]);
  return { ok: true };
}
