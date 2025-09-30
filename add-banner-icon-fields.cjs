// Add Icon and Emoji Support to Banners Table
// Adds icon, iconType, and iconPosition columns to the banners table

const Database = require('better-sqlite3');

console.log('🎨 ADDING ICON SUPPORT TO BANNERS');
console.log('=' .repeat(50));

async function addIconFields() {
  try {
    const db = new Database('database.sqlite');
    
    console.log('\n1️⃣ Checking current banners table structure...');
    
    // Check if columns already exist
    const tableInfo = db.prepare("PRAGMA table_info(banners)").all();
    const existingColumns = tableInfo.map(col => col.name);
    
    console.log('   Current columns:', existingColumns.join(', '));
    
    const columnsToAdd = [
      { name: 'icon', type: 'TEXT', defaultValue: "''" },
      { name: 'iconType', type: 'TEXT', defaultValue: "'none'" },
      { name: 'iconPosition', type: 'TEXT', defaultValue: "'left'" }
    ];
    
    let columnsAdded = 0;
    
    console.log('\n2️⃣ Adding icon columns...');
    
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        try {
          const sql = `ALTER TABLE banners ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.defaultValue}`;
          db.exec(sql);
          console.log(`   ✅ Added column: ${column.name}`);
          columnsAdded++;
        } catch (error) {
          console.log(`   ❌ Failed to add column ${column.name}: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️ Column ${column.name} already exists`);
      }
    }
    
    console.log('\n3️⃣ Verifying table structure...');
    
    // Check final table structure
    const finalTableInfo = db.prepare("PRAGMA table_info(banners)").all();
    const finalColumns = finalTableInfo.map(col => col.name);
    
    console.log('   Final columns:', finalColumns.join(', '));
    
    // Check if all icon columns are present
    const iconColumns = ['icon', 'iconType', 'iconPosition'];
    const missingColumns = iconColumns.filter(col => !finalColumns.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('   ✅ All icon columns are present');
    } else {
      console.log(`   ❌ Missing columns: ${missingColumns.join(', ')}`);
    }
    
    console.log('\n4️⃣ Testing with sample data...');
    
    // Test inserting a banner with icon data
    try {
      const testResult = db.prepare(`
        INSERT INTO banners (
          page, title, subtitle, imageUrl, linkUrl, buttonText,
          isActive, display_order, icon, iconType, iconPosition,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        'test-page',
        '🚀 Test Banner with Icon',
        'Testing icon functionality',
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop&q=80',
        '/test',
        'Test Button',
        0, // isActive = false (test only)
        999, // high display_order so it doesn't interfere
        '🎉', // icon
        'emoji', // iconType
        'left' // iconPosition
      );
      
      console.log(`   ✅ Test banner created with ID: ${testResult.lastInsertRowid}`);
      
      // Retrieve and verify the test banner
      const testBanner = db.prepare('SELECT * FROM banners WHERE id = ?').get(testResult.lastInsertRowid);
      console.log('   📋 Test banner data:');
      console.log(`      Title: ${testBanner.title}`);
      console.log(`      Icon: ${testBanner.icon}`);
      console.log(`      Icon Type: ${testBanner.iconType}`);
      console.log(`      Icon Position: ${testBanner.iconPosition}`);
      
      // Clean up test banner
      db.prepare('DELETE FROM banners WHERE id = ?').run(testResult.lastInsertRowid);
      console.log('   🧹 Test banner cleaned up');
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }
    
    console.log('\n5️⃣ Updating existing banners with default values...');
    
    // Update existing banners to have default icon values
    const updateResult = db.prepare(`
      UPDATE banners 
      SET icon = COALESCE(icon, ''),
          iconType = COALESCE(iconType, 'none'),
          iconPosition = COALESCE(iconPosition, 'left')
      WHERE icon IS NULL OR iconType IS NULL OR iconPosition IS NULL
    `).run();
    
    console.log(`   ✅ Updated ${updateResult.changes} existing banners with default icon values`);
    
    console.log('\n6️⃣ Final summary...');
    
    // Get count of all banners
    const totalBanners = db.prepare('SELECT COUNT(*) as count FROM banners').get().count;
    console.log(`   📊 Total banners in database: ${totalBanners}`);
    
    // Get count of banners with icons
    const bannersWithIcons = db.prepare(`
      SELECT COUNT(*) as count FROM banners 
      WHERE iconType != 'none' AND icon != ''
    `).get().count;
    console.log(`   🎨 Banners with icons: ${bannersWithIcons}`);
    
    db.close();
    
    console.log('\n✅ ICON SUPPORT SUCCESSFULLY ADDED!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Open the banner management admin panel');
    console.log('   3. Edit existing banners to add icons and emojis');
    console.log('   4. Create new banners with icon support');
    console.log('   5. Icons will display on both admin preview and frontend');
    
    if (columnsAdded > 0) {
      console.log('\n🎉 Database schema updated successfully!');
      console.log(`   Added ${columnsAdded} new columns for icon support`);
    } else {
      console.log('\n✅ Database schema was already up to date!');
    }
    
  } catch (error) {
    console.error('❌ Error adding icon fields:', error.message);
  }
}

// Run the update
addIconFields();