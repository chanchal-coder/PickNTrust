// Quick helper to print admin banners for global-picks with IDs
import('node-fetch').catch(() => null).then(async (nf) => {
  const fetchFn = (globalThis.fetch || (nf && nf.default));
  if (!fetchFn) {
    console.error('No fetch available in Node environment');
    process.exit(1);
  }

  try {
    const resp = await fetchFn('http://localhost:5000/api/admin/banners');
    if (!resp.ok) {
      const text = await resp.text();
      console.error('API error', resp.status, text);
      process.exit(1);
    }
    const data = await resp.json();
    const list = (data && data.banners && data.banners['global-picks']) || [];
    console.log('\nGlobal Picks banners (id, title, display_order):');
    for (const b of list) {
      console.log(`- ${b.id} | ${b.title} | ${b.display_order}`);
    }
  } catch (err) {
    console.error('Failed to fetch banners:', err?.message || err);
    process.exit(1);
  }
});