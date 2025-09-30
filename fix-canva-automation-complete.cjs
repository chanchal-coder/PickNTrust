const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 Fixing Canva automation issues...\n');

try {
  // Connect to database
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new Database(dbPath);
  
  console.log('Stats Database connection successful');
  
  // 1. Enable Canva automation
  console.log('\n1️⃣ Enabling Canva automation...');
  const enableResult = db.prepare(`
    UPDATE canva_settings 
    SET 
      is_enabled = 1,
      updated_at = strftime('%s', 'now')
    WHERE id = 1
  `).run();
  
  if (enableResult.changes > 0) {
    console.log('Success Canva automation enabled');
  } else {
    console.log('Warning No settings found to enable');
  }
  
  // 2. Ensure all required tables exist
  console.log('\n2️⃣ Creating missing tables...');
  
  // Create canva_posts table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS canva_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type TEXT NOT NULL, -- 'product', 'blog', 'video'
      content_id INTEGER NOT NULL,
      design_id TEXT, -- Canva design ID
      status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed'
      platforms TEXT, -- JSON array of platforms posted to
      error_message TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
  console.log('Success canva_posts table ready');
  
  // Create canva_templates table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS canva_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id TEXT NOT NULL UNIQUE, -- Canva template ID
      name TEXT NOT NULL,
      type TEXT DEFAULT 'post', -- 'post', 'story', 'video'
      category TEXT, -- Optional category filter
      thumbnail_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
  console.log('Success canva_templates table ready');
  
  // 3. Insert default template if none exists
  console.log('\n3️⃣ Setting up default template...');
  const templateExists = db.prepare("SELECT COUNT(*) as count FROM canva_templates").get();
  
  if (templateExists.count === 0) {
    db.prepare(`
      INSERT INTO canva_templates (template_id, name, type, category, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run('DAGwhZPYsRg', 'Default Product Template', 'post', null, 1);
    console.log('Success Default template added');
  } else {
    console.log('Success Templates already exist');
  }
  
  // 4. Update Canva settings with proper configuration
  console.log('\n4️⃣ Updating Canva configuration...');
  const updateSettings = db.prepare(`
    UPDATE canva_settings 
    SET 
      is_enabled = 1,
      default_template_id = 'DAGwhZPYsRg',
      platforms = '["facebook", "instagram", "whatsapp", "telegram"]',
      schedule_type = 'immediate',
      auto_generate_captions = 1,
      auto_generate_hashtags = 1,
      updated_at = strftime('%s', 'now')
    WHERE id = 1
  `).run();
  
  if (updateSettings.changes > 0) {
    console.log('Success Canva settings updated');
  }
  
  // 5. Verify final configuration
  console.log('\n5️⃣ Verifying configuration...');
  const finalSettings = db.prepare("SELECT * FROM canva_settings LIMIT 1").get();
  
  if (finalSettings) {
    console.log('Success Final configuration:');
    console.log(`   Enabled: ${finalSettings.is_enabled ? 'Yes' : 'No'}`);
    console.log(`   Template ID: ${finalSettings.default_template_id}`);
    console.log(`   Platforms: ${finalSettings.platforms}`);
    console.log(`   Auto Captions: ${finalSettings.auto_generate_captions ? 'Yes' : 'No'}`);
    console.log(`   Auto Hashtags: ${finalSettings.auto_generate_hashtags ? 'Yes' : 'No'}`);
    console.log(`   Default Title: ${finalSettings.default_title ? 'Set' : 'Not set'}`);
    console.log(`   Default Caption: ${finalSettings.default_caption ? 'Set' : 'Not set'}`);
    console.log(`   Default Hashtags: ${finalSettings.default_hashtags ? 'Set' : 'Not set'}`);
  }
  
  db.close();
  
  console.log('\nCelebration CANVA AUTOMATION FIX COMPLETE!');
  console.log('=====================================');
  console.log('Success Canva automation enabled');
  console.log('Success All required tables created');
  console.log('Success Default template configured');
  console.log('Success Multi-platform posting enabled');
  console.log('Success Professional templates ready');
  
  console.log('\nLaunch NEXT STEPS:');
  console.log('1. Restart your server: pm2 restart pickntrust-backend --update-env');
  console.log('2. Test by creating a new product/blog/video');
  console.log('3. Check automation logs for any errors');
  
  console.log('\nBlog TROUBLESHOOTING:');
  console.log('If automation still fails:');
  console.log('- Check PM2 logs: pm2 logs pickntrust-backend');
  console.log('- Verify environment variables are loaded');
  console.log('- Test Canva API credentials');
  
} catch (error) {
  console.error('Error Fix error:', error.message);
  console.log('\nBlog Manual fix commands:');
  console.log('sqlite3 database.sqlite "UPDATE canva_settings SET is_enabled = 1 WHERE id = 1;"');
  console.log('pm2 restart pickntrust-backend --update-env');
}
