-- Point seed image paths at committed SVG placeholders and fix em-dash text encoding

UPDATE product_images
SET file_path = REPLACE(file_path, '.jpg', '.svg')
WHERE file_path LIKE '/uploads/products/%.jpg';

UPDATE collections
SET cover_image_path = REPLACE(cover_image_path, '.jpg', '.svg')
WHERE cover_image_path LIKE '/uploads/collections/%.jpg';

UPDATE site_settings
SET value = 'Designed by hand. Inspired by the streets. Every piece tells a story — yours to wear.'
WHERE `key` = 'hero_subtitle';

UPDATE site_settings
SET value = 'Born from the streets — where identity, taste, and path differ for everyone. We don''t design for the masses or chase fleeting trends.'
WHERE `key` = 'brand_story_body';
