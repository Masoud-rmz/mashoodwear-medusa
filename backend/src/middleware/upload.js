import multer from "multer";
import path from "path";
import fs from "fs";
import { config } from "../config.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Accept file when MIME or extension matches — Windows often sends application/octet-stream.
 * @param {Express.Multer.File} file
 * @returns {boolean}
 */
export function isAllowedImageFile(file) {
  if (ALLOWED_MIME.has(file.mimetype)) {
    return true;
  }
  const extension = path.extname(file.originalname).toLowerCase();
  return ALLOWED_EXT.has(extension);
}

/**
 * Map multer/upload errors to client-safe messages.
 * @param {Error & { code?: string }} error
 * @returns {{ status: number, message: string }}
 */
export function imageUploadErrorResponse(error) {
  if (error.message === "invalid_file_type") {
    return { status: 400, message: "Image must be JPG, PNG, or WebP." };
  }
  if (error.code === "LIMIT_FILE_SIZE") {
    return { status: 400, message: "Image must be under 5 MB." };
  }
  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return { status: 400, message: "Too many images uploaded." };
  }
  return { status: 500, message: error.message || "Upload failed" };
}

/**
 * Ensure upload subdirectory exists.
 * @param {string} subdir
 */
function ensureDir(subdir) {
  const dir = path.join(config.uploadDir, subdir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Create multer storage for a subdirectory under uploads.
 * @param {string} subdir
 */
export function createImageUpload(subdir) {
  const destination = ensureDir(subdir);

  const storage = multer.diskStorage({
    destination: (_request, _file, callback) => callback(null, destination),
    filename: (_request, file, callback) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      callback(null, safeName);
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_BYTES },
    fileFilter: (_request, file, callback) => {
      if (!isAllowedImageFile(file)) {
        callback(new Error("invalid_file_type"));
        return;
      }
      callback(null, true);
    },
  });
}

/**
 * Public URL path for stored upload.
 * @param {string} subdir
 * @param {string} filename
 * @returns {string}
 */
export function uploadPublicPath(subdir, filename) {
  return `/uploads/${subdir}/${filename}`;
}

/**
 * Delete file if it exists under uploads.
 * @param {string} publicPath e.g. /uploads/products/foo.jpg
 */
export function deleteUploadFile(publicPath) {
  if (!publicPath?.startsWith("/uploads/")) {
    return;
  }
  const relative = publicPath.replace(/^\/uploads\//, "");
  const fullPath = path.join(config.uploadDir, relative);
  try {
    fs.unlinkSync(fullPath);
  } catch {
    // file may already be gone
  }
}
