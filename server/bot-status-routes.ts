import { Router } from 'express';

const router = Router();

// Public, read-only status endpoint to monitor bot initialization and webhook state
router.get('/api/bot/status', async (_req, res) => {
  try {
    const telegramBot = await import('./telegram-bot');
    const botManager = telegramBot.TelegramBotManager.getInstance();
    const status = botManager.getStatus();
    const bot = botManager.getBot();

    let webhook: { url?: string; pending_update_count?: number } | undefined;
    if (bot) {
      try {
        const info: any = await bot.getWebHookInfo();
        webhook = {
          url: info?.url,
          pending_update_count: info?.pending_update_count,
        };
      } catch {
        webhook = undefined;
      }
    }

    res.json({ initialized: status.initialized, webhook });
  } catch (error) {
    console.error('Bot status error:', error);
    res.status(200).json({ initialized: false, webhook: undefined });
  }
});

export default router;