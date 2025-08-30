import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

interface CrawlOptions {
  maxProducts?: number;
  categoryFilter?: string;
  crawlType?: 'sitemap' | 'category' | 'search' | 'auto';
  searchKeywords?: string[];
}

interface DiscoveredProduct {
  url: string;
  title: string;
  price?: string;
  originalPrice?: string;
  imageUrl?: string;
  category?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  availability?: string;
  merchant: string;
}

interface CrawlResult {
  success: boolean;
  productsFound: DiscoveredProduct[];
  totalScanned: number;
  errors: string[];
  crawlType: string;
  domain: string;
}

export class WebsiteCrawlerService {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  private requestDelay = 1000; // 1 second between requests
  private maxRetries = 3;

  constructor() {
    console.log('🕷️ Website Crawler Service initialized');
  }

  // Main crawling method
  async crawlWebsite(domain: string, options: CrawlOptions = {}): Promise<CrawlResult> {
    const {
      maxProducts = 50,
      categoryFilter,
      crawlType = 'auto',
      searchKeywords = []
    } = options;

    console.log(`🕷️ Starting crawl of ${domain} (type: ${crawlType}, max: ${maxProducts})`);

    const result: CrawlResult = {
      success: false,
      productsFound: [],
      totalScanned: 0,
      errors: [],
      crawlType,
      domain
    };

    try {
      // Normalize domain
      const normalizedDomain = this.normalizeDomain(domain);
      
      // Choose crawling strategy
      let products: DiscoveredProduct[] = [];
      
      switch (crawlType) {
        case 'sitemap':
          products = await this.crawlFromSitemap(normalizedDomain, maxProducts);
          break;
        case 'category':
          products = await this.crawlFromCategories(normalizedDomain, maxProducts, categoryFilter);
          break;
        case 'search':
          products = await this.crawlFromSearch(normalizedDomain, searchKeywords, maxProducts);
          break;
        case 'auto':
        default:
          products = await this.autoCrawl(normalizedDomain, maxProducts, categoryFilter);
          break;
      }

      result.productsFound = products;
      result.totalScanned = products.length;
      result.success = true;

      console.log(`✅ Crawl completed: ${products.length} products found from ${domain}`);
      
    } catch (error) {
      console.error(`❌ Crawl failed for ${domain}:`, error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  // Auto-crawl strategy (tries multiple methods)
  private async autoCrawl(domain: string, maxProducts: number, categoryFilter?: string): Promise<DiscoveredProduct[]> {
    console.log(`🤖 Auto-crawling ${domain}...`);
    
    let allProducts: DiscoveredProduct[] = [];
    
    try {
      // Try sitemap first
      console.log('📋 Trying sitemap crawl...');
      const sitemapProducts = await this.crawlFromSitemap(domain, Math.floor(maxProducts * 0.6));
      allProducts.push(...sitemapProducts);
      
      if (allProducts.length < maxProducts) {
        // Try category crawl
        console.log('📂 Trying category crawl...');
        const categoryProducts = await this.crawlFromCategories(domain, maxProducts - allProducts.length, categoryFilter);
        allProducts.push(...categoryProducts);
      }
      
      if (allProducts.length < maxProducts) {
        // Try homepage and common paths
        console.log('🏠 Trying homepage crawl...');
        const homepageProducts = await this.crawlFromHomepage(domain, maxProducts - allProducts.length);
        allProducts.push(...homepageProducts);
      }
      
    } catch (error) {
      console.error('❌ Auto-crawl error:', error);
    }
    
    // Remove duplicates and limit results
    const uniqueProducts = this.removeDuplicates(allProducts);
    return uniqueProducts.slice(0, maxProducts);
  }

  // Crawl from sitemap.xml
  private async crawlFromSitemap(domain: string, maxProducts: number): Promise<DiscoveredProduct[]> {
    const products: DiscoveredProduct[] = [];
    
    try {
      const sitemapUrls = [
        `https://${domain}/sitemap.xml`,
        `https://${domain}/sitemap_index.xml`,
        `https://${domain}/product-sitemap.xml`,
        `https://${domain}/robots.txt` // Check robots.txt for sitemap location
      ];
      
      for (const sitemapUrl of sitemapUrls) {
        try {
          const response = await this.makeRequest(sitemapUrl);
          const urls = this.extractUrlsFromSitemap(response.data);
          
          // Filter for product URLs
          const productUrls = urls.filter(url => this.isProductUrl(url)).slice(0, maxProducts);
          
          for (const url of productUrls) {
            if (products.length >= maxProducts) break;
            
            const product = await this.extractProductFromUrl(url, domain);
            if (product) {
              products.push(product);
            }
            
            await this.delay(this.requestDelay);
          }
          
          if (products.length > 0) break; // Found products, no need to try other sitemaps
          
        } catch (error) {
          console.log(`⚠️ Sitemap ${sitemapUrl} not accessible`);
        }
      }
      
    } catch (error) {
      console.error('❌ Sitemap crawl error:', error);
    }
    
    return products;
  }

  // Crawl from category pages
  private async crawlFromCategories(domain: string, maxProducts: number, categoryFilter?: string): Promise<DiscoveredProduct[]> {
    const products: DiscoveredProduct[] = [];
    
    try {
      // Common category paths for different e-commerce sites
      const categoryPaths = this.getCategoryPaths(domain, categoryFilter);
      
      for (const path of categoryPaths) {
        if (products.length >= maxProducts) break;
        
        try {
          const categoryUrl = `https://${domain}${path}`;
          const response = await this.makeRequest(categoryUrl);
          const $ = cheerio.load(response.data);
          
          // Extract product links from category page
          const productLinks = this.extractProductLinksFromPage($, domain);
          
          for (const link of productLinks) {
            if (products.length >= maxProducts) break;
            
            const product = await this.extractProductFromUrl(link, domain);
            if (product) {
              products.push(product);
            }
            
            await this.delay(this.requestDelay);
          }
          
        } catch (error) {
          console.log(`⚠️ Category ${path} not accessible`);
        }
      }
      
    } catch (error) {
      console.error('❌ Category crawl error:', error);
    }
    
    return products;
  }

  // Crawl from search results
  private async crawlFromSearch(domain: string, keywords: string[], maxProducts: number): Promise<DiscoveredProduct[]> {
    const products: DiscoveredProduct[] = [];
    
    try {
      const searchPaths = this.getSearchPaths(domain);
      
      for (const keyword of keywords) {
        if (products.length >= maxProducts) break;
        
        for (const searchPath of searchPaths) {
          try {
            const searchUrl = `https://${domain}${searchPath}${encodeURIComponent(keyword)}`;
            const response = await this.makeRequest(searchUrl);
            const $ = cheerio.load(response.data);
            
            const productLinks = this.extractProductLinksFromPage($, domain);
            
            for (const link of productLinks) {
              if (products.length >= maxProducts) break;
              
              const product = await this.extractProductFromUrl(link, domain);
              if (product) {
                products.push(product);
              }
              
              await this.delay(this.requestDelay);
            }
            
          } catch (error) {
            console.log(`⚠️ Search for "${keyword}" failed`);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Search crawl error:', error);
    }
    
    return products;
  }

  // Crawl from homepage
  private async crawlFromHomepage(domain: string, maxProducts: number): Promise<DiscoveredProduct[]> {
    const products: DiscoveredProduct[] = [];
    
    try {
      const response = await this.makeRequest(`https://${domain}`);
      const $ = cheerio.load(response.data);
      
      const productLinks = this.extractProductLinksFromPage($, domain);
      
      for (const link of productLinks.slice(0, maxProducts)) {
        const product = await this.extractProductFromUrl(link, domain);
        if (product) {
          products.push(product);
        }
        
        await this.delay(this.requestDelay);
      }
      
    } catch (error) {
      console.error('❌ Homepage crawl error:', error);
    }
    
    return products;
  }

  // Extract product data from a specific URL
  private async extractProductFromUrl(url: string, domain: string): Promise<DiscoveredProduct | null> {
    try {
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response.data);
      
      // Use domain-specific selectors
      const selectors = this.getProductSelectors(domain);
      
      const product: DiscoveredProduct = {
        url,
        title: this.extractText($, selectors.title) || 'Unknown Product',
        price: this.extractText($, selectors.price),
        originalPrice: this.extractText($, selectors.originalPrice),
        imageUrl: this.extractImageUrl($, selectors.image, domain),
        category: this.extractText($, selectors.category),
        description: this.extractText($, selectors.description),
        rating: this.extractRating($, selectors.rating),
        reviewCount: this.extractNumber($, selectors.reviewCount),
        availability: this.extractText($, selectors.availability),
        merchant: domain
      };
      
      // Validate product data
      if (product.title && product.title !== 'Unknown Product') {
        return product;
      }
      
    } catch (error) {
      console.log(`⚠️ Failed to extract product from ${url}`);
    }
    
    return null;
  }

  // Helper methods
  private normalizeDomain(domain: string): string {
    return domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  }

  private async makeRequest(url: string): Promise<any> {
    const config = {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      timeout: 10000,
      maxRedirects: 5
    };
    
    return await axios.get(url, config);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private extractUrlsFromSitemap(sitemapXml: string): string[] {
    const urls: string[] = [];
    const $ = cheerio.load(sitemapXml, { xmlMode: true });
    
    $('url > loc').each((_, element) => {
      const url = $(element).text().trim();
      if (url) urls.push(url);
    });
    
    return urls;
  }

  private isProductUrl(url: string): boolean {
    const productPatterns = [
      /\/product\//,
      /\/item\//,
      /\/p\//,
      /\/dp\//,
      /\/products\//,
      /\/buy\//,
      /\/shop\//
    ];
    
    return productPatterns.some(pattern => pattern.test(url));
  }

  private getCategoryPaths(domain: string, categoryFilter?: string): string[] {
    const commonPaths = [
      '/category/',
      '/categories/',
      '/shop/',
      '/products/',
      '/browse/',
      '/c/',
    ];
    
    // Domain-specific category paths
    const domainSpecific: Record<string, string[]> = {
      'amazon.in': ['/s?k=', '/gp/browse.html'],
      'flipkart.com': ['/search?q=', '/browse/'],
      'myntra.com': ['/shop/', '/men/', '/women/', '/kids/'],
      'ajio.com': ['/shop/', '/men/', '/women/'],
      'nykaa.com': ['/brands/', '/makeup/', '/skin/', '/hair/'],
    };
    
    let paths = domainSpecific[domain] || commonPaths;
    
    if (categoryFilter) {
      paths = paths.map(path => `${path}${categoryFilter}`);
    }
    
    return paths;
  }

  private getSearchPaths(domain: string): string[] {
    const domainSpecific: Record<string, string[]> = {
      'amazon.in': ['/s?k='],
      'flipkart.com': ['/search?q='],
      'myntra.com': ['/search?q='],
      'ajio.com': ['/search/?text='],
      'nykaa.com': ['/search/result/?q='],
    };
    
    return domainSpecific[domain] || ['/search?q=', '/search?query=', '/s?k='];
  }

  private extractProductLinksFromPage($: cheerio.CheerioAPI, domain: string): string[] {
    const links: string[] = [];
    
    // Common product link selectors
    const selectors = [
      'a[href*="/product/"]',
      'a[href*="/item/"]',
      'a[href*="/p/"]',
      'a[href*="/dp/"]',
      'a[href*="/products/"]',
      '.product-item a',
      '.product-card a',
      '.item-card a'
    ];
    
    selectors.forEach(selector => {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `https://${domain}${href}`;
          if (this.isProductUrl(fullUrl)) {
            links.push(fullUrl);
          }
        }
      });
    });
    
    return [...new Set(links)]; // Remove duplicates
  }

  private getProductSelectors(domain: string): Record<string, string[]> {
    const commonSelectors = {
      title: ['h1', '.product-title', '.item-title', '[data-testid="product-title"]'],
      price: ['.price', '.current-price', '.sale-price', '[data-testid="price"]'],
      originalPrice: ['.original-price', '.mrp', '.list-price', '.was-price'],
      image: ['img.product-image', '.product-photo img', '.item-image img', '[data-testid="product-image"]'],
      category: ['.breadcrumb', '.category', '.product-category'],
      description: ['.product-description', '.item-description', '.product-details'],
      rating: ['.rating', '.stars', '.product-rating'],
      reviewCount: ['.review-count', '.reviews', '.rating-count'],
      availability: ['.availability', '.stock-status', '.in-stock']
    };
    
    // Domain-specific selectors can be added here
    const domainSpecific: Record<string, Partial<Record<keyof typeof commonSelectors, string[]>>> = {
      'amazon.in': {
        title: ['#productTitle', 'h1.a-size-large'],
        price: ['.a-price-whole', '.a-offscreen'],
        image: ['#landingImage', '.a-dynamic-image']
      },
      'flipkart.com': {
        title: ['.B_NuCI', 'h1 span'],
        price: ['._30jeq3', '._1_WHN1']
      }
    };
    
    const specific = domainSpecific[domain] || {};
    
    // Merge common and domain-specific selectors
    const result: Record<string, string[]> = {};
    Object.keys(commonSelectors).forEach(key => {
      const k = key as keyof typeof commonSelectors;
      result[key] = [...(specific[k] || []), ...commonSelectors[k]];
    });
    
    return result;
  }

  private extractText($: cheerio.CheerioAPI, selectors: string[]): string | undefined {
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) return text;
    }
    return undefined;
  }

  private extractImageUrl($: cheerio.CheerioAPI, selectors: string[], domain: string): string | undefined {
    for (const selector of selectors) {
      const src = $(selector).first().attr('src') || $(selector).first().attr('data-src');
      if (src) {
        return src.startsWith('http') ? src : `https://${domain}${src}`;
      }
    }
    return undefined;
  }

  private extractRating($: cheerio.CheerioAPI, selectors: string[]): number | undefined {
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      const rating = parseFloat(text);
      if (!isNaN(rating)) return rating;
    }
    return undefined;
  }

  private extractNumber($: cheerio.CheerioAPI, selectors: string[]): number | undefined {
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      const number = parseInt(text.replace(/[^0-9]/g, ''));
      if (!isNaN(number)) return number;
    }
    return undefined;
  }

  private removeDuplicates(products: DiscoveredProduct[]): DiscoveredProduct[] {
    const seen = new Set<string>();
    return products.filter(product => {
      if (seen.has(product.url)) {
        return false;
      }
      seen.add(product.url);
      return true;
    });
  }
}