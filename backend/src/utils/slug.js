/**
 * URL-safe slug from display name.
 * @param {string} name
 * @returns {string}
 */
export function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Ensure slug is unique by appending numeric suffix.
 * @param {string} baseSlug
 * @param {(slug: string) => Promise<boolean>} exists
 * @returns {Promise<string>}
 */
export async function uniqueSlug(baseSlug, exists) {
  let candidate = baseSlug || "item";
  let suffix = 0;

  while (await exists(candidate)) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  return candidate;
}
