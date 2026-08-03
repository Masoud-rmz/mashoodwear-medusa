import jwt from "jsonwebtoken";
import { config } from "../config.js";

/**
 * Sign admin JWT.
 * @param {{ adminId: number, username: string }} payload
 * @returns {string}
 */
export function signAdminToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Verify admin JWT.
 * @param {string} token
 * @returns {{ adminId: number, username: string }}
 */
export function verifyAdminToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

/**
 * Extract bearer token from Authorization header.
 * @param {import('express').Request} request
 * @returns {string | null}
 */
export function extractBearerToken(request) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7).trim();
}
