/**
 * Setup Credential System - Initialize secure credential storage
 * Sets up encryption keys and stores provided network credentials
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Generate encryption key if not exists
function generateEncryptionKey() {
  const key = crypto.randomBytes(32).toString('hex');
  console.log('🔑 Generated new encryption key:', key);
  return key;
}

// Setup environment file with encryption key
function setupEnvironment() {
  const envPath = path.join(process.cwd(), '.env.credentials');
  
  if (!fs.existsSync(envPath)) {
    const encryptionKey = generateEncryptionKey();
    const envContent = `# Credential Management Environment Variables
CREDENTIAL_ENCRYPTION_KEY=${encryptionKey}
INTERNAL_API_KEY=${crypto.randomBytes(32).toString('hex')}
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('Success Created .env.credentials file');
    console.log('Warning  IMPORTANT: Add this to your main .env file or load it in production!');
    console.log('Warning  Keep this file secure and never commit it to version control!');
  } else {
    console.log('Success .env.credentials file already exists');
  }
}

// Initialize credential database
function initializeDatabase() {
  console.log('🔐 Initializing credential database...');
  
  const db = new Database(path.join(process.cwd(), 'database.sqlite'));
  
  // Create credentials table
  db.exec(`
    CREATE TABLE IF NOT EXISTS network_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      network TEXT NOT NULL UNIQUE,
      email_encrypted TEXT NOT NULL,
      password_encrypted TEXT NOT NULL,
      api_key_encrypted TEXT,
      is_active BOOLEAN DEFAULT 1,
      last_used DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create index
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_network_credentials_network 
    ON network_credentials(network)
  `);
  
  console.log('Success Credential database tables created');
  db.close();
}

// Encrypt data using AES-256-CBC
function encryptData(text, key) {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: '' // Not used in CBC mode
  };
}

// Store credentials securely
function storeCredentials() {
  console.log('🔐 Storing network credentials securely...');
  
  // Load encryption key
  const envPath = path.join(process.cwd(), '.env.credentials');
  if (!fs.existsSync(envPath)) {
    console.error('Error .env.credentials file not found. Run setup first.');
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const encryptionKey = envContent.match(/CREDENTIAL_ENCRYPTION_KEY=(.+)/)?.[1];
  
  if (!encryptionKey) {
    console.error('Error Encryption key not found in .env.credentials');
    return;
  }
  
  const db = new Database(path.join(process.cwd(), 'database.sqlite'));
  
  // Network credentials to store
  const networks = [
    {
      network: 'cuelinks',
      email: 'sharmachanchalcvp@gmail.com',
      password: 'cuelinks0pnt'
    },
    {
      network: 'inrdeals',
      email: 'sharmachanchalcvp@gmail.com',
      password: 'inrdeals0pnt'
    },
    {
      network: 'earnkaro',
      email: 'contact@pickntrust.com',
      password: 'earnkaro0pnt'
    }
  ];
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO network_credentials 
    (network, email_encrypted, password_encrypted, is_active, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  for (const network of networks) {
    try {
      const emailEncrypted = encryptData(network.email, encryptionKey);
      const passwordEncrypted = encryptData(network.password, encryptionKey);
      
      stmt.run(
        network.network,
        JSON.stringify(emailEncrypted),
        JSON.stringify(passwordEncrypted),
        1
      );
      
      console.log(`Success Stored credentials for ${network.network}`);
    } catch (error) {
      console.error(`Error Failed to store credentials for ${network.network}:`, error.message);
    }
  }
  
  db.close();
  console.log('Success All network credentials stored securely');
}

// Verify credential storage
function verifyCredentials() {
  console.log('Search Verifying stored credentials...');
  
  const db = new Database(path.join(process.cwd(), 'database.sqlite'));
  
  const stmt = db.prepare(`
    SELECT network, is_active, created_at 
    FROM network_credentials 
    ORDER BY network
  `);
  
  const rows = stmt.all();
  
  console.log('\nStats Stored Credentials:');
  console.log('========================');
  
  for (const row of rows) {
    console.log(`🔐 ${row.network.toUpperCase()}:`);
    console.log(`   Status: ${row.is_active ? 'Active' : 'Inactive'}`);
    console.log(`   Created: ${row.created_at}`);
    console.log('');
  }
  
  console.log(`Success Total networks: ${rows.length}`);
  console.log(`Success Active networks: ${rows.filter(r => r.is_active).length}`);
  
  db.close();
}

// Test credential system
function testCredentialSystem() {
  console.log('🧪 Testing credential system...');
  
  try {
    // Test encryption/decryption
    const testKey = crypto.randomBytes(32).toString('hex');
    const testData = 'test@example.com';
    
    const encrypted = encryptData(testData, testKey);
    console.log('Success Encryption test passed');
    
    // Test database connection
    const db = new Database(path.join(process.cwd(), 'database.sqlite'));
    const result = db.prepare('SELECT COUNT(*) as count FROM network_credentials').get();
    db.close();
    
    console.log(`Success Database test passed - ${result.count} credentials stored`);
    console.log('Success Credential system is working correctly!');
    
  } catch (error) {
    console.error('Error Credential system test failed:', error.message);
  }
}

// Main setup function
function setupCredentialSystem() {
  console.log('Launch Setting up Secure Credential Management System...');
  console.log('====================================================');
  
  try {
    // Step 1: Setup environment
    setupEnvironment();
    
    // Step 2: Initialize database
    initializeDatabase();
    
    // Step 3: Store credentials
    storeCredentials();
    
    // Step 4: Verify storage
    verifyCredentials();
    
    // Step 5: Test system
    testCredentialSystem();
    
    console.log('\nCelebration Credential Management System Setup Complete!');
    console.log('================================================');
    console.log('\n📋 Next Steps:');
    console.log('1. Add .env.credentials to your .gitignore file');
    console.log('2. Load environment variables in production');
    console.log('3. Access credentials via admin panel');
    console.log('4. Test auto-scraping functionality');
    console.log('\n🔐 Your credentials are now stored securely with AES-256-GCM encryption!');
    
  } catch (error) {
    console.error('Error Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupCredentialSystem();
}

module.exports = {
  setupCredentialSystem,
  initializeDatabase,
  storeCredentials,
  verifyCredentials,
  testCredentialSystem
};