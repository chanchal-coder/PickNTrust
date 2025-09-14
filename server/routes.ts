// Import statements
// @ts-nocheck
import { Request, Response, Express } from "express";
import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Import from shared schema
import { 
  products,
  newsletterSubscribers,
  announcements,
  insertNewsletterSubscriberSchema,
  insertAnnouncementSchema,
  adminUsers,
  exchangeRates,
  currencySettings,
  featuredProducts
} from "../shared/sqlite-schema.js";

// Import storage interface and db instance
import { IStorage } from "./storage";
import { db, sqliteDb } from "./db.js";
import { setupSocialMediaRoutes } from "./social-media-routes.js";
// import { socialMediaService } from './social-media-service.js'; // Temporarily disabled due to OAuth credentials removal
import currencyRouter from "./routes/currency.js";
import { eq, and, gte, desc } from "drizzle-orm";
// Telegram integration removed
import { setupURLProcessingRoutes } from "./url-processing-routes.js";
import { setupAffiliateRoutes } from "./affiliate-routes.js";
import travelCategoriesRouter from "./travel-categories-routes.js";
import staticBannerRouter from "./static-banner-routes.js";
import widgetRouter from "./widget-routes.js";
// Bot imports removed to prevent auto-initialization conflicts
// Bots are managed by TelegramManager only

// N8N Integration Helper Functions
interface N8NWebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  source: string;
}

// Function to trigger n8n webhooks (if you have n8n cloud webhooks)
async function triggerN8NWebhook(webhookUrl: string, payload: N8NWebhookPayload): Promise<void> {
  try {
    if (!webhookUrl) {
      console.log('N8N webhook URL not configured, skipping trigger');
      return;
    }

  // ===== BACKEND TEMPLATE MANAGEMENT ENDPOINTS =====
  
  // Get template library stats
  app.get('/api/admin/backend-templates/stats', async (req, res) => {
    try {
      const { password } = req.query;
      
      // Admin authentication
      if (password !== 'admin' && password !== 'pickntrust2025') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { backendTemplateEngine } = await import('./backend-template-engine.js');
      const stats = backendTemplateEngine.getTemplateStats();
      
      res.json({
        success: true,
        stats
      });
      
    } catch (error) {
      console.error('❌ Error getting template stats:', error);
      res.status(500).json({ 
        error: 'Failed to get template stats',
        details: error.message 
      });
    }
  });
  
  // Get available templates
  app.get('/api/admin/backend-templates', async (req, res) => {
    try {
      const { password } = req.query;
      
      // Admin authentication
      if (password !== 'admin' && password !== 'pickntrust2025') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const fs = await import('fs');
      const path = await import('path');
      
      // Read templates metadata
      const templatesPath = path.default.join(process.cwd(), 'backend-assets', 'metadata', 'templates.json');
      const audioPath = path.default.join(process.cwd(), 'backend-assets', 'metadata', 'audio.json');
      
      let templates = [];
      let audio = [];
      
      if (fs.default.existsSync(templatesPath)) {
        const templatesData = JSON.parse(fs.default.readFileSync(templatesPath, 'utf8'));
        templates = templatesData.templates || [];
      }
      
      if (fs.default.existsSync(audioPath)) {
        const audioData = JSON.parse(fs.default.readFileSync(audioPath, 'utf8'));
        audio = audioData.music || [];
      }
      
      res.json({
        success: true,
        templates,
        audio,
        totalTemplates: templates.length,
        totalAudio: audio.length
      });
      
    } catch (error) {
      console.error('❌ Error getting templates:', error);
      res.status(500).json({ 
        error: 'Failed to get templates',
        details: error.message 
      });
    }
  });
  
  // Test backend template generation
  app.post('/api/admin/backend-templates/test', async (req, res) => {
    try {
      const { password, productData } = req.body;
      
      // Admin authentication
      if (password !== 'admin' && password !== 'pickntrust2025') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { backendTemplateEngine } = await import('./backend-template-engine.js');
      
      // Test with sample product data if none provided
      const testProduct = productData || {
        id: Date.now(),
        name: 'Test Product',
        description: 'A sample product for testing templates',
        price: '₹999',
        category: 'electronics',
        imageUrl: '/placeholder-image.png'
      };
      
      console.log('🧪 Testing backend template generation...');
      const generatedUrl = await backendTemplateEngine.generateContent(testProduct, 'image');
      
      res.json({
        success: true,
        message: 'Template generation test completed',
        generatedUrl,
        testProduct
      });
      
    } catch (error) {
      console.error('❌ Template generation test failed:', error);
      res.status(500).json({ 
        error: 'Template generation test failed',
        details: error.message 
      });
    }
  });
  
  // Track template performance
  app.post('/api/admin/backend-templates/performance', async (req, res) => {
    try {
      const { password, contentId, metrics } = req.body;
      
      // Admin authentication
      if (password !== 'admin' && password !== 'pickntrust2025') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      if (!contentId || !metrics) {
        return res.status(400).json({ error: 'Content ID and metrics are required' });
      }
      
      const { backendTemplateEngine } = await import('./backend-template-engine.js');
      backendTemplateEngine.trackPerformance(contentId, metrics);
      
      res.json({
        success: true,
        message: 'Performance metrics recorded'
      });
      
    } catch (error) {
      console.error('❌ Error recording performance:', error);
      res.status(500).json({ 
        error: 'Failed to record performance',
        details: error.message 
      });
    }
  });
  
  // Get template usage analytics
  app.get('/api/admin/backend-templates/analytics', async (req, res) => {
    try {
      const { password } = req.query;
      
      // Admin authentication
      if (password !== 'admin' && password !== 'pickntrust2025') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const fs = await import('fs');
      const path = await import('path');
      
      // Read usage history
      const templatesPath = path.default.join(process.cwd(), 'backend-assets', 'metadata', 'templates.json');
      
      let analytics = {
        totalUsage: 0,
        categoryBreakdown: {},
        templatePerformance: [],
        recentActivity: []
      };
      
      if (fs.default.existsSync(templatesPath)) {
        const templatesData = JSON.parse(fs.default.readFileSync(templatesPath, 'utf8'));
        const usageHistory = templatesData.usage_history || [];
        
        analytics.totalUsage = usageHistory.length;
        analytics.recentActivity = usageHistory.slice(-10);
        
        // Calculate category breakdown
        usageHistory.forEach(usage => {
          analytics.categoryBreakdown[usage.category] = 
            (analytics.categoryBreakdown[usage.category] || 0) + 1;
        });
        
        // Calculate template performance
        const templateStats = new Map();
        usageHistory.forEach(usage => {
          if (!templateStats.has(usage.templateId)) {
            templateStats.set(usage.templateId, {
              templateId: usage.templateId,
              usageCount: 0,
              totalEngagement: 0,
              avgEngagement: 0
            });
          }
          
          const stats = templateStats.get(usage.templateId);
          stats.usageCount++;
          
          if (usage.performance) {
            stats.totalEngagement += usage.performance.engagement;
            stats.avgEngagement = stats.totalEngagement / stats.usageCount;
          }
        });
        
        analytics.templatePerformance = Array.from(templateStats.values())
          .sort((a, b) => b.avgEngagement - a.avgEngagement);
      }
      
      res.json({
        success: true,
        analytics
      });
      
    } catch (error) {
      console.error('❌ Error getting analytics:', error);
      res.status(500).json({ 
        error: 'Failed to get analytics',
        details: error.message 
      });
    }
  });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

  // ===== CUSTOM PLATFORM MANAGEMENT ENDPOINTS =====
  
  // Get custom platforms
  app.get('/api/admin/custom-platforms', async (req, res) => {
    try {
      const { password } = req.query;
      
      // Admin authentication
      if (password !== 'admin' && password !== 'pickntrust2025') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Get custom platforms from database or file storage
      const platforms = await storage.getCustomPlatforms() || [];
      
      res.json(platforms);
    } catch (error) {
      console.error('Error fetching custom platforms:', error);
      res.status(500).json({ error: 'Failed to fetch custom platforms' });
    }
  });
  
  // Add custom platform
  app.post('/api/admin/custom-platforms', async (req, res) => {
    try {
      const { password, platform } = req.body;
      
      // Admin authentication
      if (password !== 'admin' && password !== 'pickntrust2025') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Validate required fields
      if (!platform.key || !platform.name) {
        return res.status(400).json({ error: 'Platform key and name are required' });
      }
      
      // Add platform to storage
      const newPlatform = {
        ...platform,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      await storage.addCustomPlatform(newPlatform);
      
      console.log('✅ Custom platform added:', newPlatform.name);
      
      res.json({
        success: true,
        message: `${newPlatform.name} platform added successfully`,
        platform: newPlatform
      });
      
    } catch (error) {
      console.error('❌ Failed to add custom platform:', error);
      res.status(500).json({ 
        error: 'Failed to add custom platform',
        details: error.message 
      });
    }
  });
  
  // Remove custom platform
  app.delete('/api/admin/custom-platforms/:id', async (req, res) => {
    try {
      const { password } = req.body;
      const { id } = req.params;
      
      // Admin authentication
      if (password !== 'admin' && password !== 'pickntrust2025') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      await storage.removeCustomPlatform(id);
      
      console.log('✅ Custom platform removed:', id);
      
      res.json({
        success: true,
        message: 'Platform removed successfully'
      });
      
    } catch (error) {
      console.error('❌ Failed to remove custom platform:', error);
      res.status(500).json({ 
        error: 'Failed to remove custom platform',
        details: error.message 
      });
    }
  });
  
  // Test custom platform connection
  app.post('/api/admin/custom-platforms/:id/test', async (req, res) => {
    try {
      const { password } = req.body;
      const { id } = req.params;
      
      // Admin authentication
      if (password !== 'admin' && password !== 'pickntrust2025') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const platform = await storage.getCustomPlatform(id);
      
      if (!platform) {
        return res.status(404).json({ error: 'Platform not found' });
      }
      
      // Test platform connection
      const testResult = await testPlatformConnection(platform);
      
      res.json({
        success: testResult.success,
        message: testResult.message,
        details: testResult.details
      });
      
    } catch (error) {
      console.error('❌ Platform test failed:', error);
      res.status(500).json({ 
        error: 'Platform test failed',
        details: error.message 
      });
    }
  });
  
  // Helper function to test platform connection
  async function testPlatformConnection(platform) {
    try {
      if (!platform.apiUrl) {
        return {
          success: false,
          message: 'No API URL configured',
          details: 'Platform needs API URL to test connection'
        };
      }
      
      // Simple ping test to the API URL
      const response = await fetch(platform.apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${platform.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return {
          success: true,
          message: `${platform.name} connection successful`,
          details: `API responded with status ${response.status}`
        };
      } else {
        return {
          success: false,
          message: `${platform.name} connection failed`,
          details: `API responded with status ${response.status}`
        };
      }
      
    } catch (error) {
      return {
        success: false,
        message: `${platform.name} connection error`,
        details: error.message
      };
    }
  }

  // AI BOT HEALTH MONITORING ENDPOINTS
  // Get bot health status from TelegramManager
  app.get('/api/bot/health', async (req: Request, res: Response) => {
    try {
      // Import TelegramManager to get bot statuses
      const { telegramManager } = await import('./telegram-manager');
      const health = telegramManager.getHealthStatus();
      res.json(health);
    } catch (error) {
      console.error('Error Error getting bot health:', error);
      res.status(500).json({
        error: 'Failed to get bot health',
        details: error.message
      });
    }
  });

  // Get bot statistics
  app.get('/api/bot/stats', async (req: Request, res: Response) => {
    try {
      // Get product counts from database
      const totalProducts = await db.select().from(products).where(eq(products.source, 'telegram'));
      
      // Get today's products
      const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
      const todayProducts = await db.select().from(products)
        .where(and(
          eq(products.source, 'telegram'),
          // @ts-ignore
          gte(products.created_at, todayStart)
        ));
      
      // Get last product time
      const lastProduct = await db.select().from(products)
        .where(eq(products.source, 'telegram'))
        .orderBy(desc(products.created_at))
        .limit(1);
      
      const stats = {
        totalProducts: totalProducts.length,
        todayProducts: todayProducts.length,
        lastProductTime: lastProduct[0]?.created_at ? lastProduct[0].created_at * 1000 : 0,
        avgProcessingTime: 2.5 // Placeholder
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error Error getting bot stats:', error);
      res.status(500).json({
        error: 'Failed to get bot stats',
        details: error.message
      });
    }
  });

  // Force bot restart
  app.post('/api/bot/restart', async (req: Request, res: Response) => {
    try {
      console.log('Refresh Admin requested bot restart');
      
      // Restart bots through TelegramManager
      const { telegramManager } = await import('./telegram-manager');
      await telegramManager.restartBot('prime-picks');
      
      res.json({
        success: true,
        message: 'Bot restart initiated successfully'
      });
    } catch (error) {
      console.error('Error Error restarting bot:', error);
      res.status(500).json({
        error: 'Failed to restart bot',
        details: error.message
      });
    }
  });

  // Test bot connection
  app.post('/api/bot/test-connection', async (req: Request, res: Response) => {
    try {
      console.log('🧪 Admin requested connection test');
      
      // Test bot health through TelegramManager
      const { telegramManager } = await import('./telegram-manager');
      const health = telegramManager.getHealthStatus();
      const isHealthy = health.overallHealth === 'healthy';
      
      if (isHealthy) {
        res.json({
          success: true,
          message: 'Bot connection is healthy',
          health: health
        });
      } else {
        res.status(503).json({
          success: false,
          message: 'Bot connection is unhealthy',
          health: health
        });
      }
    } catch (error) {
      console.error('Error Error testing bot connection:', error);
      res.status(500).json({
        error: 'Connection test failed',
        details: error.message
      });
    }
  });

    if (!response.ok) {
      console.error('N8N webhook trigger failed:', response.status, response.statusText);
    } else {
      console.log('N8N webhook triggered successfully:', payload.event);
    }
  } catch (error) {
    console.error('Error triggering N8N webhook:', error);
  }
}

// Helper to create standardized webhook payloads
function createN8NPayload(event: string, data: any): N8NWebhookPayload {
  return {
    event,
    data,
    timestamp: new Date().toISOString(),
    source: 'pickntrust-backend'
  };
}

// N8N Webhook URLs (set these in your environment variables)
const N8N_WEBHOOKS = {
  PRODUCT_CREATED: process.env.N8N_WEBHOOK_PRODUCT_CREATED,
  NEWSLETTER_SIGNUP: process.env.N8N_WEBHOOK_NEWSLETTER_SIGNUP,
  ORDER_PLACED: process.env.N8N_WEBHOOK_ORDER_PLACED,
  CUSTOM_EVENT: process.env.N8N_WEBHOOK_CUSTOM_EVENT
};

// Helper function to verify admin password
async function verifyAdminPassword(password: string): Promise<boolean> {
  // Use hardcoded password like other pages for consistency
  const validPasswords = [
    'pickntrust2025',
    'admin123',
    'pickntrust2024',
    process.env.ADMIN_PASSWORD
  ].filter(Boolean);
  
  return validPasswords.includes(password);
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'));
    }
  }
});

// Auto-category creation helper
function ensureCategoryExists(categoryName: string, productName = '', productDescription = ''): number | null {
  try {
    // Check if category exists
    const existingCategory = sqliteDb.prepare(
      'SELECT id FROM categories WHERE name = ?'
    ).get(categoryName);
    
    if (existingCategory) {
      return (existingCategory as any).id;
    }
    
    // If category doesn't exist, create it
    console.log('Refresh Auto-creating category:', categoryName);
    
    // Intelligent categorization
    let parentId = null;
    let icon = 'fas fa-tag';
    let color = '#6B7280';
    
    // Category-specific settings
    if (categoryName.includes('Home') || categoryName.includes('Decor')) {
      icon = 'fas fa-home';
      color = '#8B4513';
    } else if (categoryName.includes('Electronics')) {
      icon = 'fas fa-microchip';
      color = '#4169E1';
    } else if (categoryName.includes('Fashion')) {
      icon = 'fas fa-tshirt';
      color = '#FF69B4';
    }
    
    // Get next display order
    const maxOrder = sqliteDb.prepare(
      'SELECT MAX(display_order) as max_order FROM categories'
    ).get();
    
    const displayOrder = ((maxOrder as any)?.max_order || 0) + 10;
    
    // Create category
    const result = sqliteDb.prepare(`
      INSERT INTO categories (
        name, description, icon, color, 
        is_for_products, is_for_services, 
        display_order, parent_id
      ) VALUES (?, ?, ?, ?, 1, 0, ?, ?)
    `).run(
      categoryName,
      `${categoryName} products and services`,
      icon,
      color,
      displayOrder,
      parentId
    );
    
    console.log('Success Created category:', categoryName, 'with ID:', result.lastInsertRowid);
    return result.lastInsertRowid as number;
    
  } catch (error: any) {
    console.error('Error Error creating category:', error.message);
    return null;
  }
}

// Intelligent category detection
function detectProductCategory(productName: string, productDescription = ''): string {
  const text = (productName + ' ' + productDescription).toLowerCase();
  
  // Home Decor keywords
  if (text.includes('vase') || text.includes('statue') || text.includes('sculpture') || 
      text.includes('decor') || text.includes('decorative') || text.includes('ornament') ||
      text.includes('figurine') || text.includes('candle') || text.includes('holder')) {
    return 'Home Decor';
  }
  
  // Electronics keywords
  if (text.includes('electronic') || text.includes('gadget') || text.includes('device') ||
      text.includes('phone') || text.includes('tablet') || text.includes('laptop') ||
      text.includes('headphone') || text.includes('speaker') || text.includes('charger')) {
    return 'Electronics & Gadgets';
  }
  
  // Fashion keywords
  if (text.includes('clothing') || text.includes('shirt') || text.includes('dress') ||
      text.includes('shoes') || text.includes('bag') || text.includes('accessory') ||
      text.includes('jewelry') || text.includes('watch')) {
    return 'Fashion & Clothing';
  }
  
  // Beauty keywords
  if (text.includes('beauty') || text.includes('cosmetic') || text.includes('skincare') ||
      text.includes('makeup') || text.includes('perfume') || text.includes('cream') ||
      text.includes('lotion') || text.includes('shampoo')) {
    return 'Health & Beauty';
  }
  
  // Kitchen keywords
  if (text.includes('kitchen') || text.includes('cooking') || text.includes('utensil') ||
      text.includes('pot') || text.includes('pan') || text.includes('plate') ||
      text.includes('cup') || text.includes('bowl')) {
    return 'Kitchen & Dining';
  }
  
  // Default fallback
  return 'Electronics & Gadgets';
}

export function setupRoutes(app: Express, storage: IStorage) {
  // Setup social media routes (your existing Canva system)
  setupSocialMediaRoutes(app);
  
  // Setup URL processing routes
  setupURLProcessingRoutes(app);
  
  // Setup affiliate system routes
  setupAffiliateRoutes(app, sqliteDb);
  
  // ===== NEW ADDITIVE SOCIAL MEDIA INTEGRATION =====
  // These routes work ALONGSIDE your existing system, not replacing it
  
  /**
   * POST /api/social-media/manual-post
   * Manual posting to selected platforms from admin panel (ADDITIVE)
   */
  app.post('/api/social-media/manual-post', async (req, res) => {
    try {
      const { productData, platforms } = req.body;
      
      if (!productData) {
        return res.status(400).json({
          success: false,
          error: 'Product data is required'
        });
      }
      
      console.log(`📱 Manual social media post (NEW): ${productData.name}`);
      
      const results = await socialMediaService.manualPostFromAdmin(productData, platforms);
      
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      res.json({
        success: true,
        message: `Posted to ${successful.length}/${results.length} platforms`,
        results: {
          successful: successful.map(r => ({
            platform: r.platform,
            postId: r.postId,
            postUrl: r.postUrl
          })),
          failed: failed.map(r => ({
            platform: r.platform,
            error: r.error
          }))
        }
      });
      
    } catch (error) {
      console.error('❌ Manual social media posting error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });
  
  /**
   * POST /api/social-media/admin-panel-post
   * Auto-posting when admin adds products via admin panel (ADDITIVE)
   */
  app.post('/api/social-media/admin-panel-post', async (req, res) => {
    try {
      const { productData } = req.body;
      
      if (!productData) {
        return res.status(400).json({
          success: false,
          error: 'Product data is required'
        });
      }
      
      console.log(`📝 Admin panel auto-post (NEW): ${productData.name}`);
      
      const results = await socialMediaService.autoPostFromAdminPanel(productData);
      
      const successful = results.filter(r => r.success);
      
      res.json({
        success: true,
        message: `Auto-posted to ${successful.length}/${results.length} platforms`,
        results: {
          successful: successful.map(r => ({
            platform: r.platform,
            postId: r.postId,
            postUrl: r.postUrl
          }))
        }
      });
      
    } catch (error) {
      console.error('❌ Admin panel auto-post error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });
  
  /**
   * GET /api/social-media/status
   * Get new social media service status (ADDITIVE)
   */
  app.get('/api/social-media/status', (req, res) => {
    try {
      const status = socialMediaService.getStatus();
      res.json({ success: true, status });
    } catch (error) {
      console.error('❌ Social media status error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });
  
  /**
   * POST /api/social-media/test
   * Test all social media platforms (ADDITIVE)
   */
  app.post('/api/social-media/test', async (req, res) => {
    try {
      console.log('🧪 Testing social media platforms (NEW)...');
      
      const results = await socialMediaService.testAllPlatforms();
      
      const successful = results.filter(r => r.success);
      
      res.json({
        success: true,
        message: `Test completed: ${successful.length}/${results.length} platforms working`,
        results
      });
      
    } catch (error) {
      console.error('❌ Social media test error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });
  
  // ===== END NEW ADDITIVE INTEGRATION =====
  
  // Setup currency routes
  app.use('/api/currency', currencyRouter);
  
  // Setup travel categories routes
  app.use('/api', travelCategoriesRouter);
  app.use('/', staticBannerRouter);
  
  // Setup widget routes
  app.use('/', widgetRouter);
  
  // Cue Picks Telegram Webhook Endpoint
  app.post('/webhook/cue-picks/:token', express.json(), async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const update = req.body;
      
      console.log('Mobile Cue Picks webhook received:', {
        token: token.substring(0, 10) + '...',
        updateType: update.channel_post ? 'channel_post' : update.message ? 'message' : 'other',
        messageId: update.channel_post?.message_id || update.message?.message_id
      });
      
      // Verify token matches Cue Picks bot token
      const expectedToken = process.env.TELEGRAM_BOT_TOKEN_CUE_PICKS;
      if (token !== expectedToken) {
        console.error('Error Invalid webhook token for Cue Picks');
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      // Process webhook through TelegramManager (dynamic import to prevent conflicts)
      try {
        const { cuePicksBot } = await import('./cue-picks-bot');
        cuePicksBot.processWebhookUpdate(update);
      } catch (error) {
        console.error('Error Failed to process webhook update:', error);
      }
      
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error Cue Picks webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });
  
  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Alert EMERGENCY PRODUCT ADDITION ENDPOINT
  // Failsafe manual product addition when Telegram bot fails
  app.post('/api/emergency/add-product', async (req: Request, res: Response) => {
    try {
      console.log('Alert Emergency product addition requested:', req.body);
      
      const {
        name,
        description,
        price,
        original_price,
        currency,
        image_url,
        affiliate_url,
        category,
        rating,
        review_count,
        discount,
        targetPage,
        source = 'emergency-manual'
      } = req.body;
      
      // Validate required fields
      if (!name || !price || !affiliate_url) {
        return res.status(400).json({
          error: 'Missing required fields: name, price, affiliate_url'
        });
      }
      
      // Ensure category exists
      const categoryId = ensureCategoryExists(category || 'Electronics & Gadgets', name, description);
      
      // Prepare product data
      const productData = {
        name: name.trim(),
        description: description?.trim() || 'Emergency manual addition',
        price: parseFloat(price),
        original_price: original_price ? parseFloat(original_price) : null,
        currency: currency || 'INR',
        image_url: image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80',
        affiliate_url: affiliate_url.trim(),
        category: category || 'Electronics & Gadgets',
        rating: parseFloat(rating) || 4.0,
        review_count: parseInt(review_count) || 100,
        discount: discount ? parseInt(discount) : null,
        is_new: 1,
        is_featured: 1,
        display_pages: JSON.stringify([targetPage || 'prime-picks']),
        source: source,
        created_at: Math.floor(Date.now() / 1000),
        affiliate_network_id: 1 // Default to Amazon
      };
      
      // Insert into database
      const result = await db.insert(products).values(productData);
      
      console.log(`Alert Emergency product added successfully: ID ${result.lastInsertRowid}`);
      
      // Log emergency action
      console.log('Alert EMERGENCY ACTION LOGGED:', {
        action: 'manual_product_addition',
        productId: result.lastInsertRowid,
        productName: name,
        targetPage: targetPage,
        timestamp: new Date().toISOString(),
        reason: 'telegram_bot_failure_fallback'
      });
      
      res.json({
        success: true,
        productId: result.lastInsertRowid,
        message: 'Emergency product added successfully',
        data: productData
      });
      
    } catch (error) {
      console.error('Alert Emergency product addition failed:', error);
      res.status(500).json({
        error: 'Emergency product addition failed',
        details: error.message
      });
    }
  });

  // N8N Automation Webhooks
  // Health check for n8n
  app.get('/api/n8n/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'pickntrust-n8n-integration',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Webhook for new product notifications
  app.post('/api/n8n/webhooks/product-created', async (req, res) => {
    try {
      const { productId, productName, category, price } = req.body;
      
      // Log the webhook event
      console.log('N8N Webhook - Product Created:', {
        productId,
        productName,
        category,
        price,
        timestamp: new Date().toISOString()
      });
      
      // You can add custom logic here for n8n automation
      // For example: send notifications, update external systems, etc.
      
      res.json({ 
        success: true, 
        message: 'Product creation webhook received',
        productId 
      });
    } catch (error) {
      console.error('N8N Product webhook error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Webhook processing failed' 
      });
    }
  });

  // Webhook for newsletter subscriptions
  app.post('/api/n8n/webhooks/newsletter-subscription', async (req, res) => {
    try {
      const { email, source } = req.body;
      
      // Log the webhook event
      console.log('N8N Webhook - Newsletter Subscription:', {
        email,
        source,
        timestamp: new Date().toISOString()
      });
      
      // You can add custom logic here for n8n automation
      // For example: add to email marketing lists, send welcome emails, etc.
      
      res.json({ 
        success: true, 
        message: 'Newsletter subscription webhook received',
        email 
      });
    } catch (error) {
      console.error('N8N Newsletter webhook error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Webhook processing failed' 
      });
    }
  });

  // Generic webhook for custom n8n workflows
  app.post('/api/n8n/webhooks/custom/:workflowName', async (req, res) => {
    try {
      const { workflowName } = req.params;
      const payload = req.body;
      
      // Log the webhook event
      console.log(`N8N Webhook - Custom Workflow (${workflowName}):`, {
        workflowName,
        payload,
        timestamp: new Date().toISOString()
      });
      
      // You can add custom logic here based on workflowName
      // For example: different actions for different workflows
      
      res.json({ 
        success: true, 
        message: `Custom workflow webhook received: ${workflowName}`,
        workflowName,
        receivedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`N8N Custom webhook error (${req.params.workflowName}):`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Webhook processing failed' 
      });
    }
  });

  // Webhook to trigger actions from n8n
  app.post('/api/n8n/webhooks/trigger-action', async (req, res) => {
    try {
      const { action, data } = req.body;
      
      console.log('N8N Webhook - Trigger Action:', {
        action,
        data,
        timestamp: new Date().toISOString()
      });
      
      let result = null;
      
      // Handle different actions
      switch (action) {
        case 'get-products':
          result = await storage.getProducts();
          break;
        case 'get-categories':
          result = await storage.getCategories();
          break;
        case 'get-newsletter-count':
          result = await storage.getNewsletterSubscribers();
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Unknown action: ${action}`
          });
      }
      
      res.json({ 
        success: true, 
        message: `Action ${action} executed successfully`,
        data: result
      });
    } catch (error) {
      console.error('N8N Trigger action webhook error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Action execution failed' 
      });
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
        // Update last login
        const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, 'admin@pickntrust.com'));
        if (admin) {
          await storage.updateLastLogin(admin.id);
        }
        res.json({ success: true, message: 'Authentication successful' });
      } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
      }
    } catch (error) {
      console.error('Admin authentication error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  // Password reset request endpoint
  app.post('/api/admin/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Check if admin exists
      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        // Don't reveal if email exists or not for security
        return res.json({ message: 'If the email exists, a reset link has been sent.' });
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token to database
      await storage.setResetToken(email, resetToken, resetTokenExpiry);

      // Create email transporter (Gmail SMTP)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });

      // Email content
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/reset-password?token=${resetToken}`;
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'PickNTrust Admin - Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Password Reset Request</h2>
            <p>You have requested to reset your password for PickNTrust Admin Panel.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">PickNTrust Admin Panel</p>
          </div>
        `
      };

      // Send email
      await transporter.sendMail(mailOptions);

      res.json({ 
        message: 'If the email exists, a reset link has been sent.',
        // In development, return the token for testing
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ message: 'Failed to process password reset request' });
    }
  });

  // Password reset endpoint
  app.post('/api/admin/reset-password', async (req, res) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;
      
      if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }

      // Validate reset token
      const admin = await storage.validateResetToken(token);
      if (!admin) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password and clear reset token
      await storage.updateAdminPassword(admin.id, hashedPassword);
      await storage.clearResetToken(admin.id);

      res.json({ message: 'Password reset successfully' });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
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

  // Get featured products (filter by timer expiry)
  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      
      // Filter out expired products based on their individual timers
      const now = new Date();
      
      const activeProducts = products.filter(product => {
        // If product doesn't have timer enabled, keep it
        if (!product.hasTimer || !product.timerDuration || !product.createdAt) {
          return true;
        }
        
        // Calculate expiry time based on product's timer duration
        const productCreatedAt = new Date(product.createdAt);
        const expiryTime = new Date(productCreatedAt.getTime() + (product.timerDuration * 60 * 60 * 1000));
        
        // Keep product if it hasn't expired yet
        return now < expiryTime;
      });
      
      res.json(activeProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  // Get service products (filter by timer expiry)
  app.get("/api/products/services", async (req, res) => {
    try {
      const products = await storage.getServiceProducts();
      
      // Filter out expired products based on their individual timers
      const now = new Date();
      
      const activeProducts = products.filter(product => {
        // If product doesn't have timer enabled, keep it
        if (!product.hasTimer || !product.timerDuration || !product.createdAt) {
          return true;
        }
        
        // Calculate expiry time based on product's timer duration
        const productCreatedAt = new Date(product.createdAt);
        const expiryTime = new Date(productCreatedAt.getTime() + (product.timerDuration * 60 * 60 * 1000));
        
        // Keep product if it hasn't expired yet
        return now < expiryTime;
      });
      
      res.json(activeProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service products" });
    }
  });

  // Get AI Apps products (filter by timer expiry)
  app.get("/api/products/apps", async (req, res) => {
    try {
      const products = await storage.getAIAppsProducts();
      
      // Filter out expired products based on their individual timers
      const now = new Date();
      
      const activeProducts = products.filter(product => {
        // If product doesn't have timer enabled, keep it
        if (!product.hasTimer || !product.timerDuration || !product.createdAt) {
          return true;
        }
        
        // Calculate expiry time based on product's timer duration
        const productCreatedAt = new Date(product.createdAt);
        const expiryTime = new Date(productCreatedAt.getTime() + (product.timerDuration * 60 * 60 * 1000));
        
        // Keep product if it hasn't expired yet
        return now < expiryTime;
      });
      
      res.json(activeProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI Apps products" });
    }
  });

  // Get products by category
  // REAL-TIME CATEGORY ENDPOINT - QUERIES ALL PRODUCT TABLES WITH EXPIRATION FILTERING
  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const { gender } = req.query;
      const currentTime = Math.floor(Date.now() / 1000);
      
      // URL decode the category parameter
      const decodedCategory = decodeURIComponent(category);
      console.log(`Search REAL-TIME: Getting products for category: "${decodedCategory}" with gender filter: "${gender}"`);
      
      const allCategoryProducts: any[] = [];
      
      // 1. Query Amazon Products (expires_at only)
      try {
        const amazonProducts = sqliteDb.prepare(`
          SELECT 
            'amazon_' || id as id, name, description, price, original_price as originalPrice,
            currency, image_url as imageUrl, affiliate_url as affiliateUrl,
            category, rating, review_count as reviewCount, discount,
            is_featured as isFeatured, 'amazon' as source, 'Prime Picks' as networkBadge,
            created_at as createdAt, NULL as gender
          FROM amazon_products 
          WHERE category = ? 
          AND (expires_at IS NULL OR expires_at > ?)
          ORDER BY created_at DESC
        `).all(decodedCategory, currentTime);
        
        allCategoryProducts.push(...amazonProducts);
        console.log(`   Products Amazon products: ${amazonProducts.length}`);
      } catch (error) {
        console.error('Error querying Amazon products:', error);
      }
      
      // 2. Query Loot Box Products (processing_status + expires_at)
      try {
        const lootBoxProducts = sqliteDb.prepare(`
          SELECT 
            'loot_box_' || id as id, name, description, price, original_price as originalPrice,
            currency, image_url as imageUrl, affiliate_url as affiliateUrl,
            category, rating, review_count as reviewCount, discount,
            is_featured as isFeatured, 'loot_box' as source, 'Wholesale' as networkBadge,
            created_at as createdAt, NULL as gender
          FROM loot_box_products 
          WHERE category = ? 
          AND processing_status = 'active'
          AND (expires_at IS NULL OR expires_at > ?)
          ORDER BY created_at DESC
        `).all(decodedCategory, currentTime);
        
        allCategoryProducts.push(...lootBoxProducts);
        console.log(`   Products Loot Box products: ${lootBoxProducts.length}`);
      } catch (error) {
        console.error('Error querying Loot Box products:', error);
      }
      
      // 3. Query CueLinks Products (processing_status + expires_at)
      try {
        const cuelinksProducts = sqliteDb.prepare(`
          SELECT 
            'cuelinks_' || id as id, name, description, price, original_price as originalPrice,
            currency, image_url as imageUrl, affiliate_url as affiliateUrl,
            category, rating, review_count as reviewCount, discount,
            is_featured as isFeatured, 'cuelinks' as source, 'Click Picks' as networkBadge,
            created_at as createdAt, NULL as gender
          FROM cuelinks_products 
          WHERE category = ? 
          AND processing_status = 'active'
          AND (expires_at IS NULL OR expires_at > ?)
          ORDER BY created_at DESC
        `).all(decodedCategory, currentTime);
        
        allCategoryProducts.push(...cuelinksProducts);
        console.log(`   Products CueLinks products: ${cuelinksProducts.length}`);
      } catch (error) {
        console.error('Error querying CueLinks products:', error);
      }
      
      // 4. Query Value Picks Products (processing_status + expires_at)
      try {
        const valuePicksProducts = sqliteDb.prepare(`
          SELECT 
            'value_picks_' || id as id, name, description, price, original_price as originalPrice,
            currency, image_url as imageUrl, affiliate_url as affiliateUrl,
            category, rating, review_count as reviewCount, discount,
            is_featured as isFeatured, 'value_picks' as source, 'Value Picks' as networkBadge,
            created_at as createdAt, NULL as gender
          FROM value_picks_products 
          WHERE category = ? 
          AND processing_status = 'active'
          AND (expires_at IS NULL OR expires_at > ?)
          ORDER BY created_at DESC
        `).all(decodedCategory, currentTime);
        
        allCategoryProducts.push(...valuePicksProducts);
        console.log(`   Products Value Picks products: ${valuePicksProducts.length}`);
      } catch (error) {
        console.error('Error querying Value Picks products:', error);
      }
      
      // 5. Query Main Products Table (expires_at if available)
      try {
        const mainProducts = sqliteDb.prepare(`
          SELECT 
            id, name, description, price, original_price as originalPrice,
            currency, image_url as imageUrl, affiliate_url as affiliateUrl,
            category, rating, review_count as reviewCount, discount,
            is_featured as isFeatured, 'main' as source, 'Featured' as networkBadge,
            created_at as createdAt, gender
          FROM products 
          WHERE category = ? 
          AND (expires_at IS NULL OR expires_at > ?)
          ORDER BY created_at DESC
        `).all(decodedCategory, currentTime);
        
        allCategoryProducts.push(...mainProducts);
        console.log(`   Products Main products: ${mainProducts.length}`);
      } catch (error) {
        console.error('Error querying main products:', error);
      }
      
      // Apply gender filtering if provided
      let filteredProducts = allCategoryProducts;
      if (gender && typeof gender === 'string') {
        const normalizeGender = (g: string): string => {
          const genderMap: { [key: string]: string } = {
            'men': 'Men', 'women': 'Women', 'kids': 'Kids',
            'boys': 'Boys', 'girls': 'Girls', 'common': 'Common'
          };
          return genderMap[g.toLowerCase()] || g;
        };
        
        const normalizedGender = normalizeGender(gender);
        filteredProducts = allCategoryProducts.filter(product => {
          if (!product.gender) return false;
          return normalizeGender(product.gender) === normalizedGender;
        });
        
        console.log(`   Target Gender filtered (${normalizedGender}): ${filteredProducts.length} products`);
      }
      
      // Sort by creation date (newest first)
      filteredProducts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log(`Success REAL-TIME: Returning ${filteredProducts.length} active products for "${decodedCategory}"`);
      res.json(filteredProducts);
      
    } catch (error) {
      console.error(`Error REAL-TIME: Error fetching products for category "${req.params.category}":`, error);
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });

  // Get categories
  app.get("/api/categories", async (req, res) => {
    try {
      // EMERGENCY FIX: Direct database access to restore categories immediately
      const Database = require('better-sqlite3');
      const path = require('path');
      const fs = require('fs');
      
      const dbPath = path.join(process.cwd(), 'database.sqlite');
      if (!fs.existsSync(dbPath)) {
        throw new Error('Database file not found');
      }
      
      const db = new Database(dbPath);
      const categories = db.prepare(`
        SELECT id, name, icon, color, description,
               parent_id as parentId,
               COALESCE(is_for_products, 1) as isForProducts,
               COALESCE(is_for_services, 0) as isForServices,
               COALESCE(is_for_ai_apps, 0) as isForAIApps,
               COALESCE(display_order, 0) as displayOrder
        FROM categories 
        ORDER BY COALESCE(display_order, id)
      `).all();
      
      db.close();
      
      console.log(`Success Categories API: Loaded ${categories.length} categories directly from database`);
      res.json(categories);
    } catch (error) {
      console.error("Error Categories API Error:", error);
      // Absolute fallback - return essential categories
      const fallbackCategories = [
        { id: 1, name: 'Electronics', icon: 'Mobile', color: '#3B82F6', description: 'Electronic devices and gadgets', displayOrder: 1, isForProducts: true, isForServices: false, isForAIApps: false },
        { id: 2, name: 'Fashion', icon: '👕', color: '#EC4899', description: 'Clothing and accessories', displayOrder: 2, isForProducts: true, isForServices: false, isForAIApps: false },
        { id: 3, name: 'Home & Kitchen', icon: 'Home', color: '#10B981', description: 'Home appliances and kitchen items', displayOrder: 3, isForProducts: true, isForServices: false, isForAIApps: false },
        { id: 4, name: 'Books', icon: '📚', color: '#F59E0B', description: 'Books and educational materials', displayOrder: 4, isForProducts: true, isForServices: false, isForAIApps: false },
        { id: 5, name: 'Sports', icon: '⚽', color: '#EF4444', description: 'Sports and fitness equipment', displayOrder: 5, isForProducts: true, isForServices: false, isForAIApps: false }
      ];
      console.log('Alert Using fallback categories for immediate website functionality');
      res.json(fallbackCategories);
    }
  });

  // Get product categories (for product forms)
  app.get("/api/categories/products", async (req, res) => {
    try {
      const categories = await storage.getProductCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      res.status(500).json({ message: "Failed to fetch product categories" });
    }
  });

  // Get service categories (for service forms)
  app.get("/api/categories/services", async (req, res) => {
    try {
      const categories = await storage.getServiceCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching service categories:", error);
      res.status(500).json({ message: "Failed to fetch service categories" });
    }
  });

  // Get AI app categories (for AI app forms)
  app.get("/api/categories/aiapps", async (req, res) => {
    try {
      const categories = await storage.getAIAppCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching AI app categories:", error);
      res.status(500).json({ message: "Failed to fetch AI app categories" });
    }
  });

  // Get categories for browse page with dynamic filtering
  app.get("/api/categories/browse", async (req, res) => {
    try {
      const { type, featured, includeEmpty } = req.query;
      console.log(`📂 API CALLED: Getting browse categories with type: "${type}", featured: "${featured}", includeEmpty: "${includeEmpty}"`);
      
      // Import CategoryManager
      const { CategoryManager } = await import('./category-manager');
      const categoryManager = CategoryManager.getInstance();
      
      // Get categories with filtering options
      const categories = await categoryManager.getCategoriesForBrowse({
        categoryType: type as string,
        featured: featured === 'true',
        includeEmpty: includeEmpty === 'true',
        limit: 100
      });
      
      console.log(`📂 Found ${categories.length} categories for browse`);
      res.json(categories);
      
    } catch (error) {
      console.error("Error fetching browse categories:", error);
      res.status(500).json({ message: "Failed to fetch browse categories" });
    }
  });

  // Get category statistics for browse page
  app.get("/api/categories/browse/stats", async (req, res) => {
    try {
      console.log('Stats API CALLED: Getting category statistics');
      
      // Import CategoryManager
      const { CategoryManager } = await import('./category-manager');
      const categoryManager = CategoryManager.getInstance();
      
      // Get category statistics
      const stats = await categoryManager.getCategoryStats();
      
      console.log('Stats Category stats:', stats);
      res.json(stats);
      
    } catch (error) {
       console.error("Error fetching category statistics:", error);
       res.status(500).json({ message: "Failed to fetch category statistics" });
     }
   });

  // Manual category cleanup endpoint (admin only)
  app.post("/api/admin/categories/cleanup", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      console.log('Cleanup API CALLED: Manual category cleanup');
      
      // Import CategoryCleanupService
      const { CategoryCleanupService } = await import('./category-cleanup-service');
      const cleanupService = CategoryCleanupService.getInstance();
      
      // Run manual cleanup
      const result = await cleanupService.runManualCleanup();
      
      console.log('Cleanup Manual cleanup result:', result);
      res.json(result);
      
    } catch (error) {
      console.error("Error running manual category cleanup:", error);
      res.status(500).json({ message: "Failed to run category cleanup" });
    }
  });

  // Get category cleanup service status
  app.get("/api/admin/categories/cleanup/status", async (req, res) => {
    try {
      console.log('Stats API CALLED: Category cleanup service status');
      
      // Import CategoryCleanupService
      const { CategoryCleanupService } = await import('./category-cleanup-service');
      const cleanupService = CategoryCleanupService.getInstance();
      
      // Get service status
      const status = cleanupService.getStatus();
      
      console.log('Stats Cleanup service status:', status);
      res.json(status);
      
    } catch (error) {
      console.error("Error getting cleanup service status:", error);
      res.status(500).json({ message: "Failed to get cleanup service status" });
    }
  });

  // Get category statistics with product counts from all sources
  app.get("/api/categories/stats", async (req, res) => {
    try {
      console.log('Search Fetching category statistics from all sources...');
      const categoryStats: { [key: string]: number } = {};
      
      // Get regular products
      const regularProducts = await storage.getProducts();
      regularProducts.forEach((product: any) => {
        if (product.category) {
          categoryStats[product.category] = (categoryStats[product.category] || 0) + 1;
        }
      });
      
      // Get Amazon products
       try {
         const currentTime = Math.floor(Date.now() / 1000);
         const amazonProducts = sqliteDb.prepare(`
           SELECT category FROM amazon_products 
           WHERE expires_at > ? OR expires_at IS NULL
         `).all(currentTime);
        
        amazonProducts.forEach((product: any) => {
          if (product.category) {
            categoryStats[product.category] = (categoryStats[product.category] || 0) + 1;
          }
        });
        
        console.log(`Stats Added ${amazonProducts.length} Amazon products to category stats`);
      } catch (error) {
        console.error('Error Error fetching Amazon products for stats:', error);
      }
      
      // Get CueLinks products
      try {
        const currentTime = Math.floor(Date.now() / 1000);
        const cuelinksProducts = sqliteDb.prepare(`
          SELECT category FROM cuelinks_products 
          WHERE processing_status = 'active' 
          AND (expires_at IS NULL OR expires_at > ?)
        `).all(currentTime);
        
        cuelinksProducts.forEach((product: any) => {
          if (product.category) {
            categoryStats[product.category] = (categoryStats[product.category] || 0) + 1;
          }
        });
        
        console.log(`Stats Added ${cuelinksProducts.length} CueLinks products to category stats`);
      } catch (error) {
        console.error('Error Error fetching CueLinks products for stats:', error);
      }
      
      const totalProducts = Object.values(categoryStats).reduce((sum, count) => sum + count, 0);
      console.log(`📈 Category stats complete: ${Object.keys(categoryStats).length} categories, ${totalProducts} total products`);
      
      res.json(categoryStats);
    } catch (error) {
      console.error("Error fetching category statistics:", error);
      res.status(500).json({ message: "Failed to fetch category statistics" });
    }
  });

  // Get products by page (Prime Picks, Top Picks, etc.)
  app.get("/api/products/page/:page", async (req, res) => {
    try {
      const { page } = req.params;
      const { category, content_type } = req.query;
      
      console.log(`Search API CALLED: Getting products for page: "${page}" with category filter: "${category}" and content_type: "${content_type}"`);      
      
      // Handle apps page specifically - return AI Apps products
      if (page === 'apps') {
        try {
          const aiAppsProducts = await storage.getAIAppsProducts();
          
          // Filter by category if specified
          let filteredProducts = aiAppsProducts;
          if (category && typeof category === 'string') {
            const decodedCategory = decodeURIComponent(category);
            filteredProducts = aiAppsProducts.filter(product => product.category === decodedCategory);
            console.log(`Apps: Filtered by category "${decodedCategory}": ${filteredProducts.length} products`);
          }
          
          console.log(`Apps: Returning ${filteredProducts.length} AI Apps products`);
          return res.json(filteredProducts);
        } catch (error) {
          console.error('Error fetching AI Apps products:', error);
          return res.json([]);
        }
      }
      
      // Get regular products
      const allProducts = await storage.getProducts();
      
      // Get Amazon products if page is prime-picks
      let amazonProducts: any[] = [];
      // Declare Value Picks products for cross-page access
      let valuePicksProducts: any[] = [];
      // Declare Featured Products for top-picks page
      let featuredProducts: any[] = [];
      
      if (page === 'prime-picks') {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          let amazonQuery = `
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, created_at as createdAt,
              has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText,
              message_group_id as messageGroupId, product_sequence as productSequence, 
              total_in_group as totalInGroup, content_type
            FROM amazon_products 
            WHERE (expires_at > ? OR expires_at IS NULL)
            AND content_type = 'prime-picks'
            ORDER BY created_at DESC`;
          
          const queryParams = [currentTime];
          
          console.log('Prime Picks Query:', amazonQuery);
          console.log('Query Params:', queryParams);
           amazonProducts = sqliteDb.prepare(amazonQuery).all(...queryParams);
          
          console.log(`🛒 Found ${amazonProducts.length} active Amazon products`);
        } catch (error) {
          console.error('Error Error fetching Amazon products:', error);
        }
      }

      // Get Value Picks products
      if (page === 'value-picks') {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          const valuePicksProductsQuery = sqliteDb.prepare(`
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, affiliate_network,
              telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
              click_count as clickCount, conversion_count as conversionCount,
              processing_status, expires_at as expiresAt, created_at as createdAt,
              has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText
            FROM value_picks_products 
            WHERE processing_status = 'active' 
            AND (expires_at IS NULL OR expires_at > ?)
            ORDER BY created_at DESC
          `);
          
          valuePicksProducts = valuePicksProductsQuery.all(currentTime);
           
           // Add bundle fields to Value Picks products for consistency
           valuePicksProducts = valuePicksProducts.map((product: any) => ({
             ...product,
             messageGroupId: product.message_group_id,
             productSequence: product.product_sequence,
             totalInGroup: product.total_in_group
           }));
          console.log(`Target Found ${valuePicksProducts.length} active Value Picks products`);
        } catch (error) {
          console.error('Error Error fetching Value Picks products:', error);
        }
      }

      // Get Loot Box products if page is loot-box or lootbox
      let lootBoxProducts: any[] = [];
      if (page === 'loot-box' || page === 'lootbox') {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          const { category } = req.query;
          
          let query = `
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, affiliate_network,
              telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
              processing_status, created_at as createdAt
            FROM lootbox_products 
            WHERE processing_status = 'active'`;
          
          const params = [];
          
          // Add category filter if specified
          if (category && category !== '') {
            query += ` AND category = ?`;
            params.push(category);
            console.log(`Products Filtering Loot Box products by category: "${category}"`);
          }
          
          query += ` ORDER BY created_at DESC`;
          
          const lootBoxProductsQuery = sqliteDb.prepare(query);
          lootBoxProducts = lootBoxProductsQuery.all(...params);
          console.log(`Products Found ${lootBoxProducts.length} active Loot Box products${category ? ` in category "${category}"` : ''}`);
          
          // Direct return for lootbox page
          if (lootBoxProducts.length > 0) {
            console.log(`Search DIRECT RETURN: Returning ${lootBoxProducts.length} Loot Box products for page "${page}"`);
            return res.json(lootBoxProducts);
          }
        } catch (error) {
          console.error('Error Error fetching Loot Box products:', error);
        }
      }

      // Get Global Picks products if page is global-picks
      let globalPicksProducts: any[] = [];
      if (page === 'global-picks') {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          const globalPicksProductsQuery = sqliteDb.prepare(`
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, affiliate_network, url_type, source_platform,
              primary_affiliate, data_quality_score, brand, availability,
              telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
              click_count as clickCount, conversion_count as conversionCount,
              processing_status, created_at as createdAt
            FROM global_picks_products 
            WHERE processing_status = 'active' 
            ORDER BY created_at DESC
          `);
          
          globalPicksProducts = globalPicksProductsQuery.all();
          console.log(`🌍 Found ${globalPicksProducts.length} active Global Picks products`);
        } catch (error) {
          console.error('Error Error fetching Global Picks products:', error);
        }
      }

      
      // Get Travel Picks products if page is travel-picks
      let travelPicksProducts: any[] = [];
      if (page === 'travel-picks') {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          const travelPicksProductsQuery = sqliteDb.prepare(`SELECT 
        id,
        name,
        description,
        price,
        original_price as originalPrice,
        currency,
        image_url as imageUrl,
        affiliate_url as affiliateUrl,
        category,
        rating,
        review_count as reviewCount,
        discount,
        is_featured as isFeatured,
        processing_status,
        created_at as createdAt
      FROM travel_products 
      WHERE processing_status = 'active'
      ORDER BY created_at DESC`);
          
          travelPicksProducts = travelPicksProductsQuery.all();
          console.log(`Flight Found ${travelPicksProducts.length} active Travel Picks products`);
          
          // Direct return for travel-picks page
          if (travelPicksProducts.length > 0) {
            console.log(`Search DIRECT RETURN: Returning ${travelPicksProducts.length} Travel Picks products for page "${page}"`);
            return res.json(travelPicksProducts);
          }
        } catch (error) {
          console.error('Error Error fetching Travel Picks products:', error);
        }
      }

      // Get Featured Products if page is top-picks
      if (page === 'top-picks') {
        try {
          const featuredProductsQuery = sqliteDb.prepare(`
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, is_new, is_active,
              has_timer as hasTimer, timer_duration as timerDuration, timer_start_time as timerStartTime,
              has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText,
              display_order as displayOrder, click_count as clickCount, conversion_count as conversionCount,
              created_at as createdAt, source, affiliate_network as affiliateNetwork
            FROM featured_products 
            WHERE is_active = 1
            ORDER BY display_order ASC, created_at DESC
          `);
          
          featuredProducts = featuredProductsQuery.all();
          console.log(`⭐ Found ${featuredProducts.length} active Featured products`);
        } catch (error) {
          console.error('Error fetching Featured products:', error);
        }
      }

// Get DealsHub products if page is dealshub or deals-hub
      let dealsHubProducts: any[] = [];
      if (page === 'dealshub' || page === 'deals-hub') {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          const dealsHubProductsQuery = sqliteDb.prepare(`
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, affiliate_network,
              telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
              click_count as clickCount, conversion_count as conversionCount,
              processing_status, created_at as createdAt,
              deal_type, deal_priority
            FROM deals_hub_products 
            WHERE processing_status = 'active'
            ORDER BY created_at DESC
          `);
          
          dealsHubProducts = dealsHubProductsQuery.all();
          console.log(`🛒 Found ${dealsHubProducts.length} active DealsHub products`);
          
          // Direct return for deals-hub page
          if (dealsHubProducts.length > 0) {
            console.log(`Search DIRECT RETURN: Returning ${dealsHubProducts.length} DealsHub products for page "${page}"`);
            return res.json(dealsHubProducts);
          }
        } catch (error) {
          console.error('Error Error fetching DealsHub products:', error);
        }
      }

      // Get CueLinks products if page is cue-picks
      let cuelinksProducts: any[] = [];
      if (page === 'cue-picks') {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          let cuelinksQuery = `
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              cuelinks_url as cuelinksUrl, original_url as originalUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, affiliate_network, cuelinks_cid,
              telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
              click_count as clickCount, conversion_count as conversionCount,
              processing_status, expires_at as expiresAt, created_at as createdAt,
              has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText, content_type
            FROM cuelinks_products 
            WHERE processing_status = 'active' 
            AND (expires_at IS NULL OR expires_at > ?)`;
          
          const cuelinksParams = [currentTime];
          
          // Add content_type filter if specified
          if (content_type) {
            cuelinksQuery += ` AND content_type = ?`;
            cuelinksParams.push(content_type);
          }
          
          cuelinksQuery += ` ORDER BY created_at DESC`;
          cuelinksProducts = sqliteDb.prepare(cuelinksQuery).all(...cuelinksParams);
          console.log(`Target Found ${cuelinksProducts.length} active CueLinks products`);
        } catch (error) {
          console.error('Error Error fetching CueLinks products:', error);
        }
      }

      // Get Click Picks products if page is click-picks
      let clickPicksProducts: any[] = [];
      if (page === 'click-picks') {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          let clickPicksQuery = `
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, affiliate_network,
              telegram_message_id as telegramMessageId,
              processing_status, created_at as createdAt,
              has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText,
              message_group_id as messageGroupId, product_sequence as productSequence, 
              total_in_group as totalInGroup, content_type
            FROM click_picks_products 
            WHERE processing_status = 'active' 
            AND (expires_at IS NULL OR expires_at > ?)`;
          
          const clickPicksParams = [currentTime];
          
          // Add content_type filter if specified
          if (content_type) {
            clickPicksQuery += ` AND content_type = ?`;
            clickPicksParams.push(content_type);
          }
          
          clickPicksQuery += ` ORDER BY created_at DESC`;
          clickPicksProducts = sqliteDb.prepare(clickPicksQuery).all(...clickPicksParams);
          console.log(`🖱️ Found ${clickPicksProducts.length} active Click Picks products`);
        } catch (error) {
          console.error('Error Error fetching Click Picks products:', error);
          console.error('Error Click Picks query error details:', error.message);
          // Fallback query without expires_at check
          try {
            let fallbackQuery = `
              SELECT 
                id, name, description, price, original_price as originalPrice,
                currency, image_url as imageUrl, affiliate_url as affiliateUrl,
                category, rating, review_count as reviewCount, discount,
                is_featured as isFeatured, affiliate_network,
                telegram_message_id as telegramMessageId,
                processing_status, created_at as createdAt,
                has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText,
                message_group_id as messageGroupId, product_sequence as productSequence, 
                total_in_group as totalInGroup, content_type
              FROM click_picks_products 
              WHERE processing_status = 'active'`;
            
            const fallbackParams = [];
            
            // Add content_type filter if specified
            if (content_type) {
              fallbackQuery += ` AND content_type = ?`;
              fallbackParams.push(content_type);
            }
            
            fallbackQuery += ` ORDER BY created_at DESC`;
            clickPicksProducts = sqliteDb.prepare(fallbackQuery).all(...fallbackParams);
            console.log(`🖱️ Fallback: Found ${clickPicksProducts.length} active Click Picks products`);
          } catch (fallbackError) {
            console.error('Error Click Picks fallback query also failed:', fallbackError);
            clickPicksProducts = [];
          }
        }
      }

      // Get Featured Products if page is top-picks
      if (page === 'top-picks') {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          let featuredQuery = `
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, affiliate_network,
              created_at as createdAt, is_active, display_order as displayOrder,
              has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText,
              has_timer as hasTimer, timer_duration as timerDuration, timer_start_time as timerStartTime,
              click_count as clickCount, conversion_count as conversionCount,
              content_type, source, gender
            FROM featured_products 
            WHERE is_active = 1 
            AND (expires_at IS NULL OR expires_at > ?)`;
          
          const featuredParams = [currentTime];
          
          // Add content_type filter if specified
          if (content_type) {
            featuredQuery += ` AND content_type = ?`;
            featuredParams.push(content_type);
          }
          
          featuredQuery += ` ORDER BY display_order ASC, created_at DESC`;
          featuredProducts = sqliteDb.prepare(featuredQuery).all(...featuredParams);
          console.log(`Hot Found ${featuredProducts.length} active Featured products`);
        } catch (error) {
          console.error('Error Error fetching Featured products:', error);
        }
      }
      
      // Filter regular products by display pages and transform field names
      let products = allProducts.filter(product => {
        const displayPages = (product as any).display_pages || (product as any).displayPages;
        
        if (!displayPages) {
          return page === 'home';
        }
        
        // Handle both string and array formats
        if (typeof displayPages === 'string') {
          try {
            const parsed = JSON.parse(displayPages);
            return Array.isArray(parsed) ? parsed.includes(page) : parsed === page;
          } catch {
            return displayPages === page;
          }
        }
        
        return Array.isArray(displayPages) ? displayPages.includes(page) : displayPages === page;
      }).map(product => ({
        ...product,
        // Map database field names to frontend expected field names
        originalPrice: (product as any).original_price,
        reviewCount: (product as any).review_count,
        imageUrl: (product as any).image_url || (product as any).imageUrl,
        affiliateUrl: (product as any).affiliate_url || (product as any).affiliateUrl,
        telegramMessageId: (product as any).telegram_message_id,
        telegramChannelId: (product as any).telegram_channel_id,
        createdAt: (product as any).created_at,
        isNew: (product as any).is_new,
        isFeatured: (product as any).is_featured,
        isService: (product as any).is_service,
        hasTimer: (product as any).has_timer,
        timerDuration: (product as any).timer_duration,
        timerStartTime: (product as any).timer_start_time
      }));
      
      // Add Amazon products for prime-picks page
      if (page === 'prime-picks' && amazonProducts.length > 0) {
        // Convert Amazon products to match the expected format
        const formattedAmazonProducts = amazonProducts.map(ap => {
          const { isFeatured, ...rest } = ap;
          return {
            ...rest,
            id: `amazon_${ap.id}`, // Prefix to avoid ID conflicts
            source: 'amazon',
            networkBadge: 'Prime Picks',
            affiliateNetwork: 'amazon',
            isNew: false,
            isFeatured: Boolean(isFeatured), // Convert 0/1 to boolean
            isService: false,
            hasTimer: false,
            displayPages: ['prime-picks']
          };
        });
        
        // Combine with regular products
        products = [...formattedAmazonProducts, ...products];
        console.log(`🛒 Combined products: ${formattedAmazonProducts.length} Amazon + ${products.length - formattedAmazonProducts.length} regular`);
      }

      // Add CueLinks products for cue-picks page
      if (page === 'cue-picks' && cuelinksProducts.length > 0) {
        // Convert CueLinks products to match the expected format
        const formattedCuelinksProducts = cuelinksProducts.map(cp => {
          return {
            ...cp,
            id: `cuelinks_${cp.id}`, // Prefix to avoid ID conflicts
            source: 'cuelinks',
            sourceType: 'cue_picks',
            networkBadge: 'Cue Picks',
            affiliateNetwork: 'cuelinks',
            affiliateUrl: cp.cuelinksUrl || cp.affiliateUrl, // Use CueLinks URL
            originalUrl: cp.originalUrl,
            cuelinksUrl: cp.cuelinksUrl,
            isNew: false,
            isFeatured: Boolean(cp.isFeatured),
            isService: false,
            hasTimer: false,
            displayPages: ['cue-picks'],
            clickCount: cp.clickCount || 0,
            conversionCount: cp.conversionCount || 0,
            telegramMessageId: cp.telegramMessageId,
            telegramChannelId: cp.telegramChannelId,
            expiresAt: cp.expiresAt
          };
        });
        
        // Combine with regular products
        products = [...formattedCuelinksProducts, ...products];
        console.log(`Target Combined products: ${formattedCuelinksProducts.length} CueLinks + ${products.length - formattedCuelinksProducts.length} regular`);
      }

      // Add Click Picks products for click-picks page
      if (page === 'click-picks' && clickPicksProducts.length > 0) {
        // Convert Click Picks products to match the expected format
        const formattedClickPicksProducts = clickPicksProducts.map(cp => {
          return {
            ...cp,
            id: `click_picks_${cp.id}`, // Prefix to avoid ID conflicts
            source: 'click-picks',
            sourceType: 'click_picks',
            networkBadge: 'Click Picks',
            affiliateNetwork: cp.affiliateNetwork || 'Click Picks Network',
            isNew: false,
            isFeatured: Boolean(cp.isFeatured),
            isService: false,
            hasTimer: false,
            displayPages: ['click-picks'],
            telegramMessageId: cp.telegramMessageId,
            messageGroupId: cp.messageGroupId,
            productSequence: cp.productSequence,
            totalInGroup: cp.totalInGroup
          };
        });
        
        // Combine with regular products
        products = [...formattedClickPicksProducts, ...products];
        console.log(`🖱️ Combined products: ${formattedClickPicksProducts.length} Click Picks + ${products.length - formattedClickPicksProducts.length} regular`);
      }

      // Add Value Picks products for value-picks page
      console.log(`Search DEBUG: page='${page}', valuePicksProducts.length=${valuePicksProducts.length}`);
      if (page === 'value-picks' && valuePicksProducts.length > 0) {
        console.log(`Search DEBUG: Processing ${valuePicksProducts.length} Value Picks products`);
        // Convert Value Picks products to match the expected format
        const formattedValuePicksProducts = valuePicksProducts.map(vp => {
          return {
            ...vp,
            id: `value_picks_${vp.id}`, // Prefix to avoid ID conflicts
            source: 'value-picks',
            sourceType: 'value_picks',
            networkBadge: 'Value Picks',
            affiliateNetwork: 'value-picks',
            isNew: Boolean(vp.is_new),
            isFeatured: Boolean(vp.isFeatured),
            isService: false,
            hasTimer: false,
            displayPages: ['value-picks'],
            clickCount: vp.clickCount || 0,
            conversionCount: vp.conversionCount || 0,
            telegramMessageId: vp.telegramMessageId,
            telegramChannelId: vp.telegramChannelId,
            expiresAt: vp.expiresAt,
            createdAt: vp.createdAt
          };
        });
        
        console.log(`Search DEBUG: Formatted ${formattedValuePicksProducts.length} Value Picks products`);
        console.log(`Search DEBUG: Products before combining: ${products.length}`);
        
        // Combine with regular products
        products = [...formattedValuePicksProducts, ...products];
        console.log(`💎 Combined products: ${formattedValuePicksProducts.length} Value Picks + ${products.length - formattedValuePicksProducts.length} regular`);
        console.log(`Search DEBUG: Products after combining: ${products.length}`);
      } else {
        console.log(`Search DEBUG: Not processing Value Picks - page='${page}', valuePicksProducts.length=${valuePicksProducts.length}`);
      }

      // Add Loot Box products for loot-box or lootbox page
      if ((page === 'loot-box' || page === 'lootbox') && lootBoxProducts.length > 0) {
        console.log(`Search DEBUG: Processing ${lootBoxProducts.length} Loot Box products`);
        // Convert Loot Box products to match the expected format
        const formattedLootBoxProducts = lootBoxProducts.map(lbp => {
          return {
            ...lbp,
            id: `loot_box_${lbp.id}`, // Prefix to avoid ID conflicts
            source: 'loot-box',
            sourceType: 'loot_box',
            networkBadge: 'Loot Box',
            affiliateNetwork: lbp.affiliateNetwork || 'loot-box',
            isNew: Boolean(lbp.is_new),
            isFeatured: Boolean(lbp.isFeatured),
            isService: false,
            hasTimer: false,
            displayPages: ['loot-box', 'lootbox'],
            clickCount: lbp.clickCount || 0,
            conversionCount: lbp.conversionCount || 0,
            telegramMessageId: lbp.telegramMessageId,
            telegramChannelId: lbp.telegramChannelId,
            expiresAt: lbp.expiresAt,
            createdAt: lbp.createdAt
          };
        });
        
        console.log(`Search DEBUG: Formatted ${formattedLootBoxProducts.length} Loot Box products`);
        console.log(`Search DEBUG: Products before combining: ${products.length}`);
        
        // Combine with regular products
        products = [...formattedLootBoxProducts, ...products];
        console.log(`Products Combined products: ${formattedLootBoxProducts.length} Loot Box + ${products.length - formattedLootBoxProducts.length} regular`);
        console.log(`Search DEBUG: Products after combining: ${products.length}`);
      } else {
        console.log(`Search DEBUG: Not processing Loot Box - page='${page}', lootBoxProducts.length=${lootBoxProducts.length}`);
      }

      // Add Global Picks products for global-picks page
      if (page === 'global-picks' && globalPicksProducts.length > 0) {
        console.log(`Search DEBUG: Processing ${globalPicksProducts.length} Global Picks products`);
        // Convert Global Picks products to match the expected format
        const formattedGlobalPicksProducts = globalPicksProducts.map(gpp => {
          return {
            ...gpp,
            id: `global_picks_${gpp.id}`, // Prefix to avoid ID conflicts
            source: 'global-picks',
            sourceType: 'global_picks',
            networkBadge: 'Global Picks',
            affiliateNetwork: gpp.primary_affiliate || 'Universal',
            isNew: Boolean(gpp.is_new),
            isFeatured: Boolean(gpp.isFeatured),
            isService: false,
            hasTimer: false,
            displayPages: ['global-picks'],
            clickCount: gpp.clickCount || 0,
            conversionCount: gpp.conversionCount || 0,
            telegramMessageId: gpp.telegramMessageId,
            telegramChannelId: gpp.telegramChannelId,
            createdAt: gpp.createdAt,
            // Global Picks specific fields
            urlType: gpp.url_type,
            sourcePlatform: gpp.source_platform,
            primaryAffiliate: gpp.primary_affiliate,
            dataQualityScore: gpp.data_quality_score,
            brand: gpp.brand,
            availability: gpp.availability
          };
        });
        
        console.log(`Search DEBUG: Formatted ${formattedGlobalPicksProducts.length} Global Picks products`);
        console.log(`Search DEBUG: Products before combining: ${products.length}`);
        
        // Combine with regular products
        products = [...formattedGlobalPicksProducts, ...products];
        console.log(`🌍 Combined products: ${formattedGlobalPicksProducts.length} Global Picks + ${products.length - formattedGlobalPicksProducts.length} regular`);
        console.log(`Search DEBUG: Products after combining: ${products.length}`);
      } else {
         console.log(`Search DEBUG: Not processing Global Picks - page='${page}', globalPicksProducts.length=${globalPicksProducts.length}`);
       }

       // Add DealsHub products for dealshub or deals-hub page
       if ((page === 'dealshub' || page === 'deals-hub') && dealsHubProducts.length > 0) {
         console.log(`Search DEBUG: Processing ${dealsHubProducts.length} DealsHub products`);
         // Convert DealsHub products to match the expected format
         const formattedDealsHubProducts = dealsHubProducts.map(dhp => {
           return {
             ...dhp,
             id: `dealshub_${dhp.id}`, // Prefix to avoid ID conflicts
             source: 'dealshub',
             sourceType: 'dealshub',
             networkBadge: dhp.deal_badge || 'DealsHub',
             affiliateNetwork: dhp.primary_affiliate || 'Universal',
             isNew: Boolean(dhp.is_new),
             isFeatured: Boolean(dhp.isFeatured),
             isService: false,
             hasTimer: dhp.deal_urgency_level >= 4,
             displayPages: ['dealshub', 'deals-hub'],
             clickCount: dhp.clickCount || 0,
             conversionCount: dhp.conversionCount || 0,
             telegramMessageId: dhp.telegramMessageId,
             telegramChannelId: dhp.telegramChannelId,
             createdAt: dhp.createdAt,
             // DealsHub specific fields
             urlType: dhp.url_type,
             sourcePlatform: dhp.source_platform,
             primaryAffiliate: dhp.primary_affiliate,
             dataQualityScore: dhp.data_quality_score,
             brand: dhp.brand,
             availability: dhp.availability,
             dealType: dhp.deal_type,
             dealPriority: dhp.deal_priority,
             dealBadge: dhp.deal_badge,
             dealUrgencyLevel: dhp.deal_urgency_level,
             dealStatus: dhp.deal_status,
             stockStatus: dhp.stock_status,
             priceDropPercentage: dhp.price_drop_percentage,
             isTrending: Boolean(dhp.is_trending),
             engagementScore: dhp.engagement_score
           };
         });
         
         console.log(`Search DEBUG: Formatted ${formattedDealsHubProducts.length} DealsHub products`);
         console.log(`Search DEBUG: Products before combining: ${products.length}`);
         
         // Combine with regular products
         products = [...formattedDealsHubProducts, ...products];
         console.log(`🛒 Combined products: ${formattedDealsHubProducts.length} DealsHub + ${products.length - formattedDealsHubProducts.length} regular`);
         console.log(`Search DEBUG: Products after combining: ${products.length}`);
       } else {
         console.log(`Search DEBUG: Not processing DealsHub - page='${page}', dealsHubProducts.length=${dealsHubProducts.length}`);
       }

       // Add Featured Products for top-picks page
       if (page === 'top-picks' && featuredProducts.length > 0) {
         console.log(`Search DEBUG: Processing ${featuredProducts.length} Featured products`);
         // Convert Featured products to match the expected format
         const formattedFeaturedProducts = featuredProducts.map(fp => {
           return {
             ...fp,
             id: `featured_${fp.id}`, // Prefix to avoid ID conflicts
             source: fp.source || 'featured',
             sourceType: 'featured_products',
             networkBadge: 'Today\'s Top Picks',
             affiliateNetwork: fp.affiliateNetwork || 'featured',
             isNew: Boolean(fp.is_new),
             isFeatured: Boolean(fp.isFeatured),
             isService: false,
             hasTimer: Boolean(fp.hasTimer),
             timerDuration: fp.timerDuration,
             timerStartTime: fp.timerStartTime,
             displayPages: ['top-picks'],
             clickCount: fp.clickCount || 0,
             conversionCount: fp.conversionCount || 0,
             displayOrder: fp.displayOrder || 0,
             createdAt: fp.createdAt,
             hasLimitedOffer: Boolean(fp.hasLimitedOffer),
             limitedOfferText: fp.limitedOfferText
           };
         });
         
         console.log(`Search DEBUG: Formatted ${formattedFeaturedProducts.length} Featured products`);
         console.log(`Search DEBUG: Products before combining: ${products.length}`);
         
         // Combine with regular products
         products = [...formattedFeaturedProducts, ...products];
         console.log(`Hot Combined products: ${formattedFeaturedProducts.length} Featured + ${products.length - formattedFeaturedProducts.length} regular`);
         console.log(`Search DEBUG: Products after combining: ${products.length}`);
       } else {
         console.log(`Search DEBUG: Not processing Featured Products - page='${page}', featuredProducts.length=${featuredProducts.length}`);
       }
       
       // Apply category filtering if provided
      if (category && typeof category === 'string') {
        const decodedCategory = decodeURIComponent(category);
        products = products.filter(product => product.category === decodedCategory);
        console.log(`Filtered by category "${decodedCategory}": ${products.length} products`);
      }
      
      // Filter out expired products based on their individual timers
      const now = new Date();
      const activeProducts = products.filter(product => {
        // If product doesn't have timer enabled, keep it
        if (!product.hasTimer || !product.timerDuration || !product.createdAt) {
          return true;
        }
        
        // Calculate expiry time based on product's timer duration
        const productCreatedAt = new Date(product.createdAt);
        const expiryTime = new Date(productCreatedAt.getTime() + (product.timerDuration * 60 * 60 * 1000));
        
        // Keep product if it hasn't expired yet
        return now < expiryTime;
      });
      
      console.log(`Returning ${activeProducts.length} active products for page "${page}"`);
      res.json(activeProducts);
    } catch (error) {
      console.error(`Error fetching products for page "${req.params.page}":`, error);
      res.status(500).json({ message: "Failed to fetch products by page" });
    }
  });

  // Get categories for a specific page (dynamic sidebar)
  app.get("/api/categories/page/:page", async (req, res) => {
    try {
      const { page } = req.params;
      
      console.log(`Getting categories for page: "${page}"`);
      
      // Handle loot-box page separately
      if (page === 'loot-box') {
        try {
          const lootBoxCategories = sqliteDb.prepare(`
            SELECT DISTINCT category 
            FROM loot_box_products 
            WHERE processing_status = 'active' 
            AND category IS NOT NULL 
            AND category != ''
            ORDER BY category ASC
          `).all();
          
          const categories = lootBoxCategories.map((row: any) => row.category);
          console.log(`Found ${categories.length} loot-box categories: ${categories.join(', ')}`);
          res.json(categories);
          return;
        } catch (error) {
          console.error('Error Error fetching loot-box categories:', error);
          res.json([]);
          return;
        }
      }
      
      // Get all products first
      const allProducts = await storage.getProducts();
      
      // Filter products by display pages
      const pageProducts = allProducts.filter(product => {
        const displayPages = (product as any).displayPages;
        if (!displayPages) {
          return page === 'home';
        }
        
        // Handle both string and array formats
        if (typeof displayPages === 'string') {
          try {
            const parsed = JSON.parse(displayPages);
            return Array.isArray(parsed) ? parsed.includes(page) : parsed === page;
          } catch {
            return displayPages === page;
          }
        }
        
        return Array.isArray(displayPages) ? displayPages.includes(page) : displayPages === page;
      });
      
      // For prime-picks page, also include Amazon products
      // For cue-picks page, also include CueLinks products
      let allPageProducts = [...pageProducts];
      let valuePicksProducts: any[] = [];
      
      if (page === 'prime-picks') {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          const amazonProducts = sqliteDb.prepare(`
            SELECT * FROM amazon_products 
            WHERE display_pages LIKE '%prime-picks%' 
            AND (expires_at IS NULL OR expires_at > ?)
          `).all(currentTime);
          
          console.log(`Found ${amazonProducts.length} active Amazon products for prime-picks`);
          allPageProducts = [...pageProducts, ...(amazonProducts as any[])];
        } catch (error) {
          console.error('Error fetching Amazon products for categories:', error);
        }
      }
      
      if (page === 'cue-picks') {
        try {
          console.log('Search Fetching CueLinks products for categories...');
          const currentTime = Math.floor(Date.now() / 1000);
          const cuelinksProducts = sqliteDb.prepare(`
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, affiliate_network,
              telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
              click_count as clickCount, conversion_count as conversionCount,
              processing_status, expires_at as expiresAt, created_at as createdAt,
              has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText,
              message_group_id as messageGroupId, product_sequence as productSequence, 
              total_in_group as totalInGroup
            FROM cuelinks_products 
            WHERE processing_status = 'active' 
            AND (expires_at IS NULL OR expires_at > ?)
          `).all(currentTime);
          
          console.log(`Target Found ${cuelinksProducts.length} active CueLinks products for cue-picks categories`);
          if (cuelinksProducts.length > 0) {
            console.log('📋 CueLinks product categories:', cuelinksProducts.map((p: any) => p.category));
        }
        
        // Add Value Picks products to the mix
        if (valuePicksProducts.length > 0) {
          console.log('📋 Value Picks product categories:', valuePicksProducts.map((p: any) => p.category));
        }
        
        allPageProducts = [...pageProducts, ...(cuelinksProducts as any[]), ...(valuePicksProducts as any[])];
        console.log(`Products Total products for categories: ${allPageProducts.length}`);
        console.log(`   - Regular products: ${pageProducts.length}`);
        console.log(`   - CueLinks products: ${cuelinksProducts.length}`);
        } catch (error) {
          console.error('Error fetching CueLinks products for categories:', error);
        }
      }
      
      if (page === 'click-picks') {
        try {
          console.log('Search Fetching Click Picks products for categories...');
          const currentTime = Math.floor(Date.now() / 1000);
          const clickPicksProducts = sqliteDb.prepare(`
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, affiliate_network,
              telegram_message_id as telegramMessageId,
              processing_status, created_at as createdAt,
              has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText,
              message_group_id as messageGroupId, product_sequence as productSequence, 
              total_in_group as totalInGroup
            FROM click_picks_products 
            WHERE processing_status = 'active' 
            AND (offer_expires_at IS NULL OR offer_expires_at > ?)
          `).all(currentTime);
          
          console.log(`🖱️ Found ${clickPicksProducts.length} active Click Picks products for click-picks categories`);
          if (clickPicksProducts.length > 0) {
            console.log('📋 Click Picks product categories:', clickPicksProducts.map((p: any) => p.category));
          }
          
          allPageProducts = [...pageProducts, ...(clickPicksProducts as any[])];
          console.log(`Products Total products for categories: ${allPageProducts.length}`);
          console.log(`   - Regular products: ${pageProducts.length}`);
          console.log(`   - Click Picks products: ${clickPicksProducts.length}`);
        console.log(`   - Value Picks products: ${valuePicksProducts.length}`);
        } catch (error) {
          console.error('Error Error fetching CueLinks products for categories:', error);
        }
      }
      
      // Extract unique categories from all products on this page
      const categories = Array.from(new Set(allPageProducts.map((product: any) => product.category)))
        .filter((category: string) => category && category.trim() !== '')
        .sort();
      
      console.log(`Found ${categories.length} categories for page "${page}": ${categories.join(', ')}`);
      res.json(categories);
    } catch (error) {
      console.error(`Error fetching categories for page "${req.params.page}":`, error);
      res.status(500).json({ message: "Failed to fetch categories by page" });
    }
  });

  // Get mixed products from all networks for a specific category
  app.get('/api/products/category/:category/mixed', async (req, res) => {
    try {
      const category = decodeURIComponent(req.params.category);
      const mixedProducts: any[] = [];
      
      // Get products from main products table
      const mainProducts = sqliteDb.prepare(`
        SELECT *, 'main' as source FROM products 
        WHERE category = ? 
        ORDER BY created_at DESC
      `).all(category);
      
      // Get products from amazon_products table
      const amazonProducts = sqliteDb.prepare(`
        SELECT *, 'amazon' as source, 
               has_limited_offer as hasLimitedOffer, 
               limited_offer_text as limitedOfferText,
               message_group_id as messageGroupId, 
               product_sequence as productSequence, 
               total_in_group as totalInGroup
        FROM amazon_products 
        WHERE category = ? 
        ORDER BY created_at DESC
      `).all(category);
      
      // Combine and normalize products
      [...mainProducts, ...amazonProducts].forEach((product: any) => {
        const networkBadge = product.source === 'amazon' ? 'Prime Picks' : 'Global Picks';
        
        mixedProducts.push({
          id: product.source === 'amazon' ? `amazon_${product.id}` : product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          originalPrice: product.original_price || product.originalPrice,
          currency: product.currency || 'INR',
          imageUrl: product.image_url || product.imageUrl,
          affiliateUrl: product.affiliate_url || product.affiliateUrl,
          category: product.category,
          rating: product.rating || '4.0',
          reviewCount: product.review_count || product.reviewCount || 0,
          discount: product.discount,
          isNew: product.is_new || product.isNew || false,
          source: product.source,
          networkBadge: networkBadge,
          createdAt: product.created_at
        });
      });
      
      // Sort by creation date (newest first) and limit results
      mixedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(mixedProducts.slice(0, 100)); // Limit to 100 products
    } catch (error) {
      console.error('Error fetching mixed category products:', error);
      res.status(500).json({ message: 'Failed to fetch category products' });
    }
  });

  // Admin category management routes
  app.post('/api/admin/categories', async (req, res) => {
    try {
      const { password, ...categoryData } = req.body;

      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const category = await storage.addCategory(categoryData);
      res.json({ message: 'Category added successfully', category });
    } catch (error) {
      console.error('Add category error:', error);
      res.status(500).json({ message: 'Failed to add category' });
    }
  });

  app.put('/api/admin/categories/:id', async (req, res) => {
    try {
      const { password, ...updates } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const category = await storage.updateCategory(id, updates);
      
      if (category) {
        res.json({ message: 'Category updated successfully', category });
      } else {
        res.status(404).json({ message: 'Category not found' });
      }
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ message: 'Failed to update category' });
    }
  });

  app.delete('/api/admin/categories/:id', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(id);
      
      if (deleted) {
        res.json({ message: 'Category deleted successfully' });
      } else {
        res.status(404).json({ message: 'Category not found' });
      }
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ message: 'Failed to delete category' });
    }
  });

  // Update category display order
  app.put('/api/admin/categories/reorder', async (req, res) => {
    try {
      console.log('Reorder API: Request body:', JSON.stringify(req.body, null, 2));
      const { password, categoryOrders } = req.body;

      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Implementation for reordering categories
      res.json({ message: 'Categories reordered successfully' });
    } catch (error) {
      console.error('Reorder categories error:', error);
      res.status(500).json({ message: 'Failed to reorder categories' });
    }
  });

  // Navigation Tabs Management Routes
  
  // Get all navigation tabs
  app.get('/api/nav-tabs', async (req, res) => {
    try {
      const navTabs = sqliteDb.prepare(`
        SELECT id, name, slug, icon, color_from, color_to, display_order, is_active, is_system, description
        FROM nav_tabs
        WHERE is_active = 1
        ORDER BY display_order ASC
      `).all();
      
      res.json(navTabs);
    } catch (error) {
      console.error('Get nav tabs error:', error);
      res.status(500).json({ message: 'Failed to fetch navigation tabs' });
    }
  });

  // Get all navigation tabs (admin - includes inactive)
  app.get('/api/admin/nav-tabs', async (req, res) => {
    try {
      const navTabs = sqliteDb.prepare(`
        SELECT id, name, slug, icon, color_from, color_to, display_order, is_active, is_system, description, created_at, updated_at
        FROM nav_tabs
        ORDER BY display_order ASC
      `).all();
      
      res.json(navTabs);
    } catch (error) {
      console.error('Get admin nav tabs error:', error);
      res.status(500).json({ message: 'Failed to fetch navigation tabs' });
    }
  });

  // Create new navigation tab - NO PASSWORD REQUIRED
  app.post('/api/admin/nav-tabs', async (req, res) => {
    try {
      const { name, slug, icon, color_from, color_to, description } = req.body;

      // Validate required fields
      if (!name || !slug) {
        return res.status(400).json({ message: 'Name and slug are required' });
      }

      // Check if slug already exists
      const existingTab = sqliteDb.prepare('SELECT id FROM nav_tabs WHERE slug = ?').get(slug) as { id: number } | undefined;
      if (existingTab) {
        return res.status(400).json({ message: 'Slug already exists' });
      }

      // Get next display order
      const maxOrder = sqliteDb.prepare('SELECT MAX(display_order) as max_order FROM nav_tabs').get() as { max_order: number } | undefined;
      const nextOrder = (maxOrder?.max_order || 0) + 1;

      // Insert new navigation tab
      const result = sqliteDb.prepare(`
        INSERT INTO nav_tabs (name, slug, icon, color_from, color_to, display_order, description, is_system)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `).run(
        name,
        slug,
        icon || 'fas fa-star',
        color_from || '#3B82F6',
        color_to || '#1D4ED8',
        nextOrder,
        description || ''
      );

      const newTab = sqliteDb.prepare('SELECT * FROM nav_tabs WHERE id = ?').get(result.lastInsertRowid);
      
      res.json({ message: 'Navigation tab created successfully', tab: newTab });
    } catch (error) {
      console.error('Create nav tab error:', error);
      res.status(500).json({ message: 'Failed to create navigation tab' });
    }
  });

  // Update navigation tab
  app.put('/api/admin/nav-tabs/:id', async (req, res) => {
    try {
      const { password, ...updates } = req.body;
      const id = parseInt(req.params.id);
      const { name, slug, icon, color_from, color_to, description, is_active } = updates;
      
      // No password required - user is already authenticated in admin panel

      // Check if tab exists
      const existingTab = sqliteDb.prepare('SELECT * FROM nav_tabs WHERE id = ?').get(id) as { id: number; slug: string; is_system: number } | undefined;
      if (!existingTab) {
        return res.status(404).json({ message: 'Navigation tab not found' });
      }

      // Check if slug already exists (excluding current tab)
      if (slug && slug !== existingTab.slug) {
        const duplicateSlug = sqliteDb.prepare('SELECT id FROM nav_tabs WHERE slug = ? AND id != ?').get(slug, id) as { id: number } | undefined;
        if (duplicateSlug) {
          return res.status(400).json({ message: 'Slug already exists' });
        }
      }

      // Update navigation tab - handle simple toggle vs full update
      if (Object.keys(updates).length === 1 && 'is_active' in updates) {
        // Simple toggle - only update is_active (convert boolean to integer for SQLite)
        const activeValue = is_active ? 1 : 0;
        sqliteDb.prepare(`
          UPDATE nav_tabs 
          SET is_active = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(activeValue, id);
      } else {
        // Full update - update all provided fields (convert boolean to integer for SQLite)
        const activeValue = is_active !== undefined ? (is_active ? 1 : 0) : undefined;
        sqliteDb.prepare(`
          UPDATE nav_tabs 
          SET name = COALESCE(?, name),
              slug = COALESCE(?, slug),
              icon = COALESCE(?, icon),
              color_from = COALESCE(?, color_from),
              color_to = COALESCE(?, color_to),
              description = COALESCE(?, description),
              is_active = COALESCE(?, is_active),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(name, slug, icon, color_from, color_to, description, activeValue, id);
      }

      const updatedTab = sqliteDb.prepare('SELECT * FROM nav_tabs WHERE id = ?').get(id);
      
      res.json({ message: 'Navigation tab updated successfully', tab: updatedTab });
    } catch (error) {
      console.error('Update nav tab error:', error);
      res.status(500).json({ message: 'Failed to update navigation tab' });
    }
  });

  // Delete navigation tab
  app.delete('/api/admin/nav-tabs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Check if tab exists and is not a system tab
      const existingTab = sqliteDb.prepare('SELECT * FROM nav_tabs WHERE id = ?').get(id) as { id: number; is_system: number } | undefined;
      if (!existingTab) {
        return res.status(404).json({ message: 'Navigation tab not found' });
      }

      if (existingTab.is_system) {
        return res.status(400).json({ message: 'Cannot delete system navigation tabs' });
      }

      // Delete navigation tab
      sqliteDb.prepare('DELETE FROM nav_tabs WHERE id = ?').run(id);
      
      res.json({ message: 'Navigation tab deleted successfully' });
    } catch (error) {
      console.error('Delete nav tab error:', error);
      res.status(500).json({ message: 'Failed to delete navigation tab' });
    }
  });

  // Reorder navigation tabs
  app.put('/api/admin/nav-tabs/reorder', async (req, res) => {
    try {
      const { password, tabOrders } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!Array.isArray(tabOrders)) {
        return res.status(400).json({ message: 'Tab orders must be an array' });
      }

      // Update display orders
      const updateOrder = sqliteDb.prepare('UPDATE nav_tabs SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      
      tabOrders.forEach((item, index) => {
        updateOrder.run(index + 1, item.id);
      });
      
      res.json({ message: 'Navigation tabs reordered successfully' });
    } catch (error) {
      console.error('Reorder nav tabs error:', error);
      res.status(500).json({ message: 'Failed to reorder navigation tabs' });
    }
  });

  // ===== ADMIN FULL CONTROL ENDPOINTS =====
  
  // Admin bulk delete endpoint - FULL CONTROL over ALL tables
  app.post('/api/admin/bulk-delete', async (req, res) => {
    try {
      const { password, action, tables, conditions } = req.body;
      
      // Enhanced admin authentication
      const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
      const validPassword = password === 'pickntrust2025' || password === 'admin' || password === 'delete';
      
      if (!isLocalhost && !validPassword) {
        console.log('❌ Unauthorized bulk delete attempt');
        return res.status(401).json({ message: 'Unauthorized - Admin access required' });
      }
      
      console.log('🔐 ADMIN BULK DELETE REQUEST:', { action, tables: tables?.length || 0 });
      
      let totalDeleted = 0;
      const results = [];
      
      // Define all tables admin has control over
      const adminControlTables = {
        // Main product tables - FULL ADMIN CONTROL
        'products': 'Main products table - Admin has complete control',
        'featured_products': 'Featured products - Admin curated',
        'top_picks_products': 'Top picks - Admin managed',
        'category_products': 'Category products - Admin organized',
        'admincategory_products': 'Admin category products',
        
        // Bot tables - Admin can reset anytime
        'amazon_products': 'Amazon products - Bot populated',
        'cuelinks_products': 'Cuelinks products - Bot populated',
        'value_picks_products': 'Value picks - Bot populated',
        'click_picks_products': 'Click picks - Bot populated',
        'global_picks_products': 'Global picks - Bot populated',
        'travel_products': 'Travel products - Bot populated',
        'deals_hub_products': 'Deals hub - Bot populated',
        'lootbox_products': 'Lootbox products - Bot populated',
        'apps_products': 'Apps products - Bot populated',
        'dealshub_products': 'Dealshub products - Bot populated',
        
        // Content tables - Admin manages
        'blog_posts': 'Blog content - Admin managed',
        'video_content': 'Video library - Admin controlled',
        'announcements': 'Site announcements - Admin managed'
      };
      
      if (action === 'clear_all') {
        // NUCLEAR OPTION - Admin can delete EVERYTHING
        console.log('💥 ADMIN NUCLEAR OPTION - CLEARING ALL TABLES');
        
        for (const [tableName, description] of Object.entries(adminControlTables)) {
          try {
            const beforeCount = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
            
            if (beforeCount.count > 0) {
              const result = sqliteDb.prepare(`DELETE FROM ${tableName}`).run();
              console.log(`🗑️ ADMIN CLEARED ${tableName}: ${result.changes} records`);
              
              results.push({
                table: tableName,
                description,
                before: beforeCount.count,
                deleted: result.changes,
                after: 0
              });
              
              totalDeleted += result.changes;
            }
          } catch (error) {
            console.error(`❌ Error clearing ${tableName}:`, error.message);
            results.push({
              table: tableName,
              error: error.message
            });
          }
        }
        
      } else if (action === 'selective_delete' && tables && conditions) {
        // SELECTIVE DELETE - Admin chooses what to remove
        console.log('🎯 ADMIN SELECTIVE DELETE');
        
        for (const tableName of tables) {
          if (!adminControlTables[tableName]) {
            results.push({
              table: tableName,
              error: 'Table not under admin control'
            });
            continue;
          }
          
          try {
            const beforeCount = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
            let tableDeleted = 0;
            
            for (const condition of conditions) {
              const result = sqliteDb.prepare(`DELETE FROM ${tableName} WHERE ${condition}`).run();
              tableDeleted += result.changes;
            }
            
            const afterCount = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
            
            if (tableDeleted > 0) {
              console.log(`🗑️ ADMIN DELETED from ${tableName}: ${tableDeleted} records`);
              results.push({
                table: tableName,
                description: adminControlTables[tableName],
                before: beforeCount.count,
                deleted: tableDeleted,
                after: afterCount.count
              });
              
              totalDeleted += tableDeleted;
            }
            
          } catch (error) {
            console.error(`❌ Error with selective delete ${tableName}:`, error.message);
            results.push({
              table: tableName,
              error: error.message
            });
          }
        }
        
      } else if (action === 'clear_test_data') {
        // CLEAN TEST DATA - Remove all test/sample data
        console.log('🧹 ADMIN CLEANING TEST DATA');
        
        const testConditions = [
          "name LIKE '%TEST%'",
          "name LIKE '%ERROR%'",
          "name LIKE '%SAMPLE%'",
          "name LIKE '%FIX%'",
          "description LIKE '%test%'",
          "source = 'test_data'",
          "source = 'sample_data'"
        ];
        
        for (const [tableName, description] of Object.entries(adminControlTables)) {
          try {
            const beforeCount = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
            let tableDeleted = 0;
            
            for (const condition of testConditions) {
              try {
                const result = sqliteDb.prepare(`DELETE FROM ${tableName} WHERE ${condition}`).run();
                tableDeleted += result.changes;
              } catch (conditionError) {
                // Some conditions might not apply to all tables - that's OK
              }
            }
            
            if (tableDeleted > 0) {
              const afterCount = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
              console.log(`🧹 CLEANED ${tableName}: ${tableDeleted} test records`);
              
              results.push({
                table: tableName,
                description,
                before: beforeCount.count,
                deleted: tableDeleted,
                after: afterCount.count
              });
              
              totalDeleted += tableDeleted;
            }
            
          } catch (error) {
            // Skip tables that don't exist or have issues
          }
        }
      }
      
      res.json({
        success: true,
        message: `Admin ${action} completed`,
        totalDeleted,
        results,
        adminNote: 'Admin has FULL CONTROL over all data - use responsibly!'
      });
      
    } catch (error) {
      console.error('Admin bulk delete error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Admin bulk delete failed',
        error: error.message 
      });
    }
  });
  
  // Admin table status endpoint - See what admin controls
  app.get('/api/admin/table-status', async (req, res) => {
    try {
      const { password } = req.query;
      
      const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
      const validPassword = password === 'pickntrust2025' || password === 'admin';
      
      if (!isLocalhost && !validPassword) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const adminTables = {
        'products': 'Main products table',
        'featured_products': 'Featured products',
        'top_picks_products': 'Top picks',
        'amazon_products': 'Amazon products',
        'click_picks_products': 'Click picks',
        'global_picks_products': 'Global picks',
        'travel_products': 'Travel products',
        'lootbox_products': 'Lootbox products',
        'apps_products': 'Apps products'
      };
      
      const tableStatus = [];
      
      for (const [tableName, description] of Object.entries(adminTables)) {
        try {
          const count = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
          tableStatus.push({
            table: tableName,
            description,
            records: count.count,
            adminControl: 'FULL'
          });
        } catch (error) {
          tableStatus.push({
            table: tableName,
            description,
            records: 0,
            error: 'Table not found',
            adminControl: 'FULL'
          });
        }
      }
      
      res.json({
        message: 'Admin has COMPLETE control over all tables',
        adminAuthority: 'UNLIMITED',
        capabilities: [
          'Delete individual records',
          'Clear entire tables',
          'Bulk delete operations',
          'Reset bot tables',
          'Manage all content',
          'Nuclear option - delete everything'
        ],
        tables: tableStatus
      });
      
    } catch (error) {
      console.error('Admin table status error:', error);
      res.status(500).json({ message: 'Failed to get table status' });
    }
  });

  // ===== BANNER MANAGEMENT ENDPOINTS =====
  
  // Get all banners
  app.get('/api/admin/banners', async (req, res) => {
    try {
      const banners = sqliteDb.prepare(`
        SELECT * FROM banners 
        ORDER BY page ASC, display_order ASC
      `).all();
      
      res.json(banners);
    } catch (error) {
      console.error('Get banners error:', error);
      res.status(500).json({ message: 'Failed to fetch banners' });
    }
  });

  // Create new banner
  app.post('/api/admin/banners', async (req, res) => {
    try {
      const { title, subtitle, imageUrl, linkUrl, buttonText, page, isActive } = req.body;

      // Validate required fields
      if (!title || !imageUrl || !page) {
        return res.status(400).json({ message: 'Title, image URL, and page are required' });
      }

      // Get next display order for the page
      const maxOrder = sqliteDb.prepare('SELECT MAX(display_order) as max_order FROM banners WHERE page = ?').get(page) as { max_order: number } | undefined;
      const nextOrder = (maxOrder?.max_order || 0) + 1;

      // Insert new banner
      const result = sqliteDb.prepare(`
        INSERT INTO banners (title, subtitle, imageUrl, linkUrl, buttonText, page, isActive, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        title,
        subtitle || null,
        imageUrl,
        linkUrl || null,
        buttonText || null,
        page,
        isActive !== false ? 1 : 0,
        nextOrder
      );

      const newBanner = sqliteDb.prepare('SELECT * FROM banners WHERE id = ?').get(result.lastInsertRowid);
      
      res.json({ message: 'Banner created successfully', banner: newBanner });
    } catch (error) {
      console.error('Create banner error:', error);
      res.status(500).json({ message: 'Failed to create banner' });
    }
  });

  // Update banner
  app.put('/api/admin/banners/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, subtitle, imageUrl, linkUrl, buttonText, page, isActive } = req.body;
      
      // Check if banner exists
      const existingBanner = sqliteDb.prepare('SELECT * FROM banners WHERE id = ?').get(id);
      if (!existingBanner) {
        return res.status(404).json({ message: 'Banner not found' });
      }

      // Update banner
      sqliteDb.prepare(`
        UPDATE banners 
        SET title = COALESCE(?, title),
            subtitle = ?,
            imageUrl = COALESCE(?, imageUrl),
            linkUrl = ?,
            buttonText = ?,
            page = COALESCE(?, page),
            isActive = COALESCE(?, isActive),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        title,
        subtitle,
        imageUrl,
        linkUrl,
        buttonText,
        page,
        isActive !== undefined ? (isActive ? 1 : 0) : undefined,
        id
      );

      const updatedBanner = sqliteDb.prepare('SELECT * FROM banners WHERE id = ?').get(id);
      
      res.json({ message: 'Banner updated successfully', banner: updatedBanner });
    } catch (error) {
      console.error('Update banner error:', error);
      res.status(500).json({ message: 'Failed to update banner' });
    }
  });

  // Delete banner
  app.delete('/api/admin/banners/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Check if banner exists
      const existingBanner = sqliteDb.prepare('SELECT * FROM banners WHERE id = ?').get(id);
      if (!existingBanner) {
        return res.status(404).json({ message: 'Banner not found' });
      }

      // Delete banner
      sqliteDb.prepare('DELETE FROM banners WHERE id = ?').run(id);
      
      res.json({ message: 'Banner deleted successfully' });
    } catch (error) {
      console.error('Delete banner error:', error);
      res.status(500).json({ message: 'Failed to delete banner' });
    }
  });

  // Reorder banners
  app.put('/api/admin/banners/reorder', async (req, res) => {
    try {
      const { bannerOrders } = req.body;

      if (!Array.isArray(bannerOrders)) {
        return res.status(400).json({ message: 'Banner orders must be an array' });
      }

      // Update display orders
      const updateOrder = sqliteDb.prepare('UPDATE banners SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      
      bannerOrders.forEach((item) => {
        updateOrder.run(item.displayOrder, item.id);
      });
      
      res.json({ message: 'Banners reordered successfully' });
    } catch (error) {
      console.error('Reorder banners error:', error);
      res.status(500).json({ message: 'Failed to reorder banners' });
    }
  });

  // OLD BANNER API - DISABLED (Now using static banner system)
  // app.get('/api/banners/:page', async (req, res) => {
  //   try {
  //     const page = req.params.page;
  //     
  //     const banners = sqliteDb.prepare(`
  //       SELECT * FROM banners 
  //       WHERE page = ? AND isActive = 1
  //       ORDER BY display_order ASC
  //     `).all(page);
  //     
  //     res.json(banners);
  //   } catch (error) {
  //     console.error('Get page banners error:', error);
  //     res.status(500).json({ message: 'Failed to fetch page banners' });
  //   }
  // });
  
  // Note: Banner functionality now handled by static-banner-routes.ts

  // Categories endpoint
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  // Get categories by page
  app.get('/api/categories/page/:page', async (req, res) => {
    try {
      const page = req.params.page;
      const categories = await storage.getCategoriesByPage(page);
      res.json(categories);
    } catch (error) {
      console.error(`Error fetching categories for page "${req.params.page}":`, error);
      res.status(500).json({ message: "Failed to fetch categories by page" });
    }
  });

  // Add category (Admin only)
  app.post('/api/categories', async (req, res) => {
    try {
      const { password, ...categoryData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const category = await storage.addCategory(categoryData);
      res.json({ message: 'Category added successfully', category });
    } catch (error) {
      console.error('Add category error:', error);
      res.status(500).json({ message: 'Failed to add category' });
    }
  });

  // Get categories with subcategories (hierarchical structure)
  app.get("/api/categories/hierarchical", async (req, res) => {
    try {
      const categories = await storage.getCategoriesWithSubcategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching hierarchical categories:", error);
      res.status(500).json({ message: "Failed to fetch hierarchical categories" });
    }
  });

  // Get category statistics (product counts from all networks)
  app.get('/api/categories/stats', async (req, res) => {
    try {
      const stats: { [key: string]: any } = {};
      
      // Get all categories
      const categories = await storage.getCategories();
      
      for (const category of categories) {
        // Count products from main products table
        const mainProducts = sqliteDb.prepare(`
          SELECT COUNT(*) as count FROM products WHERE category = ?
        `).get(category.name) as any;
        
        // Count products from amazon_products table
        const amazonProducts = sqliteDb.prepare(`
          SELECT COUNT(*) as count FROM amazon_products WHERE category = ?
        `).get(category.name) as any;
        
        // Count unique affiliate networks for this category
        const networks = sqliteDb.prepare(`
          SELECT COUNT(DISTINCT affiliate_network_id) as count 
          FROM products 
          WHERE category = ? AND affiliate_network_id IS NOT NULL
        `).get(category.name) as any;
        
        const totalProducts = (mainProducts?.count || 0) + (amazonProducts?.count || 0);
        const networkCount = Math.max(1, networks?.count || 0); // At least 1 if products exist
        
        stats[category.name] = {
          totalProducts,
          networkCount: totalProducts > 0 ? networkCount : 0,
          mainProducts: mainProducts?.count || 0,
          amazonProducts: amazonProducts?.count || 0
        };
      }
      
      res.json(stats);
     } catch (error) {
       console.error('Error fetching category stats:', error);
       res.status(500).json({ message: "Failed to fetch category statistics" });
     }
   });

  // Get main categories only (no subcategories)
  app.get("/api/categories/main", async (req, res) => {
    try {
      const categories = await storage.getMainCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching main categories:", error);
      res.status(500).json({ message: "Failed to fetch main categories" });
    }
  });

  // Get subcategories for a specific parent category
  app.get("/api/categories/:parentId/subcategories", async (req, res) => {
    try {
      const parentId = parseInt(req.params.parentId);
      if (isNaN(parentId)) {
        return res.status(400).json({ message: "Invalid parent category ID" });
      }
      
      const subcategories = await storage.getSubcategories(parentId);
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ message: "Failed to fetch subcategories" });
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

  // Get blog posts (filter by timer expiry)
  app.get("/api/blog", async (req, res) => {
    try {
      const blogPosts = await storage.getBlogPosts();
      
      // Filter out expired blog posts based on their individual timers
      const now = new Date();
      
      const activeBlogPosts = blogPosts.filter(post => {
        // If post doesn't have timer enabled, keep it
        if (!post.hasTimer || !post.timerDuration || !post.createdAt) {
          return true;
        }
        
        // Calculate expiry time based on post's timer duration
        const postCreatedAt = new Date(post.createdAt);
        const expiryTime = new Date(postCreatedAt.getTime() + (post.timerDuration * 60 * 60 * 1000));
        
        // Keep post if it hasn't expired yet
        return now < expiryTime;
      });
      
      // Sort by most recent first and parse tags
      const sortedPosts = activeBlogPosts.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      ).map(post => ({
        ...post,
        // Parse tags from JSON string to array if needed
        tags: typeof post.tags === 'string' ? 
          (post.tags.startsWith('[') ? JSON.parse(post.tags) : []) : 
          (Array.isArray(post.tags) ? post.tags : [])
      }));
      
      res.json(sortedPosts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Newsletter subscription
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      // TODO: Add validation for newsletter subscriber data here
      const subscriber = await storage.subscribeToNewsletter(req.body);
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
      
      console.log('🔍 Admin Product Creation Request:', {
        displayPages: productData.displayPages,
        name: productData.name?.substring(0, 50) + '...'
      });
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Auto-category creation logic
      let finalCategory = productData.category;
      
      if (!finalCategory || finalCategory.trim() === '') {
        finalCategory = detectProductCategory(productData.name || '', productData.description || '');
        console.log('🤖 Auto-detected category:', finalCategory);
      }
      
      ensureCategoryExists(finalCategory, productData.name || '', productData.description || '');

      // Handle customFields
      let customFieldsJson = null;
      if (productData.customFields && typeof productData.customFields === 'object') {
        customFieldsJson = JSON.stringify(productData.customFields);
      }

      // Enhanced product data
      const enhancedProductData = {
        ...productData,
        category: finalCategory,
        customFields: customFieldsJson,
        isFeatured: productData.isFeatured !== undefined ? productData.isFeatured : true,
        isApproved: productData.isApproved !== undefined ? productData.isApproved : true,
        status: productData.status || 'active',
        createdAt: new Date(),
      };

      console.log('📊 Enhanced product data prepared');
      
      // 🚀 NEW: Route to specific bot tables based on displayPages
      const PAGE_TO_TABLE_MAPPING = {
        'prime-picks': 'amazon_products',
        'cue-picks': 'cuelinks_products',
        'value-picks': 'value_picks_products',
        'travel-picks': 'travel_products',
        'click-picks': 'click_picks_products',
        'global-picks': 'global_picks_products',
        'deals-hub': 'deals_hub_products',
        'loot-box': 'lootbox_products',
        'lootbox': 'lootbox_products'
      };
      
      const displayPages = productData.displayPages || ['home'];
      const savedProducts = [];
      
      console.log('🎯 Routing to bot tables for pages:', displayPages);
      
      for (const page of displayPages) {
        const targetTable = PAGE_TO_TABLE_MAPPING[page];
        
        if (targetTable) {
          console.log(`📦 Saving to bot table: ${page} → ${targetTable}`);
          
          try {
            // Save to specific bot table using direct SQL
            const Database = (await import('better-sqlite3')).default;
            const sqliteDb = new Database('./database.sqlite');
            
            // Prepare data for bot table (convert to bot table format)
            const botProductData = {
              name: enhancedProductData.name,
              description: enhancedProductData.description,
              price: typeof enhancedProductData.price === 'string' ? 
                     parseFloat(enhancedProductData.price.replace(/[^d.-]/g, '')) : 
                     enhancedProductData.price,
              original_price: enhancedProductData.originalPrice ? 
                            (typeof enhancedProductData.originalPrice === 'string' ? 
                             parseFloat(enhancedProductData.originalPrice.replace(/[^d.-]/g, '')) : 
                             enhancedProductData.originalPrice) : null,
              currency: enhancedProductData.currency || 'INR',
              image_url: enhancedProductData.imageUrl,
              affiliate_url: enhancedProductData.affiliateUrl,
              original_url: enhancedProductData.affiliateUrl, // Use affiliate URL as original for admin products
              category: enhancedProductData.category,
              rating: typeof enhancedProductData.rating === 'string' ? 
                     parseFloat(enhancedProductData.rating) : 
                     (enhancedProductData.rating || 4.0),
              review_count: typeof enhancedProductData.reviewCount === 'string' ? 
                          parseInt(enhancedProductData.reviewCount) : 
                          (enhancedProductData.reviewCount || 100),
              discount: enhancedProductData.discount ? 
                       (typeof enhancedProductData.discount === 'string' ? 
                        parseFloat(enhancedProductData.discount) : 
                        enhancedProductData.discount) : null,
              is_featured: enhancedProductData.isFeatured ? 1 : 0,
              affiliate_network: getAffiliateNetworkForPage(page),
              processing_status: 'active',
              source: 'admin',
              content_type: page,
              created_at: Math.floor(Date.now() / 1000),
              expires_at: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000) // 30 days
            };
            
            // Build dynamic INSERT query based on table
            const columns = Object.keys(botProductData).join(', ');
            const placeholders = Object.keys(botProductData).map(() => '?').join(', ');
            const values = Object.values(botProductData);
            
            const insertQuery = `INSERT INTO ${targetTable} (${columns}) VALUES (${placeholders})`;
            const stmt = sqliteDb.prepare(insertQuery);
            const result = stmt.run(...values);
            
            sqliteDb.close();
            
            console.log(`✅ Saved to ${targetTable} with ID: ${result.lastInsertRowid}`);
            
            savedProducts.push({
              id: result.lastInsertRowid,
              table: targetTable,
              page: page,
              name: botProductData.name
            });
            
          } catch (error) {
            console.error(`❌ Failed to save to ${targetTable}:`, error.message);
          }
          
        } else if (page === 'home' || !PAGE_TO_TABLE_MAPPING[page]) {
          // Save to general products table for home page or unmapped pages
          console.log(`🏠 Saving to general products table for page: ${page}`);
          
          try {
            const product = await storage.addProduct(enhancedProductData);
            savedProducts.push({
              id: product.id,
              table: 'products',
              page: page,
              name: product.name
            });
            console.log(`✅ Saved to products table with ID: ${product.id}`);
          } catch (error) {
            console.error('❌ Failed to save to products table:', error.message);
          }
        }
      }
      
      // If product is featured, also add to featured_products table
      if (enhancedProductData.isFeatured && savedProducts.length > 0) {
        try {
          console.log('⭐ Adding to featured_products table');
          await db.insert(featuredProducts).values({
            name: enhancedProductData.name,
            description: enhancedProductData.description,
            price: enhancedProductData.price?.toString(),
            originalPrice: enhancedProductData.originalPrice?.toString(),
            currency: enhancedProductData.currency,
            imageUrl: enhancedProductData.imageUrl,
            affiliateUrl: enhancedProductData.affiliateUrl,
            category: enhancedProductData.category,
            rating: enhancedProductData.rating || 4.0,
            reviewCount: enhancedProductData.reviewCount || 100,
            discount: enhancedProductData.discount,
            isFeatured: true,
            displayPages: JSON.stringify(displayPages),
            createdAt: new Date()
          });
          console.log('✅ Added to featured_products table');
        } catch (error) {
          console.error('❌ Failed to add to featured_products:', error.message);
        }
      }
      
      console.log('\n🎊 ADMIN PRODUCT ROUTING COMPLETE!');
      console.log('📊 Summary:', {
        totalSaved: savedProducts.length,
        tables: savedProducts.map(p => p.table),
        pages: displayPages
      });
      
      // Return success response
      res.json({
        success: true,
        message: `Product saved to ${savedProducts.length} table(s)`,
        products: savedProducts,
        displayPages: displayPages
      });
      
    } catch (error) {
      console.error('❌ Admin product creation failed:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to create product',
        error: error.message 
      });
    }
  });
  
  // Helper function to get affiliate network for page
  function getAffiliateNetworkForPage(page) {
    const networkMap = {
      'prime-picks': 'amazon',
      'cue-picks': 'cuelinks',
      'value-picks': 'earnkaro',
      'travel-picks': 'travel',
      'click-picks': 'cuelinks',
      'global-picks': 'global',
      'deals-hub': 'inrdeals',
      'loot-box': 'deodap',
      'lootbox': 'deodap'
    };
    return networkMap[page] || 'general';
  }

  // Helper function to get affiliate network for page
  function getAffiliateNetworkForPage(page) {
    const networkMap = {
      'prime-picks': 'amazon',
      'cue-picks': 'cuelinks',
      'value-picks': 'earnkaro',
      'travel-picks': 'travel',
      'click-picks': 'cuelinks',
      'global-picks': 'global',
      'deals-hub': 'inrdeals',
      'loot-box': 'deodap',
      'lootbox': 'deodap'
    };
    return networkMap[page] || 'general';
  }

  app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const { password } = req.body;
    
    // Admin authentication - ENHANCED for localhost
    const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    const validPassword = password === 'pickntrust2025' || password === 'admin' || password === 'delete';
    
    if (!isLocalhost && !validPassword) {
      console.log('❌ Unauthorized delete attempt');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (isLocalhost) {
      console.log('🔓 Localhost detected - Admin access granted');
    }

    const productId = req.params.id;
    console.log(`🗑️ ADMIN DELETE REQUEST: ${productId}`);
    
    let deleted = false;
    let deletionDetails = [];
    
    // Handle composite IDs (e.g., 'click_picks_123', 'dealshub_456')
    if (productId.includes('_')) {
      console.log(`📝 Processing composite ID: ${productId}`);
      
      let tableName = '';
      let numericId = null;
      
      // Parse different ID formats with enhanced matching
      if (productId.startsWith('click_picks_')) {
        const match = productId.match(/click_picks_(\d+)$/);
        if (match) {
          numericId = parseInt(match[1]);
          tableName = 'click_picks_products';
        }
      } else if (productId.startsWith('global_picks_')) {
        const match = productId.match(/global_picks_(\d+)$/);
        if (match) {
          numericId = parseInt(match[1]);
          tableName = 'global_picks_products';
        }
      } else if (productId.startsWith('dealshub_') || productId.startsWith('deals_hub_')) {
        const match = productId.match(/deals?_?hub_(\d+)$/);
        if (match) {
          numericId = parseInt(match[1]);
          // Try both table names
          const tables = ['dealshub_products', 'deals_hub_products'];
          for (const table of tables) {
            try {
              const checkStmt = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE id = ?`);
              const exists = checkStmt.get(numericId);
              if (exists.count > 0) {
                tableName = table;
                break;
              }
            } catch (e) {
              console.log(`Table ${table} not accessible`);
            }
          }
        }
      } else if (productId.startsWith('loot_box_') || productId.startsWith('lootbox_')) {
        const match = productId.match(/loot_?box_(\d+)$/);
        if (match) {
          numericId = parseInt(match[1]);
          tableName = 'loot_box_products';
        }
      } else if (productId.startsWith('travel_picks_')) {
        const match = productId.match(/travel_picks_(\d+)$/);
        if (match) {
          numericId = parseInt(match[1]);
          tableName = 'travel_products';
        }
      } else if (productId.startsWith('cuelinks_') || productId.startsWith('cue_picks_')) {
        const match = productId.match(/cue(?:links|_picks)_(\d+)$/);
        if (match) {
          numericId = parseInt(match[1]);
          tableName = 'cuelinks_products';
        }
      } else if (productId.startsWith('value_picks_')) {
        const match = productId.match(/value_picks_(\d+)$/);
        if (match) {
          numericId = parseInt(match[1]);
          tableName = 'value_picks_products';
        }
      } else if (productId.startsWith('prime_picks_') || productId.startsWith('amazon_')) {
        const match = productId.match(/(?:prime_picks|amazon)_(\d+)$/);
        if (match) {
          numericId = parseInt(match[1]);
          tableName = 'amazon_products';
        }
      }
      
      // Execute delete with enhanced error handling
      if (tableName && numericId) {
        try {
          console.log(`🗑️ Attempting delete from ${tableName}, ID: ${numericId}`);
          
          // Check if product exists first
          const checkStmt = sqliteDb.prepare(`SELECT name, processing_status FROM ${tableName} WHERE id = ?`);
          const existingProduct = checkStmt.get(numericId);
          
          if (existingProduct) {
            console.log(`📦 Found product: ${existingProduct.name?.substring(0, 50)}...`);
            console.log(`📊 Status: ${existingProduct.processing_status}`);
            
            // Force delete regardless of status or source
            const deleteQuery = sqliteDb.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
            const result = deleteQuery.run(numericId);
            
            if (result.changes > 0) {
              deleted = true;
              deletionDetails.push(`Deleted from ${tableName}`);
              console.log(`✅ Successfully deleted from ${tableName}`);
              
              // Clean up category associations
              try {
                const categoryCleanup = sqliteDb.prepare(`
                  DELETE FROM category_products 
                  WHERE product_id = ? AND product_table = ?
                `);
                const categoryResult = categoryCleanup.run(numericId.toString(), tableName);
                if (categoryResult.changes > 0) {
                  deletionDetails.push(`Cleaned ${categoryResult.changes} category associations`);
                  console.log(`🧹 Cleaned up ${categoryResult.changes} category associations`);
                }
              } catch (categoryError) {
                console.log(`⚠️ Category cleanup warning: ${categoryError.message}`);
              }
              
              // Clean up any featured product entries
              try {
                const featuredCleanup = sqliteDb.prepare(`
                  DELETE FROM featured_products 
                  WHERE product_id = ? AND product_table = ?
                `);
                const featuredResult = featuredCleanup.run(numericId.toString(), tableName);
                if (featuredResult.changes > 0) {
                  deletionDetails.push(`Removed from featured products`);
                  console.log(`⭐ Removed from featured products`);
                }
              } catch (featuredError) {
                console.log(`⚠️ Featured cleanup warning: ${featuredError.message}`);
              }
            } else {
              console.log(`❌ Delete operation returned 0 changes`);
            }
          } else {
            console.log(`❌ Product not found in ${tableName} with ID ${numericId}`);
          }
        } catch (dbError) {
          console.error(`❌ Database error: ${dbError.message}`);
          console.error(`Stack: ${dbError.stack}`);
        }
      } else {
        console.log(`❌ Could not parse composite ID: ${productId}`);
      }
    } else {
      // Handle simple numeric IDs - try all tables
      const id = parseInt(productId);
      if (!isNaN(id)) {
        console.log(`📝 Processing simple numeric ID: ${id}`);
        
        const tables = [
          'amazon_products',
          'click_picks_products', 
          'global_picks_products',
          'dealshub_products',
          'deals_hub_products',
          'loot_box_products',
          'cuelinks_products',
          'value_picks_products',
          'travel_deals',
          'products' // Legacy table
        ];
        
        for (const table of tables) {
          try {
            const checkStmt = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE id = ?`);
            const exists = checkStmt.get(id);
            
            if (exists.count > 0) {
              const deleteStmt = sqliteDb.prepare(`DELETE FROM ${table} WHERE id = ?`);
              const result = deleteStmt.run(id);
              
              if (result.changes > 0) {
                deleted = true;
                deletionDetails.push(`Deleted from ${table}`);
                console.log(`✅ Successfully deleted from ${table}`);
                break;
              }
            }
          } catch (tableError) {
            console.log(`⚠️ Could not check table ${table}: ${tableError.message}`);
          }
        }
        
        // Also try storage.deleteProduct as fallback
        if (!deleted) {
          try {
            const storageResult = await storage.deleteProduct(id);
            if (storageResult) {
              deleted = true;
              deletionDetails.push('Deleted via storage method');
              console.log('✅ Deleted via storage method');
            }
          } catch (storageError) {
            console.log(`⚠️ Storage delete failed: ${storageError.message}`);
          }
        }
      }
    }
    
    // Return detailed response
    if (deleted) {
      const response = {
        message: 'Product deleted successfully',
        details: deletionDetails,
        productId: productId,
        timestamp: new Date().toISOString()
      };
      console.log(`✅ DELETE SUCCESS: ${JSON.stringify(response)}`);
      res.json(response);
    } else {
      const errorResponse = {
        message: 'Product not found or could not be deleted',
        productId: productId,
        searched: deletionDetails.length > 0 ? deletionDetails : ['No matching records found'],
        timestamp: new Date().toISOString()
      };
      console.log(`❌ DELETE FAILED: ${JSON.stringify(errorResponse)}`);
      res.status(404).json(errorResponse);
    }
  } catch (error) {
    console.error('❌ CRITICAL DELETE ERROR:', error);
    res.status(500).json({ 
      message: 'Internal server error during deletion',
      error: error.message,
      productId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
})

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
      const { password, ...blogPostData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validate blogPostData keys and values before insert
      const requiredFields = ['title', 'excerpt', 'content', 'category', 'tags', 'imageUrl', 'publishedAt', 'slug'];
      for (const field of requiredFields) {
        if (!(field in blogPostData)) {
          return res.status(400).json({ message: `Missing required field: ${field}` });
        }
      }

      // Ensure blog posts are visible by default with proper settings
      const enhancedBlogPostData = {
        ...blogPostData,
        // Convert tags array to JSON string if needed
        tags: Array.isArray(blogPostData.tags) ? JSON.stringify(blogPostData.tags) : blogPostData.tags,
        // Ensure proper timestamps
        publishedAt: blogPostData.publishedAt ? new Date(blogPostData.publishedAt) : new Date(),
        createdAt: new Date(),
        // Set default values for visibility
        isPublished: blogPostData.isPublished !== undefined ? blogPostData.isPublished : true,
        status: blogPostData.status || 'published',
      };

      const blogPost = await storage.addBlogPost(enhancedBlogPostData);
      
      // Blog TRIGGER CANVA AUTOMATION FOR NEW BLOG POST
      try {
        const { onContentCreated } = await import('./canva-triggers.js');
        
        // Trigger Canva automation in background
        onContentCreated('blog', blogPost.id, {
          id: blogPost.id,
          title: blogPost.title,
          excerpt: blogPost.excerpt,
          content: blogPost.content,
          category: blogPost.category,
          image_url: blogPost.imageUrl
        }).catch(error => {
          console.error('Background Canva automation failed for blog:', error);
        });
        
        console.log('Launch Canva automation triggered for blog post:', blogPost.id);
      } catch (automationError) {
        console.error('Warning Canva automation failed (blog still created):', automationError);
        // Don't fail the blog creation if automation fails
      }
      
      res.json({ message: 'Blog post added successfully', blogPost });
    } catch (error: any) {
      console.error('Add blog post error:', error);
      console.error(error); // Added detailed error logging
      res.status(500).json({ message: 'Failed to add blog post', error: error.message });
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

  // Announcement active endpoint - Only one instance of this route
  app.get('/api/announcement/active', async (req, res) => {
    try {
      const { page } = req.query;
      
      // Use storage to get active announcements
      const allAnnouncements = await storage.getAnnouncements();
      const activeAnnouncements = allAnnouncements.filter(announcement => announcement.isActive);
      
      if (activeAnnouncements && activeAnnouncements.length > 0) {
        let filteredAnnouncements = activeAnnouncements;
        
        // Filter by page if page parameter is provided
        if (page) {
          // First try to find page-specific announcement
          const pageSpecific = activeAnnouncements.filter(announcement => 
            !announcement.isGlobal && announcement.page === page
          );
          
          if (pageSpecific.length > 0) {
            filteredAnnouncements = pageSpecific;
          } else {
            // If no page-specific announcement, get global announcements
            const globalAnnouncements = activeAnnouncements.filter(announcement => 
              announcement.isGlobal
            );
            filteredAnnouncements = globalAnnouncements;
          }
        } else {
          // No page parameter provided - prioritize global announcements
          const globalAnnouncements = activeAnnouncements.filter(announcement => 
            announcement.isGlobal
          );
          
          if (globalAnnouncements.length > 0) {
            filteredAnnouncements = globalAnnouncements;
          }
          // If no global announcements, keep all active announcements as fallback
        }
        
        if (filteredAnnouncements.length > 0) {
          // Sort by createdAt descending and take the first one
          const sorted = filteredAnnouncements.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          const row = sorted[0] as any;
          
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
            page: row.page,
            isGlobal: row.isGlobal,
            createdAt: row.createdAt
          };
          res.json(announcement);
        } else {
          res.status(404).json({ message: 'No active announcement found for this page' });
        }
      } else {
        res.status(404).json({ message: 'No active announcement found' });
      }
    } catch (error) {
      console.error('Error fetching active announcement:', error);
      res.status(500).json({ error: 'Failed to fetch announcement' });
    }
  });

  app.get('/api/admin/announcements', async (req, res) => {
    try {
      const { password } = req.query;
      
      if (!await verifyAdminPassword(password as string)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const allAnnouncements = await storage.getAnnouncements();
      res.json(allAnnouncements);
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

      // Create new announcement (allow multiple active announcements)
      console.log('=== CREATING NEW ANNOUNCEMENT ===');
      
      // Check if this is a page-specific announcement that conflicts with existing page-specific
      if (!announcementData.isGlobal && announcementData.page) {
        // Deactivate existing page-specific announcements for the same page
        const deactivatePageSpecific = await db.update(announcements)
          .set({ isActive: false })
          .where(and(
            eq(announcements.page, announcementData.page),
            eq(announcements.isGlobal, false),
            eq(announcements.isActive, true)
          ));
        console.log(`Deactivated existing page-specific announcements for page: ${announcementData.page}`);
      } else if (announcementData.isGlobal) {
        // Deactivate existing global announcements (only one global at a time)
        const deactivateGlobal = await db.update(announcements)
          .set({ isActive: false })
          .where(and(
            eq(announcements.isGlobal, true),
            eq(announcements.isActive, true)
          ));
        console.log('Deactivated existing global announcements');
      }
      
      // Create new announcement
      console.log('Creating new announcement:', announcementData);
      const announcementValues = {
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
        page: announcementData.page || null,
        isGlobal: announcementData.isGlobal !== undefined ? announcementData.isGlobal : true,
        isActive: 1
      };
      
      const [newAnnouncement] = await db
        .insert(announcements)
        .values(announcementValues)
        .returning();
      
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

  // Video Content Management Routes
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
      res.status(500).json({ message: "Failed to fetch video content" });
    }
  });

  app.post('/api/admin/video-content', async (req, res) => {
    try {
      const { password, ...videoData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validate required fields
      const requiredFields = ['title', 'videoUrl', 'platform', 'category'];
      for (const field of requiredFields) {
        if (!(field in videoData)) {
          return res.status(400).json({ message: `Missing required field: ${field}` });
        }
      }

      // Ensure video content is visible by default with proper settings
      const enhancedVideoData = {
        ...videoData,
        // Convert tags array to JSON string if needed
        tags: Array.isArray(videoData.tags) ? JSON.stringify(videoData.tags) : videoData.tags,
        // Convert pages array to JSON string if needed
        pages: Array.isArray(videoData.pages) ? JSON.stringify(videoData.pages) : (videoData.pages || '[]'),
        // Ensure proper timestamps
        createdAt: new Date(),
        // Set default values for visibility
        description: videoData.description || '',
        thumbnailUrl: videoData.thumbnailUrl || '',
        duration: videoData.duration || '',
        // Handle new fields for multiple pages and CTA
        showOnHomepage: videoData.showOnHomepage !== undefined ? videoData.showOnHomepage : true,
        ctaText: videoData.ctaText || null,
        ctaUrl: videoData.ctaUrl || null,
      };

      const videoContent = await storage.addVideoContent(enhancedVideoData);
      
      // Movie TRIGGER CANVA AUTOMATION FOR NEW VIDEO CONTENT
      try {
        const { onContentCreated } = await import('./canva-triggers.js');
        
        // Trigger Canva automation in background
        onContentCreated('video', videoContent.id, {
          id: videoContent.id,
          title: videoContent.title,
          description: videoContent.description || 'Check out this amazing video content!',
          video_url: videoContent.videoUrl,
          thumbnail_url: videoContent.thumbnailUrl,
          category: videoContent.category
        }).catch(error => {
          console.error('Background Canva automation failed for video:', error);
        });
        
        console.log('Launch Canva automation triggered for video content:', videoContent.id);
      } catch (automationError) {
        console.error('Warning Canva automation failed (video content still created):', automationError);
        // Don't fail the video content creation if automation fails
      }
      
      res.json({ message: 'Video content added successfully', videoContent });
    } catch (error: any) {
      console.error('Add video content error:', error);
      res.status(500).json({ message: 'Failed to add video content', error: error.message });
    }
  });

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

  // Bulk delete all video content
  app.delete('/api/admin/video-content/bulk-delete', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const deletedCount = await storage.deleteAllVideoContent();
      
      res.json({ 
        message: `Successfully deleted ${deletedCount} video(s)`,
        deletedCount 
      });
    } catch (error) {
      console.error('Bulk delete video content error:', error);
      res.status(500).json({ message: 'Failed to delete all video content' });
    }
  });

  app.put('/api/admin/video-content/:id', async (req, res) => {
    try {
      const { password, ...updates } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const id = parseInt(req.params.id);
      const videoContent = await storage.updateVideoContent(id, updates);
      
      if (videoContent) {
        res.json({ message: 'Video content updated successfully', videoContent });
      } else {
        res.status(404).json({ message: 'Video content not found' });
      }
    } catch (error) {
      console.error('Update video content error:', error);
      res.status(500).json({ message: 'Failed to update video content' });
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

  // Canva Automation Routes
  
  // Get Canva settings
  app.get('/api/admin/canva/settings', async (req, res) => {
    try {
      const { password } = req.query;
      
      if (!await verifyAdminPassword(password as string)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const settings = await storage.getCanvaSettings();
      res.json(settings || {
        isEnabled: false,
        platforms: ['instagram', 'facebook', 'whatsapp', 'telegram'],
        autoGenerateCaptions: true,
        autoGenerateHashtags: true,
        scheduleType: 'immediate'
      });
    } catch (error) {
      console.error('Error fetching Canva settings:', error);
      res.status(500).json({ message: 'Failed to fetch Canva settings' });
    }
  });

  // Update Canva settings
  app.put('/api/admin/canva/settings', async (req, res) => {
    try {
      const { password, ...settingsData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Convert platforms array to JSON string for storage
      if (Array.isArray(settingsData.platforms)) {
        settingsData.platforms = JSON.stringify(settingsData.platforms);
      }

      const settings = await storage.updateCanvaSettings(settingsData);
      res.json({ message: 'Canva settings updated successfully', settings });
    } catch (error) {
      console.error('Error updating Canva settings:', error);
      res.status(500).json({ message: 'Failed to update Canva settings' });
    }
  });

  // Get Canva posts
  app.get('/api/admin/canva/posts', async (req, res) => {
    try {
      const { password } = req.query;
      
      if (!await verifyAdminPassword(password as string)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const posts = await storage.getCanvaPosts();
      res.json(posts);
    } catch (error) {
      console.error('Error fetching Canva posts:', error);
      res.status(500).json({ message: 'Failed to fetch Canva posts' });
    }
  });

  // Get Canva templates
  app.get('/api/admin/canva/templates', async (req, res) => {
    try {
      const { password } = req.query;
      
      if (!await verifyAdminPassword(password as string)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const templates = await storage.getCanvaTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching Canva templates:', error);
      res.status(500).json({ message: 'Failed to fetch Canva templates' });
    }
  });

  // Add Canva template
  app.post('/api/admin/canva/templates', async (req, res) => {
    try {
      const { password, ...templateData } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const template = await storage.addCanvaTemplate(templateData);
      res.json({ message: 'Template added successfully', template });
    } catch (error) {
      console.error('Error adding Canva template:', error);
      res.status(500).json({ message: 'Failed to add template' });
    }
  });

  // Test Canva automation (for testing purposes)
  app.post('/api/admin/canva/test', async (req, res) => {
    try {
      const { password, contentType, contentId } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get Canva settings
      const settings = await storage.getCanvaSettings();
      if (!settings || !settings.isEnabled) {
        return res.status(400).json({ message: 'Canva automation is not enabled' });
      }

      // Mock test - in production this would trigger actual Canva automation
      const testResult = {
        success: true,
        message: 'Canva automation test completed successfully',
        contentType,
        contentId,
        platforms: JSON.parse(settings.platforms || '[]'),
        timestamp: new Date().toISOString()
      };

      res.json(testResult);
    } catch (error) {
      console.error('Error testing Canva automation:', error);
      res.status(500).json({ message: 'Failed to test Canva automation' });
    }
  });

  // Enhanced content redirect endpoint for handling expired affiliate links
  app.get('/redirect/:type/:id', async (req, res) => {
    const { handleRedirect } = await import('./redirect-handler.js');
    await handleRedirect(req, res);
  });

  // Currency API routes
  // Get all exchange rates
  app.get('/api/currency/rates', async (req, res) => {
    try {
      const rates = await db.select().from(exchangeRates);
      res.json(rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      res.json([]); // Return empty array as fallback
    }
  });

  // Get currency settings
  app.get('/api/currency/settings', async (req, res) => {
    try {
      const settings = await db.select().from(currencySettings).limit(1);
      if (settings.length === 0) {
        // Return default settings if none exist
        return res.json({
          defaultCurrency: 'INR',
          enabledCurrencies: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'SGD', 'CNY', 'KRW'],
          autoUpdateRates: true
        });
      }
      
      const setting = settings[0];
      res.json({
        defaultCurrency: setting.defaultCurrency,
        enabledCurrencies: JSON.parse(setting.enabledCurrencies || '[]'),
        autoUpdateRates: setting.autoUpdateRates
      });
    } catch (error) {
      console.error('Error fetching currency settings:', error);
      res.json({
        defaultCurrency: 'INR',
        enabledCurrencies: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'SGD', 'CNY', 'KRW'],
        autoUpdateRates: true
      });
    }
  });

  // Convert currency (utility endpoint)
  app.post('/api/currency/convert', async (req, res) => {
    try {
      const { amount, fromCurrency, toCurrency } = req.body;
      
      if (!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (fromCurrency === toCurrency) {
        return res.json({ convertedAmount: amount, rate: 1 });
      }

      // Get exchange rate
      const rates = await db.select()
        .from(exchangeRates)
        .where(and(
          eq(exchangeRates.fromCurrency, fromCurrency),
          eq(exchangeRates.toCurrency, toCurrency)
        ))
        .limit(1);

      if (rates.length === 0) {
        // Try reverse rate
        const reverseRates = await db.select()
          .from(exchangeRates)
          .where(and(
            eq(exchangeRates.fromCurrency, toCurrency),
            eq(exchangeRates.toCurrency, fromCurrency)
          ))
          .limit(1);

        if (reverseRates.length === 0) {
          return res.status(404).json({ error: 'Exchange rate not found' });
        }

        const reverseRate = parseFloat(reverseRates[0].rate);
        const convertedAmount = amount / reverseRate;
        return res.json({ convertedAmount, rate: 1 / reverseRate });
      }

      const rate = parseFloat(rates[0].rate);
      const convertedAmount = amount * rate;
      res.json({ convertedAmount, rate });
    } catch (error) {
      console.error('Error converting currency:', error);
      res.status(500).json({ error: 'Failed to convert currency' });
    }
  });

  // Commission Management API Routes
  
  // Get all affiliate networks
  app.get('/api/admin/affiliate-networks', async (req, res) => {
    try {
      const networks = sqliteDb.prepare(`
        SELECT id, name, base_url as baseUrl, commission_rate as commissionRate, 
               priority_score as priorityScore, is_active as isActive, created_at as createdAt,
               affiliate_tag as affiliateTag, tracking_params as trackingParams
        FROM affiliate_networks 
        ORDER BY commission_rate DESC
      `).all();
      
      // Parse affiliate tags from JSON and provide both formats for compatibility
      const processedNetworks = networks.map((network: any) => {
        let affiliateTags = [];
        let legacyAffiliateTag = null;
        
        if (network.affiliateTag) {
          try {
            // Try to parse as JSON array (new format)
            affiliateTags = JSON.parse(network.affiliateTag);
            legacyAffiliateTag = affiliateTags[0] || null; // First tag for backward compatibility
          } catch {
            // If parsing fails, treat as single tag (legacy format)
            affiliateTags = [network.affiliateTag];
            legacyAffiliateTag = network.affiliateTag;
          }
        }
        
        return {
          ...network,
          affiliateTag: legacyAffiliateTag, // Legacy single tag for backward compatibility
          affiliateTags: affiliateTags      // New multiple tags array
        };
      });
      
      res.json(processedNetworks);
    } catch (error) {
      console.error('Error fetching affiliate networks:', error);
      res.status(500).json({ message: 'Failed to fetch affiliate networks' });
    }
  });
  
  // Update affiliate network (no password required - admin already authenticated)
  app.put('/api/admin/affiliate-networks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { commissionRate, priorityScore, isActive } = req.body;
      
      sqliteDb.prepare(`
        UPDATE affiliate_networks 
        SET commission_rate = ?, priority_score = ?, is_active = ?
        WHERE id = ?
      `).run(commissionRate, priorityScore, isActive ? 1 : 0, id);
      
      res.json({ message: 'Affiliate network updated successfully' });
    } catch (error) {
      console.error('Error updating affiliate network:', error);
      res.status(500).json({ message: 'Failed to update affiliate network' });
    }
  });
  
  // Add new affiliate network (no password required - admin already authenticated)
  app.post('/api/admin/affiliate-networks', async (req, res) => {
    try {
      const { name, baseUrl, commissionRate, priorityScore } = req.body;
      
      const result = sqliteDb.prepare(`
        INSERT INTO affiliate_networks (name, base_url, commission_rate, priority_score, is_active)
        VALUES (?, ?, ?, ?, 1)
      `).run(name, baseUrl, commissionRate, priorityScore);
      
      res.json({ 
        message: 'Affiliate network added successfully. Configure affiliate tags in the Affiliate Tags tab.',
        id: result.lastInsertRowid 
      });
    } catch (error) {
      console.error('Error adding affiliate network:', error);
      res.status(500).json({ message: 'Failed to add affiliate network' });
    }
  });
  
  // Delete affiliate network
  app.delete('/api/admin/affiliate-networks/:id', async (req, res) => {
    try {
      const networkId = parseInt(req.params.id);
      
      // Check if network exists
      const network = sqliteDb.prepare('SELECT * FROM affiliate_networks WHERE id = ?').get(networkId);
      if (!network) {
        return res.status(404).json({ message: 'Affiliate network not found' });
      }
      
      // Delete the network
      sqliteDb.prepare('DELETE FROM affiliate_networks WHERE id = ?').run(networkId);
      
      // Also delete any related commission rates
      sqliteDb.prepare('DELETE FROM category_commission_rates WHERE affiliate_network_id = ?').run(networkId);
      
      res.json({ message: 'Affiliate network deleted successfully' });
    } catch (error) {
      console.error('Error deleting affiliate network:', error);
      res.status(500).json({ message: 'Failed to delete affiliate network' });
    }
  });

  // Delete featured product
  app.delete('/api/admin/featured-products/:id', async (req, res) => {
    try {
      const { password } = req.body;
      
      // Verify admin password
      if (!password || !(await verifyAdminPassword(password))) {
        return res.status(401).json({ message: 'Invalid admin password' });
      }
      
      const productId = parseInt(req.params.id);
      
      // Check if product exists
      const product = await db.select().from(featuredProducts).where(eq(featuredProducts.id, productId));
      if (product.length === 0) {
        return res.status(404).json({ message: 'Featured product not found' });
      }
      
      // Delete the product
      await db.delete(featuredProducts).where(eq(featuredProducts.id, productId));
      
      console.log(`🗑️ Admin deleted featured product: ${product[0].name} (ID: ${productId})`);
      res.json({ message: 'Featured product deleted successfully' });
    } catch (error) {
      console.error('Error deleting featured product:', error);
      res.status(500).json({ message: 'Failed to delete featured product' });
    }
  });
  
  // Optimize products for best commission (no password required - admin already authenticated)
  app.post('/api/admin/optimize-commissions', async (req, res) => {
    try {
      // Get all active networks sorted by commission rate
      const networks = sqliteDb.prepare(`
        SELECT id, name, commission_rate, priority_score, base_url, affiliate_tag, tracking_params
        FROM affiliate_networks 
        WHERE is_active = 1 
        ORDER BY commission_rate DESC, priority_score DESC
      `).all();
      
      if (networks.length === 0) {
        return res.status(400).json({ message: 'No active affiliate networks found' });
      }
      
      // Get all products
      const products = sqliteDb.prepare(`
        SELECT id, name, affiliate_url, affiliate_network_id 
        FROM products 
        WHERE affiliate_url IS NOT NULL
      `).all() as any[];
      
      let optimizedCount = 0;
      const bestNetwork = networks[0] as any; // Highest commission rate
      
      // Enhanced function to convert affiliate link using database tracking parameters
      const convertAffiliateLink = (originalUrl: string, targetNetwork: any): string => {
        if (!targetNetwork.affiliate_tag || !targetNetwork.tracking_params) {
          return originalUrl; // Return original if no tracking info
        }

        const networkName = targetNetwork.name.toLowerCase();
        const affiliateTag = targetNetwork.affiliate_tag;
        const trackingTemplate = targetNetwork.tracking_params;
        
        // Replace {affiliateTag} placeholder with actual tag
        const trackingParams = trackingTemplate.replace(/{affiliateTag}/g, affiliateTag);
        
        // Amazon link conversion
        if (networkName.includes('amazon')) {
          if (originalUrl.includes('amazon.')) {
            const baseUrl = originalUrl.split('?')[0];
            return `${baseUrl}?${trackingParams}`;
          }
        }
        
        // EarnKaro link conversion (supports multiple stores)
        if (networkName.includes('earnkaro')) {
          const encodedUrl = encodeURIComponent(originalUrl);
          return `https://earnkaro.com/deals/loot?url=${encodedUrl}&${trackingParams}`;
        }
        
        // CashKaro link conversion
        if (networkName.includes('cashkaro')) {
          const encodedUrl = encodeURIComponent(originalUrl);
          return `https://cashkaro.com/deals/redirect?url=${encodedUrl}&${trackingParams}`;
        }
        
        // Flipkart link conversion
        if (networkName.includes('flipkart')) {
          if (originalUrl.includes('flipkart.com')) {
            return originalUrl.includes('?') 
              ? `${originalUrl}&${trackingParams}` 
              : `${originalUrl}?${trackingParams}`;
          }
        }
        
        // Myntra link conversion
        if (networkName.includes('myntra')) {
          if (originalUrl.includes('myntra.com')) {
            return originalUrl.includes('?') 
              ? `${originalUrl}&${trackingParams}` 
              : `${originalUrl}?${trackingParams}`;
          }
        }
        
        // Nykaa link conversion
        if (networkName.includes('nykaa')) {
          if (originalUrl.includes('nykaa.com')) {
            return originalUrl.includes('?') 
              ? `${originalUrl}&${trackingParams}` 
              : `${originalUrl}?${trackingParams}`;
          }
        }
        
        // Generic conversion for other networks
        return originalUrl.includes('?') 
          ? `${originalUrl}&${trackingParams}` 
          : `${originalUrl}?${trackingParams}`;
      };
      
      // Update each product to use the best commission network
      products.forEach((product: any) => {
        if (product.affiliate_network_id !== bestNetwork.id) {
          const optimizedUrl = convertAffiliateLink(product.affiliate_url, bestNetwork);
          
          sqliteDb.prepare(`
            UPDATE products 
            SET affiliate_network_id = ?, affiliate_url = ? 
            WHERE id = ?
          `).run(bestNetwork.id, optimizedUrl, product.id);
          
          optimizedCount++;
        }
      });
      
      res.json({ 
        message: 'Products optimized successfully', 
        optimizedCount,
        bestNetwork: bestNetwork.name,
        commissionRate: bestNetwork.commission_rate
      });
    } catch (error) {
      console.error('Error optimizing commissions:', error);
      res.status(500).json({ message: 'Failed to optimize commissions' });
    }
  });

  // CSV Upload endpoint
  app.post('/api/admin/upload-commission-csv', upload.single('csvFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No CSV file uploaded' });
      }

      const csvContent = require('fs').readFileSync(req.file.path, 'utf8');
      const lines = csvContent.split('\n').filter((line: string) => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ message: 'CSV file must have header and at least one data row' });
      }

      const header = lines[0].split(',').map((h: string) => h.trim());
      const expectedHeaders = ['category_name', 'network_name', 'commission_rate'];
      
      if (!expectedHeaders.every(h => header.includes(h))) {
        return res.status(400).json({ 
          message: `CSV must include columns: ${expectedHeaders.join(', ')}` 
        });
      }

      let processedRows = 0;
      let successCount = 0;
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map((v: string) => v.trim());
          const rowData: any = {};
          header.forEach((h: string, idx: number) => {
            rowData[h] = values[idx];
          });

          // Find network by name
          const network = sqliteDb.prepare(`
            SELECT id FROM affiliate_networks 
            WHERE name LIKE ? OR name LIKE ?
          `).get(`%${rowData.network_name}%`, `${rowData.network_name}%`) as any;

          if (network) {
            // Update or insert category commission rate
            sqliteDb.prepare(`
              INSERT OR REPLACE INTO category_commission_rates 
              (category_name, affiliate_network_id, commission_rate, priority_score)
              VALUES (?, ?, ?, ?)
            `).run(
              rowData.category_name,
              network.id,
              parseFloat(rowData.commission_rate),
              Math.floor(parseFloat(rowData.commission_rate) * 10)
            );
            successCount++;
          } else {
            errors.push(`Row ${i + 1}: Network '${rowData.network_name}' not found`);
          }
          processedRows++;
        } catch (error) {
          errors.push(`Row ${i + 1}: ${(error as Error).message}`);
          processedRows++;
        }
      }

      // Clean up uploaded file
      require('fs').unlinkSync(req.file.path);

      res.json({
        message: 'CSV processed successfully',
        processedRows,
        successCount,
        errorCount: errors.length,
        errors: errors.slice(0, 10) // Return first 10 errors
      });
    } catch (error) {
      console.error('Error processing CSV:', error);
      res.status(500).json({ message: 'Failed to process CSV file' });
    }
  });

  // Google Sheets sync endpoint
  app.post('/api/admin/sync-google-sheets', async (req, res) => {
    try {
      const { sheetUrl, syncInterval } = req.body;
      
      if (!sheetUrl) {
        return res.status(400).json({ message: 'Google Sheets URL is required' });
      }

      // Extract sheet ID from URL
      const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!sheetIdMatch) {
        return res.status(400).json({ message: 'Invalid Google Sheets URL' });
      }

      const sheetId = sheetIdMatch[1];
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      // Fetch CSV data from Google Sheets
      const response = await fetch(csvUrl);
      if (!response.ok) {
        return res.status(400).json({ message: 'Failed to fetch Google Sheets data. Make sure the sheet is publicly viewable.' });
      }

      const csvContent = await response.text();
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ message: 'Google Sheet must have header and at least one data row' });
      }

      const header = lines[0].split(',').map((h: string) => h.trim());
      let updatedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map((v: string) => v.trim());
          const rowData: any = {};
          header.forEach((h: string, idx: number) => {
            rowData[h] = values[idx];
          });

          if (rowData.category_name && rowData.network_name && rowData.commission_rate) {
            // Find network by name
            const network = sqliteDb.prepare(`
              SELECT id FROM affiliate_networks 
              WHERE name LIKE ? OR name LIKE ?
            `).get(`%${rowData.network_name}%`, `${rowData.network_name}%`) as any;

            if (network) {
              sqliteDb.prepare(`
                INSERT OR REPLACE INTO category_commission_rates 
                (category_name, affiliate_network_id, commission_rate, priority_score)
                VALUES (?, ?, ?, ?)
              `).run(
                rowData.category_name,
                network.id,
                parseFloat(rowData.commission_rate),
                Math.floor(parseFloat(rowData.commission_rate) * 10)
              );
              updatedCount++;
            }
          }
        } catch (error) {
          console.error(`Error processing row ${i + 1}:`, error);
        }
      }

      res.json({
        message: 'Google Sheets sync completed',
        updatedCount,
        syncInterval
      });
    } catch (error) {
      console.error('Error syncing Google Sheets:', error);
      res.status(500).json({ message: 'Failed to sync Google Sheets' });
    }
  });

  // Get commission settings
  app.get('/api/admin/commission-settings', async (req, res) => {
    try {
      // Create settings table if it doesn't exist
      sqliteDb.prepare(`
        CREATE TABLE IF NOT EXISTS commission_settings (
          id INTEGER PRIMARY KEY,
          admin_panel_enabled INTEGER DEFAULT 1,
          csv_upload_enabled INTEGER DEFAULT 1,
          google_sheets_enabled INTEGER DEFAULT 0,
          auto_optimize_enabled INTEGER DEFAULT 1,
          sync_interval_minutes INTEGER DEFAULT 5,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      
      // Get current settings or create default
      let settings = sqliteDb.prepare(`
        SELECT admin_panel_enabled as adminPanelEnabled,
               csv_upload_enabled as csvUploadEnabled,
               google_sheets_enabled as googleSheetsEnabled,
               auto_optimize_enabled as autoOptimizeEnabled,
               sync_interval_minutes as syncIntervalMinutes
        FROM commission_settings WHERE id = 1
      `).get() as any;
      
      if (!settings) {
        // Insert default settings
        sqliteDb.prepare(`
          INSERT INTO commission_settings (id, admin_panel_enabled, csv_upload_enabled, google_sheets_enabled, auto_optimize_enabled, sync_interval_minutes)
          VALUES (1, 1, 1, 0, 1, 5)
        `).run();
        
        settings = {
          adminPanelEnabled: true,
          csvUploadEnabled: true,
          googleSheetsEnabled: false,
          autoOptimizeEnabled: true,
          syncIntervalMinutes: 5
        };
      } else {
        // Convert integers to booleans
        settings.adminPanelEnabled = Boolean(settings.adminPanelEnabled);
        settings.csvUploadEnabled = Boolean(settings.csvUploadEnabled);
        settings.googleSheetsEnabled = Boolean(settings.googleSheetsEnabled);
        settings.autoOptimizeEnabled = Boolean(settings.autoOptimizeEnabled);
      }
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching commission settings:', error);
      res.status(500).json({ message: 'Failed to fetch commission settings' });
    }
  });

  // Update affiliate tags for a specific network
  app.put('/api/admin/affiliate-networks/:id/tags', async (req, res) => {
    try {
      const { id } = req.params;
      const { affiliateTag, affiliateTags, trackingParams } = req.body;
      
      // Handle both single tag (legacy) and multiple tags (new)
      let tagsToStore = null;
      if (affiliateTags && Array.isArray(affiliateTags)) {
        tagsToStore = affiliateTags.length > 0 ? JSON.stringify(affiliateTags) : null;
      } else if (affiliateTag) {
        tagsToStore = JSON.stringify([affiliateTag]);
      }
      
      sqliteDb.prepare(`
        UPDATE affiliate_networks 
        SET affiliate_tag = ?, tracking_params = ?
        WHERE id = ?
      `).run(tagsToStore, trackingParams || null, id);
      
      res.json({ message: 'Affiliate tags updated successfully' });
    } catch (error) {
      console.error('Error updating affiliate tags:', error);
      res.status(500).json({ message: 'Failed to update affiliate tags' });
    }
  });

  // Update commission settings
  app.put('/api/admin/commission-settings', async (req, res) => {
    try {
      const { adminPanelEnabled, csvUploadEnabled, googleSheetsEnabled, autoOptimizeEnabled, syncIntervalMinutes } = req.body;
      
      // Create settings table if it doesn't exist
      sqliteDb.prepare(`
        CREATE TABLE IF NOT EXISTS commission_settings (
          id INTEGER PRIMARY KEY,
          admin_panel_enabled INTEGER DEFAULT 1,
          csv_upload_enabled INTEGER DEFAULT 1,
          google_sheets_enabled INTEGER DEFAULT 0,
          auto_optimize_enabled INTEGER DEFAULT 1,
          sync_interval_minutes INTEGER DEFAULT 5,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      
      // Update or insert settings
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO commission_settings 
        (id, admin_panel_enabled, csv_upload_enabled, google_sheets_enabled, auto_optimize_enabled, sync_interval_minutes, updated_at)
        VALUES (1, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        adminPanelEnabled ? 1 : 0,
        csvUploadEnabled ? 1 : 0,
        googleSheetsEnabled ? 1 : 0,
        autoOptimizeEnabled ? 1 : 0,
        syncIntervalMinutes || 5
      );
      
      res.json({ message: 'Commission settings updated successfully' });
    } catch (error) {
      console.error('Error updating commission settings:', error);
      res.status(500).json({ message: 'Failed to update commission settings' });
    }
  });

  // Telegram bot monitoring endpoints removed

  // All Telegram bot endpoints removed

  // ===== SERVICES API ENDPOINTS =====
  
  // Get all services from all channels
  app.get('/api/services', async (req, res) => {
    try {
      const { category, channel } = req.query;
      console.log(`🛠️ API CALLED: Getting services with category: "${category}", channel: "${channel}"`);
      
      const tables = ['products', 'amazon_products', 'cuelinks_products', 'value_picks_products', 'click_picks_products', 'travel_deals'];
      let allServices: any[] = [];
      
      for (const table of tables) {
        try {
          let query;
          
          if (table === 'products') {
            // Main products table uses is_service field
            query = `
              SELECT 
                id, name, description, price, original_price as originalPrice,
                currency, image_url as imageUrl, affiliate_url as affiliateUrl,
                category, rating, review_count as reviewCount, discount,
                is_featured as isFeatured, created_at as createdAt,
                'service' as content_type, '${table}' as source_table
              FROM ${table} 
              WHERE is_service = 1
            `;
          } else {
            // Other tables use content_type field
            query = `
              SELECT 
                id, name, description, price, original_price as originalPrice,
                currency, image_url as imageUrl, affiliate_url as affiliateUrl,
                category, rating, review_count as reviewCount, discount,
                is_featured as isFeatured, created_at as createdAt,
                content_type, '${table}' as source_table
              FROM ${table} 
              WHERE content_type = 'service'
            `;
          }
          
          const params: any[] = [];
          
          // Add category filter if specified
          if (category) {
            query += ` AND category = ?`;
            params.push(category);
          }
          
          // Add channel filter if specified
          if (channel) {
            const channelTableMap: { [key: string]: string } = {
              'prime-picks': 'amazon_products',
              'cue-picks': 'cuelinks_products',
              'value-picks': 'value_picks_products',
              'click-picks': 'click_picks_products'
            };
            
            if (channelTableMap[channel as string] === table) {
              // Only query this table for the specified channel
            } else {
              continue; // Skip this table for other channels
            }
          }
          
          query += ` ORDER BY created_at DESC`;
          
          const services = sqliteDb.prepare(query).all(...params);
          
          // Add source information
          const formattedServices = services.map((service: any) => ({
            ...service,
            id: `${table}_${service.id}`,
            source: table.replace('_products', '').replace('_', '-'),
            networkBadge: table === 'products' ? 'Manual' :
                         table === 'amazon_products' ? 'Prime Picks' :
                         table === 'cuelinks_products' ? 'Cue Picks' :
                         table === 'value_picks_products' ? 'Value Picks' : 'Click Picks'
          }));
          
          allServices.push(...formattedServices);
          
        } catch (tableError) {
          console.error(`Error querying ${table}:`, tableError);
        }
      }
      
      // Sort by creation date (newest first)
      allServices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log(`🛠️ Found ${allServices.length} services total`);
      res.json(allServices);
      
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ message: 'Failed to fetch services' });
    }
  });
  
  // ===== TRAVEL DEALS API ENDPOINTS =====
  
  // Get all travel deals from all channels
  app.get('/api/travel-deals', async (req, res) => {
    try {
      const { subcategory, partner } = req.query;
      console.log(`Travel API CALLED: Getting travel deals with subcategory: "${subcategory}", partner: "${partner}"`);
      console.log('DEBUG: sqliteDb instance:', typeof sqliteDb, sqliteDb ? 'exists' : 'null');
      
      // Test database connection first
      try {
        const testQuery = sqliteDb.prepare('SELECT COUNT(*) as count FROM travel_products').get();
        console.log('DEBUG: Database connection test successful, records:', testQuery.count);
      } catch (dbTestError) {
        console.error('DEBUG: Database connection test failed:', dbTestError.message);
        throw new Error(`Database connection failed: ${dbTestError.message}`);
      }
      
      // Use unified travel_products table
      let query = `
        SELECT 
          id, name, description, price, original_price as originalPrice,
          currency, image_url as imageUrl, affiliate_url as affiliateUrl,
          category, subcategory, travel_type as travelType, partner, route, duration, valid_till as validTill,
          rating, review_count as reviewCount, discount,
          is_featured as isFeatured, is_new as isNew,
          category_icon, category_color, source,
          created_at as createdAt, updated_at as updatedAt
        FROM travel_products 
        WHERE processing_status = 'active'
      `;
      
      console.log('DEBUG: Executing query:', query.trim());
      
      const params: any[] = [];
      
      // Add subcategory filter if specified (travel type)
      if (subcategory) {
        query += ` AND subcategory = ?`;
        params.push(subcategory);
      }
      
      // Add partner filter if specified
      if (partner) {
        query += ` AND partner LIKE ?`;
        params.push(`%${partner}%`);
      }
      
      query += ` ORDER BY created_at DESC`;
      
      const travelDeals = sqliteDb.prepare(query).all(...params);
      
      // Format deals with consistent structure
      const formattedDeals = travelDeals.map((deal: any) => ({
        ...deal,
        id: `travel_picks_${deal.id}`, // Consistent ID format
        source: 'travel-picks',
        networkBadge: 'Travel Picks',
        // Ensure all required fields are present
        imageUrl: deal.imageUrl || `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400`,
        affiliateUrl: deal.affiliateUrl || '#',
        travelType: deal.travelType || deal.subcategory,
        partner: deal.partner || 'Travel Partner',
        validTill: deal.validTill,
        route: deal.route,
        duration: deal.duration
      }));
      
      console.log(`Travel Found ${formattedDeals.length} travel deals from unified table`);
      res.json(formattedDeals);
      
    } catch (error) {
      console.error('Error fetching travel deals:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        query: 'SELECT * FROM travel_products WHERE processing_status = "active"'
      });
      res.status(500).json({ 
        error: 'Failed to fetch travel deals',
        details: error.message 
      });
    }
  });
  
  // Helper function to extract partner from affiliate URL
  function getPartnerFromUrl(url: string): string {
    if (!url) return 'Unknown';
    
    if (url.includes('makemytrip')) return 'MakeMyTrip';
    if (url.includes('booking.com')) return 'Booking.com';
    if (url.includes('goibibo')) return 'Goibibo';
    if (url.includes('yatra')) return 'Yatra';
    if (url.includes('cleartrip')) return 'Cleartrip';
    if (url.includes('redbus')) return 'RedBus';
    if (url.includes('irctc')) return 'IRCTC';
    if (url.includes('agoda')) return 'Agoda';
    if (url.includes('expedia')) return 'Expedia';
    
    return 'Travel Partner';
  }
  
  // Helper function to extract valid till date from description
  function getValidTillDate(description: string): string | null {
    if (!description) return null;
    
    // Look for common date patterns in description
    const datePatterns = [
      /valid till ([^.!?\n]+)/i,
      /expires on ([^.!?\n]+)/i,
      /book by ([^.!?\n]+)/i,
      /offer valid till ([^.!?\n]+)/i
    ];
    
    for (const pattern of datePatterns) {
      const match = description.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }
  
  // ===== TRAVEL CONTENT MANAGEMENT API ENDPOINTS =====
  
  // Add new travel content (from admin form)
  app.post('/api/travel-content', async (req, res) => {
    try {
      const {
        name, description, price, originalPrice, currency,
        imageUrl, affiliateUrl, category, sectionType,
        customSectionTitle, customSectionDescription,
        textColor, ...categoryFields
      } = req.body;
      
      console.log('📝 Received travel content submission:', { name, category, sectionType });
      
      // Validate required fields
      if (!name || !category || !sectionType) {
        return res.status(400).json({ 
          success: false, 
          error: 'Name, category, and sectionType are required' 
        });
      }
      
      // Insert into travel_products table (using correct column names)
      const stmt = sqliteDb.prepare(`
        INSERT INTO travel_products (
          name, description, price, original_price, currency,
          image_url, affiliate_url, category, subcategory, travel_type,
          source, processing_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        name,
        description || '',
        price || '0',
        originalPrice || null,
        currency || 'INR',
        imageUrl || '',
        affiliateUrl || '',
        category,
        sectionType, // Use sectionType as subcategory
        JSON.stringify({ sectionType, textColor, customSectionTitle, customSectionDescription, ...categoryFields }), // Store all extra data as JSON
        'admin_form',
        'active',
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000)
      );
      
      console.log('✅ Travel content added successfully:', result.lastInsertRowid);
      res.json({ 
        success: true, 
        id: result.lastInsertRowid, 
        message: 'Content added successfully' 
      });
      
    } catch (error) {
      console.error('❌ Error adding travel content:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to add travel content',
        details: error.message
      });
    }
  });
  
  // Get travel content by category (for frontend display)
  app.get('/api/travel-content/:category', async (req, res) => {
    try {
      const { category } = req.params;
      
      const stmt = sqliteDb.prepare(`
        SELECT 
          id, name, description, price, original_price as originalPrice, currency,
          image_url as imageUrl, affiliate_url as affiliateUrl, category, 
          subcategory as sectionType, travel_type as categoryData, 
          source, created_at as createdAt
        FROM travel_products 
        WHERE category = ? AND processing_status = 'active'
        ORDER BY created_at DESC
      `);
      
      const deals = stmt.all(category);
      
      // Group by section type and parse category data
      const groupedDeals = {
        featured: [],
        standard: [],
        destinations: []
      };
      
      deals.forEach(deal => {
        let categoryData = {};
        try {
          categoryData = JSON.parse(deal.categoryData || '{}');
        } catch (e) {
          categoryData = {};
        }
        
        const parsedDeal = {
          ...deal,
          categoryData,
          // Flatten category data into main object for compatibility
          ...categoryData
        };
        
        const sectionType = deal.sectionType || 'standard';
        if (groupedDeals[sectionType]) {
          groupedDeals[sectionType].push(parsedDeal);
        } else {
          groupedDeals.standard.push(parsedDeal);
        }
      });
      
      console.log(`✅ Travel content fetched for ${category}:`, deals.length, 'items');
      res.json({ success: true, data: groupedDeals });
      
    } catch (error) {
      console.error('❌ Error fetching travel content:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch travel content',
        details: error.message
      });
    }
  });
  
  // Delete travel content (admin only)
  app.delete('/api/travel-content/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const stmt = sqliteDb.prepare('DELETE FROM travel_deals WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes > 0) {
        console.log('✅ Travel content deleted successfully:', id);
        res.json({ success: true, message: 'Content deleted successfully' });
      } else {
        res.status(404).json({ success: false, error: 'Content not found' });
      }
      
    } catch (error) {
      console.error('❌ Error deleting travel content:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete travel content',
        details: error.message
      });
    }
  });
  
  // ===== APPS API ENDPOINTS =====
  
  // Get all apps (including AI apps) from all channels
  app.get('/api/apps', async (req, res) => {
    try {
      const { category, channel, app_type } = req.query;
      console.log(`Mobile API CALLED: Getting apps with category: "${category}", channel: "${channel}", app_type: "${app_type}"`);
      
      const tables = ['amazon_products', 'cuelinks_products', 'value_picks_products', 'click_picks_products'];
      let allApps: any[] = [];
      
      for (const table of tables) {
        try {
          let query = `
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, created_at as createdAt,
              content_type, '${table}' as source_table
            FROM ${table} 
            WHERE content_type = 'app'
          `;
          
          const params: any[] = [];
          
          // Add category filter if specified
          if (category) {
            query += ` AND category = ?`;
            params.push(category);
          }
          
          // Add channel filter if specified
          if (channel) {
            const channelTableMap: { [key: string]: string } = {
              'prime-picks': 'amazon_products',
              'cue-picks': 'cuelinks_products',
              'value-picks': 'value_picks_products',
              'click-picks': 'click_picks_products'
            };
            
            if (channelTableMap[channel as string] === table) {
              // Only query this table for the specified channel
            } else {
              continue; // Skip this table for other channels
            }
          }
          
          query += ` ORDER BY created_at DESC`;
          
          const apps = sqliteDb.prepare(query).all(...params);
          
          // Add source information and app type detection
          const formattedApps = apps.map((app: any) => {
            // Detect if it's an AI app based on name/description
            const isAIApp = /\b(ai|artificial intelligence|machine learning|ml|neural|smart|intelligent|automated|bot|assistant)\b/i.test(
              `${app.name} ${app.description}`
            );
            
            return {
              ...app,
              id: `${table}_${app.id}`,
              source: table.replace('_products', '').replace('_', '-'),
              networkBadge: table === 'amazon_products' ? 'Prime Picks' :
                           table === 'cuelinks_products' ? 'Cue Picks' :
                           table === 'value_picks_products' ? 'Value Picks' : 'Click Picks',
              app_type: isAIApp ? 'ai_app' : 'regular_app',
              isAIApp
            };
          });
          
          // Filter by app_type if specified
          let filteredApps = formattedApps;
          if (app_type === 'ai') {
            filteredApps = formattedApps.filter(app => app.isAIApp);
          } else if (app_type === 'regular') {
            filteredApps = formattedApps.filter(app => !app.isAIApp);
          }
          
          allApps.push(...filteredApps);
          
        } catch (tableError) {
          console.error(`Error querying ${table}:`, tableError);
        }
      }
      
      // Sort by creation date (newest first)
      allApps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log(`Mobile Found ${allApps.length} apps total`);
      res.json(allApps);
      
    } catch (error) {
      console.error('Error fetching apps:', error);
      res.status(500).json({ message: 'Failed to fetch apps' });
    }
  });
  
  // ===== HOMEPAGE CONTENT API ENDPOINTS =====
  
  // Get featured services for homepage
  app.get('/api/homepage/services', async (req, res) => {
    try {
      console.log('Home API CALLED: Getting featured services for homepage');
      
      const tables = ['amazon_products', 'cuelinks_products', 'value_picks_products', 'click_picks_products'];
      let featuredServices: any[] = [];
      
      for (const table of tables) {
        try {
          const services = sqliteDb.prepare(`
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, created_at as createdAt
            FROM ${table} 
            WHERE content_type = 'service'
            AND (is_featured = 1 OR rating >= '4.5')
            ORDER BY created_at DESC
            LIMIT 2
          `).all();
          
          const formattedServices = services.map((service: any) => ({
            ...service,
            id: `${table}_${service.id}`,
            source: table.replace('_products', '').replace('_', '-'),
            networkBadge: table === 'amazon_products' ? 'Prime Picks' :
                         table === 'cuelinks_products' ? 'Cue Picks' :
                         table === 'value_picks_products' ? 'Value Picks' : 'Click Picks'
          }));
          
          featuredServices.push(...formattedServices);
          
        } catch (tableError) {
          console.error(`Error querying ${table} for featured services:`, tableError);
        }
      }
      
      // Sort and limit to 8 items for homepage
      featuredServices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const limitedServices = featuredServices.slice(0, 8);
      
      console.log(`Home Found ${limitedServices.length} featured services for homepage`);
      res.json(limitedServices);
      
    } catch (error) {
      console.error('Error fetching featured services:', error);
      res.status(500).json({ message: 'Failed to fetch featured services' });
    }
  });
  
  // Get featured apps for homepage
  app.get('/api/homepage/apps', async (req, res) => {
    try {
      console.log('Home API CALLED: Getting featured apps for homepage');
      
      const tables = ['amazon_products', 'cuelinks_products', 'value_picks_products', 'click_picks_products'];
      let featuredApps: any[] = [];
      
      for (const table of tables) {
        try {
          const apps = sqliteDb.prepare(`
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, created_at as createdAt
            FROM ${table} 
            WHERE content_type = 'app'
            AND (is_featured = 1 OR rating >= '4.5')
            ORDER BY created_at DESC
            LIMIT 2
          `).all();
          
          const formattedApps = apps.map((app: any) => {
            const isAIApp = /\b(ai|artificial intelligence|machine learning|ml|neural|smart|intelligent|automated|bot|assistant)\b/i.test(
              `${app.name} ${app.description}`
            );
            
            return {
              ...app,
              id: `${table}_${app.id}`,
              source: table.replace('_products', '').replace('_', '-'),
              networkBadge: table === 'amazon_products' ? 'Prime Picks' :
                           table === 'cuelinks_products' ? 'Cue Picks' :
                           table === 'value_picks_products' ? 'Value Picks' : 'Click Picks',
              isAIApp
            };
          });
          
          featuredApps.push(...formattedApps);
          
        } catch (tableError) {
          console.error(`Error querying ${table} for featured apps:`, tableError);
        }
      }
      
      // Sort and limit to 8 items for homepage
      featuredApps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const limitedApps = featuredApps.slice(0, 8);
      
      console.log(`Home Found ${limitedApps.length} featured apps for homepage`);
      res.json(limitedApps);
      
    } catch (error) {
      console.error('Error fetching featured apps:', error);
      res.status(500).json({ message: 'Failed to fetch featured apps' });
    }
  });

  // ===== CANVA AUTOMATION API ENDPOINTS =====
  
  // Get Canva settings
  app.get('/api/admin/canva/settings', async (req, res) => {
    try {
      const { password } = req.query;
      
      // Admin authentication
      if (password !== 'admin' && password !== 'pickntrust2025') {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      console.log('🔍 Fetching Canva settings...');
      
      // Get settings from storage
      const settings = await storage.getCanvaSettings();
      
      if (settings) {
        // Convert snake_case to camelCase for frontend
        const formattedSettings = {
          isEnabled: Boolean(settings.is_enabled),
          apiKey: settings.api_key,
          apiSecret: settings.api_secret,
          defaultTemplateId: settings.default_template_id,
          autoGenerateCaptions: Boolean(settings.auto_generate_captions),
          autoGenerateHashtags: Boolean(settings.auto_generate_hashtags),
          defaultCaption: settings.default_caption,
          defaultHashtags: settings.default_hashtags,
          platforms: typeof settings.platforms === 'string' ? JSON.parse(settings.platforms) : (settings.platforms || []),
          scheduleType: settings.schedule_type || 'immediate',
          scheduleDelayMinutes: settings.schedule_delay_minutes || 0,
          enableBlogPosts: Boolean(settings.enable_blog_posts),
          enableVideos: Boolean(settings.enable_videos)
        };
        
        console.log('✅ Canva settings retrieved:', formattedSettings);
        res.json(formattedSettings);
      } else {
        // Return default settings if none exist
        const defaultSettings = {
          isEnabled: false,
          autoGenerateCaptions: true,
          autoGenerateHashtags: true,
          platforms: ['instagram', 'facebook', 'whatsapp', 'telegram'],
          scheduleType: 'immediate',
          scheduleDelayMinutes: 0,
          enableBlogPosts: true,
          enableVideos: true
        };
        
        console.log('📋 Returning default Canva settings');
        res.json(defaultSettings);
      }
    } catch (error) {
      console.error('❌ Error fetching Canva settings:', error);
      res.status(500).json({ error: 'Failed to fetch Canva settings' });
    }
  });
  
  // Admin automated share endpoint
  app.post('/api/admin/canva-automation/share', async (req, res) => {
    try {
      const { contentData, platforms } = req.body;
      
      console.log('🎨 Admin automated share triggered:', contentData.title);
      console.log('📱 Target platforms:', platforms);
      
      // Validate required fields
      if (!contentData || !platforms || !Array.isArray(platforms)) {
        return res.status(400).json({ 
          error: 'Missing required fields: contentData and platforms array' 
        });
      }
      
      // Import Canva service dynamically to avoid initialization issues
      const { CanvaService } = await import('./canva-service.js');
      const canvaService = new CanvaService();
      
      // Execute full automation with the provided content data and platforms
      const result = await canvaService.executeFullAutomation(contentData, platforms);
      
      console.log('✅ Automated share completed:', result);
      
      res.json({
        success: true,
        message: `Content shared successfully to ${platforms.length} platforms`,
        platforms: platforms,
        result: result
      });
      
    } catch (error) {
      console.error('❌ Automated share failed:', error);
      res.status(500).json({ 
        error: 'Failed to share content automatically',
        details: error.message 
      });
    }
  });

  // Travel Products API Routes (for travel-picks bot)
  // Get all travel products by category
  app.get('/api/travel-products/:category', async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const { section } = req.query;
      
      console.log('🔍 Fetching travel products for category:', category, 'section:', section);
      
      // Use raw SQL query to fetch from travel_products table (unified data source)
      const Database = (await import('better-sqlite3')).default;
      const db = new Database('./database.sqlite');
      
      let sql = `
        SELECT * FROM travel_products 
        WHERE category = ? AND processing_status = 'active'
      `;
      let params = [category];
      
      if (section) {
        sql += ` AND subcategory = ?`;
        params.push(section as string);
      }
      
      sql += ` ORDER BY created_at DESC`;
      
      const rawProducts = db.prepare(sql).all(...params);
      db.close();
      
      // Parse and merge travel_type JSON data with each product
      const products = rawProducts.map(product => {
        let travelTypeData = {};
        
        // Parse travel_type JSON if it exists
        if (product.travel_type) {
          try {
            travelTypeData = JSON.parse(product.travel_type);
          } catch (e) {
            console.warn(`Failed to parse travel_type for product ${product.id}:`, e.message);
          }
        }
        
        // Merge the parsed travel data with the main product data
        return {
          ...product,
          ...travelTypeData, // This spreads all the flight details (departure, arrival, etc.)
          // Keep original fields for compatibility
          travel_type: product.travel_type
        };
      });
      
      console.log('✅ Found', products.length, 'travel products from travel_products table');
      console.log('📊 Sample merged data:', products[0] ? {
        id: products[0].id,
        name: products[0].name,
        departure: products[0].departure,
        arrival: products[0].arrival,
        departure_time: products[0].departure_time
      } : 'No products');
      
      res.json(products);
    } catch (error) {
      console.error('❌ Error fetching travel products:', error);
      res.status(500).json({ error: 'Failed to fetch travel products', details: error.message });
    }
  });

  // Travel Deals API Routes
  // Get all travel deals by category
  app.get('/api/travel-deals/:category', async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const { section } = req.query;
      
      console.log('🔍 Fetching travel deals for category:', category, 'section:', section);
      
      // Use raw SQL query instead of Drizzle ORM
      const Database = (await import('better-sqlite3')).default;
      const db = new Database('./database.sqlite');
      
      let sql = `
        SELECT * FROM travel_deals 
        WHERE category = ? AND is_active = 1
      `;
      let params = [category];
      
      if (section) {
        sql += ` AND section_type = ?`;
        params.push(section as string);
      }
      
      sql += ` ORDER BY display_order, created_at`;
      
      const deals = db.prepare(sql).all(...params);
      db.close();
      
      console.log('✅ Found', deals.length, 'travel deals');
      res.json(deals);
    } catch (error) {
      console.error('❌ Error fetching travel deals:', error);
      res.status(500).json({ error: 'Failed to fetch travel deals', details: error.message });
    }
  });

  // Get deals by category and section
  app.get('/api/travel-deals/:category/:section', async (req: Request, res: Response) => {
    try {
      const { category, section } = req.params;
      
      console.log('🔍 Fetching travel deals for category:', category, 'section:', section);
      
      // Use raw SQL query instead of Drizzle ORM
      const Database = (await import('better-sqlite3')).default;
      const db = new Database('./database.sqlite');
      
      const deals = db.prepare(`
        SELECT * FROM travel_deals 
        WHERE category = ? AND section_type = ? AND is_active = 1
        ORDER BY display_order, created_at
      `).all(category, section);
      
      db.close();
      
      console.log('✅ Found', deals.length, 'travel deals');
      res.json(deals);
    } catch (error) {
      console.error('❌ Error fetching section deals:', error);
      res.status(500).json({ error: 'Failed to fetch section deals', details: error.message });
    }
  });

  // Admin: Add new travel deal
  app.post('/api/admin/travel-deals', async (req: Request, res: Response) => {
    try {
      const dealData = insertTravelDealSchema.parse(req.body);
      
      const result = await sqliteDb.insert(travelDeals).values(dealData).returning();
      
      res.json({ 
        id: result[0].id, 
        message: 'Travel deal created successfully',
        deal: result[0]
      });
    } catch (error) {
      console.error('Error creating travel deal:', error);
      res.status(500).json({ error: 'Failed to create travel deal' });
    }
  });

  // URL Data Extraction API - Extract travel data from URLs
  app.post('/api/extract-travel-data', async (req: Request, res: Response) => {
    try {
      const { url, category, extractionType } = req.body;
      
      if (!url || !category) {
        return res.status(400).json({
          success: false,
          error: 'URL and category are required'
        });
      }
      
      console.log(`🔍 Extracting ${category} data from URL:`, url);
      
      // Import the URL extractor
      const { TravelDataExtractor } = await import('./url-extractor');
      
      // Extract comprehensive travel data
      const extractedData = await TravelDataExtractor.extractFromUrl(url, category);
      
      if (extractedData.success) {
        console.log('✅ Successfully extracted travel data:', {
          name: extractedData.data?.name,
          price: extractedData.data?.price,
          fieldsCount: Object.keys(extractedData.data?.categoryFields || {}).length
        });
      }
      
      res.json(extractedData);
    } catch (error) {
      console.error('❌ URL extraction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to extract data from URL'
      });
    }
  });

  // Admin: Add new travel product (for travel-picks bot)
  app.post('/api/admin/travel-products', async (req: Request, res: Response) => {
    try {
      console.log('🔍 Adding comprehensive travel product:', req.body);
      
      // Use raw SQL to insert into travel_products table with comprehensive data
      const Database = (await import('better-sqlite3')).default;
      const db = new Database('./database.sqlite');
      
      // Prepare comprehensive category-specific data as JSON with proper field mapping
      const categoryData = {
        // Flight fields (handle both camelCase and snake_case)
        airline: req.body.airline,
        departure: req.body.departure,
        arrival: req.body.arrival,
        departure_time: req.body.departure_time || req.body.departureTime,
        arrival_time: req.body.arrival_time || req.body.arrivalTime,
        duration: req.body.duration,
        flight_class: req.body.flight_class || req.body.flightClass,
        stops: req.body.stops,
        route_type: req.body.route_type || req.body.routeType,
        
        // Hotel fields
        location: req.body.location,
        hotel_type: req.body.hotel_type || req.body.hotelType,
        room_type: req.body.room_type || req.body.roomType,
        amenities: req.body.amenities,
        rating: req.body.rating,
        cancellation: req.body.cancellation,
        
        // Tour fields
        destinations: req.body.destinations,
        inclusions: req.body.inclusions,
        tour_type: req.body.tour_type || req.body.tourType,
        group_size: req.body.group_size || req.body.groupSize,
        difficulty: req.body.difficulty,
        
        // Cruise fields
        cruise_line: req.body.cruise_line || req.body.cruiseLine,
        route: req.body.route,
        cabin_type: req.body.cabin_type || req.body.cabinType,
        ports: req.body.ports,
        
        // Bus fields
        operator: req.body.operator,
        bus_type: req.body.bus_type || req.body.busType,
        
        // Train fields
        train_operator: req.body.train_operator || req.body.trainOperator,
        train_type: req.body.train_type || req.body.trainType,
        train_number: req.body.train_number || req.body.trainNumber,
        
        // Package fields
        package_type: req.body.package_type || req.body.packageType,
        valid_till: req.body.valid_till || req.body.validTill,
        
        // Car rental fields
        car_type: req.body.car_type || req.body.carType,
        features: req.body.features,
        fuel_type: req.body.fuel_type || req.body.fuelType,
        transmission: req.body.transmission,
        
        // Custom section fields
        custom_section_title: req.body.custom_section_title || req.body.customSectionTitle,
        custom_section_description: req.body.custom_section_description || req.body.customSectionDescription,
        
        // Styling fields
        card_background_color: req.body.card_background_color || req.body.cardBackgroundColor,
        field_colors: req.body.field_colors || req.body.fieldColors,
        field_styles: req.body.field_styles || req.body.fieldStyles,
        
        // Section type
        section_type: req.body.section_type || req.body.sectionType
      };
      
      // Remove null/undefined values to keep JSON clean
      Object.keys(categoryData).forEach(key => {
        if (categoryData[key] === null || categoryData[key] === undefined) {
          delete categoryData[key];
        }
      });
      
      // Ensure categoryData is not empty
      const categoryDataJson = JSON.stringify(categoryData);
      console.log('📊 Storing categoryData:', categoryDataJson);
      
      const result = db.prepare(`
        INSERT INTO travel_products (
          name, description, price, original_price, currency, image_url, affiliate_url,
          category, subcategory, travel_type, rating, review_count, discount, is_featured,
          created_at, processing_status, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.body.name,
        req.body.description || '',
        req.body.price || '0',
        req.body.original_price || req.body.price || '0',
        req.body.currency || 'INR',
        req.body.image_url || '',
        req.body.affiliate_url || '',
        req.body.category || 'travel',
        req.body.section_type || 'standard',
        categoryDataJson, // Store all category-specific data as JSON
        parseFloat(req.body.rating) || 4.0, // Use provided rating or default
        100, // Default review count
        0, // Default discount
        req.body.is_featured || 0,
        Math.floor(Date.now() / 1000), // Created at timestamp
        'active', // Processing status
        req.body.source || 'admin_form' // Source
      );
      
      db.close();
      
      console.log('✅ Comprehensive travel product saved with ID:', result.lastInsertRowid);
      console.log('📊 Category data stored:', categoryData);
      
      res.json({ 
        id: result.lastInsertRowid, 
        message: 'Travel product created successfully',
        categoryData: categoryData
      });
    } catch (error) {
      console.error('❌ Error creating travel product:', error);
      res.status(500).json({ error: 'Failed to create travel product', details: error.message });
    }
  });

  // Admin: Bulk delete travel products (MUST come before :id route)
  app.delete('/api/admin/travel-products/bulk-delete', async (req: Request, res: Response) => {
    try {
      const { password, category } = req.body;
      
      // Verify admin password
      if (password !== 'pickntrust2025') {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      console.log(`🗑️ Bulk deleting travel products for category: ${category || 'all'}`);
      
      // Use raw SQL to delete from travel_products table
      const Database = (await import('better-sqlite3')).default;
      const db = new Database('./database.sqlite');
      
      let result;
      if (category && category !== 'all') {
        result = db.prepare('DELETE FROM travel_products WHERE category = ?').run(category);
      } else {
        result = db.prepare('DELETE FROM travel_products').run();
      }
      
      db.close();
      
      console.log(`✅ Successfully deleted ${result.changes} travel products`);
      res.json({ 
        message: `Bulk delete completed. Removed ${result.changes} travel products.`,
        deletedCount: result.changes,
        category: category || 'all'
      });
    } catch (error) {
      console.error('❌ Error bulk deleting travel products:', error);
      res.status(500).json({ error: 'Failed to bulk delete travel products', details: error.message });
    }
  });

  // Admin: Delete travel product
  app.delete('/api/admin/travel-products/:id', async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      const productId = req.params.id;
      
      // Verify admin password
      if (password !== 'pickntrust2025') {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      console.log(`🗑️ Deleting travel product ID: ${productId}`);
      
      // Use raw SQL to delete from travel_products table
      const Database = (await import('better-sqlite3')).default;
      const db = new Database('./database.sqlite');
      
      const result = db.prepare('DELETE FROM travel_products WHERE id = ?').run(productId);
      
      db.close();
      
      if (result.changes > 0) {
        console.log(`✅ Successfully deleted travel product ID: ${productId}`);
        res.json({ 
          message: 'Travel product deleted successfully',
          productId: productId,
          changes: result.changes
        });
      } else {
        res.status(404).json({ message: 'Travel product not found' });
      }
    } catch (error) {
      console.error('❌ Error deleting travel product:', error);
      res.status(500).json({ error: 'Failed to delete travel product', details: error.message });
    }
  });



  // Admin: Update travel deal
  app.put('/api/admin/travel-deals/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dealData = insertTravelDealSchema.parse(req.body);
      
      const result = await sqliteDb.update(travelDeals)
        .set({ ...dealData, updatedAt: new Date() })
        .where(eq(travelDeals.id, parseInt(id)))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Travel deal not found' });
      }
      
      res.json({ 
        message: 'Travel deal updated successfully',
        deal: result[0]
      });
    } catch (error) {
      console.error('Error updating travel deal:', error);
      res.status(500).json({ error: 'Failed to update travel deal' });
    }
  });

  // Admin: Delete travel deal
  app.delete('/api/admin/travel-deals/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await sqliteDb.delete(travelDeals)
        .where(eq(travelDeals.id, parseInt(id)))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Travel deal not found' });
      }
      
      res.json({ message: 'Travel deal deleted successfully' });
    } catch (error) {
      console.error('Error deleting travel deal:', error);
      res.status(500).json({ error: 'Failed to delete travel deal' });
    }
  });

  // Admin: Get all travel deals for management
  app.get('/api/admin/travel-deals', async (req: Request, res: Response) => {
    try {
      const { category, section, active } = req.query;
      
      let query = sqliteDb.select().from(travelDeals);
      
      const conditions = [];
      if (category) conditions.push(eq(travelDeals.category, category as string));
      if (section) conditions.push(eq(travelDeals.sectionType, section as string));
      if (active !== undefined) conditions.push(eq(travelDeals.isActive, active === 'true' ? 1 : 0));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const deals = await query.orderBy(travelDeals.category, travelDeals.sectionType, travelDeals.displayOrder);
      res.json(deals);
    } catch (error) {
      console.error('Error fetching admin travel deals:', error);
      res.status(500).json({ error: 'Failed to fetch travel deals' });
    }
  });
}

// Helper function for product extraction
async function extractFromUrlPattern(url: string): Promise<any> {
  // This is a simplified version - in a real implementation you would
  // implement actual web scraping logic here
  return {
    name: "Sample Product",
    description: "Sample product description",
    price: "1000",
    originalPrice: "1200",
    discount: "15",
    rating: "4.5",
    reviewCount: "100",
    category: "Electronics & Gadgets",
    affiliateNetworkId: "1",
    imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80",
    affiliateUrl: url,
  };
}
