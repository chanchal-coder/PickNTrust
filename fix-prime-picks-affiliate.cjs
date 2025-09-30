// Fix Prime Picks Affiliate URLs - Ensure all use pickntrust03-21 tag
const Database = require('better-sqlite3');
const axios = require('axios');

async function fixPrimePicksAffiliateUrls() {
  console.log('🔧 FIXING PRIME PICKS AFFILIATE URLS');
  console.log('===================================');
  
  const db = new Database('database.sqlite');
  
  // Get all Prime Picks products
  const stmt = db.prepare(`
    SELECT id, title, affiliate_url 
    FROM unified_content 
    WHERE display_pages LIKE '%prime_picks%' 
    ORDER BY id DESC
  `);
  const products = stmt.all();
  
  console.log(`📊 Found ${products.length} Prime Picks products`);
  
  let fixedCount = 0;
  let alreadyCorrectCount = 0;
  let errorCount = 0;
  
  for (const product of products) {
    console.log(`\\n🔍 Processing: ${product.title.substring(0, 50)}...`);
    console.log(`   Current URL: ${product.affiliate_url?.substring(0, 80)}...`);
    
    try {
      const affiliateUrl = product.affiliate_url;
      
      // Check if it already has the correct tag
      if (affiliateUrl && affiliateUrl.includes('tag=pickntrust03-21')) {
        console.log('   ✅ Already has correct affiliate tag');
        alreadyCorrectCount++;
        continue;
      }
      
      // Fix the affiliate URL
      let newAffiliateUrl = '';
      
      if (affiliateUrl) {
        // Handle different URL types
        if (affiliateUrl.includes('amazon.in') || affiliateUrl.includes('amazon.com')) {
          // Direct Amazon URL - add/replace tag
          newAffiliateUrl = await fixAmazonUrl(affiliateUrl);
        } else if (affiliateUrl.includes('amzn.to/')) {
          // Handle shortened Amazon URLs
          console.log('   🔄 Resolving shortened URL...');
          newAffiliateUrl = await resolveAndFixShortenedUrl(affiliateUrl);
        } else {
          console.log('   ⚠️ Not an Amazon URL, skipping');
          continue;
        }
      } else {
        console.log('   ❌ No URL to fix');
        errorCount++;
        continue;
      }
      
      if (newAffiliateUrl && newAffiliateUrl !== affiliateUrl) {
        // Update the database
        const updateQuery = `
          UPDATE unified_content 
          SET affiliate_url = ?
          WHERE id = ?
        `;
        
        db.prepare(updateQuery).run(newAffiliateUrl, product.id);
        
        console.log(`   ✅ Fixed affiliate URL`);
        console.log(`   New URL: ${newAffiliateUrl.substring(0, 80)}...`);
        fixedCount++;
      } else {
        console.log('   ⚠️ Could not generate valid affiliate URL');
        errorCount++;
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\\n📊 SUMMARY:');
  console.log(`   ✅ Fixed: ${fixedCount} products`);
  console.log(`   ✅ Already correct: ${alreadyCorrectCount} products`);
  console.log(`   ❌ Errors: ${errorCount} products`);
  console.log(`   📊 Total processed: ${products.length} products`);
  
  db.close();
}

async function fixAmazonUrl(url) {
  try {
    // Clean the URL and add proper affiliate tag
    const cleanUrl = url.split('?')[0];
    
    // Extract product ID (ASIN) from Amazon URL
    const asinMatch = cleanUrl.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|\/([A-Z0-9]{10})(?:\/|$)/);
    const asin = asinMatch ? (asinMatch[1] || asinMatch[2] || asinMatch[3]) : null;
    
    if (asin) {
      // Build proper Amazon affiliate URL
      const domain = url.includes('amazon.com') ? 'amazon.com' : 'amazon.in';
      return `https://www.${domain}/dp/${asin}?tag=pickntrust03-21&linkCode=as2&camp=1789&creative=9325`;
    } else {
      // Fallback: add tag to existing URL
      const separator = url.includes('?') ? '&' : '?';
      return `${cleanUrl}${separator}tag=pickntrust03-21&linkCode=as2&camp=1789&creative=9325`;
    }
  } catch (error) {
    throw new Error(`Failed to fix Amazon URL: ${error.message}`);
  }
}

async function resolveAndFixShortenedUrl(shortenedUrl) {
  try {
    console.log('   🔄 Resolving shortened URL...');
    
    // Follow redirects to get the final URL
    const response = await axios.get(shortenedUrl, {
      maxRedirects: 10,
      timeout: 10000,
      validateStatus: () => true // Accept any status
    });
    
    const finalUrl = response.request.res.responseUrl || shortenedUrl;
    console.log(`   📍 Resolved to: ${finalUrl.substring(0, 60)}...`);
    
    if (finalUrl.includes('amazon.in') || finalUrl.includes('amazon.com')) {
      return await fixAmazonUrl(finalUrl);
    } else {
      throw new Error('Resolved URL is not an Amazon URL');
    }
  } catch (error) {
    console.log(`   ⚠️ Could not resolve shortened URL: ${error.message}`);
    // Fallback: assume it's Amazon and create a generic affiliate URL
    return shortenedUrl.replace(/\\?.*/, '') + '?tag=pickntrust03-21&linkCode=as2&camp=1789&creative=9325';
  }
}

// Also fix the telegram bot configuration
async function fixTelegramBotConfig() {
  console.log('\\n🔧 FIXING TELEGRAM BOT CONFIG');
  console.log('==============================');
  
  const fs = require('fs');
  const path = require('path');
  
  const botPath = path.join(__dirname, 'server', 'telegram-bot.ts');
  
  if (!fs.existsSync(botPath)) {
    console.log('❌ Telegram bot file not found');
    return;
  }
  
  let content = fs.readFileSync(botPath, 'utf8');
  
  // Ensure Prime Picks channel has correct configuration
  const primePicksConfig = `  '-1002955338551': {
    pageName: 'Prime Picks',
    affiliateTag: 'tag=pickntrust03-21',
    platform: 'amazon',
    pageSlug: 'prime-picks'
  },`;
  
  // Update the channel config
  content = content.replace(
    /'-1002955338551':\s*{[^}]*}/,
    primePicksConfig.trim()
  );
  
  // Ensure the convertToAmazonAffiliate function is correct
  const improvedAmazonFunction = `function convertToAmazonAffiliate(url: string, tag: string): string {
  try {
    const cleanUrl = cleanAffiliateUrl(url);
    const urlObj = new URL(cleanUrl);
    
    // Add the affiliate tag
    urlObj.searchParams.set('tag', 'pickntrust03-21');
    urlObj.searchParams.set('linkCode', 'as2');
    urlObj.searchParams.set('camp', '1789');
    urlObj.searchParams.set('creative', '9325');
    
    return urlObj.toString();
  } catch (error) {
    // Fallback for malformed URLs
    const baseUrl = url.split('?')[0];
    return \`\${baseUrl}?tag=pickntrust03-21&linkCode=as2&camp=1789&creative=9325\`;
  }
}`;
  
  // Replace the function
  content = content.replace(
    /function convertToAmazonAffiliate\([^{]*\{[^}]*\}/s,
    improvedAmazonFunction
  );
  
  fs.writeFileSync(botPath, content);
  console.log('✅ Telegram bot configuration updated');
}

// Run the fixes
fixPrimePicksAffiliateUrls()
  .then(() => fixTelegramBotConfig())
  .then(() => {
    console.log('\\n🎉 Prime Picks affiliate URL fix completed!');
    console.log('💡 All Prime Picks products should now use pickntrust03-21 tag');
  })
  .catch(console.error);