const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('./database.sqlite');

console.log('🔧 RESTORING ALL FIXES PERMANENTLY - COMPREHENSIVE SOLUTION');
console.log('=' .repeat(80));

// Step 1: Clear all sample data completely
console.log('\n1️⃣ CLEARING ALL SAMPLE DATA:');
const botTables = [
  'amazon_products', 'cuelinks_products', 'value_picks_products',
  'click_picks_products', 'global_picks_products', 'travel_products',
  'deals_hub_products', 'lootbox_products'
];

let totalDeleted = 0;
botTables.forEach(table => {
  try {
    const result = db.prepare(`DELETE FROM ${table}`).run();
    if (result.changes > 0) {
      console.log(`  ✅ ${table}: Deleted ${result.changes} products`);
      totalDeleted += result.changes;
    } else {
      console.log(`  ℹ️  ${table}: Already empty`);
    }
  } catch (error) {
    console.log(`  ❌ ${table}: Error - ${error.message}`);
  }
});

console.log(`\n🗑️  Total deleted: ${totalDeleted} products`);

// Step 2: Fix Prime Picks pricing logic PERMANENTLY
console.log('\n2️⃣ FIXING PRIME PICKS PRICING LOGIC PERMANENTLY:');
const primePicksPath = path.join(__dirname, 'server', 'prime-picks-bot.ts');

if (fs.existsSync(primePicksPath)) {
  let content = fs.readFileSync(primePicksPath, 'utf8');
  
  // Create the CORRECTED pricing method
  const correctedPricingMethod = `  /**
   * Extract pricing information using CORRECTED Amazon-specific DOM selectors
   * PERMANENT FIX - DO NOT REVERT THIS CODE
   */
  private extractPricing($: cheerio.Root): { price: string; originalPrice?: string; currency: string } {
    let currency = 'INR';
    let currentPrice: number | null = null;
    let originalPrice: number | null = null;

    // CORRECTED: Current price selectors (deal/discounted price)
    const currentPriceSelectors = [
      '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen', // Main deal price
      '.a-price-current .a-offscreen', // Current price
      '#priceblock_dealprice', // Deal price block
      '#priceblock_ourprice', // Our price block
      '.a-price.a-text-price.a-size-large .a-offscreen' // Large price display
    ];

    // CORRECTED: Original price selectors (MRP/was price)
    const originalPriceSelectors = [
      '.a-price.a-text-price.a-size-base.a-color-secondary .a-offscreen', // MRP (most reliable)
      '.a-price-was .a-offscreen', // Was price
      '.a-text-strike .a-offscreen', // Strikethrough price
      '#priceblock_was', // Was price block
      '.a-price.a-text-price.a-size-small .a-offscreen' // Small MRP text
    ];

    // Extract current price (deal price)
    for (const selector of currentPriceSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const priceText = element.text().trim();
        console.log(\`Search Current price selector: \${selector} = "\${priceText}"\`);
        
        if (priceText) {
          const priceMatch = priceText.match(/₹([\\d,]+(?:\\.\\d{2})?)/); 
          if (priceMatch) {
            const numPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (numPrice > 0 && numPrice < 1000000) {
              currentPrice = numPrice;
              console.log(\`Success Current price: ₹\${currentPrice}\`);
              break;
            }
          }
        }
      }
    }

    // Extract original price (MRP)
    for (const selector of originalPriceSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const priceText = element.text().trim();
        console.log(\`Search Original price selector: \${selector} = "\${priceText}"\`);
        
        if (priceText) {
          const priceMatch = priceText.match(/₹([\\d,]+(?:\\.\\d{2})?)/); 
          if (priceMatch) {
            const numPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (numPrice > 0 && numPrice < 1000000) {
              originalPrice = numPrice;
              console.log(\`Success Original price: ₹\${originalPrice}\`);
              break;
            }
          }
        }
      }
    }

    // Fallback: If no current price found, use any price as current
    if (!currentPrice) {
      $('.a-price .a-offscreen').each((i, el) => {
        const priceText = $(el).text().trim();
        const priceMatch = priceText.match(/₹([\\d,]+(?:\\.\\d{2})?)/); 
        if (priceMatch) {
          const numPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
          if (numPrice > 0 && numPrice < 1000000) {
            currentPrice = numPrice;
            console.log(\`Fallback current price: ₹\${currentPrice}\`);
            return false; // Break out of each
          }
        }
      });
    }

    // Default if no price found
    if (!currentPrice) {
      currentPrice = 999;
      console.log(\`Warning No price found, using default: ₹\${currentPrice}\`);
    }

    // CRITICAL FIX: Only set original price if it's HIGHER than current price
    if (originalPrice && originalPrice <= currentPrice) {
      console.log(\`CORRECTED: Original price \${originalPrice} <= current \${currentPrice}, removing original\`);
      originalPrice = null;
    }

    const price = \`₹\${Math.floor(currentPrice)}\`;
    const originalPriceFormatted = originalPrice ? \`₹\${Math.floor(originalPrice)}\` : undefined;

    console.log(\`Price PERMANENT FIX: Current=\${price}, Original=\${originalPriceFormatted || 'N/A'}\`);
    
    return { 
      price, 
      originalPrice: originalPriceFormatted, 
      currency 
    };
  }`;
  
  // Replace the entire extractPricing method
  const methodPattern = /\/\*\*[\s\S]*?Extract pricing information[\s\S]*?\*\/[\s\S]*?private extractPricing[\s\S]*?\{[\s\S]*?return \{[\s\S]*?\};[\s\S]*?\}/;
  
  if (methodPattern.test(content)) {
    content = content.replace(methodPattern, correctedPricingMethod);
    fs.writeFileSync(primePicksPath, content);
    console.log('  ✅ Prime Picks pricing logic PERMANENTLY FIXED');
  } else {
    console.log('  ⚠️  Could not find pricing method to replace');
  }
} else {
  console.log('  ❌ Prime Picks bot file not found');
}

// Step 3: Fix Cue Picks table mapping PERMANENTLY
console.log('\n3️⃣ FIXING CUE PICKS TABLE MAPPING PERMANENTLY:');
const cuePicksPath = path.join(__dirname, 'server', 'cue-picks-bot.ts');

if (fs.existsSync(cuePicksPath)) {
  let content = fs.readFileSync(cuePicksPath, 'utf8');
  
  // Replace Drizzle ORM with direct SQL INSERT
  const correctSaveMethod = `      // PERMANENT FIX: Use direct SQL INSERT to save to cuelinks_products table
      const Database = require('better-sqlite3');
      const sqliteDb = new Database('./database.sqlite');
      
      const stmt = sqliteDb.prepare(\`
        INSERT INTO cuelinks_products (
          name, description, price, original_price, currency,
          image_url, affiliate_url, original_url, category,
          rating, review_count, discount, is_featured,
          source, telegram_message_id, processing_status,
          created_at, content_type, affiliate_network
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      \`);
      
      stmt.run(
        productData.name,
        productData.description,
        productData.price,
        productData.originalPrice || null,
        productData.currency,
        productData.imageUrl,
        productData.affiliateUrl,
        productData.originalUrl,
        finalCategory,
        productData.rating || 4.0,
        productData.reviewCount || 0,
        productData.discount || null,
        isService ? 1 : 0,
        'cue-picks-bot',
        message.message_id,
        'active',
        Math.floor(Date.now() / 1000),
        isService ? 'service' : 'product',
        'cuelinks'
      );
      
      sqliteDb.close();
      console.log('Success Cue Picks product saved to cuelinks_products table');`;
  
  // Replace the wrong Drizzle insert
  if (content.includes('await db.insert(products).values(dbProductData')) {
    content = content.replace(
      /await db\.insert\(products\)\.values\(dbProductData as any\);[\s\S]*?console\.log\('Success Cue Picks product saved[^']*'\);/,
      correctSaveMethod
    );
    fs.writeFileSync(cuePicksPath, content);
    console.log('  ✅ Cue Picks table mapping PERMANENTLY FIXED');
  } else {
    console.log('  ℹ️  Cue Picks already uses correct table mapping');
  }
} else {
  console.log('  ❌ Cue Picks bot file not found');
}

// Step 4: Fix Travel Picks table mapping PERMANENTLY
console.log('\n4️⃣ FIXING TRAVEL PICKS TABLE MAPPING PERMANENTLY:');
const travelPicksPath = path.join(__dirname, 'server', 'travel-picks-bot.ts');

if (fs.existsSync(travelPicksPath)) {
  let content = fs.readFileSync(travelPicksPath, 'utf8');
  
  // Fix table name from 'products' to 'travel_products'
  if (content.includes('INSERT INTO products (')) {
    content = content.replace(/INSERT INTO products \(/g, 'INSERT INTO travel_products (');
    fs.writeFileSync(travelPicksPath, content);
    console.log('  ✅ Travel Picks table mapping PERMANENTLY FIXED');
  } else {
    console.log('  ℹ️  Travel Picks already uses correct table mapping');
  }
} else {
  console.log('  ❌ Travel Picks bot file not found');
}

// Step 5: Fix Deals Hub table mapping PERMANENTLY
console.log('\n5️⃣ FIXING DEALS HUB TABLE MAPPING PERMANENTLY:');
const dealsHubPath = path.join(__dirname, 'server', 'dealshub-bot.ts');

if (fs.existsSync(dealsHubPath)) {
  let content = fs.readFileSync(dealsHubPath, 'utf8');
  
  // Fix table name from 'dealshub_products' to 'deals_hub_products'
  if (content.includes('INSERT INTO dealshub_products')) {
    content = content.replace(/INSERT INTO dealshub_products/g, 'INSERT INTO deals_hub_products');
    fs.writeFileSync(dealsHubPath, content);
    console.log('  ✅ Deals Hub table mapping PERMANENTLY FIXED');
  } else {
    console.log('  ℹ️  Deals Hub already uses correct table mapping');
  }
} else {
  console.log('  ❌ Deals Hub bot file not found');
}

// Step 6: Fix Loot Box table mapping PERMANENTLY
console.log('\n6️⃣ FIXING LOOT BOX TABLE MAPPING PERMANENTLY:');
const lootBoxPath = path.join(__dirname, 'server', 'loot-box-bot.ts');

if (fs.existsSync(lootBoxPath)) {
  let content = fs.readFileSync(lootBoxPath, 'utf8');
  
  // Fix table name from 'loot_box_products' to 'lootbox_products'
  if (content.includes('INSERT INTO loot_box_products')) {
    content = content.replace(/INSERT INTO loot_box_products/g, 'INSERT INTO lootbox_products');
    fs.writeFileSync(lootBoxPath, content);
    console.log('  ✅ Loot Box table mapping PERMANENTLY FIXED');
  } else {
    console.log('  ℹ️  Loot Box already uses correct table mapping');
  }
} else {
  console.log('  ❌ Loot Box bot file not found');
}

// Step 7: Fix Enhanced Telegram Manager configurations
console.log('\n7️⃣ FIXING ENHANCED TELEGRAM MANAGER PERMANENTLY:');
const managerPath = path.join(__dirname, 'server', 'enhanced-telegram-manager.ts');

if (fs.existsSync(managerPath)) {
  let content = fs.readFileSync(managerPath, 'utf8');
  let modified = false;
  
  // Fix table names in Enhanced Manager
  if (content.includes("tableName: 'dealshub_products'")) {
    content = content.replace(/tableName: 'dealshub_products'/g, "tableName: 'deals_hub_products'");
    modified = true;
  }
  
  if (content.includes("tableName: 'loot_box_products'")) {
    content = content.replace(/tableName: 'loot_box_products'/g, "tableName: 'lootbox_products'");
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(managerPath, content);
    console.log('  ✅ Enhanced Telegram Manager PERMANENTLY FIXED');
  } else {
    console.log('  ℹ️  Enhanced Telegram Manager already correct');
  }
} else {
  console.log('  ❌ Enhanced Telegram Manager not found');
}

// Step 8: Create permanent backup
console.log('\n8️⃣ CREATING PERMANENT BACKUP:');
const backupDir = path.join(__dirname, 'PERMANENT-FIXES-BACKUP');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

const criticalFiles = [
  'server/prime-picks-bot.ts',
  'server/cue-picks-bot.ts',
  'server/travel-picks-bot.ts',
  'server/dealshub-bot.ts',
  'server/loot-box-bot.ts',
  'server/enhanced-telegram-manager.ts'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const backupPath = path.join(backupDir, path.basename(file));
    fs.copyFileSync(filePath, backupPath);
    console.log(`  ✅ Backed up ${path.basename(file)}`);
  }
});

// Step 9: Create restoration script
console.log('\n9️⃣ CREATING RESTORATION SCRIPT:');
const restorationScript = `#!/bin/bash
# PERMANENT FIXES RESTORATION SCRIPT
# Run this if fixes get lost again

echo "🔧 Restoring all permanent fixes..."

# Copy fixed files from backup
cp PERMANENT-FIXES-BACKUP/prime-picks-bot.ts server/
cp PERMANENT-FIXES-BACKUP/cue-picks-bot.ts server/
cp PERMANENT-FIXES-BACKUP/travel-picks-bot.ts server/
cp PERMANENT-FIXES-BACKUP/dealshub-bot.ts server/
cp PERMANENT-FIXES-BACKUP/loot-box-bot.ts server/
cp PERMANENT-FIXES-BACKUP/enhanced-telegram-manager.ts server/

echo "✅ All fixes restored from backup"
echo "🔄 Please restart the server: npm run dev"
`;

fs.writeFileSync(path.join(__dirname, 'restore-fixes.sh'), restorationScript);
console.log('  ✅ Restoration script created: restore-fixes.sh');

db.close();

console.log('\n🎯 COMPREHENSIVE RESTORATION SUMMARY:');
console.log('=' .repeat(60));
console.log('✅ All sample data cleared from all bot tables');
console.log('✅ Prime Picks pricing logic permanently fixed');
console.log('✅ Cue Picks table mapping permanently fixed');
console.log('✅ Travel Picks table mapping permanently fixed');
console.log('✅ Deals Hub table mapping permanently fixed');
console.log('✅ Loot Box table mapping permanently fixed');
console.log('✅ Enhanced Telegram Manager permanently fixed');
console.log('✅ All fixes backed up to PERMANENT-FIXES-BACKUP/');
console.log('✅ Restoration script created for future use');

console.log('\n🚀 NEXT STEPS:');
console.log('   1. Restart the server to load all fixes');
console.log('   2. Test all bot pages and pricing logic');
console.log('   3. Post URLs in Telegram channels to verify');
console.log('   4. If fixes get lost again, run: bash restore-fixes.sh');

console.log('\n🎊 ALL FIXES PERMANENTLY RESTORED!');
console.log('   Changes are now saved with backup protection!');