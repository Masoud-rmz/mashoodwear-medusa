/**
 * Legacy Express admin category tests.
 * purpose --- commerce admin is Medusa Admin; keep residual Express category CRUD checks optional ---
 * Run via: npm run test:legacy-express-catalog --prefix backend
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/app.js";
import { checkDatabaseConnection } from "../../src/db/pool.js";
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
});

describe("admin categories API (legacy Express catalog)", () => {
  const run = dbReady ? it : it.skip;

  run("blocks delete when category has products", async () => {
    const response = await fetch(`${baseUrl}/api/admin/categories/1`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.message, /Move or remove products/i);
  });
});
