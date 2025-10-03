const express = require('express');
const path = require('path');
const fs = require('fs');
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

// Helper: normalize and proxy image URLs; provide placeholder if missing
function toProxiedImage(url) {
  const placeholder = '/assets/card-placeholder.svg';
  if (!url || typeof url !== 'string' || url.trim() === '') return placeholder;
  // In production, serve direct external URLs as-is; keep local paths unchanged
  const normalized = url.startsWith('http') ? url : url;
  return normalized;
}

// In production, serve static files from the built frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  app.use(express.static(path.join(__dirname, 'dist')));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.static(path.join(__dirname, 'server')));
}

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
      const mapped = (rows || []).map((row) => ({
        ...row,
        name: row.title,
        imageUrl: toProxiedImage(row.image_url)
      }));
      res.json(mapped);
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
      const mapped = (rows || []).map((row) => ({
        ...row,
        name: row.title,
        imageUrl: toProxiedImage(row.image_url)
      }));
      res.json(mapped);
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
    WHERE is_active = 1
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

// Form-specific categories (for admin forms)
app.get('/api/categories/forms/products', (req, res) => {
  const query = `
    SELECT c.name, c.name as id, 0 as count
    FROM categories c
    WHERE c.is_for_products = 1 AND c.is_active = 1
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

app.get('/api/categories/forms/services', (req, res) => {
  const query = `
    SELECT c.name, c.name as id, 0 as count
    FROM categories c
    WHERE c.is_for_services = 1 AND c.is_active = 1
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

app.get('/api/categories/forms/aiapps', (req, res) => {
  const query = `
    SELECT c.name, c.name as id, 0 as count
    FROM categories c
    WHERE c.is_for_ai_apps = 1 AND c.is_active = 1
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
    WHERE c.id IS NOT NULL AND c.is_active = 1
    GROUP BY c.id, c.name, c.icon, c.color, c.description, c.parent_id, 
             c.is_for_products, c.is_for_services, c.is_for_ai_apps, c.display_order
    HAVING total_products_count > 0
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

// In production, serve the SPA index.html for all non-API routes (placed after API routes)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    const possiblePaths = [
      path.join(__dirname, 'client/dist/index.html'),
      path.join(__dirname, 'public/index.html'),
      path.join(__dirname, 'dist/index.html'),
      path.join(__dirname, 'server/index.html'),
      path.join(__dirname, 'index.html')
    ];
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        console.log(`Serving React app from: ${filePath}`);
        return res.sendFile(filePath);
      }
    }
    console.warn('React app index.html not found. Returning simple message.');
    res.status(404).send('Cannot GET /');
  });
}

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