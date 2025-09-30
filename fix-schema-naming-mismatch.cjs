const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Fixing Schema Naming Convention Mismatch...\n');

function fixNamingMismatch() {
  // Find the database file
  let dbFile = null;
  if (fs.existsSync('sqlite.db')) {
    dbFile = 'sqlite.db';
  } else if (fs.existsSync('database.sqlite')) {
    dbFile = 'database.sqlite';
  } else {
    console.log('Error No database file found!');
    return false;
  }

  console.log(`Upload Working with database: ${dbFile}`);
  
  try {
    const db = new Database(dbFile);
    
    console.log('Search Analyzing current schema...');
    
    // Check current table names
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`📋 Current tables: ${tables.map(t => t.name).join(', ')}`);
    
    // The issue is that Drizzle expects camelCase but database has snake_case
    // We need to update the schema file to match the database, not the other way around
    
    console.log('\n🔧 The real issue is in the schema configuration...');
    console.log('The database uses snake_case but Drizzle schema expects camelCase.');
    console.log('We need to update the Drizzle configuration to handle this properly.');
    
    // Check if tables exist with correct names
    const expectedTables = {
      'products': 'products',
      'categories': 'categories', 
      'blog_posts': 'blogPosts',
      'newsletter_subscribers': 'newsletterSubscribers',
      'affiliate_networks': 'affiliateNetworks',
      'admin_users': 'adminUsers',
      'announcements': 'announcements',
      'video_content': 'videoContent'
    };
    
    console.log('\nStats Table mapping check:');
    for (const [dbTable, schemaTable] of Object.entries(expectedTables)) {
      const exists = tables.find(t => t.name === dbTable);
      if (exists) {
        console.log(`  Success ${dbTable} -> ${schemaTable}`);
      } else {
        console.log(`  Error ${dbTable} -> ${schemaTable} (MISSING)`);
      }
    }
    
    // Check products table columns specifically
    console.log('\nSearch Products table column analysis:');
    try {
      const productColumns = db.prepare("PRAGMA table_info(products)").all();
      console.log('Current columns:', productColumns.map(c => c.name).join(', '));
      
      // Test a simple query to see what works
      const sampleProduct = db.prepare("SELECT * FROM products LIMIT 1").get();
      if (sampleProduct) {
        console.log('\nBlog Sample product structure:');
        console.log(Object.keys(sampleProduct).join(', '));
      }
      
    } catch (error) {
      console.log(`Error Error checking products table: ${error.message}`);
    }
    
    // Check categories table specifically for the gender issue
    console.log('\nSearch Categories table analysis:');
    try {
      const categoryColumns = db.prepare("PRAGMA table_info(categories)").all();
      console.log('Current columns:', categoryColumns.map(c => c.name).join(', '));
      
      // Check if Fashion category exists
      const fashionCategory = db.prepare("SELECT * FROM categories WHERE name LIKE '%Fashion%'").get();
      if (fashionCategory) {
        console.log(`\n👕 Fashion category found: ${fashionCategory.name} (ID: ${fashionCategory.id})`);
        console.log(`   Display order: ${fashionCategory.display_order || 'N/A'}`);
        console.log(`   For products: ${fashionCategory.is_for_products || 'N/A'}`);
      } else {
        console.log('\nError No Fashion category found!');
      }
      
    } catch (error) {
      console.log(`Error Error checking categories table: ${error.message}`);
    }
    
    db.close();
    
    console.log('\nTip SOLUTION IDENTIFIED:');
    console.log('1. The database schema is actually correct (uses snake_case)');
    console.log('2. The Drizzle ORM schema needs to be configured to map to snake_case columns');
    console.log('3. We need to update the schema file to use proper column mapping');
    
    return true;
    
  } catch (error) {
    console.log(`Error Database error: ${error.message}`);
    return false;
  }
}

// Generate the proper schema fix
function generateSchemaFix() {
  console.log('\nBlog Generating schema fix...');
  
  const schemaFix = `
// The issue is that Drizzle schema uses camelCase but database uses snake_case
// We need to add column mapping to the schema definitions

// Example fix for products table:
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price").notNull(),
  originalPrice: numeric("original_price"), // Map camelCase to snake_case
  imageUrl: text("image_url").notNull(),    // Map camelCase to snake_case
  affiliateUrl: text("affiliate_url").notNull(), // Map camelCase to snake_case
  // ... continue for all columns
});

// This way Drizzle will use the correct database column names
// while maintaining camelCase in TypeScript code
`;

  fs.writeFileSync('SCHEMA_FIX_GUIDE.md', `# Schema Naming Convention Fix

## Problem
The database uses snake_case column names but the Drizzle schema expects camelCase.

## Current Database Schema
- Tables: products, categories, blog_posts, newsletter_subscribers, etc.
- Columns: original_price, image_url, affiliate_url, etc.

## Current TypeScript Schema  
- Expects: originalPrice, imageUrl, affiliateUrl, etc.

## Solution
Update the Drizzle schema to map camelCase properties to snake_case columns:

${schemaFix}

## Files to Update
1. shared/sqlite-schema.ts - Add proper column mapping
2. server/storage.ts - Ensure queries work with mapped columns
3. Test all API endpoints after the fix

## Next Steps
1. Update the schema file with proper column mapping
2. Test database queries
3. Verify API endpoints work correctly
4. Test gender categorization functionality
`);

  console.log('📄 Schema fix guide saved as: SCHEMA_FIX_GUIDE.md');
}

// Run the analysis
const success = fixNamingMismatch();
if (success) {
  generateSchemaFix();
  console.log('\nTarget Next steps:');
  console.log('1. Update shared/sqlite-schema.ts with proper column mapping');
  console.log('2. Test the application after schema updates');
  console.log('3. Verify gender categorization works');
} else {
  console.log('\nError Analysis failed. Check database connection.');
}
