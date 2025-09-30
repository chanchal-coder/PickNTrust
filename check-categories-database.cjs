const Database = require('better-sqlite3');
const path = require('path');

console.log('Search Checking Categories Database and Schema...\n');

async function checkCategoriesDatabase() {
  let db;
  
  try {
    // Check both database files
    const dbFiles = ['database.sqlite', 'sqlite.db'];
    
    for (const dbFile of dbFiles) {
      console.log(`\nUpload Checking ${dbFile}...`);
      
      if (!require('fs').existsSync(dbFile)) {
        console.log(`Error ${dbFile} does not exist!`);
        continue;
      }
      
      db = new Database(dbFile);
      
      // Check if categories table exists
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='categories'
      `).get();
      
      if (!tableExists) {
        console.log(`Error Categories table does not exist in ${dbFile}!`);
        continue;
      }
      
      console.log(`Success Categories table exists in ${dbFile}`);
      
      // Check table schema
      console.log('\n📋 Table Schema:');
      const schema = db.prepare("PRAGMA table_info(categories)").all();
      schema.forEach(col => {
        console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
      });
      
      // Check for required columns
      const requiredColumns = ['id', 'name', 'icon', 'color', 'description', 'displayOrder'];
      const existingColumns = schema.map(col => col.name);
      
      console.log('\nSearch Column Check:');
      for (const col of requiredColumns) {
        if (existingColumns.includes(col)) {
          console.log(`  Success ${col} - exists`);
        } else {
          console.log(`  Error ${col} - MISSING!`);
        }
      }
      
      // Count categories
      const count = db.prepare("SELECT COUNT(*) as count FROM categories").get();
      console.log(`\nStats Total categories: ${count.count}`);
      
      if (count.count > 0) {
        console.log('\nBlog Sample categories:');
        const samples = db.prepare("SELECT id, name, displayOrder FROM categories ORDER BY displayOrder LIMIT 10").all();
        samples.forEach(cat => {
          console.log(`  ${cat.id}. ${cat.name} (Order: ${cat.displayOrder || 'NULL'})`);
        });
        
        // Check for Fashion & Clothing specifically
        const fashionCategory = db.prepare("SELECT * FROM categories WHERE name LIKE '%Fashion%'").get();
        if (fashionCategory) {
          console.log(`\n👕 Fashion Category Found:`);
          console.log(`  ID: ${fashionCategory.id}`);
          console.log(`  Name: ${fashionCategory.name}`);
          console.log(`  Display Order: ${fashionCategory.displayOrder || 'NULL'}`);
          console.log(`  Icon: ${fashionCategory.icon || 'NULL'}`);
          console.log(`  Color: ${fashionCategory.color || 'NULL'}`);
        } else {
          console.log('\nError Fashion & Clothing category not found!');
        }
      } else {
        console.log('\nError No categories found in database!');
      }
      
      db.close();
    }
    
  } catch (error) {
    console.error('Error Database Error:', error.message);
    if (db) db.close();
  }
}

// Also check the schema file
function checkSchemaFile() {
  console.log('\n📄 Checking Schema File...');
  
  try {
    const schemaPath = path.join('shared', 'sqlite-schema.ts');
    if (!require('fs').existsSync(schemaPath)) {
      console.log('Error Schema file not found!');
      return;
    }
    
    const schemaContent = require('fs').readFileSync(schemaPath, 'utf8');
    
    // Check for categories table definition
    if (schemaContent.includes('export const categories')) {
      console.log('Success Categories table definition found in schema');
      
      // Check for displayOrder field
      if (schemaContent.includes('displayOrder')) {
        console.log('Success displayOrder field found in schema');
      } else {
        console.log('Error displayOrder field missing from schema!');
      }
      
      // Check for other required fields
      const requiredFields = ['name', 'icon', 'color', 'description'];
      for (const field of requiredFields) {
        if (schemaContent.includes(`${field}:`)) {
          console.log(`Success ${field} field found in schema`);
        } else {
          console.log(`Error ${field} field missing from schema!`);
        }
      }
      
    } else {
      console.log('Error Categories table definition not found in schema!');
    }
    
  } catch (error) {
    console.error('Error Schema Error:', error.message);
  }
}

// Run checks
checkCategoriesDatabase().then(() => {
  checkSchemaFile();
  
  console.log('\n🔧 Recommendations:');
  console.log('1. Ensure both database.sqlite and sqlite.db have the same schema');
  console.log('2. Verify all required columns exist with correct types');
  console.log('3. Check that categories are properly populated');
  console.log('4. Ensure displayOrder field exists for category ordering');
  console.log('5. Verify Fashion & Clothing category exists for gender testing');
});
