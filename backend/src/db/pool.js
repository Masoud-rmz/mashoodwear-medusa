import mysql from "mysql2/promise";
import { config } from "../config.js";

const CONNECT_TIMEOUT_MS = 3000;

/** Shared MySQL connection pool for the API. */
export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: CONNECT_TIMEOUT_MS,
  enableKeepAlive: true,
});

/**
 * Ping MySQL to verify connectivity.
 * @returns {Promise<boolean>}
 */
export async function checkDatabaseConnection() {
  let connection;
  try {
    connection = await Promise.race([
      pool.getConnection(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("connect_timeout")), CONNECT_TIMEOUT_MS);
      }),
    ]);
    await connection.ping();
    return true;
  } catch {
    return false;
  } finally {
    connection?.release();
  }
}
