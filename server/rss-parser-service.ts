import Parser from 'rss-parser';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { ResilientApiClient } from './utils/circuit-breaker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database setup
const dbPath = path.join(__dirname, '..', '..', '..', 'database.sqlite');
const db = new Database(dbPath);

// RSS Parser setup
const parser = new Parser({
  customFields: {
    feed: ['language', 'copyright', 'managingEditor'],
    item: ['category', 'guid', 'enclosure', 'source']
  }
});

// Initialize resilient client for RSS feed fetching
const resilientClient = new ResilientApiClient({
  failureThreshold: 3,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 10000 // 10 seconds
});

export interface RSSFeedItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  category?: string;
  guid?: string;
  imageUrl?: string;
  price?: string;
  originalPrice?: string;
  discount?: string;
  source: string;
  sourceFeedId: number;
}

export interface ParsedRSSFeed {
  title: string;
  description: string;
  link: string;
  items: RSSFeedItem[];
}

export class RSSParserService {
  
  /**
   * Fetch and parse an RSS feed from URL
   */
  static async parseRSSFeed(url: string, feedId: number): Promise<ParsedRSSFeed | null> {
    try {
      console.log(`Fetching RSS feed from: ${url}`);
      
      const feed = await parser.parseURL(url);
      
      const parsedFeed: ParsedRSSFeed = {
        title: feed.title || 'Unknown Feed',
        description: feed.description || '',
        link: feed.link || url,
        items: []
      };

      // Process each item in the feed
      for (const item of feed.items) {
        const parsedItem = this.parseRSSItem(item, feedId, feed.title || 'Unknown Feed');
        if (parsedItem) {
          parsedFeed.items.push(parsedItem);
        }
      }

      console.log(`Successfully parsed ${parsedFeed.items.length} items from ${url}`);
      return parsedFeed;
      
    } catch (error) {
      console.error(`Error parsing RSS feed ${url}:`, error);
      return null;
    }
  }

  /**
   * Parse individual RSS item and extract relevant data
   */
  private static parseRSSItem(item: any, feedId: number, sourceName: string): RSSFeedItem | null {
    try {
      // Basic required fields
      if (!item.title || !item.link) {
        return null;
      }

      const parsedItem: RSSFeedItem = {
        title: this.cleanText(item.title),
        description: this.cleanText(item.contentSnippet || item.content || item.description || ''),
        link: item.link,
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        source: sourceName,
        sourceFeedId: feedId
      };

      // Extract category
      if (item.categories && item.categories.length > 0) {
        parsedItem.category = item.categories[0];
      } else if (item.category) {
        parsedItem.category = Array.isArray(item.category) ? item.category[0] : item.category;
      }

      // Extract GUID
      if (item.guid) {
        parsedItem.guid = typeof item.guid === 'string' ? item.guid : item.guid._;
      }

      // Extract image from enclosure or content
      parsedItem.imageUrl = this.extractImageUrl(item);

      // Extract price information (common in deal feeds)
      const priceInfo = this.extractPriceInfo(item.title, item.description || '');
      if (priceInfo) {
        parsedItem.price = priceInfo.price;
        parsedItem.originalPrice = priceInfo.originalPrice;
        parsedItem.discount = priceInfo.discount;
      }

      return parsedItem;
      
    } catch (error) {
      console.error('Error parsing RSS item:', error);
      return null;
    }
  }

  /**
   * Extract image URL from RSS item
   */
  private static extractImageUrl(item: any): string | undefined {
    // Check enclosure for image
    if (item.enclosure && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
      return item.enclosure.url;
    }

    // Check content for images
    if (item.content) {
      const imgMatch = item.content.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch) {
        return imgMatch[1];
      }
    }

    // Check description for images
    if (item.description) {
      const imgMatch = item.description.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch) {
        return imgMatch[1];
      }
    }

    return undefined;
  }

  /**
   * Extract price information from title and description
   */
  private static extractPriceInfo(title: string, description: string): { price?: string; originalPrice?: string; discount?: string } | null {
    const text = `${title} ${description}`.toLowerCase();
    
    // Common price patterns
    const pricePatterns = [
      /\$(\d+(?:\.\d{2})?)/g,           // $19.99
      /₹(\d+(?:,\d{3})*(?:\.\d{2})?)/g, // ₹1,999.00
      /£(\d+(?:\.\d{2})?)/g,           // £19.99
      /€(\d+(?:\.\d{2})?)/g,           // €19.99
      /(\d+(?:\.\d{2})?)\s*(?:usd|dollars?)/gi, // 19.99 USD
    ];

    // Discount patterns
    const discountPatterns = [
      /(\d+)%\s*off/gi,                // 50% off
      /save\s*(\d+)%/gi,               // save 50%
      /(\d+)%\s*discount/gi,           // 50% discount
    ];

    const prices: string[] = [];
    const discounts: string[] = [];

    // Extract prices
    for (const pattern of pricePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        prices.push(...matches);
      }
    }

    // Extract discounts
    for (const pattern of discountPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        discounts.push(...matches);
      }
    }

    if (prices.length === 0) {
      return null;
    }

    const result: { price?: string; originalPrice?: string; discount?: string } = {};

    // If we have multiple prices, assume first is current price, second is original
    if (prices.length >= 2) {
      result.price = prices[0];
      result.originalPrice = prices[1];
    } else {
      result.price = prices[0];
    }

    // Add discount if found
    if (discounts.length > 0) {
      result.discount = discounts[0];
    }

    return result;
  }

  /**
   * Clean text content (remove HTML, extra whitespace, etc.)
   */
  private static cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Import RSS feed items into the products database
   */
  static async importRSSItems(items: RSSFeedItem[], feedConfig: any): Promise<{ imported: number; skipped: number; errors: number }> {
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO products (
        name, description, price, originalPrice, imageUrl, affiliateUrl, 
        category, rating, reviewCount, discount, isNew, isFeatured, 
        source, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    for (const item of items) {
      try {
        // Skip if content filter is enabled and item doesn't match
        if (feedConfig.content_filter && !this.matchesContentFilter(item, feedConfig.content_filter)) {
          skipped++;
          continue;
        }

        // Process affiliate URL if replacement is enabled
        let affiliateUrl = item.link;
        if (feedConfig.affiliate_replace && feedConfig.affiliate_replace.trim()) {
          affiliateUrl = this.processAffiliateUrl(item.link, feedConfig.affiliate_replace);
        }

        // Map category if needed
        const category = this.mapCategory(item.category, feedConfig.category);

        // Insert into database
        const result = insertProduct.run(
          item.title,
          item.description,
          item.price || '0',
          item.originalPrice || null,
          item.imageUrl || null,
          affiliateUrl,
          category,
          '4.0', // Default rating
          '0', // Default review count
          item.discount || null,
          true, // Mark as new
          false, // Not featured by default
          `RSS: ${item.source}`
        );

        if (result.changes > 0) {
          imported++;
        } else {
          skipped++; // Duplicate
        }

      } catch (error) {
        console.error('Error importing RSS item:', error);
        errors++;
      }
    }

    // Update last_fetched timestamp for the feed
    const updateFeed = db.prepare('UPDATE rss_feeds SET last_fetched = datetime("now") WHERE id = ?');
    updateFeed.run(feedConfig.id);

    return { imported, skipped, errors };
  }

  /**
   * Check if item matches content filter
   */
  private static matchesContentFilter(item: RSSFeedItem, filter: string): boolean {
    if (!filter || !filter.trim()) return true;

    const filterTerms = filter.toLowerCase().split(',').map(term => term.trim());
    const itemText = `${item.title} ${item.description} ${item.category || ''}`.toLowerCase();

    return filterTerms.some(term => itemText.includes(term));
  }

  /**
   * Process affiliate URL replacement
   */
  private static processAffiliateUrl(originalUrl: string, affiliateTemplate: string): string {
    try {
      // Simple template replacement - can be enhanced
      if (affiliateTemplate.includes('{url}')) {
        return affiliateTemplate.replace('{url}', encodeURIComponent(originalUrl));
      }
      
      // If no template, return original
      return originalUrl;
    } catch (error) {
      console.error('Error processing affiliate URL:', error);
      return originalUrl;
    }
  }

  /**
   * Map RSS category to local category
   */
  private static mapCategory(rssCategory: string | undefined, defaultCategory: string): string {
    if (!rssCategory) return defaultCategory;

    // Simple category mapping - can be enhanced with a mapping table
    const categoryMappings: { [key: string]: string } = {
      'electronics': 'Electronics',
      'tech': 'Electronics',
      'technology': 'Electronics',
      'fashion': 'Fashion',
      'clothing': 'Fashion',
      'home': 'Home & Garden',
      'garden': 'Home & Garden',
      'books': 'Books',
      'sports': 'Sports',
      'health': 'Health & Beauty',
      'beauty': 'Health & Beauty',
      'toys': 'Toys & Games',
      'games': 'Toys & Games',
      'automotive': 'Automotive',
      'travel': 'Travel'
    };

    const lowerCategory = rssCategory.toLowerCase();
    return categoryMappings[lowerCategory] || defaultCategory;
  }

  /**
   * Get all active RSS feeds from database
   */
  static getActiveRSSFeeds(): any[] {
    const stmt = db.prepare('SELECT * FROM rss_feeds WHERE is_active = 1');
    return stmt.all();
  }

  /**
   * Test RSS feed URL for validity
   */
  static async testRSSFeed(url: string): Promise<{ valid: boolean; title?: string; itemCount?: number; error?: string }> {
    try {
      const feed = await parser.parseURL(url);
      return {
        valid: true,
        title: feed.title || 'Unknown Feed',
        itemCount: feed.items?.length || 0
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default RSSParserService;