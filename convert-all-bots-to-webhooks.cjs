/**
 * Convert All Bots to Webhook Mode - Eliminates 409 Conflicts
 * This script converts all bot files from polling to webhook mode
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

const botNames = {
  'value-picks-bot.ts': 'value-picks',
  'dealshub-bot.ts': 'dealshub',
  'global-picks-bot.ts': 'global-picks', 
  'click-picks-bot.ts': 'click-picks',
  'loot-box-bot.ts': 'lootbox',
  'travel-picks-bot.ts': 'travel-picks',
  'cue-picks-bot.ts': 'cue-picks',
  'enhanced-travel-picks-bot.ts': 'enhanced-travel-picks'
};

function convertBotToWebhook(filePath) {
  try {
    console.log(`🔧 Converting ${filePath} to webhook mode...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    const botName = botNames[fileName];
    
    if (!botName) {
      console.log(`⚠️ Unknown bot file: ${fileName}`);
      return;
    }
    
    // Add webhook import if not present
    if (!content.includes('webhookManager')) {
      const importSection = content.match(/(import.*from.*['"];\s*)+/);
      if (importSection) {
        const lastImport = importSection[0];
        const newImport = lastImport + "import { webhookManager } from './webhook-routes';\n";
        content = content.replace(lastImport, newImport);
      }
    }
    
    // Convert polling to webhook mode
    content = content.replace(
      /new TelegramBot\([^,]+,\s*{\s*polling:\s*true\s*}\)/g,
      'new TelegramBot($1, { polling: false })'
    );
    
    // Fix the replacement to properly capture the token parameter
    content = content.replace(
      /(\w+)\s*=\s*new TelegramBot\(([^,]+),\s*{\s*polling:\s*false\s*}\)/g,
      (match, varName, token) => {
        return `${varName} = new TelegramBot(${token}, { polling: false });\n      // Register with webhook manager\n      webhookManager.registerBot('${botName}', ${token}, this.handleMessage?.bind(this) || this.handleTelegramMessage?.bind(this));`;
      }
    );
    
    // Add handleMessage method if it doesn't exist
    if (!content.includes('handleMessage') && !content.includes('handleTelegramMessage')) {
      // Find the class definition and add the method
      const classMatch = content.match(/(class\s+\w+\s*{)/); 
      if (classMatch) {
        const methodToAdd = `
  // WEBHOOK MODE: Unified message handler\n  private async handleMessage(msg: any): Promise<void> {\n    try {\n      // Route to existing message handling logic\n      if (this.handleTelegramMessage) {\n        await this.handleTelegramMessage(msg);\n      } else if (this.processMessage) {\n        await this.processMessage(msg);\n      } else {\n        console.log('\${this.constructor.name}: Message received but no handler found');\n      }\n    } catch (error) {\n      console.error('\${this.constructor.name}: Message handling error:', error);\n    }\n  }\n`;
        
        content = content.replace(classMatch[1], classMatch[1] + methodToAdd);
      }
    }
    
    // Write the updated content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${fileName} converted to webhook mode`);
    
  } catch (error) {
    console.error(`❌ Error converting ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🚀 Converting all bots to webhook mode to eliminate 409 conflicts...');
  console.log('=' * 60);
  
  botFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      convertBotToWebhook(fullPath);
    } else {
      console.log(`⚠️ File not found: ${fullPath}`);
    }
  });
  
  console.log('\n✅ All bots converted to webhook mode!');
  console.log('💡 409 conflicts should now be eliminated');
  console.log('🔄 Restart the server to apply changes');
}

if (require.main === module) {
  main();
}

module.exports = { convertBotToWebhook, main };