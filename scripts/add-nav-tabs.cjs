// Insert missing navigation tabs: Fresh Picks, Artist's Corner, OTT Hub
// Usage: node scripts/add-nav-tabs.cjs
const path = require('path');
const Database = require('better-sqlite3');

function ensureTab(db, tab) {
  const exists = db.prepare(`SELECT COUNT(*) AS c FROM nav_tabs WHERE slug = ?`).get(tab.slug).c;
  if (exists > 0) {
    console.log(`- Exists: ${tab.slug} (${tab.name})`);
    return false;
  }

  // Determine next display_order
  const maxOrderRow = db.prepare(`SELECT COALESCE(MAX(display_order), 0) AS maxOrder FROM nav_tabs`).get();
  const nextOrder = Number(maxOrderRow.maxOrder || 0) + 1;

  const payload = {
    name: String(tab.name),
    slug: String(tab.slug).toLowerCase(),
    icon: tab.icon || 'fas fa-tag',
    color_from: tab.color_from || '#3B82F6',
    color_to: tab.color_to || '#1D4ED8',
    color_style: 'gradient',
    display_order: nextOrder,
    is_active: 1,
    is_system: 0,
    description: tab.description || ''
  };

  const stmt = db.prepare(`
    INSERT INTO nav_tabs (name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description)
    VALUES (@name, @slug, @icon, @color_from, @color_to, @color_style, @display_order, @is_active, @is_system, @description)
  `);
  const res = stmt.run(payload);
  console.log(`+ Added: ${tab.slug} (${tab.name}) id=${res.lastInsertRowid}, order=${payload.display_order}`);
  return true;
}

try {
  const dbFile = path.join(__dirname, '..', 'database.sqlite');
  const db = new Database(dbFile);

  console.log('Seeding missing navigation tabs...');
  db.exec('BEGIN');
  try {
    ensureTab(db, {
      name: 'Fresh Picks',
      slug: 'fresh-picks',
      icon: 'fas fa-leaf',
      color_from: '#10B981',
      color_to: '#06B6D4',
      description: 'Latest and freshest curated selections'
    });

    ensureTab(db, {
      name: "Artist's Corner",
      slug: 'artists-corner',
      icon: 'fas fa-palette',
      color_from: '#8B5CF6',
      color_to: '#EC4899',
      description: 'Creative picks, art and design highlights'
    });

    ensureTab(db, {
      name: 'OTT Hub',
      slug: 'ott-hub',
      icon: 'fas fa-tv',
      color_from: '#EF4444',
      color_to: '#F59E0B',
      description: 'Streaming, OTT platforms and entertainment'
    });

    db.exec('COMMIT');
    console.log('Done.');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  } finally {
    db.close();
  }
} catch (err) {
  console.error('Error seeding nav_tabs:', err.message);
  process.exit(1);
}