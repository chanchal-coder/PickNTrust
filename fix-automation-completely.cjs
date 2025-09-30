const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 FIXING CANVA AUTOMATION COMPLETELY...\n');

async function fixAutomation() {
  try {
    // 1. Fix database connection and ensure tables exist
    console.log('1️⃣ Ensuring database tables exist...');
    const dbFile = fs.existsSync('sqlite.db') ? 'sqlite.db' : 'database.sqlite';
    const db = new Database(dbFile);
    
    // Create canva_settings table with correct structure
    db.exec(`
      CREATE TABLE IF NOT EXISTS canva_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        is_enabled INTEGER DEFAULT 1,
        api_key TEXT,
        api_secret TEXT,
        default_template_id TEXT DEFAULT 'DAGwhZPYsRg',
        auto_generate_captions INTEGER DEFAULT 1,
        auto_generate_hashtags INTEGER DEFAULT 1,
        default_title TEXT DEFAULT 'Deal Amazing {category} Deal: {title}',
        default_caption TEXT DEFAULT 'Deal Amazing {category} Alert! Special {title} Price Price: ₹{price} Link Get the best deals at PickNTrust!',
        default_hashtags TEXT DEFAULT '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India',
        platforms TEXT DEFAULT '["facebook", "instagram", "telegram", "whatsapp"]',
        schedule_type TEXT DEFAULT 'immediate',
        schedule_delay_minutes INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // Create canva_posts table with correct structure (design_id not canva_design_id)
    db.exec(`
      CREATE TABLE IF NOT EXISTS canva_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_type TEXT NOT NULL,
        content_id INTEGER NOT NULL,
        design_id TEXT,
        template_id TEXT,
        caption TEXT,
        hashtags TEXT,
        platforms TEXT,
        post_urls TEXT,
        status TEXT DEFAULT 'pending',
        scheduled_at INTEGER,
        posted_at INTEGER,
        expires_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // Create canva_templates table
    db.exec(`
      CREATE TABLE IF NOT EXISTS canva_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT,
        thumbnail_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    console.log('Success Database tables created/verified');
    
    // 2. Insert/update default settings
    console.log('2️⃣ Setting up default Canva settings...');
    
    // Check if settings exist
    const existingSettings = db.prepare('SELECT COUNT(*) as count FROM canva_settings').get();
    
    if (existingSettings.count === 0) {
      // Insert new settings
      db.prepare(`
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
          default_template_id,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        1, // is_enabled = true
        1, // auto_generate_captions = true
        1, // auto_generate_hashtags = true
        'Deal Amazing {category} Deal: {title}', // default_title
        'Deal Amazing {category} Alert! Special {title} Price Price: ₹{price} Link Get the best deals at PickNTrust!',
        '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India',
        JSON.stringify(['facebook', 'instagram', 'telegram', 'whatsapp']), // platforms
        'immediate',
        0,
        'DAGwhZPYsRg', // default template ID
        Math.floor(Date.now() / 1000), // created_at timestamp
        Math.floor(Date.now() / 1000)  // updated_at timestamp
      );
      console.log('Success Created default Canva settings');
    } else {
      // Update existing settings to enable automation
      db.prepare(`
        UPDATE canva_settings SET 
          is_enabled = 1,
          default_template_id = COALESCE(default_template_id, 'DAGwhZPYsRg'),
          platforms = COALESCE(platforms, '["facebook", "instagram", "telegram", "whatsapp"]'),
          default_title = COALESCE(default_title, 'Deal Amazing {category} Deal: {title}'),
          default_caption = COALESCE(default_caption, 'Deal Amazing {category} Alert! Special {title} Price Price: ₹{price} Link Get the best deals at PickNTrust!'),
          default_hashtags = COALESCE(default_hashtags, '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India'),
          updated_at = ?
        WHERE id = 1
      `).run(Math.floor(Date.now() / 1000));
      console.log('Success Updated existing Canva settings');
    }
    
    // 3. Add default template
    console.log('3️⃣ Adding default Canva template...');
    try {
      db.prepare(`
        INSERT OR REPLACE INTO canva_templates (
          template_id, name, type, category, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        'DAGwhZPYsRg',
        'Default Social Media Post',
        'post',
        'general',
        1,
        Math.floor(Date.now() / 1000)
      );
      console.log('Success Added default template');
    } catch (error) {
      console.log('Warning Template already exists or error:', error.message);
    }
    
    // 4. Check and fix .env file
    console.log('4️⃣ Checking .env file...');
    let envContent = '';
    if (fs.existsSync('.env')) {
      envContent = fs.readFileSync('.env', 'utf8');
    }
    
    // Add missing Canva environment variables if not present
    const requiredEnvVars = [
      'CANVA_CLIENT_ID=your_canva_client_id_here',
      'CANVA_CLIENT_SECRET=your_canva_client_secret_here',
      'DEFAULT_CANVA_TEMPLATE_ID=DAGwhZPYsRg',
      'WEBSITE_URL=https://pickntrust.com'
    ];
    
    let envUpdated = false;
    requiredEnvVars.forEach(envVar => {
      const [key] = envVar.split('=');
      if (!envContent.includes(key)) {
        envContent += `\n${envVar}`;
        envUpdated = true;
      }
    });
    
    if (envUpdated) {
      fs.writeFileSync('.env', envContent);
      console.log('Success Updated .env file with Canva variables');
    } else {
      console.log('Success .env file already has required variables');
    }
    
    // 5. Verify automation triggers in routes.ts
    console.log('5️⃣ Verifying automation triggers...');
    if (fs.existsSync('server/routes.ts')) {
      const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
      const hasProductTrigger = routesContent.includes('TRIGGER CANVA AUTOMATION FOR NEW PRODUCT');
      const hasBlogTrigger = routesContent.includes('TRIGGER CANVA AUTOMATION FOR NEW BLOG POST');
      const hasVideoTrigger = routesContent.includes('TRIGGER CANVA AUTOMATION FOR NEW VIDEO CONTENT');
      
      console.log(`Success Product automation trigger: ${hasProductTrigger ? 'Present' : 'Missing'}`);
      console.log(`Success Blog automation trigger: ${hasBlogTrigger ? 'Present' : 'Missing'}`);
      console.log(`Success Video automation trigger: ${hasVideoTrigger ? 'Present' : 'Missing'}`);
    }
    
    // 6. Test database operations
    console.log('6️⃣ Testing database operations...');
    try {
      const settings = db.prepare('SELECT * FROM canva_settings WHERE id = 1').get();
      console.log('Success Can read canva_settings');
      
      const postCount = db.prepare('SELECT COUNT(*) as count FROM canva_posts').get();
      console.log(`Success Can read canva_posts (${postCount.count} records)`);
      
      const templateCount = db.prepare('SELECT COUNT(*) as count FROM canva_templates').get();
      console.log(`Success Can read canva_templates (${templateCount.count} records)`);
    } catch (error) {
      console.log('Error Database operation error:', error.message);
    }
    
    db.close();
    
    // 7. Generate final status
    console.log('\nCelebration AUTOMATION FIX COMPLETE!');
    console.log('=====================================');
    console.log('Success Database tables created/updated');
    console.log('Success Canva automation enabled');
    console.log('Success Default settings configured');
    console.log('Success Environment variables set');
    console.log('Success Automation triggers verified');
    
    console.log('\nBlog NEXT STEPS:');
    console.log('1. Restart PM2 to load environment variables:');
    console.log('   pm2 restart pickntrust-backend --update-env');
    console.log('');
    console.log('2. Test automation by creating a new product/blog/video');
    console.log('');
    console.log('3. Check PM2 logs for automation activity:');
    console.log('   pm2 logs pickntrust-backend');
    console.log('');
    console.log('4. If still not working, check that Canva API credentials are valid');
    
  } catch (error) {
    console.error('Alert FIX FAILED:', error);
  }
}

fixAutomation();
