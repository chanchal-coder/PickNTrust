const express = require('express');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build - try multiple paths
app.use(express.static(path.join(__dirname, 'client/dist')));
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'server')));

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    // Try multiple possible locations for index.html
    const possiblePaths = [
      path.join(__dirname, 'client/dist/index.html'),
      path.join(__dirname, 'dist/index.html'),
      path.join(__dirname, 'public/index.html'),
      path.join(__dirname, 'server/index.html'),
      path.join(__dirname, 'index.html')
    ];
    
    for (const filePath of possiblePaths) {
      if (require('fs').existsSync(filePath)) {
        console.log(`Serving React app from: ${filePath}`);
        return res.sendFile(filePath);
      }
    }
    
    // If no React app found, serve a message indicating the issue
    console.log('React app files not found in any expected location');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PickNTrust - Deployment Issue</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .container { max-width: 600px; margin: 0 auto; }
            .error { color: #e74c3c; }
            .info { color: #3498db; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">PickNTrust - React App Not Found</h1>
            <p class="info">The React application files are not properly deployed to the server.</p>
            <p>Expected locations checked:</p>
            <ul style="text-align: left;">
              <li>/home/ubuntu/PickNTrust/client/dist/index.html</li>
              <li>/home/ubuntu/PickNTrust/dist/index.html</li>
              <li>/home/ubuntu/PickNTrust/public/index.html</li>
              <li>/home/ubuntu/PickNTrust/server/index.html</li>
              <li>/home/ubuntu/PickNTrust/index.html</li>
            </ul>
            <p class="info">Please deploy the React build files to one of these locations.</p>
          </div>
        </body>
      </html>
    `);
  }
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'PickNTrust API is running' });
});

// Products API
app.get('/api/products', (req, res) => {
  const { search, category, limit = 50 } = req.query;
  
  let query = `
    SELECT id, title, description, price, image_url, category, rating, 
           reviews_count, discount_percentage, original_price, is_featured, 
           created_at, status
    FROM unified_content 
    WHERE status = 'active'
  `;
  
  const params = [];
  
  if (search) {
    query += ` AND title LIKE ?`;
    params.push(`%${search}%`);
  }
  
  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(parseInt(limit));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Featured products
app.get('/api/products/featured', (req, res) => {
  const query = `
    SELECT id, title, description, price, image_url, category, rating, 
           reviews_count, discount_percentage, original_price, created_at, status
    FROM unified_content 
    WHERE status = 'active' AND is_featured = 1 
    ORDER BY created_at DESC 
    LIMIT 20
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Product by ID
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT * FROM unified_content WHERE id = ? AND status = 'active'
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else if (!row) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json(row);
    }
  });
});

// Categories API - for category navigation (expects id, name, icon, color, description)
app.get('/api/categories', (req, res) => {
  const query = `
    SELECT 
      id,
      name,
      icon,
      color,
      description,
      parent_id as parentId,
      is_for_products as isForProducts,
      is_for_services as isForServices,
      is_for_ai_apps as isForAIApps,
      display_order as displayOrder
    FROM categories 
    ORDER BY display_order ASC, name ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Browse categories endpoint - for categories component (with product counts)
app.get('/api/categories/browse', (req, res) => {
  const { type } = req.query;
  
  let typeFilter = '';
  
  // Add type filtering if specified
  if (type && type !== 'all') {
    if (type === 'products') {
      typeFilter = ` AND (uc.is_service IS NULL OR uc.is_service = 0) AND (uc.is_ai_app IS NULL OR uc.is_ai_app = 0)`;
    } else if (type === 'services') {
      typeFilter = ` AND uc.is_service = 1`;
    } else if (type === 'aiapps') {
      typeFilter = ` AND uc.is_ai_app = 1`;
    }
  }
  
  const query = `
    SELECT 
      c.id,
      c.name,
      c.icon,
      c.color,
      c.description,
      c.parent_id as parentId,
      c.is_for_products as isForProducts,
      c.is_for_services as isForServices,
      c.is_for_ai_apps as isForAIApps,
      c.display_order as displayOrder,
      COUNT(uc.id) as total_products_count,
      COUNT(CASE WHEN uc.is_featured = 1 THEN 1 END) as featured_count,
      COUNT(CASE WHEN uc.is_service = 1 THEN 1 END) as services_count,
      COUNT(CASE WHEN uc.is_ai_app = 1 THEN 1 END) as ai_apps_count
    FROM categories c
    LEFT JOIN unified_content uc ON c.name = uc.category 
      AND uc.status = 'active'
      ${typeFilter}
    WHERE c.id IS NOT NULL
    GROUP BY c.id, c.name, c.icon, c.color, c.description, c.parent_id, 
             c.is_for_products, c.is_for_services, c.is_for_ai_apps, c.display_order
    HAVING total_products_count > 0 OR c.is_for_products = 1 OR c.is_for_services = 1 OR c.is_for_ai_apps = 1
    ORDER BY c.display_order ASC, c.name ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Products by category
app.get('/api/products/category/:category', (req, res) => {
  const { category } = req.params;
  const query = `
    SELECT id, title, description, price, image_url, category, rating, 
           reviews_count, discount_percentage, original_price, created_at, status
    FROM unified_content 
    WHERE category = ? AND status = 'active'
    ORDER BY created_at DESC 
    LIMIT 50
  `;
  
  db.all(query, [category], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Search products
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query required' });
  }
  
  const query = `
    SELECT id, title, description, price, image_url, category, rating, 
           reviews_count, discount_percentage, original_price, created_at, status
    FROM unified_content 
    WHERE (title LIKE ? OR category LIKE ? OR description LIKE ?) AND status = 'active'
    ORDER BY created_at DESC 
    LIMIT 50
  `;
  
  const searchTerm = `%${q}%`;
  db.all(query, [searchTerm, searchTerm, searchTerm], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Announcements API
app.get('/api/announcements', (req, res) => {
  const query = `
    SELECT id, title, content, type, is_active, created_at
    FROM announcements 
    WHERE is_active = 1 
    ORDER BY created_at DESC 
    LIMIT 10
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Serve React app for all non-API routes
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`PickNTrust server running on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});