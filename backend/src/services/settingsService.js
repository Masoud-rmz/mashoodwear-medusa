import { pool } from "../db/pool.js";

/** Default home content when site_settings rows are missing. */
const HOME_DEFAULTS = {
  hero_eyebrow: "Independent streetwear",
  hero_headline: "FROM THE STREETS, FOR THE FEW",
  hero_subtitle:
    "Designed by hand. Inspired by the streets. Every piece tells a story — yours to wear.",
  hero_image_1_url: "",
  hero_image_2_url: "",
  brand_story_teaser: "BUILT DIFFERENT.",
  brand_story_body:
    "Born from the streets — where identity, taste, and path differ for everyone. We don't design for the masses or chase fleeting trends.",
  hero_video_enabled: "false",
  hero_video_url: "",
  logo_url: "",
};

/**
 * Load all site_settings rows into a key → value map.
 * @returns {Promise<Record<string, string>>}
 */
export async function loadSettingsMap() {
  const [rows] = await pool.query("SELECT `key`, value FROM site_settings");
  /** @type {Record<string, string>} */
  const map = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

/**
 * Public home settings subset for the storefront hero and brand story.
 * @returns {Promise<object>}
 */
export async function getHomeSettings() {
  const settings = await loadSettingsMap();

  return {
    ok: true,
    heroEyebrow: settings.hero_eyebrow ?? HOME_DEFAULTS.hero_eyebrow,
    heroHeadline: settings.hero_headline ?? HOME_DEFAULTS.hero_headline,
    heroSubtitle: settings.hero_subtitle ?? HOME_DEFAULTS.hero_subtitle,
    heroImage1Url: settings.hero_image_1_url ?? HOME_DEFAULTS.hero_image_1_url,
    heroImage2Url: settings.hero_image_2_url ?? HOME_DEFAULTS.hero_image_2_url,
    brandStoryTeaser: settings.brand_story_teaser ?? HOME_DEFAULTS.brand_story_teaser,
    brandStoryBody: settings.brand_story_body ?? HOME_DEFAULTS.brand_story_body,
    heroVideoEnabled: (settings.hero_video_enabled ?? HOME_DEFAULTS.hero_video_enabled) === "true",
    heroVideoUrl: settings.hero_video_url ?? HOME_DEFAULTS.hero_video_url,
    logoUrl: settings.logo_url ?? HOME_DEFAULTS.logo_url,
  };
}

/**
 * Public checkout/social links for hero CTA, footer, and checkout page.
 * @returns {Promise<object>}
 */
export async function getCheckoutSettings() {
  const settings = await loadSettingsMap();
  const instagramDirectUrl =
    settings.instagram_direct_url || "https://www.instagram.com/mashood.wear";
  const telegramUsername = settings.telegram_username || "lilhosseini";

  return {
    ok: true,
    instagramDirectUrl,
    telegramUsername,
    bankCardNumber: settings.bank_card_number || "",
    bankCardHolder: settings.bank_card_holder || "",
    bankName: settings.bank_name || "",
  };
}

/**
 * All settings for admin forms.
 */
export async function getAdminSettings() {
  const settings = await loadSettingsMap();
  return {
    ok: true,
    instagramDirectUrl: settings.instagram_direct_url || "",
    telegramUsername: settings.telegram_username || "",
    bankCardNumber: settings.bank_card_number || "",
    bankCardHolder: settings.bank_card_holder || "",
    bankName: settings.bank_name || "",
    heroEyebrow: settings.hero_eyebrow ?? HOME_DEFAULTS.hero_eyebrow,
    heroHeadline: settings.hero_headline ?? HOME_DEFAULTS.hero_headline,
    heroSubtitle: settings.hero_subtitle ?? HOME_DEFAULTS.hero_subtitle,
    heroImage1Url: settings.hero_image_1_url ?? "",
    heroImage2Url: settings.hero_image_2_url ?? "",
    brandStoryTeaser: settings.brand_story_teaser ?? HOME_DEFAULTS.brand_story_teaser,
    brandStoryBody: settings.brand_story_body ?? HOME_DEFAULTS.brand_story_body,
    heroVideoEnabled: (settings.hero_video_enabled ?? "false") === "true",
    heroVideoUrl: settings.hero_video_url ?? "",
    logoUrl: settings.logo_url ?? "",
  };
}

/**
 * Upsert one site setting key.
 * @param {string} key
 * @param {string} value
 */
async function upsertSetting(key, value) {
  await pool.query(
    `INSERT INTO site_settings (\`key\`, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [key, value]
  );
}

/**
 * Update admin settings from JSON + optional uploaded file paths.
 * @param {Record<string, unknown>} input
 * @param {{ logoUrl?: string, heroImage1Url?: string, heroImage2Url?: string }} uploads
 */
export async function updateAdminSettings(input, uploads = {}) {
  const mapping = {
    instagramDirectUrl: "instagram_direct_url",
    telegramUsername: "telegram_username",
    bankCardNumber: "bank_card_number",
    bankCardHolder: "bank_card_holder",
    bankName: "bank_name",
    heroEyebrow: "hero_eyebrow",
    heroHeadline: "hero_headline",
    heroSubtitle: "hero_subtitle",
    brandStoryTeaser: "brand_story_teaser",
    brandStoryBody: "brand_story_body",
    heroVideoUrl: "hero_video_url",
  };

  for (const [field, key] of Object.entries(mapping)) {
    if (input[field] !== undefined) {
      await upsertSetting(key, String(input[field]));
    }
  }

  if (input.heroVideoEnabled !== undefined) {
    await upsertSetting("hero_video_enabled", input.heroVideoEnabled ? "true" : "false");
  }

  if (uploads.logoUrl) {
    await upsertSetting("logo_url", uploads.logoUrl);
  }
  if (uploads.heroImage1Url) {
    await upsertSetting("hero_image_1_url", uploads.heroImage1Url);
  }
  if (uploads.heroImage2Url) {
    await upsertSetting("hero_image_2_url", uploads.heroImage2Url);
  }

  return getAdminSettings();
}
