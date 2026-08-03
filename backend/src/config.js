import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * Central configuration loaded from environment variables.
 * Keeps paths and secrets out of source code for portability.
 */
export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  trustProxy: process.env.TRUST_PROXY === "1",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || "mashoodwear",
    user: process.env.DB_USER || "mashoodwear",
    password: process.env.DB_PASS || "",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "dev-only-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  },
  uploadDir: path.resolve(
    process.env.UPLOAD_DIR || path.join(__dirname, "../uploads")
  ),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};
