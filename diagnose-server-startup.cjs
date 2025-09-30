console.log('🔍 DIAGNOSING SERVER STARTUP ISSUES\n');

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('📋 CHECKING SYSTEM STATUS:');
console.log('=' .repeat(50));

// Check if server files exist
const serverFiles = [
  'server/index.ts',
  'package.json',
  'server/enhanced-telegram-manager.ts'
];

serverFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
});

// Check environment files
console.log('\n🔒 CHECKING ENVIRONMENT FILES:');
const envFiles = [
  '.env.prime-picks',
  '.env.cue-picks', 
  '.env.value-picks',
  '.env.click-picks',
  '.env.global-picks',
  '.env.travel-picks',
  '.env.loot-box',
  '.env.deals-hub'
];

envFiles.forEach(envFile => {
  const envPath = path.join(process.cwd(), envFile);
  const exists = fs.existsSync(envPath);
  console.log(`   ${exists ? '✅' : '❌'} ${envFile}: ${exists ? 'EXISTS' : 'MISSING'}`);
  
  if (exists) {
    const content = fs.readFileSync(envPath, 'utf8');
    const hasToken = content.includes('TELEGRAM_BOT_TOKEN=');
    const hasChannelId = content.includes('CHANNEL_ID=');
    console.log(`      Token: ${hasToken ? '✅' : '❌'} | Channel ID: ${hasChannelId ? '✅' : '❌'}`);
  }
});

// Check bot files for enforcement code
console.log('\n🤖 CHECKING BOT FILES FOR ENFORCEMENT:');
const botFiles = [
  'server/prime-picks-bot.ts',
  'server/cue-picks-bot.ts',
  'server/value-picks-bot.ts',
  'server/click-picks-bot.ts',
  'server/global-picks-bot.ts',
  'server/travel-picks-bot.ts',
  'server/loot-box-bot.ts',
  'server/dealshub-bot.ts'
];

botFiles.forEach(botFile => {
  const botPath = path.join(process.cwd(), botFile);
  const exists = fs.existsSync(botPath);
  console.log(`   ${exists ? '✅' : '❌'} ${botFile}: ${exists ? 'EXISTS' : 'MISSING'}`);
  
  if (exists) {
    const content = fs.readFileSync(botPath, 'utf8');
    const hasEnforcement = content.includes('ENVIRONMENT ENFORCEMENT');
    const hasValidation = content.includes('validateAndLoadEnvironment');
    console.log(`      Enforcement: ${hasEnforcement ? '✅' : '❌'} | Validation: ${hasValidation ? '✅' : '❌'}`);
    
    // Check for syntax errors in enforcement code
    if (hasEnforcement) {
      const hasRequiredEnvFile = content.includes('REQUIRED_ENV_FILE');
      const hasExpectedToken = content.includes('EXPECTED_TOKEN_PREFIX');
      const hasProcessExit = content.includes('process.exit(1)');
      console.log(`      Config: ${hasRequiredEnvFile ? '✅' : '❌'} | Token Check: ${hasExpectedToken ? '✅' : '❌'} | Exit: ${hasProcessExit ? '✅' : '❌'}`);
    }
  }
});

// Check package.json scripts
console.log('\n📦 CHECKING PACKAGE.JSON SCRIPTS:');
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const scripts = packageContent.scripts || {};
  
  console.log(`   dev script: ${scripts.dev ? '✅ ' + scripts.dev : '❌ MISSING'}`);
  console.log(`   start script: ${scripts.start ? '✅ ' + scripts.start : '❌ MISSING'}`);
  console.log(`   build script: ${scripts.build ? '✅ ' + scripts.build : '❌ MISSING'}`);
} else {
  console.log('   ❌ package.json not found');
}

// Check for TypeScript compilation issues
console.log('\n🔧 CHECKING TYPESCRIPT COMPILATION:');
try {
  const { execSync } = require('child_process');
  
  // Try to compile TypeScript
  console.log('   Attempting TypeScript compilation check...');
  const tscResult = execSync('npx tsc --noEmit --skipLibCheck', { 
    encoding: 'utf8', 
    timeout: 10000,
    stdio: 'pipe'
  });
  console.log('   ✅ TypeScript compilation: PASSED');
} catch (error) {
  console.log('   ❌ TypeScript compilation: FAILED');
  console.log('   Error:', error.message.substring(0, 200) + '...');
}

// Check for port conflicts
console.log('\n🌐 CHECKING PORT AVAILABILITY:');
const net = require('net');

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

checkPort(5000).then(available => {
  console.log(`   Port 5000: ${available ? '✅ AVAILABLE' : '❌ IN USE'}`);
  
  if (!available) {
    console.log('   ⚠️  Port 5000 is already in use. This could cause startup issues.');
  }
  
  // Final recommendations
  console.log('\n' + '=' .repeat(80));
  console.log('🎯 DIAGNOSTIC SUMMARY & RECOMMENDATIONS:');
  console.log('=' .repeat(80));
  
  console.log('\n🔍 LIKELY CAUSES OF 502 ERROR:');
  console.log('1. Environment enforcement code causing bots to exit during startup');
  console.log('2. TypeScript compilation errors preventing server build');
  console.log('3. Missing or incorrect environment variables');
  console.log('4. Port 5000 already in use by another process');
  console.log('5. Bot initialization failures due to credential validation');
  
  console.log('\n🔧 IMMEDIATE FIXES TO TRY:');
  console.log('1. Temporarily disable environment enforcement:');
  console.log('   - Comment out validateAndLoadEnvironment() calls in bot files');
  console.log('2. Check server logs for specific error messages');
  console.log('3. Try starting server in development mode: npm run dev');
  console.log('4. Kill any processes using port 5000: lsof -ti:5000 | xargs kill -9');
  console.log('5. Restart PM2 processes: pm2 restart all');
  
  console.log('\n⚡ QUICK RECOVERY STEPS:');
  console.log('1. Stop all PM2 processes: pm2 stop all');
  console.log('2. Kill port 5000 processes: lsof -ti:5000 | xargs kill -9');
  console.log('3. Start in development mode: npm run dev');
  console.log('4. Check for error messages in terminal output');
  console.log('5. If bots are failing, temporarily disable enforcement validation');
  
  console.log('\n🚨 ENVIRONMENT ENFORCEMENT IMPACT:');
  console.log('The recently added environment enforcement may be causing bots to exit');
  console.log('if they detect any configuration issues. Check bot startup logs for:');
  console.log('- "CRITICAL ERROR" messages');
  console.log('- "process.exit(1)" calls');
  console.log('- Token validation failures');
  console.log('- Missing .env file errors');
});