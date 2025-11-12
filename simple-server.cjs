// Simple Node.js server to test API endpoints
const http = require('http');
const url = require('url');

// Mock data for testing
const mockProducts = [
  {
    id: 1,
    name: "Sample Product 1",
    description: "This is a sample product for testing",
    price: "99.99",
    currency: "INR",
    category: "Electronics",
    rating: "4.5",
    reviewCount: 150,
    imageUrl: "https://example.com/image1.jpg",
    affiliateUrl: "https://example.com/affiliate1",
    isFeatured: true,
    isNew: false,
    hasTimer: false,
    source: "test",
    displayPages: ["home", "prime-picks"]
  },
  {
    id: 2,
    name: "Sample Product 2",
    description: "Another sample product for testing",
    price: "149.99",
    currency: "INR",
    category: "Fashion",
    rating: "4.2",
    reviewCount: 89,
    imageUrl: "https://example.com/image2.jpg",
    affiliateUrl: "https://example.com/affiliate2",
    isFeatured: false,
    isNew: true,
    hasTimer: true,
    timerDuration: 24,
    source: "test",
    displayPages: ["home", "value-picks", "deals-hub"]
  }
];

// Page-specific products
const pageProducts = {
  'home': mockProducts,
  'prime-picks': [mockProducts[0]],
  'cue-picks': [mockProducts[1]],
  'value-picks': [mockProducts[1]],
  'click-picks': [mockProducts[0]],
  'global-picks': mockProducts,
  'travel-picks': [mockProducts[0]],
  'deals-hub': [mockProducts[1]],
  'loot-box': mockProducts,
  'top-picks': mockProducts,
  'apps': [
    {
      id: 'app_1',
      name: "AI Writing Assistant",
      description: "Advanced AI-powered writing tool",
      price: "29.99",
      currency: "USD",
      category: "AI Tools",
      rating: "4.8",
      reviewCount: 245,
      imageUrl: "https://example.com/ai-app.jpg",
      affiliateUrl: "https://example.com/ai-app-affiliate",
      isFeatured: true,
      isNew: true,
      hasTimer: false,
      source: "ai-apps",
      appType: "web",
      platform: "web",
      displayPages: ["apps"]
    }
  ]
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Routes
  // Health and status endpoints for monitoring
  if (pathname === '/health' || pathname === '/api/health') {
    const payload = { ok: true, port: PORT };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
    return;
  }

  if (pathname === '/api/status') {
    const payload = {
      ok: true,
      port: PORT,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
    return;
  }

  if (pathname.startsWith('/api/products/page/')) {
    const pageName = pathname.split('/').pop();
    const products = pageProducts[pageName] || [];
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    // Return raw array to match frontend expectations
    res.end(JSON.stringify(products));
    return;
  }

  // Additional API endpoints that the frontend expects
  if (pathname === '/api/categories') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ categories: ['Electronics', 'Fashion', 'Home', 'Sports'] }));
    return;
  }

  if (pathname === '/api/nav-tabs') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([
      { name: 'Prime Picks', path: '/prime-picks', slug: 'prime-picks' },
      { name: 'Click Picks', path: '/click-picks', slug: 'click-picks' },
      { name: 'Value Picks', path: '/value-picks', slug: 'value-picks' },
      { name: 'Cue Picks', path: '/cue-picks', slug: 'cue-picks' },
      { name: 'Loot Box', path: '/loot-box', slug: 'loot-box' },
      { name: 'Global Picks', path: '/global-picks', slug: 'global-picks' },
      { name: 'Deals Hub', path: '/deals-hub', slug: 'deals-hub' },
      { name: 'Top Picks', path: '/top-picks', slug: 'top-picks' },
      { name: 'Apps', path: '/apps', slug: 'apps' },
      { name: 'Services', path: '/services', slug: 'services' }
    ]));
    return;
  }

  if (pathname.startsWith('/api/categories/')) {
    const category = pathname.split('/').pop();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ category, products: mockProducts.slice(0, 3) }));
    return;
  }

  // Minimal services endpoint returning array
  if (pathname === '/api/services') {
    const services = [
      {
        id: 'service_1',
        name: "Web Design Service",
        description: "Professional web design and development",
        price: "499.00",
        currency: "USD",
        category: "Services",
        rating: "4.6",
        reviewCount: 120,
        imageUrl: "https://example.com/service.jpg",
        affiliateUrl: "https://example.com/service-affiliate",
        isFeatured: false,
        isService: true,
        pricingType: "one-time",
        displayPages: ["services"]
      }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(services));
    return;
  }

  // Minimal banners endpoint to avoid frontend crashes
  if (pathname.startsWith('/api/banners/')) {
    const page = pathname.split('/').pop();
    const banners = [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(banners));
    return;
  }

  // Root route - show available endpoints
  if (pathname === '/') {
    const endpoints = Object.keys(pageProducts).map(page => 
      `<li><a href="/api/products/page/${page}">/api/products/page/${page}</a></li>`
    ).join('');
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PickNTrust API Test Server</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 10px 0; }
            a { color: #007bff; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>🛍️ PickNTrust API Test Server</h1>
          <p>Server is running on port ${PORT}</p>
          <h2>Available Endpoints:</h2>
          <ul>
            ${endpoints}
          </ul>
        </body>
      </html>
    `;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 PickNTrust API Test Server running on http://localhost:${PORT}`);
  console.log(`📊 Ready to test all display page endpoints!`);
});