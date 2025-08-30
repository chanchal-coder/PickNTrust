import GoogleSheetsService from './google-sheets-service';
import AffiliateEngine from './affiliate-engine';
import { WebsiteCrawlAutomation } from './website-crawl-automation';

interface ProductInbox {
  product_url: string;
  title: string;
  category: string;
  image_url: string;
  description: string;
  tags: string;
  processing_status: string;
  updated_at: string;
}

interface AffiliateConfig {
  amazon: { tag: string };
  earnkaro: { id: string };
  cuelinks: { id: string };
  lemonsqueezy: { code: string };
}
import { triggerCanvaForProduct } from './canva-triggers';
import { db } from './db';
import { products, categories } from '../shared/schema';
import { eq } from 'drizzle-orm';

interface AutomationConfig {
  spreadsheetId: string;
  affiliateConfig: AffiliateConfig;
  syncIntervalMinutes: number;
  enableSocialPosting: boolean;
  enableCanvaGeneration: boolean;
}

class AffiliateAutomationService {
  private sheetsService: GoogleSheetsService;
  private affiliateEngine: AffiliateEngine;
  private websiteCrawlAutomation: WebsiteCrawlAutomation;
  private config: AutomationConfig;
  private isRunning: boolean = false;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(config: AutomationConfig) {
    this.config = config;
    this.sheetsService = new GoogleSheetsService(config.spreadsheetId);
    this.affiliateEngine = new AffiliateEngine(config.affiliateConfig);
    this.websiteCrawlAutomation = new WebsiteCrawlAutomation(
      this.sheetsService,
      this.affiliateEngine
    );
  }

  // Initialize the automation service
  async initialize(): Promise<boolean> {
    try {
      console.log('🚀 Initializing Affiliate Automation Service...');
      
      // Initialize Google Sheets API
      const sheetsInitialized = await this.sheetsService.initialize();
      if (!sheetsInitialized) {
        throw new Error('Failed to initialize Google Sheets service');
      }

      // Load initial configuration
      await this.loadConfiguration();
      
      console.log('✅ Affiliate Automation Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Affiliate Automation Service:', error);
      return false;
    }
  }

  // Load all configuration from Google Sheets (6-sheet structure)
  private async loadConfiguration(): Promise<void> {
    try {
      // Load commission rules from commissions_config sheet
      const commissionRules = await this.sheetsService.getCommissionRules();
      
      // Load link building templates from link_rules sheet
      const linkRules = await this.sheetsService.getLinkRules();
      
      // Load Lemon Squeezy specific mappings from ls_affiliates sheet
      const lsAffiliates = await this.sheetsService.getLemonSqueezyAffiliates();
      
      // Load global settings from meta sheet
      const metaSettings = await this.sheetsService.getMetaSettings();
      
      // Update affiliate engine with configuration
      this.affiliateEngine.updateCommissionRules(commissionRules);
      this.affiliateEngine.updateLinkRules(linkRules);
      this.affiliateEngine.updateLemonSqueezyAffiliates(lsAffiliates);
      this.affiliateEngine.updateMetaSettings(metaSettings);
      
      console.log(`📋 Loaded configuration:`);
      console.log(`   - ${commissionRules.length} commission rules`);
      console.log(`   - ${linkRules.length} link building templates`);
      console.log(`   - ${lsAffiliates.length} Lemon Squeezy mappings`);
      console.log(`   - ${Object.keys(metaSettings).length} meta settings`);
    } catch (error) {
      console.error('❌ Error loading configuration:', error);
    }
  }

  // Process a single product
  private async processProduct(product: ProductInbox, index: number): Promise<boolean> {
    try {
      console.log(`🔄 Processing: ${product.title || product.product_url}`);
      
      // Skip if already processed
      if (product.processing_status === 'processed') {
        console.log('⏭️ Already processed, skipping');
        return true;
      }

      // Update status to processing
      await this.sheetsService.updateProductStatus(index, 'processing');

      // Generate affiliate link
      const processed = this.affiliateEngine.processProduct(product.product_url, product.category);
      
      if (processed.selectedProgram === 'none') {
        console.log(`⚠️ No affiliate program found: ${processed.reasoning}`);
        await this.sheetsService.updateProductStatus(index, 'no_affiliate', processed.originalUrl);
        return false;
      }

      // Determine target page based on category and tags
      const targetPage = this.determineTargetPage(product.category, product.tags || '', processed.merchantDomain);
      
      // Save to database
      const savedProduct = await this.saveProductToDatabase(product, processed, targetPage);
      
      if (!savedProduct) {
        await this.sheetsService.updateProductStatus(index, 'failed');
        return false;
      }

      // Generate Canva design if enabled
      if (this.config.enableCanvaGeneration) {
        try {
          await triggerCanvaForProduct(savedProduct);
          console.log('🎨 Canva design generation triggered');
        } catch (error) {
          console.error('⚠️ Canva generation failed:', error);
        }
      }

      // Update status to processed
      await this.sheetsService.updateProductStatus(index, 'processed', processed.affiliateUrl);
      
      console.log(`✅ Successfully processed: ${product.title}`);
      console.log(`💰 Program: ${processed.selectedProgram} (${processed.commissionRate})`);
      console.log(`🎯 Target: ${targetPage}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Error processing product:`, error);
      await this.sheetsService.updateProductStatus(index, 'failed');
      return false;
    }
  }

  // Determine target page based on category, tags, and merchant
  private determineTargetPage(category: string, tags: string, merchantDomain: string): string {
    const tagsList = tags.toLowerCase().split(',').map(t => t.trim());
    
    // DeoDap products go to lootbox page
    if (merchantDomain.includes('deodap')) {
      return 'lootbox';
    }
    
    // Viral/trending/featured products go to special sections
    if (tagsList.some(tag => ['viral', 'trending', 'featured'].includes(tag))) {
      if (category.toLowerCase().includes('app')) {
        return 'apps_featured';
      } else if (category.toLowerCase().includes('service')) {
        return 'services_featured';
      } else {
        return 'todays_top_picks';
      }
    }
    
    // Apps go to Apps & AI Apps section
    if (category.toLowerCase().includes('app') || category.toLowerCase().includes('ai')) {
      return 'apps_ai';
    }
    
    // Services go to Cards & Services section
    if (category.toLowerCase().includes('service') || category.toLowerCase().includes('card')) {
      return 'cards_services';
    }
    
    // Everything else goes to respective categories
    return `category_${category.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }

  // Save product to database
  private async saveProductToDatabase(product: ProductInbox, processed: ProcessedProduct, targetPage: string): Promise<any> {
    try {
      // Check if category exists, create if not
      let categoryId = await this.ensureCategoryExists(product.category);
      
      // Prepare product data
      const productData = {
        name: product.title || this.extractTitleFromUrl(product.product_url),
        description: product.description || `${processed.selectedProgram} affiliate product with ${processed.commissionRate} commission`,
        price: 0, // Will be updated later if available
        originalPrice: 0,
        image: product.image_url || '/placeholder-product.jpg',
        category: product.category,
        categoryId: categoryId,
        affiliateUrl: processed.affiliateUrl,
        originalUrl: processed.originalUrl,
        affiliateProgram: processed.selectedProgram,
        commissionRate: processed.commissionRate,
        merchantDomain: processed.merchantDomain,
        targetPage: targetPage,
        tags: product.tags || '',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Insert into database
      const result = await db.insert(products).values(productData).returning();
      
      if (result.length > 0) {
        console.log(`💾 Saved to database with ID: ${result[0].id}`);
        return result[0];
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error saving to database:', error);
      return null;
    }
  }

  // Ensure category exists in database
  private async ensureCategoryExists(categoryName: string): Promise<number> {
    try {
      // Check if category exists
      const existing = await db.select().from(categories).where(eq(categories.name, categoryName)).limit(1);
      
      if (existing.length > 0) {
        return existing[0].id;
      }
      
      // Create new category
      const result = await db.insert(categories).values({
        name: categoryName,
        slug: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: `Auto-generated category for ${categoryName} products`,
        displayOrder: 999,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).returning();
      
      console.log(`📁 Created new category: ${categoryName}`);
      return result[0].id;
    } catch (error) {
      console.error('❌ Error ensuring category exists:', error);
      return 1; // Default category ID
    }
  }

  // Extract title from URL as fallback
  private extractTitleFromUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split('/').filter(part => part.length > 0);
      
      // Get the last meaningful part of the path
      const lastPart = pathParts[pathParts.length - 1] || parsedUrl.hostname;
      
      // Clean up and format
      return lastPart
        .replace(/[-_]/g, ' ')
        .replace(/\.[^.]*$/, '') // Remove file extension
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch (error) {
      return 'Imported Product';
    }
  }

  // Main sync function - Complete workflow from url_inbox to products_live
  async syncProducts(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    
    try {
      console.log('🔄 Starting affiliate automation sync...');
      
      // Load latest configuration from all sheets
      await this.loadConfiguration();
      
      // First, run website crawling automation
      console.log('🕷️ Running website crawl automation...');
      await this.websiteCrawlAutomation.runCrawlAutomation();
      
      // Then process individual product URLs (legacy mode)
      const inboxProducts = await this.sheetsService.getInboxProducts();
      
      if (inboxProducts.length === 0) {
        console.log('📭 No individual product URLs found in url_inbox');
      } else {
        console.log(`📦 Processing ${inboxProducts.length} individual products from url_inbox...`);
        
        const processedProducts: any[] = [];
        let processed = 0;
        let failed = 0;
        
        // Process each product through the complete workflow
        for (let i = 0; i < inboxProducts.length; i++) {
          try {
            const processedProduct = await this.processProduct(inboxProducts[i], i);
            if (processedProduct) {
              processedProducts.push(processedProduct);
              processed++;
            } else {
              failed++;
            }
          } catch (error) {
            console.error(`❌ Error processing product ${inboxProducts[i].product_url}:`, error);
            // Update status to error in url_inbox
            await this.sheetsService.updateProductStatus(i, 'failed');
            failed++;
          }
          
          // Small delay between products to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Write all processed products to products_live sheet
        if (processedProducts.length > 0) {
          await this.sheetsService.writeProductsLive(processedProducts);
          console.log(`📤 Wrote ${processedProducts.length} individual products to products_live`);
        }
        
        console.log(`✅ Individual products sync completed: ${processed} processed, ${failed} failed`);
      }
      
      // Log stats
      const stats = this.affiliateEngine.getStats();
      console.log('📊 Affiliate Engine Stats:', stats);
      
    } catch (error) {
      console.error('❌ Error during sync:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Manual website crawl trigger
  async crawlWebsite(domain: string, options: any = {}): Promise<any> {
    try {
      console.log(`🎯 Manual website crawl requested for ${domain}`);
      
      // Load configuration first
      await this.loadConfiguration();
      
      // Trigger crawl
      const result = await this.websiteCrawlAutomation.crawlSpecificDomain(domain, options);
      
      console.log(`✅ Manual crawl completed for ${domain}:`, result);
      return result;
      
    } catch (error) {
      console.error(`❌ Manual crawl failed for ${domain}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        domain
      };
    }
  }

  // Start automatic syncing
  startAutoSync(): void {
    if (this.syncTimer) {
      console.log('⚠️ Auto-sync already running');
      return;
    }
    
    console.log(`🔄 Starting auto-sync every ${this.config.syncIntervalMinutes} minutes`);
    
    // Run initial sync
    this.syncProducts();
    
    // Set up recurring sync
    this.syncTimer = setInterval(() => {
      this.syncProducts();
    }, this.config.syncIntervalMinutes * 60 * 1000);
  }

  // Stop automatic syncing
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('⏹️ Auto-sync stopped');
    }
  }

  // Manual sync trigger
  async manualSync(): Promise<{ success: boolean; message: string }> {
    try {
      await this.syncProducts();
      return { success: true, message: 'Sync completed successfully' };
    } catch (error) {
      return { success: false, message: `Sync failed: ${error}` };
    }
  }

  // Get service status
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      autoSyncEnabled: this.syncTimer !== null,
      syncInterval: this.config.syncIntervalMinutes,
      affiliateStats: this.affiliateEngine.getStats(),
      config: {
        spreadsheetId: this.config.spreadsheetId,
        enableSocialPosting: this.config.enableSocialPosting,
        enableCanvaGeneration: this.config.enableCanvaGeneration
      }
    };
  }
}

export default AffiliateAutomationService;
export { AutomationConfig };