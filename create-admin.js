const { DatabaseStorage } = require('./server/storage');
const bcrypt = require('bcrypt');

async function createAdminUser() {
  try {
    const storage = new DatabaseStorage();
    
    // Check if admin user already exists
    const existingAdmin = await storage.getAdminByEmail('admin@example.com');
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }
    
    // Create a new admin user
    const password = 'pickntrust2025';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAdmin = await storage.createAdmin({
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: hashedPassword
    });
    
    console.log('Admin user created successfully:', newAdmin);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
