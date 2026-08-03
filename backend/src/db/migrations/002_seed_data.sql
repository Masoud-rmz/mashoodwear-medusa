-- Seed categories, collections, and default site settings (phase 0)

INSERT IGNORE INTO categories (name, slug, display_order) VALUES
  ('T-Shirts', 't-shirts', 1),
  ('Hoodies', 'hoodies', 2),
  ('Pants', 'pants', 3),
  ('Crop', 'crop', 4),
  ('Stickers', 'stickers', 5);

INSERT IGNORE INTO collections (name, slug, cover_image_path, description, display_order) VALUES
  ('Drift', 'drift', '/uploads/collections/drift-cover.svg', 'Late-night streets, muted tones, pieces built to move.', 1),
  ('Urban Night', 'urban-night', '/uploads/collections/urban-night-cover.svg', 'City lights, heavy fabrics, limited run.', 2);

INSERT IGNORE INTO site_settings (`key`, value) VALUES
  ('instagram_direct_url', 'https://www.instagram.com/mashood.wear'),
  ('telegram_username', 'lilhosseini'),
  ('hero_video_enabled', 'false'),
  ('hero_video_url', ''),
  ('logo_url', ''),
  ('hero_eyebrow', 'Independent streetwear'),
  ('hero_headline', 'FROM THE STREETS, FOR THE FEW'),
  ('hero_subtitle', 'Designed by hand. Inspired by the streets. Every piece tells a story — yours to wear.'),
  ('hero_image_1_url', ''),
  ('hero_image_2_url', ''),
  ('brand_story_teaser', 'BUILT DIFFERENT.');
