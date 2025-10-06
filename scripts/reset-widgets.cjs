// Reset and seed widgets for testing all positions
// Usage: node scripts/reset-widgets.cjs [page]
// Defaults to page "prime-picks". Requires dev server running on localhost:5173.

const DEFAULT_PAGE = process.argv[2] || 'prime-picks';
const BASE_URL = process.env.WIDGETS_BASE_URL || 'http://localhost:5173';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'widget-admin';

const positions = [
  'header-top',
  'header-bottom',
  'banner-top',
  'content-top',
  'content-middle',
  'content-bottom',
  'banner-bottom',
  'sidebar-left',
  'sidebar-right',
  'footer-top',
  'footer-bottom',
  'floating-top-left',
  'floating-top-right',
  'floating-bottom-left',
  'floating-bottom-right',
];

function boxHtml(position, page) {
  // Inline styles to avoid dependency on Tailwind class generation for dynamic content
  const bg = position.includes('floating') ? '#0ea5e9' : position.includes('banner') ? '#f59e0b' : '#22c55e';
  const fg = '#0f172a';
  const pad = '12px 16px';
  const img = imageHtml(position);
  return `\n<div style="padding:${pad};background:${bg}15;border:2px solid ${bg};border-radius:10px;color:${fg};font-weight:600">\n  <div style="font-size:14px;opacity:.85;margin-bottom:6px">Seeded Widget</div>\n  <div style="font-size:16px">Position: <strong>${position}</strong></div>\n  <div style="font-size:14px;margin-bottom:10px">Page: <strong>${page}</strong></div>\n  ${img}\n</div>\n`;
}

function imageHtml(position) {
  // Generate an inline SVG “hero” image; size varies by area
  const width = position.includes('banner') ? 960 : position.includes('content') ? 720 : position.includes('header') || position.includes('footer') ? 720 : position.includes('sidebar') ? 300 : 240;
  const height = position.includes('banner') ? 180 : position.includes('content') ? 140 : position.includes('header') || position.includes('footer') ? 120 : position.includes('sidebar') ? 160 : 120;
  const hue = Math.abs(hashCode(position)) % 360;
  const hue2 = (hue + 60) % 360;
  const bg1 = `hsl(${hue}, 85%, 60%)`;
  const bg2 = `hsl(${hue2}, 85%, 55%)`;
  const textColor = '#0b1020';
  const stroke = '#0b1225';
  const rx = 14;
  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Widget image for ${position}" style="display:block;max-width:100%;height:auto;border-radius:${rx}px;overflow:hidden">
  <defs>
    <linearGradient id="grad-${position}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="100%" stop-color="${bg2}" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#grad-${position})" rx="${rx}" />
  <g>
    <circle cx="${Math.floor(width*0.12)}" cy="${Math.floor(height*0.5)}" r="${Math.floor(Math.min(width,height)*0.12)}" fill="#ffffff55" stroke="${stroke}" stroke-width="2" />
    <rect x="${Math.floor(width*0.22)}" y="${Math.floor(height*0.3)}" width="${Math.floor(width*0.5)}" height="${Math.floor(height*0.45)}" fill="#ffffff40" stroke="${stroke}" stroke-width="2" rx="8" />
  </g>
  <text x="${Math.floor(width*0.5)}" y="${Math.floor(height*0.5)}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial" font-size="${Math.floor(height*0.22)}" font-weight="700" fill="${textColor}" opacity="0.9">IMG</text>
  <text x="${Math.floor(width*0.5)}" y="${Math.floor(height*0.85)}" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial" font-size="${Math.floor(height*0.16)}" font-weight="600" fill="#0b1020" opacity="0.85">${position}</text>
</svg>
`;
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0;
}

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-admin-password': ADMIN_PASSWORD,
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${path}: ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

async function getAllWidgets() {
  try {
    return await api('/api/admin/widgets');
  } catch (err) {
    console.error('Failed to fetch widgets:', err.message);
    return [];
  }
}

async function deleteWidget(id) {
  try {
    await api(`/api/admin/widgets/${id}`, { method: 'DELETE' });
    console.log(`✓ Deleted widget ${id}`);
  } catch (err) {
    console.warn(`⚠ Failed to delete widget ${id}: ${err.message}`);
  }
}

async function createWidget({ name, description, body, code, targetPage, position, isActive = true, displayOrder = 0, maxWidth = 'none', customCss = '', showOnMobile = true, showOnDesktop = true, externalLink = '' }) {
  const payload = {
    name,
    description,
    body,
    code,
    targetPage,
    position,
    isActive,
    displayOrder,
    maxWidth,
    customCss,
    showOnMobile,
    showOnDesktop,
    externalLink,
  };
  try {
    const created = await api('/api/admin/widgets', { method: 'POST', body: JSON.stringify(payload) });
    console.log(`✓ Created ${position} widget (id ${created.id})`);
    return created;
  } catch (err) {
    console.error(`✗ Failed to create ${position} widget:`, err.message);
    throw err;
  }
}

async function main() {
  console.log(`Resetting widgets for page: ${DEFAULT_PAGE}`);
  console.log(`Using API base: ${BASE_URL}`);

  // Step 1: Delete all existing widgets (global)
  const existing = await getAllWidgets();
  console.log(`Found ${existing.length} existing widget(s)`);
  for (const w of existing) {
    await deleteWidget(w.id);
  }

  // Step 2: Seed one widget for each position
  console.log('Seeding widgets for all positions...');
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const name = `Seed: ${pos}`;
    const description = `Seeded test widget for ${pos}`;
    const body = boxHtml(pos, DEFAULT_PAGE);
    const code = body; // fallback if body is empty; keep consistent
    const isActive = true;
    const displayOrder = i; // deterministic order
    const maxWidth = pos.startsWith('sidebar') ? '360px' : 'none';
    const customCss = '';
    const showOnMobile = true;
    const showOnDesktop = true;
    const externalLink = '';

    await createWidget({
      name,
      description,
      body,
      code,
      targetPage: DEFAULT_PAGE,
      position: pos,
      isActive,
      displayOrder,
      maxWidth,
      customCss,
      showOnMobile,
      showOnDesktop,
      externalLink,
    });
  }

  console.log('✅ Widget reset and seeding complete. Open the page to verify.');
}

main().catch((err) => {
  console.error('Reset script failed:', err);
  process.exit(1);
});