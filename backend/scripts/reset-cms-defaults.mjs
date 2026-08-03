/**
 * Reset admin-edited CMS text back to migration defaults.
 * Does not change products, categories, collections, or uploaded image paths.
 */
import { pool } from "../src/db/pool.js";
import {
  DEFAULT_PAGES,
  DEFAULT_SITE_SETTINGS,
  SETTINGS_PRESERVE_KEYS,
} from "../src/data/cmsDefaults.js";

/**
 * Upsert one site_settings row.
 * @param {string} key
 * @param {string} value
 */
async function upsertSetting(key, value) {
  await pool.query(
    `INSERT INTO site_settings (\`key\`, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [key, value]
  );
}

async function resetSiteSettings() {
  let updated = 0;
  for (const [key, value] of Object.entries(DEFAULT_SITE_SETTINGS)) {
    if (SETTINGS_PRESERVE_KEYS.has(key)) {
      continue;
    }
    await upsertSetting(key, value);
    updated += 1;
  }
  return updated;
}

async function resetPages() {
  let updated = 0;
  for (const page of DEFAULT_PAGES) {
    const [result] = await pool.query(
      `UPDATE pages SET title = ?, content = ? WHERE slug = ?`,
      [page.title, page.content, page.slug]
    );
    if (result.affectedRows === 0) {
      await pool.query(
        `INSERT INTO pages (slug, title, content) VALUES (?, ?, ?)`,
        [page.slug, page.title, page.content]
      );
    }
    updated += 1;
  }
  return updated;
}

async function main() {
  const settingsCount = await resetSiteSettings();
  const pagesCount = await resetPages();
  console.log(`Reset ${settingsCount} site_settings text keys.`);
  console.log(`Reset ${pagesCount} CMS pages (about, contact, how-to-buy, lookbook).`);
  console.log("Preserved: logo_url, hero_image_1_url, hero_image_2_url, products, collections.");
  await pool.end();
}

main().catch((error) => {
  console.error("Reset failed:", error.message);
  process.exit(1);
});
