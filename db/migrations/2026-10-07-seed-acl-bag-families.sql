-- Seed the ACL bag catalogue as optional subcategories with replaceable starter products.
-- The same additive migration can be applied locally and on the hosted database.
INSERT INTO catalog_categories (slug, data, is_deleted) VALUES
('cornhole-bags', JSON_OBJECT(
  'slug', 'cornhole-bags',
  'name', 'ACL Bags',
  'description', 'Competition bag families organized by feel, pace, and control profile.',
  'shippingCents', 0
), 0)
ON DUPLICATE KEY UPDATE data = VALUES(data), is_deleted = 0;

INSERT INTO catalog_subcategories (slug, data, is_deleted) VALUES
('phenom-x', JSON_OBJECT('slug', 'phenom-x', 'category', 'cornhole-bags', 'name', 'Phenom X', 'description', 'Quick finish speed with a composed, readable control side.', 'defaultPrice', 79.99), 0),
('felon-x', JSON_OBJECT('slug', 'felon-x', 'category', 'cornhole-bags', 'name', 'Felon X', 'description', 'A balanced family for players who want two versatile faces.', 'defaultPrice', 79.99), 0),
('menace-x', JSON_OBJECT('slug', 'menace-x', 'category', 'cornhole-bags', 'name', 'Menace X', 'description', 'Fast finish paired with grip for blocks, cuts, and dirty-board work.', 'defaultPrice', 79.99), 0),
('prodigy-x', JSON_OBJECT('slug', 'prodigy-x', 'category', 'cornhole-bags', 'name', 'Prodigy X', 'description', 'Dependable everyday pace for pushes and tournament rotation.', 'defaultPrice', 79.99), 0),
('hellion-x', JSON_OBJECT('slug', 'hellion-x', 'category', 'cornhole-bags', 'name', 'Hellion X', 'description', 'Pace, shape, and recovery for players who work every part of the lane.', 'defaultPrice', 79.99), 0)
ON DUPLICATE KEY UPDATE data = VALUES(data), is_deleted = 0;

INSERT INTO catalog_products (slug, data, is_deleted) VALUES
('phenom-x-bags', JSON_OBJECT(
  'slug', 'phenom-x-bags', 'name', 'Phenom X — Patriot Skull', 'category', 'cornhole-bags', 'categoryLabel', 'ACL Bags',
  'subcategory', 'phenom-x', 'subcategoryLabel', 'Phenom X', 'priceSource', 'subcategory', 'price', 79.99,
  'image', '/images/shop/phenom-x.jpeg', 'alt', 'Patriotic skull Phenom X cornhole bag set', 'eyebrow', 'Phenom X family',
  'description', 'A quick, confident hybrid with finish speed and a readable control side.',
  'features', JSON_ARRAY('Fast side speed: 7', 'Control side speed: 4.5', 'Competition-size set of four', 'Double-stitched construction'),
  'colors', JSON_ARRAY('Patriot Skull'), 'sizes', JSON_ARRAY('Set of 4'), 'badge', 'ACL Pro', 'speedFast', 7, 'speedControl', 4.5
), 0),
('phenom-x-midnight-test-bags', JSON_OBJECT(
  'slug', 'phenom-x-midnight-test-bags', 'name', 'Phenom X — Midnight Test Set', 'category', 'cornhole-bags', 'categoryLabel', 'ACL Bags',
  'subcategory', 'phenom-x', 'subcategoryLabel', 'Phenom X', 'priceSource', 'subcategory', 'price', 79.99,
  'image', '/images/shop/phenom-x.jpeg', 'alt', 'Preview Phenom X cornhole bag set', 'eyebrow', 'Starter product',
  'description', 'A temporary Phenom X product entry ready for final artwork, copy, and color details.',
  'features', JSON_ARRAY('Fast side speed: 7', 'Control side speed: 4.5', 'Competition-size set of four', 'Replaceable starter listing'),
  'colors', JSON_ARRAY('Preview colorway'), 'sizes', JSON_ARRAY('Set of 4'), 'badge', 'Preview', 'speedFast', 7, 'speedControl', 4.5
), 0),
('felon-x-bags', JSON_OBJECT(
  'slug', 'felon-x-bags', 'name', 'Felon X — Patriot Mark', 'category', 'cornhole-bags', 'categoryLabel', 'ACL Bags',
  'subcategory', 'felon-x', 'subcategoryLabel', 'Felon X', 'priceSource', 'subcategory', 'price', 79.99,
  'image', '/images/shop/felon-x.jpeg', 'alt', 'Patriotic Felon X cornhole bag set', 'eyebrow', 'Felon X family',
  'description', 'A true-balance choice with pace to collect and a composed control face.',
  'features', JSON_ARRAY('Fast side speed: 7', 'Control side speed: 5', 'Competition-size set of four', 'Double-stitched construction'),
  'colors', JSON_ARRAY('Patriot Mark'), 'sizes', JSON_ARRAY('Set of 4'), 'badge', 'ACL Pro', 'speedFast', 7, 'speedControl', 5
), 0),
('felon-x-league-test-bags', JSON_OBJECT(
  'slug', 'felon-x-league-test-bags', 'name', 'Felon X — League Test Set', 'category', 'cornhole-bags', 'categoryLabel', 'ACL Bags',
  'subcategory', 'felon-x', 'subcategoryLabel', 'Felon X', 'priceSource', 'subcategory', 'price', 79.99,
  'image', '/images/shop/felon-x.jpeg', 'alt', 'Preview Felon X cornhole bag set', 'eyebrow', 'Starter product',
  'description', 'A temporary Felon X product entry ready for final artwork, copy, and color details.',
  'features', JSON_ARRAY('Fast side speed: 7', 'Control side speed: 5', 'Competition-size set of four', 'Replaceable starter listing'),
  'colors', JSON_ARRAY('Preview colorway'), 'sizes', JSON_ARRAY('Set of 4'), 'badge', 'Preview', 'speedFast', 7, 'speedControl', 5
), 0),
('menace-x-bags', JSON_OBJECT(
  'slug', 'menace-x-bags', 'name', 'Menace X — Patriot Mark', 'category', 'cornhole-bags', 'categoryLabel', 'ACL Bags',
  'subcategory', 'menace-x', 'subcategoryLabel', 'Menace X', 'priceSource', 'subcategory', 'price', 79.99,
  'image', '/images/shop/menace-x.jpeg', 'alt', 'Patriotic Menace X cornhole bag set', 'eyebrow', 'Menace X family',
  'description', 'A hard-charging finish paired with a sticky side for blocks, cuts, and dirty boards.',
  'features', JSON_ARRAY('Fast side speed: 8', 'Control side speed: 3', 'Competition-size set of four', 'Double-stitched construction'),
  'colors', JSON_ARRAY('Patriot Mark'), 'sizes', JSON_ARRAY('Set of 4'), 'badge', 'ACL Pro', 'speedFast', 8, 'speedControl', 3
), 0),
('menace-x-blocker-test-bags', JSON_OBJECT(
  'slug', 'menace-x-blocker-test-bags', 'name', 'Menace X — Blocker Test Set', 'category', 'cornhole-bags', 'categoryLabel', 'ACL Bags',
  'subcategory', 'menace-x', 'subcategoryLabel', 'Menace X', 'priceSource', 'subcategory', 'price', 79.99,
  'image', '/images/shop/menace-x.jpeg', 'alt', 'Preview Menace X cornhole bag set', 'eyebrow', 'Starter product',
  'description', 'A temporary Menace X product entry ready for final artwork, copy, and color details.',
  'features', JSON_ARRAY('Fast side speed: 8', 'Control side speed: 3', 'Competition-size set of four', 'Replaceable starter listing'),
  'colors', JSON_ARRAY('Preview colorway'), 'sizes', JSON_ARRAY('Set of 4'), 'badge', 'Preview', 'speedFast', 8, 'speedControl', 3
), 0),
('prodigy-x-bags', JSON_OBJECT(
  'slug', 'prodigy-x-bags', 'name', 'Prodigy X — Patriot Skull', 'category', 'cornhole-bags', 'categoryLabel', 'ACL Bags',
  'subcategory', 'prodigy-x', 'subcategoryLabel', 'Prodigy X', 'priceSource', 'subcategory', 'price', 79.99,
  'image', '/images/shop/prodigy-x.jpeg', 'alt', 'Patriotic Prodigy X cornhole bag set', 'eyebrow', 'Prodigy X family',
  'description', 'A versatile pairing for quick finishes, dependable pushes, and everyday rotation.',
  'features', JSON_ARRAY('Fast side speed: 8', 'Control side speed: 5', 'Competition-size set of four', 'Double-stitched construction'),
  'colors', JSON_ARRAY('Patriot Skull'), 'sizes', JSON_ARRAY('Set of 4'), 'badge', 'ACL Pro', 'speedFast', 8, 'speedControl', 5
), 0),
('prodigy-x-flight-test-bags', JSON_OBJECT(
  'slug', 'prodigy-x-flight-test-bags', 'name', 'Prodigy X — Flight Test Set', 'category', 'cornhole-bags', 'categoryLabel', 'ACL Bags',
  'subcategory', 'prodigy-x', 'subcategoryLabel', 'Prodigy X', 'priceSource', 'subcategory', 'price', 79.99,
  'image', '/images/shop/prodigy-x.jpeg', 'alt', 'Preview Prodigy X cornhole bag set', 'eyebrow', 'Starter product',
  'description', 'A temporary Prodigy X product entry ready for final artwork, copy, and color details.',
  'features', JSON_ARRAY('Fast side speed: 8', 'Control side speed: 5', 'Competition-size set of four', 'Replaceable starter listing'),
  'colors', JSON_ARRAY('Preview colorway'), 'sizes', JSON_ARRAY('Set of 4'), 'badge', 'Preview', 'speedFast', 8, 'speedControl', 5
), 0),
('hellion-x-bags', JSON_OBJECT(
  'slug', 'hellion-x-bags', 'name', 'Hellion X — Ice Patriot', 'category', 'cornhole-bags', 'categoryLabel', 'ACL Bags',
  'subcategory', 'hellion-x', 'subcategoryLabel', 'Hellion X', 'priceSource', 'subcategory', 'price', 79.99,
  'image', '/images/shop/hellion-x.jpeg', 'alt', 'Ice blue patriotic Hellion X cornhole bag set', 'eyebrow', 'Hellion X family',
  'description', 'A fast finish with enough grip to shape shots and recover through the lane.',
  'features', JSON_ARRAY('Fast side speed: 8', 'Control side speed: 4', 'Competition-size set of four', 'Double-stitched construction'),
  'colors', JSON_ARRAY('Ice Blue / Patriot'), 'sizes', JSON_ARRAY('Set of 4'), 'badge', 'ACL Pro', 'speedFast', 8, 'speedControl', 4
), 0),
('hellion-x-lane-test-bags', JSON_OBJECT(
  'slug', 'hellion-x-lane-test-bags', 'name', 'Hellion X — Lane Test Set', 'category', 'cornhole-bags', 'categoryLabel', 'ACL Bags',
  'subcategory', 'hellion-x', 'subcategoryLabel', 'Hellion X', 'priceSource', 'subcategory', 'price', 79.99,
  'image', '/images/shop/hellion-x.jpeg', 'alt', 'Preview Hellion X cornhole bag set', 'eyebrow', 'Starter product',
  'description', 'A temporary Hellion X product entry ready for final artwork, copy, and color details.',
  'features', JSON_ARRAY('Fast side speed: 8', 'Control side speed: 4', 'Competition-size set of four', 'Replaceable starter listing'),
  'colors', JSON_ARRAY('Preview colorway'), 'sizes', JSON_ARRAY('Set of 4'), 'badge', 'Preview', 'speedFast', 8, 'speedControl', 4
), 0)
ON DUPLICATE KEY UPDATE data = VALUES(data), is_deleted = 0;
