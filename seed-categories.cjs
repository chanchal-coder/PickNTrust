const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

const insert = db.prepare(`
  INSERT INTO categories (
    name, description, icon, color,
    display_order, is_for_products, is_for_services, is_for_ai_apps, is_active
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const rows = [
  ['Home Services', 'Local and on-demand services for home', 'mdi-home', '#4caf50', 1, 0, 1, 0, 1],
  ['Finance', 'Money, budgeting, and financial tools', 'mdi-cash', '#3f51b5', 2, 1, 0, 1, 1]
];

const tx = db.transaction(() => {
  for (const r of rows) insert.run(...r);
});

try {
  tx();
  console.log('✅ Seeded categories:', rows.map(r => r[0]).join(', '));
} catch (e) {
  console.error('❌ Failed to seed categories:', e.message);
  process.exit(1);
}