import express, { Request, Response } from 'express';
import { storage } from './storage.js';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { db, sqliteDb } from './db.js';
import { UnifiedContent, MappedUnifiedContent } from './types.js';
import travelCategoriesRouter from './travel-categories-routes.js';
import currencyRouter from './routes/currency.js';
import canvaAdminRouter from './canva-admin-routes.js';
import multer from 'multer';
import { commissionRateManager } from './commission-rate-manager.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Admin password verification
async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    // For localhost development, allow simple password
    if (password === 'pickntrust2025' || password === 'admin' || password === 'delete') {
      return true;
    }
    
    // Try to check admin_users table if it exists
    try {
      const adminUser = sqliteDb.prepare('SELECT password_hash FROM admin_users WHERE username = ?').get('admin') as any;
      if (adminUser) {
        return await bcrypt.compare(password, adminUser.password_hash);
      }
    } catch (error) {
      // admin_users table doesn't exist, fall back to simple password check
      console.log('admin_users table not found, using simple password check');
    }
    
    return false;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Enhanced error handling middleware
function handleDatabaseError(error: any, res: express.Response, operation: string) {
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
async function retryDatabaseOperation<T>(
  operation: () => T,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return operation();
    } catch (error: any) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Only retry on specific errors
      if (error.code === 'SQLITE_BUSY' || error.code === 'SQLITE_LOCKED') {
        console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error; // Don't retry on other errors
      }
    }
  }
  throw new Error('Max retries exceeded');
}

export function setupRoutes(app: express.Application) {
  // Initialize multer for CSV uploads (memory storage)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
  });

  // Static hosting for uploaded files and general media upload endpoints
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'uploads');
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch {}

  // Serve uploaded files from /uploads
  app.use('/uploads', express.static(uploadDir));

  // Disk storage for general file/image/video uploads
  const mediaStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const unique = `${base}-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, unique);
    },
  });

  const mediaUpload = multer({
    storage: mediaStorage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
    fileFilter: (_req, file, cb) => {
      const ok = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf';
      if (ok) return cb(null, true);
      cb(new Error('Unsupported file type'));
    },
  });

  // Single file upload (expects field name 'file')
  app.post('/api/upload', mediaUpload.single('file'), (req, res) => {
    try {
      const f = (req as any).file;
      if (!f) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      const url = `/uploads/${f.filename}`;
      return res.json({ url, filename: f.originalname, mimetype: f.mimetype, size: f.size });
    } catch (e: any) {
      console.error('Upload error:', e);
      return res.status(500).json({ message: 'Upload failed', error: String(e?.message || e) });
    }
  });

  // Multiple file upload (optional support for image and video fields)
  app.post('/api/upload/multiple', mediaUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]), (req, res) => {
    try {
      const files = (req as any).files || {};
      const imageFile = Array.isArray(files.image) ? files.image[0] : undefined;
      const videoFile = Array.isArray(files.video) ? files.video[0] : undefined;
      const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : null;
      const videoUrl = videoFile ? `/uploads/${videoFile.filename}` : null;
      return res.json({ imageUrl, videoUrl });
    } catch (e: any) {
      console.error('Upload/multiple error:', e);
      return res.status(500).json({ message: 'Upload failed', error: String(e?.message || e) });
    }
  });

  // Minimal CSV parser (supports quoted fields and commas inside quotes)
  function parseCSV(text: string): { headers: string[]; rows: Record<string, any>[] } {
    const input = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = input.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
      result.push(current);
      return result.map(v => v.trim());
    };

    const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
    const rows: Record<string, any>[] = [];

    for (let li = 1; li < lines.length; li++) {
      const values = parseLine(lines[li]).map(v => v.replace(/^"|"$/g, ''));
      const row: Record<string, any> = {};
      headers.forEach((h, idx) => {
        row[h] = typeof values[idx] !== 'undefined' ? values[idx] : '';
      });
      rows.push(row);
    }
    return { headers, rows };
  }

  // Commission CSV Upload (admin panel)
  app.post('/api/admin/upload-commission-csv', upload.single('csvFile'), async (req, res) => {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ success: false, error: 'Missing csvFile' });
      }

      const csvText = file.buffer.toString('utf-8');
      const { rows } = parseCSV(csvText);
      if (!rows || rows.length === 0) {
        return res.status(400).json({ success: false, error: 'Empty CSV' });
      }

      // Normalize common header variants to expected keys
      const normalized = rows.map((r) => ({
        network: r.network ?? r.network_name ?? r.Network ?? r['Network'] ?? r['affiliate_network'],
        category: r.category ?? r.category_name ?? r.Category ?? r['Category'],
        rate: r.rate ?? r.commission_rate ?? r.Rate ?? r['Rate'] ?? r['commission_rate'],
        minRate: r.minRate ?? r.MinRate ?? r['min_rate'] ?? r['MinRate'],
        maxRate: r.maxRate ?? r.MaxRate ?? r['max_rate'] ?? r['MaxRate'],
      }));

      const updatedCount = await commissionRateManager.updateRatesFromCSV(normalized, 'csv');
      return res.json({ success: true, count: updatedCount });
    } catch (error: any) {
      console.error('Commission CSV upload error:', error);
      return res.status(500).json({ success: false, error: error?.message || 'Failed to process CSV' });
    }
  });

  // Helper to normalize product image URLs and route through proxy
  function toProxiedImage(url?: string | null): string {
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
  // API endpoint for services (used by CardsAppsServices and services page)
  app.get("/api/services", async (req, res) => {
    try {
      console.log('Getting services with inclusive filters (is_service/category/content_type)');

      // Inclusive filtering to avoid empty results across legacy data
      const services = sqliteDb.prepare(`
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
            visibility = 'public' OR visibility IS NULL
          )
          AND (
            processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL
          )
        ORDER BY created_at DESC
      `).all() as UnifiedContent[];

      // Map database field names to frontend expected field names
      const mappedServices = services.map((service: UnifiedContent): MappedUnifiedContent => ({
        ...service,
        name: service.title,
        imageUrl: toProxiedImage(service.imageUrl || service.image_url),
        isService: true,
        // Ensure pricing fields are present in camelCase for frontend
        originalPrice: (service as any).originalPrice ?? (service as any).original_price ?? null,
        pricingType: (service as any).pricingType ?? (service as any).pricing_type ?? undefined,
        monthlyPrice: (service as any).monthlyPrice ?? (service as any).monthly_price ?? undefined,
        yearlyPrice: (service as any).yearlyPrice ?? (service as any).yearly_price ?? undefined,
        isFree: (service as any).isFree ?? (typeof (service as any).is_free !== 'undefined' ? Boolean((service as any).is_free) : undefined),
        priceDescription: (service as any).priceDescription ?? (service as any).price_description ?? undefined,
      }));

      console.log(`Services: Returning ${mappedServices.length} service products (inclusive filters)`);
      res.json(mappedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.json([]);
    }
  });

  // API endpoint for apps (used by AppsAIApps and apps page)
  app.get("/api/products/apps", async (req, res) => {
    try {
      console.log('Getting apps with inclusive filters (is_ai_app/category/content_type)');

      // Inclusive filtering to avoid empty results across legacy data
      const apps = sqliteDb.prepare(`
        SELECT * FROM unified_content
        WHERE (
          is_ai_app = 1
          OR category LIKE '%app%'
          OR category LIKE '%App%'
          OR category LIKE '%AI%'
          OR content_type = 'app'
          OR content_type = 'ai-app'
        )
          AND (
            status = 'active' OR status = 'published' OR status IS NULL
          )
          AND (
            visibility = 'public' OR visibility IS NULL
          )
          AND (
            processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL
          )
        ORDER BY created_at DESC
      `).all() as UnifiedContent[];

      // Map database field names to frontend expected field names
      const mappedApps = apps.map((app: UnifiedContent): MappedUnifiedContent => ({
        ...app,
        name: app.title,
        imageUrl: toProxiedImage(app.imageUrl || app.image_url),
        isAIApp: true,
        // Ensure pricing fields are present in camelCase for frontend
        originalPrice: (app as any).originalPrice ?? (app as any).original_price ?? null,
        pricingType: (app as any).pricingType ?? (app as any).pricing_type ?? undefined,
        monthlyPrice: (app as any).monthlyPrice ?? (app as any).monthly_price ?? undefined,
        yearlyPrice: (app as any).yearlyPrice ?? (app as any).yearly_price ?? undefined,
        isFree: (app as any).isFree ?? (typeof (app as any).is_free !== 'undefined' ? Boolean((app as any).is_free) : undefined),
        priceDescription: (app as any).priceDescription ?? (app as any).price_description ?? undefined,
      }));

      console.log(`Apps: Returning ${mappedApps.length} app products (inclusive filters)`);
      res.json(mappedApps);
    } catch (error) {
      console.error('Error fetching apps:', error);
      res.json([]);
    }
  });

  // Public testimonials endpoint for dynamic "What Our Customers Say"
  app.get('/api/testimonials', (req, res) => {
    try {
      const limitParam = (req.query.limit as string) || '9';
      const limit = Math.max(1, Math.min(24, parseInt(limitParam, 10) || 9));

      const base = [
        { id: 1, name: 'Priya Sharma', location: 'Mumbai', rating: 5, comment: 'Amazing deals and genuine products! Saved over ₹15,000 on my smartphone purchase.', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b047?ixlib=rb-4.0.3&w=128&h=128&fit=crop&crop=face' },
        { id: 2, name: 'Raj Patel', location: 'Delhi', rating: 5, comment: 'Transparent affiliate links and honest reviews. Trust PickNTrust for all my online shopping!', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2c?ixlib=rb-4.0.3&w=128&h=128&fit=crop&crop=face' },
        { id: 3, name: 'Sneha Gupta', location: 'Bangalore', rating: 5, comment: 'The best deals and cashback offers. Their recommendations never disappoint!', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&w=128&h=128&fit=crop&crop=face' },
        { id: 4, name: 'Aarav Mehta', location: 'Pune', rating: 5, comment: 'Got a genuine product at the lowest price. Love their honest approach.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&w=128&h=128&fit=crop&crop=face' },
        { id: 5, name: 'Isha Verma', location: 'Noida', rating: 5, comment: 'Super helpful reviews and clear disclosures. No hidden catches!', avatar: 'https://images.unsplash.com/photo-1544005319-6e6e0a87f22b?ixlib=rb-4.0.3&w=128&h=128&fit=crop&crop=face' },
        { id: 6, name: 'Vikram Singh', location: 'Jaipur', rating: 4, comment: 'Found an amazing deal on earphones. Keep up the good work!', avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?ixlib=rb-4.0.3&w=128&h=128&fit=crop&crop=face' },
        { id: 7, name: 'Neha Kapoor', location: 'Chennai', rating: 5, comment: 'Genuine recommendations. Saved time and money!', avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?ixlib=rb-4.0.3&w=128&h=128&fit=crop&crop=face' },
        { id: 8, name: 'Rohan Das', location: 'Kolkata', rating: 4, comment: 'Appreciate the transparent affiliate policy. Very trustworthy.', avatar: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixlib=rb-4.0.3&w=128&h=128&fit=crop&crop=face' },
        { id: 9, name: 'Pooja Nair', location: 'Hyderabad', rating: 5, comment: 'Best place to discover genuine products and deals.', avatar: 'https://images.unsplash.com/photo-1529139574466-a303019a6958?ixlib=rb-4.0.3&w=128&h=128&fit=crop&crop=face' },
        { id: 10, name: 'Kunal Arora', location: 'Gurgaon', rating: 5, comment: 'Prices and reviews are accurate. Really helpful site.', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-4.0.3&w=128&h=128&fit=crop&crop=face' },
        { id: 11, name: 'Ananya Iyer', location: 'Coimbatore', rating: 5, comment: 'Consistent quality and honest content.', avatar: 'https://images.unsplash.com/photo-1544005313-83e3c3f67af8?ixlib=rb-4.0.3&w=128&h=128&fit=crop&crop=face' },
        { id: 12, name: 'Dev Patel', location: 'Ahmedabad', rating: 4, comment: 'Solid resource for choosing gadgets.', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-4.0.3&w=128&h=128&fit=crop&crop=face' }
      ];

      const shuffled = base
        .map((item) => ({ item, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ item }) => item);

      res.json(shuffled.slice(0, limit));
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      res.status(500).json({ error: 'Failed to fetch testimonials' });
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
      
      const parsedLimit = Math.min(Math.max(parseInt(limit as string) || 50, 1), 100);
      const parsedOffset = Math.max(parseInt(offset as string) || 0, 0);
      
      console.log(`Getting products for page: "${page}"`);
      
      let query = '';
      const params: any[] = [];
      
      // Query unified_content table for all pages
      query = `
        SELECT * FROM unified_content 
        WHERE is_active = 1
      `;
      
      // Apply page-specific filtering
      if (page === 'top-picks') {
        // Featured Products: Show only products with is_featured=1
        query += ` AND is_featured = 1`;
      } else if (page === 'services') {
        // Services: Show only products with is_service=1
        query += ` AND is_service = 1`;
      } else if (page === 'apps-ai-apps' || page === 'apps') {
        // AI & Apps: Show only products with is_ai_app=1
        query += ` AND is_ai_app = 1`;
      } else {
        // For all other pages, use proper JSON filtering for display_pages
        // This handles both JSON arrays and simple strings for backward compatibility
        query += ` AND (
          JSON_EXTRACT(display_pages, '$') LIKE '%' || ? || '%' OR
          display_pages LIKE '%' || ? || '%' OR
          display_pages = ? OR
          (display_pages IS NULL AND ? = 'prime-picks') OR
          (display_pages = '' AND ? = 'prime-picks')
        )`;
        params.push(page, page, page, page, page);
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
        } catch {}
      } catch (logErr) {
        // Ignore logging errors
      }

      const rawProducts = await retryDatabaseOperation(() => {
        return sqliteDb.prepare(query).all(...params) as UnifiedContent[];
      });
      
      // Transform the data to match the expected frontend format with error handling
      const products = rawProducts.map((product: UnifiedContent) => {
        try {
          let transformedProduct: Partial<MappedUnifiedContent> = {
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
            createdAt: product.createdAt,
            // Add service/app pricing fields mapping
            pricingType: (product as any).pricingType ?? (product as any).pricing_type ?? undefined,
            monthlyPrice: (product as any).monthlyPrice ?? (product as any).monthly_price ?? undefined,
            yearlyPrice: (product as any).yearlyPrice ?? (product as any).yearly_price ?? undefined,
            isFree: (product as any).isFree ?? (typeof (product as any).is_free !== 'undefined' ? Boolean((product as any).is_free) : undefined),
            priceDescription: (product as any).priceDescription ?? (product as any).price_description ?? undefined,
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
            } catch (e) {
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
            } catch (e) {
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

          // Timer fields mapping: hasTimer, timerDuration (hours), timerStartTime
          try {
            // Determine hasTimer from camelCase or snake_case
            const rawHasTimer = (product as any).hasTimer ?? (product as any).has_timer;
            const hasTimer = typeof rawHasTimer === 'boolean'
              ? rawHasTimer
              : (typeof rawHasTimer === 'number' ? rawHasTimer === 1 : Boolean(rawHasTimer));

            // Parse content JSON once for cookieDurationDays fallback
            let contentData: any = null;
            if ((product as any).content) {
              try {
                contentData = JSON.parse((product as any).content);
              } catch {}
            }

            // Duration (hours): prefer explicit timer_duration, else cookieDurationDays * 24
            let timerDuration: number | null = null;
            const rawDuration = (product as any).timerDuration ?? (product as any).timer_duration;
            if (typeof rawDuration === 'number') {
              timerDuration = rawDuration > 0 ? rawDuration : null;
            } else if (typeof rawDuration === 'string') {
              const parsed = parseInt(rawDuration, 10);
              timerDuration = isNaN(parsed) || parsed <= 0 ? null : parsed;
            }
            if (!timerDuration && contentData && typeof contentData.cookieDurationDays !== 'undefined') {
              const days = Number(contentData.cookieDurationDays);
              if (!isNaN(days) && days > 0) {
                timerDuration = Math.floor(days * 24);
              }
            }

            // Start time: prefer timer_start_time, else created_at when timer is enabled
            let timerStartRaw: any = (product as any).timerStartTime ?? (product as any).timer_start_time;
            if (!timerStartRaw && hasTimer) {
              timerStartRaw = (product as any).created_at ?? (product as any).createdAt ?? Date.now();
            }
            let timerStartTime: string | null = null;
            if (timerStartRaw) {
              let ms: number;
              if (typeof timerStartRaw === 'string') {
                const n = Number(timerStartRaw);
                if (!isNaN(n)) {
                  ms = n;
                } else {
                  // If string date, pass through
                  timerStartTime = new Date(timerStartRaw).toISOString();
                  ms = NaN;
                }
              } else if (typeof timerStartRaw === 'number') {
                ms = timerStartRaw;
              } else if (timerStartRaw instanceof Date) {
                ms = timerStartRaw.getTime();
              } else {
                ms = Date.now();
              }
              if (!timerStartTime) {
                // Normalize seconds → milliseconds if the value looks like seconds
                if (ms < 10_000_000_000) {
                  ms = ms * 1000;
                }
                timerStartTime = new Date(ms).toISOString();
              }
            }

            // Assign only if timer is enabled and we have a duration
            transformedProduct.hasTimer = Boolean(hasTimer) && Boolean(timerDuration);
            transformedProduct.timerDuration = transformedProduct.hasTimer ? timerDuration : null;
            transformedProduct.timerStartTime = transformedProduct.hasTimer ? timerStartTime : null;
          } catch (timerMapErr) {
            console.warn(`Timer mapping failed for product ${product.id}:`, timerMapErr);
            transformedProduct.hasTimer = false;
            transformedProduct.timerDuration = null;
            transformedProduct.timerStartTime = null;
          }

          // Parse affiliate_urls for affiliate link with error handling
          if (product.affiliate_urls) {
            try {
              const affiliateUrls = JSON.parse(product.affiliate_urls);
              if (Array.isArray(affiliateUrls) && affiliateUrls.length > 0) {
                transformedProduct.affiliateUrl = affiliateUrls[0];
              }
            } catch (e) {
              console.warn(`Failed to parse affiliate_urls for product ${product.id}:`, e);
            }
          }

          // Fallback to affiliateUrl field if affiliate_urls is not available
          if (!transformedProduct.affiliateUrl && product.affiliateUrl) {
            transformedProduct.affiliateUrl = product.affiliateUrl;
          }

          return transformedProduct;
        } catch (productError) {
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
    } catch (error) {
      try {
        console.error("Error in products page endpoint:", error);
        // Attempt to log additional context
        console.error('Endpoint context:', {
          page: req.params?.page,
          category: req.query?.category,
          limit: req.query?.limit,
          offset: req.query?.offset
        });
      } catch (ctxErr) {
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
      const text = (req.query.text as string) || 'No Image';
      const bg = (req.query.bg as string) || '#e5e7eb'; // Tailwind gray-200
      const fg = (req.query.fg as string) || '#6b7280'; // Tailwind gray-500

      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(
        `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <g fill="${fg}" font-family="Arial, Helvetica, sans-serif" font-size="${Math.max(Math.min(Math.floor(width / 10), 24), 12)}" text-anchor="middle">
    <text x="50%" y="50%" dominant-baseline="middle">${text}</text>
  </g>
</svg>`
      );
    } catch (err) {
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
          AND is_active = 1
        `).all(page, page, page);
      });
      
      const categories = products
        .map((p: any) => p.category)
        .filter(cat => cat && cat.trim() !== '')
        .sort();
      
      console.log(`Found ${categories.length} categories for page "${page}": ${categories.join(', ')}`);
      res.json(categories);
    } catch (error) {
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
      
      // If page=all, do not filter by display_pages. Otherwise, include robust JSON/string matching.
      let query = `
        SELECT * FROM unified_content 
        WHERE category = ?
        AND is_active = 1
      `;

      const params: any[] = [category];

      if ((page as string) !== 'all') {
        query += ` AND (
          JSON_EXTRACT(display_pages, '$') LIKE '%' || ? || '%'
          OR display_pages LIKE '%' || ? || '%'
          OR display_pages = ?
          OR display_pages IS NULL
          OR display_pages = ''
        )`;
        params.push(page, page, page);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit as string), parseInt(offset as string));

      const products = sqliteDb.prepare(query).all(...params);
      
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
      `).run(
        categoryData.name,
        categoryData.description || '',
        categoryData.displayOrder || 0,
        categoryData.isActive !== false ? 1 : 0
      );

      res.json({ id: result.lastInsertRowid, ...categoryData });
    } catch (error) {
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
      `).run(
        categoryData.name,
        categoryData.description || '',
        categoryData.displayOrder || 0,
        categoryData.isActive !== false ? 1 : 0,
        id
      );

      res.json({ id, ...categoryData });
    } catch (error) {
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
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Failed to delete category' });
    }
  });

  // Get all categories from categories table
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = sqliteDb.prepare(`
        SELECT name, name as id
        FROM categories 
        WHERE is_active = 1
        ORDER BY display_order ASC, name ASC
      `).all();
      
      res.json(categories);
    } catch (error) {
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
          AND c.is_active = 1
          AND (
            uc.processing_status = 'completed' 
            OR uc.processing_status = 'active' 
            OR uc.processing_status IS NULL
          )
          AND (
            uc.visibility = 'public' 
            OR uc.visibility IS NULL
          )
          AND (
            uc.status = 'active' 
            OR uc.status = 'published' 
            OR uc.status IS NULL
          )
          ${typeFilter}
        GROUP BY c.id, c.name, c.icon, c.color, c.description, c.parent_id, c.is_for_products, c.is_for_services, c.is_for_ai_apps, c.display_order
        HAVING COUNT(uc.id) > 0
        ORDER BY c.display_order ASC, c.name ASC
      `;
      
      console.log('🔍 Executing query:', query);
      const categories = sqliteDb.prepare(query).all();
      console.log('🔍 Query result:', categories);
      
      res.json(categories);
    } catch (error) {
      console.error('Error fetching browse categories:', error);
      res.status(500).json({ message: 'Failed to fetch browse categories' });
    }
  });

  // Get categories filtered by type for browse sections (only categories with content)
  app.get('/api/categories/products', async (req, res) => {
    try {
      // More robust count logic: handle singular/plural and known category aliases
      // This mirrors the matching used in browse categories to avoid zero/incorrect counts
      const categories = sqliteDb.prepare(`
        SELECT 
          c.name,
          c.id,
          COALESCE((
            SELECT COUNT(uc.id)
            FROM unified_content uc
            WHERE (
              uc.category = c.name
              OR uc.category = REPLACE(c.name, 's', '')
              OR uc.category = c.name || 's'
              OR (c.name = 'Technology Services' AND uc.category = 'Technology Service')
              OR (c.name = 'AI Photo Apps' AND uc.category = 'AI Photo App')
              OR (c.name = 'AI Applications' AND uc.category = 'AI App')
            )
            AND (uc.category IS NOT NULL AND uc.category != '')
            AND (uc.processing_status = 'completed' OR uc.processing_status = 'active' OR uc.processing_status IS NULL)
            AND (uc.visibility = 'public' OR uc.visibility IS NULL)
            AND (uc.status = 'published' OR uc.status = 'active' OR uc.status IS NULL)
            AND (uc.is_service IS NULL OR uc.is_service = 0)
            AND (uc.is_ai_app IS NULL OR uc.is_ai_app = 0)
          ), 0) AS count
        FROM categories c
        WHERE c.is_for_products = 1 AND c.is_active = 1
        ORDER BY c.display_order ASC, c.name ASC
      `).all();

      res.json(categories);
    } catch (error) {
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
        WHERE c.is_for_services = 1 AND c.is_active = 1
        ORDER BY c.display_order ASC, c.name ASC
      `).all();
      
      res.json(categories);
    } catch (error) {
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
        WHERE c.is_for_ai_apps = 1 AND c.is_active = 1
        ORDER BY c.display_order ASC, c.name ASC
      `).all();
      
      res.json(categories);
    } catch (error) {
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
        WHERE (c.is_for_products = 1 OR c.is_for_products IS NULL)
          AND c.is_active = 1
        ORDER BY c.display_order ASC, c.name ASC
      `).all();
      
      res.json(categories);
    } catch (error) {
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
        WHERE (c.is_for_services = 1 OR c.is_for_services IS NULL)
          AND c.is_active = 1
        ORDER BY c.display_order ASC, c.name ASC
      `).all();
      
      res.json(categories);
    } catch (error) {
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
        WHERE (c.is_for_ai_apps = 1 OR c.is_for_ai_apps IS NULL)
          AND c.is_active = 1
        ORDER BY c.display_order ASC, c.name ASC
      `).all();
      
      res.json(categories);
    } catch (error) {
      console.error('Error fetching form AI app categories:', error);
      res.status(500).json({ message: 'Failed to fetch form AI app categories' });
    }
  });

  // All products endpoint (for admin panel)
  app.get('/api/products', async (req, res) => {
    try {
      const { limit = 100, offset = 0, category, search } = req.query;
      
      const parsedLimit = Math.min(Math.max(parseInt(limit as string) || 100, 1), 500);
      const parsedOffset = Math.max(parseInt(offset as string) || 0, 0);
      
      let query = `
        SELECT * FROM unified_content 
        WHERE status = 'active'
      `;
      
      const params: any[] = [];
      
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
      
      const products = await retryDatabaseOperation(() => 
        sqliteDb.prepare(query).all(...params) as UnifiedContent[]
      );
      
      // Transform data for frontend
      const transformedProducts = products.map((product: UnifiedContent): Partial<MappedUnifiedContent> => ({
        id: product.id,
        name: product.title, // Use title as name
        description: product.description || '',
        price: product.price || '0',
        originalPrice: product.original_price || product.originalPrice, // Map from original_price field
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
    } catch (error) {
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
        AND is_active = 1
        ORDER BY created_at DESC, id DESC
        LIMIT 10
      `).all() as UnifiedContent[];
      
      // Transform data for frontend consistent with /api/products
      const transformedProducts = featuredProducts.map((product: UnifiedContent): Partial<MappedUnifiedContent> => ({
        id: product.id,
        name: product.title,
        description: product.description || '',
        price: product.price || '0',
        originalPrice: product.original_price || product.originalPrice,
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
      
      console.log(`Featured Products: Returning ${transformedProducts.length} featured products`);
      res.json(transformedProducts);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      res.status(500).json({ message: 'Failed to fetch featured products' });
    }
  });

  // Dynamic widget endpoint placeholder (defer to dedicated widget-routes)
  // This route previously returned an empty array and shadowed the real implementation.
  // Change to pass-through so the actual handlers in widget-routes.ts can serve widgets from SQLite.
  app.get('/api/widgets/:page/:position', (_req, _res, next) => {
    return next();
  });

  // Legacy widget endpoints (placeholder responses)
  // Pass-through legacy endpoints so the real widget handlers can serve data
  app.get('/api/widgets/home/content-top', (_req, _res, next) => {
    return next();
  });

  app.get('/api/widgets/home/content-bottom', (_req, _res, next) => {
    return next();
  });

  app.get('/api/widgets/home/footer', (_req, _res, next) => {
    return next();
  });

  // Announcement active endpoint - fetch the most relevant active announcement
  app.get('/api/announcement/active', async (req, res) => {
    try {
      const { page } = req.query as { page?: string };

      const allAnnouncements = await storage.getAnnouncements();
      const activeAnnouncements = allAnnouncements.filter(a => a.isActive);

      let selectedAnnouncement: any = null;

      if (activeAnnouncements.length > 0) {
        // Prefer page-specific announcement if page param provided
        if (page) {
          const pageSpecific = activeAnnouncements.filter(a => a.isGlobal === false && a.page === page);
          if (pageSpecific.length > 0) {
            const sortedPageSpecific = pageSpecific.sort((a, b) => {
              const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return db - da;
            });
            selectedAnnouncement = sortedPageSpecific[0];
          }
        }

        // Fallback to global announcement if none selected
        if (!selectedAnnouncement) {
          const globals = activeAnnouncements.filter(a => a.isGlobal !== false);
          if (globals.length > 0) {
            const sortedGlobals = globals.sort((a, b) => {
              const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return db - da;
            });
            selectedAnnouncement = sortedGlobals[0];
          }
        }
      }

      if (selectedAnnouncement) {
        const row = selectedAnnouncement;
        const announcement = {
          id: row.id,
          message: row.message,
          isActive: row.isActive,
          textColor: row.textColor,
          backgroundColor: row.backgroundColor,
          fontSize: row.fontSize,
          fontWeight: row.fontWeight,
          textDecoration: row.textDecoration || 'none',
          fontStyle: row.fontStyle || 'normal',
          animationSpeed: row.animationSpeed,
          textBorderWidth: row.textBorderWidth || '0px',
          textBorderStyle: row.textBorderStyle || 'solid',
          textBorderColor: row.textBorderColor || '#000000',
          bannerBorderWidth: row.bannerBorderWidth || '0px',
          bannerBorderStyle: row.bannerBorderStyle || 'solid',
          bannerBorderColor: row.bannerBorderColor || '#000000',
          createdAt: row.createdAt,
        };
        return res.json(announcement);
      }

      return res.status(404).json({ message: 'No active announcement found' });
    } catch (error) {
      console.error('Error fetching active announcement:', error);
      return res.status(500).json({ error: 'Failed to fetch announcement' });
    }
  });

  // Admin announcement management routes
  app.get('/api/admin/announcements', async (req, res) => {
    try {
      const { password } = req.query as { password?: string };
      if (!password || !(await verifyAdminPassword(password))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const all = await storage.getAnnouncements();
      return res.json(all);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return res.status(500).json({ error: 'Failed to fetch announcements' });
    }
  });

  app.post('/api/admin/announcements', async (req, res) => {
    try {
      const { password, ...announcementData } = req.body || {};
      if (!password || !(await verifyAdminPassword(password))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const created = await storage.createAnnouncement({
        message: announcementData.message,
        textColor: announcementData.textColor,
        backgroundColor: announcementData.backgroundColor,
        fontSize: announcementData.fontSize,
        fontWeight: announcementData.fontWeight,
        textDecoration: announcementData.textDecoration || 'none',
        fontStyle: announcementData.fontStyle || 'normal',
        animationSpeed: announcementData.animationSpeed,
        textBorderWidth: announcementData.textBorderWidth || '0px',
        textBorderStyle: announcementData.textBorderStyle || 'solid',
        textBorderColor: announcementData.textBorderColor || '#000000',
        bannerBorderWidth: announcementData.bannerBorderWidth || '0px',
        bannerBorderStyle: announcementData.bannerBorderStyle || 'solid',
        bannerBorderColor: announcementData.bannerBorderColor || '#000000',
        isActive: true,
        isGlobal: announcementData.isGlobal !== false,
        page: announcementData.page || null,
        createdAt: new Date(),
      } as any);
      return res.json(created);
    } catch (error) {
      console.error('Error creating announcement:', error);
      return res.status(500).json({ error: 'Failed to create announcement' });
    }
  });

  app.put('/api/admin/announcements/:id', async (req, res) => {
    try {
      const { password, ...announcementData } = req.body || {};
      if (!password || !(await verifyAdminPassword(password))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const id = parseInt(req.params.id, 10);
      const updated = await storage.updateAnnouncement(id, announcementData);
      if (updated) {
        return res.json(updated);
      }
      return res.status(404).json({ message: 'Announcement not found' });
    } catch (error) {
      console.error('Error updating announcement:', error);
      return res.status(500).json({ error: 'Failed to update announcement' });
    }
  });

  app.delete('/api/admin/announcements/:id', async (req, res) => {
    try {
      const { password } = req.body || {};
      if (!password || !(await verifyAdminPassword(password))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const id = parseInt(req.params.id, 10);
      const deleted = await storage.deleteAnnouncement(id);
      if (deleted) {
        return res.json({ message: 'Announcement deleted successfully' });
      }
      return res.status(404).json({ message: 'Announcement not found' });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      return res.status(500).json({ error: 'Failed to delete announcement' });
    }
  });

  // Navigation tabs routes
  app.get('/api/nav-tabs', async (_req, res) => {
    try {
      const defaults = [
        { name: 'Prime Picks', slug: 'prime-picks', icon: 'fas fa-crown', color_from: '#8B5CF6', color_to: '#7C3AED', color_style: 'gradient', description: 'Premium curated products' },
        { name: 'Cue Picks', slug: 'cue-picks', icon: 'fas fa-bullseye', color_from: '#06B6D4', color_to: '#0891B2', color_style: 'gradient', description: 'Smart selections curated with precision' },
        { name: 'Value Picks', slug: 'value-picks', icon: 'fas fa-gem', color_from: '#F59E0B', color_to: '#D97706', color_style: 'gradient', description: 'Best value for money products' },
        { name: 'Click Picks', slug: 'click-picks', icon: 'fas fa-mouse-pointer', color_from: '#3B82F6', color_to: '#1D4ED8', color_style: 'gradient', description: 'Most popular and trending products' },
        { name: 'Global Picks', slug: 'global-picks', icon: 'fas fa-globe', color_from: '#10B981', color_to: '#059669', color_style: 'gradient', description: 'International products and brands' },
        { name: 'Travel Picks', slug: 'travel-picks', icon: 'fas fa-plane', color_from: '#3B82F6', color_to: '#1D4ED8', color_style: 'gradient', description: 'Travel essentials and accessories' },
        { name: 'Deals Hub', slug: 'deals-hub', icon: 'fas fa-fire', color_from: '#EF4444', color_to: '#DC2626', color_style: 'gradient', description: 'Hot deals and discounts' },
        { name: 'Loot Box', slug: 'loot-box', icon: 'fas fa-gift', color_from: '#F59E0B', color_to: '#D97706', color_style: 'gradient', description: 'Mystery boxes with amazing surprises' }
      ];

      let tabs = sqliteDb.prepare(
        `SELECT id, name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description
         FROM nav_tabs
         WHERE is_active = 1
         ORDER BY display_order ASC, id ASC`
      ).all();

      if (!tabs || tabs.length === 0) {
        tabs = defaults.map((d, i) => ({
          id: i + 1,
          name: d.name,
          slug: d.slug,
          icon: d.icon,
          color_from: d.color_from,
          color_to: d.color_to,
          color_style: d.color_style,
          display_order: i + 1,
          is_active: 1,
          is_system: 1,
          description: d.description
        }));
      } else {
        const present = new Set(tabs.map((t: any) => String(t.slug)));
        const missing = defaults.filter(d => !present.has(d.slug));
        tabs = tabs.concat(missing.map((d, i) => ({
          id: 1000 + i,
          name: d.name,
          slug: d.slug,
          icon: d.icon,
          color_from: d.color_from,
          color_to: d.color_to,
          color_style: d.color_style,
          display_order: (tabs.length + i + 1),
          is_active: 1,
          is_system: 1,
          description: d.description
        })));
      }

      res.json(tabs);
    } catch (error) {
      console.error('Error fetching nav tabs:', error);
      res.status(500).json({ message: 'Failed to fetch navigation tabs' });
    }
  });

  // Navigation tabs endpoint (alternative endpoint)
  app.get('/api/navigation/tabs', async (_req, res) => {
    try {
      const defaults = [
        { name: 'Prime Picks', slug: 'prime-picks', icon: 'fas fa-crown', color_from: '#8B5CF6', color_to: '#7C3AED', color_style: 'gradient', description: 'Premium curated products' },
        { name: 'Cue Picks', slug: 'cue-picks', icon: 'fas fa-bullseye', color_from: '#06B6D4', color_to: '#0891B2', color_style: 'gradient', description: 'Smart selections curated with precision' },
        { name: 'Value Picks', slug: 'value-picks', icon: 'fas fa-gem', color_from: '#F59E0B', color_to: '#D97706', color_style: 'gradient', description: 'Best value for money products' },
        { name: 'Click Picks', slug: 'click-picks', icon: 'fas fa-mouse-pointer', color_from: '#3B82F6', color_to: '#1D4ED8', color_style: 'gradient', description: 'Most popular and trending products' },
        { name: 'Global Picks', slug: 'global-picks', icon: 'fas fa-globe', color_from: '#10B981', color_to: '#059669', color_style: 'gradient', description: 'International products and brands' },
        { name: 'Travel Picks', slug: 'travel-picks', icon: 'fas fa-plane', color_from: '#3B82F6', color_to: '#1D4ED8', color_style: 'gradient', description: 'Travel essentials and accessories' },
        { name: 'Deals Hub', slug: 'deals-hub', icon: 'fas fa-fire', color_from: '#EF4444', color_to: '#DC2626', color_style: 'gradient', description: 'Hot deals and discounts' },
        { name: 'Loot Box', slug: 'loot-box', icon: 'fas fa-gift', color_from: '#F59E0B', color_to: '#D97706', color_style: 'gradient', description: 'Mystery boxes with amazing surprises' }
      ];

      let tabs = sqliteDb.prepare(
        `SELECT id, name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description
         FROM nav_tabs
         WHERE is_active = 1
         ORDER BY display_order ASC, id ASC`
      ).all();

      if (!tabs || tabs.length === 0) {
        tabs = defaults.map((d, i) => ({
          id: i + 1,
          name: d.name,
          slug: d.slug,
          icon: d.icon,
          color_from: d.color_from,
          color_to: d.color_to,
          color_style: d.color_style,
          display_order: i + 1,
          is_active: 1,
          is_system: 1,
          description: d.description
        }));
      } else {
        const present = new Set(tabs.map((t: any) => String(t.slug)));
        const missing = defaults.filter(d => !present.has(d.slug));
        tabs = tabs.concat(missing.map((d, i) => ({
          id: 1000 + i,
          name: d.name,
          slug: d.slug,
          icon: d.icon,
          color_from: d.color_from,
          color_to: d.color_to,
          color_style: d.color_style,
          display_order: (tabs.length + i + 1),
          is_active: 1,
          is_system: 1,
          description: d.description
        })));
      }

      res.json(tabs);
    } catch (error) {
      console.error('Error fetching navigation tabs:', error);
      res.status(500).json({ message: 'Failed to fetch navigation tabs' });
    }
  });

  // Admin: Navigation tabs CRUD and reorder
  app.get('/api/admin/nav-tabs', async (_req, res) => {
    try {
      const tabs = sqliteDb.prepare(
        `SELECT id, name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description
         FROM nav_tabs
         ORDER BY display_order ASC, id ASC`
      ).all();
      res.json(tabs);
    } catch (error) {
      handleDatabaseError(error, res, 'fetch navigation tabs');
    }
  });

  app.post('/api/admin/nav-tabs', async (req, res) => {
    try {
      const passwordHeader = typeof req.headers['x-admin-password'] === 'string' ? String(req.headers['x-admin-password']) : undefined;
      const passwordBody = req.body?.password as string | undefined;
      const password = passwordHeader || passwordBody;
      const isProd = process.env.NODE_ENV === 'production';
      if (isProd) {
        if (!password || !(await verifyAdminPassword(password))) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
      } else if (password && !(await verifyAdminPassword(password))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { name, slug, icon = 'fas fa-star', color_from = '#3B82F6', color_to = '#1D4ED8', colorStyle = 'gradient', description = '', is_active = true, is_system = false, display_order } = req.body || {};
      if (!name) return res.status(400).json({ message: 'Name is required' });
      const finalSlug = (slug && String(slug).trim().length > 0)
        ? String(slug).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
        : String(name).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
      const maxOrderRow = sqliteDb.prepare(`SELECT MAX(display_order) as maxOrder FROM nav_tabs`).get() as any;
      const nextOrder = (maxOrderRow?.maxOrder || 0) + 1;
      const orderToUse = Number(display_order) > 0 ? Number(display_order) : nextOrder;

      try {
        const result = sqliteDb.prepare(
          `INSERT INTO nav_tabs (name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        ).run(String(name), finalSlug, String(icon), String(color_from), String(color_to), String(colorStyle), Number(orderToUse), is_active ? 1 : 0, is_system ? 1 : 0, String(description || ''));
        const created = sqliteDb.prepare(
          `SELECT id, name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description FROM nav_tabs WHERE id = ?`
        ).get(result.lastInsertRowid) as any;
        return res.json({ message: 'Navigation tab created successfully', tab: created });
      } catch (err: any) {
        if (String(err?.message || '').includes('UNIQUE') && String(err?.message || '').includes('slug')) {
          return res.status(409).json({ message: 'Slug already exists' });
        }
        throw err;
      }
    } catch (error) {
      handleDatabaseError(error, res, 'create navigation tab');
    }
  });

  app.put('/api/admin/nav-tabs/:id', async (req, res) => {
    try {
      const passwordHeader = typeof req.headers['x-admin-password'] === 'string' ? String(req.headers['x-admin-password']) : undefined;
      const passwordBody = req.body?.password as string | undefined;
      const password = passwordHeader || passwordBody;
      const isProd = process.env.NODE_ENV === 'production';
      if (isProd) {
        if (!password || !(await verifyAdminPassword(password))) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
      } else if (password && !(await verifyAdminPassword(password))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = Number(req.params.id);
      const existing = sqliteDb.prepare(`SELECT id, is_system FROM nav_tabs WHERE id = ?`).get(id) as any;
      if (!existing) return res.status(404).json({ message: 'Navigation tab not found' });

      const { name, slug, icon, color_from, color_to, colorStyle, display_order, is_active, is_system, description } = req.body || {};
      const finalSlug = (slug && String(slug).trim().length > 0)
        ? String(slug).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
        : undefined;

      try {
        sqliteDb.prepare(
          `UPDATE nav_tabs SET
            name = COALESCE(?, name),
            slug = COALESCE(?, slug),
            icon = COALESCE(?, icon),
            color_from = COALESCE(?, color_from),
            color_to = COALESCE(?, color_to),
            color_style = COALESCE(?, color_style),
            display_order = COALESCE(?, display_order),
            is_active = COALESCE(?, is_active),
            is_system = COALESCE(?, is_system),
            description = COALESCE(?, description),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`
        ).run(
          name !== undefined ? String(name) : null,
          finalSlug !== undefined ? finalSlug : null,
          icon !== undefined ? String(icon) : null,
          color_from !== undefined ? String(color_from) : null,
          color_to !== undefined ? String(color_to) : null,
          colorStyle !== undefined ? String(colorStyle) : null,
          display_order !== undefined ? Number(display_order) : null,
          is_active !== undefined ? (is_active ? 1 : 0) : null,
          is_system !== undefined ? (is_system ? 1 : 0) : null,
          description !== undefined ? String(description) : null,
          id
        );
        const updated = sqliteDb.prepare(
          `SELECT id, name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description FROM nav_tabs WHERE id = ?`
        ).get(id);
        return res.json({ message: 'Navigation tab updated successfully', tab: updated });
      } catch (err: any) {
        if (String(err?.message || '').includes('UNIQUE') && String(err?.message || '').includes('slug')) {
          return res.status(409).json({ message: 'Slug already exists' });
        }
        throw err;
      }
    } catch (error) {
      handleDatabaseError(error, res, 'update navigation tab');
    }
  });

  app.delete('/api/admin/nav-tabs/:id', async (req, res) => {
    try {
      const passwordHeader = typeof req.headers['x-admin-password'] === 'string' ? String(req.headers['x-admin-password']) : undefined;
      const passwordBody = req.body?.password as string | undefined;
      const password = passwordHeader || passwordBody;
      const isProd = process.env.NODE_ENV === 'production';
      if (isProd) {
        if (!password || !(await verifyAdminPassword(password))) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
      } else if (password && !(await verifyAdminPassword(password))) {
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
      handleDatabaseError(error, res, 'delete navigation tab');
    }
  });

  app.put('/api/admin/nav-tabs/reorder', async (req, res) => {
    try {
      const passwordHeader = typeof req.headers['x-admin-password'] === 'string' ? String(req.headers['x-admin-password']) : undefined;
      const passwordBody = req.body?.password as string | undefined;
      const password = passwordHeader || passwordBody;
      const isProd = process.env.NODE_ENV === 'production';
      if (isProd) {
        if (!password || !(await verifyAdminPassword(password))) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
      } else if (password && !(await verifyAdminPassword(password))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { tabOrders } = req.body || {};
      if (!Array.isArray(tabOrders) || tabOrders.length === 0) {
        return res.status(400).json({ message: 'tabOrders array is required' });
      }

      const update = sqliteDb.prepare(`UPDATE nav_tabs SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
      let order = 1;
      for (const t of tabOrders) {
        const id = Number(t.id);
        if (!id || id <= 0) continue;
        update.run(order, id);
        order++;
      }
      return res.json({ message: 'Navigation tabs reordered successfully' });
    } catch (error) {
      handleDatabaseError(error, res, 'reorder navigation tabs');
    }
  });

  // Add dedicated travel-products delete endpoint (unified_content)
  app.delete('/api/admin/travel-products/:id', async (req, res) => {
    try {
      const headerPwd = (req.headers['x-admin-password'] as string) || undefined;
      const bodyPwd = (req.body && (req.body as any).password) || undefined;
      const queryPwd = typeof req.query?.password === 'string' ? (req.query.password as string) : undefined;
      const password = headerPwd || bodyPwd || queryPwd;
      const isProd = process.env.NODE_ENV === 'production';

      // In production, password is mandatory; in dev, accept missing password but validate if provided
      if (isProd) {
        if (!password || !(await verifyAdminPassword(password))) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
      } else if (password && !(await verifyAdminPassword(password))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const productId = req.params.id;
      const result = sqliteDb.prepare('DELETE FROM unified_content WHERE id = ?').run(productId);
      if (result.changes > 0) {
        return res.json({ message: 'Travel product deleted successfully' });
      }
      return res.status(404).json({ message: 'Travel product not found' });
    } catch (error) {
      handleDatabaseError(error, res, 'delete travel product');
    }
  });

  // Delete product endpoint - handles unified_content table
  app.delete('/api/admin/products/:id', async (req, res) => {
    try {
      const headerPwd = (req.headers['x-admin-password'] as string) || undefined;
      const bodyPwd = (req.body && (req.body as any).password) || undefined;
      const queryPwd = typeof req.query?.password === 'string' ? (req.query.password as string) : undefined;
      const password = headerPwd || bodyPwd || queryPwd;
      const isProd = process.env.NODE_ENV === 'production';

      // In production, password is mandatory; in dev, accept missing password but validate if provided
      if (isProd) {
        if (!password || !(await verifyAdminPassword(password))) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
      } else if (password && !(await verifyAdminPassword(password))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const productId = req.params.id;
      console.log(`🗑️ Attempting to delete product: ${productId}`, {
        method: req.method,
        url: req.url,
        headerPwdPresent: !!headerPwd,
        bodyPwdPresent: !!bodyPwd,
        queryPwdPresent: !!queryPwd,
        isProd
      });
      
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
      } catch (error) {
        console.log(`⚠️ Could not delete from unified_content: ${error.message}`);
      }

      // Legacy products table deletion removed to enforce unified table usage only

      if (deleted) {
        res.json({ 
          message: 'Product deleted successfully',
          details: deletionDetails,
          productId: productId
        });
      } else {
        console.warn(`❌ Product ${productId} not found in unified_content`);
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });

  // Admin authentication endpoint
  app.post('/api/admin/auth', async (req, res) => {
    try {
      console.log('[admin-auth] incoming', {
        url: req.url,
        method: req.method,
        contentType: req.headers['content-type'] || null,
        query: req.query,
        headerPassword: req.headers['x-admin-password'],
        bodyType: typeof req.body,
        bodyPreview: (() => {
          try {
            return typeof req.body === 'string' ? req.body.slice(0, 200) : req.body;
          } catch {
            return '[unavailable]';
          }
        })(),
      });
      // Accept password from JSON body, urlencoded body, query, or header for robustness
      let password: string | undefined = undefined;

      const rawBody: any = req.body;
      if (typeof rawBody === 'string') {
        try {
          const parsed = JSON.parse(rawBody);
          password = parsed?.password;
        } catch {
          // Fall through; we'll check other locations
        }
      } else if (rawBody && typeof rawBody === 'object') {
        password = rawBody.password;
      }

      // Fallbacks: query param or header
      if (!password && typeof req.query.password === 'string') {
        password = req.query.password as string;
      }
      if (!password && typeof req.headers['x-admin-password'] === 'string') {
        password = req.headers['x-admin-password'] as string;
      }

      if (!password) {
        console.log('[admin-auth] no password found', {
          queryPassword: (req.query as any).password,
          headerPassword: req.headers['x-admin-password'],
          bodyType: typeof rawBody,
        });
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

  // Admin product management routes
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
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ message: 'Failed to update product' });
    }
  });

  // Bulk product upload via CSV
  app.post('/api/admin/products/bulk-upload', upload.single('file'), async (req, res) => {
    try {
      const bodyPwd = typeof req.body?.password === 'string' ? req.body.password : undefined;
      const headerPwd = (req.headers['x-admin-password'] as string) || undefined;
      const queryPwd = typeof req.query?.password === 'string' ? (req.query.password as string) : undefined;
      const password = bodyPwd || headerPwd || queryPwd || '';

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

      const normalizeKey = (k: string) => k.trim().toLowerCase().replace(/\s+/g, '_');
      const keyMap: Record<string, string> = {};
      headers.forEach(h => {
        const norm = normalizeKey(h);
        switch (norm) {
          case 'name':
          case 'title':
            keyMap[h] = 'name';
            break;
          case 'description':
          case 'short_description':
            keyMap[h] = 'description';
            break;
          case 'price':
          case 'current_price':
            keyMap[h] = 'price';
            break;
          case 'original_price':
          case 'mrp':
            keyMap[h] = 'originalPrice';
            break;
          case 'discount':
            keyMap[h] = 'discount';
            break;
          case 'category':
          case 'categories':
            keyMap[h] = 'category';
            break;
          case 'subcategory':
          case 'sub_category':
          case 'subcategories':
            keyMap[h] = 'subcategory';
            break;
          case 'cookie_duration':
          case 'cookie':
          case 'cookie_days':
            keyMap[h] = 'cookieDuration';
            break;
          case 'imageurl':
          case 'image_url':
          case 'image':
            keyMap[h] = 'imageUrl';
            break;
          case 'affiliateurl':
          case 'affiliate_url':
          case 'url':
            keyMap[h] = 'affiliateUrl';
            break;
          case 'brand':
            keyMap[h] = 'brand';
            break;
          case 'is_featured':
          case 'featured':
          case 'is_feature':
            keyMap[h] = 'isFeatured';
            break;
          case 'is_service':
          case 'service':
            keyMap[h] = 'isService';
            break;
          case 'is_ai_app':
          case 'ai_app':
          case 'is_app':
            keyMap[h] = 'isAIApp';
            break;
          case 'gender':
            keyMap[h] = 'gender';
            break;
          // Advanced pricing fields for services/apps
          case 'pricing_type':
            keyMap[h] = 'pricingType';
            break;
          case 'monthly_price':
            keyMap[h] = 'monthlyPrice';
            break;
          case 'yearly_price':
            keyMap[h] = 'yearlyPrice';
            break;
          case 'is_free':
            keyMap[h] = 'isFree';
            break;
          case 'price_description':
            keyMap[h] = 'priceDescription';
            break;
          case 'display_pages':
            keyMap[h] = 'displayPages';
            break;
          default:
            keyMap[h] = h;
        }
      });

      let processed = 0;
      let inserted = 0;
      const errors: { index: number; error: string }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const raw = rows[i];
        processed++;
        try {
          const productData: Record<string, any> = {};
          for (const originalKey of Object.keys(raw)) {
            const mappedKey = keyMap[originalKey] || originalKey;
            productData[mappedKey] = raw[originalKey];
          }

          const name = (productData.name || productData.title || '').toString().trim();
          if (!name) throw new Error('Missing required field: name/title');

          const priceVal = productData.price !== undefined && productData.price !== ''
            ? Number(String(productData.price).replace(/[^0-9.\-]/g, ''))
            : undefined;
          const originalPriceVal = productData.originalPrice !== undefined && productData.originalPrice !== ''
            ? Number(String(productData.originalPrice).replace(/[^0-9.\-]/g, ''))
            : undefined;

          // Parse discount if provided; otherwise compute from prices when possible
          const discountVal = (productData.discount !== undefined && productData.discount !== '')
            ? parseInt(String(productData.discount).replace(/[^0-9]/g, ''))
            : (priceVal !== undefined && originalPriceVal !== undefined && originalPriceVal > 0 && priceVal < originalPriceVal
                ? Math.round(((originalPriceVal - priceVal) / originalPriceVal) * 100)
                : undefined);

          const toBool = (v: any) => {
            if (typeof v === 'boolean') return v;
            const s = String(v).trim().toLowerCase();
            return s === 'true' || s === '1' || s === 'yes' || s === 'y';
          };

          // Normalize display pages: comma-separated -> array
          const displayPages = productData.displayPages
            ? String(productData.displayPages)
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0)
            : undefined;

          const mapped = {
            name,
            description: (productData.description || '').toString(),
            category: (productData.category || '').toString(),
            subcategory: (productData.subcategory || '').toString(),
            imageUrl: (productData.imageUrl || '').toString(),
            affiliateUrl: (productData.affiliateUrl || productData.url || '').toString(),
            brand: productData.brand ? String(productData.brand) : undefined,
            price: priceVal,
            originalPrice: originalPriceVal,
            discount: discountVal,
            isFeatured: toBool(productData.isFeatured),
            isService: toBool(productData.isService),
            isAIApp: toBool(productData.isAIApp),
            gender: productData.gender ? String(productData.gender) : undefined,
            // Advanced pricing
            pricingType: productData.pricingType ? String(productData.pricingType).toLowerCase() : undefined,
            monthlyPrice: productData.monthlyPrice !== undefined && productData.monthlyPrice !== ''
              ? String(productData.monthlyPrice)
              : undefined,
            yearlyPrice: productData.yearlyPrice !== undefined && productData.yearlyPrice !== ''
              ? String(productData.yearlyPrice)
              : undefined,
            isFree: toBool(productData.isFree),
            priceDescription: productData.priceDescription ? String(productData.priceDescription) : undefined,
            // Display pages
            displayPages,
            // Cookie duration (days)
            cookieDuration: productData.cookieDuration !== undefined && productData.cookieDuration !== ''
              ? parseInt(String(productData.cookieDuration).replace(/[^0-9]/g, ''))
              : undefined
          } as any;

          const result = await storage.addProduct(mapped);
          if (result) inserted++;
        } catch (e: any) {
          errors.push({ index: i + 1, error: e?.message || String(e) });
        }
      }

        res.json({
          message: 'Bulk upload completed',
          totalRows: rows.length,
          processed,
          inserted,
          failed: errors.length,
          errors,
          recognizedHeaders: headers,
          expectedHeadersSample: [
          'name', 'description', 'price', 'original_price', 'discount', 'category', 'subcategory', 'image_url', 'affiliate_url', 'brand', 'gender', 'is_featured', 'is_service', 'is_ai_app',
          'pricing_type', 'monthly_price', 'yearly_price', 'is_free', 'price_description', 'display_pages', 'cookie_duration'
        ]
      });
    } catch (error) {
      console.error('Bulk upload error:', error);
      return handleDatabaseError(error, res, 'process bulk product CSV');
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
    } catch (error) {
      console.error('Error fetching video content:', error);
      // Return an empty list instead of failing so the page can render
      res.json([]);
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
        tags: Array.isArray(videoData.tags) ? videoData.tags : (typeof videoData.tags === 'string' ? videoData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
        pages: Array.isArray(videoData.pages) ? videoData.pages : (typeof videoData.pages === 'string' ? JSON.parse(videoData.pages) : []),
        showOnHomepage: videoData.showOnHomepage !== undefined ? Boolean(videoData.showOnHomepage) : true,
        ctaText: videoData.ctaText || null,
        ctaUrl: videoData.ctaUrl || null
      };

      const created = await storage.addVideoContent(payload);
      res.json({ message: 'Video content added successfully', video: created });
    } catch (error) {
      console.error('Add video content error:', error);
      res.status(500).json({ message: 'Failed to add video content' });
    }
  });

  // Admin: Update video content
  app.put('/api/admin/video-content/:id', async (req, res) => {
    try {
      const { password, ...updates } = req.body;

      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);

      // Normalize potential fields for update
      const normalized: any = { ...updates };
      if (normalized.tags) {
        normalized.tags = Array.isArray(normalized.tags) ? JSON.stringify(normalized.tags) : normalized.tags;
      }
      if (normalized.pages) {
        normalized.pages = Array.isArray(normalized.pages) ? JSON.stringify(normalized.pages) : normalized.pages;
      }
      if (typeof normalized.hasTimer !== 'undefined') {
        normalized.hasTimer = Boolean(normalized.hasTimer);
      }
      if (typeof normalized.showOnHomepage !== 'undefined') {
        normalized.showOnHomepage = Boolean(normalized.showOnHomepage);
      }
      if (typeof normalized.timerDuration !== 'undefined' && normalized.timerDuration !== null) {
        normalized.timerDuration = parseInt(String(normalized.timerDuration));
      }

      const updated = await storage.updateVideoContent(id, normalized);
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
      } else {
        res.status(404).json({ message: 'Video content not found' });
      }
    } catch (error) {
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
    } catch (error) {
      console.error('Bulk delete video content error:', error);
      res.status(500).json({ message: 'Failed to delete all video content' });
    }
  });

  // Use travel categories router
  app.use('/api', travelCategoriesRouter);

  // Use currency router
  app.use('/api/currency', currencyRouter);

  // Use Canva admin router
  app.use('/', canvaAdminRouter);

  // Blog management routes
  app.post('/api/admin/blog', async (req, res) => {
    try {
      const { password, ...blogPostData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const blogPost = await storage.addBlogPost(blogPostData);
      res.json({ message: 'Blog post added successfully', blogPost });
    } catch (error) {
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
      const sortedPosts = blogPosts.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
      res.json(sortedPosts);
    } catch (error) {
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
    } catch (error) {
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
      const { password, ...updates } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

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

  // Master Bot Telegram Webhook Endpoint
  app.post('/webhook/master/:token', express.json(), async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const update: any = req.body;
      
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
        } else if (update.message) {
          console.log('🔄 Processing message...');
          await botManager.processMessage(update.message);
          console.log('✅ Message processed');
        } else {
          console.log('⚠️ No channel_post or message found in update');
        }
        
        console.log('✅ Master bot webhook processed successfully');
      } catch (error) {
        console.error('❌ Failed to process master bot webhook update:', error);
        console.error('Error stack:', error.stack);
      }
      
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('❌ Master bot webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  console.log('✅ Clean routes setup completed - using unified_content table with display_pages filtering');
}
