/**
 * Enhanced Telegram Manager - Supports 8 bots with method selection
 * Real bot configurations with actual tokens and affiliate tags
 */

import Database from 'better-sqlite3';

interface BotLock {
  botName: string;
  timestamp: number;
  pid: number;
}

interface BotStatus {
  name: string;
  displayName: string;
  status: 'active' | 'inactive' | 'error' | 'conflict';
  lastActivity?: number;
  errorCount: number;
  conflictCount: number;
  currentMethod?: 'telegram' | 'scraping' | 'api';
  methodsAvailable: string[];
  performance: {
    dealsProcessed: number;
    successRate: number;
    avgResponseTime: number;
  };
}

interface BotConfig {
  botName: string;
  displayName: string;
  isEnabled: boolean;
  tableName: string;
  affiliateNetwork: string;
  botToken?: string;
  channelId?: string;
  channelName?: string;
  affiliateTag?: string;
  methods: {
    telegram: { enabled: boolean; priority: number };
    scraping: { enabled: boolean; priority: number };
    api: { enabled: boolean; priority: number; apiKey?: string };
  };
}

class EnhancedTelegramManager {
  private botLocks = new Map<string, BotLock>();
  private recoveryAttempts = new Map<string, number>();
  private botStatuses = new Map<string, BotStatus>();
  private botConfigs = new Map<string, BotConfig>();
  private maxRecoveryAttempts = 3;
  private isShuttingDown = false;
  private db: Database.Database;

  constructor() {
    console.log('Launch Initializing Enhanced Telegram Manager (8-Bot System)');
    this.db = new Database('database.sqlite');
    this.initializeBotConfigurations();
    this.initializeBotStatuses();
  }

  private initializeBotConfigurations() {
    const configs: BotConfig[] = [
      {
        botName: 'prime-picks',
        displayName: 'Prime Picks Bot',
        isEnabled: true,
        tableName: 'amazon_products',
        affiliateNetwork: 'amazon',
        botToken: '8260140807:AAEy6I9xxtYbvddJKDNfRwmcIWDX1Y9pck4',
        channelId: '-1002955338551',
        channelName: 'pntamazon',
        affiliateTag: '{{URL}}{{SEP}}tag=pickntrust03-21',
        methods: {
          telegram: { enabled: true, priority: 1 },
          scraping: { enabled: true, priority: 2 },
          api: { enabled: true, priority: 3 }
        }
      },
      {
        botName: 'cue-picks',
        displayName: 'Cue Picks Bot',
        isEnabled: true,
        tableName: 'cuelinks_products',
        affiliateNetwork: 'cuelinks',
        botToken: '8352384812:AAE-bwA_3zIB8ZnPG4ZmyEbREBlfijjE32I',
        channelId: '-1002982344997',
        channelName: 'Cuelinks PNT',
        affiliateTag: 'https://linksredirect.com/?cid=243942&source=linkkit&url={{URL_ENC}}',
        methods: {
          telegram: { enabled: true, priority: 1 },
          scraping: { enabled: true, priority: 2 },
          api: { enabled: true, priority: 3 }
        }
      },
      {
        botName: 'value-picks',
        displayName: 'Value Picks Bot',
        isEnabled: true,
        tableName: 'value_picks_products',
        affiliateNetwork: 'earnkaro',
        botToken: '8293858742:AAGDnH8aN5e-JOvhLQNCR_rWEOicOPji41A',
        channelId: '-1003017626269',
        channelName: 'Value Picks EK',
        affiliateTag: 'https://ekaro.in/enkr2020/?url={{URL_ENC}}&ref=4530348',
        methods: {
          telegram: { enabled: true, priority: 1 },
          scraping: { enabled: true, priority: 2 },
          api: { enabled: false, priority: 3 }
        }
      },
      {
        botName: 'click-picks',
        displayName: 'Click Picks Bot (Smart)',
        isEnabled: true,
        tableName: 'click_picks_products',
        affiliateNetwork: 'multi-cpc',
        botToken: '8077836519:AAGoSql-Fz9lF_90AKxobprROub89VVKePg',
        channelId: '-1002981205504',
        channelName: 'Click Picks',
        affiliateTag: 'multiple',
        methods: {
          telegram: { enabled: true, priority: 1 },
          scraping: { enabled: true, priority: 2 },
          api: { enabled: false, priority: 3 }
        }
      },
      {
        botName: 'global-picks',
        displayName: 'Global Picks Bot (Smart)',
        isEnabled: true,
        tableName: 'global_picks_products',
        affiliateNetwork: 'global-multi',
        botToken: '8341930611:AAHq7sS4Sk6HKoyfUGYwYWHwXZrGOgeWx-E',
        channelId: '-1002902496654',
        channelName: 'Global Picks',
        affiliateTag: 'multiple',
        methods: {
          telegram: { enabled: true, priority: 1 },
          scraping: { enabled: true, priority: 2 },
          api: { enabled: false, priority: 3 }
        }
      },
      {
        botName: 'travel-picks',
        displayName: 'Travel Picks Bot (Smart)',
        isEnabled: true,
        tableName: 'travel_products',
        affiliateNetwork: 'travel-multi',
        botToken: '7998139680:AAGVKECApmHNi4LMp2wR3UdVFfYgkT1HwZo',
        channelId: '-1003047967930',
        channelName: 'Travel Picks',
        affiliateTag: 'multiple',
        methods: {
          telegram: { enabled: true, priority: 1 },
          scraping: { enabled: true, priority: 2 },
          api: { enabled: false, priority: 3 }
        }
      },
      {
        botName: 'dealshub',
        displayName: 'DealsHub Bot',
        isEnabled: true,
        tableName: 'deals_hub_products',
        affiliateNetwork: 'inrdeals',
        botToken: '8292764619:AAEkfPXIsgNh1JC3n2p6VYo27V-EHepzmBo',
        channelId: '-1003029983162',
        channelName: 'Dealshub PNT',
        affiliateTag: 'id=sha678089037',
        methods: {
          telegram: { enabled: true, priority: 1 },
          scraping: { enabled: true, priority: 2 },
          api: { enabled: false, priority: 3 }
        }
      },
      {
        botName: 'lootbox',
        displayName: 'Loot Box Bot',
        isEnabled: true,
        tableName: 'lootbox_products',
        affiliateNetwork: 'deodap',
        botToken: '8141266952:AAEosdwI8BkIpSk0f1AVzn8l4iwRnS8HXFQ',
        channelId: '-1002991047787',
        channelName: 'Deodap pnt',
        affiliateTag: '{{URL}}{{SEP}}ref=sicvppak',
        methods: {
          telegram: { enabled: true, priority: 1 },
          scraping: { enabled: true, priority: 2 },
          api: { enabled: false, priority: 3 }
        }
      }
    ];

    configs.forEach(config => {
      this.botConfigs.set(config.botName, config);
    });

    console.log(`Success Configured ${configs.length} bots with real tokens and affiliate tags`);
  }

  private initializeBotStatuses() {
    for (const [botName, config] of this.botConfigs.entries()) {
      const methodsAvailable = [];
      
      if (config.methods.telegram.enabled) methodsAvailable.push('telegram');
      if (config.methods.scraping.enabled) methodsAvailable.push('scraping');
      if (config.methods.api.enabled) methodsAvailable.push('api');
      
      this.botStatuses.set(botName, {
        name: botName,
        displayName: config.displayName,
        status: 'inactive',
        errorCount: 0,
        conflictCount: 0,
        methodsAvailable,
        performance: {
          dealsProcessed: 0,
          successRate: 0,
          avgResponseTime: 0
        }
      });
    }
  }

  async initializeBots(): Promise<void> {
    if (this.isShuttingDown) {
      console.log('Warning Enhanced Telegram Manager is shutting down, skipping bot initialization');
      return;
    }

    console.log('Launch Starting Enhanced Telegram Manager - 8-Bot System with Method Selection');
    console.log('=' .repeat(80));

    const enabledBots = Array.from(this.botConfigs.entries())
      .filter(([_, config]) => config.isEnabled);

    console.log(`AI Initializing ${enabledBots.length} enabled bots...`);

    for (const [botName, config] of enabledBots) {
      await this.initializeSingleBot(botName, config);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\nSuccess Enhanced Telegram Manager initialization complete!');
    this.logBotStatuses();
  }

  private async initializeSingleBot(botName: string, config: BotConfig): Promise<void> {
    try {
      console.log(`\nAI Starting ${config.displayName}...`);
      
      const status = this.botStatuses.get(botName);
      if (status) {
        status.status = 'active';
        status.lastActivity = Date.now();
      }

      const preferredMethod = this.getPreferredMethod(config);
      if (status) {
        status.currentMethod = preferredMethod;
      }

      console.log(`   Stats Methods: ${status?.methodsAvailable.join(', ')}`);
      console.log(`   Target Using: ${preferredMethod}`);
      console.log(`   🗄️ Table: ${config.tableName}`);
      console.log(`   Link Network: ${config.affiliateNetwork}`);
      
      // Actually initialize the real Telegram bot
      if (preferredMethod === 'telegram' && config.botToken && config.channelId) {
        await this.initializeRealTelegramBot(botName, config);
      }
      
      console.log(`   Success ${config.displayName} initialized successfully`);
      
    } catch (error: any) {
      console.error(`Error Failed to initialize ${botName}:`, error.message);
      
      const status = this.botStatuses.get(botName);
      if (status) {
        status.status = 'error';
        status.errorCount++;
      }
    }
  }

  private async initializeRealTelegramBot(botName: string, config: BotConfig): Promise<void> {
    try {
      // Import the actual bot implementation based on bot name
      let botModule;
      
      switch (botName) {
        case 'prime-picks':
          botModule = await import('./prime-picks-bot');
          if (botModule.initializePrimePicksBot) {
            await botModule.initializePrimePicksBot();
            console.log(`   Link Prime Picks bot connected to Telegram`);
          }
          break;
          
        case 'cue-picks':
          botModule = await import('./cue-picks-bot');
          if (botModule.initializeCuePicksBot) {
            await botModule.initializeCuePicksBot();
            console.log(`   Link Cue Picks bot connected to Telegram`);
          }
          break;
          
        case 'value-picks':
          botModule = await import('./value-picks-bot');
          if (botModule.initializeValuePicksBot) {
            await botModule.initializeValuePicksBot();
            console.log(`   Link Value Picks bot connected to Telegram`);
          }
          break;
          
        case 'lootbox':
          botModule = await import('./loot-box-bot');
          if (botModule.initializeLootBoxBot) {
            await botModule.initializeLootBoxBot();
            console.log(`   Link Loot Box bot connected to Telegram`);
          }
          break;
          
        case 'dealshub':
          botModule = await import('./dealshub-bot');
          if (botModule.initializeDealsHubBot) {
            await botModule.initializeDealsHubBot();
            console.log(`   Link DealsHub bot connected to Telegram`);
          }
          break;
          
        case 'global-picks':
          botModule = await import('./global-picks-bot');
          if (botModule.initializeGlobalPicksBot) {
            await botModule.initializeGlobalPicksBot();
            console.log(`   Link Global Picks bot connected to Telegram`);
          }
          break;
          
        case 'travel-picks':
          botModule = await import('./travel-picks-bot');
          if (botModule.initializeTravelPicksBot) {
            await botModule.initializeTravelPicksBot();
            console.log(`   Link Travel Picks bot connected to Telegram`);
          }
          break;
          
        case 'click-picks':
          botModule = await import('./click-picks-bot');
          if (botModule.initializeClickPicksBot) {
            await botModule.initializeClickPicksBot();
            console.log(`   Link Click Picks bot connected to Telegram`);
          }
          break;
          
        default:
          console.log(`   Warning Unknown bot: ${botName}`);
      }
      
    } catch (error) {
      console.error(`   Error Error connecting ${botName} to Telegram:`, error);
      throw error;
    }
  }

  private getPreferredMethod(config: BotConfig): 'telegram' | 'scraping' | 'api' {
    const enabledMethods = Object.entries(config.methods)
      .filter(([_, methodConfig]) => methodConfig.enabled)
      .sort((a, b) => a[1].priority - b[1].priority);

    return (enabledMethods[0]?.[0] as 'telegram' | 'scraping' | 'api') || 'telegram';
  }

  private logBotStatuses(): void {
    console.log('\nStats Enhanced Bot Status Summary:');
    console.log('=' .repeat(80));
    
    for (const [botName, status] of this.botStatuses.entries()) {
      const config = this.botConfigs.get(botName);
      const statusIcon = {
        'active': '🟢',
        'inactive': '⚪',
        'error': '🔴',
        'conflict': '🟡'
      }[status.status];
      
      console.log(`${statusIcon} ${status.displayName}`);
      console.log(`   Status: ${status.status.toUpperCase()}`);
      console.log(`   Method: ${status.currentMethod || 'none'}`);
      console.log(`   Available: ${status.methodsAvailable.join(', ')}`);
      console.log(`   Table: ${config?.tableName}`);
      console.log(`   Network: ${config?.affiliateNetwork}`);
      console.log(`   Errors: ${status.errorCount}, Conflicts: ${status.conflictCount}`);
      console.log('');
    }
  }

  getBotStatuses(): Map<string, BotStatus> {
    return this.botStatuses;
  }

  getBotConfigs(): Map<string, BotConfig> {
    return this.botConfigs;
  }

  getHealthStatus() {
    const totalBots = this.botStatuses.size;
    const activeBots = Array.from(this.botStatuses.values()).filter(s => s.status === 'active').length;
    const errorBots = Array.from(this.botStatuses.values()).filter(s => s.status === 'error').length;
    
    return {
      totalBots,
      activeBots,
      errorBots,
      healthPercentage: Math.round((activeBots / totalBots) * 100),
      botStatuses: Object.fromEntries(this.botStatuses),
      isHealthy: errorBots === 0 && activeBots > 0
    };
  }

  async updateBotMethod(botName: string, method: 'telegram' | 'scraping' | 'api'): Promise<boolean> {
    const status = this.botStatuses.get(botName);
    const config = this.botConfigs.get(botName);
    
    if (!status || !config) {
      console.error(`Error Bot ${botName} not found`);
      return false;
    }

    if (!config.methods[method].enabled) {
      console.error(`Error Method ${method} not enabled for ${botName}`);
      return false;
    }

    status.currentMethod = method;
    console.log(`Success Updated ${botName} to use ${method} method`);
    return true;
  }

  async restartBot(botName: string): Promise<boolean> {
    try {
      console.log(`Refresh Restarting bot ${botName}...`);
      
      const config = this.botConfigs.get(botName);
      if (!config) {
        console.error(`Error Bot ${botName} not found`);
        return false;
      }

      await this.initializeSingleBot(botName, config);
      
      console.log(`Success Bot ${botName} restarted successfully`);
      return true;
    } catch (error) {
      console.error(`Error Error restarting bot ${botName}:`, error);
      return false;
    }
  }

  async enableBot(botName: string): Promise<boolean> {
    const config = this.botConfigs.get(botName);
    if (!config) return false;
    
    config.isEnabled = true;
    console.log(`Success Enabled bot ${botName}`);
    return true;
  }

  async disableBot(botName: string): Promise<boolean> {
    const config = this.botConfigs.get(botName);
    if (!config) return false;
    
    config.isEnabled = false;
    const status = this.botStatuses.get(botName);
    if (status) {
      status.status = 'inactive';
    }
    console.log(`⏸️ Disabled bot ${botName}`);
    return true;
  }

  async enableAPIForBot(botName: string, apiKey: string): Promise<boolean> {
    const config = this.botConfigs.get(botName);
    if (!config) return false;
    
    config.methods.api.enabled = true;
    config.methods.api.apiKey = apiKey;
    console.log(`Link Enabled API for bot ${botName}`);
    return true;
  }

  async shutdown(): Promise<void> {
    console.log('Stop Shutting down Enhanced Telegram Manager...');
    this.isShuttingDown = true;
    this.botLocks.clear();
    this.db.close();
    console.log('Success Enhanced Telegram Manager shutdown complete');
  }
}

// Create and export singleton instance
export const enhancedTelegramManager = new EnhancedTelegramManager();
export { EnhancedTelegramManager };
export default enhancedTelegramManager;