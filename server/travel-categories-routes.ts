import { Router } from 'express';
import Database from 'better-sqlite3';
import path from 'path';

// Type definitions for database results
interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string | null;
  isActive: number;
  displayOrder: number;
  createdAt: number;
  updatedAt: number;
}

interface CountRow {
  category_slug: string;
  count: number;
}

const router = Router();
const dbPath = path.join(process.cwd(), 'database.sqlite');

interface TravelCategory {
  id?: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: number;
  updatedAt?: number;
}

// Default travel categories
const defaultCategories: Omit<TravelCategory, 'id'>[] = [
  {
    name: 'Flights',
    slug: 'flights',
    icon: 'fas fa-plane',
    color: '#2196F3',
    description: 'Domestic and International Flight Bookings',
    isActive: true,
    displayOrder: 1,
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000)
  },
  {
    name: 'Hotels',
    slug: 'hotels',
    icon: 'fas fa-bed',
    color: '#FF9800',
    description: 'Hotel Bookings and Accommodations',
    isActive: true,
    displayOrder: 2,
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000)
  },
  {
    name: 'Packages',
    slug: 'packages',
    icon: 'fas fa-suitcase',
    color: '#9C27B0',
    description: 'Complete Travel Packages',
    isActive: true,
    displayOrder: 3,
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000)
  },
  {
    name: 'Tours',
    slug: 'tours',
    icon: 'fas fa-map-marked-alt',
    color: '#F44336',
    description: 'Guided Tours and Experiences',
    isActive: true,
    displayOrder: 4,
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000)
  },
  {
    name: 'Bus',
    slug: 'bus',
    icon: 'fas fa-bus',
    color: '#FFC107',
    description: 'Bus Ticket Bookings',
    isActive: true,
    displayOrder: 5,
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000)
  },
  {
    name: 'Train',
    slug: 'train',
    icon: 'fas fa-train',
    color: '#4CAF50',
    description: 'Railway Ticket Bookings',
    isActive: true,
    displayOrder: 6,
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000)
  },
  {
    name: 'Car Rental',
    slug: 'car-rental',
    icon: 'fas fa-car',
    color: '#3F51B5',
    description: 'Car Rental Services',
    isActive: true,
    displayOrder: 7,
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000)
  },
  {
    name: 'Cruises',
    slug: 'cruises',
    icon: 'fas fa-ship',
    color: '#009688',
    description: 'Cruise Bookings',
    isActive: true,
    displayOrder: 8,
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000)
  },
  {
    name: 'Tickets',
    slug: 'tickets',
    icon: 'fas fa-ticket-alt',
    color: '#E91E63',
    description: 'Event and Activity Tickets',
    isActive: true,
    displayOrder: 9,
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000)
  }
];

// Initialize database and create table if not exists
function initializeDatabase() {
  const db = new Database(dbPath);
  
  // Create travel_categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS travel_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      description TEXT,
      isActive INTEGER DEFAULT 1,
      displayOrder INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
  
  // Check if table is empty and insert default categories
  const count = db.prepare('SELECT COUNT(*) as count FROM travel_categories').get() as { count: number };
  
  if (count.count === 0) {
    const insertStmt = db.prepare(`
      INSERT INTO travel_categories (name, slug, icon, color, description, isActive, displayOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const category of defaultCategories) {
      insertStmt.run(
        category.name,
        category.slug,
        category.icon,
        category.color,
        category.description,
        category.isActive ? 1 : 0,
        category.displayOrder,
        category.createdAt,
        category.updatedAt
      );
    }
    
    console.log('Success Travel categories initialized with default data');
  }
  
  db.close();
}

// Initialize database on module load
initializeDatabase();

// GET /api/travel-categories - Get all travel categories
router.get('/travel-categories', (req, res) => {
  try {
    const db = new Database(dbPath);
    
    const categories = db.prepare(`
      SELECT * FROM travel_categories 
      ORDER BY displayOrder ASC, name ASC
    `).all() as CategoryRow[];
    
    // Convert isActive from integer to boolean
    const formattedCategories = categories.map((cat: CategoryRow) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      color: cat.color,
      description: cat.description,
      isActive: Boolean(cat.isActive),
      displayOrder: cat.displayOrder,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt
    }));
    
    db.close();
    res.json(formattedCategories);
  } catch (error) {
    console.error('Error fetching travel categories:', error);
    res.status(500).json({ error: 'Failed to fetch travel categories' });
  }
});

// GET /api/travel-deals/counts - Get product counts for each category
router.get('/travel-deals/counts', (req, res) => {
  try {
    const db = new Database(dbPath);
    
    // Get counts from travel_deals table
    const counts = db.prepare(`
      SELECT 
        COALESCE(travelType, subcategory, 'other') as category_slug,
        COUNT(*) as count
      FROM travel_deals 
      WHERE processingStatus = 'active'
      GROUP BY COALESCE(travelType, subcategory, 'other')
    `).all() as CountRow[];
    
    // Convert to object format
    const countsObj: Record<string, number> = {};
    counts.forEach((item: CountRow) => {
      countsObj[item.category_slug] = item.count;
    });
    
    db.close();
    res.json(countsObj);
  } catch (error) {
    console.error('Error fetching travel deal counts:', error);
    res.json({}); // Return empty object on error
  }
});

// POST /api/travel-categories - Create new travel category
router.post('/travel-categories', (req, res) => {
  try {
    const { name, slug, icon, color, description, isActive = true, displayOrder } = req.body;
    
    if (!name || !slug || !icon || !color) {
      return res.status(400).json({ error: 'Missing required fields: name, slug, icon, color' });
    }
    
    const db = new Database(dbPath);
    
    // Check if slug already exists
    const existing = db.prepare('SELECT id FROM travel_categories WHERE slug = ?').get(slug);
    if (existing) {
      db.close();
      return res.status(400).json({ error: 'Category with this slug already exists' });
    }
    
    // Get next display order if not provided
    let finalDisplayOrder = displayOrder;
    if (!finalDisplayOrder) {
      const maxOrder = db.prepare('SELECT MAX(displayOrder) as maxOrder FROM travel_categories').get() as { maxOrder: number };
      finalDisplayOrder = (maxOrder.maxOrder || 0) + 1;
    }
    
    const result = db.prepare(`
      INSERT INTO travel_categories (name, slug, icon, color, description, isActive, displayOrder, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      slug,
      icon,
      color,
      description || null,
      isActive ? 1 : 0,
      finalDisplayOrder,
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000)
    );
    
    const newCategory = db.prepare('SELECT * FROM travel_categories WHERE id = ?').get(result.lastInsertRowid) as CategoryRow;
    
    db.close();
    res.status(201).json({
      id: newCategory.id,
      name: newCategory.name,
      slug: newCategory.slug,
      icon: newCategory.icon,
      color: newCategory.color,
      description: newCategory.description,
      isActive: Boolean(newCategory.isActive),
      displayOrder: newCategory.displayOrder,
      createdAt: newCategory.createdAt,
      updatedAt: newCategory.updatedAt
    });
  } catch (error) {
    console.error('Error creating travel category:', error);
    res.status(500).json({ error: 'Failed to create travel category' });
  }
});

// PUT /api/travel-categories/:id - Update travel category
router.put('/travel-categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, icon, color, description, isActive, displayOrder } = req.body;
    
    if (!name || !slug || !icon || !color) {
      return res.status(400).json({ error: 'Missing required fields: name, slug, icon, color' });
    }
    
    const db = new Database(dbPath);
    
    // Check if category exists
    const existing = db.prepare('SELECT * FROM travel_categories WHERE id = ?').get(id) as CategoryRow;
    if (!existing) {
      db.close();
      return res.status(404).json({ error: 'Travel category not found' });
    }
    
    // Check if slug is taken by another category
    const slugCheck = db.prepare('SELECT id FROM travel_categories WHERE slug = ? AND id != ?').get(slug, id);
    if (slugCheck) {
      db.close();
      return res.status(400).json({ error: 'Category with this slug already exists' });
    }
    
    db.prepare(`
      UPDATE travel_categories 
      SET name = ?, slug = ?, icon = ?, color = ?, description = ?, 
          isActive = ?, displayOrder = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      name,
      slug,
      icon,
      color,
      description || null,
      isActive ? 1 : 0,
      displayOrder || existing.displayOrder,
      Math.floor(Date.now() / 1000),
      id
    );
    
    const updatedCategory = db.prepare('SELECT * FROM travel_categories WHERE id = ?').get(id) as CategoryRow;
    
    db.close();
    res.json({
      id: updatedCategory.id,
      name: updatedCategory.name,
      slug: updatedCategory.slug,
      icon: updatedCategory.icon,
      color: updatedCategory.color,
      description: updatedCategory.description,
      isActive: Boolean(updatedCategory.isActive),
      displayOrder: updatedCategory.displayOrder,
      createdAt: updatedCategory.createdAt,
      updatedAt: updatedCategory.updatedAt
    });
  } catch (error) {
    console.error('Error updating travel category:', error);
    res.status(500).json({ error: 'Failed to update travel category' });
  }
});

// DELETE /api/travel-categories/:id - Delete travel category
router.delete('/travel-categories/:id', (req, res) => {
  try {
    const { password } = req.body;
    
    // Verify admin password (simple check for now)
    if (!password || password !== 'pickntrust2025') {
      return res.status(401).json({ error: 'Invalid admin password' });
    }
    
    const { id } = req.params;
    
    const db = new Database(dbPath);
    
    // Check if category exists
    const existing = db.prepare('SELECT * FROM travel_categories WHERE id = ?').get(id);
    if (!existing) {
      db.close();
      return res.status(404).json({ error: 'Travel category not found' });
    }
    
    // Delete the category
    db.prepare('DELETE FROM travel_categories WHERE id = ?').run(id);
    
    db.close();
    res.json({ message: 'Travel category deleted successfully' });
  } catch (error) {
    console.error('Error deleting travel category:', error);
    res.status(500).json({ error: 'Failed to delete travel category' });
  }
});

// GET /api/travel-deals - Get travel deals with category filtering
router.get('/travel-deals', (req, res) => {
  try {
    const { category } = req.query;
    
    const db = new Database(dbPath);
    
    let query = `
      SELECT * FROM travel_deals 
      WHERE processingStatus = 'active'
    `;
    
    const params: any[] = [];
    
    if (category && category !== '') {
      query += ` AND (travelType = ? OR subcategory = ? OR category = ?)`;
      params.push(category, category, category);
    }
    
    query += ` ORDER BY createdAt DESC`;
    
    const deals = db.prepare(query).all(...params);
    
    db.close();
    res.json(deals);
  } catch (error) {
    console.error('Error fetching travel deals:', error);
    res.status(500).json({ error: 'Failed to fetch travel deals' });
  }
});

// GET /api/travel-products/flights - Get flight products
router.get('/travel-products/flights', (req, res) => {
  try {
    const db = new Database(dbPath);
    
    // Query for flight-related products from unified_content
    const flights = db.prepare(`
      SELECT * FROM unified_content 
      WHERE (category LIKE '%flight%' OR title LIKE '%flight%' OR display_pages LIKE '%flight%')
      AND processing_status = 'active'
      ORDER BY created_at DESC
    `).all();
    
    db.close();
    res.json(flights);
  } catch (error) {
    console.error('Error fetching flight products:', error);
    res.status(500).json({ error: 'Failed to fetch flight products' });
  }
});

// Generic travel products endpoint to support all subcategories
// GET /api/travel-products/:category - Get travel-related products by category
router.get('/travel-products/:category', (req, res) => {
  try {
    const { category } = req.params;
    const cat = (category || '').toLowerCase();

    const db = new Database(dbPath);

    // Build inclusive filters per category to avoid empty results across legacy data
    let whereClause = '';
    switch (cat) {
      case 'flights':
        whereClause = `(category LIKE '%flight%' OR title LIKE '%flight%' OR display_pages LIKE '%flight%')`;
        break;
      case 'hotels':
        whereClause = `(category LIKE '%hotel%' OR title LIKE '%hotel%' OR display_pages LIKE '%hotel%' OR content_type = 'hotel')`;
        break;
      case 'tours':
        whereClause = `(category LIKE '%tour%' OR title LIKE '%tour%' OR display_pages LIKE '%tour%')`;
        break;
      case 'cruises':
        whereClause = `(category LIKE '%cruise%' OR title LIKE '%cruise%' OR display_pages LIKE '%cruise%')`;
        break;
      case 'bus':
        whereClause = `(category LIKE '%bus%' OR title LIKE '%bus%' OR display_pages LIKE '%bus%')`;
        break;
      case 'train':
        whereClause = `(category LIKE '%train%' OR title LIKE '%train%' OR display_pages LIKE '%train%')`;
        break;
      case 'packages':
        // Include "holiday" to capture package-like content
        whereClause = `(category LIKE '%package%' OR title LIKE '%package%' OR title LIKE '%holiday%' OR display_pages LIKE '%package%')`;
        break;
      case 'car-rental':
        whereClause = `(category LIKE '%car%' OR title LIKE '%car%' OR title LIKE '%rental%' OR title LIKE '%taxi%' OR display_pages LIKE '%car%')`;
        break;
      default:
        // Fallback to a broad match on category keyword
        whereClause = `(category LIKE '%' || ? || '%' OR title LIKE '%' || ? || '%' OR display_pages LIKE '%' || ? || '%')`;
        break;
    }

    const baseQuery = `
      SELECT * FROM unified_content
      WHERE ${whereClause}
        AND (processing_status = 'active' OR processing_status IS NULL)
        AND (status = 'active' OR status = 'published' OR status IS NULL)
        AND (visibility = 'public' OR visibility IS NULL)
      ORDER BY created_at DESC
    `;

    const products = (whereClause.includes('?')
      ? db.prepare(baseQuery).all(cat, cat, cat)
      : db.prepare(baseQuery).all()) as any[];

    db.close();

    // Map database field names to frontend-expected names where helpful
    const mapped = products.map((p: any) => ({
      ...p,
      // Ensure name is available (frontend often uses `name`)
      name: p.name ?? p.title,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching travel products by category:', error);
    res.status(500).json({ error: 'Failed to fetch travel products' });
  }
});

export default router;