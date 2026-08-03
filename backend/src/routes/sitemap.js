import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

/**
 * Escape XML special characters in URL or text nodes.
 * @param {string} value
 */
function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Build sitemap.xml with static routes and active product slugs.
 * SITE_URL env var sets absolute URLs (required in production).
 */
router.get("/", async (request, response) => {
  const siteUrl = (process.env.SITE_URL || `${request.protocol}://${request.get("host")}`).replace(
    /\/$/,
    ""
  );

  const staticPaths = [
    "/",
    "/products",
    "/collections",
    "/about",
    "/contact",
    "/how-to-buy",
    "/lookbook",
    "/cart",
    "/checkout",
  ];

  const [products] = await pool.query(
    `SELECT slug FROM products WHERE status IN ('active', 'out_of_stock') ORDER BY updated_at DESC`
  );

  const [collections] = await pool.query(
    `SELECT slug FROM collections WHERE is_active = TRUE ORDER BY display_order`
  );

  const urls = [
    ...staticPaths.map((path) => `${siteUrl}${path}`),
    ...collections.map((row) => `${siteUrl}/collections/${row.slug}`),
    ...products.map((row) => `${siteUrl}/products/${row.slug}`),
  ];

  const body = urls
    .map(
      (loc) => `  <url>
    <loc>${escapeXml(loc)}</loc>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;

  response.type("application/xml").send(xml);
});

export default router;
