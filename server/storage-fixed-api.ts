import { db, sqliteDb } from './db.js';
// Affiliate normalization is handled only by Telegram bot; no server-wide normalization
import { blogPosts, categories, affiliateNetworks, newsletterSubscribers } from '../shared/sqlite-schema';
import { desc, eq, like, and, or, sql, count } from 'drizzle-orm';
import type { Product, BlogPost, Category, AffiliateNetwork, NewsletterSubscriber } from '../shared/sqlite-schema';

export class DatabaseStorage {
  // FIXED: Products using unified_content with direct SQL and column aliases
  async getProducts(): Promise<Product[]> {
    try {
      console.log('🔍 DatabaseStorage: Getting products from unified_content with direct SQL...');
      console.log('📊 Database connection status:', sqliteDb ? 'Connected' : 'Not connected');
      
      const result = sqliteDb.prepare(`
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
      `).all() as Product[];
      console.log(`✅ DatabaseStorage: Found ${result.length} products via unified_content`);
      
      if (result.length > 0) {
        console.log('📝 Sample product:', { id: (result[0] as any).id, name: (result[0] as any).name, price: (result[0] as any).price });
      }
      
      return result;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting products:', error);
      return [];
    }
  }

  // Canva automation settings
  async getCanvaSettings(): Promise<any | null> {
    try {
      // Ensure table exists
      sqliteDb.prepare(`
        CREATE TABLE IF NOT EXISTS canva_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          is_enabled INTEGER DEFAULT 0,
          api_key TEXT,
          api_secret TEXT,
          default_template_id TEXT,
          auto_generate_captions INTEGER DEFAULT 1,
          auto_generate_hashtags INTEGER DEFAULT 1,
          default_title TEXT,
          default_caption TEXT,
          default_hashtags TEXT,
          platforms TEXT,
          schedule_type TEXT DEFAULT 'immediate',
          schedule_delay_minutes INTEGER DEFAULT 0
        )
      `).run();

      const row: any = sqliteDb.prepare(`SELECT * FROM canva_settings WHERE id = 1`).get();
      if (!row) return null;
      return {
        isEnabled: !!row.is_enabled,
        apiKey: row.api_key ?? null,
        apiSecret: row.api_secret ?? null,
        defaultTemplateId: row.default_template_id ?? null,
        autoGenerateCaptions: !!row.auto_generate_captions,
        autoGenerateHashtags: !!row.auto_generate_hashtags,
        defaultTitle: row.default_title ?? null,
        defaultCaption: row.default_caption ?? null,
        defaultHashtags: row.default_hashtags ?? null,
        platforms: row.platforms ?? '[]',
        scheduleType: row.schedule_type ?? 'immediate',
        scheduleDelayMinutes: Number(row.schedule_delay_minutes ?? 0)
      };
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting Canva settings:', error);
      return null;
    }
  }

  async updateCanvaSettings(settings: any): Promise<any> {
    try {
      // Ensure table exists
      sqliteDb.prepare(`
        CREATE TABLE IF NOT EXISTS canva_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          is_enabled INTEGER DEFAULT 0,
          api_key TEXT,
          api_secret TEXT,
          default_template_id TEXT,
          auto_generate_captions INTEGER DEFAULT 1,
          auto_generate_hashtags INTEGER DEFAULT 1,
          default_title TEXT,
          default_caption TEXT,
          default_hashtags TEXT,
          platforms TEXT,
          schedule_type TEXT DEFAULT 'immediate',
          schedule_delay_minutes INTEGER DEFAULT 0
        )
      `).run();

      // Normalize values
      const payload = {
        id: 1,
        is_enabled: settings.isEnabled ? 1 : 0,
        api_key: settings.apiKey ?? null,
        api_secret: settings.apiSecret ?? null,
        default_template_id: settings.defaultTemplateId ?? null,
        auto_generate_captions: settings.autoGenerateCaptions === false ? 0 : 1,
        auto_generate_hashtags: settings.autoGenerateHashtags === false ? 0 : 1,
        default_title: settings.defaultTitle ?? null,
        default_caption: settings.defaultCaption ?? null,
        default_hashtags: settings.defaultHashtags ?? null,
        platforms: typeof settings.platforms === 'string' ? settings.platforms : JSON.stringify(settings.platforms ?? []),
        schedule_type: settings.scheduleType === 'scheduled' ? 'scheduled' : 'immediate',
        schedule_delay_minutes: Number(settings.scheduleDelayMinutes ?? 0)
      };

      // Upsert single settings row
      sqliteDb.prepare(`
        INSERT INTO canva_settings (
          id, is_enabled, api_key, api_secret, default_template_id,
          auto_generate_captions, auto_generate_hashtags,
          default_title, default_caption, default_hashtags,
          platforms, schedule_type, schedule_delay_minutes
        ) VALUES (
          @id, @is_enabled, @api_key, @api_secret, @default_template_id,
          @auto_generate_captions, @auto_generate_hashtags,
          @default_title, @default_caption, @default_hashtags,
          @platforms, @schedule_type, @schedule_delay_minutes
        )
        ON CONFLICT(id) DO UPDATE SET
          is_enabled = excluded.is_enabled,
          api_key = excluded.api_key,
          api_secret = excluded.api_secret,
          default_template_id = excluded.default_template_id,
          auto_generate_captions = excluded.auto_generate_captions,
          auto_generate_hashtags = excluded.auto_generate_hashtags,
          default_title = excluded.default_title,
          default_caption = excluded.default_caption,
          default_hashtags = excluded.default_hashtags,
          platforms = excluded.platforms,
          schedule_type = excluded.schedule_type,
          schedule_delay_minutes = excluded.schedule_delay_minutes
      `).run(payload);

      return await this.getCanvaSettings();
    } catch (error) {
      console.error('❌ DatabaseStorage: Error updating Canva settings:', error);
      throw error;
    }
  }

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const result = sqliteDb.prepare(`
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
          is_featured = 1
          AND (status IN ('active','published') OR status IS NULL)
          AND (visibility IN ('public','visible') OR visibility IS NULL)
          AND (processing_status != 'archived' OR processing_status IS NULL)
        ORDER BY id DESC
      `).all() as Product[];
      return result;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting featured products:', error);
      return [];
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const result = sqliteDb.prepare(`
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
          category = ?
          AND (status IN ('active','published') OR status IS NULL)
          AND (visibility IN ('public','visible') OR visibility IS NULL)
          AND (processing_status != 'archived' OR processing_status IS NULL)
        ORDER BY id DESC
      `).all(category) as Product[];
      return result;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting products by category:', error);
      return [];
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const searchTerm = `%${query}%`;
      const result = sqliteDb.prepare(`
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
          (title LIKE ? OR description LIKE ?)
          AND (status IN ('active','published') OR status IS NULL)
          AND (visibility IN ('public','visible') OR visibility IS NULL)
          AND (processing_status != 'archived' OR processing_status IS NULL)
        ORDER BY id DESC
      `).all(searchTerm, searchTerm) as Product[];
      return result;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error searching products:', error);
      return [];
    }
  }

  async getProductById(id: number): Promise<Product | null> {
    try {
      const result = sqliteDb.prepare(`
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
        WHERE id = ?
      `).get(id) as Product;
      return result || null;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting product by id:', error);
      return null;
    }
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT INTO unified_content (
          title, description, price, original_price, currency, image_url, affiliate_url, category, rating, review_count,
          content_type, status, visibility, processing_status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'product', 'active', 'public', 'completed', datetime('now'), datetime('now'))
      `);
      const result = stmt.run(
        product.name,
        product.description,
        product.price,
        product.originalPrice,
        product.currency || 'INR',
        product.imageUrl,
        product.affiliateUrl,
        product.category,
        product.rating,
        product.reviewCount
      );
      return { ...product, id: Number(result.lastInsertRowid) } as Product;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error creating product:', error);
      throw error;
    }
  }

  // Other methods with direct SQL where needed
  async getCategories(): Promise<Category[]> {
    try {
      const result = sqliteDb.prepare('SELECT * FROM categories ORDER BY display_order ASC, name ASC').all() as Category[];
      return result;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting categories:', error);
      return [];
    }
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    try {
      const rows = sqliteDb.prepare('SELECT * FROM blog_posts ORDER BY published_at DESC').all() as any[];
      const normalize = (r: any) => {
        // tags may be JSON string or comma-separated
        let tagsArr: string[] = [];
        const t = r.tags ?? r.Tags;
        if (typeof t === 'string' && t.trim().length > 0) {
          try {
            const parsed = JSON.parse(t);
            if (Array.isArray(parsed)) tagsArr = parsed.map((x: any) => String(x));
            else tagsArr = t.split(',').map(s => s.trim()).filter(Boolean);
          } catch {
            tagsArr = t.split(',').map(s => s.trim()).filter(Boolean);
          }
        }

        const toIso = (v: any) => {
          if (v === null || v === undefined) return undefined;
          const num = Number(v);
          if (Number.isFinite(num)) {
            // Some DBs store seconds, some store ms
            const ms = num > 10_000_000_000 ? num : num * 1000;
            return new Date(ms).toISOString();
          }
          const d = new Date(v);
          return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
        };

        return ({
          id: r.id,
          title: r.title,
          excerpt: r.excerpt ?? '',
          content: r.content ?? '',
          category: r.category ?? 'General',
          tags: tagsArr,
          imageUrl: r.image_url ?? r.imageUrl ?? '',
          videoUrl: r.video_url ?? r.videoUrl ?? null,
          pdfUrl: r.pdf_url ?? r.pdfUrl ?? null,
          publishedAt: toIso(r.published_at ?? r.publishedAt) ?? new Date().toISOString(),
          createdAt: toIso(r.created_at ?? r.createdAt) ?? null,
          readTime: r.read_time ?? r.readTime ?? '5 min read',
          slug: r.slug,
          hasTimer: !!(r.has_timer ?? r.hasTimer ?? 0),
          timerDuration: r.timer_duration ?? r.timerDuration ?? null,
          timerStartTime: toIso(r.timer_start_time ?? r.timerStartTime) ?? null,
        } as unknown) as BlogPost;
      };

      return rows.map(normalize) as BlogPost[];
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting blog posts:', error);
      return [];
    }
  }

  async addBlogPost(blogPostData: any): Promise<BlogPost> {
    try {
      const title = String(blogPostData.title || '').trim();
      const content = String(blogPostData.content || '').trim();
      const pdfUrlForValidation = String(blogPostData.pdfUrl || '').trim();
      // Allow posts that are PDF-only (content can be empty if pdfUrl is provided)
      if (!title || (!content && !pdfUrlForValidation)) {
        throw new Error('Missing required fields: title and either content or pdfUrl');
      }

      const toNumberOrNull = (v: any) => {
        if (v === null || v === undefined || v === '') return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };

      const nowSec = Math.floor(Date.now() / 1000);
      const publishedAt = (() => {
        const p = blogPostData.publishedAt ?? blogPostData.published_at;
        if (p === undefined || p === null || p === '') return nowSec;
        const n = Number(p);
        if (Number.isFinite(n)) return n > 10_000_000_000 ? Math.floor(n / 1000) : Math.floor(n);
        const d = new Date(p);
        return Number.isNaN(d.getTime()) ? nowSec : Math.floor(d.getTime() / 1000);
      })();

      const tagsStr = (() => {
        const t = blogPostData.tags;
        if (Array.isArray(t)) return JSON.stringify(t.map((x: any) => String(x)));
        if (typeof t === 'string') {
          try {
            const parsed = JSON.parse(t);
            if (Array.isArray(parsed)) return JSON.stringify(parsed.map((x: any) => String(x)));
          } catch {}
          return JSON.stringify(t.split(',').map(s => s.trim()).filter(Boolean));
        }
        return JSON.stringify([]);
      })();

      const slug = (blogPostData.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim();

      const stmt = sqliteDb.prepare(`
        INSERT INTO blog_posts (
          title, excerpt, content, category, tags,
          image_url, video_url, pdf_url,
          published_at, created_at, read_time, slug,
          has_timer, timer_duration, timer_start_time
        ) VALUES (
          @title, @excerpt, @content, @category, @tags,
          @image_url, @video_url, @pdf_url,
          @published_at, @created_at, @read_time, @slug,
          @has_timer, @timer_duration, @timer_start_time
        )
      `);

      const payload = {
        title,
        excerpt: String(blogPostData.excerpt || ''),
        content,
        category: String(blogPostData.category || 'General'),
        tags: tagsStr,
        image_url: String(blogPostData.imageUrl || ''),
        video_url: blogPostData.videoUrl ? String(blogPostData.videoUrl) : null,
        pdf_url: blogPostData.pdfUrl ? String(blogPostData.pdfUrl) : null,
        published_at: publishedAt,
        created_at: nowSec,
        read_time: String(blogPostData.readTime || '5 min read'),
        slug,
        has_timer: blogPostData.hasTimer ? 1 : 0,
        timer_duration: toNumberOrNull(blogPostData.timerDuration),
        timer_start_time: (() => {
          const v = blogPostData.timerStartTime;
          if (!v) return null;
          const n = Number(v);
          if (Number.isFinite(n)) return n > 10_000_000_000 ? Math.floor(n / 1000) : Math.floor(n);
          const d = new Date(v);
          return Number.isNaN(d.getTime()) ? null : Math.floor(d.getTime() / 1000);
        })()
      };

      const result = stmt.run(payload);
      const newId = Number(result.lastInsertRowid);
      const row = sqliteDb.prepare('SELECT * FROM blog_posts WHERE id = ?').get(newId) as any;
      if (!row) throw new Error('Failed to fetch created blog post');

      // Normalize before returning
      const normalized = ({
        id: row.id,
        title: row.title,
        excerpt: row.excerpt ?? '',
        content: row.content ?? '',
        category: row.category ?? 'General',
        tags: JSON.parse(row.tags || '[]'),
        imageUrl: row.image_url ?? '',
        videoUrl: row.video_url ?? null,
        pdfUrl: row.pdf_url ?? null,
        publishedAt: new Date((row.published_at || nowSec) * 1000).toISOString(),
        createdAt: new Date((row.created_at || nowSec) * 1000).toISOString(),
        readTime: row.read_time ?? '5 min read',
        slug: row.slug,
        hasTimer: !!row.has_timer,
        timerDuration: row.timer_duration ?? null,
        timerStartTime: row.timer_start_time ? new Date(row.timer_start_time * 1000).toISOString() : null,
      } as unknown) as BlogPost;

      return normalized;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error adding blog post:', error);
      throw error;
    }
  }

  async updateBlogPost(id: number, updates: Partial<BlogPost>): Promise<BlogPost | null> {
    try {
      const setClauses: string[] = [];
      const params: any = { id };

      const map = (field: string, column: string, transform?: (v: any) => any) => {
        const val = (updates as any)[field];
        if (val !== undefined) {
          params[column] = transform ? transform(val) : val;
          setClauses.push(`${column} = @${column}`);
        }
      };

      const toNumberOrNull = (v: any) => {
        if (v === null || v === undefined || v === '') return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };

      map('title', 'title', (v) => String(v).trim());
      map('excerpt', 'excerpt', (v) => String(v));
      map('content', 'content', (v) => String(v));
      map('category', 'category', (v) => String(v));
      // tags: accept array or JSON/comma string
      if ((updates as any).tags !== undefined) {
        const t = (updates as any).tags;
        let tagsStr = '[]';
        if (Array.isArray(t)) tagsStr = JSON.stringify(t.map((x: any) => String(x)));
        else if (typeof t === 'string') {
          try {
            const parsed = JSON.parse(t);
            if (Array.isArray(parsed)) tagsStr = JSON.stringify(parsed.map((x: any) => String(x)));
            else tagsStr = JSON.stringify(t.split(',').map(s => s.trim()).filter(Boolean));
          } catch {
            tagsStr = JSON.stringify(t.split(',').map(s => s.trim()).filter(Boolean));
          }
        }
        params['tags'] = tagsStr;
        setClauses.push('tags = @tags');
      }

      map('imageUrl', 'image_url', (v) => String(v).trim());
      map('videoUrl', 'video_url', (v) => v ? String(v).trim() : null);
      map('pdfUrl', 'pdf_url', (v) => v ? String(v).trim() : null);
      map('readTime', 'read_time', (v) => String(v));
      map('slug', 'slug', (v) => String(v).trim());

      if ((updates as any).hasTimer !== undefined) {
        params['has_timer'] = (updates as any).hasTimer ? 1 : 0;
        setClauses.push('has_timer = @has_timer');
      }

      if ((updates as any).timerDuration !== undefined) {
        params['timer_duration'] = toNumberOrNull((updates as any).timerDuration);
        setClauses.push('timer_duration = @timer_duration');
      }

      if ((updates as any).timerStartTime !== undefined) {
        const v = (updates as any).timerStartTime;
        let ts: number | null = null;
        if (v) {
          const n = Number(v);
          if (Number.isFinite(n)) ts = n > 10_000_000_000 ? Math.floor(n / 1000) : Math.floor(n);
          else {
            const d = new Date(v);
            ts = Number.isNaN(d.getTime()) ? null : Math.floor(d.getTime() / 1000);
          }
        }
        params['timer_start_time'] = ts;
        setClauses.push('timer_start_time = @timer_start_time');
      }

      if ((updates as any).publishedAt !== undefined) {
        const p = (updates as any).publishedAt;
        let ts: number;
        const n = Number(p);
        if (Number.isFinite(n)) ts = n > 10_000_000_000 ? Math.floor(n / 1000) : Math.floor(n);
        else {
          const d = new Date(p);
          ts = Number.isNaN(d.getTime()) ? Math.floor(Date.now() / 1000) : Math.floor(d.getTime() / 1000);
        }
        params['published_at'] = ts;
        setClauses.push('published_at = @published_at');
      }

      if (setClauses.length === 0) return await this.getBlogPostById(id);

      const sql = `UPDATE blog_posts SET ${setClauses.join(', ')} WHERE id = @id`;
      const info = sqliteDb.prepare(sql).run(params);
      if (info.changes === 0) return null;

      return await this.getBlogPostById(id);
    } catch (error) {
      console.error('❌ DatabaseStorage: Error updating blog post:', error);
      throw error;
    }
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    try {
      const info = sqliteDb.prepare('DELETE FROM blog_posts WHERE id = ?').run(id);
      return info.changes > 0;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error deleting blog post:', error);
      return false;
    }
  }

  // Helper to fetch single blog post with normalization
  async getBlogPostById(id: number): Promise<BlogPost | null> {
    try {
      const row = sqliteDb.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id) as any;
      if (!row) return null;
      const toIso = (v: any) => {
        if (v === null || v === undefined) return undefined;
        const num = Number(v);
        if (Number.isFinite(num)) {
          const ms = num > 10_000_000_000 ? num : num * 1000;
          return new Date(ms).toISOString();
        }
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
      };
      return ({
        id: row.id,
        title: row.title,
        excerpt: row.excerpt ?? '',
        content: row.content ?? '',
        category: row.category ?? 'General',
        tags: (() => { try { return JSON.parse(row.tags || '[]'); } catch { return []; } })(),
        imageUrl: row.image_url ?? row.imageUrl ?? '',
        videoUrl: row.video_url ?? null,
        pdfUrl: row.pdf_url ?? null,
        publishedAt: toIso(row.published_at) ?? new Date().toISOString(),
        createdAt: toIso(row.created_at) ?? null,
        readTime: row.read_time ?? '5 min read',
        slug: row.slug,
        hasTimer: !!row.has_timer,
        timerDuration: row.timer_duration ?? null,
        timerStartTime: toIso(row.timer_start_time) ?? null,
      } as unknown) as BlogPost;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting blog post by id:', error);
      return null;
    }
  }

  // Affiliate networks list
  async getAffiliateNetworks(): Promise<AffiliateNetwork[]> {
    try {
      const rows = sqliteDb.prepare(`
        SELECT 
          id,
          name,
          slug,
          description,
          commission_rate AS commissionRate,
          tracking_params AS trackingParams,
          logo_url AS logoUrl,
          is_active AS isActive,
          join_url AS joinUrl
        FROM affiliate_networks
        ORDER BY id ASC
      `).all() as any[];
      return rows as AffiliateNetwork[];
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting affiliate networks:', error);
      return [];
    }
  }

  // Admin Product Management (unified_content)
  async addProduct(productData: any): Promise<Product> {
    try {
      const title = String(productData.name || '').trim();
      const description = String(productData.description || '').trim();
      const imageUrl = String(productData.imageUrl || '').trim();
      const affiliateUrl = String(productData.affiliateUrl || '').trim();
      const category = String(productData.category || '').trim();

      if (!title || !imageUrl || !affiliateUrl || !category) {
        throw new Error('Missing required fields: name, imageUrl, affiliateUrl, category');
      }

      const toNumber = (val: any) => {
        if (val === null || val === undefined || val === '') return null;
        const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.\-]/g, '')) : Number(val);
        return Number.isFinite(num) ? num : null;
      };

      const price = toNumber(productData.price);
      const originalPrice = toNumber(productData.originalPrice);
      const rating = toNumber(productData.rating);
      const reviewCount = toNumber(productData.reviewCount);
      const isFeatured = productData.isFeatured ? 1 : 0;
      const isService = productData.isService ? 1 : 0;

      // Persist selected pages as JSON string if provided and auto-tag common pages
      const displayPagesArr: string[] = Array.isArray(productData.displayPages)
        ? Array.from(new Set(productData.displayPages.map((p: any) => String(p).trim().toLowerCase()).filter(Boolean)))
        : [];

      // Auto-tag Services page when service flag is set
      if (isService && !displayPagesArr.includes('services')) {
        displayPagesArr.push('services');
      }
      // Auto-tag Apps page when AI App flag is set
      if (productData.isAIApp && !displayPagesArr.includes('apps')) {
        displayPagesArr.push('apps');
      }
      // Auto-tag Top Picks when featured is set
      if (isFeatured && !displayPagesArr.includes('top-picks')) {
        displayPagesArr.push('top-picks');
      }

      const displayPages = displayPagesArr.length > 0 ? JSON.stringify(displayPagesArr) : null;

      // Keep affiliateUrl as provided; Telegram bot handles link conversion

      // Map content type based on flags
      let contentType = 'product';
      if (productData.isService) contentType = 'service';
      else if (productData.isAIApp) contentType = 'app';

      const currency = (productData.currency || 'INR').toString();

      const payload = {
        title,
        description,
        price,
        original_price: originalPrice,
        currency,
        image_url: imageUrl,
        affiliate_url: affiliateUrl,
        category,
        rating,
        review_count: reviewCount,
        content_type: contentType,
        is_featured: isFeatured,
        is_service: isService,
        display_pages: displayPages,
      } as any;

      const stmt = sqliteDb.prepare(`
        INSERT INTO unified_content (
          title, description, price, original_price, currency,
          image_url, affiliate_url, category, rating, review_count,
          content_type, status, visibility, processing_status,
          is_featured, is_service, display_pages, created_at, updated_at
        ) VALUES (
          @title, @description, @price, @original_price, @currency,
          @image_url, @affiliate_url, @category, @rating, @review_count,
          @content_type, 'active', 'public', 'completed',
          @is_featured, @is_service, @display_pages, datetime('now'), datetime('now')
        )
      `);

      const result = stmt.run(payload);
      const newId = Number(result.lastInsertRowid);
      const created = await this.getProductById(newId);
      if (!created) throw new Error('Failed to fetch created product');
      return created;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error adding product:', error);
      throw error;
    }
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | null> {
    try {
      const setClauses: string[] = [];
      const params: any = { id };

      const mapField = (field: string, column: string, transform?: (v: any) => any) => {
        const val = (updates as any)[field];
        if (val !== undefined) {
          params[column] = transform ? transform(val) : val;
          setClauses.push(`${column} = @${column}`);
        }
      };

      // No normalization on update; accept provided affiliateUrl

      const toNumber = (val: any) => {
        if (val === null || val === undefined || val === '') return null;
        const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.\-]/g, '')) : Number(val);
        return Number.isFinite(num) ? num : null;
      };

      mapField('name', 'title', (v) => String(v).trim());
      mapField('description', 'description', (v) => String(v).trim());
      mapField('price', 'price', toNumber);
      mapField('originalPrice', 'original_price', toNumber);
      mapField('currency', 'currency', (v) => String(v));
      mapField('imageUrl', 'image_url', (v) => String(v).trim());
      mapField('affiliateUrl', 'affiliate_url', (v) => String(v).trim());
      mapField('category', 'category', (v) => String(v).trim());
      mapField('rating', 'rating', toNumber);
      mapField('reviewCount', 'review_count', toNumber);

      if ((updates as any).isFeatured !== undefined) {
        params['is_featured'] = (updates as any).isFeatured ? 1 : 0;
        setClauses.push('is_featured = @is_featured');
      }
      if ((updates as any).isService !== undefined) {
        params['is_service'] = (updates as any).isService ? 1 : 0;
        setClauses.push('is_service = @is_service');
      }

      if ((updates as any).displayPages !== undefined) {
        const arr = Array.isArray((updates as any).displayPages)
          ? Array.from(new Set((updates as any).displayPages.map((p: any) => String(p).trim().toLowerCase()).filter(Boolean)))
          : null;
        params['display_pages'] = arr ? JSON.stringify(arr) : null;
        setClauses.push('display_pages = @display_pages');
      }

      if (setClauses.length === 0) {
        // Nothing to update
        const current = await this.getProductById(id);
        return current;
      }

      const sqlStr = `UPDATE unified_content SET ${setClauses.join(', ')}, updated_at = datetime('now') WHERE id = @id`;
      sqliteDb.prepare(sqlStr).run(params);
      return await this.getProductById(id);
    } catch (error) {
      console.error('❌ DatabaseStorage: Error updating product:', error);
      return null;
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      const info = sqliteDb.prepare('DELETE FROM unified_content WHERE id = ?').run(id);
      return (info.changes || 0) > 0;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error deleting product:', error);
      return false;
    }
  }

  // Video Content Management using direct SQLite
  async getVideoContent(): Promise<any[]> {
    try {
      // Ensure table exists (idempotent)
      sqliteDb.prepare(`
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
          created_at INTEGER DEFAULT (strftime('%s','now')),
          updated_at INTEGER
        )
      `).run();

      const rows = sqliteDb.prepare(`
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
          timer_start_time * 1000 AS timerStartTime,
          created_at * 1000 AS createdAt,
          created_at * 1000 AS updatedAt
        FROM video_content
        ORDER BY created_at DESC, id DESC
      `).all();

      const normalized = (rows as any[]).map((r: any) => {
        // Parse tags which may be JSON array or CSV string
        let tagsArr: string[] | null = null;
        if (Array.isArray(r.tags)) {
          tagsArr = r.tags.map((t: any) => String(t));
        } else if (typeof r.tags === 'string' && r.tags.length) {
          try {
            const parsed = JSON.parse(r.tags);
            if (Array.isArray(parsed)) {
              tagsArr = parsed.map((t: any) => String(t));
            }
          } catch {
            tagsArr = r.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
        }

        // Parse pages which may be JSON array or CSV string
        let pagesArr: string[] = [];
        if (Array.isArray(r.pagesRaw)) {
          pagesArr = r.pagesRaw.map((p: any) => String(p).trim().toLowerCase()).filter(Boolean);
        } else if (typeof r.pagesRaw === 'string' && r.pagesRaw.length) {
          try {
            const parsed = JSON.parse(r.pagesRaw);
            if (Array.isArray(parsed)) {
              pagesArr = parsed.map((p: any) => String(p).trim().toLowerCase()).filter(Boolean);
            } else {
              pagesArr = r.pagesRaw.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
            }
          } catch {
            pagesArr = r.pagesRaw.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
          }
        }

        const out: any = {
          id: r.id,
          title: r.title,
          description: r.description,
          videoUrl: r.videoUrl,
          thumbnailUrl: r.thumbnailUrl,
          platform: r.platform,
          category: r.category,
          tags: tagsArr ?? r.tags ?? [],
          duration: r.duration,
          pages: pagesArr,
          showOnHomepage: !!r.showOnHomepage,
          hasTimer: r.hasTimer,
          timerDuration: r.timerDuration,
          timerStartTime: r.timerStartTime,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        };
        return out;
      });

      return normalized as any[];
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting video content:', error);
      return [];
    }
  }

  async addVideoContent(videoData: any): Promise<any> {
    try {
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
      // Normalize inputs
      const hasTimer = !!videoData.hasTimer;
      const timerDuration = hasTimer && videoData.timerDuration ? parseInt(String(videoData.timerDuration)) : null;
      const nowSec = Math.floor(Date.now() / 1000);
      const timerStartTime = hasTimer ? nowSec : null;
      const tags = Array.isArray(videoData.tags) ? JSON.stringify(videoData.tags) : (typeof videoData.tags === 'string' ? videoData.tags : null);
      const pages = (() => {
        let arr: string[] = [];
        if (Array.isArray(videoData.pages)) {
          arr = (videoData.pages as any[])
            .map((p: any) => String(p).trim().toLowerCase())
            .filter(Boolean);
        } else if (typeof videoData.pages === 'string') {
          arr = String(videoData.pages)
            .split(',')
            .map((s: string) => s.trim().toLowerCase())
            .filter(Boolean);
        }
        if (!arr.length) arr = DEFAULT_VIDEO_PAGES;
        return JSON.stringify(arr);
      })();
      const show_on_homepage = typeof videoData.showOnHomepage !== 'undefined' ? (videoData.showOnHomepage ? 1 : 0) : 1;

      const params = {
        title: String(videoData.title || '').trim(),
        description: videoData.description ?? null,
        video_url: String(videoData.videoUrl || videoData.video_url || '').trim(),
        thumbnail_url: videoData.thumbnailUrl ?? null,
        platform: videoData.platform ?? null,
        category: videoData.category ?? null,
        tags,
        duration: videoData.duration ?? null,
        has_timer: hasTimer ? 1 : 0,
        timer_duration: timerDuration,
        timer_start_time: timerStartTime,
        pages,
        show_on_homepage,
        created_at: nowSec
      };

      const insert = sqliteDb.prepare(`
        INSERT INTO video_content (
          title, description, video_url, thumbnail_url, platform, category, tags, duration,
          pages, show_on_homepage,
          has_timer, timer_duration, timer_start_time, created_at
        ) VALUES (
          @title, @description, @video_url, @thumbnail_url, @platform, @category, @tags, @duration,
          @pages, @show_on_homepage,
          @has_timer, @timer_duration, @timer_start_time, @created_at
        )
      `);
      const info = insert.run(params);
      const rowRaw = sqliteDb.prepare(`
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
          timer_start_time * 1000 AS timerStartTime,
          created_at * 1000 AS createdAt,
          created_at * 1000 AS updatedAt
        FROM video_content WHERE id = ?
      `).get(info.lastInsertRowid);

      // Normalize single row
      const r: any = rowRaw as any;
      let tagsArr: string[] | null = null;
      if (Array.isArray(r.tags)) {
        tagsArr = r.tags.map((t: any) => String(t));
      } else if (typeof r.tags === 'string' && r.tags.length) {
        try {
          const parsed = JSON.parse(r.tags);
          if (Array.isArray(parsed)) {
            tagsArr = parsed.map((t: any) => String(t));
          }
        } catch {
          tagsArr = r.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }

      // Canonicalize page slugs with synonyms mapping
      const normalizeSlug = (val: string): string => {
        const s = String(val || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        switch (s) {
          case 'apps-ai-apps':
          case 'apps-ai':
          case 'ai-apps':
            return 'apps';
          case 'prime-picks':
          case 'prime-pick':
          case 'prime':
          case 'primepicks':
            return 'prime-picks';
          case 'value-picks':
          case 'value-pick':
          case 'valuepicks':
            return 'value-picks';
          case 'top-picks':
          case 'top-pick':
          case 'toppicks':
            return 'top-picks';
          case 'travel-picks':
          case 'travel-pick':
            return 'travel-picks';
          case 'click-picks':
          case 'click-pick':
          case 'clickpicks':
            return 'click-picks';
          case 'cue-picks':
          case 'cue-pick':
          case 'cuepicks':
            return 'cue-picks';
          case 'blogs':
            return 'blog';
          default:
            return s;
        }
      };

      let pagesArr: string[] = [];
      if (Array.isArray(r.pagesRaw)) {
        pagesArr = r.pagesRaw.map((p: any) => normalizeSlug(p)).filter(Boolean);
      } else if (typeof r.pagesRaw === 'string' && r.pagesRaw.length) {
        try {
          const parsed = JSON.parse(r.pagesRaw);
          if (Array.isArray(parsed)) {
            pagesArr = parsed.map((p: any) => normalizeSlug(p)).filter(Boolean);
          } else {
            pagesArr = r.pagesRaw.split(',').map((s: string) => normalizeSlug(s)).filter(Boolean);
          }
        } catch {
          pagesArr = r.pagesRaw.split(',').map((s: string) => normalizeSlug(s)).filter(Boolean);
        }
      }

      return {
        id: r.id,
        title: r.title,
        description: r.description,
        videoUrl: r.videoUrl,
        thumbnailUrl: r.thumbnailUrl,
        platform: r.platform,
        category: r.category,
        tags: tagsArr ?? r.tags ?? [],
        duration: r.duration,
        pages: pagesArr,
        showOnHomepage: !!r.showOnHomepage,
        hasTimer: r.hasTimer,
        timerDuration: r.timerDuration,
        timerStartTime: r.timerStartTime,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      } as any;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error adding video content:', error);
      throw error;
    }
  }

  async updateVideoContent(id: number, updates: Partial<any>): Promise<any | null> {
    try {
      const normalized: any = { ...updates };
      if (typeof normalized.hasTimer !== 'undefined') {
        normalized.has_timer = normalized.hasTimer ? 1 : 0;
        delete normalized.hasTimer;
      }
      if (typeof normalized.timerDuration !== 'undefined') {
        normalized.timer_duration = normalized.timerDuration != null ? parseInt(String(normalized.timerDuration)) : null;
        delete normalized.timerDuration;
      }
      if (Array.isArray(normalized.tags)) {
        normalized.tags = JSON.stringify(normalized.tags);
      }
      // Canonicalize pages on write
      const normalizeSlug = (val: string): string => {
        const s = String(val || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        switch (s) {
          case 'apps-ai-apps':
          case 'apps-ai':
          case 'ai-apps':
            return 'apps';
          case 'prime-picks':
          case 'prime-pick':
          case 'prime':
          case 'primepicks':
            return 'prime-picks';
          case 'value-picks':
          case 'value-pick':
          case 'valuepicks':
            return 'value-picks';
          case 'top-picks':
          case 'top-pick':
          case 'toppicks':
            return 'top-picks';
          case 'travel-picks':
          case 'travel-pick':
            return 'travel-picks';
          case 'click-picks':
          case 'click-pick':
          case 'clickpicks':
            return 'click-picks';
          case 'cue-picks':
          case 'cue-pick':
          case 'cuepicks':
            return 'cue-picks';
          case 'blogs':
            return 'blog';
          default:
            return s;
        }
      };
      if (Array.isArray(normalized.pages)) {
        normalized.pages = JSON.stringify(
          (normalized.pages as any[]).map((p: any) => normalizeSlug(p)).filter(Boolean)
        );
      } else if (typeof normalized.pages === 'string') {
        const arr = String(normalized.pages)
          .split(',')
          .map((s: string) => normalizeSlug(s))
          .filter(Boolean);
        normalized.pages = JSON.stringify(arr);
      }
      if (typeof normalized.showOnHomepage !== 'undefined') {
        normalized.show_on_homepage = normalized.showOnHomepage ? 1 : 0;
        delete normalized.showOnHomepage;
      }
      // Map camelCase to snake_case for known fields
      if (typeof normalized.videoUrl !== 'undefined') {
        normalized.video_url = normalized.videoUrl;
        delete normalized.videoUrl;
      }
      if (typeof normalized.thumbnailUrl !== 'undefined') {
        normalized.thumbnail_url = normalized.thumbnailUrl;
        delete normalized.thumbnailUrl;
      }

      const allowed = [
        'title','description','video_url','thumbnail_url','platform','category','tags','duration',
        'pages','show_on_homepage',
        'has_timer','timer_duration','timer_start_time'
      ];
      const setClauses: string[] = [];
      const params: Record<string, any> = { id };
      for (const key of allowed) {
        if (key in normalized) {
          setClauses.push(`${key} = @${key}`);
          params[key] = (normalized as any)[key];
        }
      }
      if (setClauses.length === 0) {
        // Nothing to update, return current row
        return sqliteDb.prepare(`
          SELECT id, title, description, video_url AS videoUrl, thumbnail_url AS thumbnailUrl, platform, category, tags, duration,
                 pages AS pagesRaw, COALESCE(show_on_homepage, 1) AS showOnHomepage,
                 COALESCE(has_timer, 0) AS hasTimer, timer_duration AS timerDuration,
                 timer_start_time * 1000 AS timerStartTime,
                 created_at * 1000 AS createdAt, created_at * 1000 AS updatedAt
          FROM video_content WHERE id = ?
        `).get(id) ?? null;
      }

      const sqlStr = `UPDATE video_content SET ${setClauses.join(', ')} WHERE id = @id`;
      sqliteDb.prepare(sqlStr).run(params);

      const updated = sqliteDb.prepare(`
        SELECT id, title, description, video_url AS videoUrl, thumbnail_url AS thumbnailUrl, platform, category, tags, duration,
               pages AS pagesRaw, COALESCE(show_on_homepage, 1) AS showOnHomepage,
               COALESCE(has_timer, 0) AS hasTimer, timer_duration AS timerDuration,
               timer_start_time * 1000 AS timerStartTime,
               created_at * 1000 AS createdAt, created_at * 1000 AS updatedAt
        FROM video_content WHERE id = ?
      `).get(id);
      if (!updated) return null;
      const r: any = updated as any;
      let tagsArr: string[] | null = null;
      if (Array.isArray(r.tags)) {
        tagsArr = r.tags.map((t: any) => String(t));
      } else if (typeof r.tags === 'string' && r.tags.length) {
        try {
          const parsed = JSON.parse(r.tags);
          if (Array.isArray(parsed)) {
            tagsArr = parsed.map((t: any) => String(t));
          }
        } catch {
          tagsArr = r.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      // Canonicalize page slugs on read of updated row
      const normalizeSlugRead = (val: string): string => {
        const s = String(val || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        switch (s) {
          case 'apps-ai-apps':
          case 'apps-ai':
          case 'ai-apps':
            return 'apps';
          case 'prime-picks':
          case 'prime-pick':
          case 'prime':
          case 'primepicks':
            return 'prime-picks';
          case 'value-picks':
          case 'value-pick':
          case 'valuepicks':
            return 'value-picks';
          case 'top-picks':
          case 'top-pick':
          case 'toppicks':
            return 'top-picks';
          case 'travel-picks':
          case 'travel-pick':
            return 'travel-picks';
          case 'click-picks':
          case 'click-pick':
          case 'clickpicks':
            return 'click-picks';
          case 'cue-picks':
          case 'cue-pick':
          case 'cuepicks':
            return 'cue-picks';
          case 'blogs':
            return 'blog';
          default:
            return s;
        }
      };
      let pagesArr: string[] = [];
      if (Array.isArray(r.pagesRaw)) {
        pagesArr = r.pagesRaw.map((p: any) => normalizeSlugRead(p)).filter(Boolean);
      } else if (typeof r.pagesRaw === 'string' && r.pagesRaw.length) {
        try {
          const parsed = JSON.parse(r.pagesRaw);
          if (Array.isArray(parsed)) {
            pagesArr = parsed.map((p: any) => normalizeSlugRead(p)).filter(Boolean);
          } else {
            pagesArr = r.pagesRaw.split(',').map((s: string) => normalizeSlugRead(s)).filter(Boolean);
          }
        } catch {
          pagesArr = r.pagesRaw.split(',').map((s: string) => normalizeSlugRead(s)).filter(Boolean);
        }
      }
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        videoUrl: r.videoUrl,
        thumbnailUrl: r.thumbnailUrl,
        platform: r.platform,
        category: r.category,
        tags: tagsArr ?? r.tags ?? [],
        duration: r.duration,
        pages: pagesArr,
        showOnHomepage: !!r.showOnHomepage,
        hasTimer: r.hasTimer,
        timerDuration: r.timerDuration,
        timerStartTime: r.timerStartTime,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      } as any;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error updating video content:', error);
      return null;
    }
  }

  async deleteVideoContent(id: number): Promise<boolean> {
    try {
      const info = sqliteDb.prepare('DELETE FROM video_content WHERE id = ?').run(id);
      return (info.changes || 0) > 0;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error deleting video content:', error);
      return false;
    }
  }

  async deleteAllVideoContent(): Promise<number> {
    try {
      const info = sqliteDb.prepare('DELETE FROM video_content').run();
      return info.changes || 0;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error bulk deleting video content:', error);
      return 0;
    }
  }
}

export const storage = new DatabaseStorage();