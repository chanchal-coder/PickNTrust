const { sqliteDb } = require('./server/db');
const { detectService } = require('./server/utils/service-detector');

async function updateExistingServices() {
  try {
    console.log('Refresh Updating existing services in database...');
    
    // Get all products that are marked as services (is_service = 1)
    const existingServices = sqliteDb.prepare('SELECT id, name, description, category FROM products WHERE is_service = 1').all();
    
    console.log(`📋 Found ${existingServices.length} existing services to update:`);
    
    let updatedCount = 0;
    
    for (const service of existingServices) {
      console.log(`\nSearch Processing: ${service.name} (ID: ${service.id})`);
      console.log(`   Current category: ${service.category}`);
      
      // Apply service detection to determine if it should be categorized as "service"
      const serviceDetection = detectService(service.name, service.description || '');
      
      if (serviceDetection.isService || service.category !== 'service') {
        // Update to service category
        const updateStmt = sqliteDb.prepare('UPDATE products SET category = ? WHERE id = ?');
        const result = updateStmt.run('service', service.id);
        
        if (result.changes > 0) {
          console.log(`   Success Updated to category: "service"`);
          updatedCount++;
        } else {
          console.log(`   Error Failed to update`);
        }
      } else {
        console.log(`   ⏭️  Already has service category`);
      }
    }
    
    console.log(`\nCelebration Updated ${updatedCount} services to have category="service"`);
    
    // Show final results
    const finalServices = sqliteDb.prepare('SELECT id, name, category, is_service FROM products WHERE is_service = 1').all();
    console.log('\n📋 FINAL SERVICES LIST:');
    finalServices.forEach(s => {
      console.log(`- ${s.name} (ID: ${s.id}, Category: ${s.category}, IsService: ${s.is_service})`);
    });
    
  } catch (error) {
    console.error('Error Error updating existing services:', error);
  }
}

updateExistingServices();