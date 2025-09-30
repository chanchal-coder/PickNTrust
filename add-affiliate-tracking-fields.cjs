const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🏷️ Adding Affiliate Tracking Fields to Networks');
console.log('=' .repeat(50));

try {
  // Check if columns already exist
  const tableInfo = db.prepare('PRAGMA table_info(affiliate_networks)').all();
  const hasAffiliateTag = tableInfo.some(col => col.name === 'affiliate_tag');
  const hasTrackingParams = tableInfo.some(col => col.name === 'tracking_params');
  
  if (!hasAffiliateTag) {
    console.log('\nBlog Adding affiliate_tag column...');
    db.prepare('ALTER TABLE affiliate_networks ADD COLUMN affiliate_tag TEXT').run();
    console.log('Success Added affiliate_tag column');
  } else {
    console.log('Success affiliate_tag column already exists');
  }
  
  if (!hasTrackingParams) {
    console.log('\nBlog Adding tracking_params column...');
    db.prepare('ALTER TABLE affiliate_networks ADD COLUMN tracking_params TEXT').run();
    console.log('Success Added tracking_params column');
  } else {
    console.log('Success tracking_params column already exists');
  }
  
  // Update existing networks with sample affiliate tags
  console.log('\n🏷️ Adding sample affiliate tags to existing networks...');
  
  const sampleTags = {
    'Amazon Associates': {
      tag: 'pickntrust03-21',
      params: 'tag={affiliateTag}&linkCode=as2&camp=1789&creative=9325'
    },
    'EarnKaro': {
      tag: 'YOUR_EARNKARO_ID',
      params: 'ref={affiliateTag}'
    },
    'CashKaro': {
      tag: 'YOUR_CASHKARO_ID', 
      params: 'u={affiliateTag}'
    },
    'Flipkart Affiliate': {
      tag: 'YOUR_FLIPKART_ID',
      params: 'affid={affiliateTag}'
    },
    'Myntra Partner': {
      tag: 'YOUR_MYNTRA_ID',
      params: 'utm_source={affiliateTag}&utm_medium=affiliate'
    },
    'Nykaa Affiliate': {
      tag: 'YOUR_NYKAA_ID',
      params: 'nykaa_aff={affiliateTag}'
    }
  };
  
  const networks = db.prepare('SELECT id, name FROM affiliate_networks').all();
  let updatedCount = 0;
  
  networks.forEach(network => {
    // Find matching sample tag by checking if network name contains key
    const matchingKey = Object.keys(sampleTags).find(key => 
      network.name.toLowerCase().includes(key.toLowerCase().split(' ')[0])
    );
    
    if (matchingKey && sampleTags[matchingKey]) {
      const { tag, params } = sampleTags[matchingKey];
      
      db.prepare(`
        UPDATE affiliate_networks 
        SET affiliate_tag = ?, tracking_params = ?
        WHERE id = ? AND (affiliate_tag IS NULL OR affiliate_tag = '')
      `).run(tag, params, network.id);
      
      console.log(`Success Updated ${network.name}: ${tag}`);
      updatedCount++;
    }
  });
  
  console.log(`\nStats Updated ${updatedCount} networks with affiliate tags`);
  
  // Display current network configuration
  console.log('\n📋 Current Affiliate Networks Configuration:');
  const allNetworks = db.prepare(`
    SELECT name, base_url, affiliate_tag, tracking_params, commission_rate, is_active
    FROM affiliate_networks 
    ORDER BY commission_rate DESC
  `).all();
  
  allNetworks.forEach(network => {
    console.log(`\nGlobal ${network.name}:`);
    console.log(`   URL: ${network.base_url}`);
    console.log(`   Tag: ${network.affiliate_tag || 'Not set'}`);
    console.log(`   Params: ${network.tracking_params || 'Not set'}`);
    console.log(`   Commission: ${network.commission_rate}%`);
    console.log(`   Status: ${network.is_active ? 'Active' : 'Inactive'}`);
  });
  
  console.log('\nTarget AFFILIATE TRACKING FIELDS SETUP COMPLETE!');
  console.log('=' .repeat(50));
  console.log('Success Database schema updated');
  console.log('Success Sample affiliate tags added');
  console.log('Success Tracking parameters configured');
  console.log('Success Ready for enhanced link conversion');
  
  console.log('\nTip NEXT STEPS:');
  console.log('Blog 1. Update affiliate tags with your actual IDs');
  console.log('Link 2. Customize tracking parameters as needed');
  console.log('Target 3. Test link conversion with new parameters');
  console.log('Price 4. All products will use proper affiliate tracking');
  
} catch (error) {
  console.error('Error Error adding affiliate tracking fields:', error.message);
} finally {
  db.close();
}