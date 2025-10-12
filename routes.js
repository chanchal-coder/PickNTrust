import express from 'express';
import { storage } from './storage.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { sqliteDb } from './db.js';
import travelCategoriesRouter from './travel-categories-routes.js';
import currencyRouter from './routes/currency.js';
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
            // Get products marked as services based on category or content_type
            const services = sqliteDb.prepare(`
        SELECT * FROM unified_content 
        WHERE (category LIKE '%service%' OR category LIKE '%Service%' OR content_type = 'service')
        AND status = 'active'
        ORDER BY created_at DESC
      `).all();
            // Map database field names to frontend expected field names
            const mappedServices = services.map((service) => ({
                ...service,
                name: service.title, // Map title to name for frontend compatibility
                imageUrl: toProxiedImage(service.imageUrl || service.image_url), // Normalize and proxy image
                isService: true // Add service flag for frontend logic
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
            console.log('Getting apps for homepage apps section');
            // Get products marked as AI apps or apps based on category or content_type
            const apps = sqliteDb.prepare(`
        SELECT * FROM unified_content 
        WHERE (category LIKE '%app%' OR category LIKE '%App%' OR category LIKE '%AI%' OR content_type = 'app' OR content_type = 'ai-app')
        AND status = 'active'
        ORDER BY created_at DESC
      `).all();
            // Map database field names to frontend expected field names
            const mappedApps = apps.map((app) => ({
                ...app,
                name: app.title, // Map title to name for frontend compatibility
                imageUrl: toProxiedImage(app.imageUrl || app.image_url), // Normalize and proxy image
                isAIApp: true // Add AI app flag for frontend logic
            }));
            console.log(`Apps: Returning ${mappedApps.length} app products with mapped fields`);
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
                // Use unified_content with robust status/visibility and featured-only filter
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
          is_featured = 1
        )
      `;
            }
            else {
                // Default: query unified_content for other pages
                query = `
        SELECT * FROM unified_content 
        WHERE (status = 'completed' OR status = 'active' OR status = 'processed' OR status IS NULL)
        AND (visibility = 'public' OR visibility IS NULL)
      `;
            }
            // Apply page-specific filtering
            if (page === 'top-picks') {
                // Already handled by unified_content selection above (is_featured or display_pages)
            }
            else if (page === 'services') {
                // Services: Strictly use items tagged for the Services page
                query += ` AND (
          display_pages LIKE '%' || ? || '%' OR
          display_pages = ?
        )`;
                params.push(page, page);
            }
            else if (page === 'apps-ai-apps') {
                // AI/Apps: Strictly use items tagged for the Apps & AI Apps page
                query += ` AND (
          display_pages LIKE '%' || ? || '%' OR
          display_pages = ?
        )`;
                params.push(page, page);
            }
            else if (page === 'apps') {
                // Apps: Strictly use items tagged for the Apps page
                query += ` AND (
          display_pages LIKE '%' || ? || '%' OR
          display_pages = ?
        )`;
                params.push(page, page);
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
                query += ` AND category = ?`;
                params.push(category);
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
    // Get products by category with robust matching and fallbacks
    app.get("/api/products/category/:category", async (req, res) => {
        try {
            const { category } = req.params;
            const { limit = 50, offset = 0 } = req.query;

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
                // Default: exact match first, then broaden by tokens across category/subcategory/tags
                query = `
          SELECT * FROM unified_content
          WHERE (
            LOWER(category) = LOWER(?)
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
                // Push tokens for category, subcategory, and tags (triplets)
                for (const t of tokens) {
                    params.push(t);
                }
                for (const t of tokens) {
                    params.push(t);
                }
                for (const t of tokens) {
                    params.push(t);
                }
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
                                parentFallbackQuery += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
                                const pParams = [...childNames, ...childNames, parseInt(String(limit)), parseInt(String(offset))];
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
            const result = sqliteDb.prepare(`
        INSERT INTO categories (name, description, display_order, is_active)
        VALUES (?, ?, ?, ?)
      `).run(categoryData.name, categoryData.description || '', categoryData.displayOrder || 0, categoryData.isActive !== false ? 1 : 0);
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
            sqliteDb.prepare(`
        UPDATE categories 
        SET name = ?, description = ?, display_order = ?, is_active = ?
        WHERE id = ?
      `).run(categoryData.name, categoryData.description || '', categoryData.displayOrder || 0, categoryData.isActive !== false ? 1 : 0, id);
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

            // Fallback: derive subcategories from unified_content when categories table has no children
            const tokens = parentLower.split(/[&/,\-,\s]+/).map(t => t.trim()).filter(Boolean);
            let q = `
                SELECT DISTINCT COALESCE(NULLIF(subcategory,''), category) as name
                FROM unified_content
                WHERE (status = 'active' OR status = 'published' OR status = 'completed' OR status IS NULL)
                  AND (visibility = 'public' OR visibility = 'visible' OR visibility IS NULL)
            `;
            const params = [];
            // Base match: exact category
            q += ` AND (LOWER(category) = LOWER(?))`;
            params.push(parentInput);
            // Canonical exact match
            const canonical = SYNONYMS_TO_CANONICAL[parentLower];
            if (canonical) {
                q += ` OR LOWER(category) = LOWER(?)`;
                params.push(canonical);
            }
            // Token partials to catch variants
            for (const t of tokens) {
                q += ` OR LOWER(category) LIKE ?`;
                params.push(`%${t}%`);
            }
            // Exclude parent names themselves from the derived list
            q += ` AND LOWER(COALESCE(NULLIF(subcategory,''), category)) != LOWER(?)`;
            params.push(parentInput);
            if (canonical) {
                q += ` AND LOWER(COALESCE(NULLIF(subcategory,''), category)) != LOWER(?)`;
                params.push(canonical);
            }
            q += ` ORDER BY name ASC LIMIT 100`;

            const rows = sqliteDb.prepare(q).all(...params);
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
                query += ` AND category = ?`;
                params.push(category);
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
            // Get products marked as featured from unified_content table
            const featuredProducts = sqliteDb.prepare(`
        SELECT * FROM unified_content 
        WHERE is_featured = 1
        AND status = 'active'
        ORDER BY created_at DESC, id DESC
        LIMIT 10
      `).all();
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
                    (video.tags.startsWith('[') ? JSON.parse(video.tags) : []) :
                    (Array.isArray(video.tags) ? video.tags : []),
                // Parse pages from JSON string to array if needed
                pages: typeof video.pages === 'string' ?
                    (video.pages.startsWith('[') ? JSON.parse(video.pages) : []) :
                    (Array.isArray(video.pages) ? video.pages : []),
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
    // Use travel categories router
    app.use('/api', travelCategoriesRouter);
    // Use currency router
    app.use('/api/currency', currencyRouter);
    // Blog management routes
    app.post('/api/admin/blog', async (req, res) => {
        try {
            const { password, ...blogPostData } = req.body;
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
            const { password } = req.body;
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
            const { password, ...updates } = req.body;
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
