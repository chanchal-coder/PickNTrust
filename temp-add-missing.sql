BEGIN;
INSERT OR IGNORE INTO categories (name, parent_id, icon, color, description, is_for_products, is_for_services, is_for_ai_apps, is_active, display_order) VALUES ('Accessories', NULL, '', '', '', 1, 0, 0, 1, 2);
INSERT OR IGNORE INTO categories (name, parent_id, icon, color, description, is_for_products, is_for_services, is_for_ai_apps, is_active, display_order) VALUES ('Travel', NULL, '', '', '', 1, 0, 0, 1, 13);
COMMIT;
