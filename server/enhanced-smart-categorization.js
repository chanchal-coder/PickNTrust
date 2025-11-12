// Lightweight smart categorization helpers for automation flows

const SERVICE_KEYWORDS = ['service', 'support', 'consulting', 'hosting', 'design', 'development'];
const AI_APP_KEYWORDS = ['ai', 'app', 'application', 'generator', 'editor', 'chatgpt'];
const FEATURE_KEYWORDS = ['deal', 'offer', 'limited', 'discount', 'sale', 'hot'];

export function categorizeForAutomation(title = '', description = '', pageSlug = '', platform = '') {
  const t = String(title).toLowerCase();
  const d = String(description).toLowerCase();
  const p = String(pageSlug).toLowerCase();

  const isService = SERVICE_KEYWORDS.some(k => t.includes(k) || d.includes(k) || p.includes('service'));
  const isAIApp = AI_APP_KEYWORDS.some(k => t.includes(k) || d.includes(k) || p.includes('app'));
  const isFeatured = FEATURE_KEYWORDS.some(k => t.includes(k) || d.includes(k));

  // Basic category inference
  let category = 'General';
  if (p.includes('travel')) category = 'Travel';
  else if (p.includes('prime')) category = 'Prime Picks';
  else if (p.includes('value')) category = 'Value Picks';
  else if (p.includes('click')) category = 'Click Picks';
  else if (p.includes('global')) category = 'Global Picks';
  else if (p.includes('loot')) category = 'Loot Box';
  else if (p.includes('services')) category = 'Services';
  else if (p.includes('apps')) category = 'Apps & AI Apps';

  // Confidence: heuristic based on signals present
  const signals = [isService, isAIApp, isFeatured].filter(Boolean).length;
  const confidence = signals === 0 ? 0.3 : signals === 1 ? 0.5 : signals === 2 ? 0.7 : 0.85;

  return { isService, isAIApp, isFeatured, category, confidence };
}

export function shouldAutoCategorize(title = '', description = '', pageSlug = '', platform = '') {
  const p = String(pageSlug).toLowerCase();
  // Enable auto categorization for main product pages
  return [
    'prime-picks','value-picks','click-picks','cue-picks','global-picks','loot-box','travel-picks','services','apps'
  ].some(slug => p.includes(slug));
}