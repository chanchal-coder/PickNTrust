const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Ensure video_content schema supports pages and homepage flag
function ensureVideoContentSchema() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS video_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL,
      thumbnail_url TEXT,
      platform TEXT,
      category TEXT,
      tags TEXT,
      duration TEXT,
      has_timer INTEGER DEFAULT 0,
      timer_duration INTEGER,
      timer_start_time INTEGER,
      pages TEXT,
      show_on_homepage INTEGER DEFAULT 1,
      created_at INTEGER,
      updated_at INTEGER
    )
  `;
  db.run(createSql, [], (err) => {
    if (err) console.error('Error ensuring video_content table:', err.message);
    db.all(`PRAGMA table_info(video_content)`, [], (err2, rows) => {
      if (err2) {
        console.error('PRAGMA table_info error:', err2.message);
        return;
      }
      const cols = new Set((rows || []).map(r => r.name));
      const addCol = (name, type, def) => {
        if (!cols.has(name)) {
          const sql = `ALTER TABLE video_content ADD COLUMN ${name} ${type} ${def || ''}`.trim();
          db.run(sql, [], (err3) => {
            if (err3) console.error(`Failed to add column ${name}:`, err3.message);
            else console.log(`Added column ${name} to video_content`);
          });
        }
      };
      addCol('pages', 'TEXT', '');
      addCol('show_on_homepage', 'INTEGER', 'DEFAULT 1');
    });
  });
}

ensureVideoContentSchema();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default pages for videos when none are provided
const DEFAULT_VIDEO_PAGES = [
  'home',
  'blog',
  'cue-picks',
  'global-picks',
  'loot-box',
  'live-deals',
  'travel-picks',
  'value-picks',
  'top-picks',
  'services',
  'apps',
  'prime-picks',
  'click-picks',
  'deals-hub',
  'trending'
];

// Helper: normalize and proxy image URLs; provide placeholder if missing
function toProxiedImage(url) {
  const placeholder = '/assets/card-placeholder.svg';
  if (!url || typeof url !== 'string' || url.trim() === '') return placeholder;
  // In production, serve direct external URLs as-is; keep local paths unchanged
  const normalized = url.startsWith('http') ? url : url;
  return normalized;
}

// In production, serve static files from the built frontend
if (process.env.NODE_ENV === 'production') {
  // Primary Vite build output
  app.use(express.static(path.join(__dirname, 'dist', 'public'), { index: false }));
  // Legacy fallbacks
  app.use(express.static(path.join(__dirname, 'client', 'dist'), { index: false }));
  app.use(express.static(path.join(__dirname, 'dist'), { index: false }));
  app.use(express.static(path.join(__dirname, 'public'), { index: false }));
  app.use(express.static(path.join(__dirname, 'server'), { index: false }));
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'PickNTrust API is running' });
});

// Products API
app.get('/api/products', (req, res) => {
  const { search, category, limit = 50 } = req.query;
  
  let query = `
    SELECT id, title, description, price, image_url, category, rating, 
           reviews_count, discount_percentage, original_price, is_featured, 
           created_at, status
    FROM unified_content 
    WHERE status = 'active'
  `;
  
  const params = [];
  
  if (search) {
    query += ` AND title LIKE ?`;
    params.push(`%${search}%`);
  }
  
  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(parseInt(limit));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      const mapped = (rows || []).map((row) => ({
        ...row,
        name: row.title,
        imageUrl: toProxiedImage(row.image_url)
      }));
      res.json(mapped);
    }
  });
});

// Featured products
app.get('/api/products/featured', (req, res) => {
  const query = `
    SELECT id, title, description, price, image_url, category, rating, 
           reviews_count, discount_percentage, original_price, created_at, status
    FROM unified_content 
    WHERE status = 'active' AND is_featured = 1 
    ORDER BY created_at DESC 
    LIMIT 20
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      const mapped = (rows || []).map((row) => ({
        ...row,
        name: row.title,
        imageUrl: toProxiedImage(row.image_url)
      }));
      res.json(mapped);
    }
  });
});

// Product by ID
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT * FROM unified_content WHERE id = ? AND status = 'active'
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else if (!row) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json(row);
    }
  });
});

// Categories API - for category navigation (expects id, name, icon, color, description)
app.get('/api/categories', (req, res) => {
  const query = `
    SELECT 
      id,
      name,
      icon,
      color,
      description,
      parent_id as parentId,
      COALESCE(is_for_products, 1) as isForProducts,
      COALESCE(is_for_services, 0) as isForServices,
      COALESCE(is_for_ai_apps, 0) as isForAIApps,
      display_order as displayOrder
    FROM categories 
    ORDER BY display_order ASC, name ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Form-specific categories (for admin forms)
app.get('/api/categories/forms/products', (req, res) => {
  const query = `
    SELECT c.name, c.name as id, 0 as count
    FROM categories c
    WHERE (c.is_for_products = 1 OR c.is_for_products IS NULL)
      AND (c.parent_id IS NULL)
    ORDER BY c.display_order ASC, c.name ASC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

app.get('/api/categories/forms/services', (req, res) => {
  const query = `
    SELECT c.name, c.name as id, 0 as count
    FROM categories c
    WHERE (c.is_for_services = 1 OR c.is_for_services IS NULL)
      AND (c.parent_id IS NULL)
    ORDER BY c.display_order ASC, c.name ASC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

app.get('/api/categories/forms/aiapps', (req, res) => {
  const query = `
    SELECT c.name, c.name as id, 0 as count
    FROM categories c
    WHERE (c.is_for_ai_apps = 1 OR c.is_for_ai_apps IS NULL)
      AND (c.parent_id IS NULL)
    ORDER BY c.display_order ASC, c.name ASC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Browse categories endpoint - for categories component (with product counts)
app.get('/api/categories/browse', (req, res) => {
  const { type } = req.query;
  
  let typeFilter = '';
  
  // Add type filtering if specified
  if (type && type !== 'all') {
    if (type === 'products') {
      typeFilter = ` AND (uc.is_service IS NULL OR uc.is_service = 0) AND (uc.is_ai_app IS NULL OR uc.is_ai_app = 0)`;
    } else if (type === 'services') {
      typeFilter = ` AND uc.is_service = 1`;
    } else if (type === 'aiapps') {
      typeFilter = ` AND uc.is_ai_app = 1`;
    }
  }
  
  const query = `
    SELECT 
      c.id,
      c.name,
      c.icon,
      c.color,
      c.description,
      c.parent_id as parentId,
      c.is_for_products as isForProducts,
      c.is_for_services as isForServices,
      c.is_for_ai_apps as isForAIApps,
      c.display_order as displayOrder,
      COUNT(uc.id) as total_products_count,
      COUNT(CASE WHEN uc.is_featured = 1 THEN 1 END) as featured_count,
      COUNT(CASE WHEN uc.is_service = 1 THEN 1 END) as services_count,
      COUNT(CASE WHEN uc.is_ai_app = 1 THEN 1 END) as ai_apps_count
    FROM categories c
    LEFT JOIN unified_content uc ON c.name = uc.category 
      AND uc.status = 'active'
      ${typeFilter}
    WHERE c.id IS NOT NULL AND c.is_active = 1
    GROUP BY c.id, c.name, c.icon, c.color, c.description, c.parent_id, 
             c.is_for_products, c.is_for_services, c.is_for_ai_apps, c.display_order
    HAVING total_products_count > 0
    ORDER BY c.display_order ASC, c.name ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Products by category
app.get('/api/products/category/:category', (req, res) => {
  const { category } = req.params;
  const query = `
    SELECT id, title, description, price, image_url, category, rating, 
           reviews_count, discount_percentage, original_price, created_at, status
    FROM unified_content 
    WHERE category = ? AND status = 'active'
    ORDER BY created_at DESC 
    LIMIT 50
  `;
  
  db.all(query, [category], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Search products
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query required' });
  }
  
  const query = `
    SELECT id, title, description, price, image_url, category, rating, 
           reviews_count, discount_percentage, original_price, created_at, status
    FROM unified_content 
    WHERE (title LIKE ? OR category LIKE ? OR description LIKE ?) AND status = 'active'
    ORDER BY created_at DESC 
    LIMIT 50
  `;
  
  const searchTerm = `%${q}%`;
  db.all(query, [searchTerm, searchTerm, searchTerm], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Announcements API
app.get('/api/announcements', (req, res) => {
  const query = `
    SELECT id, title, content, type, is_active, created_at
    FROM announcements 
    WHERE is_active = 1 
    ORDER BY created_at DESC 
    LIMIT 10
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Admin: Add video content (compatibility route to unblock uploads)
// Accepts admin password via body.password or body.adminPassword
app.post('/api/admin/video-content', (req, res) => {
  try {
    const body = req.body || {};
    const providedPassword = String(body.adminPassword || body.password || '');
    if (providedPassword !== 'pickntrust2025') {
      return res.status(401).json({ message: 'Invalid admin password' });
    }

    const now = Math.floor(Date.now() / 1000);
    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const video_url = String(body.videoUrl || '').trim();
    const thumbnail_url = String(body.thumbnailUrl || '').trim();
    const platform = String(body.platform || 'youtube').trim();
    const category = String(body.category || 'General').trim();
    const tagsArr = Array.isArray(body.tags)
      ? body.tags
      : (typeof body.tags === 'string' ? body.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    const tags = JSON.stringify(tagsArr);
    const duration = body.duration != null ? parseInt(String(body.duration)) : null;
    const has_timer = body.hasTimer ? 1 : 0;
    const timer_duration = body.hasTimer && body.timerDuration != null ? parseInt(String(body.timerDuration)) : null;
    const timer_start_time = null;

    // Pages and homepage flag
    let pagesArr = Array.isArray(body.pages)
      ? body.pages.map(p => String(p).trim().toLowerCase()).filter(Boolean)
      : (typeof body.pages === 'string' ? String(body.pages).split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : []);
    if (!pagesArr.length) {
      pagesArr = DEFAULT_VIDEO_PAGES.slice();
    }
    const pages = JSON.stringify(pagesArr);
    const show_on_homepage = body.showOnHomepage !== undefined ? (body.showOnHomepage ? 1 : 0) : 1;

    if (!title || !video_url) {
      return res.status(400).json({ message: 'Missing required fields: title, videoUrl' });
    }

    const sql = `
      INSERT INTO video_content (
        title, description, video_url, thumbnail_url, platform, category,
        tags, duration, has_timer, timer_duration, timer_start_time, pages, show_on_homepage, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      title,
      description,
      video_url,
      thumbnail_url,
      platform,
      category,
      tags,
      duration,
      has_timer,
      timer_duration,
      timer_start_time,
      pages,
      show_on_homepage,
      now,
      now
    ];

    db.run(sql, params, function(err) {
      if (err) {
        console.error('Add video content error (compat route):', err);
        return res.status(500).json({ message: 'Failed to add video content' });
      }
      const created = {
        id: this.lastID,
        title,
        description,
        videoUrl: video_url,
        thumbnailUrl: thumbnail_url,
        platform,
        category,
        tags: tagsArr,
        duration,
        hasTimer: !!has_timer,
        timerDuration: timer_duration,
        timerStartTime: null,
        pages: pagesArr,
        showOnHomepage: !!show_on_homepage,
        createdAt: now,
        updatedAt: now
      };
      return res.json({ success: true, data: created });
    });
  } catch (error) {
    console.error('Error adding video content (compat route):', error);
    return res.status(500).json({ message: 'Failed to add video content' });
  }
});

// Get all video content with pages parsing
app.get('/api/video-content', (req, res) => {
  const q = `
    SELECT 
      id,
      title,
      description,
      video_url AS videoUrl,
      thumbnail_url AS thumbnailUrl,
      platform,
      category,
      tags,
      duration,
      pages AS pagesRaw,
      COALESCE(show_on_homepage, 1) AS showOnHomepage,
      COALESCE(has_timer, 0) AS hasTimer,
      timer_duration AS timerDuration,
      timer_start_time AS timerStartTime,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM video_content
    ORDER BY created_at DESC, id DESC
  `;
  db.all(q, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    const out = (rows || []).map(r => {
      let tagsArr = [];
      try {
        if (typeof r.tags === 'string' && r.tags.length) {
          const parsed = JSON.parse(r.tags);
          if (Array.isArray(parsed)) tagsArr = parsed.map(t => String(t));
          else tagsArr = String(r.tags).split(',').map(s => s.trim()).filter(Boolean);
        }
      } catch {
        tagsArr = String(r.tags || '').split(',').map(s => s.trim()).filter(Boolean);
      }
      let pagesArr = [];
      try {
        if (typeof r.pagesRaw === 'string' && r.pagesRaw.length) {
          const parsed = JSON.parse(r.pagesRaw);
          if (Array.isArray(parsed)) pagesArr = parsed.map(p => String(p).trim().toLowerCase()).filter(Boolean);
          else pagesArr = String(r.pagesRaw).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        }
      } catch {
        pagesArr = String(r.pagesRaw || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      }
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        videoUrl: r.videoUrl,
        thumbnailUrl: r.thumbnailUrl,
        platform: r.platform,
        category: r.category,
        tags: tagsArr,
        duration: r.duration,
        pages: pagesArr,
        showOnHomepage: !!r.showOnHomepage,
        hasTimer: !!r.hasTimer,
        timerDuration: r.timerDuration,
        timerStartTime: r.timerStartTime,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      };
    });
    res.json(out);
  });
});

// Update video content (supports pages/homepage flag) with query/header fallback
app.put('/api/admin/video-content/:id', (req, res) => {
  try {
    const body = req.body || {};
    const q = req.query || {};
    const srcPassword = body.adminPassword
      ? 'body.adminPassword'
      : body.password
      ? 'body.password'
      : req.headers['x-admin-password']
      ? 'header.x-admin-password'
      : q.adminPassword
      ? 'query.adminPassword'
      : q.password
      ? 'query.password'
      : 'none';
    console.log('🛠️ PUT /api/admin/video-content/:id [production-server.cjs] inbound', {
      url: req.originalUrl,
      idParam: req.params && req.params.id,
      srcPassword,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      bodyKeys: Object.keys(body || {}),
      queryKeys: Object.keys(q || {}),
    });
    const providedPassword = String(body.adminPassword || body.password || req.headers['x-admin-password'] || q.password || q.adminPassword || '');
    if (providedPassword !== 'pickntrust2025') {
      return res.status(401).json({ message: 'Invalid admin password' });
    }

    const id = parseInt(String(req.params.id));
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: 'Invalid id parameter' });
    }

    const fields = {};
    const getFirst = (a, b) => (typeof a !== 'undefined' ? a : b);
    const toBool = (v) => (v === true || v === 'true' || v === '1' || v === 1 || v === 'yes' || v === 'on');

    const title = getFirst(body.title, q.title);
    const description = getFirst(body.description, q.description);
    const videoUrl = getFirst(body.videoUrl, q.videoUrl);
    const thumbnailUrl = getFirst(body.thumbnailUrl, q.thumbnailUrl);
    const platform = getFirst(body.platform, q.platform);
    const category = getFirst(body.category, q.category);
    const duration = getFirst(body.duration, q.duration);
    const hasTimer = getFirst(body.hasTimer, q.hasTimer);
    const timerDuration = getFirst(body.timerDuration, q.timerDuration);
    const tags = getFirst(body.tags, q.tags);
    const pages = getFirst(body.pages, q.pages);
    const showOnHomepage = getFirst(body.showOnHomepage, q.showOnHomepage);

    if (typeof title !== 'undefined') fields.title = String(title || '').trim();
    if (typeof description !== 'undefined') fields.description = String(description || '').trim();
    if (typeof videoUrl !== 'undefined') fields.video_url = String(videoUrl || '').trim();
    if (typeof thumbnailUrl !== 'undefined') fields.thumbnail_url = String(thumbnailUrl || '').trim();
    if (typeof platform !== 'undefined') fields.platform = String(platform || '').trim();
    if (typeof category !== 'undefined') fields.category = String(category || '').trim();
    if (typeof duration !== 'undefined') fields.duration = duration != null ? String(duration) : null;
    if (typeof hasTimer !== 'undefined') fields.has_timer = toBool(hasTimer) ? 1 : 0;
    if (typeof timerDuration !== 'undefined') fields.timer_duration = timerDuration != null ? parseInt(String(timerDuration)) : null;
    if (typeof tags !== 'undefined') {
      const tagsArr = Array.isArray(tags)
        ? tags
        : (typeof tags === 'string' ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : []);
      fields.tags = JSON.stringify(tagsArr);
    }
    if (typeof pages !== 'undefined') {
      const pagesArr = Array.isArray(pages)
        ? pages.map(p => String(p).trim().toLowerCase()).filter(Boolean)
        : (typeof pages === 'string' ? String(pages).split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : []);
      fields.pages = JSON.stringify(pagesArr);
    }
    if (typeof showOnHomepage !== 'undefined') fields.show_on_homepage = toBool(showOnHomepage) ? 1 : 0;
    fields.updated_at = Math.floor(Date.now() / 1000);

    console.log('🔎 PUT /api/admin/video-content/:id [production-server.cjs] resolved fields', {
      keys: Object.keys(fields),
      hasTitle: typeof fields.title !== 'undefined',
      hasDescription: typeof fields.description !== 'undefined',
      hasVideoUrl: typeof fields.video_url !== 'undefined',
      hasThumbnailUrl: typeof fields.thumbnail_url !== 'undefined',
      tagsSet: typeof fields.tags !== 'undefined',
      pagesSet: typeof fields.pages !== 'undefined',
      showOnHomepage: fields.show_on_homepage,
      hasTimer: typeof fields.has_timer !== 'undefined' ? fields.has_timer : undefined,
      timerDuration: typeof fields.timer_duration !== 'undefined' ? fields.timer_duration : undefined,
    });

    const keys = Object.keys(fields);
    if (keys.length === 0) {
      return res.json({ message: 'No fields provided to update' });
    }
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => fields[k]);
    const sql = `UPDATE video_content SET ${setClauses} WHERE id = ?`;
    db.run(sql, [...values, id], function(err) {
      if (err) {
        console.error('Update video content error:', err);
        return res.status(500).json({ message: 'Failed to update video content' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Video content not found' });
      }
      db.get(`
        SELECT id, title, description, video_url AS videoUrl, thumbnail_url AS thumbnailUrl, platform, category, tags, duration,
               pages AS pagesRaw, COALESCE(show_on_homepage, 1) AS showOnHomepage,
               COALESCE(has_timer, 0) AS hasTimer, timer_duration AS timerDuration, timer_start_time AS timerStartTime,
               created_at AS createdAt, updated_at AS updatedAt
        FROM video_content WHERE id = ?
      `, [id], (err2, row) => {
        if (err2 || !row) return res.json({ success: true });
        let tagsArr = [];
        try { tagsArr = JSON.parse(row.tags); } catch { tagsArr = String(row.tags || '').split(',').map(s => s.trim()).filter(Boolean); }
        let pagesArr = [];
        try { pagesArr = JSON.parse(row.pagesRaw); } catch { pagesArr = String(row.pagesRaw || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean); }
        return res.json({ success: true, data: {
          id: row.id,
          title: row.title,
          description: row.description,
          videoUrl: row.videoUrl,
          thumbnailUrl: row.thumbnailUrl,
          platform: row.platform,
          category: row.category,
          tags: Array.isArray(tagsArr) ? tagsArr : [],
          duration: row.duration,
          pages: Array.isArray(pagesArr) ? pagesArr : [],
          showOnHomepage: !!row.showOnHomepage,
          hasTimer: !!row.hasTimer,
          timerDuration: row.timerDuration,
          timerStartTime: row.timerStartTime,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }});
      });
    });
  } catch (error) {
    console.error('Error updating video content:', error);
    return res.status(500).json({ message: 'Failed to update video content' });
  }
});

// In production, serve the SPA index.html for all non-API routes (placed after API routes)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    const possiblePaths = [
      path.join(__dirname, 'dist', 'public', 'index.html'), // Vite output
      path.join(__dirname, 'client', 'dist', 'index.html'),
      path.join(__dirname, 'public', 'index.html'),
      path.join(__dirname, 'dist', 'index.html'),
      path.join(__dirname, 'server', 'index.html'),
      path.join(__dirname, 'index.html')
    ];
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        console.log(`Serving React app from: ${filePath}`);
        return res.sendFile(filePath);
      }
    }
    console.warn('React app index.html not found. Returning simple message.');
    res.status(404).send('Cannot GET /');
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`PickNTrust server running on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
// Subcategories for a given parent category name
app.get('/api/categories/subcategories', (req, res) => {
  const { parent } = req.query;
  const parentInput = String(parent || '').trim();
  if (!parentInput) {
    return res.json([]);
  }

  // Helper: case-insensitive parent lookup with synonym mapping
  const lookupParent = (input, cb) => {
    const SYNONYMS_TO_CANONICAL = {
      'electronics': 'Electronics & Gadgets',
      'tech': 'Electronics & Gadgets',
      'technology': 'Electronics & Gadgets',
      'electronics&gadgets': 'Electronics & Gadgets',
      'electronics & gadgets': 'Electronics & Gadgets',
      'home & kitchen': 'Home & Living',
      'home and kitchen': 'Home & Living',
      'beauty & personal care': 'Beauty',
      'personal care': 'Beauty',
      'apps and ai apps': 'Apps & AI Apps',
      'ai apps': 'Apps & AI Apps',
      'services': 'Services',
    };
    const lower = String(input || '').toLowerCase().trim();
    const canonical = SYNONYMS_TO_CANONICAL[lower];
    const sql = `SELECT id, name FROM categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1`;
    db.get(sql, [input], (err, row) => {
      if (err) return cb(err);
      if (row && row.id) return cb(null, row);
      if (!canonical) return cb(null, null);
      db.get(sql, [canonical], (err2, row2) => {
        if (err2) return cb(err2);
        cb(null, row2 || null);
      });
    });
  };

  // Helper: derive subcategories from unified_content when categories table has no children
  const deriveFromUnifiedContent = (input, cb) => {
    const normalize = (s) => String(s || '')
      .toLowerCase()
      .replace(/[\u2013\u2014\-]/g, ' ')
      .replace(/&/g, 'and')
      .replace(/\s+/g, ' ')
      .trim();
    const parentNorm = normalize(input);
    const words = parentNorm.split(' ').filter(Boolean);

    // Build token list including simple synonyms for electronics domain
    const wordSynonyms = {
      electronics: ['electronics', 'electronic', 'gadgets', 'gadget', 'tech', 'technology', 'consumer electronics'],
      mobile: ['mobile', 'smartphone', 'phone', 'cell phone', 'cellphone', 'mobile phone', 'android phone', 'iphone', 'smartphones', 'phones'],
      smartphone: ['smartphone', 'smartphones', 'phone', 'phones', 'mobile', 'mobile phone', 'cell phone', 'cellphone'],
      phones: ['phone', 'phones', 'smartphone', 'smartphones', 'mobile', 'mobile phone', 'cell phone', 'cellphone'],
      earphones: ['earphones', 'earbuds', 'earbud', 'ear pods', 'earpods', 'headphones', 'headset', 'true wireless', 'tws'],
      headphones: ['headphones', 'headset', 'earphones', 'earbuds', 'ear pods', 'earpods'],
      tv: ['tv', 'tvs', 'television', 'smart tv', 'oled', 'led'],
      camera: ['camera', 'cameras', 'dslr', 'mirrorless', 'photography'],
    };

    const tokensSet = new Set([parentNorm, parentNorm.replace(/ and /g, ' & '), parentNorm.replace(/ & /g, ' and ')]);
    for (const w of words) {
      const syns = wordSynonyms[w];
      if (syns) syns.forEach(s => tokensSet.add(normalize(s)));
    }
    const tokens = Array.from(tokensSet).filter(Boolean);
    if (tokens.length === 0) return cb(null, []);

    const orBlocks = tokens.map(() => `(
      LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(category,'&',' and '),'–',' '),'-',' '),'  ',' '),'  ',' ')) LIKE '%' || ? || '%'
      OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(subcategory,'&',' and '),'–',' '),'-',' '),'  ',' '),'  ',' ')) LIKE '%' || ? || '%'
      OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(tags,'&',' and '),'–',' '),'-',' '),'  ',' '),'  ',' ')) LIKE '%' || ? || '%'
    )`).join(' OR ');

    const sql = `
      SELECT DISTINCT TRIM(subcategory) AS name
      FROM unified_content
      WHERE subcategory IS NOT NULL AND TRIM(subcategory) != ''
        AND LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(category,'&',' and '),'–',' '),'-',' '),'  ',' '),'  ',' ')) IN (?, ?, ?)
    `;
    const params = [
      parentNorm,
      parentNorm.replace(/ and /g, ' & '),
      parentNorm.replace(/ & /g, ' and ')
    ];

    db.all(sql, params, (err, rows) => {
      if (err) return cb(err);
      const results = (rows || [])
        .map(r => r.name)
        .filter(n => !!n)
        .filter(n => normalize(n) !== parentNorm && normalize(n) !== parentNorm.replace(/ and /g, ' & '))
        .map(n => ({ name: n, id: n }));
      cb(null, results);
    });
  };

  lookupParent(parentInput, (err, parentRow) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!parentRow || !parentRow.id) {
      return deriveFromUnifiedContent(parentInput, (err2, derived) => {
        if (err2) {
          console.error('Database error:', err2);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(derived || []);
      });
    }

    const q = `
      SELECT name, name as id
      FROM categories
      WHERE parent_id = ? AND COALESCE(is_active, 1) = 1
      ORDER BY display_order ASC, name ASC
    `;
    db.all(q, [parentRow.id], (err2, rows) => {
      if (err2) {
        console.error('Database error:', err2);
        return res.status(500).json({ error: 'Database error' });
      }
      if (rows && rows.length > 0) {
        return res.json(rows);
      }
      // Fallback to unified_content-derived subcategories
      deriveFromUnifiedContent(parentInput, (err3, derived) => {
        if (err3) {
          console.error('Database error:', err3);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(derived || []);
      });
    });
  });
});