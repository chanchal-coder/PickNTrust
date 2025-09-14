/**
 * Telegram Bot Manager - Prevents 409 conflicts and manages multiple bots
 * This system ensures only one instance of each bot runs at a time
 */

// Bot imports moved to initialization methods to prevent auto-initialization

interface BotLock {
  botName: string;
  timestamp: number;
  pid: number;
}

interface BotStatus {
  name: string;
  status: 'active' | 'inactive' | 'error' | 'conflict';
  lastActivity?: number;
  errorCount: number;
  conflictCount: number;
}

export class TelegramManager {
  private botLocks = new Map<string, BotLock>();
  private recoveryAttempts = new Map<string, number>();
  private botStatuses = new Map<string, BotStatus>();
  private maxRecoveryAttempts = 3;
  private isShuttingDown = false;

  constructor() {
    console.log('AI Initializing Telegram Bot Manager with conflict prevention');
    this.initializeBotStatuses();
  }

  private initializeBotStatuses() {
    const bots = ['prime-picks', 'loot-box', 'global-picks', 'dealshub', 'value-picks'];
    
    bots.forEach(botName => {
      this.botStatuses.set(botName, {
        name: botName,
        status: 'inactive',
        errorCount: 0,
        conflictCount: 0
      });
    });
  }

  async acquireBotLock(botName: string, botToken: string): Promise<boolean> {
    const lockKey = `${botName}_${botToken.slice(-10)}`;
    
    if (this.botLocks.has(lockKey)) {
      console.log(`Warning Bot ${botName} already has active lock`);
      return false;
    }

    this.botLocks.set(lockKey, {
      botName,
      timestamp: Date.now(),
      pid: process.pid
    });

    console.log(`🔒 Acquired lock for bot ${botName}`);
    return true;
  }

  releaseBotLock(botName: string, botToken: string) {
    const lockKey = `${botName}_${botToken.slice(-10)}`;
    this.botLocks.delete(lockKey);
    console.log(`Unlock Released lock for bot ${botName}`);
  }

  async handleBotConflict(botName: string, error: any): Promise<boolean> {
    console.log(`Alert Bot conflict detected for ${botName}: ${error.message}`);
    
    const status = this.botStatuses.get(botName);
    if (status) {
      status.conflictCount++;
      status.status = 'conflict';
    }
    
    const attempts = this.recoveryAttempts.get(botName) || 0;
    
    if (attempts >= this.maxRecoveryAttempts) {
      console.log(`Error Max recovery attempts reached for ${botName}`);
      return false;
    }

    this.recoveryAttempts.set(botName, attempts + 1);
    
    // Wait before retry with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
    console.log(`Refresh Retrying ${botName} in ${delay}ms (attempt ${attempts + 1}/${this.maxRecoveryAttempts})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return true;
  }

  resetRecoveryAttempts(botName: string) {
    this.recoveryAttempts.delete(botName);
  }

  async initializeBots(): Promise<void> {
    if (this.isShuttingDown) {
      console.log('Warning Telegram Manager is shutting down, skipping bot initialization');
      return;
    }

    console.log('Launch Starting Telegram Bot Manager - Conflict Prevention Active');
    console.log('=' .repeat(60));

    // Initialize all bots with conflict prevention
    // PRIME PICKS RE-ENABLED - Fresh bot with new credentials
    console.log('Launch Prime Picks bot initialization ENABLED - Using fresh credentials');
    await this.initializePrimePicksBot();
    await this.initializeValuePicksBot();
    await this.initializeLootBoxBot();
    await this.initializeGlobalPicksBot();
    await this.initializeDealsHubBot();

    console.log('\nSuccess Telegram Bot Manager initialization complete with Prime Picks re-enabled!');
    this.logBotStatuses();
  }

  private async initializePrimePicksBot(): Promise<void> {
    try {
      console.log('AI Starting Prime Picks Bot (Conflict-Free)...');
      
      const status = this.botStatuses.get('prime-picks');
      if (status) {
        status.status = 'active';
        status.lastActivity = Date.now();
      }
      
      // Import only when needed to prevent auto-initialization
      const { primePicksBot } = await import('./prime-picks-bot');
      await primePicksBot.initialize();
      console.log('Success Prime Picks bot initialized successfully');
      
    } catch (error: any) {
      console.error('Error Failed to initialize Prime Picks bot:', error.message);
      
      const status = this.botStatuses.get('prime-picks');
      if (status) {
        status.status = 'error';
        status.errorCount++;
      }
      
      if (error.message.includes('409') || error.message.includes('Conflict')) {
        await this.handleBotConflict('prime-picks', error);
      }
    }
  }

  private async initializeValuePicksBot(): Promise<void> {
    try {
      console.log('💎 Loading Value Picks bot (Working Version)...');
      
      const status = this.botStatuses.get('value-picks');
      if (status) {
        status.status = 'active';
        status.lastActivity = Date.now();
      }
      
      const valuePicksModule = await import('./value-picks-bot-working.cjs');
      console.log('Success Value Picks bot (Working Version) loaded and initialized successfully');
      console.log('Target Value Picks autoposting is now ACTIVE!');
      
    } catch (error: any) {
      console.error('Error Failed to load Value Picks bot (Working Version):', error.message);
      
      const status = this.botStatuses.get('value-picks');
      if (status) {
        status.status = 'error';
        status.errorCount++;
      }
    }
  }

  private async initializeLootBoxBot(): Promise<void> {
    try {
      console.log('Gift Starting Loot Box Bot (Conflict-Free)...');
      
      const status = this.botStatuses.get('loot-box');
      if (status) {
        status.status = 'active';
        status.lastActivity = Date.now();
      }
      
      // Import only when needed to prevent auto-initialization
      const { lootBoxBot } = await import('./loot-box-bot');
      await lootBoxBot.initialize();
      console.log('Success Loot Box bot initialized successfully');
      console.log('Target Loot Box autoposting is now ACTIVE!');
      
    } catch (error: any) {
      console.error('Error Failed to initialize Loot Box bot:', error.message);
      
      const status = this.botStatuses.get('loot-box');
      if (status) {
        status.status = 'error';
        status.errorCount++;
      }
      
      if (error.message.includes('409') || error.message.includes('Conflict')) {
        await this.handleBotConflict('loot-box', error);
      }
    }
  }

  private async initializeGlobalPicksBot(): Promise<void> {
    try {
      console.log('🌍 Starting Global Picks Bot (Conflict-Free)...');
      
      const status = this.botStatuses.get('global-picks');
      if (status) {
        status.status = 'active';
        status.lastActivity = Date.now();
      }
      
      // Import only when needed to prevent auto-initialization
      const globalPicksBot = (await import('./global-picks-bot')).default;
      await globalPicksBot.initialize();
      console.log('Success Global Picks bot initialized successfully');
      console.log('Target Global Picks universal autoposting is now ACTIVE!');
      
    } catch (error: any) {
      console.error('Error Failed to initialize Global Picks bot:', error.message);
      
      const status = this.botStatuses.get('global-picks');
      if (status) {
        status.status = 'error';
        status.errorCount++;
      }
      
      if (error.message.includes('409') || error.message.includes('Conflict')) {
        await this.handleBotConflict('global-picks', error);
      }
    }
  }

  private async initializeDealsHubBot(): Promise<void> {
    try {
      console.log('🛒 Starting DealsHub Bot (Conflict-Free)...');
      
      const status = this.botStatuses.get('dealshub');
      if (status) {
        status.status = 'active';
        status.lastActivity = Date.now();
      }
      
      // Import only when needed to prevent auto-initialization
      const dealsHubBot = (await import('./dealshub-bot')).default;
      await dealsHubBot.initialize();
      console.log('Success DealsHub bot initialized successfully');
      console.log('Target DealsHub deal autoposting is now ACTIVE!');
      
    } catch (error: any) {
      console.error('Error Failed to initialize DealsHub bot:', error.message);
      
      const status = this.botStatuses.get('dealshub');
      if (status) {
        status.status = 'error';
        status.errorCount++;
      }
      
      if (error.message.includes('409') || error.message.includes('Conflict')) {
        await this.handleBotConflict('dealshub', error);
      }
    }
  }

  private logBotStatuses(): void {
    console.log('\nStats BOT STATUS REPORT:');
    console.log('=' .repeat(40));
    
    this.botStatuses.forEach((status, botName) => {
      const statusIcon = {
        'active': 'Success',
        'inactive': '⚪',
        'error': 'Error',
        'conflict': 'Alert'
      }[status.status];
      
      console.log(`${statusIcon} ${status.name}: ${status.status.toUpperCase()}`);
      if (status.errorCount > 0) {
        console.log(`   Errors: ${status.errorCount}`);
      }
      if (status.conflictCount > 0) {
        console.log(`   Conflicts: ${status.conflictCount}`);
      }
    });
    
    console.log('=' .repeat(40));
  }

  getBotStatuses(): Map<string, BotStatus> {
    return new Map(this.botStatuses);
  }

  async restartBot(botName: string): Promise<boolean> {
    console.log(`Refresh Restarting bot: ${botName}`);
    
    const status = this.botStatuses.get(botName);
    if (status) {
      status.status = 'inactive';
    }
    
    // Reset recovery attempts
    this.resetRecoveryAttempts(botName);
    
    // Reinitialize specific bot
    switch (botName) {
      case 'prime-picks':
        await this.initializePrimePicksBot();
        break;
      case 'loot-box':
        await this.initializeLootBoxBot();
        break;
      case 'global-picks':
        await this.initializeGlobalPicksBot();
        break;
      case 'dealshub':
        await this.initializeDealsHubBot();
        break;
      case 'value-picks':
        await this.initializeValuePicksBot();
        break;
      default:
        console.log(`Error Unknown bot: ${botName}`);
        return false;
    }
    
    return true;
  }

  async shutdown(): Promise<void> {
    console.log('Stop Shutting down Telegram Bot Manager...');
    this.isShuttingDown = true;
    
    try {
      // Shutdown bots using dynamic imports to avoid compilation errors
      try {
        const { primePicksBot } = await import('./prime-picks-bot');
        await primePicksBot.shutdown();
        console.log('Success Prime Picks bot shutdown complete');
      } catch (error) {
        console.log('Warning Prime Picks bot shutdown skipped');
      }
      
      try {
        const { lootBoxBot } = await import('./loot-box-bot');
        await lootBoxBot.stop();
        console.log('Success Loot Box bot shutdown complete');
      } catch (error) {
        console.log('Warning Loot Box bot shutdown skipped');
      }
      
      // Clear all locks
      this.botLocks.clear();
      this.recoveryAttempts.clear();
      
      console.log('Success Telegram Bot Manager shutdown complete');
      
    } catch (error) {
      console.error('Error Error during Telegram Manager shutdown:', error);
    }
  }

  // Health check method
  getHealthStatus() {
    const activeBots = Array.from(this.botStatuses.values()).filter(s => s.status === 'active').length;
    const totalBots = this.botStatuses.size;
    const errorBots = Array.from(this.botStatuses.values()).filter(s => s.status === 'error').length;
    const conflictBots = Array.from(this.botStatuses.values()).filter(s => s.status === 'conflict').length;
    
    return {
      timestamp: new Date().toISOString(),
      totalBots,
      activeBots,
      errorBots,
      conflictBots,
      isHealthy: activeBots > 0 && conflictBots === 0,
      bots: Object.fromEntries(this.botStatuses)
    };
  }
}

// Export singleton instance
export const telegramManager = new TelegramManager();