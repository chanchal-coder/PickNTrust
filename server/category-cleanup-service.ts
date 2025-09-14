import { CategoryManager } from './category-manager';

/**
 * CategoryCleanupService - Background service for category maintenance
 * Handles automatic cleanup of expired products and empty categories
 * Runs periodically to maintain category integrity
 */
export class CategoryCleanupService {
  private static instance: CategoryCleanupService;
  private categoryManager: CategoryManager;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  
  constructor() {
    this.categoryManager = CategoryManager.getInstance();
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
      
      // Clean up expired products from categories
      await this.categoryManager.cleanupExpiredProducts();
      
      // Get updated category statistics
      const stats = await this.categoryManager.getCategoryStats();
      
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
      
      // Clean up expired products
      await this.categoryManager.cleanupExpiredProducts();
      
      // Get statistics
      const stats = await this.categoryManager.getCategoryStats();
      
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