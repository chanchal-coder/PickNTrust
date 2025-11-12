// Import statements
// @ts-nocheck
import { Request, Response, Express } from "express";
import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// Use global fetch (Node >=18) for URL extraction
// No import required; kept comment for clarity
import { dirname } from 'path';

// Import from shared schema
import { 
  insertProductSchema, 
  insertNewsletterSubscriberSchema,
  type Product,
  type NewsletterSubscriber,
  announcements
} from "../shared/sqlite-schema.js";

// Import storage interface and db instance
import type { IStorage } from "./storage";
import { dbInstance as db, sqliteDb } from "./db.js";
import { TelegramBotManager, sendTelegramNotification } from "./telegram-bot.js";
import { urlProcessingService } from "./url-processing-service.js";

// Helper function to verify admin password
async function verifyAdminPassword(password: string): Promise<boolean> {
  // Secure authentication with direct comparison
  return password === 'pickntrust2025';
}

// Multer config is initialized inside setupRoutes where __dirname is defined

export function setupRoutes(app: Express, storage: IStorage) {
  // ESM dirname setup
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Default pages where new videos should appear when pages are not provided
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

  // Configure multer for file uploads
  // Prefer writing under built static directory so Nginx can serve `/uploads`
  const uploadDirCandidates: string[] = [];
  if (process.env.UPLOAD_DIR) {
    try { uploadDirCandidates.push(path.resolve(process.env.UPLOAD_DIR)); } catch {}
  }
  // Common production locations where dist/public is deployed
  try { uploadDirCandidates.push(path.resolve(process.cwd(), 'dist', 'public', 'uploads')); } catch {}
  try { uploadDirCandidates.push(path.resolve(__dirname, '..', 'public', 'uploads')); } catch {}
  // Fallback to local uploads near server if public is unavailable
  try { uploadDirCandidates.push(path.resolve(__dirname, '..', 'uploads')); } catch {}

  let uploadDir = uploadDirCandidates.find(p => {
    try { return fs.existsSync(path.dirname(p)); } catch { return false; }
  }) || uploadDirCandidates[0];

  try { if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true }); } catch {}

  const storage_config = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  // Configure maximum upload size via environment; default to 100MB for videos
  const FILE_UPLOAD_MAX_MB = Number(process.env.FILE_UPLOAD_MAX_MB || '100');
  const upload = multer({ 
    storage: storage_config,
    limits: FILE_UPLOAD_MAX_MB > 0 ? {
      fileSize: FILE_UPLOAD_MAX_MB * 1024 * 1024
    } : undefined,
    fileFilter: (_req, file, cb) => {
      // Accept images, videos, PDFs, and common document formats
      const type = file.mimetype;
      const isImage = type.startsWith('image/');
      const isVideo = type.startsWith('video/');
      const allowedDocs = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/rtf',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.oasis.opendocument.presentation'
      ];
      if (isImage || isVideo || allowedDocs.includes(type)) {
        cb(null, true);
      } else {
        cb(new Error('Unsupported file type'));
      }
    }
  });
  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Ensure Explore appears in nav management (seed if missing)
  try {
    // Create nav_tabs table if missing (matches usage across routes)
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS nav_tabs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        icon TEXT,
        color_from TEXT,
        color_to TEXT,
        color_style TEXT DEFAULT 'gradient',
        display_order INTEGER DEFAULT 999,
        is_active INTEGER DEFAULT 1,
        is_system INTEGER DEFAULT 0,
        description TEXT,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER
      );
    `);

    const existingExplore = sqliteDb.prepare(`SELECT id FROM nav_tabs WHERE slug = ?`).get('explore') as any;
    if (!existingExplore) {
      const payload = {
        name: 'Explore',
        slug: 'explore',
        icon: 'fas fa-compass',
        color_from: '#10B981',
        color_to: '#06B6D4',
        color_style: 'gradient',
        display_order: 9,
        is_active: 1,
        is_system: 1,
        description: 'Explore advertisements'
      } as any;
      try {
        sqliteDb.prepare(`
          INSERT INTO nav_tabs (name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description)
          VALUES (@name, @slug, @icon, @color_from, @color_to, @color_style, @display_order, @is_active, @is_system, @description)
        `).run(payload);
      } catch (seedErr) {
        // Unique constraint or other benign errors can be ignored here
      }
    }
  } catch (ensureErr) {
    console.warn('Failed to ensure Explore nav tab:', (ensureErr as any)?.message || ensureErr);
  }

  // Lightweight PDF proxy to fix CORS/content-type issues for external PDFs
  // Usage: /pdf-proxy?url=<absolute_or_relative_url>
  app.get('/pdf-proxy', async (req, res) => {
    try {
      const raw = String((req.query?.url || req.query?.file || '') as string).trim();
      if (!raw) {
        return res.status(400).send('Missing url parameter');
      }

      // Normalize to absolute URL; allow relative paths (e.g., /uploads/..)
      let target = raw;
      if (!/^https?:\/\//i.test(target)) {
        const base = `${req.protocol}://${req.get('host') || 'localhost'}`;
        if (target.startsWith('/')) target = base + target;
        else target = base + '/' + target;
      }

      const upstream = await fetch(target);
      if (!upstream || !upstream.ok) {
        const status = upstream?.status || 502;
        return res.status(status).send('Upstream PDF fetch failed');
      }

      const buf = Buffer.from(await upstream.arrayBuffer());
      if (!buf || buf.length === 0) {
        return res.status(422).send('Empty PDF response');
      }

      // Force PDF content-type for consistent rendering in the viewer
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(buf);
    } catch (err) {
      console.error('pdf-proxy error:', err);
      res.status(500).send('PDF proxy error');
    }
  });

  // API-scoped PDF proxy to work behind Nginx (which proxies /api)
  // Usage: /api/pdf-proxy?url=<absolute_or_relative_url>
  app.get('/api/pdf-proxy', async (req, res) => {
    try {
      const raw = String((req.query?.url || req.query?.file || '') as string).trim();
      if (!raw) {
        return res.status(400).send('Missing url parameter');
      }

      let target = raw;
      // If the request is for server-served uploads, bypass Nginx and hit Express directly
      if (/^\/?uploads\//i.test(target)) {
        target = `http://127.0.0.1:${process.env.PORT || 5000}/${target.replace(/^\//, '')}`;
      } else if (!/^https?:\/\//i.test(target)) {
        // Normalize to absolute URL for other relative paths
        const base = `${req.protocol}://${req.get('host') || 'localhost'}`;
        if (target.startsWith('/')) target = base + target;
        else target = base + '/' + target;
      }

      const upstream = await fetch(target);
      if (!upstream || !upstream.ok) {
        const status = upstream?.status || 502;
        return res.status(status).send('Upstream PDF fetch failed');
      }

      // Validate upstream content type
      const upstreamCT = (upstream.headers.get('content-type') || '').toLowerCase();
      const isPdf = upstreamCT.includes('application/pdf') || upstreamCT.includes('application/octet-stream');
      if (!isPdf) {
        // Return a clear error instead of forwarding HTML (prevents InvalidPDFException)
        res.setHeader('Content-Type', 'text/plain');
        return res.status(415).send(`Unsupported content-type: ${upstreamCT || 'unknown'}`);
      }

      // Set PDF headers early so HEAD requests see the correct type
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cache-Control', 'public, max-age=300');

      const buf = Buffer.from(await upstream.arrayBuffer());
      if (!buf || buf.length === 0) {
        return res.status(422).send('Empty PDF response');
      }
      res.send(buf);
    } catch (err) {
      console.error('api/pdf-proxy error:', err);
      res.status(500).send('PDF proxy error');
    }
  });

  // Separate lightweight CSV upload handler (memory storage, CSV-only)
  const CSV_MAX_MB = Number(process.env.CSV_UPLOAD_MAX_MB || '50');
  const csvUpload = multer({
    storage: multer.memoryStorage(),
    // Allow configuring max size via env; set to 0 or negative to remove cap
    // @ts-ignore
    limits: CSV_MAX_MB > 0 ? { fileSize: CSV_MAX_MB * 1024 * 1024, files: 1 } : undefined,
    fileFilter: (_req, file, cb) => {
      const type = file.mimetype;
      const name = file.originalname || '';
      const isCsvExt = name.toLowerCase().endsWith('.csv');
      const allowed = type === 'text/csv' || type === 'application/vnd.ms-excel' || type === 'text/plain' || (type === 'application/octet-stream' && isCsvExt);
      if (allowed) cb(null, true);
      else cb(new Error('Only CSV files are allowed'));
    }
  });

  // Secure admin authentication endpoint
  app.post('/api/admin/auth', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }

      // Verify admin password using secure function
      const isValid = await verifyAdminPassword(password);
      
      if (isValid) {
        res.json({ success: true, message: 'Authentication successful' });
      } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
      }
    } catch (error) {
      console.error('Admin authentication error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  // -----------------------------
  // CSV Parsing Utility
  // -----------------------------
  function parseCSV(content: string): Array<Record<string, string>> {
    const rows: Array<Record<string, string>> = [];
    if (!content) return rows;
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return rows;
    // Extract headers (handle quoted headers)
    const headers = [] as string[];
    {
      const hLine = lines[0];
      let i = 0; let field = ''; let inQuotes = false;
      while (i < hLine.length) {
        const ch = hLine[i];
        if (ch === '"') {
          if (inQuotes && hLine[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
          headers.push(field.trim()); field = '';
        } else { field += ch; }
        i++;
      }
      headers.push(field.trim());
    }
    // Parse data lines
    for (let li = 1; li < lines.length; li++) {
      const line = lines[li];
      let i = 0; let field = ''; let inQuotes = false; const values: string[] = [];
      while (i < line.length) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
          else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
          values.push(field); field = '';
        } else { field += ch; }
        i++;
      }
      values.push(field);
      const row: Record<string, string> = {};
      for (let hi = 0; hi < headers.length; hi++) {
        const key = (headers[hi] || '').trim();
        const val = (values[hi] || '').trim();
        if (key) row[key] = val;
      }
      // Skip completely empty rows
      const nonEmpty = Object.values(row).some(v => v && v.length > 0);
      if (nonEmpty) rows.push(row);
    }
    return rows;
  }

  // -----------------------------
  // Admin: Products Bulk Upload via CSV
  // -----------------------------
  app.post('/api/admin/products/bulk-upload', csvUpload.single('file'), async (req, res) => {
    try {
      const password = (req.body?.password || req.query?.password || '').toString();
      const isAuthorized = await verifyAdminPassword(password);
      if (!isAuthorized) {
        return res.status(401).send('Unauthorized: Invalid admin password');
      }

      if (!req.file || !req.file.buffer) {
        return res.status(400).send('No CSV file uploaded');
      }

      const csvText = req.file.buffer.toString('utf8');
      const rows = parseCSV(csvText);
      if (!rows || rows.length === 0) {
        return res.status(400).send('CSV appears empty or could not be parsed');
      }

      const truthy = (v: any) => {
        if (v === undefined || v === null) return false;
        const s = String(v).trim().toLowerCase();
        return ['1','true','yes','y','on'].includes(s);
      };
      const num = (v: any) => {
        if (v === undefined || v === null || v === '') return undefined as any;
        const s = String(v).replace(/[^\d.-]/g, '');
        const n = parseFloat(s);
        return isNaN(n) ? undefined : n;
      };
      const intNum = (v: any) => {
        if (v === undefined || v === null || v === '') return undefined as any;
        const s = String(v).replace(/[^\d-]/g, '');
        const n = parseInt(s);
        return isNaN(n) ? undefined : n;
      };
      const normalizePages = (v: any): string[] | undefined => {
        if (!v) return undefined;
        try {
          if (typeof v === 'string' && v.trim().startsWith('[')) {
            const arr = JSON.parse(v);
            return Array.isArray(arr) ? arr.map(x => String(x)) : undefined;
          }
        } catch {}
        const parts = String(v).split(/[|,]/).map(s => s.trim()).filter(Boolean);
        return parts.length ? parts : undefined;
      };

      const results = { processed: 0, inserted: 0, failed: 0, errors: [] as Array<{index:number; error:string; row?:any}> };

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        results.processed++;
        try {
          const name = r.name || r.title || '';
          const imageUrl = r.image_url || r.imageUrl || r.image || '';
          const affiliateUrl = r.affiliate_url || r.affiliateUrl || r.link || '';
          const category = r.category || '';
          if (!name || !imageUrl || !affiliateUrl || !category) {
            throw new Error('Missing required fields: name/title, image_url, affiliate_url, category');
          }

          const payload: any = {
            name,
            description: r.description || '',
            price: num(r.price),
            originalPrice: num(r.original_price || r.originalPrice),
            currency: (r.currency || 'INR').toString(),
            imageUrl,
            affiliateUrl,
            category,
            rating: num(r.rating) ?? 5,
            reviewCount: intNum(r.review_count || r.reviews || r.reviewCount) ?? 0,
            isFeatured: truthy(r.is_featured),
            isService: truthy(r.is_service),
            isAIApp: truthy(r.is_ai_app),
            displayPages: normalizePages(r.display_pages || r.page || r.pages),
            contentType: truthy(r.is_service) ? 'service' : truthy(r.is_ai_app) ? 'app' : 'product'
          };

          // Insert using storage adapter to keep behavior consistent across the site
          await (storage as any).addProduct(payload);
          results.inserted++;
        } catch (err: any) {
          results.failed++;
          results.errors.push({ index: i, error: err?.message || 'Unknown error', row: r });
        }
      }

      return res.json(results);
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      return res.status(500).send(error?.message || 'Failed to process CSV');
    }
  });

  // -----------------------------
  // Travel API Endpoints
  // -----------------------------
  // Helper: map DB row to frontend travel deal shape
  function mapTravelDeal(row: any) {
    try {
      return {
        id: row.id,
        name: row.title || row.name || 'Untitled Deal',
        description: row.description || '',
        price: row.price || '0',
        originalPrice: row.original_price ?? row.originalPrice ?? null,
        currency: row.currency || 'INR',
        imageUrl: row.image_url || row.imageUrl || '/api/placeholder/300/300',
        affiliateUrl: row.affiliate_url || row.affiliateUrl || '',
        category: row.category || 'Travel',
        subcategory: row.subcategory || '',
        rating: Number(row.rating ?? 0),
        reviewCount: Number(row.reviewCount ?? 0),
        discount: row.discount ?? null,
        isFeatured: Boolean(row.is_featured ?? row.isFeatured),
        is_featured: row.is_featured ?? row.isFeatured,
        createdAt: row.created_at ?? row.createdAt,
        // Pass-through extras if present
        content_type: row.content_type,
        tags: row.tags,
      };
    } catch (e) {
      return {
        id: row?.id ?? 0,
        name: 'Travel Deal',
        description: 'Error mapping travel deal',
        price: '0',
        originalPrice: null,
        currency: 'INR',
        imageUrl: '/api/placeholder/300/300',
        affiliateUrl: '',
        category: 'Travel',
        rating: 0,
        reviewCount: 0,
        discount: null,
        isFeatured: false,
        is_featured: false,
        createdAt: null,
      };
    }
  }

  // Helper: ensure travel_categories table exists (created by bot usually)
  function ensureTravelCategoriesTable() {
      try {
        sqliteDb.exec(`
          CREATE TABLE IF NOT EXISTS travel_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            icon TEXT,
            description TEXT,
            is_active BOOLEAN DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          )
        `);
      } catch {}
  }

  // GET /api/travel-categories
  app.get('/api/travel-categories', async (_req, res) => {
    try {
      ensureTravelCategoriesTable();
      const rows = sqliteDb.prepare(`
        SELECT id, slug, name, icon, description, is_active, sort_order
        FROM travel_categories
        ORDER BY sort_order ASC, id ASC
      `).all();

      const slugColors: Record<string, string> = {
        flights: '#2196F3', // blue
        hotels: '#FF9800', // orange
        packages: '#9C27B0', // purple
        tours: '#F44336', // red
        bus: '#FFC107', // amber
        train: '#4CAF50', // green
        'car-rental': '#3F51B5', // indigo
        cruises: '#009688', // teal
        tickets: '#E91E63', // pink
      };

      const categories = Array.isArray(rows) && rows.length > 0
        ? rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            icon: r.icon || 'fas fa-map-pin',
            color: slugColors[r.slug] || '#2196F3',
            description: r.description || '',
            isActive: Boolean(r.is_active),
            displayOrder: Number(r.sort_order ?? 0),
          }))
        : [];

      return res.json(categories);
    } catch (error) {
      console.error('Error fetching travel categories:', error);
      return res.json([]);
    }
  });

  // POST /api/travel-categories (admin)
  app.post('/api/travel-categories', async (req, res) => {
    try {
      ensureTravelCategoriesTable();
      const { name, slug, icon, color, description, isActive = true, displayOrder = 0 } = req.body || {};
      if (!name || !slug) {
        return res.status(400).json({ message: 'name and slug are required' });
      }
      const stmt = sqliteDb.prepare(`
        INSERT INTO travel_categories (name, slug, icon, description, is_active, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(String(name), String(slug), icon || null, description || null, isActive ? 1 : 0, Number(displayOrder) || 0);
      const row = sqliteDb.prepare(`SELECT * FROM travel_categories WHERE id = ?`).get(info.lastInsertRowid);
      return res.json(row);
    } catch (error) {
      console.error('Error adding travel category:', error);
      return res.status(500).json({ message: 'Failed to add category' });
    }
  });

  // PUT /api/travel-categories/:id (admin)
  app.put('/api/travel-categories/:id', async (req, res) => {
    try {
      ensureTravelCategoriesTable();
      const id = Number(req.params.id);
      const { name, slug, icon, description, isActive, displayOrder } = req.body || {};
      const row = sqliteDb.prepare(`SELECT * FROM travel_categories WHERE id = ?`).get(id);
      if (!row) return res.status(404).json({ message: 'Category not found' });
      const stmt = sqliteDb.prepare(`
        UPDATE travel_categories SET 
          name = COALESCE(?, name),
          slug = COALESCE(?, slug),
          icon = COALESCE(?, icon),
          description = COALESCE(?, description),
          is_active = COALESCE(?, is_active),
          sort_order = COALESCE(?, sort_order)
        WHERE id = ?
      `);
      stmt.run(
        name ?? null,
        slug ?? null,
        icon ?? null,
        description ?? null,
        typeof isActive === 'boolean' ? (isActive ? 1 : 0) : null,
        typeof displayOrder === 'number' ? displayOrder : null,
        id
      );
      const updated = sqliteDb.prepare(`SELECT * FROM travel_categories WHERE id = ?`).get(id);
      return res.json(updated);
    } catch (error) {
      console.error('Error updating travel category:', error);
      return res.status(500).json({ message: 'Failed to update category' });
    }
  });

  // DELETE /api/travel-categories/:id (admin)
  app.delete('/api/travel-categories/:id', async (req, res) => {
    try {
      ensureTravelCategoriesTable();
      const id = Number(req.params.id);
      const stmt = sqliteDb.prepare(`DELETE FROM travel_categories WHERE id = ?`);
      const info = stmt.run(id);
      return res.json({ success: true, deleted: info.changes });
    } catch (error) {
      console.error('Error deleting travel category:', error);
      return res.status(500).json({ message: 'Failed to delete category' });
    }
  });

  // GET /api/travel-deals/counts
  app.get('/api/travel-deals/counts', async (_req, res) => {
    try {
      const slugs = ['flights','hotels','packages','tours','cruises','bus','train','car-rental','tickets'];
      const baseFilter = `
        (status = 'active' OR status = 'published' OR status IS NULL)
        AND (visibility = 'public' OR visibility IS NULL)
        AND (processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL)
      `;
      const pageGate = `(
        page_type = 'travel-picks'
        OR display_pages LIKE '%travel%'
      )`;
      const counts: Record<string, number> = {};
      for (const slug of slugs) {
        let slugFilter = '';
        switch (slug) {
          case 'flights':
            slugFilter = `(
              category LIKE '%flight%' OR title LIKE '%flight%'
              OR display_pages LIKE '%flight%'
              OR content_type IN ('flight','flights')
              OR tags LIKE '%flight%'
            )`;
            break;
          case 'hotels':
            slugFilter = `(
              category LIKE '%hotel%' OR title LIKE '%hotel%'
              OR display_pages LIKE '%hotel%'
              OR content_type IN ('hotel','hotels')
              OR tags LIKE '%hotel%'
            )`;
            break;
          case 'packages':
            slugFilter = `(
              category LIKE '%package%' OR title LIKE '%package%'
              OR title LIKE '%holiday%'
              OR display_pages LIKE '%package%'
              OR content_type IN ('package','packages')
              OR tags LIKE '%package%'
            )`;
            break;
          case 'tours':
            slugFilter = `(
              category LIKE '%tour%' OR title LIKE '%tour%'
              OR display_pages LIKE '%tour%'
              OR content_type IN ('tour','tours')
              OR tags LIKE '%tour%'
            )`;
            break;
          case 'cruises':
            slugFilter = `(
              category LIKE '%cruise%' OR title LIKE '%cruise%'
              OR display_pages LIKE '%cruise%'
              OR content_type IN ('cruise','cruises')
              OR tags LIKE '%cruise%'
            )`;
            break;
          case 'bus':
            slugFilter = `(
              category LIKE '%bus%' OR title LIKE '%bus%'
              OR display_pages LIKE '%bus%'
              OR content_type IN ('bus')
              OR tags LIKE '%bus%'
            )`;
            break;
          case 'train':
            slugFilter = `(
              category LIKE '%train%' OR title LIKE '%train%'
              OR display_pages LIKE '%train%'
              OR content_type IN ('train','rail')
              OR tags LIKE '%train%'
            )`;
            break;
          case 'car-rental':
            slugFilter = `(
              category LIKE '%car%' OR title LIKE '%car%'
              OR title LIKE '%rental%' OR title LIKE '%taxi%'
              OR display_pages LIKE '%car%'
              OR content_type IN ('car','car-rental','taxi','cab')
              OR tags LIKE '%car%'
            )`;
            break;
          case 'tickets':
            slugFilter = `(
              category LIKE '%ticket%' OR title LIKE '%ticket%'
              OR display_pages LIKE '%ticket%'
              OR tags LIKE '%ticket%'
            )`;
            break;
        }
        const sql = `SELECT COUNT(*) as cnt FROM unified_content WHERE ${baseFilter} AND (${pageGate} OR ${slugFilter})`;
        const row = sqliteDb.prepare(sql).get();
        counts[slug] = Number(row?.cnt ?? 0);
      }
      return res.json(counts);
    } catch (error) {
      console.error('Error fetching travel deal counts:', error);
      return res.json({});
    }
  });

  // GET /api/travel-products/:category
  app.get('/api/travel-products/:category', async (req, res) => {
    try {
      const category = String(req.params.category || '').toLowerCase();
      const baseFilter = `
        (status = 'active' OR status = 'published' OR status IS NULL)
        AND (visibility = 'public' OR visibility IS NULL)
        AND (processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL)
      `;
      const pageGate = `(
        page_type = 'travel-picks'
        OR display_pages LIKE '%travel%'
      )`;
      let slugFilter = '';
      switch (category) {
        case 'flights':
          slugFilter = `(
            category LIKE '%flight%' OR title LIKE '%flight%'
            OR display_pages LIKE '%flight%'
            OR content_type IN ('flight','flights')
            OR tags LIKE '%flight%'
          )`;
          break;
        case 'hotels':
          slugFilter = `(
            category LIKE '%hotel%' OR title LIKE '%hotel%'
            OR display_pages LIKE '%hotel%'
            OR content_type IN ('hotel','hotels')
            OR tags LIKE '%hotel%'
          )`;
          break;
        case 'packages':
          slugFilter = `(
            category LIKE '%package%' OR title LIKE '%package%'
            OR title LIKE '%holiday%'
            OR display_pages LIKE '%package%'
            OR content_type IN ('package','packages')
            OR tags LIKE '%package%'
          )`;
          break;
        case 'tours':
          slugFilter = `(
            category LIKE '%tour%' OR title LIKE '%tour%'
            OR display_pages LIKE '%tour%'
            OR content_type IN ('tour','tours')
            OR tags LIKE '%tour%'
          )`;
          break;
        case 'cruises':
          slugFilter = `(
            category LIKE '%cruise%' OR title LIKE '%cruise%'
            OR display_pages LIKE '%cruise%'
            OR content_type IN ('cruise','cruises')
            OR tags LIKE '%cruise%'
          )`;
          break;
        case 'bus':
          slugFilter = `(
            category LIKE '%bus%' OR title LIKE '%bus%'
            OR display_pages LIKE '%bus%'
            OR content_type IN ('bus')
            OR tags LIKE '%bus%'
          )`;
          break;
        case 'train':
          slugFilter = `(
            category LIKE '%train%' OR title LIKE '%train%'
            OR display_pages LIKE '%train%'
            OR content_type IN ('train','rail')
            OR tags LIKE '%train%'
          )`;
          break;
        case 'car-rental':
          slugFilter = `(
            category LIKE '%car%' OR title LIKE '%car%'
            OR title LIKE '%rental%' OR title LIKE '%taxi%'
            OR display_pages LIKE '%car%'
            OR content_type IN ('car','car-rental','taxi','cab')
            OR tags LIKE '%car%'
          )`;
          break;
        case 'tickets':
          slugFilter = `(
            category LIKE '%ticket%' OR title LIKE '%ticket%'
            OR display_pages LIKE '%ticket%'
            OR tags LIKE '%ticket%'
          )`;
          break;
        default:
          // If unknown category, just gate by travel page
          slugFilter = pageGate;
      }

      const sql = `
        SELECT * FROM unified_content 
        WHERE ${baseFilter} AND (${pageGate} OR ${slugFilter})
        ORDER BY created_at DESC, id DESC
        LIMIT 200
      `;
      const rows = sqliteDb.prepare(sql).all();
      const deals = rows.map(mapTravelDeal);
      return res.json(deals);
    } catch (error) {
      console.error('Error fetching travel products:', error);
      return res.status(500).json({ message: 'Failed to fetch travel products' });
    }
  });

  // File upload endpoints
  app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ 
        message: 'File uploaded successfully',
        url: fileUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // Admin image upload endpoint (used by BannerManagement)
  app.post('/api/admin/upload-image', upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ imageUrl, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size });
    } catch (error) {
      console.error('Admin image upload error:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Admin: Telegram publish flag settings (DB-backed toggle)
  function ensureTelegramSettingsTable() {
    try {
      // Prefer a simple schema; fall back if CHECK constraint fails in some SQLite builds
      try {
        sqliteDb.exec(`
          CREATE TABLE IF NOT EXISTS telegram_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            publish_enabled INTEGER DEFAULT 0,
            updated_at INTEGER DEFAULT (strftime('%s','now'))
          );
        `);
      } catch (schemaErr) {
        // Fallback without CHECK constraint
        sqliteDb.exec(`
          CREATE TABLE IF NOT EXISTS telegram_settings (
            id INTEGER PRIMARY KEY,
            publish_enabled INTEGER DEFAULT 0,
            updated_at INTEGER DEFAULT (strftime('%s','now'))
          );
        `);
      }
      // Ensure a single row exists
      const exists = sqliteDb.prepare('SELECT id FROM telegram_settings WHERE id = 1').get() as any;
      if (!exists) {
        try {
          sqliteDb.prepare('INSERT INTO telegram_settings (id, publish_enabled) VALUES (1, 0)').run();
        } catch {
          // As a last resort, try INSERT OR IGNORE to handle race conditions
          sqliteDb.exec('INSERT OR IGNORE INTO telegram_settings (id, publish_enabled) VALUES (1, 0)');
        }
      }
    } catch (err) {
      console.warn('telegram_settings table init failed:', (err as any)?.message || err);
    }
  }

  app.get('/api/admin/telegram/publish-settings', async (_req, res) => {
    try {
      ensureTelegramSettingsTable();
      const row = sqliteDb.prepare('SELECT publish_enabled FROM telegram_settings WHERE id = 1').get() as any;
      const envFlag = String(process.env.TELEGRAM_PUBLISH || '').trim();
      const envEnabled = envFlag === '1' || envFlag.toLowerCase() === 'true';
      const dbEnabled = !!(row && (row.publish_enabled === 1 || row.publish_enabled === true));
      return res.json({ publishEnabled: dbEnabled, envFallback: envEnabled });
    } catch (error) {
      console.error('Telegram publish-settings GET error:', error);
      return res.status(500).json({ message: 'Failed to read Telegram publish settings' });
    }
  });

  app.put('/api/admin/telegram/publish-settings', async (req, res) => {
    try {
      const bodyAny = (req.body as any) || {};
      const q = (req.query as any) || {};
      ensureTelegramSettingsTable();
      const enabledRaw = bodyAny.publishEnabled ?? bodyAny.enabled ?? bodyAny.value ?? q.publishEnabled ?? q.enabled ?? q.value;
      // Robust boolean coercion (accept boolean, number, or string)
      const enabledStr = typeof enabledRaw === 'boolean'
        ? (enabledRaw ? 'true' : 'false')
        : String(enabledRaw ?? '').toLowerCase();
      const asInt = enabledStr === '1' || enabledStr === 'true' || enabledStr === 'on' || enabledStr === 'yes' ? 1 : 0;
      try {
        sqliteDb.prepare('UPDATE telegram_settings SET publish_enabled = ?, updated_at = strftime("%s","now") WHERE id = 1').run(asInt);
      } catch (updateErr) {
        // Fallback to exec for environments where prepared statements may fail unexpectedly
        sqliteDb.exec(`UPDATE telegram_settings SET publish_enabled = ${asInt}, updated_at = strftime('%s','now') WHERE id = 1`);
      }
      const row = sqliteDb.prepare('SELECT publish_enabled FROM telegram_settings WHERE id = 1').get() as any;
      return res.json({ success: true, publishEnabled: !!(row && row.publish_enabled === 1) });
    } catch (error) {
      const msg = (error as any)?.message || String(error);
      console.error('Telegram publish-settings PUT error:', msg);
      return res.status(500).json({ success: false, message: 'Failed to update Telegram publish settings', error: msg });
    }
  });

  // Admin: Telegram bot status
  app.get('/api/admin/telegram/status', async (_req, res) => {
    try {
      const manager = TelegramBotManager.getInstance();
      const status = manager.getStatus();
      res.json({ success: true, status });
    } catch (error) {
      console.error('Telegram status error:', error);
      res.status(500).json({ success: false, message: 'Failed to get Telegram bot status' });
    }
  });

  // Admin: Trigger a Telegram post (supports fallback by pageSlug/pageName)
  app.post('/api/admin/telegram/send', async (req, res) => {
    try {
      const bodyAny = (req.body as any) || {};
      const q = (req.query as any) || {};
      const providedPassword = (bodyAny.adminPassword || bodyAny.password || q.adminPassword || q.password || (req.headers['x-admin-password'] as string) || '').toString();
      const ok = await verifyAdminPassword(String(providedPassword || ''));
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Invalid admin password' });
      }

      // Resolve inputs from body or query
      let channelId = String((bodyAny.channelId ?? q.channelId ?? '')).trim();
      const pageSlug = String((bodyAny.pageSlug ?? q.pageSlug ?? '')).trim();
      const pageName = String((bodyAny.pageName ?? q.pageName ?? '')).trim();
      const fallbackEnvChannel = String(process.env.BOT_ALERT_CHAT_ID || process.env.MASTER_ADMIN_CHAT_ID || '').trim();
      const message = String((bodyAny.message ?? q.message ?? '🔔 Test message from PickNTrust backend')).trim();

      // Fallback: resolve channelId from pageSlug/pageName if not provided
      if (!channelId) {
        try {
          const { resolveChannelIdForPage } = await import('./telegram-bot.js');
          const resolved = resolveChannelIdForPage({ pageSlug, pageName });
          if (resolved) channelId = resolved;
        } catch (err) {
          console.warn('Failed to resolve channelId by pageSlug/pageName:', (err as any)?.message || err);
        }
      }

      // Final fallback to env-configured alert/admin chat
      if (!channelId) {
        channelId = fallbackEnvChannel;
      }

      if (!channelId) {
        return res.status(400).json({ success: false, message: 'channelId is required (pass channelId or pageSlug/pageName, or set BOT_ALERT_CHAT_ID)' });
      }

      const result = await sendTelegramNotification(channelId, message);
      if (!result) {
        return res.status(500).json({ success: false, message: 'Failed to send Telegram message (check BOT_SILENT and bot permissions)' });
      }
      return res.json({ success: true, messageId: (result as any)?.message_id ?? null });
    } catch (error) {
      console.error('Telegram send error:', error);
      res.status(500).json({ success: false, message: 'Failed to send Telegram message' });
    }
  });

  // Admin generic upload endpoint (allows documents like PDF)
  app.post('/api/admin/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size });
    } catch (error) {
      console.error('Admin upload error:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // Multiple file upload for blog posts
  app.post('/api/upload/multiple', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]), (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const result: { image?: string; video?: string } = {};

      if (files.image && files.image[0]) {
        result.image = `/uploads/${files.image[0].filename}`;
      }

      if (files.video && files.video[0]) {
        result.video = `/uploads/${files.video[0].filename}`;
      }

      res.json({ 
        message: 'Files uploaded successfully',
        files: result
      });
    } catch (error) {
      console.error('Multiple upload error:', error);
      res.status(500).json({ message: 'Failed to upload files' });
    }
  });

  // Get all products with pagination and search
  app.get("/api/products", async (req, res) => {
    try {
      const { search, limit = 20, offset = 0 } = req.query;
      let products = await storage.getProducts();
      
      // Search functionality
      if (search && typeof search === 'string') {
        const searchTerm = search.toLowerCase();
        products = products.filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm)
        );
      }
      
      // Pagination
      const total = products.length;
      const startIndex = parseInt(offset as string);
      const endIndex = startIndex + parseInt(limit as string);
      const paginatedProducts = products.slice(startIndex, endIndex);
      
      res.json({
        products: paginatedProducts,
        total,
        hasMore: endIndex < total,
        page: Math.floor(startIndex / parseInt(limit as string)) + 1
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get admin stats - separate counts for total and featured products
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const allProducts = await storage.getProducts();
      const featuredProducts = await storage.getFeaturedProducts();
      const blogPosts = await storage.getBlogPosts();
      const affiliateNetworks = await storage.getAffiliateNetworks();
      
      res.json({
        totalProducts: allProducts.length,
        featuredProducts: featuredProducts.length,
        blogPosts: blogPosts.length,
        affiliateNetworks: affiliateNetworks.length
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
  });

  // Apps products endpoint (used by Apps & AI tools pages)
  app.get('/api/products/apps', async (req, res) => {
    try {
      const { limit = 50, offset = 0, category } = req.query as any;
      const parsedLimit = Math.min(Math.max(parseInt(String(limit)) || 50, 1), 100);
      const parsedOffset = Math.max(parseInt(String(offset)) || 0, 0);

      let baseQuery = `
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
          updated_at AS UpdatedAt
        FROM unified_content
        WHERE 
          (
            display_pages LIKE '%apps%'
            OR REPLACE(LOWER(display_pages), ' ', '-') LIKE '%apps%'
            OR LOWER(page_type) = 'apps'
          )
          OR (
            is_ai_app = 1
            OR CAST(is_ai_app AS TEXT) IN ('1','true','TRUE','yes','YES','y','Y','on','ON')
            OR LOWER(content_type) IN ('app','ai-app')
          )
        ORDER BY id DESC
        LIMIT @limit OFFSET @offset
      `;

      const params: any = { limit: parsedLimit, offset: parsedOffset };

      // Optional category filter
      if (category && category !== 'all') {
        baseQuery = baseQuery.replace('ORDER BY id DESC', 'AND LOWER(category) = LOWER(@category) ORDER BY id DESC');
        params.category = String(category);
      }

      const rows = sqliteDb.prepare(baseQuery).all(params) as any[];
      res.json(rows || []);
    } catch (error) {
      console.error('Error fetching apps products:', error);
      res.json([]);
    }
  });

  // Get products by page
  // Slug normalization function to handle page name synonyms
  const normalizeSlug = (val: string): string => {
    const s = val.trim().toLowerCase().replace(/\s+/g, '-');
    switch (s) {
      case 'global':
      case 'globalpicks':
      case 'global-pick':
      case 'globals':
        return 'global-picks';
      case 'prime':
      case 'primepicks':
      case 'prime-pick':
        return 'prime-picks';
      case 'clickpicks':
      case 'click-pick':
        return 'click-picks';
      case 'cuepicks':
      case 'cue-pick':
        return 'cue-picks';
      case 'valuepicks':
      case 'value-pick':
        return 'value-picks';
      case 'apps-aiapps':
      case 'apps-aiapp':
      case 'ai-apps':
      case 'ai-app':
        return 'apps-ai-apps';
      default:
        return s;
    }
  };

  app.get('/api/products/page/:page', async (req, res) => {
    try {
      const { page } = req.params;
      const { category, limit = 50, offset = 0 } = req.query as any;
      const parsedLimit = Math.min(Math.max(parseInt(String(limit)) || 50, 1), 100);
      const parsedOffset = Math.max(parseInt(String(offset)) || 0, 0);

      // Validate parameters
      if (!page || page.trim() === '') {
        return res.status(400).json({
          message: "Page parameter is required",
          error: "INVALID_PARAMETERS"
        });
      }

      console.log(`Getting products for page: "${page}"`);

      // Normalize the page slug
      const normalizedPage = normalizeSlug(String(page));

      let query = `
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
          updated_at AS UpdatedAt
        FROM unified_content
        WHERE (
          status IN ('active','published') OR status IS NULL
        ) AND (
          visibility IN ('public','visible') OR visibility IS NULL
        ) AND (
          processing_status IN ('completed','active') OR processing_status IS NULL
        )
      `;

      const bindings: any = { limit: parsedLimit, offset: parsedOffset };

      // Apply page-specific filtering
      if (normalizedPage === 'apps' || normalizedPage === 'apps-ai-apps') {
        // Apps & AI Apps: show ONLY items published via the Apps/AI channel
        // Enforce telegram source and explicit page targeting to avoid bleed-over
        // Additionally, require the content to be classified as an app/AI app
        query += ` AND (
          LOWER(source_type) = 'telegram' AND (
            LOWER(page_type) IN ('apps','ai-apps','apps-ai-apps')
            OR REPLACE(LOWER(display_pages), ' ', '-') LIKE '%apps%'
            OR REPLACE(LOWER(display_pages), ' ', '-') LIKE '%apps-ai-apps%'
          )
        ) AND (
          COALESCE(is_ai_app, 0) = 1
          OR LOWER(content_type) IN ('app','ai-app')
          OR LOWER(category) LIKE '%app%'
          OR LOWER(category) LIKE '%ai%'
        )`;
        bindings.page = normalizedPage;
      } else if (normalizedPage === 'top-picks') {
        // Top Picks: show ONLY items published via the Top Picks channel
        // Require telegram source and explicit page targeting (page_type/display_pages)
        query += ` AND (
          LOWER(source_type) = 'telegram' AND (
            LOWER(page_type) = 'top-picks'
            OR REPLACE(LOWER(display_pages), ' ', '-') LIKE '%top-picks%'
          )
        )`;
        bindings.page = normalizedPage;
      } else {
        // Generic page filtering
        query += ` AND (
          display_pages LIKE '%' || @page || '%' OR
          display_pages = @page OR
          page_type = @page OR
          REPLACE(LOWER(display_pages), ' ', '-') LIKE '%' || LOWER(@page) || '%' OR
          REPLACE(LOWER(page_type), ' ', '-') = LOWER(@page) OR
          ((display_pages IS NULL OR display_pages = '') AND (@page = 'prime-picks' OR @page = 'global-picks'))
        )`;
        bindings.page = normalizedPage;
      }

      if (category && category !== 'all') {
        query += ` AND LOWER(category) = LOWER(@category)`;
        bindings.category = category;
      }

      query += ` ORDER BY created_at DESC, id DESC LIMIT @limit OFFSET @offset`;

      console.log(`[SQL] Query for page "${page}" (normalized: "${normalizedPage}"):`, query);
      console.log(`[SQL] Bindings:`, bindings);

      const rows = sqliteDb.prepare(query).all(bindings) as any[];
      console.log(`Found ${rows.length} products for page "${page}"`);

      // Helper: extract first http(s) URL from text
      const extractFirstUrl = (txt: string | null | undefined): string | null => {
        if (!txt) return null;
        const match = String(txt).match(/https?:\/\/[^\s)]+/i);
        return match ? match[0] : null;
      };

      // Helpers for price normalization/safety
      const toNum = (v: any): number | null => {
        if (v === null || typeof v === 'undefined') return null;
        const s = String(v).trim();
        if (!s) return null;
        const cleaned = s
          .replace(/\u20B9|₹|Rs\.?|INR/gi, '')
          .replace(/,/g, '')
          .replace(/[^0-9.]/g, '')
          .trim();
        if (!cleaned) return null;
        const n = parseFloat(cleaned);
        return isFinite(n) ? n : null;
      };

      const fmtPrice = (n: number | null, currency?: string): any => {
        if (n === null) return null;
        // Return number; frontend can format as needed. Keep currency for context.
        return n;
      };

      // Sanitize product fields for safe frontend display
      const sanitized = (Array.isArray(rows) ? rows : []).map((r: any) => {
        let name = String(r?.name || '').trim();
        const description = String(r?.description || '').trim();
        let imageUrl = String(r?.imageUrl || '').trim();
        let affiliateUrl = String(r?.affiliateUrl || '').trim();
        const currency = String(r?.currency || 'INR').trim() || 'INR';

        // Normalize pricing: ensure price <= originalPrice when both exist
        const pNum = toNum(r?.price);
        const opNum = toNum(r?.originalPrice);
        let priceOut: number | null = pNum;
        let originalOut: number | null = opNum;

        if (pNum !== null && opNum !== null) {
          if (pNum > opNum && opNum > 0) {
            // Swap if reversed
            priceOut = opNum;
            originalOut = pNum;
          }
        }

        // Compute discount when sensible
        let discountOut = r?.discount ?? null;
        if (priceOut !== null && originalOut !== null && originalOut > 0 && originalOut > priceOut) {
          const pct = Math.round(((originalOut - priceOut) / originalOut) * 100);
          discountOut = pct;
        }

        // If title is a URL or blank, derive a readable name from description
        const nameLooksLikeUrl = /^https?:\/\//i.test(name);
        if (!name || nameLooksLikeUrl) {
          const fromDesc = description.replace(/\s+/g, ' ').trim();
          if (fromDesc) {
            name = fromDesc.length > 80 ? fromDesc.slice(0, 80) + '…' : fromDesc;
          } else {
            name = 'PickNTrust Deal';
          }
        }

        // Ensure affiliateUrl exists: pull first URL from description/name if missing
        if (!affiliateUrl) {
          const urlFromDesc = extractFirstUrl(description);
          const urlFromName = nameLooksLikeUrl ? name : null;
          affiliateUrl = urlFromDesc || urlFromName || '';
        }

        // Fallback image if missing or placeholder-like
        const isPlaceholder = /placeholder|via\.placeholder|\bapi\/placeholder\b/i.test(imageUrl);
        if (!imageUrl || isPlaceholder) {
          imageUrl = '/api/placeholder/300/300';
        }

        return {
          ...r,
          name,
          imageUrl,
          affiliateUrl,
          price: fmtPrice(priceOut, currency),
          originalPrice: fmtPrice(originalOut, currency),
          discount: discountOut,
          currency,
        };
      });

      res.json(sanitized);
    } catch (error) {
      console.error('Error fetching products by page:', error);
      res.json([]);
    }
  });

  // Video content listing endpoint
  app.get('/api/video-content', async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query as any;
      const parsedLimit = Math.min(Math.max(parseInt(String(limit)) || 50, 1), 200);
      const parsedOffset = Math.max(parseInt(String(offset)) || 0, 0);

      // Dynamically include optional columns (pages, show_on_homepage) if they exist
      const tableInfo = sqliteDb.prepare(`PRAGMA table_info(video_content)`).all();
      const colNames = Array.isArray(tableInfo) ? tableInfo.map((c: any) => c.name) : [];
      const hasPagesCol = colNames.includes('pages');
      const hasShowOnHomepageCol = colNames.includes('show_on_homepage');

      const selectColumns = `
        id,
        title,
        description,
        platform,
        category,
        tags,
        thumbnail_url AS thumbnailUrl,
        video_url AS videoUrl,
        has_timer AS hasTimer,
        timer_duration AS timerDuration,
        timer_start_time AS timerStartTime,
        created_at AS createdAt,
        ${hasPagesCol ? 'pages' : 'NULL AS pages'},
        ${hasShowOnHomepageCol ? 'show_on_homepage AS showOnHomepage' : 'NULL AS showOnHomepage'}
      `;

      const sql = `
        SELECT ${selectColumns}
        FROM video_content
        ORDER BY created_at DESC
        LIMIT @limit OFFSET @offset
      `;

      const rawRows = sqliteDb.prepare(sql).all({ limit: parsedLimit, offset: parsedOffset });

      const rows = (Array.isArray(rawRows) ? rawRows : []).map((r: any) => ({
        id: r.id,
        title: r.title || '',
        description: r.description || '',
        platform: r.platform || 'any-website',
        category: r.category || 'General',
        tags: (() => {
          if (!r.tags) return [];
          if (Array.isArray(r.tags)) return r.tags;
          if (typeof r.tags === 'string') {
            try {
              const parsed = JSON.parse(r.tags);
              return Array.isArray(parsed) ? parsed : r.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
            } catch {
              return r.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
            }
          }
          return [];
        })(),
        thumbnailUrl: r.thumbnailUrl || '',
        videoUrl: r.videoUrl || '',
        hasTimer: !!r.hasTimer,
        timerDuration: r.timerDuration ?? null,
        timerStartTime: r.timerStartTime ?? null,
        pages: (() => {
          if (!r.pages) return [];
          if (Array.isArray(r.pages)) return r.pages.map((p: any) => String(p).trim().toLowerCase()).filter(Boolean);
          if (typeof r.pages === 'string') {
            try {
              const parsed = JSON.parse(r.pages);
              if (Array.isArray(parsed)) {
                return parsed.map((p: any) => String(p).trim().toLowerCase()).filter(Boolean);
              }
              // Fall back to CSV parsing if string isn't valid JSON array
              return String(r.pages)
                .split(',')
                .map((s: string) => s.trim().toLowerCase())
                .filter(Boolean);
            } catch {
              // CSV fallback
              return String(r.pages)
                .split(',')
                .map((s: string) => s.trim().toLowerCase())
                .filter(Boolean);
            }
          }
          return [];
        })(),
        showOnHomepage: typeof r.showOnHomepage !== 'undefined' ? Boolean(r.showOnHomepage) : true,
        createdAt: r.createdAt,
      }));

      // Safe fallback: return a sample video when database is empty
      if (!rows.length) {
        const fallback = [{
          id: 0,
          title: 'Welcome to PickNTrust Videos',
          description: 'Sample video placeholder. Add your own in Admin → Videos.',
          platform: 'youtube',
          category: 'General',
          tags: ['demo', 'getting-started'],
          thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          hasTimer: false,
          timerDuration: null,
          timerStartTime: null,
          pages: [],
          showOnHomepage: true,
          createdAt: Math.floor(Date.now() / 1000),
        }];
        return res.json(fallback);
      }

      res.json(rows);
    } catch (error) {
      console.error('Error fetching video content:', error);
      res.json([]);
    }
  });

  // Admin: Add video content
  app.post('/api/admin/video-content', async (req, res) => {
    try {
      const {
        adminPassword,
        password,
        title,
        description,
        videoUrl,
        thumbnailUrl,
        platform,
        category,
        tags,
        duration,
        hasTimer,
        timerDuration,
        pages,
        showOnHomepage,
        ctaText,
        ctaUrl,
      } = req.body || {};

      // Accept multiple ways to provide admin password for backward compatibility
      const providedPassword = (adminPassword || password || (req.headers['x-admin-password'] as string) || (req.query as any)?.adminPassword || (req.query as any)?.password || '').toString();

      // Verify admin password
      const ok = await verifyAdminPassword(String(providedPassword || ''));
      if (!ok) {
        return res.status(401).json({ message: 'Invalid admin password' });
      }

      // Fallbacks: allow providing fields via query when body parsing fails
      const q = (req.query || {}) as any;
      const resolvedTitle = (typeof title !== 'undefined' && title !== null) ? String(title) : (typeof q.title !== 'undefined' ? String(q.title) : '');
      const resolvedVideoUrl = (typeof videoUrl !== 'undefined' && videoUrl !== null) ? String(videoUrl) : (typeof q.videoUrl !== 'undefined' ? String(q.videoUrl) : '');

      if (!resolvedTitle || !resolvedVideoUrl) {
        return res.status(400).json({ message: 'title and videoUrl are required' });
      }

      // Normalize inputs
      const normalizedTags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string' && tags.trim().length
          ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : typeof q.tags === 'string' && q.tags.trim().length
            ? String(q.tags).split(',').map((t: string) => t.trim()).filter(Boolean)
          : [];

      // Normalize pages from body or query; accept array or CSV string
      const normalizedPages = Array.isArray(pages)
        ? (pages as any[]).map((p: any) => String(p).trim().toLowerCase()).filter(Boolean)
        : typeof pages === 'string' && pages.trim().length
          ? String(pages).split(',').map((p: string) => p.trim().toLowerCase()).filter(Boolean)
          : typeof q.pages === 'string' && q.pages.trim().length
            ? String(q.pages).split(',').map((p: string) => p.trim().toLowerCase()).filter(Boolean)
            : [];

      const effectivePages = normalizedPages.length ? normalizedPages : DEFAULT_VIDEO_PAGES;

      // Normalize showOnHomepage from body or query, handling string booleans
      const normalizedShowOnHomepage = ((): boolean => {
        const raw = typeof showOnHomepage !== 'undefined' ? showOnHomepage : (typeof q.showOnHomepage !== 'undefined' ? q.showOnHomepage : undefined);
        if (typeof raw === 'string') {
          const lc = raw.toLowerCase().trim();
          return !(lc === 'false' || lc === '0' || lc === 'no');
        }
        return typeof raw === 'undefined' ? true : !!raw;
      })();

      const record: any = {
        title: resolvedTitle.trim(),
        description: description ?? (typeof q.description !== 'undefined' ? String(q.description) : null),
        videoUrl: resolvedVideoUrl.trim(),
        thumbnailUrl: thumbnailUrl ?? (typeof q.thumbnailUrl !== 'undefined' ? String(q.thumbnailUrl) : null),
        platform: platform ?? (typeof q.platform !== 'undefined' ? String(q.platform) : 'any-website'),
        category: category ?? (typeof q.category !== 'undefined' ? String(q.category) : 'General'),
        tags: normalizedTags,
        duration: duration ?? null,
        hasTimer: !!hasTimer,
        timerDuration: hasTimer ? (timerDuration != null ? parseInt(String(timerDuration)) : null) : null,
        // Optional UI-only fields: persist if columns exist via separate migrations
        pages: effectivePages,
        showOnHomepage: normalizedShowOnHomepage,
        ctaText: ctaText ?? (typeof q.ctaText !== 'undefined' ? String(q.ctaText) : null),
        ctaUrl: ctaUrl ?? (typeof q.ctaUrl !== 'undefined' ? String(q.ctaUrl) : null),
      };

      const created = await storage.addVideoContent(record);
      return res.json({ success: true, data: created });
    } catch (error) {
      console.error('Error adding video content:', error);
      return res.status(500).json({ message: 'Failed to add video content' });
    }
  });

  // Compatibility: Allow creating video content via non-admin path with admin password
  // This helps when upstream proxies return 404 for POST under /api/admin/*.
  app.post('/api/video-content', async (req, res) => {
    try {
      const {
        adminPassword,
        password,
        title,
        description,
        videoUrl,
        thumbnailUrl,
        platform,
        category,
        tags,
        duration,
        hasTimer,
        timerDuration,
        pages,
        showOnHomepage,
        ctaText,
        ctaUrl,
      } = req.body || {};

      const providedPassword = (adminPassword || password || (req.headers['x-admin-password'] as string) || (req.query as any)?.adminPassword || (req.query as any)?.password || '').toString();
      const ok = await verifyAdminPassword(String(providedPassword || ''));
      if (!ok) {
        return res.status(401).json({ message: 'Invalid admin password' });
      }

      const q = (req.query || {}) as any;
      const resolvedTitle = (typeof title !== 'undefined' && title !== null) ? String(title) : (typeof q.title !== 'undefined' ? String(q.title) : '');
      const resolvedVideoUrl = (typeof videoUrl !== 'undefined' && videoUrl !== null) ? String(videoUrl) : (typeof q.videoUrl !== 'undefined' ? String(q.videoUrl) : '');

      if (!resolvedTitle || !resolvedVideoUrl) {
        return res.status(400).json({ message: 'title and videoUrl are required' });
      }

      const normalizedTags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string' && tags.trim().length
          ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : typeof q.tags === 'string' && q.tags.trim().length
            ? String(q.tags).split(',').map((t: string) => t.trim()).filter(Boolean)
          : [];

      // Normalize pages and showOnHomepage for compat route
      const normalizedPagesCompat = Array.isArray(pages)
        ? (pages as any[]).map((p: any) => String(p).trim().toLowerCase()).filter(Boolean)
        : typeof pages === 'string' && pages.trim().length
          ? String(pages).split(',').map((p: string) => p.trim().toLowerCase()).filter(Boolean)
          : typeof q.pages === 'string' && q.pages.trim().length
            ? String(q.pages).split(',').map((p: string) => p.trim().toLowerCase()).filter(Boolean)
            : [];

      const effectivePagesCompat = normalizedPagesCompat.length ? normalizedPagesCompat : DEFAULT_VIDEO_PAGES;

      const normalizedShowOnHomepageCompat = ((): boolean => {
        const raw = typeof showOnHomepage !== 'undefined' ? showOnHomepage : (typeof q.showOnHomepage !== 'undefined' ? q.showOnHomepage : undefined);
        if (typeof raw === 'string') {
          const lc = raw.toLowerCase().trim();
          return !(lc === 'false' || lc === '0' || lc === 'no');
        }
        return typeof raw === 'undefined' ? true : !!raw;
      })();

      const record: any = {
        title: resolvedTitle.trim(),
        description: description ?? (typeof q.description !== 'undefined' ? String(q.description) : null),
        videoUrl: resolvedVideoUrl.trim(),
        thumbnailUrl: thumbnailUrl ?? (typeof q.thumbnailUrl !== 'undefined' ? String(q.thumbnailUrl) : null),
        platform: platform ?? (typeof q.platform !== 'undefined' ? String(q.platform) : 'any-website'),
        category: category ?? (typeof q.category !== 'undefined' ? String(q.category) : 'General'),
        tags: normalizedTags,
        duration: duration ?? null,
        hasTimer: !!hasTimer,
        timerDuration: hasTimer ? (timerDuration != null ? parseInt(String(timerDuration)) : null) : null,
        pages: effectivePagesCompat,
        showOnHomepage: normalizedShowOnHomepageCompat,
        ctaText: ctaText ?? (typeof q.ctaText !== 'undefined' ? String(q.ctaText) : null),
        ctaUrl: ctaUrl ?? (typeof q.ctaUrl !== 'undefined' ? String(q.ctaUrl) : null),
      };

      const created = await storage.addVideoContent(record);
      return res.json({ success: true, data: created });
    } catch (error) {
      console.error('Error adding video content (compat route):', error);
      return res.status(500).json({ message: 'Failed to add video content' });
    }
  });

  // Fallback GET creator: create via query string for environments where POST is blocked
  app.get('/api/admin/video-content/create', async (req, res) => {
    try {
      const q = (req.query || {}) as any;
      const providedPassword = (q.adminPassword || q.password || (req.headers['x-admin-password'] as string) || '').toString();
      const ok = await verifyAdminPassword(String(providedPassword || ''));
      if (!ok) {
        return res.status(401).json({ message: 'Invalid admin password' });
      }

      const resolvedTitle = typeof q.title !== 'undefined' ? String(q.title) : '';
      const resolvedVideoUrl = typeof q.videoUrl !== 'undefined' ? String(q.videoUrl) : '';
      if (!resolvedTitle || !resolvedVideoUrl) {
        return res.status(400).json({ message: 'title and videoUrl are required' });
      }

      const normalizedTags = typeof q.tags === 'string' && q.tags.trim().length
        ? String(q.tags).split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];

      const record: any = {
        title: resolvedTitle.trim(),
        description: typeof q.description !== 'undefined' ? String(q.description) : null,
        videoUrl: resolvedVideoUrl.trim(),
        thumbnailUrl: typeof q.thumbnailUrl !== 'undefined' ? String(q.thumbnailUrl) : null,
        platform: typeof q.platform !== 'undefined' ? String(q.platform) : 'any-website',
        category: typeof q.category !== 'undefined' ? String(q.category) : 'General',
        tags: normalizedTags,
        duration: typeof q.duration !== 'undefined' ? String(q.duration) : null,
        hasTimer: String(q.hasTimer || '').toLowerCase() === 'true',
        timerDuration: q.timerDuration != null ? parseInt(String(q.timerDuration)) : null,
        pages: typeof q.pages === 'string' ? String(q.pages).split(',').map((p: string) => p.trim().toLowerCase()).filter(Boolean) : [],
        showOnHomepage: typeof q.showOnHomepage !== 'undefined' ? !(String(q.showOnHomepage).toLowerCase().trim() === 'false' || String(q.showOnHomepage).trim() === '0') : true,
        ctaText: typeof q.ctaText !== 'undefined' ? String(q.ctaText) : null,
        ctaUrl: typeof q.ctaUrl !== 'undefined' ? String(q.ctaUrl) : null,
      };

      const created = await storage.addVideoContent(record);
      return res.json({ success: true, data: created });
    } catch (error) {
      console.error('Error adding video content (GET fallback):', error);
      return res.status(500).json({ message: 'Failed to add video content' });
    }
  });

  // Admin: Update video content
  app.put('/api/admin/video-content/:id', async (req, res) => {
    try {
      // Accept password via body, header, or query for proxy compatibility
      const bodyAny = (req.body as any) || {};
      const queryAny = (req.query as any) || {};
      const srcPassword = bodyAny.adminPassword
        ? 'body.adminPassword'
        : bodyAny.password
        ? 'body.password'
        : (req.headers['x-admin-password'] as string)
        ? 'header.x-admin-password'
        : queryAny.adminPassword
        ? 'query.adminPassword'
        : queryAny.password
        ? 'query.password'
        : 'none';
      console.log('🛠️ PUT /api/admin/video-content/:id [routes-final.ts] inbound', {
        url: req.originalUrl,
        idParam: req.params?.id,
        srcPassword,
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        bodyKeys: Object.keys(bodyAny || {}),
        queryKeys: Object.keys(queryAny || {}),
      });
      const providedPassword = (bodyAny.adminPassword || bodyAny.password || (req.headers['x-admin-password'] as string) || queryAny.adminPassword || queryAny.password || '').toString();
      const ok = await verifyAdminPassword(String(providedPassword || ''));
      if (!ok) {
        return res.status(401).json({ message: 'Invalid admin password' });
      }

      const id = parseInt(String(req.params.id));
      if (!Number.isFinite(id)) {
        return res.status(400).json({ message: 'Invalid id parameter' });
      }

      // Start with body updates; merge query fallbacks when proxies strip JSON bodies
      const updates: any = { ...bodyAny };
      delete updates.adminPassword;

      // Merge in query parameters when present
      // Title/description/platform/category/duration/URL fields
      if (typeof updates.title === 'undefined' && typeof queryAny.title !== 'undefined') {
        updates.title = String(queryAny.title);
      }
      if (typeof updates.description === 'undefined' && typeof queryAny.description !== 'undefined') {
        updates.description = String(queryAny.description);
      }
      if (typeof updates.platform === 'undefined' && typeof queryAny.platform !== 'undefined') {
        updates.platform = String(queryAny.platform);
      }
      if (typeof updates.category === 'undefined' && typeof queryAny.category !== 'undefined') {
        updates.category = String(queryAny.category);
      }
      if (typeof updates.duration === 'undefined' && typeof queryAny.duration !== 'undefined') {
        updates.duration = String(queryAny.duration);
      }
      if (typeof updates.videoUrl === 'undefined' && typeof queryAny.videoUrl !== 'undefined') {
        updates.videoUrl = String(queryAny.videoUrl);
      }
      if (typeof updates.thumbnailUrl === 'undefined' && typeof queryAny.thumbnailUrl !== 'undefined') {
        updates.thumbnailUrl = String(queryAny.thumbnailUrl);
      }

      // Tags: accept CSV string in query
      if (typeof updates.tags === 'undefined' && typeof queryAny.tags === 'string') {
        updates.tags = String(queryAny.tags)
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean);
      } else if (updates.tags && !Array.isArray(updates.tags) && typeof updates.tags === 'string') {
        updates.tags = updates.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      }

      // Pages: accept array or CSV string in query
      if (typeof updates.pages === 'undefined') {
        if (Array.isArray(queryAny.pages)) {
          updates.pages = (queryAny.pages as any[]).map((p: any) => String(p)).filter(Boolean);
        } else if (typeof queryAny.pages === 'string' && queryAny.pages.trim().length) {
          updates.pages = String(queryAny.pages)
            .split(',')
            .map((p: string) => p.trim())
            .filter(Boolean);
        }
      }

      // showOnHomepage: handle string booleans from query
      if (typeof updates.showOnHomepage === 'undefined' && typeof queryAny.showOnHomepage !== 'undefined') {
        const raw = String(queryAny.showOnHomepage).trim().toLowerCase();
        updates.showOnHomepage = !(raw === 'false' || raw === '0' || raw === 'no');
      }

      // hasTimer/timerDuration: accept numeric/boolean via query
      if (typeof updates.hasTimer === 'undefined' && typeof queryAny.hasTimer !== 'undefined') {
        const raw = String(queryAny.hasTimer).trim().toLowerCase();
        updates.hasTimer = !(raw === 'false' || raw === '0' || raw === 'no');
      }
      if (typeof updates.timerDuration === 'undefined' && typeof queryAny.timerDuration !== 'undefined') {
        updates.timerDuration = parseInt(String(queryAny.timerDuration));
      }

      console.log('🔎 PUT /api/admin/video-content/:id [routes-final.ts] resolved fields', {
        id,
        hasTitle: typeof updates.title !== 'undefined',
        hasDescription: typeof updates.description !== 'undefined',
        hasVideoUrl: typeof updates.videoUrl !== 'undefined',
        hasThumbnailUrl: typeof updates.thumbnailUrl !== 'undefined',
        tagsCount: Array.isArray(updates.tags) ? updates.tags.length : (typeof updates.tags !== 'undefined' ? 1 : 0),
        pagesCount: Array.isArray(updates.pages) ? updates.pages.length : 0,
        showOnHomepage: updates.showOnHomepage,
        hasTimer: updates.hasTimer,
        timerDuration: updates.timerDuration,
      });

      const updated = await storage.updateVideoContent(id, updates);
      if (!updated) {
        return res.status(404).json({ message: 'Video content not found or not updated' });
      }
      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating video content:', error);
      return res.status(500).json({ message: 'Failed to update video content' });
    }
  });

  // Admin: Delete single video content
  app.delete('/api/admin/video-content/:id', async (req, res) => {
    try {
      const bodyAny = (req.body as any) || {};
      const { adminPassword } = (req.query as any) ?? {};
      const providedPassword = (adminPassword || bodyAny.adminPassword || bodyAny.password || (req.headers['x-admin-password'] as string) || (req.query as any)?.password || '').toString();
      const ok = await verifyAdminPassword(String(providedPassword || ''));
      if (!ok) {
        return res.status(401).json({ message: 'Invalid admin password' });
      }

      const id = parseInt(String(req.params.id));
      if (!Number.isFinite(id)) {
        return res.status(400).json({ message: 'Invalid id parameter' });
      }

      const deleted = await storage.deleteVideoContent(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Video content not found' });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting video content:', error);
      return res.status(500).json({ message: 'Failed to delete video content' });
    }
  });

  // Admin: Bulk delete all video content
  app.delete('/api/admin/video-content/bulk-delete', async (req, res) => {
    try {
      const bodyAny = (req.body as any) || {};
      const { adminPassword } = (req.query as any) ?? {};
      const providedPassword = (adminPassword || bodyAny.adminPassword || bodyAny.password || (req.headers['x-admin-password'] as string) || (req.query as any)?.password || '').toString();
      const ok = await verifyAdminPassword(String(providedPassword || ''));
      if (!ok) {
        return res.status(401).json({ message: 'Invalid admin password' });
      }

      const count = await storage.deleteAllVideoContent();
      return res.json({ success: true, deleted: count });
    } catch (error) {
      console.error('Error bulk deleting video content:', error);
      return res.status(500).json({ message: 'Failed to bulk delete video content' });
    }
  });

  // Categories endpoints for admin forms
  app.get('/api/categories/forms/products', async (_req, res) => {
    try {
      const rows = sqliteDb.prepare(`
        SELECT name, name AS id, 0 AS count
        FROM categories
        WHERE (parent_id IS NULL)
          AND (is_for_products = 1)
        ORDER BY display_order ASC, name ASC
      `).all();
      res.json(rows || []);
    } catch (error) {
      console.error('Error fetching product form categories:', error);
      res.json([]);
    }
  });

  app.get('/api/categories/forms/services', async (_req, res) => {
    try {
      const rows = sqliteDb.prepare(`
        SELECT name, name AS id, 0 AS count
        FROM categories
        WHERE (parent_id IS NULL)
          AND (is_for_services = 1 OR is_for_services IS NULL)
        ORDER BY display_order ASC, name ASC
      `).all();
      res.json(rows || []);
    } catch (error) {
      console.error('Error fetching service form categories:', error);
      res.json([]);
    }
  });

  app.get('/api/categories/forms/aiapps', async (_req, res) => {
    try {
      const rows = sqliteDb.prepare(`
        SELECT name, name AS id, 0 AS count
        FROM categories
        WHERE (parent_id IS NULL)
          AND (is_for_ai_apps = 1 OR is_for_ai_apps IS NULL)
        ORDER BY display_order ASC, name ASC
      `).all();
      res.json(rows || []);
    } catch (error) {
      console.error('Error fetching AI Apps form categories:', error);
      res.json([]);
    }
  });

  // Public categories list (used by homepage and forms)
  app.get('/api/categories', async (_req, res) => {
    try {
      const rows = sqliteDb.prepare(`
        SELECT id, name, icon, color, description,
               is_for_services, is_for_ai_apps, display_order
        FROM categories
        ORDER BY display_order ASC, name ASC
      `).all();
      res.json(rows || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.json([]);
    }
  });

  // Browse categories with counts
  app.get('/api/categories/browse', async (req, res) => {
    try {
      const { type } = req.query as any;
      let typeFilter = '';

      // Optional type filtering applied to unified_content
      if (type && type !== 'all') {
        const t = String(type).toLowerCase();
        if (t === 'products') {
          typeFilter = ` AND (uc.is_service IS NULL OR uc.is_service = 0) AND (uc.is_ai_app IS NULL OR uc.is_ai_app = 0)`;
        } else if (t === 'services') {
          typeFilter = ` AND uc.is_service = 1`;
        } else if (t === 'aiapps') {
          typeFilter = ` AND uc.is_ai_app = 1`;
        }
      }

      const query = `
        SELECT c.name,
               c.name AS id,
               COALESCE(
                 (
                   SELECT COUNT(*)
                   FROM unified_content uc
                   WHERE uc.category = c.name
                   ${typeFilter}
                 ), 0
               ) AS count
        FROM categories c
        ORDER BY c.display_order ASC, c.name ASC
      `;
      const rows = sqliteDb.prepare(query).all();
      res.json(rows || []);
    } catch (error) {
      console.error('Error fetching browse categories:', error);
      res.json([]);
    }
  });

  // Get featured products (only within 24 hours)
  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      
      // Filter out products older than 24 hours
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentProducts = products.filter(product => {
        if (!product.createdAt) return true; // Keep products without createdAt for backward compatibility
        const productDate = new Date(product.createdAt);
        return productDate > twentyFourHoursAgo;
      });
      
      res.json(recentProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  // Get products by category
  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const { gender } = req.query;
      
      // URL decode the category parameter to handle spaces and special characters
      const decodedCategory = decodeURIComponent(category);
      console.log(`Getting products for category: "${decodedCategory}" with gender filter: "${gender}"`);
      
      let products = await storage.getProductsByCategory(decodedCategory);
      
      // Apply gender filtering if provided
      if (gender && typeof gender === 'string') {
        products = products.filter(product => 
          product.gender === gender
        );
      }
      
      res.json(products);
    } catch (error) {
      console.error(`Error fetching products for category "${req.params.category}":`, error);
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });

  // Get categories (direct SQL to avoid ORM inconsistencies)
  app.get("/api/categories", async (_req, res) => {
    try {
      const rows = sqliteDb.prepare(`
        SELECT id, name, icon, color, description,
               is_for_services, is_for_ai_apps, display_order
        FROM categories
        ORDER BY display_order ASC, name ASC
      `).all();
      res.json(rows || []);
    } catch (error) {
      console.error('Error fetching categories (primary route):', error);
      res.json([]);
    }
  });

  // Get all affiliate networks
  app.get("/api/affiliate-networks", async (req, res) => {
    try {
      const networks = await storage.getAffiliateNetworks();
      res.json(networks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch affiliate networks" });
    }
  });

  // Get active affiliate networks
  app.get("/api/affiliate-networks/active", async (req, res) => {
    try {
      const networks = await storage.getActiveAffiliateNetworks();
      res.json(networks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active affiliate networks" });
    }
  });

  // Get blog posts (only within 24 hours)
  app.get("/api/blog", async (req, res) => {
    try {
      const blogPosts = await storage.getBlogPosts();

      // Optional filter via query: ?recent=24 (hours). If not provided, show all.
      const recentHours = Number(String((req.query as any).recent || '').trim()) || 0;
      const filtered = recentHours > 0
        ? blogPosts.filter(post => {
            if (!post.createdAt) return true;
            const postDate = new Date(post.createdAt);
            const cutoff = new Date(Date.now() - recentHours * 60 * 60 * 1000);
            return postDate > cutoff;
          })
        : blogPosts;

      // Sort by most recent first
      const sortedPosts = filtered.sort((a, b) =>
        new Date(b.publishedAt || b.createdAt || 0).getTime() - new Date(a.publishedAt || a.createdAt || 0).getTime()
      );

      res.json(sortedPosts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Newsletter subscription
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const validationResult = insertNewsletterSubscriberSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid email address",
          errors: validationResult.error.errors 
        });
      }

      const subscriber = await storage.subscribeToNewsletter(validationResult.data);
      res.json({ message: "Successfully subscribed to newsletter!", subscriber });
    } catch (error: any) {
      if (error.message === "Email already subscribed") {
        return res.status(409).json({ message: "This email is already subscribed to our newsletter" });
      }
      res.status(500).json({ message: "Failed to subscribe to newsletter" });
    }
  });

  // Analytics endpoints for Android app
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const products = await storage.getProducts();
      const categories = await storage.getCategories();
      const blogPosts = await storage.getBlogPosts();
      
      res.json({
        totalProducts: products.length,
        totalCategories: categories.length,
        totalBlogPosts: blogPosts.length,
        featuredProducts: products.filter(p => p.isFeatured).length,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Track affiliate clicks (for analytics)
  app.post("/api/affiliate/track", async (req, res) => {
    try {
      const { productId, affiliateUrl } = req.body;
      
      // In a real application, you would store this data for analytics
      console.log(`Affiliate click tracked: Product ${productId}, URL: ${affiliateUrl}`);
      
      res.json({ message: "Click tracked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to track affiliate click" });
    }
  });

  // Extract product details from URL - Uses built-in extraction without Flask dependency
  app.post("/api/products/extract", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      // Basic URL validation
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(url)) {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      // Use enhanced URL-based extraction directly
      const extractedData = await extractFromUrlPattern(url);

      res.json({
        success: true,
        data: extractedData,
        message: "Product details extracted successfully"
      });

    } catch (error) {
      console.error('Product extraction error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to extract product details" 
      });
    }
  });

  // Admin routes
  app.post('/api/admin/products', async (req, res) => {
    try {
      const { password, ...productData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const product = await storage.addProduct(productData);
      res.json({ message: 'Product added successfully', product });
    } catch (error) {
      console.error('Add product error:', error);
      res.status(500).json({ message: 'Failed to add product' });
    }
  });

  app.delete('/api/admin/products/:id', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      
      if (deleted) {
        res.json({ message: 'Product deleted successfully' });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });

  app.put('/api/admin/products/:id', async (req, res) => {
    try {
      const { password, ...updates } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const product = await storage.updateProduct(id, updates);
      
      if (product) {
        res.json({ message: 'Product updated successfully', product });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ message: 'Failed to update product' });
    }
  });

  // Blog management routes
  app.post('/api/admin/blog', async (req, res) => {
    try {
      const { password: _bodyPassword, adminPassword: _adminPassword, ...blogPostData } = (req.body || {});
      const blogPost = await storage.addBlogPost(blogPostData);
      res.json({ message: 'Blog post added successfully', blogPost });
    } catch (error) {
      console.error('Add blog post error:', error);
      res.status(500).json({ message: 'Failed to add blog post' });
    }
  });

  app.get('/api/blog/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const blogPosts = await storage.getBlogPosts();
      const blogPost = blogPosts.find(post => post.slug === slug);
      
      if (!blogPost) {
        return res.status(404).json({ message: 'Blog post not found' });
      }
      
      res.json(blogPost);
    } catch (error) {
      console.error('Get blog post error:', error);
      res.status(500).json({ message: 'Failed to fetch blog post' });
    }
  });

  app.delete('/api/admin/blog/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBlogPost(id);
      
      if (deleted) {
        res.json({ message: 'Blog post deleted successfully' });
      } else {
        res.status(404).json({ message: 'Blog post not found' });
      }
    } catch (error) {
      console.error('Delete blog post error:', error);
      res.status(500).json({ message: 'Failed to delete blog post' });
    }
  });

  app.put('/api/admin/blog/:id', async (req, res) => {
    try {
      const { password: _bodyPassword, adminPassword: _adminPassword, ...updates } = (req.body || {});
      const id = parseInt(req.params.id);
      const blogPost = await storage.updateBlogPost(id, updates);
      
      if (blogPost) {
        res.json({ message: 'Blog post updated successfully', blogPost });
      } else {
        res.status(404).json({ message: 'Blog post not found' });
      }
    } catch (error) {
      console.error('Update blog post error:', error);
      res.status(500).json({ message: 'Failed to update blog post' });
    }
  });

  // Announcement active endpoint - direct SQL to avoid missing storage methods
  // Ensure announcements table exists (self-healing in environments without migrations)
  const ensureAnnouncementsTable = () => {
    try {
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS announcements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          text_color TEXT DEFAULT '#ffffff',
          background_color TEXT DEFAULT '#3b82f6',
          font_size TEXT DEFAULT '16px',
          font_weight TEXT DEFAULT 'normal',
          text_decoration TEXT DEFAULT 'none',
          font_style TEXT DEFAULT 'normal',
          animation_speed TEXT DEFAULT '30',
          text_border_width TEXT DEFAULT '0px',
          text_border_style TEXT DEFAULT 'solid',
          text_border_color TEXT DEFAULT '#000000',
          banner_border_width TEXT DEFAULT '0px',
          banner_border_style TEXT DEFAULT 'solid',
          banner_border_color TEXT DEFAULT '#000000',
          page TEXT,
          is_global INTEGER DEFAULT 1,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
      `);
    } catch (e) {
      console.error('Failed ensuring announcements table:', e);
    }
  };

  app.get('/api/announcement/active', async (req, res) => {
    try {
      ensureAnnouncementsTable();
      const { page } = req.query as any;

      const activeRows: any[] = sqliteDb.prepare(`
        SELECT * FROM announcements
        WHERE is_active = 1
        ORDER BY created_at DESC
      `).all();

      let selected = null as any;

      if (activeRows && activeRows.length > 0) {
        if (page) {
          const pageMatches = activeRows.filter(row => (row.isGlobal === false) && row.page === page);
          if (pageMatches.length > 0) {
            selected = pageMatches.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            })[0];
          }
        }

        if (!selected) {
          const global = activeRows.filter(row => row.isGlobal !== false);
          if (global.length > 0) {
            selected = global.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            })[0];
          }
        }
      }

      if (!selected) {
        return res.status(200).json({});
      }

      // Normalize keys to camelCase for client
      const normalized = {
        id: selected.id,
        message: selected.message,
        isActive: selected.isActive ?? selected.is_active ?? true,
        isGlobal: selected.isGlobal ?? selected.is_global ?? true,
        page: selected.page ?? null,
        textColor: selected.textColor ?? selected.text_color ?? null,
        backgroundColor: selected.backgroundColor ?? selected.background_color ?? null,
        fontSize: selected.fontSize ?? selected.font_size ?? null,
        fontWeight: selected.fontWeight ?? selected.font_weight ?? null,
        textDecoration: selected.textDecoration ?? selected.text_decoration ?? 'none',
        fontStyle: selected.fontStyle ?? selected.font_style ?? 'normal',
        animationSpeed: selected.animationSpeed ?? selected.animation_speed ?? null,
        textBorderWidth: selected.textBorderWidth ?? selected.text_border_width ?? '0px',
        textBorderStyle: selected.textBorderStyle ?? selected.text_border_style ?? 'solid',
        textBorderColor: selected.textBorderColor ?? selected.text_border_color ?? '#000000',
        bannerBorderWidth: selected.bannerBorderWidth ?? selected.banner_border_width ?? '0px',
        bannerBorderStyle: selected.bannerBorderStyle ?? selected.banner_border_style ?? 'solid',
        bannerBorderColor: selected.bannerBorderColor ?? selected.banner_border_color ?? '#000000',
        createdAt: selected.createdAt ?? selected.created_at ?? null,
      };
      res.json(normalized);
    } catch (error) {
      console.error('Error fetching active announcement:', error);
      res.status(500).json({ error: 'Failed to fetch announcement' });
    }
  });

  app.get('/api/admin/announcements', async (req, res) => {
    try {
      ensureAnnouncementsTable();
      const { password } = req.query as any;
      
      if (!await verifyAdminPassword(String(password))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const rows: any[] = sqliteDb.prepare(`
        SELECT * FROM announcements ORDER BY created_at DESC
      `).all();
      const normalized = rows.map(r => ({
        id: r.id,
        message: r.message,
        isActive: r.isActive ?? r.is_active ?? false,
        isGlobal: r.isGlobal ?? r.is_global ?? true,
        page: r.page ?? null,
        textColor: r.textColor ?? r.text_color ?? null,
        backgroundColor: r.backgroundColor ?? r.background_color ?? null,
        fontSize: r.fontSize ?? r.font_size ?? null,
        fontWeight: r.fontWeight ?? r.font_weight ?? null,
        textDecoration: r.textDecoration ?? r.text_decoration ?? 'none',
        fontStyle: r.fontStyle ?? r.font_style ?? 'normal',
        animationSpeed: r.animationSpeed ?? r.animation_speed ?? null,
        textBorderWidth: r.textBorderWidth ?? r.text_border_width ?? '0px',
        textBorderStyle: r.textBorderStyle ?? r.text_border_style ?? 'solid',
        textBorderColor: r.textBorderColor ?? r.text_border_color ?? '#000000',
        bannerBorderWidth: r.bannerBorderWidth ?? r.banner_border_width ?? '0px',
        bannerBorderStyle: r.bannerBorderStyle ?? r.banner_border_style ?? 'solid',
        bannerBorderColor: r.bannerBorderColor ?? r.banner_border_color ?? '#000000',
        createdAt: r.createdAt ?? r.created_at ?? null,
      }));
      res.json(normalized);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ error: 'Failed to fetch announcements' });
    }
  });

  app.post('/api/admin/announcements', async (req, res) => {
    try {
      const { password, ...announcementData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Transaction-style: deactivate all existing, then create new
      console.log('=== STARTING ANNOUNCEMENT UPDATE ===');
      
      // Step 1: Deactivate ALL existing announcements
      const deactivateResult = await db.update(announcements).set({ isActive: false });
      console.log('Deactivated announcements');
      
      // Step 2: Create new announcement
      console.log('Creating new announcement:', announcementData);
      ensureAnnouncementsTable();
      const insert = sqliteDb.prepare(`
        INSERT INTO announcements (
          message, text_color, background_color, font_size, font_weight,
          text_decoration, font_style, animation_speed,
          text_border_width, text_border_style, text_border_color,
          banner_border_width, banner_border_style, banner_border_color,
          is_active, is_global, page, created_at
        ) VALUES (@message, @text_color, @background_color, @font_size, @font_weight,
          @text_decoration, @font_style, @animation_speed,
          @text_border_width, @text_border_style, @text_border_color,
          @banner_border_width, @banner_border_style, @banner_border_color,
          1, COALESCE(@is_global, 1), @page, strftime('%s','now'))
      `);
      const params = {
        message: announcementData.message,
        text_color: announcementData.textColor,
        background_color: announcementData.backgroundColor,
        font_size: announcementData.fontSize,
        font_weight: announcementData.fontWeight,
        text_decoration: announcementData.textDecoration || 'none',
        font_style: announcementData.fontStyle || 'normal',
        animation_speed: announcementData.animationSpeed,
        text_border_width: announcementData.textBorderWidth || '0px',
        text_border_style: announcementData.textBorderStyle || 'solid',
        text_border_color: announcementData.textBorderColor || '#000000',
        banner_border_width: announcementData.bannerBorderWidth || '0px',
        banner_border_style: announcementData.bannerBorderStyle || 'solid',
        banner_border_color: announcementData.bannerBorderColor || '#000000',
        is_global: announcementData.isGlobal ? 1 : 0,
        page: announcementData.page || null,
      };
      const info = insert.run(params);
      const newAnnouncement = sqliteDb.prepare('SELECT * FROM announcements WHERE id = ?').get(info.lastInsertRowid);
      
      console.log('New announcement created with ID:', newAnnouncement.id);
      console.log('=== ANNOUNCEMENT UPDATE COMPLETE ===');
      res.json(newAnnouncement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  });

  app.put('/api/admin/announcements/:id', async (req, res) => {
    try {
      const { password, ...announcementData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const updatedAnnouncement = await storage.updateAnnouncement(id, announcementData);
      
      if (updatedAnnouncement) {
        res.json(updatedAnnouncement);
      } else {
        res.status(404).json({ message: 'Announcement not found' });
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      res.status(500).json({ error: 'Failed to update announcement' });
    }
  });

  app.delete('/api/admin/announcements/:id', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAnnouncement(id);
      
      if (deleted) {
        res.json({ message: 'Announcement deleted successfully' });
      } else {
        res.status(404).json({ message: 'Announcement not found' });
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(500).json({ error: 'Failed to delete announcement' });
    }
  });

  // Cleanup expired products endpoint
  app.post('/api/admin/cleanup', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const removedCount = await storage.cleanupExpiredProducts();
      res.json({ 
        message: `Cleanup completed. Removed ${removedCount} expired products.`,
        removedCount 
      });
    } catch (error) {
      console.error('Error during manual cleanup:', error);
      res.status(500).json({ error: 'Failed to cleanup expired products' });
    }
  });

  // Navigation tabs public endpoints for dynamic pages in forms/UI
  app.get('/api/nav-tabs', async (_req, res) => {
    const fallbackTabs = [
      { id: 1, name: 'Prime Picks', slug: 'prime-picks', icon: 'fas fa-crown', color_from: '#8B5CF6', color_to: '#7C3AED', color_style: 'gradient', display_order: 1, is_active: true, is_system: true, description: 'Premium curated products' },
      { id: 2, name: 'Cue Picks', slug: 'cue-picks', icon: 'fas fa-bullseye', color_from: '#06B6D4', color_to: '#0891B2', color_style: 'gradient', display_order: 2, is_active: true, is_system: true, description: 'Smart selections curated with precision' },
      { id: 3, name: 'Value Picks', slug: 'value-picks', icon: 'fas fa-gem', color_from: '#F59E0B', color_to: '#D97706', color_style: 'gradient', display_order: 3, is_active: true, is_system: true, description: 'Best value for money products' },
      { id: 4, name: 'Click Picks', slug: 'click-picks', icon: 'fas fa-mouse-pointer', color_from: '#3B82F6', color_to: '#1D4ED8', color_style: 'gradient', display_order: 4, is_active: true, is_system: true, description: 'Most popular and trending products' },
      { id: 5, name: 'Global Picks', slug: 'global-picks', icon: 'fas fa-globe', color_from: '#10B981', color_to: '#059669', color_style: 'gradient', display_order: 5, is_active: true, is_system: true, description: 'International products and brands' },
      { id: 6, name: 'Travel Picks', slug: 'travel-picks', icon: 'fas fa-plane', color_from: '#34D399', color_to: '#10B981', color_style: 'gradient', display_order: 6, is_active: true, is_system: true, description: 'Travel deals and recommendations' },
      { id: 7, name: 'Deals Hub', slug: 'deals-hub', icon: 'fas fa-fire', color_from: '#EF4444', color_to: '#DC2626', color_style: 'gradient', display_order: 7, is_active: true, is_system: true, description: 'Hot deals and discounts' },
      { id: 8, name: 'Loot Box', slug: 'loot-box', icon: 'fas fa-gift', color_from: '#F59E0B', color_to: '#D97706', color_style: 'gradient', display_order: 8, is_active: true, is_system: true, description: 'Mystery boxes with amazing surprises' },
    ];
    try {
      const rows = sqliteDb.prepare(`
        SELECT id, name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description
        FROM nav_tabs
        ORDER BY display_order ASC, id ASC
      `).all();

      if (Array.isArray(rows) && rows.length > 0) {
        return res.json(rows);
      }
      return res.json(fallbackTabs);
    } catch (error) {
      console.warn('nav_tabs table missing or query failed, serving defaults');
      return res.json(fallbackTabs);
    }
  });

  // Admin: Navigation tabs overview (no auth needed for read-only list)
  app.get('/api/admin/nav-tabs', async (_req, res) => {
    try {
      const rows = sqliteDb.prepare(`
        SELECT id, name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description
        FROM nav_tabs
        ORDER BY display_order ASC, id ASC
      `).all();
      return res.json(rows || []);
    } catch (error) {
      console.error('Error fetching admin nav tabs:', error);
      return res.status(500).json({ message: 'Failed to fetch navigation tabs' });
    }
  });

  // Admin: Create a new navigation tab
  app.post('/api/admin/nav-tabs', async (req, res) => {
    try {
      const passwordHeader = typeof req.headers['x-admin-password'] === 'string' ? String(req.headers['x-admin-password']) : undefined;
      const passwordBody = req.body?.password;
      const password = passwordHeader || passwordBody;
      if (!password || !(await verifyAdminPassword(password))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { name, slug, icon, color_from, color_to, colorStyle, display_order, is_active, is_system, description } = req.body || {};
      if (!name || !slug) {
        return res.status(400).json({ message: 'name and slug are required' });
      }

      const payload = {
        name: String(name),
        slug: String(slug).toLowerCase(),
        icon: icon ? String(icon) : 'fas fa-tag',
        color_from: color_from ? String(color_from) : '#3B82F6',
        color_to: color_to ? String(color_to) : '#1D4ED8',
        color_style: colorStyle ? String(colorStyle) : 'gradient',
        display_order: Number(display_order ?? 999),
        is_active: is_active ? 1 : 1,
        is_system: is_system ? 1 : 0,
        description: description ? String(description) : ''
      } as any;

      try {
        sqliteDb.prepare(`
          INSERT INTO nav_tabs (name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description)
          VALUES (@name, @slug, @icon, @color_from, @color_to, @color_style, @display_order, @is_active, @is_system, @description)
        `).run(payload);
      } catch (err) {
        const msg = String(err?.message || '');
        if (msg.includes('UNIQUE') && msg.includes('slug')) {
          return res.status(409).json({ message: 'Slug already exists' });
        }
        throw err;
      }

      const row = sqliteDb.prepare(`
        SELECT id, name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description
        FROM nav_tabs WHERE slug = ? ORDER BY id DESC
      `).get(payload.slug);
      return res.status(201).json(row);
    } catch (error) {
      console.error('Error creating navigation tab:', error);
      return res.status(500).json({ message: 'Failed to create navigation tab' });
    }
  });

  // Admin: Update a navigation tab
  app.put('/api/admin/nav-tabs/:id', async (req, res) => {
    try {
      const passwordHeader = typeof req.headers['x-admin-password'] === 'string' ? String(req.headers['x-admin-password']) : undefined;
      const passwordBody = req.body?.password;
      const password = passwordHeader || passwordBody;
      if (!password || !(await verifyAdminPassword(password))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = Number(req.params.id);
      const existing = sqliteDb.prepare(`SELECT id, is_system FROM nav_tabs WHERE id = ?`).get(id) as any;
      if (!existing) return res.status(404).json({ message: 'Navigation tab not found' });

      const { name, slug, icon, color_from, color_to, colorStyle, display_order, is_active, is_system, description } = req.body || {};
      const payload = {
        id,
        name: name !== undefined ? String(name) : existing.name,
        slug: slug !== undefined ? String(slug).toLowerCase() : existing.slug,
        icon: icon !== undefined ? String(icon) : existing.icon,
        color_from: color_from !== undefined ? String(color_from) : existing.color_from,
        color_to: color_to !== undefined ? String(color_to) : existing.color_to,
        color_style: colorStyle !== undefined ? String(colorStyle) : existing.color_style,
        display_order: display_order !== undefined ? Number(display_order) : existing.display_order,
        is_active: is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
        is_system: is_system !== undefined ? (is_system ? 1 : 0) : existing.is_system,
        description: description !== undefined ? String(description) : existing.description
      } as any;

      try {
        sqliteDb.prepare(`
          UPDATE nav_tabs
          SET name = @name, slug = @slug, icon = @icon,
              color_from = @color_from, color_to = @color_to, color_style = @color_style,
              display_order = @display_order, is_active = @is_active, is_system = @is_system,
              description = @description, updated_at = CURRENT_TIMESTAMP
          WHERE id = @id
        `).run(payload);
      } catch (err) {
        const msg = String(err?.message || '');
        if (msg.includes('UNIQUE') && msg.includes('slug')) {
          return res.status(409).json({ message: 'Slug already exists' });
        }
        throw err;
      }

      const row = sqliteDb.prepare(`
        SELECT id, name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description
        FROM nav_tabs WHERE id = ?
      `).get(id);
      return res.json(row);
    } catch (error) {
      console.error('Error updating navigation tab:', error);
      return res.status(500).json({ message: 'Failed to update navigation tab' });
    }
  });

  // Admin: Delete a navigation tab
  app.delete('/api/admin/nav-tabs/:id', async (req, res) => {
    try {
      const passwordHeader = typeof req.headers['x-admin-password'] === 'string' ? String(req.headers['x-admin-password']) : undefined;
      const passwordBody = req.body?.password;
      const password = passwordHeader || passwordBody;
      if (!password || !(await verifyAdminPassword(password))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = Number(req.params.id);
      const existing = sqliteDb.prepare(`SELECT id, is_system FROM nav_tabs WHERE id = ?`).get(id) as any;
      if (!existing) return res.status(404).json({ message: 'Navigation tab not found' });
      if (existing.is_system) return res.status(400).json({ message: 'System tabs cannot be deleted' });

      const result = sqliteDb.prepare(`DELETE FROM nav_tabs WHERE id = ?`).run(id);
      if (result.changes > 0) return res.json({ message: 'Navigation tab deleted successfully' });
      return res.status(404).json({ message: 'Navigation tab not found' });
    } catch (error) {
      console.error('Error deleting navigation tab:', error);
      return res.status(500).json({ message: 'Failed to delete navigation tab' });
    }
  });

  // Admin: Reorder navigation tabs
  app.put('/api/admin/nav-tabs/reorder', async (req, res) => {
    try {
      const passwordHeader = typeof req.headers['x-admin-password'] === 'string' ? String(req.headers['x-admin-password']) : undefined;
      const passwordBody = req.body?.password;
      const password = passwordHeader || passwordBody;
      if (!password || !(await verifyAdminPassword(password))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { tabOrders } = req.body || {};
      if (!Array.isArray(tabOrders) || tabOrders.length === 0) {
        return res.status(400).json({ message: 'tabOrders array is required' });
      }

      const update = sqliteDb.prepare(`UPDATE nav_tabs SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
      let order = 1;
      for (const item of tabOrders) {
        const id = Number(item.id);
        const displayOrder = item.display_order !== undefined ? Number(item.display_order) : order;
        update.run(displayOrder, id);
        order++;
      }
      return res.json({ message: 'Navigation tabs reordered successfully' });
    } catch (error) {
      console.error('Error reordering navigation tabs:', error);
      return res.status(500).json({ message: 'Failed to reorder navigation tabs' });
    }
  });

  // Alias endpoint used by some clients
  app.get('/api/navigation/tabs', async (_req, res) => {
    const fallbackTabs = [
      { id: 1, name: 'Prime Picks', slug: 'prime-picks', icon: 'fas fa-crown', color_from: '#8B5CF6', color_to: '#7C3AED', color_style: 'gradient', display_order: 1, is_active: true, is_system: true, description: 'Premium curated products' },
      { id: 2, name: 'Cue Picks', slug: 'cue-picks', icon: 'fas fa-bullseye', color_from: '#06B6D4', color_to: '#0891B2', color_style: 'gradient', display_order: 2, is_active: true, is_system: true, description: 'Smart selections curated with precision' },
      { id: 3, name: 'Value Picks', slug: 'value-picks', icon: 'fas fa-gem', color_from: '#F59E0B', color_to: '#D97706', color_style: 'gradient', display_order: 3, is_active: true, is_system: true, description: 'Best value for money products' },
      { id: 4, name: 'Click Picks', slug: 'click-picks', icon: 'fas fa-mouse-pointer', color_from: '#3B82F6', color_to: '#1D4ED8', color_style: 'gradient', display_order: 4, is_active: true, is_system: true, description: 'Most popular and trending products' },
      { id: 5, name: 'Global Picks', slug: 'global-picks', icon: 'fas fa-globe', color_from: '#10B981', color_to: '#059669', color_style: 'gradient', display_order: 5, is_active: true, is_system: true, description: 'International products and brands' },
      { id: 6, name: 'Travel Picks', slug: 'travel-picks', icon: 'fas fa-plane', color_from: '#34D399', color_to: '#10B981', color_style: 'gradient', display_order: 6, is_active: true, is_system: true, description: 'Travel deals and recommendations' },
      { id: 7, name: 'Deals Hub', slug: 'deals-hub', icon: 'fas fa-fire', color_from: '#EF4444', color_to: '#DC2626', color_style: 'gradient', display_order: 7, is_active: true, is_system: true, description: 'Hot deals and discounts' },
      { id: 8, name: 'Loot Box', slug: 'loot-box', icon: 'fas fa-gift', color_from: '#F59E0B', color_to: '#D97706', color_style: 'gradient', display_order: 8, is_active: true, is_system: true, description: 'Mystery boxes with amazing surprises' },
    ];
    try {
      const rows = sqliteDb.prepare(`
        SELECT id, name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description
        FROM nav_tabs
        ORDER BY display_order ASC, id ASC
      `).all();

      if (Array.isArray(rows) && rows.length > 0) {
        return res.json(rows);
      }
      return res.json(fallbackTabs);
    } catch (error) {
      console.warn('navigation tabs query failed, serving defaults');
      return res.json(fallbackTabs);
    }
  });

  // URL processing endpoints for single and bulk URL ingestion
  app.post('/api/process-url', async (req, res) => {
    try {
      const { url, targetPage, saveToDatabase } = req.body || {};
      if (!url || typeof url !== 'string' || url.trim() === '') {
        return res.status(400).json({ success: false, error: 'URL is required' });
      }

      const result = await urlProcessingService.processURL(url, String(targetPage || ''));

      if (!result.success || !result.productCard) {
        return res.json({ success: false, originalUrl: url, error: result.error || 'Failed to process URL' });
      }

      const pc = result.productCard;
      const hostname = (() => { try { return new URL(pc.urls?.[0] || url).hostname.replace('www.', ''); } catch { return pc.source || 'website'; } })();
      const platform = hostname.includes('amazon') ? 'Amazon'
        : hostname.includes('flipkart') ? 'Flipkart'
        : hostname.includes('nykaa') ? 'Nykaa'
        : hostname.includes('myntra') ? 'Myntra'
        : hostname.includes('boat') ? 'boAt'
        : hostname.includes('mamaearth') ? 'Mamaearth'
        : hostname.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Website';

      // Optionally save to DB
      if (saveToDatabase) {
        try {
          const productToSave = {
            name: pc.name,
            description: pc.description || '',
            price: pc.price || null,
            originalPrice: pc.originalPrice || null,
            currency: pc.currency || 'INR',
            imageUrl: pc.imageUrl || '/api/placeholder/300/300',
            affiliateUrl: pc.urls?.[0] || url,
            category: 'Uncategorized',
            displayPages: Array.isArray(targetPage) ? targetPage : [String(targetPage || '')].filter(Boolean),
          };
          await (storage as any).addProduct(productToSave);
        } catch (err: any) {
          console.error('Error saving processed URL:', err);
          // Continue; saving is optional for the response
        }
      }

      return res.json({
        success: true,
        originalUrl: url,
        productCard: {
          name: pc.name,
          price: pc.price,
          imageUrl: pc.imageUrl || '/api/placeholder/300/300',
          platform,
          affiliateUrl: pc.urls?.[0] || url,
        }
      });
    } catch (error: any) {
      console.error('process-url error:', error);
      return res.status(500).json({ success: false, originalUrl: req.body?.url, error: error?.message || 'Internal Server Error' });
    }
  });

  app.post('/api/process-bulk-urls', async (req, res) => {
    try {
      const { urls, targetPage, saveToDatabase } = req.body || {};
      const list: string[] = Array.isArray(urls) ? urls.filter((u: any) => typeof u === 'string' && u.trim() !== '') : [];
      if (list.length === 0) {
        return res.status(400).json({ results: [], successfullyProcessed: 0, totalUrls: 0, error: 'URLs must be a non-empty array' });
      }

      const results: any[] = [];
      let successCount = 0;

      for (const u of list) {
        try {
          const r = await urlProcessingService.processURL(u, String(targetPage || ''));
          if (!r.success || !r.productCard) {
            results.push({ success: false, originalUrl: u, error: r.error || 'Failed to process URL' });
            continue;
          }

          const pc = r.productCard;
          const hostname = (() => { try { return new URL(pc.urls?.[0] || u).hostname.replace('www.', ''); } catch { return pc.source || 'website'; } })();
          const platform = hostname.includes('amazon') ? 'Amazon'
            : hostname.includes('flipkart') ? 'Flipkart'
            : hostname.includes('nykaa') ? 'Nykaa'
            : hostname.includes('myntra') ? 'Myntra'
            : hostname.includes('boat') ? 'boAt'
            : hostname.includes('mamaearth') ? 'Mamaearth'
            : hostname.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Website';

          // Optional save
          if (saveToDatabase) {
            try {
              const productToSave = {
                name: pc.name,
                description: pc.description || '',
                price: pc.price || null,
                originalPrice: pc.originalPrice || null,
                currency: pc.currency || 'INR',
                imageUrl: pc.imageUrl || '/api/placeholder/300/300',
                affiliateUrl: pc.urls?.[0] || u,
                category: 'Uncategorized',
                displayPages: Array.isArray(targetPage) ? targetPage : [String(targetPage || '')].filter(Boolean),
              };
              await (storage as any).addProduct(productToSave);
            } catch (err: any) {
              console.error('Error saving bulk URL:', err);
              // Continue without failing
            }
          }

          results.push({
            success: true,
            originalUrl: u,
            productCard: {
              name: pc.name,
              price: pc.price,
              imageUrl: pc.imageUrl || '/api/placeholder/300/300',
              platform,
              affiliateUrl: pc.urls?.[0] || u,
            }
          });
          successCount++;
        } catch (e: any) {
          results.push({ success: false, originalUrl: u, error: e?.message || 'Processing error' });
        }
      }

      return res.json({ results, successfullyProcessed: successCount, totalUrls: list.length });
    } catch (error: any) {
      console.error('process-bulk-urls error:', error);
      return res.status(500).json({ results: [], successfullyProcessed: 0, totalUrls: 0, error: error?.message || 'Internal Server Error' });
    }
  });
}

// Alias export to match server/index.ts usage
export const setupAdminRoutes = setupRoutes;

// Helper function for product extraction
async function extractFromUrlPattern(url: string): Promise<any> {
  try {
    let targetUrl = url.startsWith('http') ? url : `https://${url}`;

    // Follow redirects manually to resolve shorteners/affiliate wrappers
    const visited: string[] = [];
    let current = targetUrl;
    let body = '';
    const maxRedirects = 5;

    for (let i = 0; i <= maxRedirects; i++) {
      const res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9',
          'Cache-Control': 'no-cache'
        }
      } as any);

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) break;
        const nextUrl = location.startsWith('http') ? location : new URL(location, current).toString();
        visited.push(nextUrl);
        current = nextUrl;
        continue;
      }

      body = await res.text();
      break;
    }

    const finalUrl = current;
    let hostname = 'unknown';
    try { hostname = new URL(finalUrl).hostname.replace('www.', ''); } catch {}

    // Helpers
    const get = (regex: RegExp) => {
      const m = body.match(regex);
      return m ? m[1].trim() : null;
    };

    // Basic meta
    let title = get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || get(/<title>([^<]+)<\/title>/i);
    let description = get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) || get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    let image = get(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || get(/<meta[^>]+property=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);

    // Amazon-specific fallbacks
    if (!title && /amazon\./i.test(hostname)) {
      title = get(/<span[^>]+id=["']productTitle["'][^>]*>([^<]+)<\/span>/i) || get(/"name"\s*:\s*"([^"]+)"/i);
    }
    if (!image && /amazon\./i.test(hostname)) {
      image = get(/"image"\s*:\s*"(https?:[^"']+)"/i)
        || get(/<img[^>]+id=["']landingImage["'][^>]+src=["']([^"']+)["']/i)
        || get(/<img[^>]+id=["']landingImage["'][^>]+data-old-hires=["']([^"']+)["']/i);

      if (!image) {
        const dyn = get(/data-a-dynamic-image=["']({[^"']+})["']/i);
        if (dyn) {
          try {
            const map = JSON.parse(dyn.replace(/&quot;/g, '"'));
            const keys = Object.keys(map || {});
            image = keys.find(k => k.startsWith('http')) || null;
          } catch {}
        }
      }
    }

    // Price handling
    let price: string | null = null;
    let originalPrice: string | null = null;

    if (/amazon\./i.test(hostname)) {
      const priceCore = body.match(/id=["']corePrice_desktop["'][\s\S]*?class=["']a-offscreen["'][^>]*>\s*₹[\s\u00A0]*([\d,]+(?:\.\d+)?)/i);
      const priceOffscreen = body.match(/class=["']a-price[^"']*["'][\s\S]*?class=["']a-offscreen["'][^>]*>\s*₹[\s\u00A0]*([\d,]+(?:\.\d+)?)/i);
      price = (priceCore?.[1] || priceOffscreen?.[1]) || null;

      const origTextPrice = body.match(/class=["']a-price\s+a-text-price[^"']*["'][\s\S]*?class=["']a-offscreen["'][^>]*>\s*₹[\s\u00A0]*([\d,]+(?:\.\d+)?)/i);
      const origStrike = body.match(/class=["']a-text-strike["'][^>]*>\s*₹?[\s\u00A0]*([\d,]+(?:\.\d+)?)/i);
      originalPrice = (origTextPrice?.[1] || origStrike?.[1]) || null;

      // Avoid coupon/savings amounts
      try {
        const pNum = price ? parseFloat(String(price).replace(/,/g, '')) : null;
        if (pNum !== null && isFinite(pNum) && pNum < 1000) {
          price = null;
        }
      } catch {}
    } else {
      // Generic fallback: pick largest ₹ value
      const genericMatches = [...body.matchAll(/₹[\s\u00A0]*([\d,]+(?:\.\d+)?)/gi)].map(m => m[1]);
      if (genericMatches.length > 0) {
        const nums = genericMatches.map(v => parseFloat(v.replace(/,/g, ''))).filter(n => !isNaN(n));
        if (nums.length > 0) {
          const max = Math.max(...nums);
          const chosen = genericMatches[nums.indexOf(max)];
          price = chosen || null;
        }
      }
    }

    // Derive title from path if missing
    let derivedTitle = title;
    if (!derivedTitle) {
      try {
        const pathname = new URL(finalUrl).pathname;
        const parts = pathname.split('/').filter(Boolean);
        let candidate = parts.find((p) => /-/.test(p) && !/^dp$/i.test(p)) || parts[parts.length - 1] || '';
        candidate = candidate.replace(/([A-Z0-9]{8,})/g, '').replace(/[-_]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
        if (candidate.length > 5) derivedTitle = candidate;
      } catch {}
    }

    // Compute discount
    const discount = (price && originalPrice) ? (() => {
      try {
        const p = parseFloat(String(price).replace(/,/g, ''));
        const o = parseFloat(String(originalPrice).replace(/,/g, ''));
        if (isFinite(p) && isFinite(o) && o > p) {
          return Math.round(((o - p) / o) * 100);
        }
      } catch {}
      return null;
    })() : null;

    return {
      name: derivedTitle || `Product from ${hostname}`,
      description: description || '',
      price: price || null,
      originalPrice: originalPrice || null,
      discount,
      currency: 'INR',
      imageUrl: image || null,
      affiliateUrl: finalUrl,
      rating: '4.5',
      reviewCount: '100',
      category: undefined
    };
  } catch (error) {
    console.error('extractFromUrlPattern error:', error);
    return null;
  }
}
