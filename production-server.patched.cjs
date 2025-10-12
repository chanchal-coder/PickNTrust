const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
let BetterSqlite3;
try {
  BetterSqlite3 = require('better-sqlite3');
} catch (e) {
  console.warn('[Server] better-sqlite3 not available, will try sqlite3 fallback');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Static files
// Serve multiple candidate static directories without auto-index; SPA fallback handles index.html
app.use(express.static(path.join(__dirname, 'dist', 'public'), { index: false }));
app.use(express.static(path.join(__dirname, 'client', 'dist'), { index: false }));
app.use(express.static(path.join(__dirname, 'dist'), { index: false }));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.use(express.static(path.join(__dirname, 'server'), { index: false }));

// Load environment variables (if present)
try {
  // Attempt to load .env from current directory to support production deployments
  dotenv.config({ path: path.join(__dirname, '.env') });
} catch (e) {
  // Non-fatal if .env is missing
}

// Resolve database path from environment or fallbacks
function resolveDbPath() {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const url = envUrl.trim();
    // Support file: scheme commonly used for SQLite
    if (url.startsWith('file:')) {
      const p = url.replace(/^file:/, '');
      return path.isAbsolute(p) ? p : path.join(__dirname, p);
    }
    // Absolute path provided directly
    if (path.isAbsolute(url)) {
      return url;
    }
    // Relative path fallback
    return path.join(__dirname, url);
  }

  // No env provided: try known candidate locations
  const candidates = [
    path.join(__dirname, 'database.sqlite'),
    '/var/www/pickntrust/database.sqlite',
    '/home/ec2-user/pickntrust/database.sqlite',
    path.join(process.cwd(), 'database.sqlite'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  // Final fallback
  return path.join(__dirname, 'database.sqlite');
}

// Database (unified_content)
const dbPath = resolveDbPath();
let sqliteDb;
if (BetterSqlite3) {
  try {
    sqliteDb = new BetterSqlite3(dbPath);
    console.log('[Server] Connected to SQLite (better-sqlite3) at', dbPath);
  } catch (e) {
    console.error('[Server] Failed to open SQLite with better-sqlite3:', e);
  }
}
if (!sqliteDb) {
  try {
    const sqlite3 = require('sqlite3').verbose();
    const Database = require('sqlite3').Database;
    // Simple wrapper to provide prepare().all() similar to better-sqlite3
    const connection = new Database(dbPath);
    console.log('[Server] Connected to SQLite (sqlite3) at', dbPath);
    sqliteDb = {
      prepare(sql) {
        return {
          all: (...params) => new Promise((resolve, reject) => {
            connection.all(sql, params, (err, rows) => {
              if (err) return reject(err);
              resolve(rows);
            });
          }),
        };
      },
    };
  } catch (e) {
    console.error('[Server] Failed to open SQLite database with sqlite3:', e);
    process.exit(1);
  }
}

// Helper: normalize product image
function toProxiedImage(url) {
  const u = typeof url === 'string' ? url.trim() : '';
  if (!u) return '/api/placeholder/300/300';
  if (u.startsWith('http://') || u.startsWith('https://')) return u; // keep original for simplicity
  return u; // relative/local
}

// Local placeholder image endpoint
app.get('/api/placeholder/:width/:height', (req, res) => {
  try {
    const width = Math.max(parseInt(req.params.width || '300', 10) || 300, 1);
    const height = Math.max(parseInt(req.params.height || '300', 10) || 300, 1);
    const text = req.query.text || 'No Image';
    const bg = req.query.bg || '#e5e7eb';
    const fg = req.query.fg || '#6b7280';
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  <rect width="100%" height="100%" fill="${bg}"/>\n  <g fill="${fg}" font-family="Arial, Helvetica, sans-serif" font-size="${Math.max(Math.min(Math.floor(width / 10), 24), 12)}" text-anchor="middle">\n    <text x="50%" y="50%" dominant-baseline="middle">${text}</text>\n  </g>\n</svg>`);
  } catch (err) {
    console.error('Error generating placeholder image:', err);
    res.status(500).end();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    res.json({ status: 'ok' });
  } catch (_) {
    res.status(200).json({ status: 'ok' });
  }
});

// Active meta tags (DB first, then static fallbacks)
app.get('/api/meta-tags/active', (req, res) => {
  try {
    let tags = [];
    try {
      const rows = sqliteDb.prepare(`
        SELECT name, content, provider, purpose
        FROM meta_tags
        WHERE is_active = 1
        ORDER BY provider ASC
      `).all();
      tags = rows.map(r => ({
        name: r.name,
        content: r.content,
        provider: r.provider || null,
        purpose: r.purpose || null,
      }));
    } catch (_) {
      // Table might not exist; fall back to JSON files
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      // Try meta.json or meta2.json
      const candidates = ['meta.json', 'meta2.json'];
      for (const file of candidates) {
        try {
          const p = path.join(__dirname, file);
          if (fs.existsSync(p)) {
            const data = JSON.parse(fs.readFileSync(p, 'utf8'));
            const arr = Array.isArray(data?.metaTags) ? data.metaTags : (Array.isArray(data) ? data : []);
            if (arr.length) {
              tags = arr.map(t => ({
                name: t.name || t.property || 'meta',
                content: t.content || t.value || '',
                provider: t.provider || null,
                purpose: t.purpose || null,
              }));
              break;
            }
          }
        } catch (_) {}
      }
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      // Minimal safe defaults to avoid 404s
      tags = [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0d9488' },
      ];
    }

    res.json({ success: true, metaTags: tags });
  } catch (error) {
    console.error('Error fetching active meta tags:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch active meta tags' });
  }
});

// Currency rates endpoint (static defaults; can be wired to provider later)
app.get('/api/currency/rates', (req, res) => {
  try {
    const base = (req.query.base || 'USD').toString().toUpperCase();
    // Simple static defaults that keep UI functional
    const defaults = {
      USD: 1,
      INR: 83.2,
      EUR: 0.93,
      GBP: 0.80,
      JPY: 146.0,
    };
    res.json({ success: true, base, rates: defaults, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch currency rates' });
  }
});

// Blog items for homepage
app.get('/api/blog', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    const query = `
      SELECT * FROM blog_posts
      ORDER BY published_at DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = sqliteDb.prepare(query).all(limit, offset);
    const result = (typeof rows?.then === 'function') ? await rows : rows;

    const items = result.map((row) => {
      let tags = row.tags;
      if (Array.isArray(tags)) {
        // keep as is
      } else if (typeof tags === 'string') {
        try {
          const parsed = JSON.parse(tags);
          tags = Array.isArray(parsed) ? parsed : (tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : []);
        } catch (_) {
          tags = tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : [];
        }
      } else {
        tags = [];
      }
      const out = {
        id: row.id,
        title: row.title || 'Untitled',
        excerpt: row.excerpt || null,
        content: row.content || null,
        category: row.category || 'Blog',
        tags,
        imageUrl: row.image_url || null,
        videoUrl: row.video_url || null,
        readTime: row.read_time || null,
        slug: row.slug || null,
        hasTimer: row.has_timer === 1,
        timerDuration: row.timer_duration || null,
        timerStartTime: row.timer_start_time || null,
        createdAt: row.published_at || row.created_at || null,
      };
      out.imageUrl = toProxiedImage(out.imageUrl);
      return out;
    });

    console.log(`[API] /api/blog -> ${items.length} items`);
    res.json(items);
  } catch (error) {
    console.error('Error in blog endpoint:', error);
    res.json([]);
  }
});

// Video content for homepage (frontend filters showOnHomepage)
app.get('/api/video-content', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    const query = `
      SELECT * FROM video_content
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = sqliteDb.prepare(query).all(limit, offset);
    const result = (typeof rows?.then === 'function') ? await rows : rows;

    const items = result.map((row) => {
      let tags = row.tags;
      if (Array.isArray(tags)) {
        // keep
      } else if (typeof tags === 'string') {
        try {
          const parsed = JSON.parse(tags);
          tags = Array.isArray(parsed) ? parsed : (tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : []);
        } catch (_) {
          tags = tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : [];
        }
      } else {
        tags = [];
      }
      let pages = row.pages;
      if (Array.isArray(pages)) {
        // keep
      } else if (typeof pages === 'string') {
        try {
          const parsed = JSON.parse(pages);
          pages = Array.isArray(parsed) ? parsed : (pages ? pages.split(',').map(s => s.trim()).filter(Boolean) : []);
        } catch (_) {
          pages = pages ? pages.split(',').map(s => s.trim()).filter(Boolean) : [];
        }
      } else {
        pages = [];
      }
      const out = {
        id: row.id,
        title: row.title || 'Untitled',
        description: row.description || null,
        videoUrl: row.video_url || null,
        thumbnailUrl: row.thumbnail_url || null,
        platform: row.platform || null,
        category: row.category || null,
        tags,
        duration: row.duration || null,
        showOnHomepage: row.show_on_homepage === 1,
        pages,
        hasTimer: row.has_timer === 1,
        timerDuration: row.timer_duration || null,
        timerStartTime: row.timer_start_time || null,
        createdAt: row.created_at || null,
      };
      out.thumbnailUrl = toProxiedImage(out.thumbnailUrl);
      return out;
    });

    console.log(`[API] /api/video-content -> ${items.length} items`);
    res.json(items);
  } catch (error) {
    console.error('Error in video-content endpoint:', error);
    res.json([]);
  }
});

// Get products for a specific page using unified_content
// Helper: convert string/JSON to array
function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

// Widgets: page + position
app.get('/api/widgets/:page/:position', (req, res) => {
  try {
    const { page, position } = req.params;
    let positions = [position];
    if (position === 'header') positions = ['header', 'header-top', 'header-bottom'];
    if (position === 'footer') positions = ['footer', 'footer-top', 'footer-bottom'];
    const placeholders = positions.map(() => '?').join(',');
    const rows = sqliteDb.prepare(`
      SELECT * FROM widgets
      WHERE target_page = ?
        AND position IN (${placeholders})
        AND is_active = 1
        AND LOWER(name) NOT LIKE '%test%'
        AND (description IS NULL OR LOWER(description) NOT LIKE '%test%')
      ORDER BY display_order
    `).all(page, ...positions);
    const items = rows.map((w) => ({
      ...w,
      max_width: w.max_width || null,
      custom_css: w.custom_css || null,
      external_link: w.external_link || null,
    }));
    console.log(`[API] /api/widgets/${page}/${position} -> ${items.length} items`);
    res.json(items);
  } catch (error) {
    console.error('Error fetching widgets by position:', error);
    res.json([]);
  }
});

// Widgets: all active for a page
app.get('/api/widgets/:page', (req, res) => {
  try {
    const { page } = req.params;
    const rows = sqliteDb.prepare(`
      SELECT * FROM widgets
      WHERE target_page = ?
        AND is_active = 1
        AND LOWER(name) NOT LIKE '%test%'
        AND (description IS NULL OR LOWER(description) NOT LIKE '%test%')
      ORDER BY position, display_order
    `).all(page);
    const items = rows.map((w) => ({
      ...w,
      max_width: w.max_width || null,
      custom_css: w.custom_css || null,
      external_link: w.external_link || null,
    }));
    console.log(`[API] /api/widgets/${page} -> ${items.length} items`);
    res.json(items);
  } catch (error) {
    console.error('Error fetching widgets for page:', error);
    res.json([]);
  }
});

// Widgets click tracking (best-effort)
app.post('/api/widgets/track-click', express.json({ limit: '128kb' }), (req, res) => {
  try {
    const { widgetId, widgetName, page, position, href } = req.body || {};
    try {
      sqliteDb.prepare(`
        INSERT INTO widget_clicks(widget_id, widget_name, page, position, href, created_at)
        VALUES(?, ?, ?, ?, ?, strftime('%s','now'))
      `).run(widgetId || null, widgetName || null, page || null, position || null, href || null);
    } catch (_) {}
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking widget click:', error);
    res.json({ success: true });
  }
});

// Navigation tabs (static fallback)
app.get('/api/nav-tabs', (_req, res) => {
  const tabs = [
    { id: 1, name: 'Prime Picks', slug: 'prime-picks', icon: 'fas fa-crown', color_from: '#8B5CF6', color_to: '#7C3AED', display_order: 1, is_active: 1, is_system: 1 },
    { id: 2, name: 'Cue Picks', slug: 'cue-picks', icon: 'fas fa-bullseye', color_from: '#06B6D4', color_to: '#0891B2', display_order: 2, is_active: 1, is_system: 1 },
    { id: 3, name: 'Value Picks', slug: 'value-picks', icon: 'fas fa-gem', color_from: '#10B981', color_to: '#059669', display_order: 3, is_active: 1, is_system: 1 },
    { id: 4, name: 'Top Picks', slug: 'top-picks', icon: 'fas fa-star', color_from: '#F59E0B', color_to: '#D97706', display_order: 4, is_active: 1, is_system: 1 },
    { id: 5, name: 'Apps & AI Apps', slug: 'apps-ai-apps', icon: 'fas fa-robot', color_from: '#3B82F6', color_to: '#2563EB', display_order: 5, is_active: 1, is_system: 1 },
    { id: 6, name: 'Services', slug: 'services', icon: 'fas fa-tools', color_from: '#EF4444', color_to: '#DC2626', display_order: 6, is_active: 1, is_system: 1 },
    { id: 7, name: 'Blog', slug: 'blog', icon: 'fas fa-blog', color_from: '#6B7280', color_to: '#374151', display_order: 7, is_active: 1, is_system: 1 },
    { id: 8, name: 'Videos', slug: 'videos', icon: 'fas fa-video', color_from: '#14B8A6', color_to: '#0D9488', display_order: 8, is_active: 1, is_system: 1 },
  ];
  res.json(tabs);
});

// Banners for a page (DB first, then static fallback)
app.get('/api/banners/:page', (req, res) => {
  try {
    const { page } = req.params;
    const rows = sqliteDb.prepare(`
      SELECT id, title, subtitle, imageUrl, linkUrl, buttonText, page, display_order, isActive,
             icon, iconType, iconPosition, useGradient, backgroundGradient, backgroundOpacity,
             imageDisplayType, unsplashQuery, showHomeLink, homeLinkText
      FROM banners WHERE page = ? AND isActive = 1 ORDER BY display_order ASC
    `).all(page);
    if (Array.isArray(rows) && rows.length) {
      const banners = rows.map(b => ({ ...b, imageUrl: toProxiedImage(b.imageUrl || b.image_url || null) }));
      return res.json({ success: true, banners });
    }
    try {
      const staticPath = path.join(__dirname, 'backend-assets', 'banners.json');
      if (fs.existsSync(staticPath)) {
        const config = JSON.parse(fs.readFileSync(staticPath, 'utf8'));
        const staticBanners = Array.isArray(config[page]) ? config[page] : [];
        const active = staticBanners.filter(x => x.isActive);
        return res.json({ success: true, banners: active });
      }
    } catch (_) {}
    res.json({ success: true, banners: [] });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.json({ success: true, banners: [] });
  }
});

// Announcement: latest active, optional page filter (returns client-compatible shape)
app.get('/api/announcement/active', async (req, res) => {
  try {
    const page = String(req.query.page || '').trim();

    // Detect available columns to support both camelCase and snake_case backups
    let columns = [];
    try {
      columns = sqliteDb.prepare("PRAGMA table_info(announcements)").all();
    } catch (_) {}
    const hasCamelIsActive = columns.some(c => c.name === 'isActive');
    const hasSnakeIsActive = columns.some(c => c.name === 'is_active');
    const hasCamelTargetPage = columns.some(c => c.name === 'targetPage');
    const hasSnakePage = columns.some(c => c.name === 'page');
    const hasUpdatedAtSnake = columns.some(c => c.name === 'updated_at');
    const hasUpdatedAtCamel = columns.some(c => c.name === 'updatedAt');
    const hasCreatedAtSnake = columns.some(c => c.name === 'created_at');
    const hasCreatedAtCamel = columns.some(c => c.name === 'createdAt');

    // Build query dynamically based on detected schema
    let whereActive = '1 = 1';
    if (hasCamelIsActive) whereActive = 'isActive = 1';
    else if (hasSnakeIsActive) whereActive = 'is_active = 1';

    let pageFilter = '';
    const params = [];
    if (page) {
      if (hasCamelTargetPage) {
        pageFilter = ` AND (targetPage IS NULL OR targetPage = '' OR targetPage = ?)`;
        params.push(page);
      } else if (hasSnakePage) {
        pageFilter = ` AND (page IS NULL OR page = '' OR page = ?)`;
        params.push(page);
      }
    }

    let orderBy = '';
    if (hasUpdatedAtSnake) orderBy = ' ORDER BY updated_at DESC';
    else if (hasUpdatedAtCamel) orderBy = ' ORDER BY updatedAt DESC';
    if (orderBy) {
      if (hasCreatedAtSnake) orderBy += ', created_at DESC';
      else if (hasCreatedAtCamel) orderBy += ', createdAt DESC';
    }

    const query = `SELECT * FROM announcements WHERE ${whereActive}${pageFilter}${orderBy} LIMIT 1`;
    let rows;
    try {
      const result = sqliteDb.prepare(query).all(...params);
      rows = (typeof result?.then === 'function') ? await result : result;
    } catch (err) {
      console.error('Announcement query failed, falling back:', err);
      rows = [];
    }

    const ann = Array.isArray(rows) && rows.length ? rows[0] : null;

    if (!ann) {
      return res.status(404).json({ message: 'No active announcement found' });
    }

    // Map DB row to client-expected fields with safe defaults
    const announcement = {
      id: ann.id,
      message: ann.message || ann.title || ann.content || '',
      isActive: ann.isActive === 1 || ann.is_active === 1 || !!ann.isActive,
      isGlobal: (ann.is_global === 1) || (ann.isGlobal === 1) || (ann.targetPage == null || ann.targetPage === '') || (ann.page == null || ann.page === ''),
      textColor: ann.textColor || ann.text_color || '#ffffff',
      backgroundColor: ann.backgroundColor || ann.background_color || '#2563eb',
      fontSize: ann.fontSize || ann.font_size || 'Medium (16px)',
      fontWeight: ann.fontWeight || ann.font_weight || 'Bold',
      textDecoration: ann.textDecoration || ann.text_decoration || 'none',
      fontStyle: ann.fontStyle || ann.font_style || 'normal',
      animationSpeed: ann.animationSpeed || ann.animation_speed || 'Medium (30s)',
      textBorderWidth: ann.textBorderWidth || ann.text_border_width || '0px',
      textBorderStyle: ann.textBorderStyle || ann.text_border_style || 'solid',
      textBorderColor: ann.textBorderColor || ann.text_border_color || '#000000',
      bannerBorderWidth: ann.bannerBorderWidth || ann.banner_border_width || '0px',
      bannerBorderStyle: ann.bannerBorderStyle || ann.banner_border_style || 'solid',
      bannerBorderColor: ann.bannerBorderColor || ann.banner_border_color || '#000000',
      createdAt: ann.updated_at || ann.updatedAt || ann.created_at || ann.createdAt || null,
    };
    return res.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return res.status(404).json({ message: 'No active announcement found' });
  }
});

// Browse categories
app.get('/api/categories/browse', async (req, res) => {
  try {
    // Fetch active parent categories with expected fields
    const catsResult = sqliteDb.prepare(`
      SELECT 
        id,
        name,
        icon,
        color,
        description,
        parent_id AS parentId,
        COALESCE(is_for_products, 1) AS isForProducts,
        COALESCE(is_for_services, 0) AS isForServices,
        COALESCE(is_for_ai_apps, 0) AS isForAIApps,
        display_order AS displayOrder
      FROM categories 
      WHERE (parent_id IS NULL OR parent_id = '')
      ORDER BY display_order ASC, name ASC
    `).all();
    const categories = (typeof catsResult?.then === 'function') ? await catsResult : catsResult;

    // Filter by active flag only if present in row
    const filteredCategories = (Array.isArray(categories) ? categories : []).filter((c) => {
      // Some schemas use is_active instead of isActive; rows may contain either
      const isActive = (typeof c.isActive !== 'undefined' ? c.isActive : (typeof c.is_active !== 'undefined' ? c.is_active : 1));
      return Number(isActive) === 1 || isActive === true;
    });

    // Compute product counts by category from unified_content
    const countsResult = sqliteDb.prepare(`
      SELECT 
        TRIM(COALESCE(category, '')) AS category,
        COUNT(id) AS total
      FROM unified_content
      WHERE TRIM(COALESCE(category, '')) != ''
        AND (
          status IN ('active','published','ready','processed','completed') OR status IS NULL
        )
        AND (
          visibility IN ('public','visible') OR visibility IS NULL
        )
        AND (
          processing_status != 'archived' OR processing_status IS NULL
        )
      GROUP BY TRIM(COALESCE(category, ''))
    `).all();
    const countRows = (typeof countsResult?.then === 'function') ? await countsResult : countsResult;

    const countMap = new Map();
    for (const r of (Array.isArray(countRows) ? countRows : [])) {
      const key = String(r.category || '').toLowerCase();
      countMap.set(key, Number(r.total) || 0);
    }

    const sourceCats = (Array.isArray(filteredCategories) && filteredCategories.length > 0) ? filteredCategories : (Array.isArray(categories) ? categories : []);
    const enriched = sourceCats.map((c) => {
      const key = String(c.name || '').toLowerCase();
      const total = countMap.get(key) || 0;
      return {
        id: c.id,
        name: c.name,
        icon: c.icon || 'fas fa-tags',
        color: c.color || '#3B82F6',
        description: c.description || '',
        parentId: c.parentId || null,
        isForProducts: !!c.isForProducts,
        isForServices: !!c.isForServices,
        isForAIApps: !!c.isForAIApps,
        displayOrder: c.displayOrder || 0,
        total_products_count: total,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Static fallback to avoid empty UI when DB schema is missing
    try {
      const p = path.join(__dirname, 'cats.json');
      if (fs.existsSync(p)) {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        const list = Array.isArray(data) ? data : [];
        return res.json(list.map(c => ({
          id: c.id || 0,
          name: c.name || 'Category',
          icon: c.icon || 'fas fa-tags',
          color: c.color || '#3B82F6',
          description: c.description || '',
          parentId: c.parentId || null,
          isForProducts: Boolean(c.isForProducts ?? 1),
          isForServices: Boolean(c.isForServices ?? 0),
          isForAIApps: Boolean(c.isForAIApps ?? 0),
          displayOrder: c.displayOrder || 0,
          total_products_count: Number(c.total_products_count ?? 0),
        })));
      }
    } catch (_) {}
    res.json([]);
  }
});

// Testimonials
app.get('/api/testimonials', (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 100);
    const rows = sqliteDb.prepare(`
      SELECT id, author, role, content, avatarUrl, rating, isActive, created_at
      FROM testimonials WHERE isActive = 1
      ORDER BY created_at DESC LIMIT ?
    `).all(limit);
    const items = rows.map(r => ({ ...r, avatarUrl: toProxiedImage(r.avatarUrl || r.avatar_url || null) }));
    res.json(items);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.json([]);
  }
});

// Featured products
app.get('/api/products/featured', (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const rows = sqliteDb.prepare(`
      SELECT * FROM unified_content
      WHERE (is_featured = 1 OR display_pages LIKE '%top-picks%' OR page_type = 'top-picks')
        AND (visibility IN ('public','visible') OR visibility IS NULL)
        AND (status IN ('active','published','ready','processed','completed') OR status IS NULL)
        AND (processing_status != 'archived' OR processing_status IS NULL)
      ORDER BY created_at DESC LIMIT ?
    `).all(limit);
    const items = rows.map(row => ({
      id: row.id,
      title: row.title,
      imageUrl: toProxiedImage(row.imageUrl || row.image_url || null),
      price: row.price || null,
      affiliateUrl: row.affiliateUrl || row.affiliate_url || null,
      category: row.category || null,
      isFeatured: Boolean(row.is_featured === 1),
      is_featured: Boolean(row.is_featured === 1)
    }));
    res.json(items);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.json([]);
  }
});

app.get('/api/products/page/:page', async (req, res) => {
  try {
    const page = (req.params.page || '').trim();
    const category = (req.query.category || '').trim();
    const parsedLimit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const parsedOffset = Math.max(parseInt(req.query.offset) || 0, 0);

    if (!page) {
      return res.status(400).json({ message: 'Page parameter is required', error: 'INVALID_PARAMETERS' });
    }

    let query = `
      SELECT * FROM unified_content
      WHERE (
        status IN ('active','published','ready','processed','completed') OR status IS NULL
      )
      AND (
        visibility IN ('public','visible') OR visibility IS NULL
      )
      AND (
        processing_status != 'archived' OR processing_status IS NULL
      )
    `;
    const params = [];

    if (page === 'top-picks') {
      // Strict Top Picks: prioritize explicitly featured items
      query += ` AND (
        is_featured = 1
      )`;
    } else if (page === 'services') {
      query += ` AND (
        is_service = 1 OR
        display_pages LIKE '%services%' OR
        page_type = 'services'
      )`;
    } else if (page === 'apps-ai-apps' || page === 'apps') {
      query += ` AND (
        is_ai_app = 1 OR
        display_pages LIKE '%apps%' OR
        display_pages LIKE '%apps-ai-apps%' OR
        page_type IN ('apps','apps-ai-apps')
      )`;
    } else if (page === 'click-picks') {
      query += ` AND (
        display_pages LIKE '%click-picks%' OR
        display_pages = 'click-picks' OR
        page_type = 'click-picks'
      )`;
    } else if (page === 'prime-picks') {
      query += ` AND (
        display_pages LIKE '%' || ? || '%' OR
        display_pages = ? OR
        display_pages IS NULL OR
        display_pages = ''
      )`;
      params.push(page, page);
    } else {
      query += ` AND (
        display_pages LIKE '%' || ? || '%' OR
        display_pages = ?
      )`;
      params.push(page, page);
    }

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parsedLimit, parsedOffset);

    console.log('[API] SQL:', query.replace(/\s+/g, ' ').trim());
    console.log('[API] Params:', params);
    const result = sqliteDb.prepare(query).all(...params);
    let rawProducts = typeof result?.then === 'function' ? await result : result;

    // Fallback for Top Picks: if no rows, include display_pages and truthy forms
    if (page === 'top-picks' && (!rawProducts || rawProducts.length === 0)) {
      const fallbackQuery = `
        SELECT * FROM unified_content
        WHERE (
          is_featured = 1 OR 
          CAST(is_featured AS TEXT) IN ('1','true','TRUE','yes','YES','y','Y') OR
          COALESCE(is_featured, 0) = 1 OR
          display_pages LIKE '%top-picks%' OR
          page_type = 'top-picks'
        )
        AND (
          processing_status != 'archived' OR processing_status IS NULL
        )
        ORDER BY created_at DESC, id DESC
        LIMIT ? OFFSET ?
      `;
      try {
        console.warn('[API] Top Picks strict query empty. Using fallback criteria.');
        rawProducts = sqliteDb.prepare(fallbackQuery).all(parsedLimit, parsedOffset);
      } catch (fallbackErr) {
        console.warn('[API] Top Picks fallback query failed:', fallbackErr);
      }
    }

    const products = rawProducts.map((product) => {
      try {
        // Normalize featured flag robustly (supports number/string truthy forms)
        const featured = (() => {
          const v = product.is_featured;
          if (typeof v === 'number') return v === 1;
          if (typeof v === 'string') {
            const s = v.trim().toLowerCase();
            return s === '1' || s === 'true' || s === 'yes' || s === 'y' || s === 'on';
          }
          return Boolean(v);
        })();

        const out = {
          id: product.id,
          name: product.title || 'Untitled Product',
          description: product.description || 'No description available',
          price: product.price,
          originalPrice: product.originalPrice,
          currency: product.currency || 'INR',
          imageUrl: toProxiedImage(product.imageUrl || product.image_url || null),
          affiliateUrl: product.affiliateUrl,
          category: product.category,
          rating: product.rating || 0,
          reviewCount: product.reviewCount || 0,
          discount: product.discount,
          isNew: product.isNew === 1,
          isFeatured: featured,
          is_featured: featured,
          createdAt: product.createdAt,
        };

        // Parse content JSON for price fields if missing
        if (product.content && (!out.price || !out.originalPrice)) {
          try {
            const c = JSON.parse(product.content);
            out.price = out.price || c.price;
            out.originalPrice = out.originalPrice || c.originalPrice;
            out.currency = out.currency || c.currency || 'INR';
            out.rating = out.rating || c.rating || 0;
            out.reviewCount = out.reviewCount || c.reviewCount || 0;
            out.discount = out.discount || c.discount;
          } catch (e) {
            // ignore parse error
          }
        }

        // Image from media_urls JSON
        if (product.media_urls && !out.imageUrl) {
          try {
            const medias = JSON.parse(product.media_urls);
            if (Array.isArray(medias) && medias.length > 0) {
              out.imageUrl = medias[0];
            }
          } catch (e) {}
        }
        if (!out.imageUrl && product.image_url) out.imageUrl = product.image_url;
        out.imageUrl = toProxiedImage(out.imageUrl);

        // Affiliate from affiliate_urls JSON
        if (product.affiliate_urls && !out.affiliateUrl) {
          try {
            const affs = JSON.parse(product.affiliate_urls);
            if (Array.isArray(affs) && affs.length > 0) {
              out.affiliateUrl = affs[0];
            }
          } catch (e) {}
        }
        if (!out.affiliateUrl && product.affiliateUrl) out.affiliateUrl = product.affiliateUrl;

        return out;
      } catch (e) {
        return {
          id: product.id || 0,
          name: product.title || 'Product Error',
          description: 'Error loading product details',
          price: 0,
          originalPrice: 0,
          currency: 'INR',
          imageUrl: null,
          affiliateUrl: null,
          category: 'Error',
          rating: 0,
          reviewCount: 0,
          discount: null,
          isNew: false,
          isFeatured: false,
          is_featured: false,
          createdAt: product.createdAt || new Date().toISOString(),
        };
      }
    });

    console.log(`[API] /api/products/page/${page} -> ${products.length} items`);
    res.json(products);
  } catch (error) {
    console.error('Error in products page endpoint:', error);
    // Return an empty list on error to keep the UI functional
    res.json([]);
  }
});

// Get categories for a specific page
app.get('/api/categories/page/:page', async (req, res) => {
  try {
    const page = (req.params.page || '').trim();
    if (!page) return res.status(400).json({ message: 'Page parameter is required', error: 'INVALID_PARAMETERS' });

    const rowsResult = sqliteDb.prepare(`
      SELECT DISTINCT category FROM unified_content
      WHERE (
        display_pages LIKE '%' || ? || '%' OR
        display_pages = ? OR
        ( ? = 'prime-picks' AND (display_pages IS NULL OR display_pages = '') )
      )
      AND category IS NOT NULL AND category != ''
      AND (status IN ('completed','active','processed') OR status IS NULL)
    `).all(page, page, page);
    const rows = typeof rowsResult?.then === 'function' ? await rowsResult : rowsResult;

    const categories = rows.map(r => r.category).filter(Boolean).sort();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return empty array on error for resiliency
    res.json([]);
  }
});

// Fallback: React index.html for non-API routes using middleware (no path matching)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const candidates = [
    path.join(__dirname, 'client', 'dist', 'index.html'),
    path.join(__dirname, 'dist', 'public', 'index.html'),
    path.join(__dirname, 'public', 'index.html'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return res.sendFile(p);
    } catch {}
  }
  res.status(404).send('index.html not found in expected locations');
});

app.listen(PORT, () => {
  console.log(`[Server] PickNTrust production server running on port ${PORT}`);
});