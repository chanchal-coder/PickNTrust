import { DatabaseStorage } from './server/storage.ts';
import bcrypt from 'bcrypt';

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    const storage = new DatabaseStorage();
    
    // Check if admin already exists
    try {
      const existingAdmin = await storage.getAdminByEmail('admin@example.com');
      if (existingAdmin) {
        console.log('Admin user already exists:', existingAdmin.email);
        return;
      }
    } catch (error) {
      console.log('No admin user found, creating new one...');
    }
    
    // Create admin user
    const password = 'pickntrust2025';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const adminData = {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      createdAt: new Date(),
      isActive: true
    };
    
    const newAdmin = await storage.createAdmin(adminData);
    console.log('Admin user created successfully:', newAdmin);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
