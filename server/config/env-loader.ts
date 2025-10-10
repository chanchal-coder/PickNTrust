import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Centralized environment loader that tries multiple .env locations reliably
 * across dev, prod, and EC2 deployments. It fills missing keys without
 * overwriting already-present process.env values.
 */
export function loadEnv(): void {
  const candidates: string[] = [];

  // Current working directory candidates
  candidates.push(path.resolve(process.cwd(), 'server/.env'));
  candidates.push(path.resolve(process.cwd(), '.env'));

  // Relative to compiled files (e.g., dist/server)
  try {
    const here = path.dirname(new URL(import.meta.url).pathname);
    candidates.push(path.resolve(here, '../.env'));
    candidates.push(path.resolve(here, '../../.env'));
  } catch {}

  // EC2 absolute fallback (stable path we set up)
  candidates.push('/home/ec2-user/pickntrust/server/.env');

  const loadedFrom: string[] = [];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        dotenv.config({ path: p, override: false });
        loadedFrom.push(p);
      }
    } catch {
      // ignore
    }
  }

  // Set robust defaults if missing
  if (!process.env.DATABASE_URL) {
    const ec2Db = '/home/ec2-user/pickntrust/database.sqlite';
    const localDb = path.resolve(process.cwd(), 'database.sqlite');
    if (fs.existsSync(ec2Db)) {
      process.env.DATABASE_URL = ec2Db;
    } else {
      process.env.DATABASE_URL = localDb;
    }
  }

  // Prefer MASTER_BOT_TOKEN, but keep TELEGRAM_BOT_TOKEN as fallback
  if (!process.env.MASTER_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN) {
    process.env.MASTER_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  }

  // Helpful, low-noise startup log
  const tokenSet = Boolean(process.env.MASTER_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN);
  const dbPath = process.env.DATABASE_URL;
  const src = loadedFrom.length ? loadedFrom.join(', ') : 'none (.env not found)';
  console.log(`ENV loaded from: ${src}`);
  console.log(`ENV tokens set: ${tokenSet ? 'yes' : 'no'}`);
  console.log(`ENV database: ${dbPath}`);
}