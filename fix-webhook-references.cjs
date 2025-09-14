/**
 * Fix Webhook References - Corrects $1 placeholder errors
 * This script fixes the $1 references that were incorrectly generated
 */

const fs = require('fs');
const path = require('path');

const botFiles = [
  'server/value-picks-bot.ts',
  'server/dealshub-bot.ts', 
  'server/global-picks-bot.ts',
  'server/click-picks-bot.ts',
  'server/loot-box-bot.ts',
  'server/travel-picks-bot.ts',
  'server/cue-picks-bot.ts',
  'server/enhanced-travel-picks-bot.ts'
];

const tokenVariables = {
  'value-picks-bot.ts': 'BOT_TOKEN',
  'dealshub-bot.ts': 'BOT_TOKEN',
  'global-picks-bot.ts': 'BOT_TOKEN', 
  'click-picks-bot.ts': 'BOT_TOKEN',
  'loot-box-bot.ts': 'BOT_TOKEN',
  'travel-picks-bot.ts': 'BOT_TOKEN',
  'cue-picks-bot.ts': 'BOT_TOKEN',
  'enhanced-travel-picks-bot.ts': 'BOT_TOKEN'
};

function fixWebhookReferences(filePath) {
  try {
    console.log(`🔧 Fixing webhook references in ${filePath}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    const tokenVar = tokenVariables[fileName];
    
    if (!tokenVar) {
      console.log(`⚠️ Unknown bot file: ${fileName}`);
      return;
    }
    
    // Fix $1 references with the correct token variable
    content = content.replace(/\$1/g, tokenVar);
    
    // Remove double semicolons if any
    content = content.replace(/;;/g, ';');
    
    // Write the updated content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${fileName} webhook references fixed`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🚀 Fixing webhook references in all bot files...');
  console.log('=' * 50);
  
  botFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      fixWebhookReferences(fullPath);
    } else {
      console.log(`⚠️ File not found: ${fullPath}`);
    }
  });
  
  console.log('\n✅ All webhook references fixed!');
  console.log('🔄 Restart the server to apply changes');
}

if (require.main === module) {
  main();
}

module.exports = { fixWebhookReferences, main };