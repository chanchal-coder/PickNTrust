// Check Database Schema for All Product Tables
// Understand the actual column structure to fix deletion issues

const Database = require('better-sqlite3');

console.log('Search CHECKING DATABASE SCHEMA FOR PRODUCT TABLES');
console.log('=' .repeat(60));

function checkDatabaseSchema() {
  try {
    const db = new Database('database.sqlite');
    
    // List of product tables to check
    const productTables = [
      'amazon_products',
      'loot_box_products', 
      'cuelinks_products',
      'value_picks_products',
      'click_picks_products',
      'global_picks_products',
      'dealshub_products',
      'products', // Main products table
      'category_products' // Category relationships
    ];
    
    console.log('\n📋 ANALYZING TABLE SCHEMAS...');
    console.log('=' .repeat(50));
    
    productTables.forEach(tableName => {
      try {
        console.log(`\nSearch Table: ${tableName}`);
        console.log('-'.repeat(30));
        
        // Check if table exists
        const tableExists = db.prepare(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name=?
        `).get(tableName);
        
        if (!tableExists) {
          console.log('   Error Table does not exist');
          return;
        }
        
        // Get table schema
        const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
        
        console.log(`   Stats Columns (${schema.length}):`);
        schema.forEach(column => {
          const nullable = column.notnull ? 'NOT NULL' : 'NULL';
          const defaultVal = column.dflt_value ? ` DEFAULT ${column.dflt_value}` : '';
          const primaryKey = column.pk ? ' PRIMARY KEY' : '';
          
          console.log(`      ${column.name}: ${column.type}${primaryKey} ${nullable}${defaultVal}`);
        });
        
        // Check for common status/expiration columns
        const statusColumns = schema.filter(col => 
          col.name.includes('status') || 
          col.name.includes('active') || 
          col.name.includes('expire') ||
          col.name.includes('created') ||
          col.name.includes('updated')
        );
        
        if (statusColumns.length > 0) {
          console.log(`   Target Status/Time columns:`);
          statusColumns.forEach(col => {
            console.log(`      Success ${col.name}: ${col.type}`);
          });
        }
        
        // Get sample data to understand the structure
        const sampleData = db.prepare(`SELECT * FROM ${tableName} LIMIT 3`).all();
        console.log(`   Products Sample records: ${sampleData.length}`);
        
        if (sampleData.length > 0) {
          console.log(`   📋 Sample data structure:`);
          const firstRecord = sampleData[0];
          Object.keys(firstRecord).slice(0, 5).forEach(key => {
            const value = firstRecord[key];
            const type = typeof value;
            const preview = String(value).substring(0, 30);
            console.log(`      ${key}: ${type} = "${preview}${String(value).length > 30 ? '...' : ''}"`);
          });
        }
        
      } catch (error) {
        console.log(`   Error Error checking ${tableName}: ${error.message}`);
      }
    });
    
    console.log('\nSearch CHECKING FOR EXPIRED/INACTIVE PRODUCTS...');
    console.log('=' .repeat(50));
    
    // Check each table for products that should be considered expired/inactive
    productTables.forEach(tableName => {
      if (tableName === 'category_products' || tableName === 'products') return;
      
      try {
        const tableExists = db.prepare(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name=?
        `).get(tableName);
        
        if (!tableExists) return;
        
        // Get total count
        const totalCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
        console.log(`\nStats ${tableName}: ${totalCount.count} total records`);
        
        // Check for different status patterns
        const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
        const columnNames = schema.map(col => col.name);
        
        // Check for is_active column
        if (columnNames.includes('is_active')) {
          const activeCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName} WHERE is_active = 1`).get();
          const inactiveCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName} WHERE is_active = 0`).get();
          console.log(`   Success Active (is_active=1): ${activeCount.count}`);
          console.log(`   Error Inactive (is_active=0): ${inactiveCount.count}`);
        }
        
        // Check for processing_status column
        if (columnNames.includes('processing_status')) {
          const statusCounts = db.prepare(`
            SELECT processing_status, COUNT(*) as count 
            FROM ${tableName} 
            GROUP BY processing_status
          `).all();
          
          console.log(`   📋 Processing status breakdown:`);
          statusCounts.forEach(status => {
            console.log(`      ${status.processing_status}: ${status.count}`);
          });
        }
        
        // Check for expires_at column
        if (columnNames.includes('expires_at')) {
          const currentTime = Math.floor(Date.now() / 1000);
          const expiredCount = db.prepare(`
            SELECT COUNT(*) as count FROM ${tableName} 
            WHERE expires_at IS NOT NULL AND expires_at < ?
          `).get(currentTime);
          
          const activeWithExpiry = db.prepare(`
            SELECT COUNT(*) as count FROM ${tableName} 
            WHERE expires_at IS NOT NULL AND expires_at > ?
          `).get(currentTime);
          
          console.log(`   ⏰ Expired (expires_at < now): ${expiredCount.count}`);
          console.log(`   Success Active with expiry: ${activeWithExpiry.count}`);
        }
        
      } catch (error) {
        console.log(`   Error Error checking ${tableName} status: ${error.message}`);
      }
    });
    
    console.log('\nSearch CHECKING CATEGORY RELATIONSHIPS...');
    console.log('=' .repeat(50));
    
    try {
      const categoryProducts = db.prepare(`
        SELECT product_table, COUNT(*) as count 
        FROM category_products 
        GROUP BY product_table
      `).all();
      
      console.log('Stats Category relationships by table:');
      categoryProducts.forEach(rel => {
        console.log(`   ${rel.product_table}: ${rel.count} relationships`);
      });
      
      // Check for orphaned relationships
      console.log('\nSearch Checking for orphaned category relationships...');
      
      const tables = ['amazon_products', 'loot_box_products', 'cuelinks_products', 'value_picks_products'];
      let totalOrphaned = 0;
      
      tables.forEach(table => {
        try {
          const orphaned = db.prepare(`
            SELECT COUNT(*) as count
            FROM category_products cp
            LEFT JOIN ${table} p ON cp.product_id = p.id
            WHERE cp.product_table = ? AND p.id IS NULL
          `).get(table);
          
          if (orphaned.count > 0) {
            console.log(`   Error ${table}: ${orphaned.count} orphaned relationships`);
            totalOrphaned += orphaned.count;
          } else {
            console.log(`   Success ${table}: No orphaned relationships`);
          }
        } catch (error) {
          console.log(`   Warning ${table}: Could not check (${error.message})`);
        }
      });
      
      console.log(`\nStats Total orphaned relationships: ${totalOrphaned}`);
      
    } catch (error) {
      console.log(`Error Error checking category relationships: ${error.message}`);
    }
    
    console.log('\nTip RECOMMENDATIONS BASED ON SCHEMA ANALYSIS:');
    console.log('=' .repeat(50));
    
    console.log('\n🔧 DELETION STRATEGY:');
    console.log('   1. Use is_active=0 for soft deletion where available');
    console.log('   2. Use processing_status for status-based filtering');
    console.log('   3. Check expires_at for time-based expiration');
    console.log('   4. Clean up orphaned category_products entries');
    
    console.log('\nBlog QUERY FILTERS NEEDED:');
    console.log('   - Amazon products: Use is_active=1 or processing_status="active"');
    console.log('   - Loot box products: Use is_active=1 or processing_status="active"');
    console.log('   - Add expires_at > current_time where applicable');
    console.log('   - Remove orphaned category relationships');
    
    db.close();
    
  } catch (error) {
    console.error('Error Error checking database schema:', error.message);
  }
}

// Run the schema check
checkDatabaseSchema();