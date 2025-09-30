#!/usr/bin/env node

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🔍 CHECKING REAL BOT FLOW - Complete Analysis\n');

async function checkRealFlow() {
  try {
    // 1. Determine which database the server is actually using
    console.log('📋 Step 1: Database File Analysis');
    console.log('=' .repeat(50));
    
    const dbFiles = ['database.sqlite', 'sqlite.db', 'database.db'];
    const existingFiles = [];
    
    for (const file of dbFiles) {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        existingFiles.push({
          name: file,
          size: stats.size,
          modified: stats.mtime.toISOString()
        });
      }
    }
    
    console.log('Available database files:');
    existingFiles.forEach(file => {
      console.log(`  📁 ${file.name}: ${file.size} bytes (modified: ${file.modified})`);
    });
    
    // The server uses the logic: database.sqlite exists ? database.sqlite : sqlite.db
    const serverDbFile = fs.existsSync('database.sqlite') ? 'database.sqlite' : 'sqlite.db';
    console.log(`\n🎯 Server is using: ${serverDbFile}`);
    
    // 2. Connect to the actual database the server uses
    console.log('\n📋 Step 2: Database Content Analysis');
    console.log('=' .repeat(50));
    
    const db = new Database(serverDbFile);
    
    // Check tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`📊 Total tables: ${tables.length}`);
    console.log('Tables:', tables.map(t => t.name).join(', '));
    
    // 3. Check products table structure and content
    console.log('\n📋 Step 3: Products Table Analysis');
    console.log('=' .repeat(50));
    
    let productsCount = { count: 0 };
    let telegramProducts = { count: 0 };
    
    try {
      productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
      console.log(`📦 Total products: ${productsCount.count}`);
      
      if (productsCount.count > 0) {
        // Check recent products
        const recentProducts = db.prepare(`
          SELECT id, name, price, source, telegram_message_id, created_at
          FROM products 
          ORDER BY created_at DESC 
          LIMIT 5
        `).all();
        
        console.log('\n🕒 Recent products:');
        recentProducts.forEach(product => {
          const createdDate = new Date(product.created_at * 1000).toLocaleString();
          console.log(`  • ID: ${product.id} | ${product.name} | ₹${product.price} | Source: ${product.source || 'N/A'} | Telegram ID: ${product.telegram_message_id || 'N/A'} | Created: ${createdDate}`);
        });
        
        // Check products from Telegram channels
        telegramProducts = db.prepare(`
          SELECT COUNT(*) as count 
          FROM products 
          WHERE source LIKE '%telegram%' OR telegram_message_id IS NOT NULL
        `).get();
        
        console.log(`\n📱 Products from Telegram: ${telegramProducts.count}`);
        
        if (telegramProducts.count > 0) {
          const telegramSample = db.prepare(`
            SELECT id, name, source, telegram_message_id, created_at
            FROM products 
            WHERE source LIKE '%telegram%' OR telegram_message_id IS NOT NULL
            ORDER BY created_at DESC 
            LIMIT 3
          `).all();
          
          console.log('📱 Sample Telegram products:');
          telegramSample.forEach(product => {
            const createdDate = new Date(product.created_at * 1000).toLocaleString();
            console.log(`  • ${product.name} | Source: ${product.source} | Telegram ID: ${product.telegram_message_id} | ${createdDate}`);
          });
        }
      }
    } catch (error) {
      console.error('❌ Error checking products table:', error.message);
    }
    
    // 4. Check channel-specific tables
    console.log('\n📋 Step 4: Channel-Specific Tables Analysis');
    console.log('=' .repeat(50));
    
    const channelTables = [
      'prime_picks_products',
      'cue_picks_products', 
      'click_picks_products',
      'global_picks_products',
      'value_picks_products'
    ];
    
    for (const tableName of channelTables) {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
        console.log(`📊 ${tableName}: ${count.count} products`);
        
        if (count.count > 0) {
          const recent = db.prepare(`
            SELECT id, name, created_at 
            FROM ${tableName} 
            ORDER BY created_at DESC 
            LIMIT 2
          `).all();
          
          recent.forEach(product => {
            const createdDate = new Date(product.created_at * 1000).toLocaleString();
            console.log(`  • ${product.name} (${createdDate})`);
          });
        }
      } catch (error) {
        console.log(`⚠️  ${tableName}: Table doesn't exist or error - ${error.message}`);
      }
    }
    
    // 5. Check if Telegram bot is configured
    console.log('\n📋 Step 5: Telegram Bot Configuration');
    console.log('=' .repeat(50));
    
    const botToken = process.env.MASTER_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const enableBot = process.env.ENABLE_TELEGRAM_BOT;
    
    console.log(`🤖 Bot Token (MASTER_BOT_TOKEN): ${process.env.MASTER_BOT_TOKEN ? 'SET ✅' : 'NOT SET ❌'}`);
    console.log(`🤖 Bot Token (TELEGRAM_BOT_TOKEN): ${process.env.TELEGRAM_BOT_TOKEN ? 'SET ✅' : 'NOT SET ❌'}`);
    console.log(`🔧 Bot Enabled: ${enableBot || 'NOT SET'}`);
    
    // Check channel configurations
    const channels = [
      { name: 'Prime Picks', id: process.env.PRIME_PICKS_CHANNEL_ID },
      { name: 'Cue Picks', id: process.env.CUELINKS_CHANNEL_ID },
      { name: 'Value Picks', id: process.env.VALUE_PICKS_CHANNEL_ID },
      { name: 'Click Picks', id: process.env.CLICK_PICKS_CHANNEL_ID },
      { name: 'Global Picks', id: process.env.GLOBAL_PICKS_CHANNEL_ID }
    ];
    
    console.log('\n📺 Channel Configurations:');
    channels.forEach(channel => {
      console.log(`  • ${channel.name}: ${channel.id ? 'SET ✅' : 'NOT SET ❌'}`);
    });
    
    // 6. Summary and recommendations
    console.log('\n📋 Step 6: Flow Analysis Summary');
    console.log('=' .repeat(50));
    
    console.log('\n🔄 EXPECTED FLOW:');
    console.log('1. Telegram channels post messages with product info');
    console.log('2. Bot listens to channel_post events');
    console.log('3. Bot extracts product info (name, price, URLs, images)');
    console.log('4. Bot converts URLs to affiliate links');
    console.log('5. Bot saves products to database');
    console.log('6. Website displays products from database');
    
    console.log('\n📊 CURRENT STATUS:');
    console.log(`• Database file: ${serverDbFile}`);
    console.log(`• Total products: ${productsCount?.count || 0}`);
    console.log(`• Telegram products: ${telegramProducts?.count || 0}`);
    console.log(`• Bot configured: ${botToken && enableBot === 'true' ? 'YES ✅' : 'NO ❌'}`);
    
    if (telegramProducts?.count > 0) {
      console.log('\n✅ FLOW IS WORKING: Bot is successfully processing Telegram messages and saving to database');
    } else if (!botToken) {
      console.log('\n❌ CRITICAL ISSUE: No bot token configured');
      console.log('   - MASTER_BOT_TOKEN is missing from .env file');
      console.log('   - Bot cannot connect to Telegram API');
    } else if (enableBot !== 'true') {
      console.log('\n⚠️  BOT DISABLED: ENABLE_TELEGRAM_BOT is not set to "true"');
      console.log('   - Bot token exists but bot is disabled');
      console.log('   - Set ENABLE_TELEGRAM_BOT=true to activate');
    } else {
      console.log('\n⚠️  FLOW ISSUE: Bot is configured but no Telegram products found. Possible causes:');
      console.log('   - Bot not receiving messages from channels');
      console.log('   - Bot not added to channels as admin');
      console.log('   - Message processing logic not working');
      console.log('   - Channels not posting messages yet');
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error during flow analysis:', error);
  }
}

checkRealFlow().catch(console.error);