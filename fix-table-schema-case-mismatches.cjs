/**
 * Fix Table Schema Case Mismatches and Missing Columns
 * Add missing columns to bot tables to ensure consistency with admin product creation
 */

const Database = require('better-sqlite3');

class TableSchemaFixer {
  constructor() {
    this.db = new Database('./database.sqlite');
  }

  /**
   * Add missing columns to bot tables
   */
  fixMissingColumns() {
    console.log('🔧 FIXING MISSING COLUMNS IN BOT TABLES');
    console.log('='.repeat(50));
    
    const fixes = [
      {
        table: 'cuelinks_products',
        columns: [
          { name: 'source', type: 'TEXT', defaultValue: "'admin'" }
        ]
      },
      {
        table: 'value_picks_products', 
        columns: [
          { name: 'source', type: 'TEXT', defaultValue: "'admin'" }
        ]
      },
      {
        table: 'travel_products',
        columns: [
          { name: 'affiliate_network', type: 'TEXT', defaultValue: "'travel'" },
          { name: 'content_type', type: 'TEXT', defaultValue: "'travel-picks'" },
          { name: 'expires_at', type: 'INTEGER', defaultValue: 'NULL' }
        ]
      },
      {
        table: 'click_picks_products',
        columns: [
          { name: 'source', type: 'TEXT', defaultValue: "'admin'" },
          { name: 'expires_at', type: 'INTEGER', defaultValue: 'NULL' }
        ]
      },
      {
        table: 'lootbox_products',
        columns: [
          { name: 'source', type: 'TEXT', defaultValue: "'admin'" },
          { name: 'expires_at', type: 'INTEGER', defaultValue: 'NULL' }
        ]
      }
    ];

    for (const fix of fixes) {
      console.log(`\n📋 Processing ${fix.table}:`);
      
      // Check if table exists
      const tableExists = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).get(fix.table);
      
      if (!tableExists) {
        console.log(`   ❌ Table ${fix.table} does not exist - skipping`);
        continue;
      }
      
      // Get current schema
      const currentSchema = this.db.prepare(`PRAGMA table_info(${fix.table})`).all();
      const existingColumns = currentSchema.map(col => col.name.toLowerCase());
      
      for (const column of fix.columns) {
        const columnExists = existingColumns.includes(column.name.toLowerCase());
        
        if (columnExists) {
          console.log(`   ✅ Column '${column.name}' already exists`);
        } else {
          try {
            const alterSQL = `ALTER TABLE ${fix.table} ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.defaultValue}`;
            console.log(`   🔧 Adding column: ${column.name} (${column.type})`);
            this.db.exec(alterSQL);
            console.log(`   ✅ Successfully added '${column.name}' to ${fix.table}`);
          } catch (error) {
            console.log(`   ❌ Failed to add '${column.name}' to ${fix.table}: ${error.message}`);
          }
        }
      }
    }
  }

  /**
   * Verify schema consistency after fixes
   */
  verifySchemaConsistency() {
    console.log('\n🔍 VERIFYING SCHEMA CONSISTENCY');
    console.log('='.repeat(50));
    
    const botTables = [
      'amazon_products',
      'cuelinks_products', 
      'value_picks_products',
      'travel_products',
      'click_picks_products',
      'global_picks_products',
      'deals_hub_products',
      'lootbox_products'
    ];
    
    // Expected columns that should be in admin product data
    const expectedAdminColumns = [
      'name', 'description', 'price', 'original_price', 'currency',
      'image_url', 'affiliate_url', 'category', 'rating', 'review_count',
      'discount', 'is_featured', 'affiliate_network', 'processing_status',
      'source', 'content_type', 'created_at', 'expires_at'
    ];
    
    console.log('\n📊 Checking each table for admin compatibility:');
    
    for (const tableName of botTables) {
      try {
        const schema = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
        const tableColumns = schema.map(col => col.name.toLowerCase());
        
        const missingColumns = expectedAdminColumns.filter(col => 
          !tableColumns.includes(col.toLowerCase())
        );
        
        console.log(`\n   📋 ${tableName}:`);
        console.log(`      Total columns: ${schema.length}`);
        
        if (missingColumns.length === 0) {
          console.log(`      ✅ All admin columns present`);
        } else {
          console.log(`      ⚠️  Missing columns: ${missingColumns.join(', ')}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking ${tableName}: ${error.message}`);
      }
    }
  }

  /**
   * Test admin product insertion compatibility
   */
  testAdminProductCompatibility() {
    console.log('\n🧪 TESTING ADMIN PRODUCT INSERTION COMPATIBILITY');
    console.log('='.repeat(50));
    
    const testProductData = {
      name: 'TEST: Schema Compatibility Check',
      description: 'Testing if admin product data structure works with bot tables',
      price: 1999,
      original_price: 2999,
      currency: 'INR',
      image_url: 'https://example.com/test.jpg',
      affiliate_url: 'https://example.com/affiliate',
      category: 'Electronics',
      rating: 4.5,
      review_count: 100,
      discount: 33,
      is_featured: 1,
      affiliate_network: 'test',
      processing_status: 'active',
      source: 'admin',
      content_type: 'test',
      created_at: Math.floor(Date.now() / 1000),
      expires_at: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
    };
    
    const testTables = ['amazon_products', 'cuelinks_products'];
    
    for (const tableName of testTables) {
      console.log(`\n🔍 Testing ${tableName}:`);
      
      try {
        // Get table schema
        const schema = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
        const tableColumns = schema.map(col => col.name);
        
        // Filter test data to only include columns that exist in the table
        const filteredData = {};
        const availableColumns = [];
        const missingColumns = [];
        
        Object.keys(testProductData).forEach(key => {
          if (tableColumns.includes(key)) {
            filteredData[key] = testProductData[key];
            availableColumns.push(key);
          } else {
            missingColumns.push(key);
          }
        });
        
        console.log(`   📊 Available columns: ${availableColumns.length}/${Object.keys(testProductData).length}`);
        
        if (missingColumns.length > 0) {
          console.log(`   ⚠️  Missing columns: ${missingColumns.join(', ')}`);
        }
        
        // Try to build INSERT query
        const columns = Object.keys(filteredData).join(', ');
        const placeholders = Object.keys(filteredData).map(() => '?').join(', ');
        const values = Object.values(filteredData);
        
        const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
        
        // Test the query preparation (don't actually insert)
        const stmt = this.db.prepare(insertQuery);
        console.log(`   ✅ INSERT query prepared successfully`);
        console.log(`   📝 Query: INSERT INTO ${tableName} (${columns.substring(0, 50)}...`);
        
      } catch (error) {
        console.log(`   ❌ Error testing ${tableName}: ${error.message}`);
      }
    }
  }

  /**
   * Run all fixes and verifications
   */
  runFixes() {
    console.log('🔧 TABLE SCHEMA CASE MISMATCH & MISSING COLUMN FIXES');
    console.log('='.repeat(60));
    console.log('🎯 Adding missing columns to ensure admin-bot table compatibility');
    console.log('='.repeat(60));
    
    try {
      this.fixMissingColumns();
      this.verifySchemaConsistency();
      this.testAdminProductCompatibility();
      
      console.log('\n✅ SCHEMA FIXES COMPLETE!');
      console.log('📊 All bot tables should now be compatible with admin product creation');
      
    } catch (error) {
      console.error('❌ Schema fix failed:', error.message);
    } finally {
      this.db.close();
    }
  }
}

// Run the fixes
const fixer = new TableSchemaFixer();
fixer.runFixes();