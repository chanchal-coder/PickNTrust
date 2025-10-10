import { Router } from 'express';

const router = Router();

// Public, read-only status endpoint to monitor bot initialization and webhook state
router.get('/api/bot/status', async (_req, res) => {
  // Build status fields without relying on external libs to avoid ESM/CJS issues
  const env = process.env.NODE_ENV || 'unknown';
  const token = process.env.MASTER_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '';
  const hasToken = Boolean(token);

  let initialized = false;
  let webhook: { url?: string; pending_update_count?: number } | undefined;

  if (hasToken) {
    try {
      const apiUrl = `https://api.telegram.org/bot${token}/getWebhookInfo`;
      const resp = await fetch(apiUrl);
      if (resp.ok) {
        const data: any = await resp.json();
        const info = data?.result || {};
        webhook = {
          url: info?.url,
          pending_update_count: info?.pending_update_count,
        };
        initialized = Boolean(info?.url);
      } else {
        console.warn('⚠️ Telegram API getWebhookInfo failed:', resp.status, resp.statusText);
      }
    } catch (err) {
      console.warn('⚠️ Failed to query Telegram API for status:', (err as any)?.message || err);
    }
  }

  res.json({ initialized, hasToken, env, webhook });
});

export default router;