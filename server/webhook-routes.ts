/**
 * Telegram Webhook Routes - Eliminates 409 Conflicts
 * Handles incoming messages from Telegram via webhooks instead of polling
 */

import { Request, Response, Express } from "express";
import TelegramBot from 'node-telegram-bot-api';

// Bot instances for webhook handling
interface WebhookBotConfig {
  botName: string;
  token: string;
  bot: TelegramBot;
  messageHandler: (msg: TelegramBot.Message) => Promise<void>;
}

class WebhookManager {
  private bots = new Map<string, WebhookBotConfig>();
  private webhookSecret = 'pickntrust_webhook_secret_2025';

  registerBot(botName: string, token: string, messageHandler: (msg: TelegramBot.Message) => Promise<void>) {
    // Create bot instance WITHOUT polling
    const bot = new TelegramBot(token, { polling: false });
    
    this.bots.set(botName, {
      botName,
      token,
      bot,
      messageHandler
    });
    
    console.log(`📡 Webhook registered for ${botName}`);
  }

  async setupWebhooks(baseUrl: string) {
    console.log('🔧 Setting up webhooks for all bots...');
    
    for (const [botName, config] of this.bots) {
      try {
        const webhookUrl = `${baseUrl}/webhook/${botName}`;
        await config.bot.setWebHook(webhookUrl, {
          secret_token: this.webhookSecret
        });
        console.log(`✅ Webhook set for ${botName}: ${webhookUrl}`);
      } catch (error) {
        console.error(`❌ Failed to set webhook for ${botName}:`, error);
      }
    }
  }

  async handleWebhook(botName: string, req: Request, res: Response) {
    try {
      const config = this.bots.get(botName);
      if (!config) {
        console.error(`❌ Unknown bot: ${botName}`);
        return res.status(404).json({ error: 'Bot not found' });
      }

      // Verify webhook secret
      const secretToken = req.headers['x-telegram-bot-api-secret-token'];
      if (secretToken !== this.webhookSecret) {
        console.error(`❌ Invalid webhook secret for ${botName}`);
        return res.status(403).json({ error: 'Invalid secret' });
      }

      const update = req.body;
      
      // Handle different update types
      if (update.message) {
        await config.messageHandler(update.message);
      } else if (update.channel_post) {
        await config.messageHandler(update.channel_post);
      }

      res.status(200).json({ ok: true });
    } catch (error) {
      console.error(`❌ Webhook error for ${botName}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  getBotInstance(botName: string): TelegramBot | null {
    return this.bots.get(botName)?.bot || null;
  }

  async clearAllWebhooks() {
    console.log('🧹 Clearing all webhooks...');
    for (const [botName, config] of this.bots) {
      try {
        await config.bot.deleteWebHook();
        console.log(`✅ Webhook cleared for ${botName}`);
      } catch (error) {
        console.error(`❌ Failed to clear webhook for ${botName}:`, error);
      }
    }
  }
}

export const webhookManager = new WebhookManager();

export function setupWebhookRoutes(app: Express) {
  console.log('🚀 Setting up webhook routes...');

  // Webhook endpoint for each bot
  app.post('/webhook/:botName', async (req: Request, res: Response) => {
    const botName = req.params.botName;
    await webhookManager.handleWebhook(botName, req, res);
  });

  // Health check endpoint
  app.get('/webhook/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      message: 'Webhook system is running',
      registeredBots: Array.from(webhookManager['bots'].keys())
    });
  });

  console.log('✅ Webhook routes configured');
}

export default webhookManager;