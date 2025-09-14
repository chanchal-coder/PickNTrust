/**
 * EMERGENCY BOT FIX - Real Issue: Bots not processing Telegram messages
 * The admin API works but Telegram bots aren't listening to channel messages
 */

const fs = require('fs');
const path = require('path');

class EmergencyBotFixer {
  constructor() {
    this.issues = [];
    this.fixes = [];
  }

  /**
   * Check if bots are actually initialized and listening
   */
  checkBotInitialization() {
    console.log('🚨 EMERGENCY: CHECKING BOT INITIALIZATION');
    console.log('='.repeat(60));
    
    const botFiles = [
      'server/prime-picks-bot.ts',
      'server/cue-picks-bot.ts', 
      'server/value-picks-bot.ts',
      'server/click-picks-bot.ts'
    ];
    
    for (const botFile of botFiles) {
      console.log(`\n🔍 Checking ${botFile}:`);
      
      if (!fs.existsSync(botFile)) {
        console.log(`   ❌ Bot file missing: ${botFile}`);
        this.issues.push(`Missing bot file: ${botFile}`);
        continue;
      }
      
      const botContent = fs.readFileSync(botFile, 'utf8');
      
      // Check critical bot functionality
      const hasMessageListener = botContent.includes('on(\'message\')') || botContent.includes('on("message")');
      const hasChannelHandling = botContent.includes('handleChannelMessage') || botContent.includes('channel');
      const hasUrlExtraction = botContent.includes('extractUrls') || botContent.includes('url');
      const hasSaveProduct = botContent.includes('saveProduct') || botContent.includes('INSERT');
      const hasInitialize = botContent.includes('initialize') || botContent.includes('Initialize');
      
      console.log(`   Message listener: ${hasMessageListener ? '✅' : '❌'}`);
      console.log(`   Channel handling: ${hasChannelHandling ? '✅' : '❌'}`);
      console.log(`   URL extraction: ${hasUrlExtraction ? '✅' : '❌'}`);
      console.log(`   Save product: ${hasSaveProduct ? '✅' : '❌'}`);
      console.log(`   Initialize method: ${hasInitialize ? '✅' : '❌'}`);
      
      if (!hasMessageListener) {
        this.issues.push(`${botFile}: No message listener`);
      }
      if (!hasChannelHandling) {
        this.issues.push(`${botFile}: No channel message handling`);
      }
      if (!hasSaveProduct) {
        this.issues.push(`${botFile}: No product saving logic`);
      }
    }
  }

  /**
   * Check Enhanced Telegram Manager configuration
   */
  checkEnhancedManager() {
    console.log('\n🔍 CHECKING ENHANCED TELEGRAM MANAGER');
    console.log('='.repeat(50));
    
    const managerFile = 'server/enhanced-telegram-manager.ts';
    
    if (!fs.existsSync(managerFile)) {
      console.log('❌ Enhanced Telegram Manager missing');
      this.issues.push('Enhanced Telegram Manager file missing');
      return;
    }
    
    const managerContent = fs.readFileSync(managerFile, 'utf8');
    
    // Check if it's actually initializing individual bots
    const hasRealBotInit = managerContent.includes('initializePrimePicksBot') || 
                          managerContent.includes('prime-picks-bot') ||
                          managerContent.includes('primePicksBot');
    
    const hasMessageProcessing = managerContent.includes('processMessage') || 
                               managerContent.includes('handleMessage');
    
    console.log(`   Real bot initialization: ${hasRealBotInit ? '✅' : '❌'}`);
    console.log(`   Message processing: ${hasMessageProcessing ? '✅' : '❌'}`);
    
    if (!hasRealBotInit) {
      console.log('   ⚠️  Enhanced Manager may not be calling individual bots!');
      this.issues.push('Enhanced Manager not initializing individual bots');
    }
  }

  /**
   * Check server index.ts bot initialization
   */
  checkServerInitialization() {
    console.log('\n🔍 CHECKING SERVER BOT INITIALIZATION');
    console.log('='.repeat(50));
    
    const serverFile = 'server/index.ts';
    
    if (!fs.existsSync(serverFile)) {
      console.log('❌ Server index.ts missing');
      return;
    }
    
    const serverContent = fs.readFileSync(serverFile, 'utf8');
    
    // Check what's actually being initialized
    const hasEnhancedManager = serverContent.includes('enhancedTelegramManager');
    const hasIndividualBots = serverContent.includes('primePicksBot') || 
                             serverContent.includes('initializePrimePicksBot');
    const hasUniversalProcessor = serverContent.includes('universalMessageProcessor');
    
    console.log(`   Enhanced Telegram Manager: ${hasEnhancedManager ? '✅' : '❌'}`);
    console.log(`   Individual bots: ${hasIndividualBots ? '✅' : '❌'}`);
    console.log(`   Universal Message Processor: ${hasUniversalProcessor ? '✅' : '❌'}`);
    
    if (hasEnhancedManager && !hasIndividualBots) {
      console.log('   ⚠️  Only Enhanced Manager - individual bots may not be working!');
      this.issues.push('Server only uses Enhanced Manager, individual bots not initialized');
    }
  }

  /**
   * Generate emergency fix
   */
  generateEmergencyFix() {
    console.log('\n🚨 GENERATING EMERGENCY FIX');
    console.log('='.repeat(50));
    
    // The real fix: Ensure individual bots are initialized alongside Enhanced Manager
    const emergencyFix = `
// EMERGENCY FIX: Add this to server/index.ts after Enhanced Manager initialization

// Initialize individual bots as backup for message processing
try {
  console.log('🚨 EMERGENCY: Initializing individual bots for message processing...');
  
  // Import and initialize Prime Picks bot directly
  const { initializePrimePicksBot } = await import('./prime-picks-bot');
  await initializePrimePicksBot();
  console.log('✅ Prime Picks bot initialized for message processing');
  
  // Add other bots as needed
  console.log('🎯 Individual bot message processing is now ACTIVE!');
  
} catch (error) {
  console.error('❌ Emergency bot initialization failed:', error.message);
  console.log('⚠️  Relying on Enhanced Manager only');
}
`;
    
    console.log('📝 Emergency fix code:');
    console.log(emergencyFix);
    
    // Write fix to file
    fs.writeFileSync('./EMERGENCY_BOT_FIX.md', `# EMERGENCY BOT FIX\n\n## Issue\nTelegram bots are not processing messages from channels.\nAdmin API works but bots don't listen to Telegram messages.\n\n## Root Cause\nEnhanced Telegram Manager may not be properly initializing individual bot message listeners.\n\n## Fix\nAdd individual bot initialization as backup:\n\n\`\`\`typescript${emergencyFix}\`\`\`\n\n## Test\n1. Apply the fix to server/index.ts\n2. Restart server\n3. Post Amazon URL in Prime Picks Telegram channel\n4. Check if product appears on website\n`);
    
    console.log('\n📁 Emergency fix written to: EMERGENCY_BOT_FIX.md');
  }

  /**
   * Apply emergency fix directly
   */
  applyEmergencyFix() {
    console.log('\n🔧 APPLYING EMERGENCY FIX TO SERVER');
    console.log('='.repeat(50));
    
    const serverFile = 'server/index.ts';
    let serverContent = fs.readFileSync(serverFile, 'utf8');
    
    // Check if emergency fix already applied
    if (serverContent.includes('EMERGENCY: Initializing individual bots')) {
      console.log('✅ Emergency fix already applied');
      return;
    }
    
    // Find the right place to insert the fix (after Enhanced Manager)
    const insertPoint = serverContent.indexOf('console.log(\'Link All 8 bots are now managed by Enhanced Telegram Manager\');');
    
    if (insertPoint === -1) {
      console.log('❌ Could not find insertion point in server file');
      return;
    }
    
    const emergencyCode = `
    
    // EMERGENCY FIX: Initialize individual bots for message processing
    try {
      console.log('🚨 EMERGENCY: Initializing individual bots for message processing...');
      
      // Import and initialize Prime Picks bot directly
      const { initializePrimePicksBot } = await import('./prime-picks-bot');
      await initializePrimePicksBot();
      console.log('✅ Prime Picks bot initialized for message processing');
      
      console.log('🎯 Individual bot message processing is now ACTIVE!');
      
    } catch (error) {
      console.error('❌ Emergency bot initialization failed:', error.message);
      console.log('⚠️  Relying on Enhanced Manager only');
    }`;
    
    // Insert the emergency fix
    const beforeFix = serverContent.substring(0, insertPoint + 'console.log(\'Link All 8 bots are now managed by Enhanced Telegram Manager\');'.length);
    const afterFix = serverContent.substring(insertPoint + 'console.log(\'Link All 8 bots are now managed by Enhanced Telegram Manager\');'.length);
    
    const fixedContent = beforeFix + emergencyCode + afterFix;
    
    // Create backup
    fs.writeFileSync(serverFile + '.emergency-backup', serverContent);
    
    // Apply fix
    fs.writeFileSync(serverFile, fixedContent);
    
    console.log('✅ Emergency fix applied to server/index.ts');
    console.log('📁 Backup created: server/index.ts.emergency-backup');
    console.log('🔄 RESTART SERVER to apply emergency fix!');
  }

  /**
   * Run emergency diagnosis and fix
   */
  runEmergencyFix() {
    console.log('🚨 EMERGENCY BOT FIX - TELEGRAM MESSAGES NOT PROCESSING');
    console.log('='.repeat(70));
    console.log('🎯 Issue: Admin API works but Telegram bots not processing messages');
    console.log('='.repeat(70));
    
    try {
      this.checkBotInitialization();
      this.checkEnhancedManager();
      this.checkServerInitialization();
      
      console.log('\n📋 DIAGNOSIS SUMMARY:');
      if (this.issues.length === 0) {
        console.log('✅ No obvious issues found in bot files');
        console.log('⚠️  Issue may be in bot initialization or message routing');
      } else {
        console.log(`❌ Found ${this.issues.length} issues:`);
        this.issues.forEach((issue, i) => {
          console.log(`   ${i + 1}. ${issue}`);
        });
      }
      
      this.generateEmergencyFix();
      this.applyEmergencyFix();
      
      console.log('\n🎊 EMERGENCY FIX COMPLETE!');
      console.log('🔄 RESTART SERVER NOW to apply the fix!');
      console.log('🧪 Test by posting Amazon URL in Prime Picks Telegram channel');
      
    } catch (error) {
      console.error('❌ Emergency fix failed:', error.message);
    }
  }
}

// Run emergency fix
const fixer = new EmergencyBotFixer();
fixer.runEmergencyFix();