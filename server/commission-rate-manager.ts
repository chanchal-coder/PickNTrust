/**
 * Commission Rate Manager
 * Smart category detection and commission rate optimization for 8-bot system
 * Integrates with affiliate tag manager for complete revenue optimization
 */

import Database from 'better-sqlite3';
import path from 'path';

interface CommissionRate {
  id: number;
  affiliateNetwork: string;
  category: string;
  subcategory?: string;
  commissionRate: number;
  minRate?: number;
  maxRate?: number;
  currency: string;
  dataSource: 'manual' | 'csv' | 'api' | 'scraped' | 'default';
  lastUpdated: string;
}

interface CategoryKeywords {
  id: number;
  category: string;
  subcategory?: string;
  keywords: string[];
  urlPatterns: string[];
  priority: number;
}

interface CategoryDetectionResult {
  category: string;
  subcategory?: string;
  confidence: number;
  matchedKeywords: string[];
  matchedPatterns: string[];
}

interface CommissionRateResult {
  rate: number;
  minRate?: number;
  maxRate?: number;
  source: string;
  network: string;
  category: string;
  lastUpdated?: string;
}

class CommissionRateManager {
  private db: Database.Database;
  private cache: Map<string, CommissionRate[]> = new Map();
  private categoryCache: Map<string, CategoryDetectionResult> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.db = new Database(path.join(process.cwd(), 'database.sqlite'));
  }

  /**
   * Detect product category from URL and title
   */
  async detectCategory(url: string, title?: string): Promise<CategoryDetectionResult> {
    const cacheKey = `${url}_${title || ''}`;
    
    // Check cache first
    if (this.categoryCache.has(cacheKey)) {
      return this.categoryCache.get(cacheKey)!;
    }

    try {
      const keywords = this.db.prepare(`
        SELECT category, subcategory, keywords, url_patterns, priority
        FROM category_keywords 
        WHERE is_active = 1
        ORDER BY priority DESC
      `).all() as any[];

      let bestMatch: CategoryDetectionResult = {
        category: 'General',
        confidence: 0,
        matchedKeywords: [],
        matchedPatterns: []
      };

      for (const keywordSet of keywords) {
        const keywordList: string[] = JSON.parse(keywordSet.keywords);
        const urlPatterns: string[] = keywordSet.url_patterns ? JSON.parse(keywordSet.url_patterns) : [];
        
        let score = 0;
        const matchedKeywords: string[] = [];
        const matchedPatterns: string[] = [];

        // Check URL patterns (highest weight)
        for (const pattern of urlPatterns) {
          if (url.toLowerCase().includes(pattern.toLowerCase())) {
            score += 5 * keywordSet.priority;
            matchedPatterns.push(pattern);
          }
        }

        // Check title keywords (medium weight)
        if (title) {
          for (const keyword of keywordList) {
            if (title.toLowerCase().includes(keyword.toLowerCase())) {
              score += 2 * keywordSet.priority;
              matchedKeywords.push(keyword);
            }
          }
        }

        // Check URL keywords (low weight)
        for (const keyword of keywordList) {
          if (url.toLowerCase().includes(keyword.toLowerCase())) {
            score += 1 * keywordSet.priority;
            matchedKeywords.push(keyword);
          }
        }

        const confidence = Math.min(score / 20, 1); // Normalize to 0-1
        
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            category: keywordSet.category,
            subcategory: keywordSet.subcategory,
            confidence,
            matchedKeywords,
            matchedPatterns
          };
        }
      }

      // Cache the result
      this.categoryCache.set(cacheKey, bestMatch);
      
      // Clean cache periodically
      if (this.categoryCache.size > 1000) {
        this.categoryCache.clear();
      }

      return bestMatch;
    } catch (error) {
      console.error('Error detecting category:', error);
      return {
        category: 'General',
        confidence: 0,
        matchedKeywords: [],
        matchedPatterns: []
      };
    }
  }

  /**
   * Get commission rate for specific network and category
   */
  async getCommissionRate(
    affiliateNetwork: string, 
    category: string, 
    method: 'manual' | 'scraping' | 'api' | 'performance' = 'manual'
  ): Promise<CommissionRateResult> {
    try {
      // Define data source priority based on method
      const sourcePriority = {
        api: ['api', 'scraped', 'csv', 'manual', 'default'],
        scraping: ['scraped', 'api', 'csv', 'manual', 'default'],
        manual: ['manual', 'csv', 'scraped', 'api', 'default'],
        performance: ['api', 'scraped', 'manual', 'csv', 'default']
      };

      const priority = sourcePriority[method];
      const priorityCase = priority.map((source, index) => 
        `WHEN '${source}' THEN ${index + 1}`
      ).join(' ');

      const rate = this.db.prepare(`
        SELECT commission_rate, min_rate, max_rate, data_source, last_updated
        FROM commission_rates 
        WHERE affiliate_network = ? AND category = ? AND is_active = 1
        ORDER BY 
          CASE data_source ${priorityCase} ELSE 99 END,
          commission_rate DESC
        LIMIT 1
      `).get(affiliateNetwork, category) as any;

      if (rate) {
        return {
          rate: rate.commission_rate,
          minRate: rate.min_rate,
          maxRate: rate.max_rate,
          source: rate.data_source,
          network: affiliateNetwork,
          category,
          lastUpdated: rate.last_updated
        };
      }

      // Fallback to network average if no category-specific rate
      const avgRate = this.db.prepare(`
        SELECT AVG(commission_rate) as avg_rate, data_source
        FROM commission_rates 
        WHERE affiliate_network = ? AND is_active = 1
        GROUP BY data_source
        ORDER BY 
          CASE data_source ${priorityCase} ELSE 99 END
        LIMIT 1
      `).get(affiliateNetwork) as any;

      if (avgRate) {
        return {
          rate: avgRate.avg_rate,
          source: `${avgRate.data_source}_average`,
          network: affiliateNetwork,
          category
        };
      }

      // Final fallback to default rates
      const defaultRates: { [key: string]: number } = {
        'Amazon Associates': 4.0,
        'CueLinks': 6.5,
        'EarnKaro': 4.0,
        'INRDeals': 3.5,
        'MakeMyTrip': 4.0,
        'Booking.com': 4.0
      };

      return {
        rate: defaultRates[affiliateNetwork] || 3.0,
        source: 'default',
        network: affiliateNetwork,
        category
      };
    } catch (error) {
      console.error('Error getting commission rate:', error);
      return {
        rate: 3.0,
        source: 'error_fallback',
        network: affiliateNetwork,
        category
      };
    }
  }

  /**
   * Get optimal commission rate for a product URL
   */
  async getOptimalRate(
    url: string, 
    title: string, 
    availableNetworks: string[],
    method: 'manual' | 'scraping' | 'api' | 'performance' = 'manual'
  ): Promise<{ network: string; rate: CommissionRateResult; category: CategoryDetectionResult }> {
    try {
      // Detect category first
      const category = await this.detectCategory(url, title);
      
      // Get rates for all available networks
      const networkRates = await Promise.all(
        availableNetworks.map(async (network) => {
          const rate = await this.getCommissionRate(network, category.category, method);
          return { network, rate };
        })
      );

      // Sort by commission rate (highest first)
      networkRates.sort((a, b) => b.rate.rate - a.rate.rate);

      const optimal = networkRates[0];
      
      return {
        network: optimal.network,
        rate: optimal.rate,
        category
      };
    } catch (error) {
      console.error('Error getting optimal rate:', error);
      
      // Return first network as fallback
      const fallbackNetwork = availableNetworks[0] || 'Amazon Associates';
      const fallbackRate = await this.getCommissionRate(fallbackNetwork, 'General', method);
      
      return {
        network: fallbackNetwork,
        rate: fallbackRate,
        category: {
          category: 'General',
          confidence: 0,
          matchedKeywords: [],
          matchedPatterns: []
        }
      };
    }
  }

  /**
   * Update commission rates from CSV data
   */
  async updateRatesFromCSV(csvData: any[], source: 'csv' | 'manual' = 'csv'): Promise<number> {
    try {
      const insertStmt = this.db.prepare(`
        INSERT OR REPLACE INTO commission_rates (
          affiliate_network, category, commission_rate, min_rate, max_rate,
          data_source, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      let updatedCount = 0;
      
      for (const row of csvData) {
        try {
          const result = insertStmt.run(
            row.network || row.Network,
            row.category || row.Category,
            parseFloat(row.rate || row.Rate),
            parseFloat(row.minRate || row.MinRate) || null,
            parseFloat(row.maxRate || row.MaxRate) || null,
            source
          );
          
          if (result.changes > 0) updatedCount++;
        } catch (rowError) {
          console.warn('Error processing CSV row:', row, rowError);
        }
      }

      // Clear cache after updates
      this.cache.clear();
      
      return updatedCount;
    } catch (error) {
      console.error('Error updating rates from CSV:', error);
      return 0;
    }
  }

  /**
   * Get commission rate statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const stats = this.db.prepare(`
        SELECT 
          affiliate_network,
          COUNT(*) as categories,
          AVG(commission_rate) as avg_rate,
          MIN(commission_rate) as min_rate,
          MAX(commission_rate) as max_rate,
          data_source
        FROM commission_rates 
        WHERE is_active = 1
        GROUP BY affiliate_network, data_source
        ORDER BY affiliate_network, avg_rate DESC
      `).all();

      return stats;
    } catch (error) {
      console.error('Error getting statistics:', error);
      return [];
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

// Export singleton instance
export const commissionRateManager = new CommissionRateManager();
export default commissionRateManager;

// Export types
export type { CommissionRate, CategoryDetectionResult, CommissionRateResult };