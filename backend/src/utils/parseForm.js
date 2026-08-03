/**
 * Parse JSON field from multipart or JSON body.
 * @param {unknown} value
 * @param {unknown} fallback
 */
export function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value === "object") {
    return value;
  }
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

/**
 * Parse boolean-ish form values.
 * @param {unknown} value
 */
export function parseBooleanField(value) {
  return value === true || value === "true" || value === "1" || value === 1;
}

/**
 * Read sizes/colors from DB — supports JSON arrays and legacy comma-separated text.
 * @param {unknown} value
 * @param {string[]} [fallback=[]]
 * @returns {string[]}
 */
export function parseStoredStringArray(value, fallback = []) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (Array.isArray(value)) {
    return value.map(String);
  }

  const text = String(value).trim();
  if (!text) {
    return fallback;
  }

  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed.map(String) : fallback;
    } catch {
      // legacy or corrupted row — try comma split below
    }
  }

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
