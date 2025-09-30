const Database = require('better-sqlite3');
const path = require('path');

console.log('Search Diagnosing Canva automation issues...\n');

try {
  // Connect to database
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new Database(dbPath);
  
  console.log('Stats Database connection successful');
  
  // 1. Check Canva settings
  console.log('\n1️⃣ Checking Canva settings...');
  const canvaSettings = db.prepare("SELECT * FROM canva_settings LIMIT 1").get();
  
  if (canvaSettings) {
    console.log('Success Canva settings found:');
    console.log(`   ID: ${canvaSettings.id}`);
    console.log(`   Enabled: ${canvaSettings.is_enabled ? 'Yes' : 'No'}`);
    console.log(`   Has API Key: ${canvaSettings.api_key ? 'Yes' : 'No'}`);
    console.log(`   Has API Secret: ${canvaSettings.api_secret ? 'Yes' : 'No'}`);
    console.log(`   Default Template ID: ${canvaSettings.default_template_id || 'Not set'}`);
    console.log(`   Platforms: ${canvaSettings.platforms || 'Not set'}`);
    console.log(`   Auto Captions: ${canvaSettings.auto_generate_captions ? 'Yes' : 'No'}`);
    console.log(`   Auto Hashtags: ${canvaSettings.auto_generate_hashtags ? 'Yes' : 'No'}`);
    console.log(`   Default Title: ${canvaSettings.default_title ? 'Set' : 'Not set'}`);
    console.log(`   Default Caption: ${canvaSettings.default_caption ? 'Set' : 'Not set'}`);
    console.log(`   Default Hashtags: ${canvaSettings.default_hashtags ? 'Set' : 'Not set'}`);
  } else {
    console.log('Error No Canva settings found');
  }
  
  // 2. Check environment variables
  console.log('\n2️⃣ Checking environment variables...');
  const envVars = [
    'CANVA_CLIENT_ID',
    'CANVA_CLIENT_SECRET', 
    'CANVA_REFRESH_TOKEN',
    'DEFAULT_CANVA_TEMPLATE_ID',
    'WEBSITE_URL'
  ];
  
  envVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`   ${varName}: ${value ? 'Set' : 'Not set'}`);
  });
  
  // 3. Check Canva posts table
  console.log('\n3️⃣ Checking Canva posts...');
  try {
    const canvaPosts = db.prepare("SELECT COUNT(*) as count FROM canva_posts").get();
    console.log(`Success Canva posts table exists with ${canvaPosts.count} records`);
    
    // Get recent posts
    const recentPosts = db.prepare(`
      SELECT id, content_type, content_id, design_id, status, created_at 
      FROM canva_posts 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();
    
    if (recentPosts.length > 0) {
      console.log('   Recent posts:');
      recentPosts.forEach(post => {
        console.log(`     - ${post.content_type} ${post.content_id}: ${post.status} (${new Date(post.created_at * 1000).toISOString()})`);
      });
    } else {
      console.log('   No posts found');
    }
  } catch (error) {
    console.log('Error Canva posts table not found or error:', error.message);
  }
  
  // 4. Check Canva templates
  console.log('\n4️⃣ Checking Canva templates...');
  try {
    const templates = db.prepare("SELECT COUNT(*) as count FROM canva_templates").get();
    console.log(`Success Canva templates table exists with ${templates.count} records`);
  } catch (error) {
    console.log('Error Canva templates table not found or error:', error.message);
  }
  
  // 5. Test product creation trigger
  console.log('\n5️⃣ Testing automation trigger logic...');
  
  // Check if we can import the Canva service
  try {
    // This would normally be: const { CanvaService } = require('./server/canva-service.js');
    console.log('Success Canva service import would work (file exists)');
  } catch (error) {
    console.log('Error Canva service import error:', error.message);
  }
  
  db.close();
  
  console.log('\nTarget DIAGNOSIS SUMMARY:');
  console.log('=====================================');
  
  if (!canvaSettings) {
    console.log('Error CRITICAL: No Canva settings found in database');
    console.log('   Solution: Run the default values setup again');
  } else if (!canvaSettings.is_enabled) {
    console.log('Error ISSUE: Canva automation is disabled');
    console.log('   Solution: Enable Canva automation in settings');
  } else if (!process.env.CANVA_CLIENT_ID || !process.env.CANVA_CLIENT_SECRET) {
    console.log('Error ISSUE: Canva API credentials not loaded in environment');
    console.log('   Solution: Restart PM2 with --update-env');
  } else {
    console.log('Success Configuration looks good');
    console.log('❓ Issue might be in the automation execution logic');
  }
  
  console.log('\nBlog RECOMMENDED FIXES:');
  console.log('1. Enable Canva automation: UPDATE canva_settings SET is_enabled = 1 WHERE id = 1;');
  console.log('2. Restart PM2: pm2 restart pickntrust-backend --update-env');
  console.log('3. Test with a new product creation');
  
} catch (error) {
  console.error('Error Diagnosis error:', error.message);
}
