const fs = require('fs');
const path = require('path');

console.log('🧹 COMPLETE ENHANCED MANAGER CLEANUP');
console.log('===================================\n');

const botFiles = [
  'server/value-picks-bot.ts',
  'server/click-picks-bot.ts',
  'server/loot-box-bot.ts',
  'server/cue-picks-bot.ts',
  'server/dealshub-bot.ts',
  'server/global-picks-bot.ts',
  'server/travel-picks-bot.ts'
];

// Function to add shutdown method if missing
function addShutdownMethod(content, botClassName) {
  if (!content.includes('async shutdown()')) {
    const classEndPattern = new RegExp(`(}\\s*\\n\\s*export const ${botClassName.toLowerCase()}Bot)`, 'g');
    const shutdownMethod = `
  async shutdown(): Promise<void> {
    try {
      if (this.bot) {
        await this.bot.stopPolling();
        this.bot = null;
      }
      this.isInitialized = false;
      console.log('✅ ${botClassName} Bot shutdown complete');
    } catch (error) {
      console.error('Error during ${botClassName} Bot shutdown:', error);
    }
  }

}\n\nexport const ${botClassName.toLowerCase()}Bot`;
    
    content = content.replace(classEndPattern, shutdownMethod);
  }
  return content;
}

botFiles.forEach(filePath => {
  console.log(`📝 Processing: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remove webhook manager imports
    if (content.includes("import { webhookManager }")) {
      content = content.replace(/import \{ webhookManager \} from '[^']+';\n/g, '');
      modified = true;
      console.log('   ✅ Removed webhookManager import');
    }
    
    // Remove botLockManager imports
    if (content.includes("import { botLockManager }")) {
      content = content.replace(/import \{ botLockManager \} from '[^']+';\n/g, '');
      modified = true;
      console.log('   ✅ Removed botLockManager import');
    }
    
    // Remove webhookManager.registerBot calls
    if (content.includes('webhookManager.registerBot')) {
      content = content.replace(/\s*webhookManager\.registerBot\([^)]+\);/g, '');
      modified = true;
      console.log('   ✅ Removed webhookManager.registerBot calls');
    }
    
    // Remove botLockManager calls
    if (content.includes('botLockManager.')) {
      content = content.replace(/\s*await botLockManager\.[^;]+;/g, '');
      content = content.replace(/\s*const lockAcquired = await botLockManager\.[^;]+;/g, '');
      content = content.replace(/\s*if \(!lockAcquired\) \{[^}]+\}/g, '');
      modified = true;
      console.log('   ✅ Removed botLockManager calls');
    }
    
    // Change polling to true
    if (content.includes('polling: false')) {
      content = content.replace(/polling: false/g, 'polling: true');
      modified = true;
      console.log('   ✅ Changed polling to true');
    }
    
    // Remove ENHANCED_MANAGER_ACTIVE checks
    if (content.includes('ENHANCED_MANAGER_ACTIVE')) {
      content = content.replace(/if \(!process\.env\.ENHANCED_MANAGER_ACTIVE\) \{[^}]+\}/gs, '');
      content = content.replace(/&& !process\.env\.ENHANCED_MANAGER_ACTIVE/g, '');
      modified = true;
      console.log('   ✅ Removed ENHANCED_MANAGER_ACTIVE checks');
    }
    
    // Add setupMessageListeners call if missing
    if (content.includes('polling: true') && !content.includes('this.setupMessageListeners()')) {
      content = content.replace(
        /(this\.bot = new TelegramBot\(BOT_TOKEN, \{ polling: true \}\);)/,
        '$1\n      \n      // Set up message listeners for direct polling\n      this.setupMessageListeners();'
      );
      modified = true;
      console.log('   ✅ Added setupMessageListeners call');
    }
    
    // Determine bot class name for shutdown method
    const botClassMatch = content.match(/class (\w+)Bot/);
    if (botClassMatch) {
      const botClassName = botClassMatch[1];
      const originalContent = content;
      content = addShutdownMethod(content, botClassName);
      if (content !== originalContent) {
        modified = true;
        console.log('   ✅ Added shutdown method');
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`   💾 File updated successfully\n`);
    } else {
      console.log(`   ℹ️  No changes needed\n`);
    }
    
  } catch (error) {
    console.error(`   ❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('🎉 Enhanced Manager cleanup completed!');
console.log('\n📋 Summary of changes:');
console.log('   - Removed webhookManager imports and calls');
console.log('   - Removed botLockManager imports and calls');
console.log('   - Changed polling from false to true');
console.log('   - Removed ENHANCED_MANAGER_ACTIVE checks');
console.log('   - Added setupMessageListeners calls');
console.log('   - Added shutdown methods where missing');
console.log('\n🚀 All bots should now work independently!');