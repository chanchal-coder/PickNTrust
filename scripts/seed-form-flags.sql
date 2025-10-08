BEGIN;
-- Promote known children to parents if present (idempotent)
UPDATE categories SET parent_id = NULL WHERE name IN ('Accessories','Travel');

-- Ensure curated parents are active
UPDATE categories SET is_active=1 WHERE parent_id IS NULL AND name IN (
  'Fashion','Accessories','Home & Living','Electronics & Gadgets','Health','Beauty','Sports & Fitness','Baby & Kids','Automotive','Books & Education','Pet Supplies','Office & Productivity','Travel',
  'Services','Digital Services','Financial Services','Marketing Services','Education Services','Home Services','Health & Wellness Services','Travel Services','Automotive Services','Technology Services','Business Services','Legal Services','Real Estate Services','Creative & Design Services','Repair & Maintenance Services','Logistics & Delivery Services','Consulting Services','Entertainment Services','Event Services',
  'Apps & AI Apps','AI Tools','AI Writing Tools','AI Image Tools','AI Assistants','Productivity Apps','Design Apps','Developer Tools','Business Analytics Apps','Education Apps','Finance Apps','Health & Fitness Apps','Marketing Automation','Social Media Tools','Entertainment Apps','Utilities'
);

-- Zero out flags on all parent categories (clean slate)
UPDATE categories SET is_for_products=0, is_for_services=0, is_for_ai_apps=0 WHERE parent_id IS NULL;

-- Products (13)
UPDATE categories SET is_for_products=1, display_order=1 WHERE name='Fashion' AND parent_id IS NULL;
UPDATE categories SET is_for_products=1, display_order=2 WHERE name='Accessories' AND parent_id IS NULL;
UPDATE categories SET is_for_products=1, display_order=3 WHERE name='Home & Living' AND parent_id IS NULL;
UPDATE categories SET is_for_products=1, display_order=4 WHERE name='Electronics & Gadgets' AND parent_id IS NULL;
UPDATE categories SET is_for_products=1, display_order=5 WHERE name='Health' AND parent_id IS NULL;
UPDATE categories SET is_for_products=1, display_order=6 WHERE name='Beauty' AND parent_id IS NULL;
UPDATE categories SET is_for_products=1, display_order=7 WHERE name='Sports & Fitness' AND parent_id IS NULL;
UPDATE categories SET is_for_products=1, display_order=8 WHERE name='Baby & Kids' AND parent_id IS NULL;
UPDATE categories SET is_for_products=1, display_order=9 WHERE name='Automotive' AND parent_id IS NULL;
UPDATE categories SET is_for_products=1, display_order=10 WHERE name='Books & Education' AND parent_id IS NULL;
UPDATE categories SET is_for_products=1, display_order=11 WHERE name='Pet Supplies' AND parent_id IS NULL;
UPDATE categories SET is_for_products=1, display_order=12 WHERE name='Office & Productivity' AND parent_id IS NULL;
UPDATE categories SET is_for_products=1, display_order=13 WHERE name='Travel' AND parent_id IS NULL;

-- Services (19)
UPDATE categories SET is_for_services=1, display_order=1 WHERE name='Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=2 WHERE name='Digital Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=3 WHERE name='Financial Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=4 WHERE name='Marketing Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=5 WHERE name='Education Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=6 WHERE name='Home Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=7 WHERE name='Health & Wellness Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=8 WHERE name='Travel Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=9 WHERE name='Automotive Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=10 WHERE name='Technology Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=11 WHERE name='Business Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=12 WHERE name='Legal Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=13 WHERE name='Real Estate Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=14 WHERE name='Creative & Design Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=15 WHERE name='Repair & Maintenance Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=16 WHERE name='Logistics & Delivery Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=17 WHERE name='Consulting Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=18 WHERE name='Entertainment Services' AND parent_id IS NULL;
UPDATE categories SET is_for_services=1, display_order=19 WHERE name='Event Services' AND parent_id IS NULL;

-- Apps & AI Apps (16)
UPDATE categories SET is_for_ai_apps=1, display_order=1 WHERE name='Apps & AI Apps' AND parent_id IS NULL;
UPDATE categories SET is_for_ai_apps=1, display_order=2 WHERE name='AI Tools' AND parent_id IS NULL;
UPDATE categories SET is_for_ai_apps=1, display_order=3 WHERE name='AI Writing Tools' AND parent_id IS NULL;
UPDATE categories SET is_for_ai_apps=1, display_order=4 WHERE name='AI Image Tools' AND parent_id IS NULL;
UPDATE categories SET is_for_ai_apps=1, display_order=5 WHERE name='AI Assistants' AND parent_id IS NULL;
UPDATE categories SET is_for_ai_apps=1, display_order=6 WHERE name='Productivity Apps' AND parent_id IS NULL;
UPDATE categories SET is_for_ai_apps=1, display_order=7 WHERE name='Design Apps' AND parent_id IS NULL;
UPDATE categories SET is_for_ai_apps=1, display_order=8 WHERE name='Developer Tools' AND parent_id IS NULL;
UPDATE categories SET is_for_ai_apps=1, display_order=9 WHERE name='Business Analytics Apps' AND parent_id IS NULL;
UPDATE categories SET is_for_ai_apps=1, display_order=10 WHERE name='Education Apps' AND parent_id IS NULL;
UPDATE categories SET is_for_ai_apps=1, display_order=11 WHERE name='Finance Apps' AND parent_id IS NULL;
UPDATE categories SET is_for_ai_apps=1, display_order=12 WHERE name='Health & Fitness Apps' AND parent_id IS NULL;
UPDATE categories SET is_for_ai_apps=1, display_order=13 WHERE name='Marketing Automation' AND parent_id IS NULL;
UPDATE categories SET is_for_ai_apps=1, display_order=14 WHERE name='Social Media Tools' AND parent_id IS NULL;
UPDATE categories SET is_for_ai_apps=1, display_order=15 WHERE name='Entertainment Apps' AND parent_id IS NULL;
UPDATE categories SET is_for_ai_apps=1, display_order=16 WHERE name='Utilities' AND parent_id IS NULL;
COMMIT;