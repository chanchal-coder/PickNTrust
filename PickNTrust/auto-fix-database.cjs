const Database = require('better-sqlite3');

console.log('🔧 Fixing Database Schema Issues...');

function fixDatabase() {
  const dbFile = require('fs').existsSync('sqlite.db') ? 'sqlite.db' : 'database.sqlite';
  const db = new Database(dbFile);
  
  try {
    // Add originalPrice to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN originalPrice TEXT').run();
      console.log('✅ Added originalPrice to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add originalPrice:', e.message);
      }
    }
    
    // Add imageUrl to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN imageUrl TEXT').run();
      console.log('✅ Added imageUrl to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add imageUrl:', e.message);
      }
    }
    
    // Add affiliateUrl to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN affiliateUrl TEXT').run();
      console.log('✅ Added affiliateUrl to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add affiliateUrl:', e.message);
      }
    }
    
    // Add affiliateNetworkId to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN affiliateNetworkId TEXT').run();
      console.log('✅ Added affiliateNetworkId to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add affiliateNetworkId:', e.message);
      }
    }
    
    // Add reviewCount to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN reviewCount INTEGER').run();
      console.log('✅ Added reviewCount to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add reviewCount:', e.message);
      }
    }
    
    // Add isNew to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN isNew INTEGER DEFAULT 0').run();
      console.log('✅ Added isNew to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add isNew:', e.message);
      }
    }
    
    // Add isFeatured to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN isFeatured INTEGER DEFAULT 0').run();
      console.log('✅ Added isFeatured to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add isFeatured:', e.message);
      }
    }
    
    // Add isService to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN isService INTEGER DEFAULT 0').run();
      console.log('✅ Added isService to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add isService:', e.message);
      }
    }
    
    // Add customFields to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN customFields TEXT').run();
      console.log('✅ Added customFields to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add customFields:', e.message);
      }
    }
    
    // Add hasTimer to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN hasTimer INTEGER DEFAULT 0').run();
      console.log('✅ Added hasTimer to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add hasTimer:', e.message);
      }
    }
    
    // Add timerDuration to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN timerDuration TEXT').run();
      console.log('✅ Added timerDuration to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add timerDuration:', e.message);
      }
    }
    
    // Add timerStartTime to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN timerStartTime INTEGER').run();
      console.log('✅ Added timerStartTime to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add timerStartTime:', e.message);
      }
    }
    
    // Add createdAt to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN createdAt INTEGER').run();
      console.log('✅ Added createdAt to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add createdAt:', e.message);
      }
    }
    
    // Add isActive to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN isActive INTEGER DEFAULT 0').run();
      console.log('✅ Added isActive to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add isActive:', e.message);
      }
    }
    
    // Add textColor to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN textColor TEXT').run();
      console.log('✅ Added textColor to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add textColor:', e.message);
      }
    }
    
    // Add backgroundColor to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN backgroundColor TEXT').run();
      console.log('✅ Added backgroundColor to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add backgroundColor:', e.message);
      }
    }
    
    // Add fontSize to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN fontSize TEXT').run();
      console.log('✅ Added fontSize to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add fontSize:', e.message);
      }
    }
    
    // Add fontWeight to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN fontWeight TEXT').run();
      console.log('✅ Added fontWeight to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add fontWeight:', e.message);
      }
    }
    
    // Add textDecoration to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN textDecoration TEXT').run();
      console.log('✅ Added textDecoration to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add textDecoration:', e.message);
      }
    }
    
    // Add fontStyle to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN fontStyle TEXT').run();
      console.log('✅ Added fontStyle to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add fontStyle:', e.message);
      }
    }
    
    // Add animationSpeed to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN animationSpeed TEXT').run();
      console.log('✅ Added animationSpeed to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add animationSpeed:', e.message);
      }
    }
    
    // Add textBorderWidth to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN textBorderWidth INTEGER').run();
      console.log('✅ Added textBorderWidth to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add textBorderWidth:', e.message);
      }
    }
    
    // Add textBorderStyle to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN textBorderStyle TEXT').run();
      console.log('✅ Added textBorderStyle to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add textBorderStyle:', e.message);
      }
    }
    
    // Add textBorderColor to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN textBorderColor TEXT').run();
      console.log('✅ Added textBorderColor to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add textBorderColor:', e.message);
      }
    }
    
    // Add bannerBorderWidth to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN bannerBorderWidth INTEGER').run();
      console.log('✅ Added bannerBorderWidth to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add bannerBorderWidth:', e.message);
      }
    }
    
    // Add bannerBorderStyle to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN bannerBorderStyle TEXT').run();
      console.log('✅ Added bannerBorderStyle to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add bannerBorderStyle:', e.message);
      }
    }
    
    // Add bannerBorderColor to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN bannerBorderColor TEXT').run();
      console.log('✅ Added bannerBorderColor to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add bannerBorderColor:', e.message);
      }
    }
    
    // Add createdAt to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN createdAt INTEGER').run();
      console.log('✅ Added createdAt to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add createdAt:', e.message);
      }
    }
    
    // Add originalPrice to sqlite.db: products
    try {
      db.prepare('ALTER TABLE sqlite.db: products ADD COLUMN originalPrice TEXT').run();
      console.log('✅ Added originalPrice to sqlite.db: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add originalPrice:', e.message);
      }
    }
    
    // Add imageUrl to sqlite.db: products
    try {
      db.prepare('ALTER TABLE sqlite.db: products ADD COLUMN imageUrl TEXT').run();
      console.log('✅ Added imageUrl to sqlite.db: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add imageUrl:', e.message);
      }
    }
    
    // Add affiliateUrl to sqlite.db: products
    try {
      db.prepare('ALTER TABLE sqlite.db: products ADD COLUMN affiliateUrl TEXT').run();
      console.log('✅ Added affiliateUrl to sqlite.db: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add affiliateUrl:', e.message);
      }
    }
    
    // Add affiliateNetworkId to sqlite.db: products
    try {
      db.prepare('ALTER TABLE sqlite.db: products ADD COLUMN affiliateNetworkId TEXT').run();
      console.log('✅ Added affiliateNetworkId to sqlite.db: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add affiliateNetworkId:', e.message);
      }
    }
    
    // Add reviewCount to sqlite.db: products
    try {
      db.prepare('ALTER TABLE sqlite.db: products ADD COLUMN reviewCount INTEGER').run();
      console.log('✅ Added reviewCount to sqlite.db: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add reviewCount:', e.message);
      }
    }
    
    // Add isNew to sqlite.db: products
    try {
      db.prepare('ALTER TABLE sqlite.db: products ADD COLUMN isNew INTEGER DEFAULT 0').run();
      console.log('✅ Added isNew to sqlite.db: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add isNew:', e.message);
      }
    }
    
    // Add isFeatured to sqlite.db: products
    try {
      db.prepare('ALTER TABLE sqlite.db: products ADD COLUMN isFeatured INTEGER DEFAULT 0').run();
      console.log('✅ Added isFeatured to sqlite.db: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add isFeatured:', e.message);
      }
    }
    
    // Add isService to sqlite.db: products
    try {
      db.prepare('ALTER TABLE sqlite.db: products ADD COLUMN isService INTEGER DEFAULT 0').run();
      console.log('✅ Added isService to sqlite.db: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add isService:', e.message);
      }
    }
    
    // Add customFields to sqlite.db: products
    try {
      db.prepare('ALTER TABLE sqlite.db: products ADD COLUMN customFields TEXT').run();
      console.log('✅ Added customFields to sqlite.db: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add customFields:', e.message);
      }
    }
    
    // Add hasTimer to sqlite.db: products
    try {
      db.prepare('ALTER TABLE sqlite.db: products ADD COLUMN hasTimer INTEGER DEFAULT 0').run();
      console.log('✅ Added hasTimer to sqlite.db: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add hasTimer:', e.message);
      }
    }
    
    // Add timerDuration to sqlite.db: products
    try {
      db.prepare('ALTER TABLE sqlite.db: products ADD COLUMN timerDuration TEXT').run();
      console.log('✅ Added timerDuration to sqlite.db: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add timerDuration:', e.message);
      }
    }
    
    // Add timerStartTime to sqlite.db: products
    try {
      db.prepare('ALTER TABLE sqlite.db: products ADD COLUMN timerStartTime INTEGER').run();
      console.log('✅ Added timerStartTime to sqlite.db: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add timerStartTime:', e.message);
      }
    }
    
    // Add createdAt to sqlite.db: products
    try {
      db.prepare('ALTER TABLE sqlite.db: products ADD COLUMN createdAt INTEGER').run();
      console.log('✅ Added createdAt to sqlite.db: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add createdAt:', e.message);
      }
    }
    
    // Add isActive to sqlite.db: announcements
    try {
      db.prepare('ALTER TABLE sqlite.db: announcements ADD COLUMN isActive INTEGER DEFAULT 0').run();
      console.log('✅ Added isActive to sqlite.db: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add isActive:', e.message);
      }
    }
    
    // Add textColor to sqlite.db: announcements
    try {
      db.prepare('ALTER TABLE sqlite.db: announcements ADD COLUMN textColor TEXT').run();
      console.log('✅ Added textColor to sqlite.db: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add textColor:', e.message);
      }
    }
    
    // Add backgroundColor to sqlite.db: announcements
    try {
      db.prepare('ALTER TABLE sqlite.db: announcements ADD COLUMN backgroundColor TEXT').run();
      console.log('✅ Added backgroundColor to sqlite.db: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add backgroundColor:', e.message);
      }
    }
    
    // Add fontSize to sqlite.db: announcements
    try {
      db.prepare('ALTER TABLE sqlite.db: announcements ADD COLUMN fontSize TEXT').run();
      console.log('✅ Added fontSize to sqlite.db: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add fontSize:', e.message);
      }
    }
    
    // Add fontWeight to sqlite.db: announcements
    try {
      db.prepare('ALTER TABLE sqlite.db: announcements ADD COLUMN fontWeight TEXT').run();
      console.log('✅ Added fontWeight to sqlite.db: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add fontWeight:', e.message);
      }
    }
    
    // Add textDecoration to sqlite.db: announcements
    try {
      db.prepare('ALTER TABLE sqlite.db: announcements ADD COLUMN textDecoration TEXT').run();
      console.log('✅ Added textDecoration to sqlite.db: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add textDecoration:', e.message);
      }
    }
    
    // Add fontStyle to sqlite.db: announcements
    try {
      db.prepare('ALTER TABLE sqlite.db: announcements ADD COLUMN fontStyle TEXT').run();
      console.log('✅ Added fontStyle to sqlite.db: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add fontStyle:', e.message);
      }
    }
    
    // Add animationSpeed to sqlite.db: announcements
    try {
      db.prepare('ALTER TABLE sqlite.db: announcements ADD COLUMN animationSpeed TEXT').run();
      console.log('✅ Added animationSpeed to sqlite.db: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add animationSpeed:', e.message);
      }
    }
    
    // Add textBorderWidth to sqlite.db: announcements
    try {
      db.prepare('ALTER TABLE sqlite.db: announcements ADD COLUMN textBorderWidth INTEGER').run();
      console.log('✅ Added textBorderWidth to sqlite.db: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add textBorderWidth:', e.message);
      }
    }
    
    // Add textBorderStyle to sqlite.db: announcements
    try {
      db.prepare('ALTER TABLE sqlite.db: announcements ADD COLUMN textBorderStyle TEXT').run();
      console.log('✅ Added textBorderStyle to sqlite.db: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add textBorderStyle:', e.message);
      }
    }
    
    // Add textBorderColor to sqlite.db: announcements
    try {
      db.prepare('ALTER TABLE sqlite.db: announcements ADD COLUMN textBorderColor TEXT').run();
      console.log('✅ Added textBorderColor to sqlite.db: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add textBorderColor:', e.message);
      }
    }
    
    // Add bannerBorderWidth to sqlite.db: announcements
    try {
      db.prepare('ALTER TABLE sqlite.db: announcements ADD COLUMN bannerBorderWidth INTEGER').run();
      console.log('✅ Added bannerBorderWidth to sqlite.db: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add bannerBorderWidth:', e.message);
      }
    }
    
    // Add bannerBorderStyle to sqlite.db: announcements
    try {
      db.prepare('ALTER TABLE sqlite.db: announcements ADD COLUMN bannerBorderStyle TEXT').run();
      console.log('✅ Added bannerBorderStyle to sqlite.db: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add bannerBorderStyle:', e.message);
      }
    }
    
    // Add bannerBorderColor to sqlite.db: announcements
    try {
      db.prepare('ALTER TABLE sqlite.db: announcements ADD COLUMN bannerBorderColor TEXT').run();
      console.log('✅ Added bannerBorderColor to sqlite.db: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add bannerBorderColor:', e.message);
      }
    }
    
    // Add createdAt to sqlite.db: announcements
    try {
      db.prepare('ALTER TABLE sqlite.db: announcements ADD COLUMN createdAt INTEGER').run();
      console.log('✅ Added createdAt to sqlite.db: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('❌ Failed to add createdAt:', e.message);
      }
    }
    
    console.log('✅ Database fixes completed');
    db.close();
    return true;
    
  } catch (error) {
    console.log('❌ Fix failed:', error.message);
    db.close();
    return false;
  }
}

fixDatabase();
