// Ensure Prime/Cue/Value Picks exist, are active, and ordered first
const path = require('path');
const Database = require('better-sqlite3');

function getDbPath() {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.length > 0) {
    if (envUrl.startsWith('file:')) {
      const p = envUrl.replace(/^file:/, '');
      return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
    }
    return path.isAbsolute(envUrl) ? envUrl : path.join(process.cwd(), envUrl);
  }
  // Default to project root database.sqlite to match server usage
  return path.join(process.cwd(), 'database.sqlite');
}

try {
  const dbPath = getDbPath();
  console.log('Using database:', dbPath);
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');

  const ensureTab = db.prepare(`
    INSERT INTO nav_tabs (name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'gradient', ?, 1, 1, ?, strftime('%s','now'), strftime('%s','now'))
  `);

  const getBySlug = db.prepare('SELECT id, is_active, display_order FROM nav_tabs WHERE slug = ?');
  const activate = db.prepare('UPDATE nav_tabs SET is_active = 1 WHERE id = ?');

  const core = [
    { name: 'Prime Picks', slug: 'prime-picks', icon: 'fas fa-crown', from: '#8B5CF6', to: '#7C3AED', desc: 'Premium curated products' },
    { name: 'Cue Picks', slug: 'cue-picks', icon: 'fas fa-bullseye', from: '#06B6D4', to: '#0891B2', desc: 'Smart selections curated with precision' },
    { name: 'Value Picks', slug: 'value-picks', icon: 'fas fa-gem', from: '#F59E0B', to: '#D97706', desc: 'Best value for money products' },
  ];

  // Ensure presence and activation
  let maxOrder = (db.prepare('SELECT COALESCE(MAX(display_order), 0) as max_order FROM nav_tabs').get().max_order) || 0;
  for (const c of core) {
    const row = getBySlug.get(c.slug);
    if (!row) {
      maxOrder = maxOrder + 1;
      ensureTab.run(c.name, c.slug, c.icon, c.from, c.to, maxOrder, c.desc);
      console.log(`Added missing tab: ${c.name}`);
    } else if (!row.is_active) {
      activate.run(row.id);
      console.log(`Activated tab: ${c.name}`);
    }
  }

  // Reassign orders: Prime(1), Cue(2), Value(3), others start from 4 preserving relative order
  db.transaction(() => {
    // Temporarily offset all orders to avoid unique collisions
    db.prepare('UPDATE nav_tabs SET display_order = display_order + 1000').run();

    const getId = db.prepare('SELECT id FROM nav_tabs WHERE slug = ?');
    const setOrder = db.prepare('UPDATE nav_tabs SET display_order = ? WHERE id = ?');

    const primeId = getId.get('prime-picks')?.id;
    const cueId = getId.get('cue-picks')?.id;
    const valueId = getId.get('value-picks')?.id;

    if (primeId) setOrder.run(1, primeId);
    if (cueId) setOrder.run(2, cueId);
    if (valueId) setOrder.run(3, valueId);

    const others = db.prepare(`
      SELECT id, slug, display_order FROM nav_tabs
      WHERE slug NOT IN ('prime-picks','cue-picks','value-picks') AND is_active = 1
      ORDER BY display_order ASC, id ASC
    `).all();
    let next = 4;
    for (const o of others) {
      setOrder.run(next++, o.id);
    }
  })();

  const final = db.prepare('SELECT name, slug, display_order, is_active FROM nav_tabs ORDER BY display_order ASC').all();
  console.log('\nCurrent Navigation Tabs (ordered):');
  for (const t of final) {
    console.log(`  ${t.display_order}. ${t.name} (${t.slug}) - ${t.is_active ? 'Active' : 'Inactive'}`);
  }

  db.close();
  console.log('Done. Prime/Cue/Value Picks should appear first in the navbar.');
  process.exit(0);
} catch (err) {
  console.error('Failed to ensure core picks first:', err);
  process.exit(1);
}