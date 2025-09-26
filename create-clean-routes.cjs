const fs = require('fs');
const path = require('path');

console.log('🔧 Creating clean routes.ts with simplified product endpoints...');

const cleanRoutesContent = `import express from 'express';
import { storage } from './storage';
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

const app = express();
const sqliteDb = new Database(path.join(__dirname, '../database.db'));

// Admin password verification
async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const adminUser = sqliteDb.prepare('SELECT password FROM admin_users WHERE username = ?').get('admin') as any;
    if (!adminUser) return false;
    return await bcrypt.compare(password, adminUser.password);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

export function setupRoutes(app: express.Application) {
  // Get products for a specific page using display_pages field
  app.get("/api/products/page/:page", async (req, res) => {
    try {
      const { page } = req.params;
      const { category, limit = 50, offset = 0 } = req.query;
      
      console.log(\`Getting products for page: "\${page}"\`);
      
      let query = \`
        SELECT * FROM products 
        WHERE display_pages LIKE '%' || ? || '%'
        AND processing_status = 'active'
      \`;
      
      const params: any[] = [page];
      
      if (category && category !== 'all') {
        query += \` AND category = ?\`;
        params.push(category);
      }
      
      query += \` ORDER BY created_at DESC LIMIT ? OFFSET ?\`;
      params.push(parseInt(limit as string), parseInt(offset as string));
      
      const products = sqliteDb.prepare(query).all(...params);
      
      console.log(\`Found \${products.length} products for page "\${page}"\`);
      res.json(products);
    } catch (error) {
      console.error("Error in products page endpoint:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get categories for a specific page
  app.get("/api/categories/page/:page", async (req, res) => {
    try {
      const { page } = req.params;
      
      console.log(\`Getting categories for page: "\${page}"\`);
      
      // Get all products for this page
      const products = sqliteDb.prepare(\`
        SELECT DISTINCT category FROM products 
        WHERE display_pages LIKE '%' || ? || '%'
        AND processing_status = 'active'
        AND category IS NOT NULL
        AND category != ''
      \`).all(page);
      
      const categories = products.map((p: any) => p.category).sort();
      
      console.log(\`Found \${categories.length} categories for page "\${page}": \${categories.join(', ')}\`);
      res.json(categories);
    } catch (error) {
      console.error(\`Error fetching categories for page "\${req.params.page}":\`, error);
      res.status(500).json({ message: "Failed to fetch categories by page" });
    }
  });

  // Get products by category for a specific page
  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const { page = 'home', limit = 50, offset = 0 } = req.query;
      
      const products = sqliteDb.prepare(\`
        SELECT * FROM products 
        WHERE category = ? 
        AND display_pages LIKE '%' || ? || '%'
        AND processing_status = 'active'
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      \`).all(category, page, parseInt(limit as string), parseInt(offset as string));
      
      res.json(products);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      res.status(500).json({ message: 'Failed to fetch products by category' });
    }
  });

  // Admin category management routes
  app.post('/api/admin/categories', async (req, res) => {
    try {
      const { password, ...categoryData } = req.body;

      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const result = sqliteDb.prepare(\`
        INSERT INTO categories (name, description, display_order, is_active)
        VALUES (?, ?, ?, ?)
      \`).run(
        categoryData.name,
        categoryData.description || '',
        categoryData.display_order || 0,
        categoryData.is_active !== false ? 1 : 0
      );

      res.json({ id: result.lastInsertRowid, ...categoryData });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Failed to create category' });
    }
  });

  app.put('/api/admin/categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { password, ...categoryData } = req.body;

      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      sqliteDb.prepare(\`
        UPDATE categories 
        SET name = ?, description = ?, display_order = ?, is_active = ?
        WHERE id = ?
      \`).run(
        categoryData.name,
        categoryData.description || '',
        categoryData.display_order || 0,
        categoryData.is_active !== false ? 1 : 0,
        id
      );

      res.json({ id, ...categoryData });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Failed to update category' });
    }
  });

  app.delete('/api/admin/categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      sqliteDb.prepare('DELETE FROM categories WHERE id = ?').run(id);
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Failed to delete category' });
    }
  });

  // Get all categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = sqliteDb.prepare(\`
        SELECT * FROM categories 
        WHERE is_active = 1 
        ORDER BY display_order ASC, name ASC
      \`).all();
      
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  // Navigation tabs routes
  app.get('/api/nav-tabs', async (req, res) => {
    try {
      const tabs = [
        { id: 'prime-picks', name: 'Prime Picks', path: '/prime-picks' },
        { id: 'global-picks', name: 'Global Picks', path: '/global-picks' },
        { id: 'deals-hub', name: 'Deals Hub', path: '/deals-hub' },
        { id: 'value-picks', name: 'Value Picks', path: '/value-picks' },
        { id: 'top-picks', name: 'Top Picks', path: '/top-picks' },
        { id: 'cue-picks', name: 'Cue Picks', path: '/cue-picks' },
        { id: 'click-picks', name: 'Click Picks', path: '/click-picks' },
        { id: 'loot-box', name: 'Loot Box', path: '/loot-box' }
      ];
      
      res.json(tabs);
    } catch (error) {
      console.error('Error fetching nav tabs:', error);
      res.status(500).json({ message: 'Failed to fetch navigation tabs' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  console.log('✅ Clean routes setup completed - using single products table with display_pages filtering');
}
`;

// Write the clean routes content
fs.writeFileSync(path.join(__dirname, 'server', 'routes-clean.ts'), cleanRoutesContent);

console.log('✅ Clean routes.ts created successfully!');
console.log('📝 Key features:');
console.log('   - Uses only main products table');
console.log('   - Filters by display_pages field');
console.log('   - Simplified category management');
console.log('   - No bot-specific logic');
console.log('');
console.log('🔄 Next: Replace the current routes.ts with this clean version');