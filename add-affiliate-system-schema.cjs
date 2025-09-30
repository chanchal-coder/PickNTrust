const Database = require('better-sqlite3');

console.log('🔧 ADDING UNIVERSAL AFFILIATE SYSTEM SCHEMA');
console.log('=' .repeat(60));

try {
  const db = new Database('database.sqlite');
  
  console.log('📋 Adding affiliate system columns to all product tables...');
  console.log('');
  
  // Define affiliate columns to add
  const affiliateColumns = [
    'affiliate_network TEXT DEFAULT NULL',
    'affiliate_tag_applied INTEGER DEFAULT 0',
    'original_url TEXT DEFAULT NULL',
    'affiliate_config TEXT DEFAULT NULL' // JSON string for network-specific config
  ];
  
  // Product tables to update
  const productTables = [
    'amazon_products',
    'cuelinks_products', 
    'value_picks_products',
    'click_picks_products'
  ];
  
  // Add columns to each product table
  productTables.forEach(tableName => {
    console.log(`Refresh Updating ${tableName}...`);
    
    affiliateColumns.forEach(column => {
      try {
        const [columnName] = column.split(' ');
        
        // Check if column already exists
        const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
        const columnExists = tableInfo.some(col => col.name === columnName);
        
        if (!columnExists) {
          db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${column}`);
          console.log(`   Success Added ${columnName} column`);
        } else {
          console.log(`   Warning  Column ${columnName} already exists`);
        }
      } catch (error) {
        console.log(`   Error Error adding column: ${error.message}`);
      }
    });
    
    console.log('');
  });
  
  // Create affiliate configurations table
  console.log('Refresh Creating affiliate_configs table...');
  
  const createAffiliateConfigsTable = `
    CREATE TABLE IF NOT EXISTS affiliate_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      network_id TEXT NOT NULL UNIQUE,
      network_name TEXT NOT NULL,
      affiliate_id TEXT NOT NULL,
      sub_id TEXT DEFAULT NULL,
      enabled INTEGER DEFAULT 1,
      tag_parameter TEXT NOT NULL,
      tag_format TEXT NOT NULL,
      validation_pattern TEXT DEFAULT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `;
  
  db.exec(createAffiliateConfigsTable);
  console.log('Success Created affiliate_configs table');
  
  // Create affiliate analytics table
  console.log('Refresh Creating affiliate_analytics table...');
  
  const createAffiliateAnalyticsTable = `
    CREATE TABLE IF NOT EXISTS affiliate_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      product_table TEXT NOT NULL,
      network_id TEXT NOT NULL,
      original_url TEXT NOT NULL,
      affiliate_url TEXT NOT NULL,
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      revenue REAL DEFAULT 0.0,
      last_clicked_at INTEGER DEFAULT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `;
  
  db.exec(createAffiliateAnalyticsTable);
  console.log('Success Created affiliate_analytics table');
  
  // Insert default affiliate network configurations
  console.log('Refresh Inserting default affiliate network configurations...');
  
  const defaultConfigs = [
    {
      network_id: 'amazon',
      network_name: 'Amazon Associates',
      affiliate_id: 'your-amazon-tag',
      tag_parameter: 'tag',
      tag_format: '?tag={affiliateId}',
      validation_pattern: '^[a-zA-Z0-9-]{1,20}$',
      enabled: 0 // Disabled by default until user configures
    },
    {
      network_id: 'cuelinks',
      network_name: 'CueLinks',
      affiliate_id: 'your-cuelinks-id',
      tag_parameter: 'subid',
      tag_format: '&subid={affiliateId}',
      validation_pattern: '^[a-zA-Z0-9_-]{1,50}$',
      enabled: 0
    },
    {
      network_id: 'cj',
      network_name: 'Commission Junction',
      affiliate_id: 'your-cj-id',
      tag_parameter: 'sid',
      tag_format: '&sid={affiliateId}',
      validation_pattern: '^[0-9]{1,20}$',
      enabled: 0
    },
    {
      network_id: 'shareasale',
      network_name: 'ShareASale',
      affiliate_id: 'your-shareasale-id',
      tag_parameter: 'afftrack',
      tag_format: '&afftrack={affiliateId}',
      validation_pattern: '^[a-zA-Z0-9_-]{1,50}$',
      enabled: 0
    },
    {
      network_id: 'flipkart',
      network_name: 'Flipkart Affiliate',
      affiliate_id: 'your-flipkart-id',
      tag_parameter: 'affid',
      tag_format: '&affid={affiliateId}',
      validation_pattern: '^[a-zA-Z0-9]{1,20}$',
      enabled: 0
    }
  ];
  
  const insertConfig = db.prepare(`
    INSERT OR REPLACE INTO affiliate_configs 
    (network_id, network_name, affiliate_id, tag_parameter, tag_format, validation_pattern, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  defaultConfigs.forEach(config => {
    insertConfig.run(
      config.network_id,
      config.network_name,
      config.affiliate_id,
      config.tag_parameter,
      config.tag_format,
      config.validation_pattern,
      config.enabled
    );
    console.log(`   Success Added ${config.network_name} configuration`);
  });
  
  console.log('');
  
  // Verify the schema updates
  console.log('Success VERIFICATION - Updated table schemas:');
  console.log('=' .repeat(60));
  
  productTables.forEach(tableName => {
    console.log(`\n📋 ${tableName} schema:`);
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
    
    const affiliateRelatedColumns = tableInfo.filter(col => 
      col.name.includes('affiliate') || 
      col.name.includes('original_url')
    );
    
    if (affiliateRelatedColumns.length > 0) {
      affiliateRelatedColumns.forEach(col => {
        console.log(`   Success ${col.name} (${col.type})`);
      });
    } else {
      console.log('   Error No affiliate columns found');
    }
  });
  
  // Show affiliate configs
  console.log('\n📋 Affiliate Network Configurations:');
  const configs = db.prepare('SELECT * FROM affiliate_configs').all();
  configs.forEach(config => {
    console.log(`   ${config.network_name}: ${config.enabled ? 'Success Enabled' : 'Warning  Disabled'}`);
  });
  
  console.log('');
  console.log('Celebration UNIVERSAL AFFILIATE SYSTEM SCHEMA COMPLETE!');
  console.log('=' .repeat(60));
  console.log('Success All product tables updated with affiliate support');
  console.log('Success Affiliate configurations table created');
  console.log('Success Affiliate analytics table created');
  console.log('Success Default network configurations added');
  console.log('Success Ready for affiliate tag implementation');
  console.log('');
  console.log('Blog Next Steps:');
  console.log('   1. Configure your affiliate IDs in affiliate_configs table');
  console.log('   2. Enable networks by setting enabled = 1');
  console.log('   3. Apply affiliate tags to existing products');
  console.log('   4. Integrate with frontend pages');
  
  db.close();
  
} catch (error) {
  console.error('Error Schema update failed:', error.message);
  process.exit(1);
}