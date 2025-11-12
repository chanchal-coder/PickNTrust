const Database = require('better-sqlite3');

function normalizePagesString(pagesStr) {
  if (pagesStr == null) return null;
  const s = String(pagesStr).trim();
  if (!s) return null;
  let arr = [];
  try {
    // Handle cases like: '["apps","top-picks"],top-picks'
    const lastBracket = s.lastIndexOf(']');
    const jsonCandidate = lastBracket >= 0 ? s.slice(0, lastBracket + 1) : s;
    if (jsonCandidate.startsWith('[') && jsonCandidate.endsWith(']')) {
      arr = JSON.parse(jsonCandidate);
    } else if (s.includes(',')) {
      arr = s.split(',').map(x => x.trim()).filter(Boolean);
    } else {
      arr = [s];
    }
  } catch (e) {
    // Fallback to comma split
    arr = s.split(',').map(x => x.trim()).filter(Boolean);
  }
  // Normalize slugs
  arr = arr.map(p => String(p).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')).filter(Boolean);
  // De-duplicate and remove obvious noise
  const unique = Array.from(new Set(arr));
  return JSON.stringify(unique);
}

function fixRecent(limit = 100) {
  const db = new Database('/var/www/pickntrust/database.sqlite');
  const rows = db.prepare(`
    SELECT id, display_pages FROM unified_content
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
  let updated = 0;
  const update = db.prepare(`UPDATE unified_content SET display_pages = ? WHERE id = ?`);
  for (const r of rows) {
    const normalized = normalizePagesString(r.display_pages);
    if (normalized && normalized !== r.display_pages) {
      update.run(normalized, r.id);
      updated++;
    }
  }
  db.close();
  console.log(`FIXED_ROWS: ${updated} / ${rows.length}`);
}

try {
  fixRecent(200);
} catch (e) {
  console.error('FIX_ERROR:', e && e.message ? e.message : e);
}