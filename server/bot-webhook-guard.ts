import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter and safety guards for Telegram webhook
// Ensures high availability and prevents abuse without impacting the main site

type Counter = { count: number; resetAt: number };
const buckets = new Map<string, Counter>();

const WINDOW_MS = Number(process.env.BOT_WEBHOOK_WINDOW_MS || 60_000); // 1 minute
const MAX_PER_WINDOW = Number(process.env.BOT_WEBHOOK_MAX_PER_WINDOW || 120); // reasonable burst

function keyFrom(req: Request): string {
  const token = typeof req.params?.token === 'string' ? String(req.params.token) : '';
  // Prefer token for isolation across bots; fall back to IP
  return token || req.ip || 'unknown';
}

export function botWebhookGuard(req: Request, res: Response, next: NextFunction) {
  try {
    // Enforce POST and JSON content-type to avoid unexpected payloads
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const ct = req.headers['content-type'] || '';
    if (typeof ct !== 'string' || !ct.toLowerCase().includes('application/json')) {
      return res.status(415).json({ error: 'Unsupported Media Type' });
    }

    // Basic payload sanity check to avoid processing huge bodies
    const lenHeader = req.headers['content-length'];
    const len = typeof lenHeader === 'string' ? parseInt(lenHeader, 10) : NaN;
    if (!Number.isNaN(len) && len > 512_000) { // 500KB hard cap
      return res.status(413).json({ error: 'Payload Too Large' });
    }

    // Rate limiting per token/IP
    const key = keyFrom(req);
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      if (bucket.count >= MAX_PER_WINDOW) {
        // Too many requests in window — respond 429 but do not overwhelm
        return res.status(429).json({ error: 'Too Many Requests' });
      }
      bucket.count += 1;
    }

    // Proceed to route handler
    next();
  } catch (err) {
    // Never let guard errors impact the site; acknowledge and move on
    try {
      res.status(200).json({ ok: true });
    } catch {}
  }
}