import fs from 'fs';
import path from 'path';

interface CanvaTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  lastUpdated: number;
}

interface CanvaTokenManagerConfig {
  clientId: string;
  clientSecret: string;
  tokenStorePath?: string; // Optional: custom path for token storage
}

export class CanvaTokenManager {
  private clientId: string;
  private clientSecret: string;
  private tokenStorePath: string;
  private baseUrl = 'https://api.canva.com/rest/v1';
  private refreshInFlight: Promise<string> | null = null;

  constructor(config: CanvaTokenManagerConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.tokenStorePath = config.tokenStorePath || path.join(process.cwd(), '.canva-tokens.json');
  }

  // Get auth headers - main method to replace your getHeaders()
  async authHeaders(): Promise<Record<string, string>> {
    const accessToken = await this.getValidAccessToken();
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  // Get a valid access token (refresh if needed)
  private async getValidAccessToken(): Promise<string> {
    const tokenData = this.loadTokenData();
    
    if (!tokenData) {
      throw new Error('No Canva tokens found. Please run initial OAuth setup.');
    }

    const now = Math.floor(Date.now() / 1000);
    
    // Use cached token if still valid (with 60s buffer)
    if (tokenData.accessToken && now < (tokenData.expiresAt - 60)) {
      return tokenData.accessToken;
    }

    // Coalesce concurrent refreshes
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this.refreshInFlight = this.refreshAccessToken(tokenData.refreshToken);
    
    try {
      return await this.refreshInFlight;
    } finally {
      this.refreshInFlight = null;
    }
  }

  // Refresh access token using refresh token
  private async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      console.log('Refresh Refreshing Canva access token...');
      
      // Basic auth header: base64(client_id:client_secret)
      const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('Error Canva token refresh failed:', responseText);
        
        // Handle specific error cases
        if (responseText.includes('invalid_grant') || responseText.includes('lineage')) {
          console.error('Alert Refresh token lineage revoked. Manual re-auth required.');
          this.markTokensInvalid();
          throw new Error('Canva refresh token revoked. Please re-authenticate.');
        }
        
        throw new Error(`Canva token refresh failed: ${response.status} ${response.statusText}`);
      }

      let tokenResponse: any;
      try {
        tokenResponse = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid Canva token response: ${responseText}`);
      }

      const { access_token, refresh_token, expires_in } = tokenResponse;
      
      if (!access_token) {
        throw new Error('No access_token in Canva response');
      }

      // Calculate expiration time
      const expiresAt = Math.floor(Date.now() / 1000) + (Number(expires_in) || 3600);

      // Save new tokens (including rotated refresh token if provided)
      const newTokenData: CanvaTokenData = {
        accessToken: access_token,
        refreshToken: refresh_token || refreshToken, // Use new refresh token if provided
        expiresAt,
        lastUpdated: Math.floor(Date.now() / 1000)
      };

      this.saveTokenData(newTokenData);
      
      console.log('Success Canva access token refreshed successfully');
      
      return access_token;
      
    } catch (error) {
      console.error('Error Error refreshing Canva token:', error);
      throw error;
    }
  }

  // Load token data from persistent storage
  private loadTokenData(): CanvaTokenData | null {
    try {
      if (!fs.existsSync(this.tokenStorePath)) {
        // Try to migrate from environment variables if available
        const envRefreshToken = process.env.CANVA_REFRESH_TOKEN;
        if (envRefreshToken) {
          console.log('Products Migrating Canva token from environment variables...');
          const tokenData: CanvaTokenData = {
            accessToken: '', // Will be refreshed immediately
            refreshToken: envRefreshToken,
            expiresAt: 0, // Force immediate refresh
            lastUpdated: Math.floor(Date.now() / 1000)
          };
          this.saveTokenData(tokenData);
          return tokenData;
        }
        return null;
      }

      const data = fs.readFileSync(this.tokenStorePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error Error loading Canva token data:', error);
      return null;
    }
  }

  // Save token data to persistent storage
  private saveTokenData(tokenData: CanvaTokenData): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.tokenStorePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write token data atomically
      const tempPath = `${this.tokenStorePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(tokenData, null, 2));
      fs.renameSync(tempPath, this.tokenStorePath);
      
      // Also update process.env for backward compatibility
      process.env.CANVA_REFRESH_TOKEN = tokenData.refreshToken;
      
      console.log('Save Canva tokens saved to persistent storage');
    } catch (error) {
      console.error('Error Error saving Canva token data:', error);
      throw error;
    }
  }

  // Mark tokens as invalid (for error recovery)
  private markTokensInvalid(): void {
    try {
      if (fs.existsSync(this.tokenStorePath)) {
        const backupPath = `${this.tokenStorePath}.invalid.${Date.now()}`;
        fs.renameSync(this.tokenStorePath, backupPath);
        console.log(`🗂️ Invalid tokens backed up to: ${backupPath}`);
      }
    } catch (error) {
      console.error('Error Error marking tokens invalid:', error);
    }
  }

  // Initialize with a fresh refresh token (for setup)
  async initializeWithRefreshToken(refreshToken: string): Promise<void> {
    console.log('Launch Initializing Canva token manager with refresh token...');
    
    const tokenData: CanvaTokenData = {
      accessToken: '', // Will be refreshed immediately
      refreshToken,
      expiresAt: 0, // Force immediate refresh
      lastUpdated: Math.floor(Date.now() / 1000)
    };

    this.saveTokenData(tokenData);
    
    // Test the refresh token by getting an access token
    try {
      await this.getValidAccessToken();
      console.log('Success Canva token manager initialized successfully');
    } catch (error) {
      console.error('Error Failed to initialize with provided refresh token:', error);
      this.markTokensInvalid();
      throw error;
    }
  }

  // Get token status for debugging
  getTokenStatus(): { hasTokens: boolean; expiresAt?: number; lastUpdated?: number } {
    const tokenData = this.loadTokenData();
    
    if (!tokenData) {
      return { hasTokens: false };
    }

    return {
      hasTokens: true,
      expiresAt: tokenData.expiresAt,
      lastUpdated: tokenData.lastUpdated
    };
  }

  // Check if re-authentication is needed
  needsReauth(): boolean {
    const tokenData = this.loadTokenData();
    return !tokenData || !tokenData.refreshToken;
  }
}
