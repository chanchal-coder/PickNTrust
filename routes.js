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
            // Query unified_content table for all pages
            query = `
        SELECT * FROM unified_content 
        WHERE (status = 'completed' OR status = 'active' OR status = 'processed' OR status IS NULL)
        AND (visibility = 'public' OR visibility IS NULL)
      `;
            // Apply page-specific filtering
            if (page === 'top-picks') {
                // Featured Products: Show only products with is_featured=1
                query += ` AND is_featured = 1`;
            }
            else if (page === 'services') {
                // Services: Show only products with is_service=1
                query += ` AND is_service = 1`;
            }
            else if (page === 'apps-ai-apps' || page === 'apps') {
                // AI & Apps: Show only products with is_ai_app=1
                query += ` AND is_ai_app = 1`;
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
            query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
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
            const rawProducts = await retryDatabaseOperation(() => {
                return sqliteDb.prepare(query).all(...params);
            });
            // Transform the data to match the expected frontend format with error handling
            const products = rawProducts.map((product) => {
                try {
                    let transformedProduct = {
                        id: product.id,
                        name: product.title || 'Untitled Product',
                        description: product.description || 'No description available',
                        price: product.price,
                        originalPrice: product.originalPrice,
                        currency: product.currency || 'INR',
                        imageUrl: product.imageUrl,
                        affiliateUrl: product.affiliateUrl,
                        category: product.category,
                        rating: product.rating || 0,
                        reviewCount: product.reviewCount || 0,
                        discount: product.discount,
                        isNew: product.isNew === 1,
                        isFeatured: product.isFeatured === 1,
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
                    // Fallback to affiliateUrl field if affiliate_urls is not available
                    if (!transformedProduct.affiliateUrl && product.affiliateUrl) {
                        transformedProduct.affiliateUrl = product.affiliateUrl;
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
    // Get products by category for a specific page
    app.get("/api/products/category/:category", async (req, res) => {
        try {
            const { category } = req.params;
            const { page = 'home', limit = 50, offset = 0 } = req.query;
            console.log(`Getting products for category: "${category}", page: "${page}"`);
            const products = sqliteDb.prepare(`
        SELECT * FROM unified_content 
        WHERE category = ?
        AND (display_pages LIKE '%' || ? || '%' OR display_pages IS NULL OR display_pages = '')
        AND (status = 'active' OR status IS NULL)
        AND is_active = 1
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `).all(category, page, parseInt(limit), parseInt(offset));
            console.log(`Found ${products.length} products for category "${category}"`);
            res.json(products);
        }
        catch (error) {
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
            const transformedProducts = products.map((product) => ({
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
                isFeatured: product.isFeatured,
                createdAt: product.createdAt
            }));
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
            res.json(featuredProducts);
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
