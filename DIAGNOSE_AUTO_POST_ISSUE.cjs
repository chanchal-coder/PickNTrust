const fs = require('fs');
const path = require('path');

console.log('Search DIAGNOSING AUTO-POST ISSUE - CHECKING CANVA AND POST SETTINGS...\n');

// Check 1: Environment Variables
console.log('1️⃣ CHECKING ENVIRONMENT VARIABLES:');
console.log('================================');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check Canva credentials
  const hasCanvaClientId = envContent.includes('CANVA_CLIENT_ID=') && !envContent.includes('CANVA_CLIENT_ID=your_canva_client_id_here');
  const hasCanvaSecret = envContent.includes('CANVA_CLIENT_SECRET=') && !envContent.includes('CANVA_CLIENT_SECRET=your_canva_client_secret_here');
  
  console.log(`Success .env file exists`);
  console.log(`${hasCanvaClientId ? 'Success' : 'Error'} CANVA_CLIENT_ID configured`);
  console.log(`${hasCanvaSecret ? 'Success' : 'Error'} CANVA_CLIENT_SECRET configured`);
  
  // Check social media tokens
  const socialTokens = [
    'FACEBOOK_ACCESS_TOKEN',
    'INSTAGRAM_ACCESS_TOKEN', 
    'TELEGRAM_BOT_TOKEN',
    'YOUTUBE_API_KEY'
  ];
  
  socialTokens.forEach(token => {
    const hasToken = envContent.includes(`${token}=`) && !envContent.includes(`${token}=your_`);
    console.log(`${hasToken ? 'Success' : 'Error'} ${token} configured`);
  });
} else {
  console.log('Error .env file not found!');
}

console.log('\n2️⃣ CHECKING DATABASE TABLES:');
console.log('============================');

// Check database tables
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, 'database.sqlite');

if (fs.existsSync(dbPath)) {
  console.log('Success Database file exists');
  
  try {
    const db = new Database(dbPath);
    
    // Check canva_settings table
    try {
      const canvaSettings = db.prepare("SELECT * FROM canva_settings LIMIT 1").all();
      console.log(`Success canva_settings table exists (${canvaSettings.length} records)`);
    } catch (e) {
      console.log('Error canva_settings table missing or error:', e.message);
    }
    
    // Check canva_posts table
    try {
      const canvaPosts = db.prepare("SELECT * FROM canva_posts LIMIT 1").all();
      console.log(`Success canva_posts table exists (${canvaPosts.length} records)`);
    } catch (e) {
      console.log('Error canva_posts table missing or error:', e.message);
    }
    
    db.close();
  } catch (e) {
    console.log('Error Database connection error:', e.message);
  }
} else {
  console.log('Error Database file not found!');
}

console.log('\n3️⃣ CHECKING SERVER ROUTES:');
console.log('==========================');

// Check if product creation route has automation trigger
const routesPath = path.join(__dirname, 'server', 'routes.ts');
if (fs.existsSync(routesPath)) {
  const routesContent = fs.readFileSync(routesPath, 'utf8');
  
  const hasCanvaImport = routesContent.includes('canva-service') || routesContent.includes('CanvaService');
  const hasAutomationTrigger = routesContent.includes('executeFullAutomation') || routesContent.includes('canvaService');
  const hasProductRoute = routesContent.includes('/api/products') && routesContent.includes('POST');
  
  console.log(`Success server/routes.ts exists`);
  console.log(`${hasCanvaImport ? 'Success' : 'Error'} Canva service imported`);
  console.log(`${hasAutomationTrigger ? 'Success' : 'Error'} Automation trigger in product creation`);
  console.log(`${hasProductRoute ? 'Success' : 'Error'} POST /api/products route exists`);
} else {
  console.log('Error server/routes.ts not found!');
}

console.log('\n4️⃣ CHECKING CANVA SERVICE:');
console.log('==========================');

// Check Canva service implementation
const canvaServicePath = path.join(__dirname, 'server', 'canva-service.ts');
if (fs.existsSync(canvaServicePath)) {
  const canvaContent = fs.readFileSync(canvaServicePath, 'utf8');
  
  const hasExecuteFullAutomation = canvaContent.includes('executeFullAutomation');
  const hasSocialMediaPosting = canvaContent.includes('postToSocialPlatforms');
  const hasEnvironmentVariables = canvaContent.includes('process.env.CANVA_CLIENT_ID');
  
  console.log(`Success server/canva-service.ts exists`);
  console.log(`${hasExecuteFullAutomation ? 'Success' : 'Error'} executeFullAutomation method exists`);
  console.log(`${hasSocialMediaPosting ? 'Success' : 'Error'} Social media posting methods exist`);
  console.log(`${hasEnvironmentVariables ? 'Success' : 'Error'} Environment variables used`);
} else {
  console.log('Error server/canva-service.ts not found!');
}

console.log('\n5️⃣ CHECKING PM2 CONFIGURATION:');
console.log('===============================');

// Check PM2 ecosystem config
const ecosystemPath = path.join(__dirname, 'ecosystem.config.cjs');
if (fs.existsSync(ecosystemPath)) {
  const ecosystemContent = fs.readFileSync(ecosystemPath, 'utf8');
  
  const hasEnvFile = ecosystemContent.includes('env_file') || ecosystemContent.includes('.env');
  const hasServerScript = ecosystemContent.includes('server/index.ts') || ecosystemContent.includes('server/index.js');
  
  console.log(`Success ecosystem.config.cjs exists`);
  console.log(`${hasEnvFile ? 'Success' : 'Error'} Environment file loading configured`);
  console.log(`${hasServerScript ? 'Success' : 'Error'} Server script configured`);
} else {
  console.log('Error ecosystem.config.cjs not found!');
}

console.log('\nTarget DIAGNOSIS SUMMARY:');
console.log('====================');
console.log('If any items above show Error, that could be why auto-posting isn\'t working.');
console.log('\n📋 NEXT STEPS:');
console.log('1. Fix any Error issues found above');
console.log('2. Restart PM2: pm2 stop all && pm2 start ecosystem.config.cjs');
console.log('3. Test by adding a product in admin panel');
console.log('4. Check PM2 logs: pm2 logs');
