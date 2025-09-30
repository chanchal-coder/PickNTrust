import cron from 'node-cron';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import RSSParserService from './rss-parser-service.js';
import { ResilientApiClient } from './utils/circuit-breaker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database setup
const dbPath = path.join(__dirname, '..', '..', '..', 'database.sqlite');
const db = new Database(dbPath);

export interface AggregationStats {
  totalFeeds: number;
  activeFeeds: number;
  lastRun: string | null;
  totalImported: number;
  totalErrors: number;
}

export interface RSSFeed {
  id: number;
  name: string;
  url: string;
  is_active: number;
  auto_import: number;
  update_frequency: string;
  category: string;
  last_fetched: string | null;
  created_at: string;
  updated_at: string;
}

export class RSSAggregationService {
  private static instance: RSSAggregationService;
  private isRunning = false;
  private stats: AggregationStats = {
    totalFeeds: 0,
    activeFeeds: 0,
    lastRun: null,
    totalImported: 0,
    totalErrors: 0
  };

  private constructor() {
    this.initializeScheduler();
  }

  static getInstance(): RSSAggregationService {
    if (!RSSAggregationService.instance) {
      RSSAggregationService.instance = new RSSAggregationService();
    }
    return RSSAggregationService.instance;
  }

  /**
   * Initialize cron scheduler for automatic RSS feed aggregation
   */
  private initializeScheduler(): void {
    // Run every hour to check for feeds that need updating
    cron.schedule('0 * * * *', async () => {
      console.log('RSS Aggregation Service: Hourly check started');
      await this.runAggregation();
    });

    // Run every 6 hours for daily frequency feeds
    cron.schedule('0 */6 * * *', async () => {
      console.log('RSS Aggregation Service: 6-hour check started');
      await this.runAggregation('daily');
    });

    // Run once a day for weekly frequency feeds
    cron.schedule('0 2 * * *', async () => {
      console.log('RSS Aggregation Service: Daily check started');
      await this.runAggregation('weekly');
    });

    console.log('RSS Aggregation Service: Scheduler initialized');
  }

  /**
   * Run RSS feed aggregation for feeds that need updating
   */
  async runAggregation(frequency?: string): Promise<void> {
    if (this.isRunning) {
      console.log('RSS Aggregation Service: Already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('RSS Aggregation Service: Starting aggregation run');

    try {
      // Get feeds that need updating
      const feedsToUpdate = this.getFeedsToUpdate(frequency);
      
      this.stats.totalFeeds = feedsToUpdate.length;
      this.stats.activeFeeds = feedsToUpdate.filter(feed => feed.is_active && feed.auto_import).length;
      this.stats.lastRun = new Date().toISOString();
      this.stats.totalImported = 0;
      this.stats.totalErrors = 0;

      console.log(`RSS Aggregation Service: Found ${this.stats.activeFeeds} feeds to process`);

      // Process each feed
      for (const feed of feedsToUpdate) {
        if (!feed.is_active || !feed.auto_import) {
          console.log(`Skipping inactive or non-auto-import feed: ${feed.name}`);
          continue;
        }

        try {
          console.log(`Processing RSS feed: ${feed.name} (${feed.url})`);
          
          // Parse RSS feed
          const parsedFeed = await RSSParserService.parseRSSFeed(feed.url, feed.id);
          if (!parsedFeed) {
            console.error(`Failed to parse RSS feed: ${feed.name}`);
            this.stats.totalErrors++;
            continue;
          }

          // Import items
          const importResult = await RSSParserService.importRSSItems(parsedFeed.items, feed);
          
          this.stats.totalImported += importResult.imported;
          this.stats.totalErrors += importResult.errors;

          console.log(`RSS feed ${feed.name}: ${importResult.imported} imported, ${importResult.skipped} skipped, ${importResult.errors} errors`);

          // Update last_fetched timestamp
          this.updateLastFetched(feed.id);

        } catch (error) {
          console.error(`Error processing RSS feed ${feed.name}:`, error);
          this.stats.totalErrors++;
        }

        // Add delay between feeds to avoid overwhelming servers
        await this.delay(2000); // 2 second delay
      }

      console.log(`RSS Aggregation Service: Completed. Imported ${this.stats.totalImported} items with ${this.stats.totalErrors} errors`);

    } catch (error) {
      console.error('RSS Aggregation Service: Error during aggregation run:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get feeds that need updating based on their update frequency
   */
  private getFeedsToUpdate(frequency?: string): RSSFeed[] {
    let query = `
      SELECT * FROM rss_feeds 
      WHERE is_active = 1 AND auto_import = 1
    `;
    
    const params: any[] = [];

    if (frequency) {
      query += ` AND update_frequency = ?`;
      params.push(frequency);
    } else {
      // For hourly checks, get feeds that haven't been updated recently
      query += ` AND (
        last_fetched IS NULL OR 
        (update_frequency = 'hourly' AND datetime(last_fetched, '+1 hour') <= datetime('now')) OR
        (update_frequency = 'daily' AND datetime(last_fetched, '+6 hours') <= datetime('now')) OR
        (update_frequency = 'weekly' AND datetime(last_fetched, '+1 day') <= datetime('now'))
      )`;
    }

    query += ` ORDER BY last_fetched ASC NULLS FIRST`;

    const stmt = db.prepare(query);
    return stmt.all(...params) as RSSFeed[];
  }

  /**
   * Update last_fetched timestamp for a feed
   */
  private updateLastFetched(feedId: number): void {
    const stmt = db.prepare('UPDATE rss_feeds SET last_fetched = datetime("now") WHERE id = ?');
    stmt.run(feedId);
  }

  /**
   * Add delay between operations
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Manually trigger aggregation for all active feeds
   */
  async runManualAggregation(): Promise<AggregationStats> {
    await this.runAggregation();
    return this.getStats();
  }

  /**
   * Manually trigger aggregation for a specific feed
   */
  async manualAggregation(feedId: number): Promise<any> {
    try {
      console.log(`Manual aggregation triggered for feed ID: ${feedId}`);

      // Get the specific feed
      const stmt = db.prepare('SELECT * FROM rss_feeds WHERE id = ? AND is_active = 1');
      const feed = stmt.get(feedId) as RSSFeed | undefined;

      if (!feed) {
        throw new Error('Feed not found or not active');
      }

      console.log(`Manual aggregation for feed: ${feed.name}`);

      // Parse RSS feed
      const parsedFeed = await RSSParserService.parseRSSFeed(feed.url, feed.id);
      if (!parsedFeed) {
        throw new Error('Failed to parse RSS feed');
      }

      // Import items
      const importResult = await RSSParserService.importRSSItems(parsedFeed.items, feed);
      
      // Update last_fetched timestamp
      this.updateLastFetched(feed.id);

      console.log(`Manual aggregation completed for ${feed.name}: ${importResult.imported} imported, ${importResult.skipped} skipped, ${importResult.errors} errors`);

      return importResult;

    } catch (error) {
      console.error(`Error in manual feed aggregation:`, error);
      return null;
    }
  }

  /**
   * Get current aggregation statistics
   */
  getStats(): AggregationStats {
    // Update real-time stats
    const totalFeeds = db.prepare('SELECT COUNT(*) as count FROM rss_feeds').get() as { count: number };
    const activeFeeds = db.prepare('SELECT COUNT(*) as count FROM rss_feeds WHERE is_active = 1 AND auto_import = 1').get() as { count: number };

    return {
      ...this.stats,
      totalFeeds: totalFeeds.count,
      activeFeeds: activeFeeds.count
    };
  }

  /**
   * Check if aggregation service is currently running
   */
  isAggregationRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get feeds that are due for update
   */
  getFeedsDueForUpdate(): any[] {
    return this.getFeedsToUpdate();
  }

  /**
   * Get recent aggregation logs (if implemented with logging table)
   */
  getRecentLogs(limit: number = 50): any[] {
    // This would require a logs table - for now return empty array
    // In production, you might want to implement proper logging
    return [];
  }

  /**
   * Start the aggregation service
   */
  start(): void {
    console.log('RSS Aggregation Service: Started');
  }

  /**
   * Stop the aggregation service
   */
  stop(): void {
    console.log('RSS Aggregation Service: Stopped');
    // Note: cron jobs will continue running, but manual operations will be disabled
  }
}

// Initialize and export singleton instance
const aggregationService = RSSAggregationService.getInstance();
export default aggregationService;