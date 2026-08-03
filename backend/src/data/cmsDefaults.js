/**
 * Default CMS text content — mirrors migration seeds (002, 004, 005).
 * Used by reset-cms-defaults script; does not touch products or uploads.
 */

/** @type {Record<string, string>} */
export const DEFAULT_SITE_SETTINGS = {
  instagram_direct_url: "https://www.instagram.com/mashood.wear",
  telegram_username: "lilhosseini",
  bank_card_number: "",
  bank_card_holder: "",
  bank_name: "",
  hero_video_enabled: "false",
  hero_video_url: "",
  hero_eyebrow: "Independent streetwear",
  hero_headline: "FROM THE STREETS, FOR THE FEW",
  hero_subtitle:
    "Designed by hand. Inspired by the streets. Every piece tells a story — yours to wear.",
  brand_story_teaser: "BUILT DIFFERENT.",
  brand_story_body:
    "Born from the streets — where identity, taste, and path differ for everyone. We don't design for the masses or chase fleeting trends.",
};

/** Keys left unchanged on text-only reset (uploaded asset paths). */
export const SETTINGS_PRESERVE_KEYS = new Set([
  "logo_url",
  "hero_image_1_url",
  "hero_image_2_url",
]);

/** @type {Array<{ slug: string, title: string, content: string }>} */
export const DEFAULT_PAGES = [
  {
    slug: "about",
    title: "About Mashoodwear",
    content:
      "Mashoodwear is independent streetwear — designed by hand, inspired by the streets. Every piece is built for those who move differently.",
  },
  {
    slug: "contact",
    title: "Contact",
    content:
      "Reach us on Instagram or Telegram for orders and questions. We reply as soon as we can.",
  },
  {
    slug: "how-to-buy",
    title: "How to Buy",
    content: `## How ordering works

1. Add items to your cart and go to checkout.
2. Tap **Complete Order on Instagram** or message us on Telegram.
3. Copy your order details into the DM so we can confirm size, color, and total.

## Payment

We accept offline card transfer after your order is confirmed in DM. We will send payment details privately.

## Delivery

Orders ship within 3–5 business days after payment. We coordinate shipping address and timing in Instagram or Telegram.

## Questions?

See the Contact page or message us directly.`,
  },
  {
    slug: "lookbook",
    title: "Lookbook",
    content: "Street frames and fit checks from recent drops.",
  },
];
