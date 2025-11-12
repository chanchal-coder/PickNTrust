# Create Production Server on EC2 directly
Write-Host "Creating production server on EC2..."

# Create the production server file directly on EC2
ssh ubuntu@51.21.112.211 @"
cd /var/www/pickntrust

# Stop all PM2 processes
pm2 stop all
pm2 delete all

# Create the production server
cat > real-production-server.js << 'EOF'
const express = require('express');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;

// Database setup (use the real production DB file)
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

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client/dist')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'PickNTrust API is running' });
});

// Products API (unified_content only)
app.get('/api/products', (req, res) => {
  const query = \`
    SELECT 
      id,
      title,
      price,
      image_url,
      category,
      rating,
      review_count AS reviews_count,
      discount AS discount_percentage,
      original_price,
      is_featured,
      created_at
    FROM unified_content
    WHERE 
      (status IN ('active','published') OR status IS NULL)
      AND (visibility IN ('public','visible') OR visibility IS NULL)
      AND (processing_status != 'archived' OR processing_status IS NULL)
    ORDER BY created_at DESC 
    LIMIT 50
  \`;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Featured products (unified_content only)
app.get('/api/products/featured', (req, res) => {
  const query = \`
    SELECT 
      id,
      title,
      price,
      image_url,
      category,
      rating,
      review_count AS reviews_count,
      discount AS discount_percentage,
      original_price,
      created_at
    FROM unified_content 
    WHERE 
      is_featured = 1 
      AND (status IN ('active','published') OR status IS NULL)
      AND (visibility IN ('public','visible') OR visibility IS NULL)
      AND (processing_status != 'archived' OR processing_status IS NULL)
    ORDER BY created_at DESC 
    LIMIT 20
  \`;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Categories API (unified_content only)
app.get('/api/categories', (req, res) => {
  const query = \`
    SELECT 
      category, 
      COUNT(*) AS count
    FROM unified_content 
    WHERE 
      category IS NOT NULL 
      AND TRIM(category) != ''
      AND (status IN ('active','published') OR status IS NULL)
      AND (visibility IN ('public','visible') OR visibility IS NULL)
      AND (processing_status != 'archived' OR processing_status IS NULL)
    GROUP BY category 
    ORDER BY count DESC
  \`;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Search products (unified_content only)
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query required' });
  }
  
  const query = \`
    SELECT 
      id, 
      title, 
      price, 
      image_url, 
      category, 
      rating, 
      review_count AS reviews_count, 
      discount AS discount_percentage, 
      original_price, 
      created_at
    FROM unified_content 
    WHERE 
      (title LIKE ? OR category LIKE ? OR description LIKE ?)
      AND (status IN ('active','published') OR status IS NULL)
      AND (visibility IN ('public','visible') OR visibility IS NULL)
      AND (processing_status != 'archived' OR processing_status IS NULL)
    ORDER BY created_at DESC 
    LIMIT 50
  \`;
  
  const searchTerm = \`%\${q}%\`;
  db.all(query, [searchTerm, searchTerm, searchTerm], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows || []);
    }
  });
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`PickNTrust server running on port \${PORT}\`);
  console.log(\`Server accessible at http://localhost:\${PORT}\`);
});
EOF

# Install required dependencies
npm install express cors sqlite3 --save

# Start the new production server
pm2 start real-production-server.js --name "pickntrust-real"
pm2 save

echo 'Real PickNTrust production server created and started!'
pm2 status
"@

Write-Host "Production server setup complete!"