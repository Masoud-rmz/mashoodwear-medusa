import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
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
  await pool.end();
});

describe("GET /api/health", () => {
  const run = server ? it : it.skip;

  run("returns ok:true and db:connected when MySQL is up", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.db, "connected");
  });
});
