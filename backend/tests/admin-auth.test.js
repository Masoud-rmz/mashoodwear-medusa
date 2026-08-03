import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { checkDatabaseConnection } from "../src/db/pool.js";
import { ensureDefaultAdmin } from "../src/services/authService.js";

/** @type {import('http').Server | null} */
let server = null;
let baseUrl = "";
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
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe("admin auth API", () => {
  const run = dbReady ? it : it.skip;

  run("returns 401 for bad password", async () => {
    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "wrong-password" }),
    });
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.equal(body.token, undefined);
  });

  run("returns 403 for protected route without token", async () => {
    const response = await fetch(`${baseUrl}/api/admin/products`);
    assert.equal(response.status, 403);
  });

  run("returns token for valid login", async () => {
    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.ok(body.token);
  });
});
