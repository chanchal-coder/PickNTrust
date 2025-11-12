import express from 'express';
import { storage } from './storage.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { sqliteDb } from './db.js';
import travelCategoriesRouter from './travel-categories-routes.js';
import currencyRouter from './routes/currency.js';
import multer from 'multer';
// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// Admin password verification
async function verifyAdminPassword(password) {
    try {
        // For localhost development, allow simple password
        if (password === 'pickntrust2025' || password === 'admin' || password === 'delete') {
            return true;
        }
        // Try to check admin_users table if it exists
        try {
            const adminUser = sqliteDb.prepare('SELECT password_hash FROM admin_users WHERE username = ?').get('admin');
            if (adminUser) {
                return await bcrypt.compare(password, adminUser.password_hash);
            }
        }
        catch (error) {
            // admin_users table doesn't exist, fall back to simple password check
            console.log('admin_users table not found, using simple password check');
        }
        return false;
    }
    catch (error) {
        console.error('Password verification error:', error);
        return false;
    }
}
// Enhanced error handling middleware
function handleDatabaseError(error, res, operation) {
    console.error(`Database error in ${operation}:`, error);
    // Check for specific database errors
    if (error.code === 'SQLITE_BUSY') {
        return res.status(503).json({
            message: "Database is temporarily busy, please try again",
            error: "SERVICE_TEMPORARILY_UNAVAILABLE",
            retryAfter: 1000
        });
    }
    if (error.code === 'SQLITE_CORRUPT') {
        return res.status(500).json({
            message: "Database integrity issue detected",
            error: "DATABASE_CORRUPTION"
        });
    }
    // Generic database error
    return res.status(500).json({
        message: `Failed to ${operation}`,
        error: "DATABASE_ERROR",
        details: {
            code: error?.code || null,
            message: error?.message || String(error)
        }
    });
}
// Retry wrapper for database operations
async function retryDatabaseOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return operation();
        }
        catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            // Only retry on specific errors
            if (error.code === 'SQLITE_BUSY' || error.code === 'SQLITE_LOCKED') {
                console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            }
            else {
                throw error; // Don't retry on other errors
            }
        }
    }
    throw new Error('Max retries exceeded');
}
export function setupRoutes(app) {
    // Lightweight CSV parser (handles quoted fields and commas)
    function parseCSV(text) {
        const input = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = input.split('\n').filter(l => l.trim().length > 0);
        if (lines.length === 0) return { headers: [], rows: [] };
        const parseLine = (line) => {
            const result = []; let current = ''; let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') {
                    if (inQuotes && i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
                    else { inQuotes = !inQuotes; }
                } else if (ch === ',' && !inQuotes) {
                    result.push(current); current = '';
                } else {
                    current += ch;
                }
            }
            result.push(current);
            return result.map(v => v.trim());
        };
        const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
        const rows = [];
        for (let li = 1; li < lines.length; li++) {
            const values = parseLine(lines[li]).map(v => v.replace(/^"|"$/g, ''));
            const row = {};
            headers.forEach((h, idx) => { row[h] = typeof values[idx] !== 'undefined' ? values[idx] : ''; });
            rows.push(row);
        }
        return { headers, rows };
    }

    // CSV upload handler: in-memory, CSV-only, safe defaults
    const csvUpload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 50 * 1024 * 1024, files: 1 },
        fileFilter: (_req, file, cb) => {
            const type = file.mimetype;
            const name = (file.originalname || '').toLowerCase();
            const isCsvExt = name.endsWith('.csv');
            const allowed = type === 'text/csv' || type === 'application/vnd.ms-excel' || type === 'text/plain' || (type === 'application/octet-stream' && isCsvExt);
            if (allowed) cb(null, true); else cb(new Error('Only CSV files are allowed'));
        }
    });

    // Admin: Bulk product upload via CSV (map to camelCase and normalize pages)
    app.post('/api/admin/products/bulk-upload', csvUpload.single('file'), async (req, res) => {
        try {
            const bodyPwd = typeof req.body?.password === 'string' ? req.body.password : undefined;
            const headerPwd = (req.headers['x-admin-password'] || req.headers['X-Admin-Password'] || undefined);
            const queryPwd = typeof req.query?.password === 'string' ? req.query.password : undefined;
            const password = (bodyPwd || headerPwd || queryPwd || '').toString();
            const isValid = await verifyAdminPassword(password);
            if (!isValid) {
                return res.status(401).json({ message: 'Unauthorized: Invalid admin password' });
            }

            if (!req.file || !req.file.buffer) {
                return res.status(400).json({ message: 'No CSV file uploaded. Please upload with form field "file".' });
            }

            const csvText = req.file.buffer.toString('utf8');
            const { headers, rows } = parseCSV(csvText);
            if (headers.length === 0 || rows.length === 0) {
                return res.status(400).json({ message: 'Empty or invalid CSV content' });
            }

            const normalizeKey = (k) => String(k || '').trim().toLowerCase().replace(/\s+/g, '_');
            const keyMap = {};
            headers.forEach(h => {
                const norm = normalizeKey(h);
                switch (norm) {
                    case 'name':
                    case 'title': keyMap['name'] = h; break;
                    case 'description': keyMap['description'] = h; break;
                    case 'price': keyMap['price'] = h; break;
                    case 'original_price':
                    case 'mrp': keyMap['original_price'] = h; break;
                    case 'currency': keyMap['currency'] = h; break;
                    case 'discount': keyMap['discount'] = h; break;
                    case 'category': keyMap['category'] = h; break;
                    case 'subcategory':
                    case 'sub_category': keyMap['subcategory'] = h; break;
                    case 'image_url':
                    case 'image': keyMap['image_url'] = h; break;
                    case 'affiliate_url':
                    case 'url':
                    case 'link': keyMap['affiliate_url'] = h; break;
                    case 'brand': keyMap['brand'] = h; break;
                    case 'gender': keyMap['gender'] = h; break;
                    case 'is_featured':
                    case 'featured': keyMap['is_featured'] = h; break;
                    case 'is_service':
                    case 'service': keyMap['is_service'] = h; break;
                    case 'is_ai_app':
                    case 'is_aiapp':
                    case 'ai_app': keyMap['is_ai_app'] = h; break;
                    case 'pricing_type': keyMap['pricing_type'] = h; break;
                    case 'monthly_price': keyMap['monthly_price'] = h; break;
                    case 'yearly_price': keyMap['yearly_price'] = h; break;
                    case 'is_free': keyMap['is_free'] = h; break;
                    case 'price_description': keyMap['price_description'] = h; break;
                    case 'display_pages':
                    case 'pages': keyMap['display_pages'] = h; break;
                    case 'cookie_duration': keyMap['cookie_duration'] = h; break;
                    default: break;
                }
            });

            const toBool = (v) => {
                const s = String(v || '').trim().toLowerCase();
                return s === 'true' || s === '1' || s === 'yes' || s === 'y';
            };
            const normalizeSlug = (val) => {
                const s = String(val || '').trim().toLowerCase().replace(/\s+/g, '-');
                switch (s) {
                    case 'global':
                    case 'globalpicks':
                    case 'global-pick':
                    case 'globals': return 'global-picks';
                    case 'prime':
                    case 'primepicks':
                    case 'prime-pick': return 'prime-picks';
                    case 'clickpicks':
                    case 'click-pick': return 'click-picks';
                    case 'cuepicks':
                    case 'cue-pick': return 'cue-picks';
                    case 'valuepicks':
                    case 'value-pick': return 'value-picks';
                    case 'apps-aiapps':
                    case 'apps-aiapp':
                    case 'ai-apps':
                    case 'ai-app': return 'apps-ai-apps';
                    default: return s;
                }
            };

            let processed = 0; let inserted = 0; const errors = [];
            for (let i = 0; i < rows.length; i++) {
                const r = rows[i]; processed++;
                const val = (k) => {
                    const orig = keyMap[k];
                    return typeof r[orig] !== 'undefined' ? r[orig] : '';
                };

                // Required fields (validate early)
                const name = String(val('name') || '').trim();
                const imageUrl = String(val('image_url') || '').trim();
                const affiliateUrl = String(val('affiliate_url') || '').trim();
                const category = String(val('category') || '').trim();
                if (!name || !imageUrl || !affiliateUrl || !category) {
                    errors.push({ index: i + 1, error: 'Missing required fields: name/title, image_url, affiliate_url, category' });
                    continue;
                }

                try {
                    // Numbers: keep flexible parsing
                    const toNumber = (numVal) => {
                        if (numVal === null || numVal === undefined || numVal === '') return undefined;
                        const n = typeof numVal === 'string' ? parseFloat(numVal.replace(/[^0-9.\-]/g, '')) : Number(numVal);
                        return Number.isFinite(n) ? n : undefined;
                    };

                    // Normalize display pages into array of canonical slugs
                    const rawPages = String(val('display_pages') || '').trim();
                    const displayPages = rawPages
                        ? Array.from(new Set(rawPages.split(',').map(s => normalizeSlug(s)).filter(Boolean)))
                        : undefined;

                    const mapped = {
                        name,
                        description: String(val('description') || '').trim(),
                        price: toNumber(val('price')),
                        originalPrice: toNumber(val('original_price')),
                        currency: String(val('currency') || '').trim() || 'INR',
                        discount: toNumber(val('discount')),
                        category,
                        subcategory: String(val('subcategory') || '').trim(),
                        imageUrl,
                        affiliateUrl,
                        brand: String(val('brand') || '').trim(),
                        gender: String(val('gender') || '').trim(),
                        isFeatured: toBool(val('is_featured')),
                        isService: toBool(val('is_service')),
                        isAIApp: toBool(val('is_ai_app')),
                        pricingType: String(val('pricing_type') || '').trim(),
                        monthlyPrice: String(val('monthly_price') || '').trim(),
                        yearlyPrice: String(val('yearly_price') || '').trim(),
                        isFree: toBool(val('is_free')),
                        priceDescription: String(val('price_description') || '').trim(),
                        displayPages,
                        cookieDuration: String(val('cookie_duration') || '').trim(),
                    };

                    await storage.addProduct(mapped);
                    inserted++;
                } catch (e) {
                    errors.push({ index: i + 1, error: e?.message || String(e) });
                }
            }

            return res.json({
                message: 'Bulk upload completed',
                totalRows: rows.length,
                processed,
                inserted,
                failed: errors.length,
                errors,
                recognizedHeaders: headers,
                expectedHeadersSample: [
                    'name', 'description', 'price', 'original_price', 'currency', 'discount', 'category', 'subcategory', 'image_url', 'affiliate_url', 'brand', 'gender', 'is_featured', 'is_service', 'is_ai_app',
                    'pricing_type', 'monthly_price', 'yearly_price', 'is_free', 'price_description', 'display_pages', 'cookie_duration'
                ]
            });
        } catch (error) {
            console.error('Bulk upload error:', error);
            return handleDatabaseError(error, res, 'process bulk product CSV');
        }
    });
    // Helper to normalize product image URLs and route through proxy
    function toProxiedImage(url) {
        const u = typeof url === 'string' ? url.trim() : '';
        if (!u) {
            return '/api/placeholder/300/300';
        }
        if (u.startsWith('http://') || u.startsWith('https://')) {
            const params = new URLSearchParams({
                url: u,
                width: '400',
                height: '400',
                quality: '80',
                format: 'webp',
            });
            return `/api/image-proxy?${params.toString()}`;
        }
        // For local or relative paths, return as-is
        return u;
    }
    // API endpoint for services (used by CardsAppsServices component)
    app.get("/api/services", async (req, res) => {
        try {
            console.log('Getting services for homepage services section');
            const { limit = 50, offset = 0 } = req.query;
            const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
            const parsedOffset = Math.max(parseInt(offset) || 0, 0);

            // Mirror page-based selection used by /api/products/page/services for consistency
            const query = `
        SELECT * FROM unified_content 
        WHERE (status = 'completed' OR status = 'active' OR status = 'processed' OR status IS NULL)
        AND (visibility = 'public' OR visibility IS NULL)
        AND (
          display_pages LIKE '%' || ? || '%' OR
          display_pages = ?
        )
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
            const services = sqliteDb.prepare(query).all('services', 'services', parsedLimit, parsedOffset);

            const mappedServices = services.map((service) => ({
                ...service,
                name: service.title,
                imageUrl: toProxiedImage(service.imageUrl || service.image_url),
                isService: true
            }));

            console.log(`Services: Returning ${mappedServices.length} service products with mapped fields`);
            res.json(mappedServices);
        }
        catch (error) {
            console.error('Error fetching services:', error);
            res.json([]);
        }
    });
    // API endpoint for apps (used by AppsAIApps component)
    app.get("/api/products/apps", async (req, res) => {
        try {
            console.log('Getting apps with union of display_pages and is_ai_app');
            const { limit = 50, offset = 0, category } = req.query;
            const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
            const parsedOffset = Math.max(parseInt(offset) || 0, 0);

            // Union logic: items tagged for apps page OR flagged as AI/app
            let query = `
        SELECT * FROM unified_content
        WHERE (
          (
            display_pages LIKE '%apps%'
            OR display_pages LIKE '%apps-ai-apps%'
            OR REPLACE(LOWER(display_pages), ' ', '-') LIKE '%apps%'
            OR REPLACE(LOWER(display_pages), ' ', '-') LIKE '%apps-ai-apps%'
            OR LOWER(page_type) IN ('apps','apps-ai-apps')
          )
          OR (
            is_ai_app = 1
            OR isAIApp = 1
            OR CAST(is_ai_app AS TEXT) IN ('1','true','TRUE','yes','YES','y','Y','on','ON')
            OR LOWER(content_type) IN ('app','ai-app')
            OR LOWER(category) LIKE '%app%'
          )
        )`;

            const params = [];

            // Optional category filter with parent→child inclusion
            if (category && category !== 'all') {
                const categoryLower = String(category || '').toLowerCase();
                let tokens = categoryLower
                    .replace(/[^a-z0-9 &-]/g, ' ')
                    .split(/[\s&/-]+/)
                    .map(t => t.trim())
                    .filter(Boolean);

                const SYNONYM_TOKENS = {
                    smartphones: ['smartphone', 'mobile', 'mobiles', 'mobile phone', 'mobile phones', 'cell phone', 'cell phones', 'phone', 'phones'],
                    smartphone: ['smartphones', 'mobile', 'mobiles', 'mobile phone', 'mobile phones', 'cell phone', 'cell phones', 'phone', 'phones'],
                    laptops: ['laptop', 'notebook', 'notebooks'],
                    laptop: ['laptops', 'notebook', 'notebooks'],
                    earphones: ['earbud', 'earbuds', 'headphone', 'headphones', 'headset'],
                    headphones: ['earphone', 'earphones', 'earbud', 'earbuds', 'headset'],
                    television: ['tv', 'smart tv', 'led tv', 'oled tv'],
                    tv: ['television', 'smart tv', 'led tv', 'oled tv'],
                    camera: ['cameras', 'dslr', 'mirrorless'],
                    cameras: ['camera', 'dslr', 'mirrorless'],
                    electronics: ['electronic', 'gadgets', 'tech']
                };
                const extraSynonyms = new Set();
                for (const t of tokens) {
                    const syns = SYNONYM_TOKENS[t];
                    if (Array.isArray(syns)) {
                        for (const s of syns) extraSynonyms.add(s);
                    }
                }
                if (extraSynonyms.size > 0) {
                    tokens = Array.from(new Set([...tokens, ...extraSynonyms]));
                }

                let childNames = [];
                try {
                    let parentRow = sqliteDb.prepare(
                        `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`
                    ).get(category);
                    if (!(parentRow && parentRow.id)) {
                        const SYNONYMS_TO_CANONICAL = {
                            electronics: 'Electronics & Gadgets',
                            tech: 'Electronics & Gadgets',
                            technology: 'Electronics & Gadgets',
                            'home & kitchen': 'Home & Living',
                            'home and kitchen': 'Home & Living',
                            'beauty & personal care': 'Beauty',
                            'personal care': 'Beauty',
                            'apps and ai apps': 'Apps & AI Apps',
                            'ai apps': 'Apps & AI Apps',
                            services: 'Services'
                        };
                        const canonical = SYNONYMS_TO_CANONICAL[categoryLower];
                        if (canonical) {
                            parentRow = sqliteDb.prepare(
                                `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`
                            ).get(canonical);
                        }
                    }
                    if (parentRow && parentRow.id) {
                        const childRows = sqliteDb.prepare(
                            `SELECT name FROM categories WHERE parent_id = ? AND is_active = 1 ORDER BY display_order ASC, name ASC`
                        ).all(parentRow.id);
                        childNames = (childRows || []).map(r => r.name).filter(Boolean);
                    }
                } catch (e) {
                    console.log('Parent-child detection failed (apps filter):', e);
                }

                const hasChildren = childNames.length > 0;
                const childPlaceholders = hasChildren ? childNames.map(() => '?').join(',') : '';
                const likeBlocksCat = tokens.map(() => `LOWER(category) LIKE '%' || ? || '%'`).join(' OR ');
                const likeBlocksSub = tokens.map(() => `LOWER(subcategory) LIKE '%' || ? || '%'`).join(' OR ');
                const likeBlocksTags = tokens.map(() => `LOWER(tags) LIKE '%' || ? || '%'`).join(' OR ');

                query += ` AND ( LOWER(category) = LOWER(?) ${hasChildren ? ` OR category IN (${childPlaceholders}) OR subcategory IN (${childPlaceholders})` : ''} OR ${likeBlocksCat} OR ${likeBlocksSub} OR ${likeBlocksTags} )`;

                params.push(category);
                if (hasChildren) {
                    params.push(...childNames);
                    params.push(...childNames);
                }
                for (const tok of tokens) params.push(tok);
                for (const tok of tokens) params.push(tok);
                for (const tok of tokens) params.push(tok);
            }

            query += ` ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`;
            params.push(parsedLimit, parsedOffset);

            const apps = sqliteDb.prepare(query).all(...params);

            const mappedApps = apps.map((app) => ({
                ...app,
                name: app.title,
                imageUrl: toProxiedImage(app.imageUrl || app.image_url),
                isAIApp: true
            }));

            console.log(`Apps: Returning ${mappedApps.length} app products (union + category filters)`);
            res.json(mappedApps);
        }
        catch (error) {
            console.error('Error fetching apps:', error);
            res.json([]);
        }
    });
    // Get products for a specific page using display_pages field and checkbox filters
    app.get("/api/products/page/:page", async (req, res) => {
        try {
            const { page } = req.params;
            const { category, limit = 50, offset = 0 } = req.query;
            // Validate parameters
            if (!page || page.trim() === '') {
                return res.status(400).json({
                    message: "Page parameter is required",
                    error: "INVALID_PARAMETERS"
                });
            }
            const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
            const parsedOffset = Math.max(parseInt(offset) || 0, 0);
            console.log(`Getting products for page: "${page}"`);
            let query = '';
            const params = [];
            // Special handling: Top Picks should come from unified_content only
            if (page === 'top-picks') {
                // Use unified_content with robust status/visibility and page-tag filter
                query = `
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
        AND (
          display_pages LIKE '%' || ? || '%' OR
          display_pages = ?
        )
      `;
                params.push('top-picks', 'top-picks');
            }
            else {
                // Default: query unified_content for other pages with broader gating
                query = `
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
            }
            // Apply page-specific filtering
            if (page === 'top-picks') {
                // Already handled by unified_content selection above using display_pages
            }
            else if (page === 'services') {
                // Services: rely on service flags/type, not display_pages alone
                query += ` AND (
          is_service = 1
          OR LOWER(content_type) = 'service'
          OR LOWER(category) LIKE '%service%'
        )`;
            }
            else if (page === 'apps-ai-apps') {
                // Apps & AI Apps: union of display_pages tags and AI/app flags
                query += ` AND (
          (
            display_pages LIKE '%apps%'
            OR display_pages LIKE '%apps-ai-apps%'
            OR REPLACE(LOWER(display_pages), ' ', '-') LIKE '%apps%'
            OR REPLACE(LOWER(display_pages), ' ', '-') LIKE '%apps-ai-apps%'
            OR LOWER(page_type) IN ('apps','apps-ai-apps')
          )
          OR (
            is_ai_app = 1
            OR isAIApp = 1
            OR CAST(is_ai_app AS TEXT) IN ('1','true','TRUE','yes','YES','y','Y','on','ON')
            OR LOWER(content_type) IN ('app','ai-app')
            OR LOWER(category) LIKE '%app%'
          )
        )`;
            }
            else if (page === 'apps') {
                // Apps: union of display_pages tags and AI/app flags
                query += ` AND (
          (
            display_pages LIKE '%apps%'
            OR display_pages LIKE '%apps-ai-apps%'
            OR REPLACE(LOWER(display_pages), ' ', '-') LIKE '%apps%'
            OR REPLACE(LOWER(display_pages), ' ', '-') LIKE '%apps-ai-apps%'
            OR LOWER(page_type) IN ('apps','apps-ai-apps')
          )
          OR (
            is_ai_app = 1
            OR isAIApp = 1
            OR CAST(is_ai_app AS TEXT) IN ('1','true','TRUE','yes','YES','y','Y','on','ON')
            OR LOWER(content_type) IN ('app','ai-app')
            OR LOWER(category) LIKE '%app%'
          )
        )`;
            }
            else if (page === 'click-picks') {
                // Click Picks: Show products tagged for click-picks page
                query += ` AND (
          display_pages LIKE '%click-picks%' OR
          display_pages = 'click-picks' OR
          page_type = 'click-picks'
        )`;
            }
            else if (page === 'prime-picks') {
                // Prime Picks: include items without explicit display_pages for backward compatibility
                query += ` AND (
          display_pages LIKE '%' || ? || '%' OR
          display_pages = ? OR
          display_pages IS NULL OR
          display_pages = ''
        )`;
                params.push(page, page);
            }
            else {
                // For other pages, use the original display_pages logic
                query += ` AND (
          display_pages LIKE '%' || ? || '%' OR
          display_pages = ?
        )`;
                params.push(page, page);
            }
            if (category && category !== 'all') {
                // Robust parent→child category inclusion and token-based matching
                const categoryLower = String(category || '').toLowerCase();
                let tokens = categoryLower
                    .replace(/[^a-z0-9 &-]/g, ' ')
                    .split(/[\s&/-]+/)
                    .map(t => t.trim())
                    .filter(Boolean);

                const SYNONYM_TOKENS = {
                    smartphones: ['smartphone', 'mobile', 'mobiles', 'mobile phone', 'mobile phones', 'cell phone', 'cell phones', 'phone', 'phones'],
                    smartphone: ['smartphones', 'mobile', 'mobiles', 'mobile phone', 'mobile phones', 'cell phone', 'cell phones', 'phone', 'phones'],
                    laptops: ['laptop', 'notebook', 'notebooks'],
                    laptop: ['laptops', 'notebook', 'notebooks'],
                    earphones: ['earbud', 'earbuds', 'headphone', 'headphones', 'headset'],
                    headphones: ['earphone', 'earphones', 'earbud', 'earbuds', 'headset'],
                    television: ['tv', 'smart tv', 'led tv', 'oled tv'],
                    tv: ['television', 'smart tv', 'led tv', 'oled tv'],
                    camera: ['cameras', 'dslr', 'mirrorless'],
                    cameras: ['camera', 'dslr', 'mirrorless'],
                    electronics: ['electronic', 'gadgets', 'tech']
                };
                const extraSynonyms = new Set();
                for (const t of tokens) {
                    const syns = SYNONYM_TOKENS[t];
                    if (Array.isArray(syns)) {
                        for (const s of syns) extraSynonyms.add(s);
                    }
                }
                if (extraSynonyms.size > 0) {
                    tokens = Array.from(new Set([...tokens, ...extraSynonyms]));
                }

                let childNames = [];
                try {
                    let parentRow = sqliteDb.prepare(
                        `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`
                    ).get(category);
                    if (!(parentRow && parentRow.id)) {
                        const SYNONYMS_TO_CANONICAL = {
                            electronics: 'Electronics & Gadgets',
                            tech: 'Electronics & Gadgets',
                            technology: 'Electronics & Gadgets',
                            'home & kitchen': 'Home & Living',
                            'home and kitchen': 'Home & Living',
                            'beauty & personal care': 'Beauty',
                            'personal care': 'Beauty',
                            'apps and ai apps': 'Apps & AI Apps',
                            'ai apps': 'Apps & AI Apps',
                            services: 'Services'
                        };
                        const canonical = SYNONYMS_TO_CANONICAL[categoryLower];
                        if (canonical) {
                            parentRow = sqliteDb.prepare(
                                `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`
                            ).get(canonical);
                        }
                    }
                    if (parentRow && parentRow.id) {
                        const childRows = sqliteDb.prepare(
                            `SELECT name FROM categories WHERE parent_id = ? AND is_active = 1 ORDER BY display_order ASC, name ASC`
                        ).all(parentRow.id);
                        childNames = (childRows || []).map(r => r.name).filter(Boolean);
                    }
                } catch (e) {
                    console.log('Parent-child detection failed (page filter):', e);
                }

                const hasChildren = childNames.length > 0;
                const childPlaceholders = hasChildren ? childNames.map(() => '?').join(',') : '';
                const likeBlocksCat = tokens.map(() => `LOWER(category) LIKE '%' || ? || '%'`).join(' OR ');
                const likeBlocksSub = tokens.map(() => `LOWER(subcategory) LIKE '%' || ? || '%'`).join(' OR ');
                const likeBlocksTags = tokens.map(() => `LOWER(tags) LIKE '%' || ? || '%'`).join(' OR ');

                query += ` AND ( LOWER(category) = LOWER(?) ${hasChildren ? ` OR category IN (${childPlaceholders}) OR subcategory IN (${childPlaceholders})` : ''} OR ${likeBlocksCat} OR ${likeBlocksSub} OR ${likeBlocksTags} )`;

                params.push(category);
                if (hasChildren) {
                    params.push(...childNames);
                    params.push(...childNames);
                }
                // Push tokens: category, subcategory, tags
                for (const tok of tokens) params.push(tok);
                for (const tok of tokens) params.push(tok);
                for (const tok of tokens) params.push(tok);
            }
            // Order and pagination
            query += ` ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`;
            params.push(parsedLimit, parsedOffset);
            // Debug logging for SQL and params
            try {
                const meta = { page, category, limit: parsedLimit, offset: parsedOffset };
                const q = query.replace(/\s+/g, ' ').trim();
                const p = JSON.stringify(params);
                console.log('[SQL] /api/products/page', meta);
                console.log('[SQL] Query:', q);
                console.log('[SQL] Params:', params);
                try {
                    fs.appendFileSync(path.join(__dirname, 'sql-debug.log'), `\n[${new Date().toISOString()}] /api/products/page meta=${JSON.stringify(meta)}\nQuery: ${q}\nParams: ${p}\n`);
                }
                catch { }
            }
            catch (logErr) {
                // Ignore logging errors
            }
            let rawProducts = await retryDatabaseOperation(() => {
                return sqliteDb.prepare(query).all(...params);
            });

            // Fallback specifically for Top Picks: broaden criteria if primary returns no rows
            if (page === 'top-picks' && (!rawProducts || rawProducts.length === 0)) {
                console.log('Top Picks primary query returned 0 rows. Applying fallback selection.');
                const fallbackQuery = `
          SELECT *
          FROM unified_content
          WHERE (
            is_featured = 1 OR 
            CAST(is_featured AS TEXT) IN ('1','true','TRUE','yes','YES','y','Y') OR
            COALESCE(is_featured, 0) = 1 OR
            display_pages LIKE '%top-picks%' OR
            page_type = 'top-picks'
          )
          AND (
            (SELECT COUNT(*) FROM pragma_table_info('unified_content') WHERE name='processing_status') = 0
            OR (processing_status != 'archived' OR processing_status IS NULL)
          )
          ORDER BY created_at DESC, id DESC
          LIMIT ? OFFSET ?
        `;
                try {
                    rawProducts = await retryDatabaseOperation(() => {
                        return sqliteDb.prepare(fallbackQuery).all(parsedLimit, parsedOffset);
                    });
                }
                catch (fallbackErr) {
                    console.warn('Top Picks fallback query failed:', fallbackErr);
                }
            }
            // Transform the data to match the expected frontend format with error handling
            const products = rawProducts.map((product) => {
                try {
                    let transformedProduct = {
                        id: product.id,
                        name: product.title || product.name || 'Untitled Product',
                        description: product.description || 'No description available',
                        price: product.price,
                        originalPrice: (product.original_price ?? product.originalPrice ?? null),
                        currency: product.currency || 'INR',
                        imageUrl: product.imageUrl,
                        affiliateUrl: product.affiliateUrl,
                        category: product.category,
                        gender: product.gender,
                        rating: product.rating || 0,
                        reviewCount: product.reviewCount || 0,
                        discount: product.discount,
                        isNew: product.isNew === 1,
                        isFeatured: (product.isFeatured === 1) || (product.is_featured === 1),
                        is_featured: (product.isFeatured === 1) || (product.is_featured === 1),
                        createdAt: product.createdAt
                    };
                    // Parse the content field if it exists and is valid JSON (fallback)
                    if (product.content && (!transformedProduct.price || !transformedProduct.originalPrice)) {
                        try {
                            const contentData = JSON.parse(product.content);
                            transformedProduct.price = transformedProduct.price || contentData.price;
                            transformedProduct.originalPrice = transformedProduct.originalPrice || contentData.originalPrice;
                            transformedProduct.currency = transformedProduct.currency || contentData.currency || 'INR';
                            transformedProduct.rating = transformedProduct.rating || contentData.rating || 0;
                            transformedProduct.reviewCount = transformedProduct.reviewCount || contentData.reviewCount || 0;
                            transformedProduct.discount = transformedProduct.discount || contentData.discount;
                            if (!transformedProduct.gender && contentData.gender) {
                                transformedProduct.gender = contentData.gender;
                            }
                        }
                        catch (e) {
                            console.warn(`Failed to parse content for product ${product.id}:`, e);
                        }
                    }
                    // Parse media_urls for image with error handling
                    if (product.media_urls) {
                        try {
                            const mediaUrls = JSON.parse(product.media_urls);
                            if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
                                transformedProduct.imageUrl = mediaUrls[0];
                            }
                        }
                        catch (e) {
                            console.warn(`Failed to parse media_urls for product ${product.id}:`, e);
                        }
                    }
                    // Fallback to imageUrl field if media_urls is not available
                    if (!transformedProduct.imageUrl && product.imageUrl) {
                        transformedProduct.imageUrl = product.imageUrl;
                    }
                    // Additional fallback to image_url field (database field name)
                    if (!transformedProduct.imageUrl && product.image_url) {
                        transformedProduct.imageUrl = product.image_url;
                    }
                    // Final normalization and proxy mapping
                    transformedProduct.imageUrl = toProxiedImage(transformedProduct.imageUrl);
                    // Parse affiliate_urls for affiliate link with error handling
                    if (product.affiliate_urls) {
                        try {
                            const affiliateUrls = JSON.parse(product.affiliate_urls);
                            if (Array.isArray(affiliateUrls) && affiliateUrls.length > 0) {
                                transformedProduct.affiliateUrl = affiliateUrls[0];
                            }
                        }
                        catch (e) {
                            console.warn(`Failed to parse affiliate_urls for product ${product.id}:`, e);
                        }
                    }
                    // Fallbacks for affiliate URL
                    if (!transformedProduct.affiliateUrl && product.affiliateUrl) {
                        transformedProduct.affiliateUrl = product.affiliateUrl;
                    }
                    if (!transformedProduct.affiliateUrl && product.affiliate_url) {
                        transformedProduct.affiliateUrl = product.affiliate_url;
                    }
                    return transformedProduct;
                }
                catch (productError) {
                    console.error(`Error transforming product ${product.id}:`, productError);
                    // Return a safe fallback product
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
                        createdAt: product.createdAt || new Date().toISOString()
                    };
                }
            });
            console.log(`Found ${products.length} products for page "${page}"`);
            res.json(products);
        }
        catch (error) {
            try {
                console.error("Error in products page endpoint:", error);
                // Attempt to log additional context
                console.error('Endpoint context:', {
                    page: req.params?.page,
                    category: req.query?.category,
                    limit: req.query?.limit,
                    offset: req.query?.offset
                });
            }
            catch (ctxErr) {
                // ignore
            }
            handleDatabaseError(error, res, "fetch products");
        }
    });
    // Local placeholder image endpoint to avoid external calls
    app.get('/api/placeholder/:width/:height', (req, res) => {
        try {
            const width = Math.max(parseInt(req.params.width || '300', 10) || 300, 1);
            const height = Math.max(parseInt(req.params.height || '300', 10) || 300, 1);
            const text = req.query.text || 'No Image';
            const bg = req.query.bg || '#e5e7eb'; // Tailwind gray-200
            const fg = req.query.fg || '#6b7280'; // Tailwind gray-500
            res.setHeader('Content-Type', 'image/svg+xml');
            res.send(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <g fill="${fg}" font-family="Arial, Helvetica, sans-serif" font-size="${Math.max(Math.min(Math.floor(width / 10), 24), 12)}" text-anchor="middle">
    <text x="50%" y="50%" dominant-baseline="middle">${text}</text>
  </g>
</svg>`);
        }
        catch (err) {
            console.error('Error generating placeholder image:', err);
            res.status(500).end();
        }
    });
    // Get categories for a specific page
    app.get("/api/categories/page/:page", async (req, res) => {
        try {
            const { page } = req.params;
            // Validate parameters
            if (!page || page.trim() === '') {
                return res.status(400).json({
                    message: "Page parameter is required",
                    error: "INVALID_PARAMETERS"
                });
            }
            console.log(`Getting categories for page: "${page}"`);
            // Get all products for this page with retry logic
            const products = await retryDatabaseOperation(() => {
                return sqliteDb.prepare(`
          SELECT DISTINCT category FROM unified_content 
          WHERE (
            display_pages LIKE '%' || ? || '%' OR
            display_pages = ? OR
            ( ? = 'prime-picks' AND (display_pages IS NULL OR display_pages = '') )
          )
          AND category IS NOT NULL
          AND category != ''
          AND (status = 'completed' OR status = 'active' OR status = 'processed' OR status IS NULL)
        `).all(page, page, page);
            });
            const categories = products
                .map((p) => p.category)
                .filter(cat => cat && cat.trim() !== '')
                .sort();
            console.log(`Found ${categories.length} categories for page "${page}": ${categories.join(', ')}`);
            res.json(categories);
        }
        catch (error) {
            console.error(`Error fetching categories for page "${req.params.page}":`, error);
            handleDatabaseError(error, res, "fetch categories");
        }
    });
    // Get products by category with robust matching and true parent→child inclusion
    app.get("/api/products/category/:category", async (req, res) => {
        try {
            const { category } = req.params;
            const { limit = 50, offset = 0, gender } = req.query;

            console.log(`Getting products for category: "${category}"`);

            // Normalize category and build token list for partial matching
            const categoryLower = String(category || '').toLowerCase();
            let tokens = categoryLower
                .replace(/[^a-z0-9 &-]/g, ' ')
                .split(/[\s&/-]+/)
                .map(t => t.trim())
                .filter(Boolean);

            // Add common synonyms for popular categories to improve matching
            const SYNONYM_TOKENS = {
                // Smartphones and phones
                'smartphones': ['smartphone', 'mobile', 'mobiles', 'mobile phone', 'mobile phones', 'cell phone', 'cell phones', 'phone', 'phones'],
                'smartphone': ['smartphones', 'mobile', 'mobiles', 'mobile phone', 'mobile phones', 'cell phone', 'cell phones', 'phone', 'phones'],
                // Laptops
                'laptops': ['laptop', 'notebook', 'notebooks'],
                'laptop': ['laptops', 'notebook', 'notebooks'],
                // Earphones / Headphones
                'earphones': ['earbud', 'earbuds', 'headphone', 'headphones', 'headset'],
                'headphones': ['earphone', 'earphones', 'earbud', 'earbuds', 'headset'],
                // TVs
                'television': ['tv', 'smart tv', 'led tv', 'oled tv'],
                'tv': ['television', 'smart tv', 'led tv', 'oled tv'],
                // Cameras
                'camera': ['cameras', 'dslr', 'mirrorless'],
                'cameras': ['camera', 'dslr', 'mirrorless'],
                // Generic electronics synonyms
                'electronics': ['electronic', 'gadgets', 'tech']
            };
            const extraSynonyms = new Set();
            for (const t of tokens) {
                const syns = SYNONYM_TOKENS[t];
                if (Array.isArray(syns)) {
                    for (const s of syns) extraSynonyms.add(s);
                }
            }
            if (extraSynonyms.size > 0) {
                tokens = Array.from(new Set([...tokens, ...extraSynonyms]));
            }

            // Special handling for canonical categories with broad inclusion
            const isAppsCategory = [
                'apps & ai apps', 'apps', 'ai apps', 'ai apps & services'
            ].includes(categoryLower);
            const isServicesCategory = [
                'services', 'service', 'technology services'
            ].includes(categoryLower);

            let query = '';
            const params = [];

            // Detect if requested category is a parent and gather child subcategories
            let childNames = [];
            try {
                let parentRow = sqliteDb.prepare(
                    `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`
                ).get(category);
                if (!(parentRow && parentRow.id)) {
                    const SYNONYMS_TO_CANONICAL = {
                        'electronics': 'Electronics & Gadgets',
                        'tech': 'Electronics & Gadgets',
                        'technology': 'Electronics & Gadgets',
                        'home & kitchen': 'Home & Living',
                        'home and kitchen': 'Home & Living',
                        'beauty & personal care': 'Beauty',
                        'personal care': 'Beauty',
                        'apps and ai apps': 'Apps & AI Apps',
                        'ai apps': 'Apps & AI Apps',
                        'services': 'Services'
                    };
                    const canonical = SYNONYMS_TO_CANONICAL[categoryLower];
                    if (canonical) {
                        parentRow = sqliteDb.prepare(
                            `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`
                        ).get(canonical);
                    }
                }
                if (parentRow && parentRow.id) {
                    const childRows = sqliteDb.prepare(
                        `SELECT name FROM categories WHERE parent_id = ? AND is_active = 1 ORDER BY display_order ASC, name ASC`
                    ).all(parentRow.id);
                    childNames = (childRows || []).map(r => r.name).filter(Boolean);
                }
            } catch (e) {
                console.log('Parent-child detection failed:', e);
            }

            if (isAppsCategory) {
                query = `
          SELECT * FROM unified_content
          WHERE (
            is_ai_app = 1
            OR content_type IN ('app','ai-app')
            OR category LIKE '%app%'
            OR category LIKE '%App%'
            OR category LIKE '%AI%'
          )
            AND (
              status = 'active' OR status = 'published' OR status IS NULL
            )
            AND (
              visibility IN ('public','visible') OR visibility IS NULL
            )
            AND (
              processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL
            )
        `;
            } else if (isServicesCategory) {
                query = `
          SELECT * FROM unified_content
          WHERE (
            is_service = 1
            OR content_type = 'service'
            OR category LIKE '%service%'
            OR category LIKE '%Service%'
          )
            AND (
              status = 'active' OR status = 'published' OR status IS NULL
            )
            AND (
              visibility IN ('public','visible') OR visibility IS NULL
            )
            AND (
              processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL
            )
        `;
            } else {
                // Default: exact match plus parent→child inclusion, then broaden by tokens
                const childPlaceholders = childNames.length > 0 ? childNames.map(() => '?').join(',') : '';
                const hasChildren = childNames.length > 0;
                query = `
          SELECT * FROM unified_content
          WHERE (
            LOWER(category) = LOWER(?)
            ${hasChildren ? ` OR category IN (${childPlaceholders}) OR subcategory IN (${childPlaceholders})` : ''}
            OR ${tokens.map(() => `LOWER(category) LIKE '%' || ? || '%'`).join(' OR ')}
            OR ${tokens.map(() => `LOWER(subcategory) LIKE '%' || ? || '%'`).join(' OR ')}
            OR ${tokens.map(() => `LOWER(tags) LIKE '%' || ? || '%'`).join(' OR ')}
          )
            AND (
              status = 'active' OR status = 'published' OR status IS NULL
            )
            AND (
              visibility IN ('public','visible') OR visibility IS NULL
            )
            AND (
              processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL
            )
        `;
                params.push(category);
                if (hasChildren) {
                    // children for category and for subcategory
                    params.push(...childNames);
                    params.push(...childNames);
                }
                // Push tokens for category, subcategory, and tags (triplets)
                for (const t of tokens) params.push(t);
                for (const t of tokens) params.push(t);
                for (const t of tokens) params.push(t);
            }

            // Optional gender filter
            if (typeof gender === 'string' && gender && String(gender).toLowerCase() !== 'all') {
                query += ` AND LOWER(COALESCE(gender,'')) = LOWER(?)`;
                params.push(String(gender));
            }

            query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(String(limit)), parseInt(String(offset)));

            let products = sqliteDb.prepare(query).all(...params);

            // Fallbacks
            if (!products || products.length === 0) {
                if (isServicesCategory) {
                    console.log('Services category empty. Applying inclusive fallback selection.');
                    let fallbackQuery = `
            SELECT * FROM unified_content
            WHERE (
              is_service = 1
              OR category LIKE '%service%'
              OR category LIKE '%Service%'
              OR content_type = 'service'
            )
              AND (
                status = 'active' OR status = 'published' OR status IS NULL
              )
              AND (
                visibility IN ('public','visible') OR visibility IS NULL
              )
              AND (
                processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL
              )
          `;
                    const fParams = [];
                    fallbackQuery += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
                    fParams.push(parseInt(String(limit)), parseInt(String(offset)));
                    products = sqliteDb.prepare(fallbackQuery).all(...fParams);
                } else if (isAppsCategory) {
                    console.log('Apps category empty. Applying inclusive fallback selection.');
                    let fallbackQuery = `
            SELECT * FROM unified_content
            WHERE (
              is_ai_app = 1
              OR category LIKE '%app%'
              OR category LIKE '%App%'
              OR category LIKE '%AI%'
              OR content_type IN ('app','ai-app')
            )
              AND (
                status = 'active' OR status = 'published' OR status IS NULL
              )
              AND (
                visibility IN ('public','visible') OR visibility IS NULL
              )
              AND (
                processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL
              )
          `;
                    const fParams = [];
                    fallbackQuery += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
                    fParams.push(parseInt(String(limit)), parseInt(String(offset)));
                    products = sqliteDb.prepare(fallbackQuery).all(...fParams);
                } else {
                    // Parent-category fallback: include children if requested category is a parent
                    try {
                        const parentRow = sqliteDb.prepare(
                            `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`
                        ).get(category);

                        let targetParentId = parentRow?.id;
                        if (!targetParentId) {
                            // Try synonyms to canonical mapping (common variants)
                            const SYNONYMS_TO_CANONICAL = {
                                'electronics': 'Electronics & Gadgets',
                                'tech': 'Electronics & Gadgets',
                                'technology': 'Electronics & Gadgets',
                                'home & kitchen': 'Home & Living',
                                'home and kitchen': 'Home & Living',
                                'beauty & personal care': 'Beauty',
                                'personal care': 'Beauty',
                                'apps and ai apps': 'Apps & AI Apps',
                                'ai apps': 'Apps & AI Apps',
                                'services': 'Services'
                            };
                            const canonical = SYNONYMS_TO_CANONICAL[categoryLower];
                            if (canonical) {
                                const row = sqliteDb.prepare(
                                    `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`
                                ).get(canonical);
                                targetParentId = row?.id;
                            }
                        }

                        if (targetParentId) {
                            const childRows = sqliteDb.prepare(
                                `SELECT name FROM categories WHERE parent_id = ? AND is_active = 1 ORDER BY display_order ASC, name ASC`
                            ).all(targetParentId);
                            const childNames = (childRows || []).map(r => r.name).filter(Boolean);

                            if (childNames.length > 0) {
                                const placeholders = childNames.map(() => '?').join(',');
                                let parentFallbackQuery = `
                    SELECT * FROM unified_content
                    WHERE (
                      category IN (${placeholders})
                      OR subcategory IN (${placeholders})
                    )
                      AND (
                        status = 'active' OR status = 'published' OR status IS NULL
                      )
                      AND (
                        visibility IN ('public','visible') OR visibility IS NULL
                      )
                      AND (
                        processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL
                      )
                  `;
                                // Optional gender filter in fallback path
                                if (typeof gender === 'string' && gender && String(gender).toLowerCase() !== 'all') {
                                    parentFallbackQuery += ` AND LOWER(COALESCE(gender,'')) = LOWER(?)`;
                                }
                                parentFallbackQuery += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
                                const pParams = [...childNames, ...childNames];
                                if (typeof gender === 'string' && gender && String(gender).toLowerCase() !== 'all') {
                                    pParams.push(String(gender));
                                }
                                pParams.push(parseInt(String(limit)), parseInt(String(offset)));
                                products = sqliteDb.prepare(parentFallbackQuery).all(...pParams);
                            }
                        }
                    } catch (e) {
                        console.log('Parent-category fallback failed:', e);
                    }
                }
            }

            console.log(`Found ${products.length} products for category "${category}"`);
            res.json(products);
        } catch (error) {
            console.error('Error fetching products by category:', error);
            res.status(500).json({ message: 'Failed to fetch products by category' });
        }
    });
    // Admin category management routes
    app.post('/api/admin/categories', async (req, res) => {
        try {
            const { password, ...categoryData } = req.body;
            if (!await verifyAdminPassword(password)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // Map boolean flags from the client to integer columns
            const isForProducts = categoryData.isForProducts === true ? 1 : 0;
            const isForServices = categoryData.isForServices === true ? 1 : 0;
            const isForAIApps = categoryData.isForAIApps === true ? 1 : 0;

            const result = sqliteDb.prepare(`
        INSERT INTO categories (
          name, description, display_order, is_active,
          is_for_products, is_for_services, is_for_ai_apps
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
                categoryData.name,
                categoryData.description || '',
                categoryData.displayOrder || 0,
                categoryData.isActive !== false ? 1 : 0,
                isForProducts,
                isForServices,
                isForAIApps
            );
            res.json({ id: result.lastInsertRowid, ...categoryData });
        }
        catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({ message: 'Failed to create category' });
        }
    });
    app.put('/api/admin/categories/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { password, ...categoryData } = req.body;
            if (!await verifyAdminPassword(password)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // Map boolean flags from the client to integer columns
            const isForProducts = categoryData.isForProducts === true ? 1 : 0;
            const isForServices = categoryData.isForServices === true ? 1 : 0;
            const isForAIApps = categoryData.isForAIApps === true ? 1 : 0;

            sqliteDb.prepare(`
        UPDATE categories 
        SET 
          name = ?,
          description = ?,
          display_order = ?,
          is_active = ?,
          is_for_products = ?,
          is_for_services = ?,
          is_for_ai_apps = ?
        WHERE id = ?
      `).run(
                categoryData.name,
                categoryData.description || '',
                categoryData.displayOrder || 0,
                categoryData.isActive !== false ? 1 : 0,
                isForProducts,
                isForServices,
                isForAIApps,
                id
            );
            res.json({ id, ...categoryData });
        }
        catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ message: 'Failed to update category' });
        }
    });
    app.delete('/api/admin/categories/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { password } = req.body;
            if (!await verifyAdminPassword(password)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            sqliteDb.prepare('DELETE FROM categories WHERE id = ?').run(id);
            res.json({ message: 'Category deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({ message: 'Failed to delete category' });
        }
    });
    // Bulk delete categories (delete selected IDs and their subcategories)
    app.delete('/api/admin/categories/bulk-delete', async (req, res) => {
        try {
            const { password, ids } = req.body || {};
            if (!await verifyAdminPassword(password)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ message: 'No category IDs provided' });
            }
            const placeholders = ids.map(() => '?').join(',');
            const deleteChildrenSql = `DELETE FROM categories WHERE parent_id IN (${placeholders})`;
            const deleteParentsSql = `DELETE FROM categories WHERE id IN (${placeholders})`;
            const tx = sqliteDb.transaction((arr) => {
                sqliteDb.prepare(deleteChildrenSql).run(...arr);
                sqliteDb.prepare(deleteParentsSql).run(...arr);
            });
            tx(ids);
            res.json({ message: 'Selected categories deleted successfully', deletedIds: ids });
        }
        catch (error) {
            console.error('Error bulk deleting categories:', error);
            res.status(500).json({ message: 'Failed to bulk delete categories' });
        }
    });
    // Delete all categories (including subcategories)
    app.delete('/api/admin/categories/delete-all', async (req, res) => {
        try {
            const { password } = req.body || {};
            if (!await verifyAdminPassword(password)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            sqliteDb.prepare('DELETE FROM categories').run();
            res.json({ message: 'All categories deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting all categories:', error);
            res.status(500).json({ message: 'Failed to delete all categories' });
        }
    });
    // Get all categories with flags and metadata (used by admin forms)
    app.get('/api/categories', async (req, res) => {
        try {
            const categories = sqliteDb.prepare(`
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
      `).all();
            res.json(categories);
        }
        catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ message: 'Failed to fetch categories' });
        }
    });

    // Subcategories for a given parent category name (robust, with canonical mapping and fallback)
    app.get('/api/categories/subcategories', async (req, res) => {
        try {
            const parent = (req.query && req.query.parent) ? req.query.parent : '';
            const parentInput = String(parent || '').trim();
            if (!parentInput) {
                return res.json([]);
            }

            const parentLower = parentInput.toLowerCase();
            // Common synonyms mapped to canonical parent names in DB
            const SYNONYMS_TO_CANONICAL = {
                // Electronics
                'electronics': 'Electronics & Gadgets',
                'tech': 'Electronics & Gadgets',
                'technology': 'Electronics & Gadgets',
                // Home & Living
                'home & kitchen': 'Home & Living',
                'home and kitchen': 'Home & Living',
                // Beauty
                'beauty & personal care': 'Beauty',
                'personal care': 'Beauty',
                // Apps
                'apps and ai apps': 'Apps & AI Apps',
                'ai apps': 'Apps & AI Apps',
                // Services
                'services': 'Services',
            };

            // Try exact/case-insensitive parent lookup
            let parentRow = sqliteDb.prepare(
                `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`
            ).get(parentInput);

            // Try canonical mapping if not found
            if (!(parentRow && parentRow.id)) {
                const canonical = SYNONYMS_TO_CANONICAL[parentLower];
                if (canonical) {
                    parentRow = sqliteDb.prepare(
                        `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`
                    ).get(canonical);
                }
            }

            // If parent exists in categories table, return its children
            if (parentRow && parentRow.id) {
                const subcats = sqliteDb.prepare(
                    `SELECT name, name as id, icon, color, description
                     FROM categories
                     WHERE parent_id = ? AND is_active = 1
                     ORDER BY display_order ASC, name ASC`
                ).all(parentRow.id);

                if (Array.isArray(subcats) && subcats.length > 0) {
                    return res.json(subcats);
                }
            }

            // Fallback: derive subcategories strictly from unified_content by matching the parent category
            // and only returning non-empty subcategory names. This prevents showing unrelated top-level parents.
            const canonical = SYNONYMS_TO_CANONICAL[parentLower];
            const variants = [parentInput];
            if (canonical) variants.push(canonical);
            const placeholders = variants.map(() => '?').join(', ');
            let q = `
                SELECT DISTINCT TRIM(subcategory) AS name
                FROM unified_content
                WHERE subcategory IS NOT NULL AND TRIM(subcategory) != ''
                  AND LOWER(category) IN (${placeholders})
                ORDER BY name ASC
                LIMIT 100
            `;
            const rows = sqliteDb.prepare(q).all(...variants.map(v => v.toLowerCase()));
            const derived = (rows || [])
                .map(r => ({ name: r.name, id: r.name }))
                .filter(r => r.name && r.name.trim() !== '');

            return res.json(derived);
        } catch (error) {
            console.error('Error fetching subcategories:', error);
            res.status(500).json({ message: 'Failed to fetch subcategories' });
        }
    });
    // Browse categories endpoint - only shows categories with products
    app.get('/api/categories/browse', async (req, res) => {
        try {
            console.log('🔍 Browse categories API called with query:', req.query);
            const { type } = req.query;
            let typeFilter = '';
            // Add type filtering if specified
            if (type && type !== 'all') {
                if (type === 'products') {
                    typeFilter = ` AND (uc.is_service IS NULL OR uc.is_service = 0) AND (uc.is_ai_app IS NULL OR uc.is_ai_app = 0)`;
                }
                else if (type === 'services') {
                    typeFilter = ` AND uc.is_service = 1`;
                }
                else if (type === 'aiapps') {
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
          COUNT(CASE WHEN uc.is_ai_app = 1 THEN 1 END) as apps_count
        FROM categories c
        INNER JOIN unified_content uc ON (
          uc.category = c.name 
          OR uc.category = REPLACE(c.name, 's', '')
          OR uc.category = c.name || 's'
          OR (c.name = 'Technology Services' AND uc.category = 'Technology Service')
          OR (c.name = 'AI Photo Apps' AND uc.category = 'AI Photo App')
          OR (c.name = 'AI Applications' AND uc.category = 'AI App')
        )
        WHERE c.parent_id IS NULL
          AND uc.processing_status = 'completed'
          AND uc.visibility = 'public'
          AND uc.status = 'active'
          ${typeFilter}
        GROUP BY c.id, c.name, c.icon, c.color, c.description, c.parent_id, c.is_for_products, c.is_for_services, c.is_for_ai_apps, c.display_order
        HAVING COUNT(uc.id) > 0
        ORDER BY c.display_order ASC, c.name ASC
      `;
            console.log('🔍 Executing query:', query);
            const categories = sqliteDb.prepare(query).all();
            console.log('🔍 Query result:', categories);
            res.json(categories);
        }
        catch (error) {
            console.error('Error fetching browse categories:', error);
            res.status(500).json({ message: 'Failed to fetch browse categories' });
        }
    });
    // Get categories filtered by type for browse sections (only categories with content)
    app.get('/api/categories/products', async (req, res) => {
        try {
            const categories = sqliteDb.prepare(`
        SELECT 
          c.name, 
          c.id, 
          COALESCE(uc.count, 0) as count
        FROM categories c
        INNER JOIN (
          SELECT category, COUNT(*) as count
          FROM unified_content 
          WHERE category IS NOT NULL 
          AND category != ''
          AND (processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL)
          AND (visibility = 'public' OR visibility IS NULL)
          AND (status = 'published' OR status = 'active' OR status IS NULL)
          AND (is_service IS NULL OR is_service = 0)
          AND (is_ai_app IS NULL OR is_ai_app = 0)
          GROUP BY category
        ) uc ON c.name = uc.category
        WHERE c.is_for_products = 1
        ORDER BY c.display_order ASC, c.name ASC
      `).all();
            res.json(categories);
        }
        catch (error) {
            console.error('Error fetching product categories:', error);
            res.status(500).json({ message: 'Failed to fetch product categories' });
        }
    });
    app.get('/api/categories/services', async (req, res) => {
        try {
            const categories = sqliteDb.prepare(`
        SELECT 
          c.name, 
          c.id, 
          COALESCE(uc.count, 0) as count
        FROM categories c
        INNER JOIN (
          SELECT category, COUNT(*) as count
          FROM unified_content 
          WHERE category IS NOT NULL 
          AND category != ''
          AND (processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL)
          AND (visibility = 'public' OR visibility IS NULL)
          AND (status = 'published' OR status = 'active' OR status IS NULL)
          AND is_service = 1
          GROUP BY category
        ) uc ON c.name = uc.category
        WHERE c.is_for_services = 1
        ORDER BY c.display_order ASC, c.name ASC
      `).all();
            res.json(categories);
        }
        catch (error) {
            console.error('Error fetching service categories:', error);
            res.status(500).json({ message: 'Failed to fetch service categories' });
        }
    });
    app.get('/api/categories/aiapps', async (req, res) => {
        try {
            const categories = sqliteDb.prepare(`
        SELECT 
          c.name, 
          c.name as id, 
          COALESCE(uc.count, 0) as count
        FROM categories c
        INNER JOIN (
          SELECT category, COUNT(*) as count
          FROM unified_content 
          WHERE category IS NOT NULL 
          AND category != ''
          AND (processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL)
          AND (visibility = 'public' OR visibility IS NULL)
          AND (status = 'published' OR status = 'active' OR status IS NULL)
          AND is_ai_app = 1
          GROUP BY category
        ) uc ON c.name = uc.category
        WHERE c.is_for_ai_apps = 1
        ORDER BY c.display_order ASC, c.name ASC
      `).all();
            res.json(categories);
        }
        catch (error) {
            console.error('Error fetching AI app categories:', error);
            res.status(500).json({ message: 'Failed to fetch AI app categories' });
        }
    });
    // Form category endpoints - return ALL categories regardless of content
    app.get('/api/categories/forms/products', async (req, res) => {
        try {
            const categories = sqliteDb.prepare(`
        SELECT 
          c.name, 
          c.name as id, 
          0 as count
        FROM categories c
        WHERE c.is_for_products = 1
        ORDER BY c.display_order ASC, c.name ASC
      `).all();
            res.json(categories);
        }
        catch (error) {
            console.error('Error fetching form product categories:', error);
            res.status(500).json({ message: 'Failed to fetch form product categories' });
        }
    });
    app.get('/api/categories/forms/services', async (req, res) => {
        try {
            const categories = sqliteDb.prepare(`
        SELECT 
          c.name, 
          c.name as id, 
          0 as count
        FROM categories c
        WHERE c.is_for_services = 1
        ORDER BY c.display_order ASC, c.name ASC
      `).all();
            res.json(categories);
        }
        catch (error) {
            console.error('Error fetching form service categories:', error);
            res.status(500).json({ message: 'Failed to fetch form service categories' });
        }
    });
    app.get('/api/categories/forms/aiapps', async (req, res) => {
        try {
            const categories = sqliteDb.prepare(`
        SELECT 
          c.name, 
          c.name as id, 
          0 as count
        FROM categories c
        WHERE c.is_for_ai_apps = 1
        ORDER BY c.display_order ASC, c.name ASC
      `).all();
            res.json(categories);
        }
        catch (error) {
            console.error('Error fetching form AI app categories:', error);
            res.status(500).json({ message: 'Failed to fetch form AI app categories' });
        }
    });
    // All products endpoint (for admin panel)
    app.get('/api/products', async (req, res) => {
        try {
            const { limit = 100, offset = 0, category, search } = req.query;
            const parsedLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 500);
            const parsedOffset = Math.max(parseInt(offset) || 0, 0);
            let query = `
        SELECT * FROM unified_content 
        WHERE status = 'active'
      `;
            const params = [];
            if (category && category !== 'all') {
                const categoryLower = String(category || '').toLowerCase();
                let tokens = categoryLower
                    .replace(/[^a-z0-9 &-]/g, ' ')
                    .split(/[\s&/-]+/)
                    .map(t => t.trim())
                    .filter(Boolean);

                const SYNONYM_TOKENS = {
                    smartphones: ['smartphone', 'mobile', 'mobiles', 'mobile phone', 'mobile phones', 'cell phone', 'cell phones', 'phone', 'phones'],
                    smartphone: ['smartphones', 'mobile', 'mobiles', 'mobile phone', 'mobile phones', 'cell phone', 'cell phones', 'phone', 'phones'],
                    laptops: ['laptop', 'notebook', 'notebooks'],
                    laptop: ['laptops', 'notebook', 'notebooks'],
                    earphones: ['earbud', 'earbuds', 'headphone', 'headphones', 'headset'],
                    headphones: ['earphone', 'earphones', 'earbud', 'earbuds', 'headset'],
                    television: ['tv', 'smart tv', 'led tv', 'oled tv'],
                    tv: ['television', 'smart tv', 'led tv', 'oled tv'],
                    camera: ['cameras', 'dslr', 'mirrorless'],
                    cameras: ['camera', 'dslr', 'mirrorless'],
                    electronics: ['electronic', 'gadgets', 'tech']
                };
                const extraSynonyms = new Set();
                for (const t of tokens) {
                    const syns = SYNONYM_TOKENS[t];
                    if (Array.isArray(syns)) {
                        for (const s of syns) extraSynonyms.add(s);
                    }
                }
                if (extraSynonyms.size > 0) {
                    tokens = Array.from(new Set([...tokens, ...extraSynonyms]));
                }

                let childNames = [];
                try {
                    let parentRow = sqliteDb.prepare(
                        `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`
                    ).get(category);
                    if (!(parentRow && parentRow.id)) {
                        const SYNONYMS_TO_CANONICAL = {
                            electronics: 'Electronics & Gadgets',
                            tech: 'Electronics & Gadgets',
                            technology: 'Electronics & Gadgets',
                            'home & kitchen': 'Home & Living',
                            'home and kitchen': 'Home & Living',
                            'beauty & personal care': 'Beauty',
                            'personal care': 'Beauty',
                            'apps and ai apps': 'Apps & AI Apps',
                            'ai apps': 'Apps & AI Apps',
                            services: 'Services'
                        };
                        const canonical = SYNONYMS_TO_CANONICAL[categoryLower];
                        if (canonical) {
                            parentRow = sqliteDb.prepare(
                                `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`
                            ).get(canonical);
                        }
                    }
                    if (parentRow && parentRow.id) {
                        const childRows = sqliteDb.prepare(
                            `SELECT name FROM categories WHERE parent_id = ? AND is_active = 1 ORDER BY display_order ASC, name ASC`
                        ).all(parentRow.id);
                        childNames = (childRows || []).map(r => r.name).filter(Boolean);
                    }
                } catch (e) {
                    console.log('Parent-child detection failed (admin products):', e);
                }

                const hasChildren = childNames.length > 0;
                const childPlaceholders = hasChildren ? childNames.map(() => '?').join(',') : '';
                const likeBlocksCat = tokens.map(() => `LOWER(category) LIKE '%' || ? || '%'`).join(' OR ');
                const likeBlocksSub = tokens.map(() => `LOWER(subcategory) LIKE '%' || ? || '%'`).join(' OR ');
                const likeBlocksTags = tokens.map(() => `LOWER(tags) LIKE '%' || ? || '%'`).join(' OR ');

                query += ` AND ( LOWER(category) = LOWER(?) ${hasChildren ? ` OR category IN (${childPlaceholders}) OR subcategory IN (${childPlaceholders})` : ''} OR ${likeBlocksCat} OR ${likeBlocksSub} OR ${likeBlocksTags} )`;
                params.push(category);
                if (hasChildren) {
                    params.push(...childNames);
                    params.push(...childNames);
                }
                for (const tok of tokens) params.push(tok);
                for (const tok of tokens) params.push(tok);
                for (const tok of tokens) params.push(tok);
            }
            if (search) {
                query += ` AND (title LIKE ? OR description LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`);
            }
            query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            params.push(parsedLimit, parsedOffset);
            const products = await retryDatabaseOperation(() => sqliteDb.prepare(query).all(...params));
            // Transform data for frontend
            const transformedProducts = products.map((product) => {
                const featured = (() => {
                    const v = typeof product.is_featured !== 'undefined' ? product.is_featured : product.isFeatured;
                    if (typeof v === 'number') return v === 1;
                    if (typeof v === 'string') {
                        const s = v.trim().toLowerCase();
                        return s === '1' || s === 'true' || s === 'yes' || s === 'y' || s === 'on';
                    }
                    return Boolean(v);
                })();
                return {
                    id: product.id,
                    name: product.title, // Use title as name
                    description: product.description || '',
                    price: product.price || '0',
                    originalPrice: product.originalPrice,
                    currency: product.currency || 'USD',
                    imageUrl: product.image_url || '/api/placeholder/300/300',
                    affiliateUrl: product.affiliate_url || '',
                    category: product.category || 'Uncategorized',
                    subcategory: product.subcategory || '',
                    gender: product.gender,
                    rating: product.rating || '0',
                    reviewCount: product.reviewCount || 0,
                    discount: product.discount || 0,
                    isFeatured: featured,
                    is_featured: featured,
                    createdAt: product.createdAt
                };
            });
            res.json(transformedProducts);
        }
        catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ message: 'Failed to fetch products' });
        }
    });
    // Featured products endpoint
    app.get('/api/products/featured', async (req, res) => {
        try {
            console.log('Getting featured products for Today\'s Top Picks section');
            const { category } = req.query;
            // Build query with optional category filter including parent→child inclusion
            let query = `
        SELECT * FROM unified_content 
        WHERE is_featured = 1
          AND status = 'active'
      `;
            const params = [];

            if (category && category !== 'all') {
                const categoryLower = String(category || '').toLowerCase();
                let tokens = categoryLower
                    .replace(/[^a-z0-9 &-]/g, ' ')
                    .split(/[\s&/-]+/)
                    .map(t => t.trim())
                    .filter(Boolean);

                const SYNONYM_TOKENS = {
                    smartphones: ['smartphone', 'mobile', 'mobiles', 'mobile phone', 'mobile phones', 'cell phone', 'cell phones', 'phone', 'phones'],
                    smartphone: ['smartphones', 'mobile', 'mobiles', 'mobile phone', 'mobile phones', 'cell phone', 'cell phones', 'phone', 'phones'],
                    laptops: ['laptop', 'notebook', 'notebooks'],
                    laptop: ['laptops', 'notebook', 'notebooks'],
                    earphones: ['earbud', 'earbuds', 'headphone', 'headphones', 'headset'],
                    headphones: ['earphone', 'earphones', 'earbud', 'earbuds', 'headset'],
                    television: ['tv', 'smart tv', 'led tv', 'oled tv'],
                    tv: ['television', 'smart tv', 'led tv', 'oled tv'],
                    camera: ['cameras', 'dslr', 'mirrorless'],
                    cameras: ['camera', 'dslr', 'mirrorless'],
                    electronics: ['electronic', 'gadgets', 'tech']
                };
                const extraSynonyms = new Set();
                for (const t of tokens) {
                    const syns = SYNONYM_TOKENS[t];
                    if (Array.isArray(syns)) {
                        for (const s of syns) extraSynonyms.add(s);
                    }
                }
                if (extraSynonyms.size > 0) {
                    tokens = Array.from(new Set([...tokens, ...extraSynonyms]));
                }

                let childNames = [];
                try {
                    let parentRow = sqliteDb.prepare(
                        `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`
                    ).get(category);
                    if (!(parentRow && parentRow.id)) {
                        const SYNONYMS_TO_CANONICAL = {
                            electronics: 'Electronics & Gadgets',
                            tech: 'Electronics & Gadgets',
                            technology: 'Electronics & Gadgets',
                            'home & kitchen': 'Home & Living',
                            'home and kitchen': 'Home & Living',
                            'beauty & personal care': 'Beauty',
                            'personal care': 'Beauty',
                            'apps and ai apps': 'Apps & AI Apps',
                            'ai apps': 'Apps & AI Apps',
                            services: 'Services'
                        };
                        const canonical = SYNONYMS_TO_CANONICAL[categoryLower];
                        if (canonical) {
                            parentRow = sqliteDb.prepare(
                                `SELECT id, name FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`
                            ).get(canonical);
                        }
                    }
                    if (parentRow && parentRow.id) {
                        const childRows = sqliteDb.prepare(
                            `SELECT name FROM categories WHERE parent_id = ? AND is_active = 1 ORDER BY display_order ASC, name ASC`
                        ).all(parentRow.id);
                        childNames = (childRows || []).map(r => r.name).filter(Boolean);
                    }
                } catch (e) {
                    console.log('Parent-child detection failed (featured filter):', e);
                }

                const hasChildren = childNames.length > 0;
                const childPlaceholders = hasChildren ? childNames.map(() => '?').join(',') : '';
                const likeBlocksCat = tokens.map(() => `LOWER(category) LIKE '%' || ? || '%'`).join(' OR ');
                const likeBlocksSub = tokens.map(() => `LOWER(subcategory) LIKE '%' || ? || '%'`).join(' OR ');
                const likeBlocksTags = tokens.map(() => `LOWER(tags) LIKE '%' || ? || '%'`).join(' OR ');

                query += ` AND ( LOWER(category) = LOWER(?) ${hasChildren ? ` OR category IN (${childPlaceholders}) OR subcategory IN (${childPlaceholders})` : ''} OR ${likeBlocksCat} OR ${likeBlocksSub} OR ${likeBlocksTags} )`;

                params.push(category);
                if (hasChildren) {
                    params.push(...childNames);
                    params.push(...childNames);
                }
                for (const tok of tokens) params.push(tok);
                for (const tok of tokens) params.push(tok);
                for (const tok of tokens) params.push(tok);
            }

            query += ` ORDER BY created_at DESC, id DESC LIMIT 10`;
            const featuredProducts = sqliteDb.prepare(query).all(...params);
            console.log(`Featured Products: Returning ${featuredProducts.length} featured products`);
            const transformed = featuredProducts.map((product) => {
                const featured = (() => {
                    const v = typeof product.is_featured !== 'undefined' ? product.is_featured : product.isFeatured;
                    if (typeof v === 'number') return v === 1;
                    if (typeof v === 'string') {
                        const s = v.trim().toLowerCase();
                        return s === '1' || s === 'true' || s === 'yes' || s === 'y' || s === 'on';
                    }
                    return Boolean(v);
                })();
                return {
                    id: product.id,
                    name: product.title,
                    description: product.description || '',
                    price: product.price || '0',
                    originalPrice: product.originalPrice,
                    currency: product.currency || 'USD',
                    imageUrl: product.image_url || '/api/placeholder/300/300',
                    affiliateUrl: product.affiliate_url || '',
                    category: product.category || 'Uncategorized',
                    subcategory: product.subcategory || '',
                    rating: product.rating || '0',
                    reviewCount: product.reviewCount || 0,
                    discount: product.discount || 0,
                    isFeatured: featured,
                    is_featured: featured,
                    createdAt: product.createdAt
                };
            });
            res.json(transformed);
        }
        catch (error) {
            console.error('Error fetching featured products:', error);
            res.status(500).json({ message: 'Failed to fetch featured products' });
        }
    });
    // Dynamic widget endpoints for all pages and positions
    app.get('/api/widgets/:page/:position', (req, res) => {
        try {
            const { page, position } = req.params;
            // Return empty widget array for now - this can be enhanced later with database integration
            res.json([]);
        }
        catch (error) {
            console.error('Error fetching widgets:', error);
            res.status(500).json({ message: 'Failed to fetch widgets' });
        }
    });
    // Legacy widget endpoints (placeholder responses)
    app.get('/api/widgets/home/content-top', (req, res) => {
        res.json({ content: '', enabled: false });
    });
    app.get('/api/widgets/home/content-bottom', (req, res) => {
        res.json({ content: '', enabled: false });
    });
    app.get('/api/widgets/home/footer', (req, res) => {
        res.json({ content: '', enabled: false });
    });
    // Announcement endpoint
    app.get('/api/announcement/active', (req, res) => {
        // Check if Telegram bot is enabled and active
        const ENABLE_TELEGRAM_BOT = process.env.ENABLE_TELEGRAM_BOT === 'true' || process.env.NODE_ENV === 'production';
        const botEnabled = ENABLE_TELEGRAM_BOT && process.env.MASTER_BOT_TOKEN;
        res.json({
            message: botEnabled ? 'Telegram bot is active and monitoring channels' : 'Bot is disabled',
            enabled: botEnabled
        });
    });
    // Navigation tabs routes
    app.get('/api/nav-tabs', async (req, res) => {
        try {
            const tabs = [
                {
                    id: 1,
                    name: "Prime Picks",
                    slug: "prime-picks",
                    icon: "fas fa-crown",
                    color_from: "#8B5CF6",
                    color_to: "#7C3AED",
                    display_order: 1,
                    is_active: true,
                    is_system: true,
                    description: "Premium curated products"
                },
                {
                    id: 2,
                    name: "Cue Picks",
                    slug: "cue-picks",
                    icon: "fas fa-bullseye",
                    color_from: "#06B6D4",
                    color_to: "#0891B2",
                    display_order: 2,
                    is_active: true,
                    is_system: true,
                    description: "Smart selections curated with precision"
                },
                {
                    id: 3,
                    name: "Value Picks",
                    slug: "value-picks",
                    icon: "fas fa-gem",
                    color_from: "#F59E0B",
                    color_to: "#D97706",
                    display_order: 3,
                    is_active: true,
                    is_system: true,
                    description: "Best value for money products"
                },
                {
                    id: 4,
                    name: "Click Picks",
                    slug: "click-picks",
                    icon: "fas fa-mouse-pointer",
                    color_from: "#3B82F6",
                    color_to: "#1D4ED8",
                    display_order: 4,
                    is_active: true,
                    is_system: true,
                    description: "Most popular and trending products"
                },
                {
                    id: 5,
                    name: "Global Picks",
                    slug: "global-picks",
                    icon: "fas fa-globe",
                    color_from: "#10B981",
                    color_to: "#059669",
                    display_order: 5,
                    is_active: true,
                    is_system: true,
                    description: "International products and brands"
                },
                {
                    id: 6,
                    name: "Travel Picks",
                    slug: "travel-picks",
                    icon: "fas fa-plane",
                    color_from: "#3B82F6",
                    color_to: "#1D4ED8",
                    display_order: 6,
                    is_active: true,
                    is_system: true,
                    description: "Travel essentials and accessories"
                },
                {
                    id: 7,
                    name: "Deals Hub",
                    slug: "deals-hub",
                    icon: "fas fa-fire",
                    color_from: "#EF4444",
                    color_to: "#DC2626",
                    display_order: 7,
                    is_active: true,
                    is_system: true,
                    description: "Hot deals and discounts"
                },
                {
                    id: 8,
                    name: "Loot Box",
                    slug: "loot-box",
                    icon: "fas fa-gift",
                    color_from: "#F59E0B",
                    color_to: "#D97706",
                    display_order: 8,
                    is_active: true,
                    is_system: true,
                    description: "Mystery boxes with amazing surprises"
                }
            ];
            res.json(tabs);
        }
        catch (error) {
            console.error('Error fetching nav tabs:', error);
            res.status(500).json({ message: 'Failed to fetch navigation tabs' });
        }
    });
    // Navigation tabs endpoint (alternative endpoint)
    app.get('/api/navigation/tabs', async (req, res) => {
        try {
            const tabs = [
                {
                    id: 1,
                    name: "Prime Picks",
                    slug: "prime-picks",
                    icon: "fas fa-crown",
                    color_from: "#8B5CF6",
                    color_to: "#7C3AED",
                    display_order: 1,
                    is_active: true,
                    is_system: true,
                    description: "Premium curated products"
                },
                {
                    id: 2,
                    name: "Cue Picks",
                    slug: "cue-picks",
                    icon: "fas fa-bullseye",
                    color_from: "#06B6D4",
                    color_to: "#0891B2",
                    display_order: 2,
                    is_active: true,
                    is_system: true,
                    description: "Smart selections curated with precision"
                },
                {
                    id: 3,
                    name: "Value Picks",
                    slug: "value-picks",
                    icon: "fas fa-gem",
                    color_from: "#F59E0B",
                    color_to: "#D97706",
                    display_order: 3,
                    is_active: true,
                    is_system: true,
                    description: "Best value for money products"
                },
                {
                    id: 4,
                    name: "Click Picks",
                    slug: "click-picks",
                    icon: "fas fa-mouse-pointer",
                    color_from: "#3B82F6",
                    color_to: "#1D4ED8",
                    display_order: 4,
                    is_active: true,
                    is_system: true,
                    description: "Most popular and trending products"
                },
                {
                    id: 5,
                    name: "Global Picks",
                    slug: "global-picks",
                    icon: "fas fa-globe",
                    color_from: "#10B981",
                    color_to: "#059669",
                    display_order: 5,
                    is_active: true,
                    is_system: true,
                    description: "International products and brands"
                },
                {
                    id: 6,
                    name: "Travel Picks",
                    slug: "travel-picks",
                    icon: "fas fa-plane",
                    color_from: "#3B82F6",
                    color_to: "#1D4ED8",
                    display_order: 6,
                    is_active: true,
                    is_system: true,
                    description: "Travel essentials and accessories"
                },
                {
                    id: 7,
                    name: "Deals Hub",
                    slug: "deals-hub",
                    icon: "fas fa-fire",
                    color_from: "#EF4444",
                    color_to: "#DC2626",
                    display_order: 7,
                    is_active: true,
                    is_system: true,
                    description: "Hot deals and discounts"
                },
                {
                    id: 8,
                    name: "Loot Box",
                    slug: "loot-box",
                    icon: "fas fa-gift",
                    color_from: "#F59E0B",
                    color_to: "#D97706",
                    display_order: 8,
                    is_active: true,
                    is_system: true,
                    description: "Mystery boxes with amazing surprises"
                }
            ];
            res.json(tabs);
        }
        catch (error) {
            console.error('Error fetching navigation tabs:', error);
            res.status(500).json({ message: 'Failed to fetch navigation tabs' });
        }
    });
    // Delete product endpoint - handles unified_content table
    app.delete('/api/admin/products/:id', async (req, res) => {
        try {
            const { password } = req.body;
            if (!await verifyAdminPassword(password)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const productId = req.params.id;
            console.log(`🗑️ Attempting to delete product: ${productId}`);
            let deleted = false;
            const deletionDetails = [];
            // Try to delete from unified_content table first (for Prime Picks, etc.)
            try {
                const result = sqliteDb.prepare('DELETE FROM unified_content WHERE id = ?').run(productId);
                if (result.changes > 0) {
                    deleted = true;
                    deletionDetails.push(`Deleted from unified_content table`);
                    console.log(`✅ Successfully deleted product ${productId} from unified_content`);
                }
            }
            catch (error) {
                console.log(`⚠️ Could not delete from unified_content: ${error.message}`);
            }
            // Legacy products table deletion removed to enforce unified table usage only
            if (deleted) {
                res.json({
                    message: 'Product deleted successfully',
                    details: deletionDetails,
                    productId: productId
                });
            }
            else {
                res.status(404).json({ message: 'Product not found' });
            }
        }
        catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({ message: 'Failed to delete product' });
        }
    });
    // Admin authentication endpoint
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
            }
            else {
                res.status(401).json({ success: false, message: 'Invalid password' });
            }
        }
        catch (error) {
            console.error('Admin authentication error:', error);
            res.status(500).json({ message: 'Authentication failed' });
        }
    });
    // Admin product management routes
    app.post('/api/admin/products', async (req, res) => {
        try {
            const { password, ...productData } = req.body;
            if (!await verifyAdminPassword(password)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const product = await storage.addProduct(productData);
            res.json({ message: 'Product added successfully', product });
        }
        catch (error) {
            console.error('Add product error:', error);
            res.status(500).json({ message: 'Failed to add product' });
        }
    });
    app.put('/api/admin/products/:id', async (req, res) => {
        try {
            const { password, ...updates } = req.body;
            if (!await verifyAdminPassword(password)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const id = parseInt(req.params.id);
            const updated = await storage.updateProduct(id, updates);
            if (updated) {
                res.json({ message: 'Product updated successfully' });
            }
            else {
                res.status(404).json({ message: 'Product not found' });
            }
        }
        catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({ message: 'Failed to update product' });
        }
    });
    // Health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    // Video content endpoint
    app.get('/api/video-content', async (req, res) => {
        try {
            const videoContent = await storage.getVideoContent();
            // Filter out expired video content based on their individual timers
            const now = new Date();
            const activeVideoContent = videoContent.filter(video => {
                // If video doesn't have timer enabled, keep it
                if (!video.hasTimer || !video.timerDuration || !video.createdAt) {
                    return true;
                }
                // Calculate expiry time based on video's timer duration
                const videoCreatedAt = video.createdAt ? new Date(video.createdAt) : new Date();
                const expiryTime = new Date(videoCreatedAt.getTime() + (video.timerDuration * 60 * 60 * 1000));
                // Keep video if it hasn't expired yet
                return now < expiryTime;
            });
            // Sort by most recent first and parse tags
            const sortedVideos = activeVideoContent.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            }).map(video => ({
                ...video,
                // Parse tags from JSON string to array if needed
                tags: typeof video.tags === 'string' ?
                    (video.tags.startsWith('[') ? JSON.parse(video.tags) : video.tags.split(',').map((t) => t.trim()).filter(Boolean)) :
                    (Array.isArray(video.tags) ? video.tags : []),
                // Parse pages from JSON string to array if needed
                pages: (() => {
                    const normalizeSlug = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '-');
                    const fromCsv = (str) => String(str || '')
                        .split(',')
                        .map((p) => normalizeSlug(p))
                        .filter(Boolean);
                    if (Array.isArray(video.pages)) return video.pages.map(normalizeSlug).filter(Boolean);
                    if (typeof video.pages === 'string') {
                        if (video.pages.startsWith('[')) {
                            try {
                                const arr = JSON.parse(video.pages);
                                return Array.isArray(arr) ? arr.map(normalizeSlug).filter(Boolean) : fromCsv(video.pages);
                            } catch { return fromCsv(video.pages); }
                        }
                        return fromCsv(video.pages);
                    }
                    return [];
                })(),
                // Ensure boolean fields are properly typed
                showOnHomepage: Boolean(video.showOnHomepage),
                hasTimer: Boolean(video.hasTimer),
                // Ensure CTA fields are included
                ctaText: video.ctaText || null,
                ctaUrl: video.ctaUrl || null
            }));
            res.json(sortedVideos);
        }
        catch (error) {
            console.error('Error fetching video content:', error);
            res.status(500).json({ message: "Failed to fetch video content" });
        }
    });

    // Admin: Add video content
    app.post('/api/admin/video-content', async (req, res) => {
        try {
            const { password, ...videoData } = req.body;
            if (!await verifyAdminPassword(password)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            // Normalize/transform fields similar to storage.addVideoContent expectations
            const payload = {
                ...videoData,
                hasTimer: Boolean(videoData.hasTimer),
                timerDuration: videoData.hasTimer && videoData.timerDuration ? parseInt(videoData.timerDuration) : null,
                tags: Array.isArray(videoData.tags) ? videoData.tags : (typeof videoData.tags === 'string' ? videoData.tags.split(',').map((t) => t.trim()).filter(Boolean) : []),
                pages: (() => {
                    const normalizeSlug = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '-');
                    if (Array.isArray(videoData.pages)) return videoData.pages.map(normalizeSlug).filter(Boolean);
                    if (typeof videoData.pages === 'string') {
                        if (videoData.pages.trim().startsWith('[')) {
                            try {
                                const arr = JSON.parse(videoData.pages);
                                return Array.isArray(arr) ? arr.map(normalizeSlug).filter(Boolean) : videoData.pages.split(',').map(normalizeSlug).filter(Boolean);
                            } catch { return videoData.pages.split(',').map(normalizeSlug).filter(Boolean); }
                        }
                        return videoData.pages.split(',').map(normalizeSlug).filter(Boolean);
                    }
                    return [];
                })(),
                showOnHomepage: videoData.showOnHomepage !== undefined ? Boolean(videoData.showOnHomepage) : true,
                ctaText: videoData.ctaText || null,
                ctaUrl: videoData.ctaUrl || null
            };
            const created = await storage.addVideoContent(payload);
            res.json({ message: 'Video content added successfully', video: created });
        }
        catch (error) {
            console.error('Add video content error:', error);
            res.status(500).json({ message: 'Failed to add video content' });
        }
    });

    // Admin: Update video content
    app.put('/api/admin/video-content/:id', async (req, res) => {
        try {
            const bodyAny = (req.body || {});
            const queryAny = (req.query || {});
            const srcPassword = bodyAny.adminPassword
                ? 'body.adminPassword'
                : bodyAny.password
                ? 'body.password'
                : req.headers['x-admin-password']
                ? 'header.x-admin-password'
                : queryAny.adminPassword
                ? 'query.adminPassword'
                : queryAny.password
                ? 'query.password'
                : 'none';
            console.log('🛠️ PUT /api/admin/video-content/:id [routes.js] inbound', {
                url: req.originalUrl,
                idParam: req.params?.id,
                srcPassword,
                contentType: req.headers['content-type'],
                contentLength: req.headers['content-length'],
                bodyKeys: Object.keys(bodyAny || {}),
                queryKeys: Object.keys(queryAny || {}),
            });
            const providedPassword = (bodyAny.password || req.headers['x-admin-password'] || queryAny.password || queryAny.adminPassword || '').toString();
            if (!await verifyAdminPassword(String(providedPassword))) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const id = parseInt(req.params.id);
            if (!Number.isFinite(id)) {
                return res.status(400).json({ message: 'Invalid id parameter' });
            }

            // Start with body updates; merge query fallbacks when proxies strip JSON bodies
            const updates = { ...bodyAny };
            delete updates.password;

            // Merge in query parameters when present
            if (typeof updates.title === 'undefined' && typeof queryAny.title !== 'undefined') updates.title = String(queryAny.title);
            if (typeof updates.description === 'undefined' && typeof queryAny.description !== 'undefined') updates.description = String(queryAny.description);
            if (typeof updates.videoUrl === 'undefined' && typeof queryAny.videoUrl !== 'undefined') updates.videoUrl = String(queryAny.videoUrl);
            if (typeof updates.thumbnailUrl === 'undefined' && typeof queryAny.thumbnailUrl !== 'undefined') updates.thumbnailUrl = String(queryAny.thumbnailUrl);
            if (typeof updates.platform === 'undefined' && typeof queryAny.platform !== 'undefined') updates.platform = String(queryAny.platform);
            if (typeof updates.category === 'undefined' && typeof queryAny.category !== 'undefined') updates.category = String(queryAny.category);
            if (typeof updates.duration === 'undefined' && typeof queryAny.duration !== 'undefined') updates.duration = String(queryAny.duration);

            // Tags normalization
            if (typeof updates.tags === 'undefined' && typeof queryAny.tags !== 'undefined') updates.tags = queryAny.tags;
            if (typeof updates.tags !== 'undefined') {
                if (Array.isArray(updates.tags)) {
                    updates.tags = JSON.stringify(updates.tags);
                } else if (typeof updates.tags === 'string') {
                    // keep string; storage layer can parse CSV or JSON
                    updates.tags = updates.tags;
                }
            }

            // Pages normalization and merge
            if (typeof updates.pages === 'undefined' && typeof queryAny.pages !== 'undefined') updates.pages = queryAny.pages;
            if (typeof updates.pages !== 'undefined') {
                if (Array.isArray(updates.pages)) {
                    updates.pages = JSON.stringify(updates.pages);
                } else if (typeof updates.pages === 'string') {
                    updates.pages = updates.pages;
                }
            }

            // Boolean fields with query fallback
            const qHasTimer = typeof queryAny.hasTimer !== 'undefined' ? String(queryAny.hasTimer) : undefined;
            const qShowOnHomepage = typeof queryAny.showOnHomepage !== 'undefined' ? String(queryAny.showOnHomepage) : undefined;

            if (typeof updates.hasTimer !== 'undefined' || typeof qHasTimer !== 'undefined') {
                const val = typeof updates.hasTimer !== 'undefined' ? updates.hasTimer : qHasTimer;
                updates.hasTimer = (val === true || val === 'true' || val === '1' || val === 1 || val === 'yes' || val === 'on');
            }
            if (typeof updates.showOnHomepage !== 'undefined' || typeof qShowOnHomepage !== 'undefined') {
                const val = typeof updates.showOnHomepage !== 'undefined' ? updates.showOnHomepage : qShowOnHomepage;
                updates.showOnHomepage = (val === true || val === 'true' || val === '1' || val === 1 || val === 'yes' || val === 'on');
            }

            // Timer duration
            const qTimerDuration = typeof queryAny.timerDuration !== 'undefined' ? String(queryAny.timerDuration) : undefined;
            if (typeof updates.timerDuration !== 'undefined' || typeof qTimerDuration !== 'undefined') {
                const val = typeof updates.timerDuration !== 'undefined' ? updates.timerDuration : qTimerDuration;
                updates.timerDuration = (val === null || typeof val === 'undefined') ? null : parseInt(String(val));
            }

            console.log('🔎 PUT /api/admin/video-content/:id [routes.js] resolved fields', {
                id,
                hasTitle: typeof updates.title !== 'undefined',
                hasDescription: typeof updates.description !== 'undefined',
                hasVideoUrl: typeof updates.videoUrl !== 'undefined',
                hasThumbnailUrl: typeof updates.thumbnailUrl !== 'undefined',
                tagsPresent: typeof updates.tags !== 'undefined',
                pagesPresent: typeof updates.pages !== 'undefined',
                showOnHomepage: updates.showOnHomepage,
                hasTimer: updates.hasTimer,
                timerDuration: updates.timerDuration,
            });

            const updated = await storage.updateVideoContent(id, updates);
            if (updated) {
                res.json({ message: 'Video content updated successfully', video: updated });
            } else {
                res.status(404).json({ message: 'Video content not found' });
            }
        } catch (error) {
            console.error('Update video content error:', error);
            res.status(500).json({ message: 'Failed to update video content' });
        }
    });

    // Admin: Delete a single video content item
    app.delete('/api/admin/video-content/:id', async (req, res) => {
        try {
            const { password } = req.body;
            if (!await verifyAdminPassword(password)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const id = parseInt(req.params.id);
            const deleted = await storage.deleteVideoContent(id);
            if (deleted) {
                res.json({ message: 'Video content deleted successfully' });
            }
            else {
                res.status(404).json({ message: 'Video content not found' });
            }
        }
        catch (error) {
            console.error('Delete video content error:', error);
            res.status(500).json({ message: 'Failed to delete video content' });
        }
    });

    // Admin: Bulk delete all video content
    app.delete('/api/admin/video-content/bulk-delete', async (req, res) => {
        try {
            const { password } = req.body;
            if (!await verifyAdminPassword(password)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const count = await storage.deleteAllVideoContent();
            res.json({ message: 'All video content deleted successfully', count });
        }
        catch (error) {
            console.error('Bulk delete video content error:', error);
            res.status(500).json({ message: 'Failed to delete all video content' });
        }
    });
    // Use travel categories router
    app.use('/api', travelCategoriesRouter);
    // Use currency router
    app.use('/api/currency', currencyRouter);
    // Blog management routes
    app.post('/api/admin/blog', async (req, res) => {
        try {
            const { password: bodyPassword, adminPassword, ...blogPostData } = req.body || {};
            const headerPwd = (req.headers['x-admin-password'] || req.headers['X-Admin-Password'] || undefined);
            const queryPwd = typeof req.query?.password === 'string' ? req.query.password : undefined;
            const password = (bodyPassword || adminPassword || headerPwd || queryPwd || '').toString();
            if (!await verifyAdminPassword(password)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const blogPost = await storage.addBlogPost(blogPostData);
            res.json({ message: 'Blog post added successfully', blogPost });
        }
        catch (error) {
            console.error('Add blog post error:', error);
            res.status(500).json({ message: 'Failed to add blog post' });
        }
    });
    // Get blog posts (only within 24 hours)
    app.get("/api/blog", async (req, res) => {
        try {
            const blogPosts = await storage.getBlogPosts();
            // Return all blog posts without time filtering for now
            // Sort by most recent first
            const sortedPosts = blogPosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
            res.json(sortedPosts);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch blog posts" });
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
        }
        catch (error) {
            console.error('Get blog post error:', error);
            res.status(500).json({ message: 'Failed to fetch blog post' });
        }
    });
    app.delete('/api/admin/blog/:id', async (req, res) => {
        try {
            const bodyPassword = typeof req.body?.password === 'string' ? req.body.password : undefined;
            const adminPwd = typeof req.body?.adminPassword === 'string' ? req.body.adminPassword : undefined;
            const headerPwd = (req.headers['x-admin-password'] || req.headers['X-Admin-Password'] || undefined);
            const queryPwd = typeof req.query?.password === 'string' ? req.query.password : undefined;
            const password = (bodyPassword || adminPwd || headerPwd || queryPwd || '').toString();
            if (!await verifyAdminPassword(password)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const id = parseInt(req.params.id);
            const deleted = await storage.deleteBlogPost(id);
            if (deleted) {
                res.json({ message: 'Blog post deleted successfully' });
            }
            else {
                res.status(404).json({ message: 'Blog post not found' });
            }
        }
        catch (error) {
            console.error('Delete blog post error:', error);
            res.status(500).json({ message: 'Failed to delete blog post' });
        }
    });
    app.put('/api/admin/blog/:id', async (req, res) => {
        try {
            const { password: bodyPassword, adminPassword, ...updates } = req.body || {};
            const headerPwd = (req.headers['x-admin-password'] || req.headers['X-Admin-Password'] || undefined);
            const queryPwd = typeof req.query?.password === 'string' ? req.query.password : undefined;
            const password = (bodyPassword || adminPassword || headerPwd || queryPwd || '').toString();
            if (!await verifyAdminPassword(password)) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const id = parseInt(req.params.id);
            const blogPost = await storage.updateBlogPost(id, updates);
            if (blogPost) {
                res.json({ message: 'Blog post updated successfully', blogPost });
            }
            else {
                res.status(404).json({ message: 'Blog post not found' });
            }
        }
        catch (error) {
            console.error('Update blog post error:', error);
            res.status(500).json({ message: 'Failed to update blog post' });
        }
    });
    // Master Bot Telegram Webhook Endpoint
    app.post('/webhook/master/:token', express.json(), async (req, res) => {
        try {
            const { token } = req.params;
            const update = req.body;
            console.log('🤖 Master bot webhook received:', {
                token: token.substring(0, 10) + '...',
                updateType: update.channel_post ? 'channel_post' : update.message ? 'message' : 'other',
                messageId: update.channel_post?.message_id || update.message?.message_id,
                chatId: update.channel_post?.chat?.id || update.message?.chat?.id,
                chatTitle: update.channel_post?.chat?.title || update.message?.chat?.title
            });
            // Verify token matches master bot token
            const expectedToken = process.env.MASTER_BOT_TOKEN;
            if (token !== expectedToken) {
                console.error('❌ Invalid webhook token for master bot');
                return res.status(401).json({ error: 'Invalid token' });
            }
            // Check global processing toggle; if disabled, acknowledge and skip
            try {
                const ctrl = await import('./server/bot-processing-controller.js');
                const isEnabled = (ctrl?.botProcessingController?.isEnabled?.() ?? ctrl?.default?.isEnabled?.()) ?? true;
                if (!isEnabled) {
                    console.log('⏸️ Bot processing is currently disabled. Skipping update.');
                    return res.status(200).json({ ok: true, skipped: true });
                }
            } catch (toggleErr) {
                console.warn('⚠️ Could not load bot-processing-controller; proceeding by default:', toggleErr?.message || toggleErr);
            }
            // Process webhook through TelegramBotManager
            try {
                console.log('🔄 Importing telegram-bot module...');
                const telegramBot = await import('./telegram-bot');
                console.log('🔄 Getting TelegramBotManager instance...');
                const botManager = telegramBot.TelegramBotManager.getInstance();
                // Handle channel posts and messages
                if (update.channel_post) {
                    console.log('🔄 Processing channel post...');
                    await botManager.processChannelPost(update.channel_post);
                    console.log('✅ Channel post processed');
                }
                else if (update.message) {
                    console.log('🔄 Processing message...');
                    await botManager.processMessage(update.message);
                    console.log('✅ Message processed');
                }
                else {
                    console.log('⚠️ No channel_post or message found in update');
                }
                console.log('✅ Master bot webhook processed successfully');
            }
            catch (error) {
                console.error('❌ Failed to process master bot webhook update:', error);
                console.error('Error stack:', error.stack);
            }
            res.status(200).json({ ok: true });
        }
        catch (error) {
            console.error('❌ Master bot webhook error:', error);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    });
    console.log('✅ Clean routes setup completed - using unified_content table with display_pages filtering');
}
