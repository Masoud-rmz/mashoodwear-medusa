-- Seed sample products for dev, E2E, and home New Arrivals (phase 1)

INSERT IGNORE INTO products (id, name, slug, description, price, category_id, sizes, colors, status, is_featured, featured_order)
VALUES
  (1, 'Street Hoodie Black', 'street-hoodie-black', 'Heavyweight fleece hoodie.', 1850000, 2,
   '["S","M","L","XL","2XL"]', '["Black","Gray"]', 'active', TRUE, 1),
  (2, 'Urban Tee Cream', 'urban-tee-cream', 'Soft cotton street tee.', 890000, 1,
   '["S","M","L","XL"]', '["Cream","White"]', 'active', TRUE, 2),
  (3, 'Drift Cargo Pants', 'drift-cargo-pants', 'Relaxed cargo with utility pockets.', 1450000, 3,
   '["M","L","XL","2XL"]', '["Black","Brown"]', 'active', TRUE, 3),
  (4, 'Night Run Crop', 'night-run-crop', 'Cropped fit for layered looks.', 720000, 4,
   '["S","M","L"]', '["Black","Gray"]', 'active', FALSE, NULL),
  (5, 'Logo Sticker Pack', 'logo-sticker-pack', 'Die-cut vinyl stickers.', 120000, 5,
   '["S"]', '["Black"]', 'active', FALSE, NULL);

INSERT IGNORE INTO product_variants (product_id, size, color, stock) VALUES
  (1, 'S', 'Black', 5), (1, 'M', 'Black', 8), (1, 'L', 'Black', 3), (1, 'XL', 'Black', 2), (1, '2XL', 'Black', 0),
  (1, 'S', 'Gray', 4), (1, 'M', 'Gray', 6), (1, 'L', 'Gray', 2),
  (2, 'S', 'Cream', 10), (2, 'M', 'Cream', 12), (2, 'L', 'Cream', 7), (2, 'XL', 'Cream', 4),
  (2, 'S', 'White', 6), (2, 'M', 'White', 8),
  (3, 'M', 'Black', 5), (3, 'L', 'Black', 4), (3, 'XL', 'Black', 3), (3, '2XL', 'Black', 2),
  (3, 'M', 'Brown', 3), (3, 'L', 'Brown', 2),
  (4, 'S', 'Black', 6), (4, 'M', 'Black', 5), (4, 'L', 'Black', 4),
  (4, 'S', 'Gray', 3), (4, 'M', 'Gray', 2),
  (5, 'S', 'Black', 50);

INSERT IGNORE INTO product_images (product_id, file_path, display_order) VALUES
  (1, '/uploads/products/street-hoodie-black.svg', 0),
  (2, '/uploads/products/urban-tee-cream.svg', 0),
  (3, '/uploads/products/drift-cargo-pants.svg', 0),
  (4, '/uploads/products/night-run-crop.svg', 0),
  (5, '/uploads/products/logo-sticker-pack.svg', 0);

INSERT IGNORE INTO product_collections (product_id, collection_id) VALUES
  (1, 1), (3, 1), (2, 2), (4, 2);
