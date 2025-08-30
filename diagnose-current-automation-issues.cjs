const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔍 DIAGNOSING CURRENT CANVA AUTOMATION ISSUES...\n');

async function diagnoseAutomation() {
  try {
    // 1. Check database connection and tables
    console.log('1️⃣ Checking database and tables...');
    const dbFile = fs.existsSync('sqlite.db') ? 'sqlite.db' : 'database.sqlite';
    const db = new Database(dbFile);
    
    // Check if all required tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map(t => t.name);
    
    const requiredTables = ['canva_settings', 'canva_posts', 'canva_templates'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log('❌ Missing tables:', missingTables);
    } else {
      console.log('✅ All required tables exist');
    }
    
    // 2. Check canva_settings table structure and data
    console.log('\n2️⃣ Checking canva_settings...');
    try {
      const settings = db.prepare('SELECT * FROM canva_settings WHERE id = 1').get();
      if (settings) {
        console.log('✅ Canva settings found:');
        console.log('   - Enabled:', settings.is_enabled ? 'Yes' : 'No');
        console.log('   - Has API Key:', settings.api_key ? 'Yes' : 'No');
        console.log('   - Has API Secret:', settings.api_secret ? 'Yes' : 'No');
        console.log('   - Default Template ID:', settings.default_template_id || 'Not set');
        console.log('   - Platforms:', settings.platforms || '[]');
        console.log('   - Auto Captions:', settings.auto_generate_captions ? 'Yes' : 'No');
        console.log('   - Auto Hashtags:', settings.auto_generate_hashtags ? 'Yes' : 'No');
        console.log('   - Default Title:', settings.default_title ? 'Set' : 'Not set');
        console.log('   - Default Caption:', settings.default_caption ? 'Set' : 'Not set');
        console.log('   - Default Hashtags:', settings.default_hashtags ? 'Set' : 'Not set');
      } else {
        console.log('❌ No canva_settings found');
      }
    } catch (error) {
      console.log('❌ Error checking canva_settings:', error.message);
    }
    
    // 3. Check canva_posts table structure
    console.log('\n3️⃣ Checking canva_posts table structure...');
    try {
      const tableInfo = db.prepare("PRAGMA table_info(canva_posts)").all();
      console.log('✅ canva_posts columns:');
      tableInfo.forEach(col => {
        console.log(`   - ${col.name}: ${col.type}`);
      });
      
      // Check if design_id column exists
      const hasDesignId = tableInfo.some(col => col.name === 'design_id');
      if (hasDesignId) {
        console.log('✅ design_id column exists');
      } else {
        console.log('❌ design_id column missing');
      }
      
      // Count posts
      const postCount = db.prepare('SELECT COUNT(*) as count FROM canva_posts').get();
      console.log(`📊 Total canva_posts: ${postCount.count}`);
      
    } catch (error) {
      console.log('❌ Error checking canva_posts:', error.message);
    }
    
    // 4. Check environment variables
    console.log('\n4️⃣ Checking environment variables...');
    const envVars = [
      'CANVA_CLIENT_ID',
      'CANVA_CLIENT_SECRET',
      'WEBSITE_URL',
      'DEFAULT_CANVA_TEMPLATE_ID'
    ];
    
    envVars.forEach(varName => {
      const value = process.env[varName];
      console.log(`   ${varName}: ${value ? 'Set' : 'Not set'}`);
    });
    
    // 5. Check .env file
    console.log('\n5️⃣ Checking .env file...');
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      const hasCanvaVars = envContent.includes('CANVA_CLIENT_ID') && envContent.includes('CANVA_CLIENT_SECRET');
      console.log('✅ .env file exists');
      console.log(`   Has Canva vars: ${hasCanvaVars ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ .env file not found');
    }
    
    // 6. Test automation trigger logic
    console.log('\n6️⃣ Testing automation trigger logic...');
    try {
      // Check if canva-service.ts exists and can be imported
      if (fs.existsSync('server/canva-service.ts')) {
        console.log('✅ server/canva-service.ts exists');
      } else {
        console.log('❌ server/canva-service.ts not found');
      }
      
      // Check if routes.ts has automation triggers
      if (fs.existsSync('server/routes.ts')) {
        const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
        const hasProductTrigger = routesContent.includes('TRIGGER CANVA AUTOMATION FOR NEW PRODUCT');
        const hasBlogTrigger = routesContent.includes('TRIGGER CANVA AUTOMATION FOR NEW BLOG POST');
        const hasVideoTrigger = routesContent.includes('TRIGGER CANVA AUTOMATION FOR NEW VIDEO CONTENT');
        
        console.log('✅ server/routes.ts exists');
        console.log(`   Product trigger: ${hasProductTrigger ? 'Yes' : 'No'}`);
        console.log(`   Blog trigger: ${hasBlogTrigger ? 'Yes' : 'No'}`);
        console.log(`   Video trigger: ${hasVideoTrigger ? 'Yes' : 'No'}`);
      } else {
        console.log('❌ server/routes.ts not found');
      }
    } catch (error) {
      console.log('❌ Error checking automation logic:', error.message);
    }
    
    // 7. Check recent products/posts for automation attempts
    console.log('\n7️⃣ Checking recent content for automation attempts...');
    try {
      // Check recent products
      const recentProducts = db.prepare('SELECT id, name, created_at FROM products ORDER BY id DESC LIMIT 3').all();
      console.log(`📦 Recent products (${recentProducts.length}):`);
      recentProducts.forEach(product => {
        console.log(`   - ID: ${product.id}, Name: ${product.name}`);
      });
      
      // Check if any canva_posts exist for recent products
      if (recentProducts.length > 0) {
        const productIds = recentProducts.map(p => p.id).join(',');
        const canvaPosts = db.prepare(`SELECT * FROM canva_posts WHERE content_type = 'product' AND content_id IN (${productIds})`).all();
        console.log(`🎨 Canva posts for recent products: ${canvaPosts.length}`);
        
        if (canvaPosts.length > 0) {
          canvaPosts.forEach(post => {
            console.log(`   - Product ${post.content_id}: Status ${post.status}, Design ID: ${post.design_id || 'None'}`);
          });
        }
      }
    } catch (error) {
      console.log('❌ Error checking recent content:', error.message);
    }
    
    db.close();
    
    // 8. Generate diagnosis summary
    console.log('\n🎯 DIAGNOSIS SUMMARY:');
    console.log('=====================================');
    
    // Check if automation is properly configured
    const settings = db.prepare('SELECT * FROM canva_settings WHERE id = 1').get();
    if (!settings || !settings.is_enabled) {
      console.log('❌ ISSUE: Canva automation is disabled');
      console.log('   Solution: Enable automation in database or admin panel');
    }
    
    if (!process.env.CANVA_CLIENT_ID || !process.env.CANVA_CLIENT_SECRET) {
      console.log('❌ ISSUE: Canva API credentials not loaded in environment');
      console.log('   Solution: Restart PM2 with --update-env or check .env file');
    }
    
    console.log('\n📝 RECOMMENDED NEXT STEPS:');
    console.log('1. Enable Canva automation: UPDATE canva_settings SET is_enabled = 1 WHERE id = 1;');
    console.log('2. Restart PM2: pm2 restart pickntrust-backend --update-env');
    console.log('3. Test with a new product creation');
    console.log('4. Check PM2 logs: pm2 logs pickntrust-backend');
    
  } catch (error) {
    console.error('🚨 DIAGNOSIS FAILED:', error);
  }
}

diagnoseAutomation();
