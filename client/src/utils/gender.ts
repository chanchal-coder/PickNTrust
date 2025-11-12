// Shared gender inference utility to avoid substring misclassification
// Normalizes raw gender labels and infers from product text using word boundaries

export type AnyProduct = {
  gender?: string | null;
  name?: string;
  title?: string;
  category?: string;
  subcategory?: string;
  [key: string]: any;
};

const normalize = (g: string) => {
  const v = (g || '').toLowerCase().trim();
  if (!v) return '';
  if (v === 'common') return 'unisex';
  if (v === 'mens') return 'men';
  if (v === 'womens') return 'women';
  if (v === 'boy') return 'boys';
  if (v === 'girl') return 'girls';
  if (v === 'boys') return 'boys';
  if (v === 'girls') return 'girls';
  if (v === 'kid') return 'kids';
  return v;
};

const hasWord = (text: string, pattern: RegExp) => pattern.test(text);

export const inferGender = (p: AnyProduct): string => {
  const raw = normalize(String(p.gender || ''));
  // If raw is already a known bucket, trust it
  if (['men','women','boys','girls','kids','unisex'].includes(raw)) {
    return raw;
  }

  // Prefer title when present, fallback to name
  const title = String(p.title || p.name || '').toLowerCase();
  const cat = String(p.category || '').toLowerCase();
  const sub = String(p.subcategory || '').toLowerCase();
  const text = `${raw} ${title} ${cat} ${sub}`;

  // Strict word-boundary based matching to avoid matching 'men' inside 'women'
  const MEN = /\b(men|man|male|mens|gents)\b/;
  // Include common women-centric apparel terms seen in Indian catalogs
  // Expanded to include plural variants and common phrases; single-line regex to avoid parser issues
  const WOMEN = /\b(women|woman|female|ladies|lady|saree|sarees|lehenga|lehengas|lehenga\s*choli|kurti|kurtis|dupatta|dupattas|salwar|salwars|salwar\s*kameez|salwar\s*suit|anarkali|anarkalis|choli|cholis|skirt|skirts|blouse|blouses|heel|heels|gown|gowns|suit\s*set)\b/;
  const BOY = /\b(boy|boys)\b/;
  const GIRL = /\b(girl|girls)\b/;
  const KIDS = /\b(kid|kids|child|children|baby|toddler|infant)\b/;
  const UNISEX = /\b(unisex|common)\b/;

  if (hasWord(text, MEN)) return 'men';
  if (hasWord(text, WOMEN)) return 'women';
  if (hasWord(text, BOY)) return 'boys';
  if (hasWord(text, GIRL)) return 'girls';
  if (hasWord(text, KIDS)) return 'kids';
  if (hasWord(text, UNISEX)) return 'unisex';

  return raw || '';
};