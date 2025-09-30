const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('Search Comprehensive Schema and Database Check...\n');

// Check schema file first
function checkSchemaFile() {
  console.log('📄 Checking Schema File...');
  
  const schemaPath = path.join('shared', 'sqlite-schema.ts');
  if (!fs.existsSync(schemaPath)) {
    console.log('Error Schema file not found at shared/sqlite-schema.ts');
    return false;
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Check for all required tables
  const requiredTables = [
    'products', 'categories', 'blogPosts', 'newsletterSubscribers', 
    'affiliateNetworks', 'adminUsers', 'announcements', 'videoContent'
  ];
  
  console.log('Search Checking table definitions in schema:');
  for (const table of requiredTables) {
    if (schemaContent.includes(`export const ${table}`)) {
      console.log(`  Success ${table} table defined`);
    } else {
      console.log(`  Error ${table} table missing`);
    }
  }
  
  return true;
}

// Check database files
function checkDatabaseFiles() {
  console.log('\nUpload Checking Database Files...');
  
  const dbFiles = ['database.sqlite', 'sqlite.db'];
  const existingDbs = [];
  
  for (const dbFile of dbFiles) {
    if (fs.existsSync(dbFile)) {
      const stats = fs.statSync(dbFile);
      console.log(`  Success ${dbFile} exists (${Math.round(stats.size / 1024)}KB)`);
      existingDbs.push(dbFile);
    } else {
      console.log(`  Error ${dbFile} not found`);
    }
  }
  
  return existingDbs;
}

// Check database schema against expected schema
function checkDatabaseSchema(dbFile) {
  console.log(`\nSearch Checking ${dbFile} Schema...`);
  
  try {
    const db = new Database(dbFile);
    
    // Get all tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`📋 Tables found: ${tables.map(t => t.name).join(', ')}`);
    
    // Expected tables and their required columns
    const expectedSchema = {
      products: [
        'id', 'name', 'description', 'price', 'originalPrice', 'imageUrl', 
        'affiliateUrl', 'affiliateNetworkId', 'category', 'gender', 'rating', 
        'reviewCount', 'discount', 'isNew', 'isFeatured', 'isService', 
        'customFields', 'pricingType', 'monthlyPrice', 'yearlyPrice', 'isFree', 
        'priceDescription', 'hasTimer', 'timerDuration', 'timerStartTime', 'createdAt'
      ],
      categories: [
        'id', 'name', 'icon', 'color', 'description', 'isForProducts', 
        'isForServices', 'displayOrder'
      ],
      blogPosts: [
        'id', 'title', 'excerpt', 'content', 'category', 'tags', 'imageUrl', 
        'videoUrl', 'publishedAt', 'createdAt', 'readTime', 'slug', 'hasTimer', 
        'timerDuration', 'timerStartTime'
      ],
      newsletterSubscribers: ['id', 'email', 'subscribedAt'],
      affiliateNetworks: [
        'id', 'name', 'slug', 'description', 'commissionRate', 'trackingParams', 
        'logoUrl', 'isActive', 'joinUrl'
      ],
      adminUsers: [
        'id', 'username', 'email', 'passwordHash', 'resetToken', 'resetTokenExpiry', 
        'lastLogin', 'createdAt', 'isActive'
      ],
      announcements: [
        'id', 'message', 'isActive', 'textColor', 'backgroundColor', 'fontSize', 
        'fontWeight', 'textDecoration', 'fontStyle', 'animationSpeed', 
        'textBorderWidth', 'textBorderStyle', 'textBorderColor', 'bannerBorderWidth', 
        'bannerBorderStyle', 'bannerBorderColor', 'createdAt'
      ],
      videoContent: [
        'id', 'title', 'description', 'videoUrl', 'thumbnailUrl', 'platform', 
        'category', 'tags', 'duration', 'hasTimer', 'timerDuration', 
        'timerStartTime', 'createdAt'
      ]
    };
    
    const issues = [];
    
    // Check each expected table
    for (const [tableName, expectedColumns] of Object.entries(expectedSchema)) {
      const tableExists = tables.find(t => t.name === tableName);
      
      if (!tableExists) {
        console.log(`Error Table '${tableName}' missing`);
        issues.push(`Missing table: ${tableName}`);
        continue;
      }
      
      // Check columns for this table
      try {
        const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
        const existingColumns = columns.map(col => col.name);
        
        console.log(`\n📋 ${tableName} table:`);
        console.log(`  Expected: ${expectedColumns.length} columns`);
        console.log(`  Found: ${existingColumns.length} columns`);
        
        const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));
        const extraColumns = existingColumns.filter(col => !expectedColumns.includes(col));
        
        if (missingColumns.length > 0) {
          console.log(`  Error Missing columns: ${missingColumns.join(', ')}`);
          issues.push(`${tableName}: Missing columns - ${missingColumns.join(', ')}`);
        }
        
        if (extraColumns.length > 0) {
          console.log(`  Warning  Extra columns: ${extraColumns.join(', ')}`);
        }
        
        if (missingColumns.length === 0 && extraColumns.length === 0) {
          console.log(`  Success Schema matches perfectly`);
        }
        
        // Test a simple query
        try {
          const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
          console.log(`  Stats Records: ${count.count}`);
        } catch (queryError) {
          console.log(`  Error Query failed: ${queryError.message}`);
          issues.push(`${tableName}: Query test failed - ${queryError.message}`);
        }
        
      } catch (error) {
        console.log(`  Error Error checking ${tableName}: ${error.message}`);
        issues.push(`${tableName}: Schema check failed - ${error.message}`);
      }
    }
    
    db.close();
    return issues;
    
  } catch (error) {
    console.log(`Error Database error: ${error.message}`);
    return [`Database connection failed: ${error.message}`];
  }
}

// Generate fix script for issues
function generateFixScript(issues) {
  if (issues.length === 0) return null;
  
  console.log('\n🔧 Generating Fix Script...');
  
  let fixScript = `const Database = require('better-sqlite3');

console.log('🔧 Fixing Database Schema Issues...');

function fixDatabase() {
  const dbFile = require('fs').existsSync('sqlite.db') ? 'sqlite.db' : 'database.sqlite';
  const db = new Database(dbFile);
  
  try {
`;

  // Add fixes based on issues
  for (const issue of issues) {
    if (issue.includes('Missing columns')) {
      const [tableName, columnInfo] = issue.split(': Missing columns - ');
      const columns = columnInfo.split(', ');
      
      for (const column of columns) {
        // Define column types based on schema
        let columnDef = 'TEXT';
        if (column.includes('id') || column.includes('Count') || column.includes('Order')) {
          columnDef = 'INTEGER';
        } else if (column.includes('price') || column.includes('rating')) {
          columnDef = 'NUMERIC';
        } else if (column.includes('is') || column.includes('has')) {
          columnDef = 'INTEGER DEFAULT 0';
        } else if (column.includes('At') || column.includes('Time')) {
          columnDef = 'INTEGER';
        }
        
        fixScript += `    // Add ${column} to ${tableName}
    try {
      db.prepare('ALTER TABLE ${tableName} ADD COLUMN ${column} ${columnDef}').run();
      console.log('Success Added ${column} to ${tableName}');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add ${column}:', e.message);
      }
    }
    
`;
      }
    }
  }

  fixScript += `    console.log('Success Database fixes completed');
    db.close();
    return true;
    
  } catch (error) {
    console.log('Error Fix failed:', error.message);
    db.close();
    return false;
  }
}

fixDatabase();
`;

  fs.writeFileSync('auto-fix-database.cjs', fixScript);
  console.log('Blog Fix script saved as: auto-fix-database.cjs');
  
  return 'auto-fix-database.cjs';
}

// Main execution
async function runComprehensiveCheck() {
  console.log('Launch Starting Comprehensive Schema Check...\n');
  
  // Check schema file
  const schemaOk = checkSchemaFile();
  
  // Check database files
  const dbFiles = checkDatabaseFiles();
  
  if (dbFiles.length === 0) {
    console.log('\nError No database files found! Need to initialize database.');
    return;
  }
  
  // Check each database
  let allIssues = [];
  for (const dbFile of dbFiles) {
    const issues = checkDatabaseSchema(dbFile);
    allIssues = allIssues.concat(issues.map(issue => `${dbFile}: ${issue}`));
  }
  
  // Summary
  console.log('\nStats SUMMARY:');
  console.log(`Schema file: ${schemaOk ? 'Success OK' : 'Error Issues'}`);
  console.log(`Database files: ${dbFiles.length} found`);
  console.log(`Total issues: ${allIssues.length}`);
  
  if (allIssues.length > 0) {
    console.log('\nError Issues found:');
    allIssues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
    
    const fixScript = generateFixScript(allIssues);
    if (fixScript) {
      console.log(`\n🔧 Run: node ${fixScript}`);
    }
  } else {
    console.log('\nCelebration All checks passed! Database schema is correct.');
  }
}

runComprehensiveCheck();
