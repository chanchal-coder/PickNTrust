const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

function resolveDbPath() {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.length > 0) {
    if (envUrl.startsWith('file:')) {
      const p = envUrl.replace(/^file:/, '');
      return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
    }
    return path.isAbsolute(envUrl) ? envUrl : path.join(process.cwd(), envUrl);
  }
  return path.join(process.cwd(), 'database.sqlite');
}

const dbPath = resolveDbPath();
const db = new Database(dbPath);
const app = express();
const PORT = Number(process.env.PORT || 5050);

app.get('/api/products', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        id,
        title AS name,
        description,
        price,
        original_price AS originalPrice,
        currency,
        image_url AS imageUrl,
        affiliate_url AS affiliateUrl,
        category,
        rating,
        review_count AS reviewCount,
        discount,
        COALESCE(is_featured, 0) AS isFeatured,
        COALESCE(is_active, 1) AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM unified_content
      WHERE 
        (status IN ('active','published') OR status IS NULL)
        AND (visibility IN ('public','visible') OR visibility IS NULL)
        AND (processing_status != 'archived' OR processing_status IS NULL)
      ORDER BY id DESC
      LIMIT 50
    `).all();
    res.json({ products: rows, total: rows.length, hasMore: false, page: 1 });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Quick API server listening on http://127.0.0.1:${PORT}`);
  console.log('DB Path:', dbPath);
});