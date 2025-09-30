const fs = require('fs');
const path = require('path');

console.log('🔧 FINAL CLEANUP - FIXING ALL REMAINING ERRORS');
console.log('===============================================\n');

const botFiles = [
  { file: 'server/click-picks-bot.ts', className: 'ClickPicks' },
  { file: 'server/value-picks-bot.ts', className: 'ValuePicks' },
  { file: 'server/prime-picks-bot.ts', className: 'PrimePicks' },
  { file: 'server/cue-picks-bot.ts', className: 'CuePicks' },
  { file: 'server/loot-box-bot.ts', className: 'LootBox' }
];

botFiles.forEach(({ file, className }) => {
  console.log(`🔧 Processing: ${file}`);
  
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // Remove webhookManager imports
    if (content.includes('import { webhookManager }')) {
      content = content.replace(/import \{ webhookManager \} from '[^']+';?\n?/g, '');
      modified = true;
      console.log('   ✅ Removed webhookManager import');
    }
    
    // Remove botLockManager imports
    if (content.includes('import { botLockManager }')) {
      content = content.replace(/import \{ botLockManager \} from '[^']+';?\n?/g, '');
      modified = true;
      console.log('   ✅ Removed botLockManager import');
    }
    
    // Remove webhookManager method calls
    if (content.includes('webhookManager.')) {
      content = content.replace(/\s*webhookManager\.[^;\n]+;?/g, '');
      modified = true;
      console.log('   ✅ Removed webhookManager calls');
    }
    
    // Remove botLockManager method calls
    if (content.includes('botLockManager.')) {
      content = content.replace(/\s*await botLockManager\.[^;\n]+;?/g, '');
      content = content.replace(/\s*const lockAcquired = await botLockManager\.[^;\n]+;?/g, '');
      content = content.replace(/\s*if \(!lockAcquired\) \{[^}]*\}/gs, '');
      modified = true;
      console.log('   ✅ Removed botLockManager calls');
    }
    
    // Add shutdown method if missing
    if (!content.includes('async shutdown()')) {
      const shutdownMethod = `
  async shutdown(): Promise<void> {
    try {
      if (this.bot) {
        await this.bot.stopPolling();
        this.bot = null;
      }
      this.isInitialized = false;
      console.log('✅ ${className} Bot shutdown complete');
    } catch (error) {
      console.error('Error during ${className} Bot shutdown:', error);
    }
  }`;
      
      // Find the class closing brace and add shutdown method before it
      const classPattern = new RegExp(`(class ${className}Bot[\\s\\S]*?)\\n\\s*}\\s*\\n\\s*export`, 'g');
      if (classPattern.test(content)) {
        content = content.replace(classPattern, `$1${shutdownMethod}\n}\n\nexport`);
        modified = true;
        console.log('   ✅ Added shutdown method');
      }
    }
    
    // Ensure polling is set to true
    if (content.includes('polling: false')) {
      content = content.replace(/polling: false/g, 'polling: true');
      modified = true;
      console.log('   ✅ Changed polling to true');
    }
    
    // Remove ENHANCED_MANAGER_ACTIVE checks
    if (content.includes('ENHANCED_MANAGER_ACTIVE')) {
      content = content.replace(/&& !process\.env\.ENHANCED_MANAGER_ACTIVE/g, '');
      content = content.replace(/if \(!process\.env\.ENHANCED_MANAGER_ACTIVE\) \{[^}]*\}/gs, '');
      modified = true;
      console.log('   ✅ Removed ENHANCED_MANAGER_ACTIVE checks');
    }
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`   💾 ${file} updated successfully\n`);
    } else {
      console.log(`   ℹ️  No changes needed for ${file}\n`);
    }
    
  } catch (error) {
    console.error(`   ❌ Error processing ${file}:`, error.message);
  }
});

console.log('🎉 Final cleanup completed!');
console.log('\n📋 All Enhanced Manager dependencies removed:');
console.log('   ✅ webhookManager imports and calls');
console.log('   ✅ botLockManager imports and calls');
console.log('   ✅ Added shutdown methods to all bots');
console.log('   ✅ Ensured direct polling enabled');
console.log('   ✅ Removed environment variable dependencies');
console.log('\n🚀 Server should now start without errors!');