const Database = require('better-sqlite3');

console.log('🔧 Updating Database Schema for Unified Pricing System...\n');

try {
  const db = new Database('database.sqlite');
  
  console.log('📋 Current unified_content table schema:');
  const currentSchema = db.prepare('PRAGMA table_info(unified_content)').all();
  const existingColumns = currentSchema.map(col => col.name);
  console.log('Existing columns:', existingColumns.join(', '));
  
  // Define the new pricing columns we need to add
  const newPricingColumns = [
    { name: 'pricing_type', type: 'TEXT', default: "'one-time'" },
    { name: 'monthly_price', type: 'TEXT', default: 'NULL' },
    { name: 'yearly_price', type: 'TEXT', default: 'NULL' },
    { name: 'is_free', type: 'INTEGER', default: '0' },
    { name: 'price_description', type: 'TEXT', default: 'NULL' },
    { name: 'custom_pricing_details', type: 'TEXT', default: 'NULL' }
  ];
  
  console.log('\n🏗️ Adding new unified pricing columns...');
  
  // Add each column if it doesn't exist
  for (const column of newPricingColumns) {
    if (!existingColumns.includes(column.name)) {
      try {
        const sql = `ALTER TABLE unified_content ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}`;
        db.exec(sql);
        console.log(`✅ Added column: ${column.name} (${column.type})`);
      } catch (error) {
        console.log(`⚠️ Column ${column.name} might already exist or error: ${error.message}`);
      }
    } else {
      console.log(`⏭️ Column ${column.name} already exists`);
    }
  }
  
  console.log('\n📊 Updated schema:');
  const updatedSchema = db.prepare('PRAGMA table_info(unified_content)').all();
  const pricingColumns = updatedSchema.filter(col => 
    col.name.includes('price') || 
    col.name.includes('pricing') || 
    col.name === 'is_free'
  );
  
  console.log('Pricing-related columns:');
  pricingColumns.forEach(col => {
    console.log(`  - ${col.name}: ${col.type} ${col.dflt_value ? `(default: ${col.dflt_value})` : ''}`);
  });
  
  // Update existing records to have proper pricing_type
  console.log('\n🔄 Updating existing records...');
  const updateResult = db.prepare(`
    UPDATE unified_content 
    SET pricing_type = CASE 
      WHEN price = '0' OR price = 'Free' OR price = 'free' THEN 'free'
      WHEN price LIKE '%/month%' OR price LIKE '%monthly%' THEN 'monthly'
      WHEN price LIKE '%/year%' OR price LIKE '%yearly%' THEN 'yearly'
      ELSE 'one-time'
    END,
    is_free = CASE 
      WHEN price = '0' OR price = 'Free' OR price = 'free' THEN 1
      ELSE 0
    END
    WHERE pricing_type IS NULL OR pricing_type = 'one-time'
  `).run();
  
  console.log(`✅ Updated ${updateResult.changes} existing records with pricing types`);
  
  // Show sample of updated records
  console.log('\n📝 Sample records with new pricing structure:');
  const samples = db.prepare(`
    SELECT id, title, price, original_price, pricing_type, monthly_price, yearly_price, is_free
    FROM unified_content 
    WHERE content_type = 'product'
    LIMIT 3
  `).all();
  
  samples.forEach((record, index) => {
    console.log(`${index + 1}. ${record.title}`);
    console.log(`   Price: ${record.price}, Original: ${record.original_price}`);
    console.log(`   Type: ${record.pricing_type}, Free: ${record.is_free ? 'Yes' : 'No'}`);
    console.log(`   Monthly: ${record.monthly_price || 'N/A'}, Yearly: ${record.yearly_price || 'N/A'}`);
  });
  
  db.close();
  console.log('\n✅ Database schema update completed successfully!');
  
} catch (error) {
  console.error('❌ Error updating database schema:', error.message);
}