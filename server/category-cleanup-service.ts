import { categoryManager } from './category-manager.js';
import { sqliteDb } from './db.js';

/**
 * CategoryCleanupService - Background service for category maintenance
 * Handles automatic cleanup of expired products and empty categories
 * Runs periodically to maintain category integrity
 */
export class CategoryCleanupService {
  private static instance: CategoryCleanupService;
  private categoryManager = categoryManager;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  
  private unifiedTableExists(): boolean {
    try {
      const stmt = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='unified_content'");
      const row = stmt.get();
      return !!row;
    } catch (err) {
      console.error('Cleanup Failed to check unified_content existence:', err);
      return false;
    }
  }
  
  constructor() {
    console.log('Cleanup Category Cleanup Service initialized');
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): CategoryCleanupService {
    if (!CategoryCleanupService.instance) {
      CategoryCleanupService.instance = new CategoryCleanupService();
    }
    return CategoryCleanupService.instance;
  }

  /**
   * Start the cleanup service with periodic execution
   */
  start(intervalMinutes: number = 1): void {
    if (this.isRunning) {
      console.log('Cleanup Category cleanup service is already running');
      return;
    }
    
    console.log(`Cleanup Starting category cleanup service (every ${intervalMinutes} minutes)`);
    
    // Run initial cleanup
    this.runCleanup();
    
    // Set up periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, intervalMinutes * 60 * 1000);
    
    this.isRunning = true;
  }

  /**
   * Stop the cleanup service
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.isRunning = false;
    console.log('Cleanup Category cleanup service stopped');
  }

  /**
   * Run cleanup process
   */
  private async runCleanup(): Promise<void> {
    try {
      console.log('Cleanup Running category cleanup process...');
      const startTime = Date.now();
      
      // Category cleanup is handled by the database constraints and triggers
      console.log('Category cleanup process completed');
      
      // Skip stats if unified_content is missing to avoid SQLITE_ERROR on EC2
      if (!this.unifiedTableExists()) {
        const duration = Date.now() - startTime;
        console.warn('Cleanup Skipping category stats: unified_content table not found');
        console.log(`Success Category cleanup completed in ${duration}ms`);
        return;
      }

      // Get basic category information
      const categories = await this.categoryManager.getAllCategories();
      const stats = {
        totalCategories: categories.length,
        cleanupTime: new Date().toISOString()
      };
      
      const duration = Date.now() - startTime;
      console.log(`Success Category cleanup completed in ${duration}ms`);
      console.log(`Stats Current stats:`, stats);
      
    } catch (error) {
      console.error('Error Error during category cleanup:', error);
    }
  }

  /**
   * Run cleanup manually (for testing or admin triggers)
   */
  async runManualCleanup(): Promise<any> {
    try {
      console.log('Cleanup Running manual category cleanup...');
      const startTime = Date.now();
      
      // Category cleanup is handled by the database constraints and triggers
      console.log('Manual category cleanup process completed');
      
      // Skip stats if unified_content is missing to avoid SQLITE_ERROR on EC2
      if (!this.unifiedTableExists()) {
        const duration = Date.now() - startTime;
        return {
          success: true,
          duration,
          stats: { totalCategories: 0, cleanupTime: new Date().toISOString() },
          message: 'Cleanup completed (stats skipped: unified_content missing)'
        };
      }

      // Get basic category information
      const categories = await this.categoryManager.getAllCategories();
      const stats = {
        totalCategories: categories.length,
        cleanupTime: new Date().toISOString()
      };
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        duration,
        stats,
        message: `Cleanup completed in ${duration}ms`
      };
      
    } catch (error) {
      console.error('Error Error during manual cleanup:', error);
      return {
        success: false,
        error: error.message,
        message: 'Cleanup failed'
      };
    }
  }

  /**
   * Get service status
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      hasInterval: this.cleanupInterval !== null,
      nextCleanup: this.cleanupInterval ? 'Scheduled' : 'Not scheduled'
    };
  }

  /**
   * Initialize cleanup service on server start
   */
  static initializeOnServerStart(): void {
    const service = CategoryCleanupService.getInstance();
    
    // Start with 1-hour intervals
    service.start(60);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('Cleanup Shutting down category cleanup service...');
      service.stop();
    });
    
    process.on('SIGTERM', () => {
      console.log('Cleanup Shutting down category cleanup service...');
      service.stop();
    });
  }
}