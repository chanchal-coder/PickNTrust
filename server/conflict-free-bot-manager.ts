// Conflict-Free Bot Manager
// Prevents 409 polling conflicts across all Telegram bots

import { botLockManager } from './bot-lock-manager.js';

interface BotConfig {
  name: string;
  token: string;
  channelId: string;
  initializeFunction: () => Promise<void>;
  shutdownFunction: () => Promise<void>;
}

class ConflictFreeBotManager {
  private bots = new Map<string, BotConfig>();
  private runningBots = new Set<string>();
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;
  private retryDelay = 10000; // 10 seconds

  registerBot(config: BotConfig): void {
    this.bots.set(config.name, config);
    console.log(`📋 Registered bot: ${config.name}`);
  }

  async initializeBot(botName: string): Promise<boolean> {
    const config = this.bots.get(botName);
    if (!config) {
      console.error(`❌ Bot ${botName} not registered`);
      return false;
    }

    if (this.runningBots.has(botName)) {
      console.log(`ℹ️ Bot ${botName} already running`);
      return true;
    }

    try {
      // Acquire lock first
      const lockAcquired = await botLockManager.acquireLock(botName, config.token);
      if (!lockAcquired) {
        console.error(`❌ Could not acquire lock for ${botName} - another instance running`);
        return false;
      }

      // Initialize the bot
      await config.initializeFunction();
      this.runningBots.add(botName);
      this.retryAttempts.delete(botName);
      
      console.log(`✅ Bot ${botName} initialized successfully`);
      return true;

    } catch (error: any) {
      console.error(`❌ Failed to initialize ${botName}:`, error.message);
      
      // Release lock on failure
      await botLockManager.releaseLock(botName);
      
      // Handle 409 conflicts with retry logic
      if (error.message.includes('409') || error.message.includes('conflict')) {
        await this.handleBotConflict(botName);
      }
      
      return false;
    }
  }

  async shutdownBot(botName: string): Promise<void> {
    const config = this.bots.get(botName);
    if (!config) {
      console.error(`❌ Bot ${botName} not registered`);
      return;
    }

    if (!this.runningBots.has(botName)) {
      console.log(`ℹ️ Bot ${botName} not running`);
      return;
    }

    try {
      await config.shutdownFunction();
      this.runningBots.delete(botName);
      await botLockManager.releaseLock(botName);
      
      console.log(`✅ Bot ${botName} shutdown successfully`);
    } catch (error) {
      console.error(`❌ Error shutting down ${botName}:`, error);
      // Force cleanup
      this.runningBots.delete(botName);
      await botLockManager.releaseLock(botName);
    }
  }

  async initializeAllBots(): Promise<void> {
    console.log('🚀 Initializing all registered bots with conflict prevention...');
    
    const botNames = Array.from(this.bots.keys());
    const results = await Promise.allSettled(
      botNames.map(name => this.initializeBot(name))
    );

    let successCount = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        successCount++;
      }
    });

    console.log(`📊 Bot initialization complete: ${successCount}/${botNames.length} bots started`);
  }

  async shutdownAllBots(): Promise<void> {
    console.log('🔄 Shutting down all bots...');
    
    const runningBotNames = Array.from(this.runningBots);
    await Promise.allSettled(
      runningBotNames.map(name => this.shutdownBot(name))
    );

    console.log('✅ All bots shutdown complete');
  }

  private async handleBotConflict(botName: string): Promise<void> {
    const attempts = this.retryAttempts.get(botName) || 0;
    
    if (attempts >= this.maxRetries) {
      console.error(`❌ Max retry attempts reached for ${botName}`);
      return;
    }

    this.retryAttempts.set(botName, attempts + 1);
    
    console.log(`🔄 Conflict detected for ${botName}, retrying in ${this.retryDelay/1000}s (attempt ${attempts + 1}/${this.maxRetries})`);
    
    setTimeout(async () => {
      await this.initializeBot(botName);
    }, this.retryDelay);
  }

  getBotStatus(): { [botName: string]: { running: boolean; hasLock: boolean } } {
    const status: { [botName: string]: { running: boolean; hasLock: boolean } } = {};
    const lockStatus = botLockManager.getLockStatus();
    
    this.bots.forEach((config, name) => {
      status[name] = {
        running: this.runningBots.has(name),
        hasLock: name in lockStatus
      };
    });
    
    return status;
  }

  async restartBot(botName: string): Promise<boolean> {
    console.log(`🔄 Restarting bot: ${botName}`);
    
    await this.shutdownBot(botName);
    
    // Wait a moment before restarting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return await this.initializeBot(botName);
  }

  setupGlobalCleanup(): void {
    const cleanup = async () => {
      console.log('🔄 Global bot cleanup initiated...');
      await this.shutdownAllBots();
    };

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', async (error) => {
      console.error('Global uncaught exception, cleaning up bots:', error);
      await cleanup();
      process.exit(1);
    });
  }
}

// Singleton instance
export const conflictFreeBotManager = new ConflictFreeBotManager();
export default conflictFreeBotManager;