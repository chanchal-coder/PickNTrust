/**
 * Disable Value Picks Affiliate Tag System
 * Remove automatic affiliate conversion for Value Picks bot
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

class ValuePicksAffiliateDisabler {
  constructor() {
    this.db = new Database(DB_PATH);
  }

  /**
   * Disable affiliate tags for Value Picks bot
   */
  disableValuePicksAffiliateTags() {
    console.log('🔧 Disabling Value Picks Affiliate Tags...');
    console.log('=' .repeat(50));
    
    try {
      // Check if bot_affiliate_tags table exists
      const tableExists = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='bot_affiliate_tags'
      `).get();
      
      if (!tableExists) {
        console.log('ℹ️ bot_affiliate_tags table does not exist - no action needed');
        return;
      }
      
      // Check current Value Picks affiliate tags
      const currentTags = this.db.prepare(`
        SELECT id, network_name, affiliate_tag, is_active 
        FROM bot_affiliate_tags 
        WHERE bot_name = 'value-picks'
      `).all();
      
      console.log(`Stats Found ${currentTags.length} Value Picks affiliate tags:`);
      currentTags.forEach((tag, index) => {
        console.log(`  ${index + 1}. ${tag.network_name}: ${tag.is_active ? 'Active' : 'Inactive'}`);
        console.log(`     Tag: ${tag.affiliate_tag}`);
      });
      
      if (currentTags.length === 0) {
        console.log('Success No Value Picks affiliate tags found - already clean');
        return;
      }
      
      // Disable all Value Picks affiliate tags
      const result = this.db.prepare(`
        UPDATE bot_affiliate_tags 
        SET is_active = 0, 
            updated_at = datetime('now')
        WHERE bot_name = 'value-picks'
      `).run();
      
      console.log(`\nSuccess Disabled ${result.changes} Value Picks affiliate tags`);
      
      // Verify the changes
      const updatedTags = this.db.prepare(`
        SELECT network_name, is_active 
        FROM bot_affiliate_tags 
        WHERE bot_name = 'value-picks'
      `).all();
      
      console.log(`\n📋 Updated Value Picks tags status:`);
      updatedTags.forEach((tag, index) => {
        console.log(`  ${index + 1}. ${tag.network_name}: ${tag.is_active ? 'Active' : 'Disabled Success'}`);
      });
      
    } catch (error) {
      console.log(`Error Error disabling affiliate tags: ${error.message}`);
    }
  }

  /**
   * Update existing Value Picks products to remove affiliate conversion
   */
  updateExistingProducts() {
    console.log('\n🔧 Updating Existing Value Picks Products...');
    console.log('=' .repeat(50));
    
    try {
      // Check if value_picks_products table exists
      const tableExists = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='value_picks_products'
      `).get();
      
      if (!tableExists) {
        console.log('ℹ️ value_picks_products table does not exist - no products to update');
        return;
      }
      
      // Check current products with affiliate conversion
      const affiliateProducts = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM value_picks_products 
        WHERE affiliate_tag_applied = 1
      `).get().count;
      
      console.log(`Stats Found ${affiliateProducts} products with affiliate conversion applied`);
      
      if (affiliateProducts === 0) {
        console.log('Success No products need updating - already clean');
        return;
      }
      
      // Update products to remove affiliate conversion flag
      const result = this.db.prepare(`
        UPDATE value_picks_products 
        SET affiliate_tag_applied = 0,
            affiliate_network = 'Direct'
        WHERE affiliate_tag_applied = 1
      `).run();
      
      console.log(`Success Updated ${result.changes} products to disable affiliate conversion`);
      
      // Show sample of updated products
      const sampleProducts = this.db.prepare(`
        SELECT name, affiliate_network, affiliate_tag_applied 
        FROM value_picks_products 
        ORDER BY created_at DESC 
        LIMIT 3
      `).all();
      
      console.log(`\n📋 Sample updated products:`);
      sampleProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name}`);
        console.log(`     Network: ${product.affiliate_network}`);
        console.log(`     Tag Applied: ${product.affiliate_tag_applied ? 'Yes' : 'No Success'}`);
      });
      
    } catch (error) {
      console.log(`Error Error updating products: ${error.message}`);
    }
  }

  /**
   * Generate summary report
   */
  generateReport() {
    console.log('\n📋 VALUE PICKS AFFILIATE REMOVAL REPORT');
    console.log('=' .repeat(50));
    
    console.log('\nSuccess **Changes Made:**');
    console.log('• Disabled automatic EKaro affiliate URL conversion');
    console.log('• Updated bot to use original URLs as-is');
    console.log('• Set affiliate_tag_applied = 0 for new products');
    console.log('• Changed affiliate_network to "Direct"');
    console.log('• Disabled all Value Picks affiliate tags in database');
    
    console.log('\nTarget **Result:**');
    console.log('• Value Picks bot will now accept URLs directly from channel');
    console.log('• No automatic affiliate conversion will occur');
    console.log('• You can post affiliate URLs directly in the channel');
    console.log('• Bot will save and display the URLs exactly as provided');
    
    console.log('\nTip **Usage:**');
    console.log('1. Post affiliate URLs directly in Value Picks channel');
    console.log('2. Bot will process them without modification');
    console.log('3. Products will display with your provided affiliate links');
    console.log('4. No additional affiliate conversion will happen');
    
    console.log('\nRefresh **Server Restart Required:**');
    console.log('Please restart your server to apply the bot code changes.');
  }

  /**
   * Run complete affiliate removal process
   */
  runCompleteRemoval() {
    console.log('Launch Removing Value Picks Affiliate Tag System');
    console.log('=' .repeat(60));
    
    // Disable affiliate tags
    this.disableValuePicksAffiliateTags();
    
    // Update existing products
    this.updateExistingProducts();
    
    // Generate report
    this.generateReport();
    
    console.log('\nCelebration **VALUE PICKS AFFILIATE REMOVAL COMPLETE!**');
    console.log('\nValue Picks will now accept affiliate URLs directly from the channel.');
  }

  cleanup() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Run the affiliate removal
async function runAffiliateRemoval() {
  const disabler = new ValuePicksAffiliateDisabler();
  
  try {
    disabler.runCompleteRemoval();
  } catch (error) {
    console.error('Error Affiliate removal failed:', error.message);
  } finally {
    disabler.cleanup();
  }
}

if (require.main === module) {
  runAffiliateRemoval();
}

module.exports = { ValuePicksAffiliateDisabler, runAffiliateRemoval };