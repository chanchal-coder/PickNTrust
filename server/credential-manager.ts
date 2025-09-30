/**
 * Credential Manager - Secure storage and encryption for affiliate network credentials
 * Handles encryption/decryption of sensitive login information for auto-scraping
 */

import crypto from 'crypto';
import Database from 'better-sqlite3';
import path from 'path';

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

// Get encryption key from environment or generate one
function getEncryptionKey(): Buffer {
  const envKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (envKey) {
    return Buffer.from(envKey, 'hex');
  }
  
  // Generate a new key if none exists (for development)
  const newKey = crypto.randomBytes(KEY_LENGTH);
  console.warn('Warning  No CREDENTIAL_ENCRYPTION_KEY found. Generated temporary key:', newKey.toString('hex'));
  console.warn('Warning  Add this to your .env file: CREDENTIAL_ENCRYPTION_KEY=' + newKey.toString('hex'));
  return newKey;
}

interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

interface NetworkCredentials {
  id?: number;
  network: string;
  email: string;
  password: string;
  apiKey?: string;
  isActive: boolean;
  lastUsed?: string;
  createdAt?: string;
  updatedAt?: string;
}

class CredentialManager {
  private db: Database.Database;
  private encryptionKey: Buffer;

  constructor() {
    this.db = new Database(path.join(process.cwd(), 'database.sqlite'));
    this.encryptionKey = getEncryptionKey();
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Create credentials table if it doesn't exist
    this.db.exec(`
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

    // Create index for faster lookups
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_network_credentials_network 
      ON network_credentials(network)
    `);

    console.log('Success Credential storage database initialized');
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: '' // Not used in CBC mode
    };
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedData: EncryptedData): string {
    try {
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error Decryption failed:', error);
      throw new Error('Failed to decrypt credential data');
    }
  }

  /**
   * Store network credentials securely
   */
  async storeCredentials(credentials: Omit<NetworkCredentials, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const emailEncrypted = this.encrypt(credentials.email);
      const passwordEncrypted = this.encrypt(credentials.password);
      const apiKeyEncrypted = credentials.apiKey ? this.encrypt(credentials.apiKey) : null;

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO network_credentials 
        (network, email_encrypted, password_encrypted, api_key_encrypted, is_active, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      const result = stmt.run(
        credentials.network,
        JSON.stringify(emailEncrypted),
        JSON.stringify(passwordEncrypted),
        apiKeyEncrypted ? JSON.stringify(apiKeyEncrypted) : null,
        credentials.isActive ? 1 : 0
      );

      console.log(`Success Stored credentials for ${credentials.network}`);
      return result.changes > 0;
    } catch (error) {
      console.error(`Error Failed to store credentials for ${credentials.network}:`, error);
      return false;
    }
  }

  /**
   * Retrieve and decrypt network credentials
   */
  async getCredentials(network: string): Promise<NetworkCredentials | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM network_credentials 
        WHERE network = ? AND is_active = 1
      `);
      
      const row = stmt.get(network) as any;
      if (!row) {
        return null;
      }

      // Decrypt sensitive data
      const emailData = JSON.parse(row.email_encrypted);
      const passwordData = JSON.parse(row.password_encrypted);
      const apiKeyData = row.api_key_encrypted ? JSON.parse(row.api_key_encrypted) : null;

      return {
        id: row.id,
        network: row.network,
        email: this.decrypt(emailData),
        password: this.decrypt(passwordData),
        apiKey: apiKeyData ? this.decrypt(apiKeyData) : undefined,
        isActive: Boolean(row.is_active),
        lastUsed: row.last_used,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error(`Error Failed to retrieve credentials for ${network}:`, error);
      return null;
    }
  }

  /**
   * Get all available networks (without sensitive data)
   */
  async getAvailableNetworks(): Promise<Array<{network: string, isActive: boolean, lastUsed?: string}>> {
    try {
      const stmt = this.db.prepare(`
        SELECT network, is_active, last_used 
        FROM network_credentials 
        ORDER BY network
      `);
      
      const rows = stmt.all() as any[];
      return rows.map(row => ({
        network: row.network,
        isActive: Boolean(row.is_active),
        lastUsed: row.last_used
      }));
    } catch (error) {
      console.error('Error Failed to get available networks:', error);
      return [];
    }
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(network: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        UPDATE network_credentials 
        SET last_used = CURRENT_TIMESTAMP 
        WHERE network = ?
      `);
      
      stmt.run(network);
    } catch (error) {
      console.error(`Error Failed to update last used for ${network}:`, error);
    }
  }

  /**
   * Delete network credentials
   */
  async deleteCredentials(network: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM network_credentials 
        WHERE network = ?
      `);
      
      const result = stmt.run(network);
      console.log(`Success Deleted credentials for ${network}`);
      return result.changes > 0;
    } catch (error) {
      console.error(`Error Failed to delete credentials for ${network}:`, error);
      return false;
    }
  }

  /**
   * Test credential validity (without exposing sensitive data)
   */
  async testCredentials(network: string): Promise<{valid: boolean, error?: string}> {
    try {
      const credentials = await this.getCredentials(network);
      if (!credentials) {
        return {valid: false, error: 'Credentials not found'};
      }

      // Basic validation
      if (!credentials.email || !credentials.password) {
        return {valid: false, error: 'Missing email or password'};
      }

      if (!credentials.email.includes('@')) {
        return {valid: false, error: 'Invalid email format'};
      }

      return {valid: true};
    } catch (error) {
      return {valid: false, error: 'Decryption or validation failed'};
    }
  }

  /**
   * Initialize with provided credentials
   */
  async initializeWithCredentials(): Promise<void> {
    console.log('🔐 Initializing secure credential storage...');
    
    // Store the provided credentials securely
    const networks = [
      {
        network: 'cuelinks',
        email: 'sharmachanchalcvp@gmail.com',
        password: 'cuelinks0pnt',
        isActive: true
      },
      {
        network: 'inrdeals',
        email: 'sharmachanchalcvp@gmail.com',
        password: 'inrdeals0pnt',
        isActive: true
      },
      {
        network: 'earnkaro',
        email: 'contact@pickntrust.com',
        password: 'earnkaro0pnt',
        isActive: true
      }
    ];

    for (const network of networks) {
      await this.storeCredentials(network);
    }

    console.log('Success All network credentials stored securely');
  }

  /**
   * Get credential statistics
   */
  async getStats(): Promise<{total: number, active: number, networks: string[]}> {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(is_active) as active,
          GROUP_CONCAT(network) as networks
        FROM network_credentials
      `);
      
      const row = stmt.get() as any;
      return {
        total: row.total || 0,
        active: row.active || 0,
        networks: row.networks ? row.networks.split(',') : []
      };
    } catch (error) {
      console.error('Error Failed to get credential stats:', error);
      return {total: 0, active: 0, networks: []};
    }
  }
}

// Export singleton instance
const credentialManager = new CredentialManager();
export default credentialManager;
export { CredentialManager };
export type { NetworkCredentials };