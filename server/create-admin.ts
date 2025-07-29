// Script to create the admin user with enhanced security
import { db } from './db';
import { adminUsers } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function createAdminUser() {
  try {
    console.log('Creating admin user with enhanced security...');
    
    // Hash the current password with 12 rounds
    const passwordHash = await bcrypt.hash('pickntrust2025', 12);
    
    // Try to insert the admin user (will fail if already exists due to unique constraint)
    try {
      const [admin] = await db
        .insert(adminUsers)
        .values({
          username: 'admin',
          email: 'sharmachanchalcvp@gmail.com',
          phone: '9898892198',
          passwordHash,
          isActive: true,
        })
        .returning();
      
      console.log('✅ Admin user created successfully:', {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        phone: admin.phone,
      });
    } catch (insertError: any) {
      if (insertError.code === '23505') { // Unique constraint violation
        console.log('ℹ️ Admin user already exists, updating password...');
        
        // Update existing admin user
        await db
          .update(adminUsers)
          .set({ 
            passwordHash,
            phone: '9898892198' // Add phone if missing
          })
          .where(eq(adminUsers.email, 'sharmachanchalcvp@gmail.com'));
        
        console.log('✅ Admin user updated successfully');
      } else {
        throw insertError;
      }
    }
    
    console.log('🔐 Admin authentication system ready!');
    console.log('📧 Email: sharmachanchalcvp@gmail.com');
    console.log('📱 Phone: 9898892198');
    console.log('🔑 Password: pickntrust2025 (can be changed via admin panel)');
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    process.exit(1);
  }
}

// Run if called directly (ES module)
createAdminUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  });

export { createAdminUser };