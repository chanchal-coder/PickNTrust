// Check Loot Box Database Schema and Fix Issues
// Manual database verification without using existing scripts

const Database = require('better-sqlite3');

console.log('Search CHECKING LOOT BOX DATABASE SCHEMA');
console.log('=' .repeat(50));

async function checkLootBoxSchema() {
  try {
    console.log('\n1. Stats Connecting to Database...');
    const db = new Database('database.sqlite');
    
    console.log('\n2. Search Checking Loot Box Table Existence...');
    
    // Check if loot_box_products table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='loot_box_products'
    `).get();
    
    if (!tableExists) {
      console.log('Error loot_box_products table does not exist');
      console.log('\n🔧 Creating loot_box_products table...');
      
      // Create the table with proper schema
      db.exec(`
        CREATE TABLE IF NOT EXISTS loot_box_products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price TEXT,
          original_price TEXT,
          discount_percentage TEXT,
          image_url TEXT,
          product_url TEXT,
          affiliate_url TEXT,
          rating REAL DEFAULT 0,
          reviews_count INTEGER DEFAULT 0,
          category TEXT,
          brand TEXT,
          description TEXT,
          features TEXT,
          specifications TEXT,
          availability TEXT DEFAULT 'In Stock',
          shipping_info TEXT,
          return_policy TEXT,
          warranty TEXT,
          tags TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1,
          source TEXT DEFAULT 'loot-box',
          affiliate_network TEXT,
          commission_rate TEXT,
          deal_type TEXT,
          deal_priority INTEGER DEFAULT 1,
          deal_badge TEXT,
          urgency_level INTEGER DEFAULT 1,
          stock_status TEXT DEFAULT 'available',
          price_history TEXT,
          engagement_score INTEGER DEFAULT 0,
          click_count INTEGER DEFAULT 0,
          view_count INTEGER DEFAULT 0,
          conversion_rate REAL DEFAULT 0,
          social_proof_count INTEGER DEFAULT 0,
          trending_score INTEGER DEFAULT 0,
          seasonal_relevance TEXT,
          target_audience TEXT,
          platform_specific_data TEXT
        )
      `);
      
      console.log('Success loot_box_products table created successfully');
    } else {
      console.log('Success loot_box_products table exists');
    }
    
    console.log('\n3. 📋 Checking Table Schema...');
    
    // Get table schema
    const schema = db.prepare(`PRAGMA table_info(loot_box_products)`).all();
    
    console.log(`\nStats Table Structure (${schema.length} columns):`);
    schema.forEach(column => {
      console.log(`   ${column.name} (${column.type}) ${column.notnull ? 'NOT NULL' : 'NULL'} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
    });
    
    console.log('\n4. Search Checking Required Columns...');
    
    const requiredColumns = [
      'id', 'name', 'price', 'image_url', 'product_url', 'affiliate_url',
      'category', 'created_at', 'is_active', 'source', 'deal_type',
      'deal_priority', 'urgency_level', 'engagement_score'
    ];
    
    const existingColumns = schema.map(col => col.name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`Error Missing columns: ${missingColumns.join(', ')}`);
      
      // Add missing columns
      for (const column of missingColumns) {
        try {
          let columnDef = '';
          switch (column) {
            case 'deal_type':
              columnDef = 'ALTER TABLE loot_box_products ADD COLUMN deal_type TEXT';
              break;
            case 'deal_priority':
              columnDef = 'ALTER TABLE loot_box_products ADD COLUMN deal_priority INTEGER DEFAULT 1';
              break;
            case 'urgency_level':
              columnDef = 'ALTER TABLE loot_box_products ADD COLUMN urgency_level INTEGER DEFAULT 1';
              break;
            case 'engagement_score':
              columnDef = 'ALTER TABLE loot_box_products ADD COLUMN engagement_score INTEGER DEFAULT 0';
              break;
            default:
              columnDef = `ALTER TABLE loot_box_products ADD COLUMN ${column} TEXT`;
          }
          
          db.exec(columnDef);
          console.log(`Success Added column: ${column}`);
        } catch (error) {
          console.log(`Warning Could not add column ${column}: ${error.message}`);
        }
      }
    } else {
      console.log('Success All required columns present');
    }
    
    console.log('\n5. Stats Checking Data...');
    
    const productCount = db.prepare(`SELECT COUNT(*) as count FROM loot_box_products`).get();
    console.log(`   Total products: ${productCount.count}`);
    
    if (productCount.count > 0) {
      const activeCount = db.prepare(`SELECT COUNT(*) as count FROM loot_box_products WHERE is_active = 1`).get();
      console.log(`   Active products: ${activeCount.count}`);
      
      const recentProducts = db.prepare(`
        SELECT name, deal_type, deal_priority, created_at 
        FROM loot_box_products 
        ORDER BY created_at DESC 
        LIMIT 5
      `).all();
      
      console.log('\nProducts Recent Products:');
      recentProducts.forEach(product => {
        console.log(`   - ${product.name} (${product.deal_type || 'No type'}, Priority: ${product.deal_priority || 'N/A'})`);
      });
    }
    
    console.log('\n6. Search Checking Indexes...');
    
    const indexes = db.prepare(`
      SELECT name, sql FROM sqlite_master 
      WHERE type='index' AND tbl_name='loot_box_products'
    `).all();
    
    console.log(`   Found ${indexes.length} indexes`);
    indexes.forEach(index => {
      if (index.name && !index.name.startsWith('sqlite_')) {
        console.log(`   - ${index.name}`);
      }
    });
    
    // Create essential indexes if missing
    const essentialIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_loot_box_active ON loot_box_products(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_loot_box_category ON loot_box_products(category)',
      'CREATE INDEX IF NOT EXISTS idx_loot_box_deal_priority ON loot_box_products(deal_priority)',
      'CREATE INDEX IF NOT EXISTS idx_loot_box_created_at ON loot_box_products(created_at)'
    ];
    
    console.log('\n🔧 Creating essential indexes...');
    essentialIndexes.forEach(indexSQL => {
      try {
        db.exec(indexSQL);
        console.log(`Success Index created/verified`);
      } catch (error) {
        console.log(`Warning Index issue: ${error.message}`);
      }
    });
    
    console.log('\n7. Success SCHEMA CHECK COMPLETED!');
    
    console.log('\nStats SUMMARY:');
    console.log(`   Success Table exists: ${tableExists ? 'Yes' : 'Created'}`);
    console.log(`   Success Columns: ${schema.length}`);
    console.log(`   Success Products: ${productCount.count}`);
    console.log(`   Success Indexes: ${indexes.length}`);
    
    console.log('\nTarget LOOT BOX DATABASE IS READY!');
    
    db.close();
    
  } catch (error) {
    console.error('Error Error checking loot box schema:', error.message);
  }
}

// Run the check
checkLootBoxSchema().catch(console.error);