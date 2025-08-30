import GoogleSheetsService from './google-sheets-service';
import { WebsiteCrawlerService } from './website-crawler-service';
import AffiliateEngine from './affiliate-engine';

interface CrawlConfig {
  domain: string;
  crawlType: 'sitemap' | 'category' | 'search' | 'auto';
  categoryFilter?: string;
  maxProducts: number;
  searchKeywords?: string[];
  crawlFrequency: 'daily' | 'weekly' | 'monthly';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'crawling' | 'completed' | 'failed';
  lastCrawled?: string;
  productsFound?: number;
  nextCrawl?: string;
}

interface ProcessedCrawlProduct {
  original_url: string;
  affiliate_url: string;
  merchant_domain: string;
  category_norm: string;
  title: string;
  description: string;
  price: string;
  image_url: string;
  best_network?: {
    network: string;
    rate_value: string;
    cookie_days: number;
    priority: number;
  };
  posted_at: string;
  expires_at: string;
  status: string;
  tags: string;
  crawl_source: string;
}

export class WebsiteCrawlAutomation {
  private sheetsService: GoogleSheetsService;
  private crawlerService: WebsiteCrawlerService;
  private affiliateEngine: AffiliateEngine;
  private isRunning = false;

  constructor(
    sheetsService: GoogleSheetsService,
    affiliateEngine: AffiliateEngine
  ) {
    this.sheetsService = sheetsService;
    this.crawlerService = new WebsiteCrawlerService();
    this.affiliateEngine = affiliateEngine;
    
    console.log('🕷️ Website Crawl Automation initialized');
  }

  // Main crawl automation process
  async runCrawlAutomation(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Crawl automation already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting website crawl automation...');

    try {
      // Get crawl configurations from Google Sheets
      const crawlConfigs = await this.getCrawlConfigurations();
      
      if (crawlConfigs.length === 0) {
        console.log('📭 No websites configured for crawling');
        return;
      }

      console.log(`🎯 Found ${crawlConfigs.length} websites to crawl`);

      const allProcessedProducts: ProcessedCrawlProduct[] = [];

      // Process each website
      for (const config of crawlConfigs) {
        try {
          console.log(`\n🕷️ Crawling ${config.domain}...`);
          
          // Update status to crawling
          await this.updateCrawlStatus(config.domain, 'crawling');

          // Perform the crawl
          const crawlResult = await this.crawlerService.crawlWebsite(config.domain, {
            maxProducts: config.maxProducts,
            categoryFilter: config.categoryFilter,
            crawlType: config.crawlType,
            searchKeywords: config.searchKeywords
          });

          if (crawlResult.success && crawlResult.productsFound.length > 0) {
            console.log(`✅ Found ${crawlResult.productsFound.length} products from ${config.domain}`);

            // Process products through affiliate engine
            const processedProducts = await this.processDiscoveredProducts(
              crawlResult.productsFound,
              config.domain
            );

            allProcessedProducts.push(...processedProducts);

            // Update crawl status
            await this.updateCrawlStatus(config.domain, 'completed', {
              productsFound: crawlResult.productsFound.length,
              lastCrawled: new Date().toISOString(),
              nextCrawl: this.calculateNextCrawl(config.crawlFrequency)
            });

          } else {
            console.log(`⚠️ No products found from ${config.domain}`);
            await this.updateCrawlStatus(config.domain, 'completed', {
              productsFound: 0,
              lastCrawled: new Date().toISOString(),
              nextCrawl: this.calculateNextCrawl(config.crawlFrequency)
            });
          }

        } catch (error) {
          console.error(`❌ Error crawling ${config.domain}:`, error);
          await this.updateCrawlStatus(config.domain, 'failed');
        }

        // Delay between websites to be respectful
        await this.delay(2000);
      }

      // Write all processed products to products_live sheet
      if (allProcessedProducts.length > 0) {
        await this.sheetsService.writeProductsLive(allProcessedProducts);
        console.log(`📤 Published ${allProcessedProducts.length} products to products_live`);
      }

      console.log('✅ Website crawl automation completed successfully');

    } catch (error) {
      console.error('❌ Website crawl automation failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Get crawl configurations from enhanced url_inbox sheet
  private async getCrawlConfigurations(): Promise<CrawlConfig[]> {
    try {
      const response = await this.sheetsService.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetsService.spreadsheetId,
        range: 'url_inbox!A2:L1000', // Extended range for crawl config
      });

      const rows = response.data.values || [];
      const configs: CrawlConfig[] = [];

      for (const row of rows) {
        if (row[0] && this.isDomainInput(row[0])) {
          // Check if it's time to crawl this domain
          const config: CrawlConfig = {
            domain: this.normalizeDomain(row[0]), // Column A: domain
            crawlType: (row[1] as any) || 'auto', // Column B: crawl_type
            categoryFilter: row[2] || undefined, // Column C: category_filter
            maxProducts: parseInt(row[3]) || 50, // Column D: max_products
            searchKeywords: row[4] ? row[4].split(',').map((k: string) => k.trim()) : [], // Column E: search_keywords
            crawlFrequency: (row[5] as any) || 'weekly', // Column F: crawl_frequency
            priority: (row[6] as any) || 'medium', // Column G: priority
            status: (row[7] as any) || 'pending', // Column H: status
            lastCrawled: row[8] || undefined, // Column I: last_crawled
            productsFound: parseInt(row[9]) || 0, // Column J: products_found
            nextCrawl: row[10] || undefined, // Column K: next_crawl
          };

          // Only crawl if it's time (or never crawled)
          if (this.shouldCrawlNow(config)) {
            configs.push(config);
          }
        }
      }

      // Sort by priority
      return configs.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    } catch (error) {
      console.error('❌ Error reading crawl configurations:', error);
      return [];
    }
  }

  // Process discovered products through affiliate engine
  private async processDiscoveredProducts(
    discoveredProducts: any[],
    sourceDomain: string
  ): Promise<ProcessedCrawlProduct[]> {
    const processedProducts: ProcessedCrawlProduct[] = [];

    for (const product of discoveredProducts) {
      try {
        // Process through affiliate engine
        const affiliateResult = this.affiliateEngine.processProduct(
          product.url,
          product.category || 'general'
        );

        if (affiliateResult.affiliateUrl) {
          const processedProduct: ProcessedCrawlProduct = {
            original_url: product.url,
            affiliate_url: affiliateResult.affiliateUrl,
            merchant_domain: sourceDomain,
            category_norm: this.normalizeCategory(product.category || 'general'),
            title: product.title || 'Discovered Product',
            description: product.description || `Product from ${sourceDomain}`,
            price: product.price || '0',
            image_url: product.imageUrl || '',
            best_network: {
              network: affiliateResult.selectedRule?.affiliate_program || 'direct',
              rate_value: affiliateResult.selectedRule?.commission_rate || '0%',
              cookie_days: affiliateResult.selectedRule?.cookie_days || 30,
              priority: affiliateResult.selectedRule?.priority || 1
            },
            posted_at: new Date().toISOString(),
            expires_at: this.calculateExpiryDate(affiliateResult.selectedRule?.cookie_days || 30),
            status: 'live',
            tags: this.generateTags(product, sourceDomain),
            crawl_source: `crawl:${sourceDomain}`
          };

          processedProducts.push(processedProduct);
        }

      } catch (error) {
        console.error(`❌ Error processing product ${product.url}:`, error);
      }
    }

    return processedProducts;
  }

  // Update crawl status in Google Sheets
  private async updateCrawlStatus(
    domain: string,
    status: string,
    additionalData?: Partial<CrawlConfig>
  ): Promise<void> {
    try {
      // This would update the specific row for the domain
      // For now, we'll log it (full implementation would require finding the row)
      console.log(`📝 Crawl status update: ${domain} → ${status}`, additionalData);
      
      // In a full implementation, you would:
      // 1. Find the row index for the domain
      // 2. Update the status column and other fields
      // 3. Use sheets.spreadsheets.values.update to write the changes
      
    } catch (error) {
      console.error('❌ Error updating crawl status:', error);
    }
  }

  // Helper methods
  private isDomainInput(input: string): boolean {
    // Check if input is a domain (not a full product URL)
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    const cleanInput = input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    return domainPattern.test(cleanInput) && !input.includes('/product') && !input.includes('/item');
  }

  private normalizeDomain(domain: string): string {
    return domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }

  private shouldCrawlNow(config: CrawlConfig): boolean {
    if (!config.lastCrawled) return true; // Never crawled
    if (config.status === 'pending') return true; // Explicitly pending
    
    if (config.nextCrawl) {
      const nextCrawlDate = new Date(config.nextCrawl);
      return new Date() >= nextCrawlDate;
    }
    
    return false;
  }

  private calculateNextCrawl(frequency: string): string {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      default:
        now.setDate(now.getDate() + 7); // Default to weekly
    }
    
    return now.toISOString();
  }

  private normalizeCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'electronics': 'electronics',
      'fashion': 'fashion',
      'home': 'home',
      'books': 'books',
      'sports': 'sports',
      'beauty': 'beauty',
      'toys': 'toys',
      'automotive': 'automotive'
    };
    
    const normalized = category.toLowerCase();
    return categoryMap[normalized] || 'general';
  }

  private calculateExpiryDate(cookieDays: number): string {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + cookieDays);
    return expiryDate.toISOString();
  }

  private generateTags(product: any, sourceDomain: string): string {
    const tags = ['crawled', sourceDomain];
    
    if (product.category) {
      tags.push(product.category.toLowerCase());
    }
    
    if (product.price) {
      const price = parseFloat(product.price.replace(/[^0-9.]/g, ''));
      if (price < 500) tags.push('budget');
      else if (price > 5000) tags.push('premium');
    }
    
    if (product.rating && product.rating >= 4) {
      tags.push('highly-rated');
    }
    
    return tags.join(',');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Manual crawl trigger for specific domain
  async crawlSpecificDomain(domain: string, options: any = {}): Promise<any> {
    console.log(`🎯 Manual crawl triggered for ${domain}`);
    
    try {
      const crawlResult = await this.crawlerService.crawlWebsite(domain, {
        maxProducts: options.maxProducts || 20,
        categoryFilter: options.categoryFilter,
        crawlType: options.crawlType || 'auto'
      });

      if (crawlResult.success) {
        const processedProducts = await this.processDiscoveredProducts(
          crawlResult.productsFound,
          domain
        );

        if (processedProducts.length > 0) {
          await this.sheetsService.writeProductsLive(processedProducts);
        }

        return {
          success: true,
          productsFound: crawlResult.productsFound.length,
          productsProcessed: processedProducts.length,
          domain
        };
      }

      return {
        success: false,
        error: 'Crawl failed',
        domain
      };

    } catch (error) {
      console.error(`❌ Manual crawl failed for ${domain}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        domain
      };
    }
  }
}