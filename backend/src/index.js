import { createApp } from "./app.js";
import { config } from "./config.js";
import { runSqlMigrations } from "./db/migrate.js";
import { ensureDefaultAdmin } from "./services/authService.js";

const app = createApp();

/**
 * Boot sequence: schema first, then admin seed, then listen.
 * Prevents crash loops when deploy skipped or failed migrations.
 */
async function startServer() {
  await runSqlMigrations();
  await ensureDefaultAdmin();

  const server = app.listen(config.port, () => {
    console.log(`Mashhoodwear API listening on port ${config.port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${config.port} is already in use. Stop the other process first.`);
    } else {
      console.error("Server failed to start:", error.message);
    }
    process.exit(1);
  });
}

startServer().catch((error) => {
  console.error("API startup failed:", error.message);
  process.exit(1);
});
