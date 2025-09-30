const Database = require('better-sqlite3');

console.log('🔧 Fixing Database Schema Issues...');

function fixDatabase() {
  const dbFile = require('fs').existsSync('sqlite.db') ? 'sqlite.db' : 'database.sqlite';
  const db = new Database(dbFile);
  
  try {
    // Add originalPrice to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN originalPrice TEXT').run();
      console.log('Success Added originalPrice to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add originalPrice:', e.message);
      }
    }
    
    // Add imageUrl to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN imageUrl TEXT').run();
      console.log('Success Added imageUrl to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add imageUrl:', e.message);
      }
    }
    
    // Add affiliateUrl to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN affiliateUrl TEXT').run();
      console.log('Success Added affiliateUrl to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add affiliateUrl:', e.message);
      }
    }
    
    // Add affiliateNetworkId to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN affiliateNetworkId TEXT').run();
      console.log('Success Added affiliateNetworkId to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add affiliateNetworkId:', e.message);
      }
    }
    
    // Add reviewCount to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN reviewCount INTEGER').run();
      console.log('Success Added reviewCount to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add reviewCount:', e.message);
      }
    }
    
    // Add isNew to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN isNew INTEGER DEFAULT 0').run();
      console.log('Success Added isNew to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add isNew:', e.message);
      }
    }
    
    // Add isFeatured to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN isFeatured INTEGER DEFAULT 0').run();
      console.log('Success Added isFeatured to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add isFeatured:', e.message);
      }
    }
    
    // Add isService to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN isService INTEGER DEFAULT 0').run();
      console.log('Success Added isService to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add isService:', e.message);
      }
    }
    
    // Add customFields to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN customFields TEXT').run();
      console.log('Success Added customFields to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add customFields:', e.message);
      }
    }
    
    // Add pricingType to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN pricingType TEXT').run();
      console.log('Success Added pricingType to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add pricingType:', e.message);
      }
    }
    
    // Add monthlyPrice to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN monthlyPrice TEXT').run();
      console.log('Success Added monthlyPrice to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add monthlyPrice:', e.message);
      }
    }
    
    // Add yearlyPrice to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN yearlyPrice TEXT').run();
      console.log('Success Added yearlyPrice to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add yearlyPrice:', e.message);
      }
    }
    
    // Add isFree to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN isFree INTEGER DEFAULT 0').run();
      console.log('Success Added isFree to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add isFree:', e.message);
      }
    }
    
    // Add priceDescription to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN priceDescription NUMERIC').run();
      console.log('Success Added priceDescription to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add priceDescription:', e.message);
      }
    }
    
    // Add hasTimer to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN hasTimer INTEGER DEFAULT 0').run();
      console.log('Success Added hasTimer to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add hasTimer:', e.message);
      }
    }
    
    // Add timerDuration to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN timerDuration TEXT').run();
      console.log('Success Added timerDuration to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add timerDuration:', e.message);
      }
    }
    
    // Add timerStartTime to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN timerStartTime INTEGER').run();
      console.log('Success Added timerStartTime to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add timerStartTime:', e.message);
      }
    }
    
    // Add createdAt to database.sqlite: products
    try {
      db.prepare('ALTER TABLE database.sqlite: products ADD COLUMN createdAt INTEGER').run();
      console.log('Success Added createdAt to database.sqlite: products');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add createdAt:', e.message);
      }
    }
    
    // Add isForProducts to database.sqlite: categories
    try {
      db.prepare('ALTER TABLE database.sqlite: categories ADD COLUMN isForProducts INTEGER DEFAULT 0').run();
      console.log('Success Added isForProducts to database.sqlite: categories');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add isForProducts:', e.message);
      }
    }
    
    // Add isForServices to database.sqlite: categories
    try {
      db.prepare('ALTER TABLE database.sqlite: categories ADD COLUMN isForServices INTEGER DEFAULT 0').run();
      console.log('Success Added isForServices to database.sqlite: categories');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add isForServices:', e.message);
      }
    }
    
    // Add displayOrder to database.sqlite: categories
    try {
      db.prepare('ALTER TABLE database.sqlite: categories ADD COLUMN displayOrder INTEGER').run();
      console.log('Success Added displayOrder to database.sqlite: categories');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add displayOrder:', e.message);
      }
    }
    
    // Add isActive to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN isActive INTEGER DEFAULT 0').run();
      console.log('Success Added isActive to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add isActive:', e.message);
      }
    }
    
    // Add textColor to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN textColor TEXT').run();
      console.log('Success Added textColor to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add textColor:', e.message);
      }
    }
    
    // Add backgroundColor to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN backgroundColor TEXT').run();
      console.log('Success Added backgroundColor to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add backgroundColor:', e.message);
      }
    }
    
    // Add fontSize to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN fontSize TEXT').run();
      console.log('Success Added fontSize to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add fontSize:', e.message);
      }
    }
    
    // Add fontWeight to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN fontWeight TEXT').run();
      console.log('Success Added fontWeight to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add fontWeight:', e.message);
      }
    }
    
    // Add textDecoration to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN textDecoration TEXT').run();
      console.log('Success Added textDecoration to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add textDecoration:', e.message);
      }
    }
    
    // Add fontStyle to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN fontStyle TEXT').run();
      console.log('Success Added fontStyle to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add fontStyle:', e.message);
      }
    }
    
    // Add animationSpeed to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN animationSpeed TEXT').run();
      console.log('Success Added animationSpeed to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add animationSpeed:', e.message);
      }
    }
    
    // Add textBorderWidth to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN textBorderWidth INTEGER').run();
      console.log('Success Added textBorderWidth to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add textBorderWidth:', e.message);
      }
    }
    
    // Add textBorderStyle to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN textBorderStyle TEXT').run();
      console.log('Success Added textBorderStyle to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add textBorderStyle:', e.message);
      }
    }
    
    // Add textBorderColor to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN textBorderColor TEXT').run();
      console.log('Success Added textBorderColor to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add textBorderColor:', e.message);
      }
    }
    
    // Add bannerBorderWidth to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN bannerBorderWidth INTEGER').run();
      console.log('Success Added bannerBorderWidth to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add bannerBorderWidth:', e.message);
      }
    }
    
    // Add bannerBorderStyle to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN bannerBorderStyle TEXT').run();
      console.log('Success Added bannerBorderStyle to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add bannerBorderStyle:', e.message);
      }
    }
    
    // Add bannerBorderColor to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN bannerBorderColor TEXT').run();
      console.log('Success Added bannerBorderColor to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add bannerBorderColor:', e.message);
      }
    }
    
    // Add createdAt to database.sqlite: announcements
    try {
      db.prepare('ALTER TABLE database.sqlite: announcements ADD COLUMN createdAt INTEGER').run();
      console.log('Success Added createdAt to database.sqlite: announcements');
    } catch (e) {
      if (!e.message.includes('duplicate column')) {
        console.log('Error Failed to add createdAt:', e.message);
      }
    }
    
    console.log('Success Database fixes completed');
    db.close();
    return true;
    
  } catch (error) {
    console.log('Error Fix failed:', error.message);
    db.close();
    return false;
  }
}

fixDatabase();
