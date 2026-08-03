import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { pool } from "./pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "migrations");

/**
 * Apply pending SQL migration files in order.
 * Safe to call on every API boot — already-applied files are skipped.
 * Does not close the pool (caller may keep using it).
 */
export async function runSqlMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const files = (await fs.readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const filename of files) {
    const [rows] = await pool.query(
      "SELECT filename FROM schema_migrations WHERE filename = ?",
      [filename]
    );

    if (rows.length > 0) {
      console.log(`skip: ${filename}`);
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, filename), "utf8");
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const statements = sql
        .replace(/--.*$/gm, "")
        .split(";")
        .map((statement) => statement.trim())
        .filter(Boolean);
      for (const statement of statements) {
        await connection.query(statement);
      }
      await connection.query(
        "INSERT INTO schema_migrations (filename) VALUES (?)",
        [filename]
      );
      await connection.commit();
      console.log(`applied: ${filename}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  console.log("Migrations complete.");
}

const isCli =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isCli) {
  runSqlMigrations()
    .then(() => pool.end())
    .catch((error) => {
      console.error("Migration failed:", error.message);
      process.exit(1);
    });
}
