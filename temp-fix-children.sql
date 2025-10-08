BEGIN;
UPDATE categories SET parent_id = NULL, is_for_products=1, is_for_services=0, is_for_ai_apps=0, display_order=2 WHERE name='Accessories';
UPDATE categories SET parent_id = NULL, is_for_products=1, is_for_services=0, is_for_ai_apps=0, display_order=13 WHERE name='Travel';
COMMIT;
