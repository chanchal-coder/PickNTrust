const { DatabaseStorage } = require('./server/storage.ts');
const storage = new DatabaseStorage();

async function testAdminAccess() {
  try {
    console.log('Testing admin access...');
    
    // Try to get an admin user
    const admin = await storage.getAdminByEmail('admin@example.com');
    console.log('Admin user:', admin);
    
    // Try to get all admin users
    console.log('Getting all admin users...');
    // This would require a new method in storage.ts
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAdminAccess();
