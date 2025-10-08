.mode list
SELECT name, display_order FROM categories WHERE is_for_products=1 AND parent_id IS NULL ORDER BY display_order, name;
