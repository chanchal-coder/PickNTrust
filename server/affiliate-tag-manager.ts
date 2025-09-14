/**
 * Affiliate Tag Manager
 * Dynamic affiliate tag management for 8-bot system
 * Provides bots with optimal affiliate tags based on database configuration
 */

import Database from 'better-sqlite3';
import path from 'path';
import commissionRateManager from './commission-rate-manager';

interface AffiliateTag {
  id: number;
  botName: string;
  networkName: string;
  affiliateTag: string;
  tagType: 'url' | 'parameter' | 'wrapper';
  priority: number;
  isActive: boolean;
  commissionRate: number;
  successRate: number;
  lastUsed?: string;
}

class AffiliateTagManager {
  private db: Database.Database;
  private cache: Map<string, AffiliateTag[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.db = new Database(path.join(process.cwd(), 'database.sqlite'));
  }

  /**
   * Get optimal affiliate tag for a bot with smart commission rate optimization
   */
  async getOptimalTag(botName: string, options: {
    productType?: string;
    url?: string;
    title?: string;
    method?: 'manual' | 'scraping' | 'api' | 'performance';
    fallbackToAny?: boolean;
  } = {}): Promise<AffiliateTag | null> {
    try {
      const tags = await this.getActiveTags(botName);
      
      if (tags.length === 0) {
        console.warn(`No active affiliate tags found for bot: ${botName}`);
        return null;
      }

      // If URL and title provided, use smart commission rate optimization
      if (options.url && options.title) {
        const availableNetworks = tags.map(tag => tag.networkName);
        const optimal = await commissionRateManager.getOptimalRate(
          options.url,
          options.title,
          availableNetworks,
          options.method || 'manual'
        );
        
        // Find the tag for the optimal network
        const optimalTag = tags.find(tag => tag.networkName === optimal.network);
        if (optimalTag) {
          console.log(`Target Optimal network: ${optimal.network} (${optimal.rate.rate}% commission for ${optimal.category.category})`);
          return optimalTag;
        }
      }

      // Fallback to original optimization (commission rate + success rate)
      const sortedTags = tags.sort((a, b) => {
        const scoreA = (a.commissionRate * 0.6) + ((a.successRate || 100) * 0.4);
        const scoreB = (b.commissionRate * 0.6) + ((b.successRate || 100) * 0.4);
        return scoreB - scoreA;
      });

      return sortedTags[0];
    } catch (error) {
      console.error(`Error getting optimal tag for ${botName}:`, error);
      return null;
    }
  }

  /**
   * Get all active tags for a bot (with caching)
   */
  async getActiveTags(botName: string): Promise<AffiliateTag[]> {
    const cacheKey = `tags_${botName}`;
    const now = Date.now();
    
    // Check cache
    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const tags = this.db.prepare(`
        SELECT id, bot_name as botName, network_name as networkName, 
               affiliate_tag as affiliateTag, tag_type as tagType, 
               priority, is_active as isActive, commission_rate as commissionRate,
               success_rate as successRate, last_used as lastUsed
        FROM bot_affiliate_tags 
        WHERE bot_name = ? AND is_active = 1
        ORDER BY priority ASC
      `).all(botName) as AffiliateTag[];

      // Update cache
      this.cache.set(cacheKey, tags);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

      return tags;
    } catch (error) {
      console.error(`Error fetching tags for ${botName}:`, error);
      return [];
    }
  }

  /**
   * Apply affiliate tag to URL based on tag type
   */
  applyAffiliateTag(url: string, tag: AffiliateTag): string {
    try {
      switch (tag.tagType) {
        case 'wrapper':
          // Replace {{URL}} or {{URL_ENC}} placeholders
          if (tag.affiliateTag.includes('{{URL_ENC}}')) {
            return tag.affiliateTag.replace('{{URL_ENC}}', encodeURIComponent(url));
          } else if (tag.affiliateTag.includes('{{URL}}')) {
            return tag.affiliateTag.replace('{{URL}}', url);
          }
          return tag.affiliateTag;

        case 'parameter':
          // Add as URL parameter
          const urlObj = new URL(url);
          const [param, value] = tag.affiliateTag.split('=');
          if (param && value) {
            urlObj.searchParams.set(param, value);
          }
          return urlObj.toString();

        case 'url':
          // Direct URL replacement or append
          return tag.affiliateTag;

        default:
          console.warn(`Unknown tag type: ${tag.tagType}`);
          return url;
      }
    } catch (error) {
      console.error(`Error applying affiliate tag:`, error);
      return url;
    }
  }

  /**
   * Process URL with optimal affiliate tag and smart commission optimization
   */
  async processUrl(botName: string, url: string, options: {
    productType?: string;
    title?: string;
    method?: 'manual' | 'scraping' | 'api' | 'performance';
    trackUsage?: boolean;
  } = {}): Promise<{ 
    affiliateUrl: string; 
    tag: AffiliateTag | null;
    category?: string;
    commissionRate?: number;
    source?: string;
  }> {
    const tag = await this.getOptimalTag(botName, { url, ...options });
    
    if (!tag) {
      return { affiliateUrl: url, tag: null };
    }

    const affiliateUrl = this.applyAffiliateTag(url, tag);
    
    // Get category and commission rate info if title provided
    let category, commissionRate, source;
    if (options.title) {
      try {
        const categoryResult = await commissionRateManager.detectCategory(url, options.title);
        const rateResult = await commissionRateManager.getCommissionRate(
          tag.networkName, 
          categoryResult.category, 
          options.method
        );
        
        category = categoryResult.category;
        commissionRate = rateResult.rate;
        source = rateResult.source;
        
        console.log(`Stats Product: ${categoryResult.category} | Network: ${tag.networkName} | Rate: ${rateResult.rate}% (${rateResult.source})`);
      } catch (error) {
        console.warn('Error getting commission info:', error);
      }
    }
    
    // Track usage if requested
    if (options.trackUsage) {
      this.trackTagUsage(tag.id, true).catch(console.error);
    }

    return { affiliateUrl, tag, category, commissionRate, source };
  }

  /**
   * Track tag usage for analytics
   */
  async trackTagUsage(tagId: number, success: boolean = true): Promise<void> {
    try {
      // Update last used timestamp
      this.db.prepare(`
        UPDATE bot_affiliate_tags 
        SET last_used = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(tagId);

      // Update success rate (exponential moving average)
      const updateSuccessRate = success ? 100 : 0;
      this.db.prepare(`
        UPDATE bot_affiliate_tags 
        SET success_rate = CASE 
          WHEN success_rate IS NULL THEN ?
          ELSE (success_rate * 0.9) + (? * 0.1)
        END
        WHERE id = ?
      `).run(updateSuccessRate, updateSuccessRate, tagId);

    } catch (error) {
      console.error('Error tracking tag usage:', error);
    }
  }

  /**
   * Get fallback tags when primary fails
   */
  async getFallbackTags(botName: string, excludeTagId?: number): Promise<AffiliateTag[]> {
    const allTags = await this.getActiveTags(botName);
    return allTags.filter(tag => tag.id !== excludeTagId);
  }

  /**
   * Process URL with automatic fallback
   */
  async processUrlWithFallback(botName: string, url: string, options: {
    productType?: string;
    maxRetries?: number;
  } = {}): Promise<{ affiliateUrl: string; tag: AffiliateTag | null; attempt: number }> {
    const maxRetries = options.maxRetries || 3;
    let lastError: Error | null = null;
    
    const tags = await this.getActiveTags(botName);
    
    for (let attempt = 0; attempt < Math.min(maxRetries, tags.length); attempt++) {
      const tag = tags[attempt];
      
      try {
        const affiliateUrl = this.applyAffiliateTag(url, tag);
        
        // Track successful usage
        this.trackTagUsage(tag.id, true).catch(console.error);
        
        return { affiliateUrl, tag, attempt: attempt + 1 };
      } catch (error) {
        lastError = error as Error;
        console.warn(`Tag ${tag.networkName} failed for ${botName}, trying next...`);
        
        // Track failed usage
        this.trackTagUsage(tag.id, false).catch(console.error);
      }
    }

    console.error(`All affiliate tags failed for ${botName}:`, lastError);
    return { affiliateUrl: url, tag: null, attempt: maxRetries };
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(botName?: string): void {
    if (botName) {
      const cacheKey = `tags_${botName}`;
      this.cache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

// Export singleton instance
export const affiliateTagManager = new AffiliateTagManager();
export default affiliateTagManager;

// Export types
export type { AffiliateTag };