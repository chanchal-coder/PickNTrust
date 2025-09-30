const { sqliteDb } = require('./server/db');

async function updateServiceCapitalization() {
  try {
    console.log('Refresh Updating service category capitalization for professional look...');
    
    // Update all services from "service" to "Service"
    const updateStmt = sqliteDb.prepare('UPDATE products SET category = ? WHERE category = ?');
    const result = updateStmt.run('Service', 'service');
    
    console.log(`Success Updated ${result.changes} services from "service" to "Service"`);
    
    // Show updated services
    const services = sqliteDb.prepare('SELECT id, name, category, is_service FROM products WHERE category = ? OR is_service = 1').all('Service');
    console.log('\n📋 UPDATED SERVICES:');
    services.forEach(s => {
      console.log(`- ${s.name} (ID: ${s.id}, Category: ${s.category}, IsService: ${s.is_service})`);
    });
    
  } catch (error) {
    console.error('Error Error updating service capitalization:', error);
  }
}

updateServiceCapitalization();