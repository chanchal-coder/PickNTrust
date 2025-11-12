const Database = require('better-sqlite3');
const path = require('path');

function dbPath() {
  // Use project root database.sqlite (matches server/config resolution)
  return path.join(__dirname, '..', 'database.sqlite');
}

function main() {
  const db = new Database(dbPath());
  const parent = 'Home & Living';
  console.log('Database:', dbPath());
  console.log('Parent category:', parent);

  const parentRow = db.prepare(
    "SELECT id, name, parent_id FROM categories WHERE LOWER(name) = LOWER(?)"
  ).get(parent);
  console.log('Parent row:', parentRow);

  if (parentRow && parentRow.id) {
    const children = db.prepare(
      "SELECT id, name, parent_id FROM categories WHERE parent_id = ? ORDER BY display_order ASC, name ASC"
    ).all(parentRow.id);
    console.log('\nChildren in categories table:', children.length);
    children.forEach((c, i) => console.log(`  ${i + 1}. ${c.name} (id=${c.id})`));
  } else {
    console.log('\nParent not found in categories table');
  }

  const derived = db.prepare(
    "SELECT DISTINCT TRIM(subcategory) AS name FROM unified_content WHERE category IS NOT NULL AND LOWER(category) = LOWER(?) AND subcategory IS NOT NULL AND TRIM(subcategory) != '' ORDER BY name ASC"
  ).all(parent);
  console.log('\nDerived subcategories from unified_content:', derived.length);
  derived.forEach((r, i) => console.log(`  ${i + 1}. ${r.name}`));

  db.close();
}

main();