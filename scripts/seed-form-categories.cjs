/*
 * Seed canonical form categories for Products, Services, and Apps & AI Apps
 * Idempotent: inserts only missing parent categories and sets flags/display order.
 */
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

const PRODUCTS = [
  'Fashion',
  'Accessories',
  'Home & Living',
  'Electronics & Gadgets',
  'Health',
  'Beauty',
  'Sports & Fitness',
  'Baby & Kids',
  'Automotive',
  'Books & Education',
  'Pet Supplies',
  'Office & Productivity',
  'Travel',
];

const SERVICES = [
  'Services',
  'Digital Services',
  'Financial Services',
  'Marketing Services',
  'Education Services',
  'Home Services',
  'Health & Wellness Services',
  'Travel Services',
  'Automotive Services',
  'Technology Services',
  'Business Services',
  'Legal Services',
  'Real Estate Services',
  'Creative & Design Services',
  'Repair & Maintenance Services',
  'Logistics & Delivery Services',
  'Consulting Services',
  'Entertainment Services',
  'Event Services',
];

const AIAPPS = [
  'Apps & AI Apps',
  'AI Tools',
  'AI Writing Tools',
  'AI Image Tools',
  'AI Assistants',
  'Productivity Apps',
  'Design Apps',
  'Developer Tools',
  'Business Analytics Apps',
  'Education Apps',
  'Finance Apps',
  'Health & Fitness Apps',
  'Marketing Automation',
  'Social Media Tools',
  'Entertainment Apps',
  'Utilities',
];

function ensureCategory(name, flags) {
  const existing = db.prepare(`SELECT id FROM categories WHERE name = ?`).get(name);
  if (existing && existing.id) {
    // Update flags if needed
    db.prepare(`
      UPDATE categories
      SET is_for_products = COALESCE(?, is_for_products),
          is_for_services = COALESCE(?, is_for_services),
          is_for_ai_apps = COALESCE(?, is_for_ai_apps),
          is_active = COALESCE(1, is_active)
      WHERE id = ?
    `).run(flags.is_for_products, flags.is_for_services, flags.is_for_ai_apps, existing.id);
    return existing.id;
  }
  const displayOrder = flags.display_order ?? 0;
  const defaultIcon = '📦';
  const defaultColor = '#666666';
  const defaultDescription = '';
  const info = db.prepare(`
    INSERT INTO categories (name, parent_id, icon, color, description, is_for_products, is_for_services, is_for_ai_apps, is_active, display_order)
    VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(name, defaultIcon, defaultColor, defaultDescription, flags.is_for_products || 0, flags.is_for_services || 0, flags.is_for_ai_apps || 0, displayOrder);
  return info.lastInsertRowid;
}

db.transaction(() => {
  PRODUCTS.forEach((name, idx) => ensureCategory(name, { is_for_products: 1, display_order: idx + 1 }));
  SERVICES.forEach((name, idx) => ensureCategory(name, { is_for_services: 1, display_order: idx + 1 }));
  AIAPPS.forEach((name, idx) => ensureCategory(name, { is_for_ai_apps: 1, display_order: idx + 1 }));
})();

console.log('✅ Seeded form categories (products/services/aiapps) to database');
db.close();