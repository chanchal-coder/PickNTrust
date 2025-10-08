SELECT COUNT(*) FROM categories WHERE is_for_products=1 AND parent_id IS NULL;
SELECT COUNT(*) FROM categories WHERE is_for_services=1 AND parent_id IS NULL;
SELECT COUNT(*) FROM categories WHERE is_for_ai_apps=1 AND parent_id IS NULL;
