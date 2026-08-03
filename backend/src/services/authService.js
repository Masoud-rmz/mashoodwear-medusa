import bcrypt from "bcrypt";
import { pool } from "../db/pool.js";
import { signAdminToken } from "../utils/jwt.js";

const BCRYPT_ROUNDS = 10;

/**
 * Ensure default admin exists for dev/E2E (password from env).
 */
export async function ensureDefaultAdmin() {
  const username = process.env.ADMIN_SEED_USERNAME || "admin";
  const password = process.env.ADMIN_SEED_PASSWORD || "admin123";

  const [rows] = await pool.query("SELECT id FROM admins WHERE username = ? LIMIT 1", [
    username,
  ]);

  if (rows.length > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await pool.query("INSERT INTO admins (username, password_hash) VALUES (?, ?)", [
    username,
    passwordHash,
  ]);
}

/**
 * Authenticate admin credentials.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ ok: true, token: string } | { ok: false }>}
 */
export async function loginAdmin(username, password) {
  const [rows] = await pool.query(
    "SELECT id, username, password_hash FROM admins WHERE username = ? LIMIT 1",
    [username]
  );

  if (rows.length === 0) {
    return { ok: false };
  }

  const admin = rows[0];
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    return { ok: false };
  }

  const token = signAdminToken({ adminId: admin.id, username: admin.username });
  return { ok: true, token };
}

/**
 * Change password and invalidate session (client clears token).
 * @param {number} adminId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<{ ok: true } | { ok: false, error: string, status: number }>}
 */
export async function changeAdminPassword(adminId, currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters", status: 400 };
  }

  const [rows] = await pool.query(
    "SELECT password_hash FROM admins WHERE id = ? LIMIT 1",
    [adminId]
  );

  if (rows.length === 0) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!valid) {
    return { ok: false, error: "Current password is incorrect", status: 401 };
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await pool.query("UPDATE admins SET password_hash = ? WHERE id = ?", [
    passwordHash,
    adminId,
  ]);

  return { ok: true };
}
