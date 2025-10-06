// Simple env checker that mimics credentialsStatus in social-media routes
const fs = require('fs');

function parseEnvFile(path) {
  if (!fs.existsSync(path)) return {};
  const content = fs.readFileSync(path, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m) {
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      env[m[1]] = v;
    }
  }
  return env;
}

function has(env, ...keys) {
  return keys.every(k => env[k] && String(env[k]).trim().length > 0);
}

const env = parseEnvFile('.env');
const credentialsStatus = {
  instagram: has(env, 'INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_BUSINESS_ACCOUNT_ID'),
  facebook: has(env, 'FACEBOOK_ACCESS_TOKEN', 'FACEBOOK_PAGE_ID'),
  twitter: has(env, 'TWITTER_API_KEY', 'TWITTER_ACCESS_TOKEN'),
  linkedIn: has(env, 'LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_ORGANIZATION_ID'),
  telegram: has(env, 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHANNEL_ID') || has(env, 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHANNEL'),
  youtube: has(env, 'YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN') || has(env, 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'),
  canva: has(env, 'CANVA_CLIENT_ID', 'CANVA_CLIENT_SECRET')
};

const missing = Object.entries(credentialsStatus).filter(([k, v]) => !v).map(([k]) => k);
console.log(JSON.stringify({ envLoaded: Object.keys(env).length > 0, credentialsStatus, missing }, null, 2));