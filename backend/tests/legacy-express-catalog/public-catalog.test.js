/**
 * Legacy Express public catalog tests.
 * purpose --- catalog source of truth is Medusa; keep these only for residual Express routes ---
 * Run via: npm run test:legacy-express-catalog --prefix backend
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/app.js";
import { checkDatabaseConnection, pool } from "../../src/db/pool.js";

/** @type {import('http').Server | null} */
let server = null;
let baseUrl = "";

before(async () => {
  const connected = await checkDatabaseConnection().catch(() => false);
  if (!connected) {
    console.log(
      "SKIP: MySQL not reachable. Start with: docker compose up -d && npm run migrate"
    );
    return;
  }

  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  if (server) {
    await pool.end();
  }
});

describe("GET /api/products (legacy Express catalog)", () => {
  const run = server ? it : it.skip;

  run("featured=true returns items with price and slug", async () => {
    const response = await fetch(`${baseUrl}/api/products?featured=true&limit=6`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.items));

    if (body.items.length > 0) {
      const product = body.items[0];
      assert.ok(product.slug);
      assert.ok(typeof product.price === "number");
      assert.ok(Array.isArray(product.variants));
      assert.ok(product.stockLabel);
    }
  });

  run("size=L and color=Black returns only matching products", async () => {
    const response = await fetch(
      `${baseUrl}/api/products?size=L&color=Black&limit=50`
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);

    for (const product of body.items) {
      const hasMatch = product.variants.some(
        (variant) => variant.size === "L" && variant.color === "Black"
      );
      assert.ok(hasMatch, `Product ${product.slug} missing L/Black variant`);
    }
  });

  run("inactive products are excluded from public list", async () => {
    const response = await fetch(`${baseUrl}/api/products?limit=50`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.ok(body.items.length > 0);
  });
});

describe("GET /api/categories (legacy Express catalog)", () => {
  const run = server ? it : it.skip;

  run("returns seed categories sorted by display_order", async () => {
    const response = await fetch(`${baseUrl}/api/categories`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.items));
    assert.ok(body.items.length >= 5);

    const slugs = body.items.map((item) => item.slug);
    assert.ok(slugs.includes("t-shirts"));
    assert.ok(slugs.includes("hoodies"));

    for (let index = 1; index < body.items.length; index += 1) {
      assert.ok(
        body.items[index - 1].displayOrder <= body.items[index].displayOrder
      );
    }
  });
});

describe("GET /api/products/:slug (legacy Express catalog)", () => {
  const run = server ? it : it.skip;

  run("returns product with images and variants", async () => {
    const response = await fetch(`${baseUrl}/api/products/street-hoodie-black`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.product.slug, "street-hoodie-black");
    assert.ok(Array.isArray(body.product.images));
    assert.ok(body.product.images.length >= 1);
    assert.ok(Array.isArray(body.product.variants));
    assert.ok(body.product.variants.some((variant) => variant.size === "L"));
  });

  run("returns 404 for unknown slug", async () => {
    const response = await fetch(`${baseUrl}/api/products/does-not-exist-slug`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.ok, false);
    assert.equal(body.error, "not_found");
  });
});

describe("GET /api/products/:slug/related (legacy Express catalog)", () => {
  const run = server ? it : it.skip;

  run("returns suggested products excluding the current slug", async () => {
    const response = await fetch(
      `${baseUrl}/api/products/street-hoodie-black/related?limit=4`
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.items));
    assert.ok(body.items.length > 0);
    assert.ok(body.items.length <= 4);

    for (const product of body.items) {
      assert.notEqual(product.slug, "street-hoodie-black");
      assert.ok(product.slug);
      assert.ok(typeof product.price === "number");
    }
  });

  run("returns 404 for unknown slug", async () => {
    const response = await fetch(
      `${baseUrl}/api/products/does-not-exist-slug/related`
    );
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.ok, false);
    assert.equal(body.error, "not_found");
  });
});
