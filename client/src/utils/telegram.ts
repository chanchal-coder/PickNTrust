import { getAdminPassword } from '@/config/admin';

type ShareProduct = {
  id: number | string;
  name: string;
  description?: string;
  price?: string | number;
  originalPrice?: string | number | null;
  imageUrl?: string;
  image_url?: string;
  affiliateUrl?: string;
  affiliate_url?: string;
};

function formatPrice(price?: string | number, originalPrice?: string | number | null) {
  if (!price && !originalPrice) return '';
  const p = price ? String(price) : '';
  const op = originalPrice ? String(originalPrice) : '';
  if (p && op && p !== op) {
    return `Price: <b>${p}</b> <s>${op}</s>`;
  }
  if (p) return `Price: <b>${p}</b>`;
  if (op) return `Original: <s>${op}</s>`;
  return '';
}

export async function sendProductToTelegram(product: ShareProduct, opts?: { channelId?: string; pageSlug?: string }) {
  const password = getAdminPassword();
  const image = product.imageUrl || product.image_url || '';
  const url = product.affiliateUrl || product.affiliate_url || '';
  const priceLine = formatPrice(product.price, product.originalPrice);
  const desc = (product.description || '').trim();

  const message = [
    `🔹 <b>${product.name}</b>`,
    desc ? `${desc}` : '',
    priceLine,
    url ? `\n<a href="${url}">View Deal</a>` : ''
  ].filter(Boolean).join('\n');

  const payload: any = {
    password,
    message,
  };

  if (opts?.channelId) payload.channelId = opts.channelId;
  if (opts?.pageSlug) payload.pageSlug = opts.pageSlug;

  const resp = await fetch('/api/admin/telegram/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await resp.json().catch(() => ({ success: false }));
  if (!resp.ok || !data?.success) {
    throw new Error(data?.message || 'Failed to send Telegram message');
  }
  return data;
}