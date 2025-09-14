const Database = require('better-sqlite3');
const path = require('path');

console.log('🎨 Adding default values to Canva settings...\n');

try {
  // Connect to database
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new Database(dbPath);
  
  console.log('Stats Connected to database:', dbPath);
  
  // Check if canva_settings table exists and has data
  const tableInfo = db.prepare("PRAGMA table_info(canva_settings)").all();
  console.log(`📋 Found ${tableInfo.length} columns in canva_settings table`);
  
  // Check current data
  const currentData = db.prepare("SELECT * FROM canva_settings LIMIT 1").get();
  
  if (!currentData) {
    console.log('Blog No existing settings found. Creating default settings...');
    
    // Insert default settings
    const insertStmt = db.prepare(`
      INSERT INTO canva_settings (
        is_enabled,
        auto_generate_captions,
        auto_generate_hashtags,
        default_title,
        default_caption,
        default_hashtags,
        platforms,
        schedule_type,
        schedule_delay_minutes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const defaultValues = [
      0, // is_enabled
      1, // auto_generate_captions
      1, // auto_generate_hashtags
      'Deal Amazing {category} Deal: {title}', // default_title
      'Deal Amazing {category} Alert! Special {title}\n\nPrice Price: ₹{price}\nLink Get the best deals at PickNTrust!\n👆 Link in bio or story', // default_caption
      '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India #BestDeals #Trending', // default_hashtags
      '["instagram", "facebook", "whatsapp", "telegram"]', // platforms (JSON)
      'immediate', // schedule_type
      0, // schedule_delay_minutes
      Math.floor(Date.now() / 1000), // created_at (Unix timestamp)
      Math.floor(Date.now() / 1000)  // updated_at (Unix timestamp)
    ];
    
    const result = insertStmt.run(...defaultValues);
    console.log('Success Default settings inserted with ID:', result.lastInsertRowid);
    
  } else {
    console.log('Blog Existing settings found. Updating default values...');
    
    // Update existing record with default values if they're NULL
    const updateStmt = db.prepare(`
      UPDATE canva_settings 
      SET 
        default_title = COALESCE(default_title, ?),
        default_caption = COALESCE(default_caption, ?),
        default_hashtags = COALESCE(default_hashtags, ?),
        platforms = COALESCE(platforms, ?),
        schedule_type = COALESCE(schedule_type, ?),
        auto_generate_captions = COALESCE(auto_generate_captions, ?),
        auto_generate_hashtags = COALESCE(auto_generate_hashtags, ?),
        updated_at = ?
      WHERE id = ?
    `);
    
    const updateValues = [
      'Deal Amazing {category} Deal: {title}', // default_title
      'Deal Amazing {category} Alert! Special {title}\n\nPrice Price: ₹{price}\nLink Get the best deals at PickNTrust!\n👆 Link in bio or story', // default_caption
      '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India #BestDeals #Trending', // default_hashtags
      '["instagram", "facebook", "whatsapp", "telegram"]', // platforms
      'immediate', // schedule_type
      1, // auto_generate_captions
      1, // auto_generate_hashtags
      Math.floor(Date.now() / 1000), // updated_at
      currentData.id // WHERE id
    ];
    
    const result = updateStmt.run(...updateValues);
    console.log('Success Settings updated. Changes:', result.changes);
  }
  
  // Verify the final result
  console.log('\nStats Final verification:');
  const finalData = db.prepare(`
    SELECT 
      id,
      is_enabled,
      default_title,
      default_caption,
      default_hashtags,
      platforms,
      schedule_type,
      auto_generate_captions,
      auto_generate_hashtags
    FROM canva_settings 
    LIMIT 1
  `).get();
  
  if (finalData) {
    console.log('Success Settings verified:');
    console.log(`   ID: ${finalData.id}`);
    console.log(`   Enabled: ${finalData.is_enabled ? 'Yes' : 'No'}`);
    console.log(`   Default Title: "${finalData.default_title}"`);
    console.log(`   Default Caption: "${finalData.default_caption?.substring(0, 50)}..."`);
    console.log(`   Default Hashtags: "${finalData.default_hashtags}"`);
    console.log(`   Platforms: ${finalData.platforms}`);
    console.log(`   Schedule Type: ${finalData.schedule_type}`);
    console.log(`   Auto Captions: ${finalData.auto_generate_captions ? 'Yes' : 'No'}`);
    console.log(`   Auto Hashtags: ${finalData.auto_generate_hashtags ? 'Yes' : 'No'}`);
  }
  
  db.close();
  console.log('\nCelebration Default values setup complete!');
  console.log('Launch Your Canva automation is now ready with proper default templates!');
  
} catch (error) {
  console.error('Error Error setting up default values:', error.message);
  console.log('\nBlog Manual setup instructions:');
  console.log('Run this SQL command in your database:');
  console.log(`
UPDATE canva_settings 
SET 
  default_title = 'Deal Amazing {category} Deal: {title}',
  default_caption = 'Deal Amazing {category} Alert! Special {title}

Price Price: ₹{price}
Link Get the best deals at PickNTrust!
👆 Link in bio or story',
  default_hashtags = '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India #BestDeals #Trending',
  platforms = '["instagram", "facebook", "whatsapp", "telegram"]',
  schedule_type = 'immediate',
  auto_generate_captions = 1,
  auto_generate_hashtags = 1,
  updated_at = strftime('%s', 'now')
WHERE id = 1;
  `);
}
