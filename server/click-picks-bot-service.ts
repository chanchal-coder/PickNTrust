
import TelegramBot from 'node-telegram-bot-api';
import { BotInstanceManager } from './bot-instance-manager';

class ClickPicksBotService {
  private bot: TelegramBot | null = null;
  private botManager: BotInstanceManager;
  private isRunning = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor(
    private botToken: string,
    private channelId: string,
    private channelUrl: string
  ) {
    this.botManager = new BotInstanceManager();
  }

  async start(): Promise<boolean> {
    if (this.isRunning) {
      console.log('Refresh Click Picks bot already running');
      return true;
    }

    const lockAcquired = await this.botManager.acquireBotLock('ClickPicks', this.botToken);
    if (!lockAcquired) {
      console.log('Error Could not acquire bot lock for Click Picks');
      return false;
    }

    try {
      await this.initializeBot();
      this.startHealthCheck();
      this.isRunning = true;
      console.log('Success Click Picks bot started successfully');
      return true;
    } catch (error) {
      console.error('Error Failed to start Click Picks bot:', error);
      this.botManager.releaseBotLock('ClickPicks', this.botToken);
      return false;
    }
  }

  private async initializeBot() {
    this.bot = new TelegramBot(this.botToken, {
      polling: {
        interval: 2000,
        autoStart: false,
        params: {
          timeout: 10,
          allowed_updates: ['channel_post', 'message']
        }
      },
      request: {
        agentOptions: {
          keepAlive: true,
          family: 4
        }
      }
    });

    // Set up error handling
    this.bot.on('polling_error', async (error) => {
      console.error('Alert Click Picks bot polling error:', error.message);
      
      if (error.message.includes('409') || error.message.includes('Conflict')) {
        console.log('Refresh Handling bot conflict...');
        await this.handleConflictError();
      } else {
        console.log('Refresh Restarting bot due to error...');
        await this.restart();
      }
    });

    // Set up message handling
    this.bot.on('channel_post', async (msg) => {
      try {
        await this.processChannelMessage(msg);
      } catch (error) {
        console.error('Error Error processing channel message:', error);
      }
    });

    // Start polling
    await this.bot.startPolling();
    console.log('Target Click Picks bot polling started');
  }

  private async handleConflictError() {
    const canRecover = await this.botManager.handleBotConflict('ClickPicks', new Error('Bot conflict'));
    
    if (canRecover) {
      await this.restart();
    } else {
      console.log('Error Click Picks bot recovery failed - manual intervention required');
      this.stop();
    }
  }

  private async processChannelMessage(msg: any) {
    if (msg.chat.id.toString() !== this.channelId.replace('@', '').replace('-100', '')) {
      return; // Not from our channel
    }

    console.log('📢 Click Picks channel post received:', msg.message_id);
    
    const text = msg.text || msg.caption || '';
    const urls = this.extractUrls(text);
    
    if (urls.length > 0) {
      console.log(`Search Detected ${urls.length} URLs in Click Picks message`);
      
      for (const url of urls) {
        try {
          await this.processUrl(url, msg);
        } catch (error) {
          console.error(`Error Error processing URL ${url}:, error`);
        }
      }
    }
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /(https?://[^s]+)/g;
    return text.match(urlRegex) || [];
  }

  private async processUrl(url: string, msg: any) {
    console.log(`Link Processing Click Picks URL: ${url}`);
    
    // Here you would implement URL processing logic
    // This should scrape the URL, extract product info, and save to database
    
    // For now, create a placeholder product
    const productData = {
      name: `Product from ${new URL(url).hostname}`,
      description: `Auto-imported from Click Picks channel`,
      price: '0', // Will be updated after scraping
      image_url: 'https://via.placeholder.com/400x400',
      affiliate_url: url,
      category: 'Click Picks',
      processing_status: 'active',
      telegram_message_id: msg.message_id,
      created_at: Math.floor(Date.now() / 1000)
    };
    
    // Save to database (implement actual database save logic)
    console.log('Save Saving Click Picks product to database:', productData.name);
  }

  private startHealthCheck() {
    this.healthCheckTimer = setInterval(() => {
      if (this.bot && this.isRunning) {
        console.log('💓 Click Picks bot health check - OK');
      }
    }, 60000); // Every minute
  }

  private async restart() {
    console.log('Refresh Restarting Click Picks bot...');
    
    await this.stop();
    
    // Wait before restart
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await this.start();
  }

  async stop() {
    console.log('Stop Stopping Click Picks bot...');
    
    this.isRunning = false;
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.bot) {
      try {
        await this.bot.stopPolling();
      } catch (error) {
        console.log('Warning Error stopping bot polling:', error.message);
      }
      this.bot = null;
    }
    
    this.botManager.releaseBotLock('ClickPicks', this.botToken);
    this.botManager.resetRecoveryAttempts('ClickPicks');
    
    console.log('Success Click Picks bot stopped');
  }
}

export { ClickPicksBotService };
