const { sqliteDb } = require('./server/db');

async function removeFakeServices() {
  try {
    console.log('🗑️ Removing all fake/sample services from products table...');
    
    // List of fake service names to remove
    const fakeServices = [
      'Enterprise Consulting',
      'Website Design Package', 
      'Cloud Storage Pro',
      'Premium SEO Tools',
      'Free Website Analysis',
      'aaa' // This also appears to be a test service
    ];
    
    for (const serviceName of fakeServices) {
      const result = sqliteDb.prepare('DELETE FROM products WHERE name = ? AND is_service = 1').run(serviceName);
      if (result.changes > 0) {
        console.log(`Success Deleted fake service: ${serviceName}`);
      }
    }
    
    console.log('Celebration All fake services removed!');
    
    // Show remaining real services
    const realServices = sqliteDb.prepare('SELECT id, name, is_service FROM products WHERE is_service = 1').all();
    console.log('\n📋 REMAINING REAL SERVICES:');
    if (realServices.length === 0) {
      console.log('Error No services found! Your real service might not be marked properly.');
    } else {
      realServices.forEach(p => {
        console.log(`- ${p.name} (ID: ${p.id}, Service: YES)`);
      });
    }
    
  } catch (error) {
    console.error('Error Error:', error);
  }
}

removeFakeServices();