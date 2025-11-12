BEGIN;
INSERT OR IGNORE INTO categories (name, icon, color, description, parent_id, display_order, is_for_products, is_for_services, is_for_ai_apps, is_active)
VALUES ('Services','mdi-tag','#888888','',NULL,1,0,1,0,1);
UPDATE categories SET parent_id = NULL, is_active = 1 WHERE name = 'Services';
UPDATE categories SET is_for_services = 1, display_order = 1 WHERE name = 'Services' AND parent_id IS NULL;
COMMIT;