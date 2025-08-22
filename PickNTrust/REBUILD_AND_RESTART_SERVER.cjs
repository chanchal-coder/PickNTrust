#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔄 REBUILDING AND RESTARTING SERVER...\n');

try {
  // Step 1: Build the project (compiles TypeScript to JavaScript)
  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully\n');

  // Step 2: Restart PM2 process
  console.log('🔄 Restarting PM2 process...');
  execSync('pm2 restart pickntrust', { stdio: 'inherit' });
  console.log('✅ PM2 process restarted\n');

  // Step 3: Wait a moment for the server to start
  console.log('⏳ Waiting for server to initialize...');
  setTimeout(() => {
    console.log('✅ Server should now be running with the updated code\n');
    
    console.log('🎉 REBUILD COMPLETE!');
    console.log('📋 Next steps:');
    console.log('1. Test the admin automation panel');
    console.log('2. Try saving Canva settings');
    console.log('3. Check that manual caption/hashtag fields work');
    console.log('\n💡 The SQLite error should now be resolved!');
  }, 3000);

} catch (error) {
  console.error('❌ Error during rebuild:', error.message);
  console.log('\n🔧 Manual steps to fix:');
  console.log('1. Run: npm run build');
  console.log('2. Run: pm2 restart pickntrust');
  process.exit(1);
}
