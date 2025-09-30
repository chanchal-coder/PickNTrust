const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');

// Initialize database connection
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user for production deployment...');
    
    // The password that will work with the system
    const plainPassword = 'pickntrust2025';
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);
    
    // Check if admin user already exists
    const existingAdmin = db.prepare('SELECT * FROM admin_users WHERE email = ?').get('admin@pickntrust.com');
    
    if (existingAdmin) {
      console.log('📝 Admin user exists, updating password...');
      
      // Update existing admin user
      const updateStmt = db.prepare(`
        UPDATE admin_users 
        SET password_hash = ?, is_active = 1, last_login = NULL
        WHERE email = ?
      `);
      
      updateStmt.run(passwordHash, 'admin@pickntrust.com');
      console.log('✅ Admin password updated successfully!');
    } else {
      console.log('👤 Creating new admin user...');
      
      // Create new admin user
      const insertStmt = db.prepare(`
        INSERT INTO admin_users (username, email, password_hash, is_active, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const now = Math.floor(Date.now() / 1000); // SQLite timestamp
      insertStmt.run('admin', 'admin@pickntrust.com', passwordHash, 1, now);
      console.log('✅ Admin user created successfully!');
    }
    
    // Verify the user was created/updated
    const admin = db.prepare('SELECT id, username, email, is_active FROM admin_users WHERE email = ?').get('admin@pickntrust.com');
    console.log('📋 Admin user details:', admin);
    
    // Test password verification
    const isValid = await bcrypt.compare(plainPassword, db.prepare('SELECT password_hash FROM admin_users WHERE email = ?').get('admin@pickntrust.com').password_hash);
    console.log('🔍 Password verification test:', isValid ? '✅ PASS' : '❌ FAIL');
    
    console.log('\n🎉 Admin user setup complete!');
    console.log('📧 Email: admin@pickntrust.com');
    console.log('🔑 Password: pickntrust2025');
    console.log('\n⚠️  IMPORTANT: Use these credentials to login to the admin panel');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    db.close();
  }
}

// Run the function
createAdminUser();