import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { checkDatabaseConnection, pool } from "../src/db/pool.js";

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

describe("GET /api/settings/home", () => {
  const run = server ? it : it.skip;

  run("returns hero defaults and ok:true", async () => {
    const response = await fetch(`${baseUrl}/api/settings/home`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.match(body.heroHeadline, /STREETS/);
    assert.equal(body.heroVideoEnabled, false);
  });
});

describe("GET /api/settings/checkout", () => {
  const run = server ? it : it.skip;

  run("returns Instagram, Telegram, and card settings", async () => {
    const response = await fetch(`${baseUrl}/api/settings/checkout`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.match(body.instagramDirectUrl, /instagram/i);
    assert.ok(body.telegramUsername);
    assert.equal(typeof body.bankCardNumber, "string");
    assert.equal(typeof body.bankCardHolder, "string");
  });
});
