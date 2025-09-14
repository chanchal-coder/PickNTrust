const { sqliteDb } = require('./server/db');

async function removeFakeServicesSafe() {
  try {
    console.log('🗑️ Removing fake services (IDs 6-10) while keeping your real services...');
    
    // Disable foreign key constraints temporarily
    sqliteDb.pragma('foreign_keys = OFF');
    
    // Remove fake services by ID (the ones created on 19/8/2025)
    const fakeServiceIds = [6, 7, 8, 9, 10];
    
    for (const serviceId of fakeServiceIds) {
      const result = sqliteDb.prepare('DELETE FROM products WHERE id = ?').run(serviceId);
      if (result.changes > 0) {
        console.log(`Success Deleted fake service ID: ${serviceId}`);
      }
    }
    
    // Re-enable foreign key constraints
    sqliteDb.pragma('foreign_keys = ON');
    
    console.log('Celebration All fake services removed!');
    
    // Show remaining real services
    const realServices = sqliteDb.prepare('SELECT id, name, description, is_service FROM products WHERE is_service = 1').all();
    console.log('\n📋 YOUR REAL SERVICES REMAINING:');
    if (realServices.length === 0) {
      console.log('Error No services found!');
    } else {
      realServices.forEach(p => {
        console.log(`- ${p.name} (ID: ${p.id}) - "${p.description}"`);
      });
    }
    
  } catch (error) {
    console.error('Error Error:', error);
    // Make sure to re-enable foreign keys even if there's an error
    try {
      sqliteDb.pragma('foreign_keys = ON');
    } catch (e) {}
  }
}

removeFakeServicesSafe();