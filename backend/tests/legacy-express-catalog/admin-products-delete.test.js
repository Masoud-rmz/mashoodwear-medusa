/**
 * Legacy Express admin product delete tests.
 * purpose --- commerce admin is Medusa Admin; keep residual Express product CRUD checks optional ---
 * Run via: npm run test:legacy-express-catalog --prefix backend
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/app.js";
import { checkDatabaseConnection, pool } from "../../src/db/pool.js";
import { ensureDefaultAdmin } from "../../src/services/authService.js";

/** @type {import('http').Server | null} */
let server = null;
let baseUrl = "";
let token = "";
let dbReady = false;

before(async () => {
  dbReady = await checkDatabaseConnection().catch(() => false);
  if (!dbReady) {
    return;
  }

  const app = createApp();
  await ensureDefaultAdmin();
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;

  const response = await fetch(`${baseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  const body = await response.json();
  token = body.token;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (dbReady) {
    await pool.end();
  }
});

describe("admin products delete API (legacy Express catalog)", () => {
  const run = dbReady ? it : it.skip;

  run("deletes a product and related rows", async () => {
    const [[category]] = await pool.query("SELECT id FROM categories LIMIT 1");
    const slug = `delete-test-${Date.now()}`;

    const [insertResult] = await pool.query(
      `INSERT INTO products (name, slug, description, price, category_id, sizes, colors, status)
       VALUES (?, ?, '', 100000, ?, ?, ?, 'active')`,
      [
        "Delete test product",
        slug,
        category.id,
        JSON.stringify(["M"]),
        JSON.stringify(["Black"]),
      ]
    );
    const productId = insertResult.insertId;

    await pool.query(
      "INSERT INTO product_variants (product_id, size, color, stock) VALUES (?, 'M', 'Black', 1)",
      [productId]
    );
    await pool.query(
      "INSERT INTO product_images (product_id, file_path, display_order) VALUES (?, '/uploads/products/street-hoodie-black.svg', 0)",
      [productId]
    );

    const deleteResponse = await fetch(`${baseUrl}/api/admin/products/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(deleteResponse.status, 200);
    const deleteBody = await deleteResponse.json();
    assert.equal(deleteBody.ok, true);

    const getResponse = await fetch(`${baseUrl}/api/admin/products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(getResponse.status, 404);

    const [variantRows] = await pool.query(
      "SELECT COUNT(*) AS count FROM product_variants WHERE product_id = ?",
      [productId]
    );
    assert.equal(Number(variantRows[0].count), 0);
  });
});
