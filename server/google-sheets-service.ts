import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

interface SheetRow {
  [key: string]: string | number | boolean;
}

interface ProductInbox {
  product_url: string;
  title: string;
  category: string;
  image_url: string;
  description?: string;
  tags?: string;
  processing_status: string;
  updated_at: string;
}

interface CommissionRule {
  merchant_pattern: string;
  category_pattern: string;
  affiliate_program: string;
  commission_rate: string;
  cookie_days: number;
  priority: number;
  active: boolean;
  direct_affiliate: boolean;
  template_url: string;
  notes?: string;
  updated_at: string;
}

class GoogleSheetsService {
  private auth: JWT | null = null;
  private sheets: any = null;
  private spreadsheetId: string;

  constructor(spreadsheetId: string) {
    this.spreadsheetId = spreadsheetId;
  }

  async initialize() {
    try {
      // Load service account credentials
      const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH || './google-credentials.json';
      
      if (!fs.existsSync(credentialsPath)) {
        throw new Error(`Google Sheets credentials file not found at: ${credentialsPath}`);
      }

      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      
      this.auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      await this.auth.authorize();
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      console.log('✅ Google Sheets API initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets API:', error);
      return false;
    }
  }

  // Read products from url_inbox sheet (input queue)
  async getInboxProducts(): Promise<ProductInbox[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'url_inbox!A2:Z1000', // Skip header row
      });

      const rows = response.data.values || [];
      const products: ProductInbox[] = [];

      for (const row of rows) {
        if (row[0]) { // Only process rows with URL
          products.push({
            product_url: row[0] || '', // Column A: url
            title: row[1] || '', // Column B: title (if provided)
            category: row[2] || 'general', // Column C: category
            image_url: row[3] || '', // Column D: image_url
            description: row[4] || '', // Column E: description
            tags: row[5] || '', // Column F: tags
            processing_status: row[6] || 'pending', // Column G: status
            updated_at: new Date().toISOString()
          });
        }
      }

      console.log(`📥 Retrieved ${products.length} products from url_inbox`);
      return products;
    } catch (error) {
      console.error('❌ Error reading url_inbox sheet:', error);
      return [];
    }
  }

  // Read commission rules from commissions_config sheet (decision rules)
  async getCommissionRules(): Promise<CommissionRule[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'commissions_config!A2:Z1000', // Skip header row
      });

      const rows = response.data.values || [];
      const rules: CommissionRule[] = [];

      for (const row of rows) {
        if (row[0]) { // Has network
          rules.push({
            merchant_pattern: row[1] || '*', // Column B: merchant_glob
            category_pattern: row[2] || '*', // Column C: category_glob
            affiliate_program: row[0] || '', // Column A: network
            commission_rate: (row[3] || '0') + '%', // Column D: rate_value
            cookie_days: parseInt(row[4]) || 30, // Column E: cookie_days
            priority: parseInt(row[5]) || 1, // Column F: priority
            active: row[6] !== 'FALSE' && row[6] !== 'false', // Column G: active
            direct_affiliate: row[7] === 'TRUE' || row[7] === 'true', // Column H: direct_affiliate
            template_url: row[8] || '', // Column I: template_url
            notes: row[9] || '', // Column J: notes
            updated_at: row[10] || new Date().toISOString() // Column K: updated_at
          });
        }
      }

      console.log(`📋 Retrieved ${rules.length} commission rules from commissions_config`);
      return rules;
    } catch (error) {
      console.error('❌ Error reading commission rules:', error);
      return [];
    }
  }

  // Update product processing status
  async updateProductStatus(rowIndex: number, status: string, affiliateLink?: string) {
    try {
      const updates = [
        {
          range: `Inbox!G${rowIndex + 2}`, // +2 because we skip header and arrays are 0-indexed
          values: [[status]]
        },
        {
          range: `Inbox!H${rowIndex + 2}`,
          values: [[new Date().toISOString()]]
        }
      ];

      if (affiliateLink) {
        updates.push({
          range: `Inbox!I${rowIndex + 2}`, // Add affiliate link in column I
          values: [[affiliateLink]]
        });
      }

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          data: updates,
          valueInputOption: 'RAW'
        }
      });

      console.log(`✅ Updated product status to: ${status}`);
    } catch (error) {
      console.error('❌ Error updating product status:', error);
    }
  }

  // Read link building templates from link_rules sheet
  async getLinkRules(): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'link_rules!A2:Z1000', // Skip header row
      });

      const rows = response.data.values || [];
      const linkRules: any[] = [];

      for (const row of rows) {
        if (row[0]) { // Has network
          linkRules.push({
            network: row[0] || '', // Column A: network (key)
            strategy: row[1] || 'direct', // Column B: strategy/template
            base_url: row[2] || '', // Column C: base_url/template_url
            affiliate_id: row[3] || '', // Column D: affiliate_id/tag/subid
            template_url: row[4] || '', // Column E: template_url
            allowlist_domains: row[5] || '', // Column F: allowlist_domains
            extra_params: row[6] || '', // Column G: extra_params (utm/subid)
            active: row[7] !== 'FALSE' && row[7] !== 'false', // Column H: active
            notes: row[8] || '', // Column I: notes
            updated_at: row[9] || new Date().toISOString() // Column J: updated_at
          });
        }
      }

      console.log(`🔗 Retrieved ${linkRules.length} link building rules`);
      return linkRules;
    } catch (error) {
      console.error('❌ Error reading link rules:', error);
      return [];
    }
  }

  // Read Lemon Squeezy specific mappings from ls_affiliates sheet
  async getLemonSqueezyAffiliates(): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'ls_affiliates!A2:Z1000', // Skip header row
      });

      const rows = response.data.values || [];
      const lsAffiliates: any[] = [];

      for (const row of rows) {
        if (row[0]) { // Has product_glob or store_glob
          lsAffiliates.push({
            product_glob: row[0] || '', // Column A: product_glob/store_glob
            store_glob: row[1] || '', // Column B: store_glob (alternative)
            affiliate_id: row[2] || '', // Column C: affiliate_id
            checkout_url: row[3] || '', // Column D: checkout_url
            rate_value_override: parseFloat(row[4]) || null, // Column E: rate_value_override
            active: row[5] !== 'FALSE' && row[5] !== 'false', // Column F: active
            notes: row[6] || '', // Column G: notes
            updated_at: row[7] || new Date().toISOString() // Column H: updated_at
          });
        }
      }

      console.log(`🍋 Retrieved ${lsAffiliates.length} Lemon Squeezy affiliate mappings`);
      return lsAffiliates;
    } catch (error) {
      console.error('❌ Error reading Lemon Squeezy affiliates:', error);
      return [];
    }
  }

  // Read global settings from meta sheet
  async getMetaSettings(): Promise<Record<string, string>> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'meta!A2:B1000', // Key-Value pairs
      });

      const rows = response.data.values || [];
      const settings: Record<string, string> = {};

      for (const row of rows) {
        if (row[0] && row[1]) { // Has key and value
          settings[row[0]] = row[1];
        }
      }

      console.log(`⚙️ Retrieved ${Object.keys(settings).length} meta settings`);
      return settings;
    } catch (error) {
      console.error('❌ Error reading meta settings:', error);
      return {};
    }
  }

  // Write processed products to products_live sheet (output)
  async writeProductsLive(products: any[]): Promise<void> {
    try {
      if (products.length === 0) {
        console.log('📤 No products to write to products_live');
        return;
      }

      // Prepare data rows
      const rows = products.map(product => [
        product.original_url || '', // Column A: original_url
        product.affiliate_url || '', // Column B: affiliate_url
        product.merchant_domain || '', // Column C: merchant_domain
        product.category_norm || '', // Column D: category_norm
        product.best_network?.network || '', // Column E: network
        product.best_network?.rate_value || '', // Column F: rate_value
        product.best_network?.cookie_days || '', // Column G: cookie_days
        product.best_network?.priority || '', // Column H: priority
        product.title || '', // Column I: title
        product.description || '', // Column J: description
        product.image_url || '', // Column K: image_url
        product.posted_at || new Date().toISOString(), // Column L: posted_at
        product.expires_at || '', // Column M: expires_at
        product.status || 'live', // Column N: status
        product.tags || '', // Column O: tags
        new Date().toISOString() // Column P: updated_at
      ]);

      // Clear existing data and write new data
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: 'products_live!A2:Z1000'
      });

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'products_live!A2',
        valueInputOption: 'RAW',
        requestBody: {
          values: rows
        }
      });

      console.log(`📤 Wrote ${products.length} products to products_live sheet`);
    } catch (error) {
      console.error('❌ Error writing to products_live sheet:', error);
    }
  }

  // Update processing status in url_inbox sheet
  async updateInboxStatus(productUrl: string, status: string): Promise<void> {
    try {
      // This would require finding the row and updating it
      // For now, we'll just log it
      console.log(`📝 Status update: ${productUrl} → ${status}`);
    } catch (error) {
      console.error('❌ Error updating inbox status:', error);
    }
  }



  // Log analytics data
  async logAnalytics(productId: string, clicks: number, conversions: number, revenue: number) {
    try {
      const timestamp = new Date().toISOString();
      const data = [
        [timestamp, productId, clicks, conversions, revenue]
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Analytics!A:E',
        valueInputOption: 'RAW',
        requestBody: {
          values: data
        }
      });

      console.log(`📊 Logged analytics for product ${productId}`);
    } catch (error) {
      console.error('❌ Error logging analytics:', error);
    }
  }

  // Create sample sheets structure
  async createSampleSheets() {
    try {
      // Create Inbox sheet headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Inbox!A1:I1',
        valueInputOption: 'RAW',
        resource: {
          values: [[
            'product_url',
            'title', 
            'category',
            'image_url',
            'description',
            'tags',
            'processing_status',
            'updated_at',
            'affiliate_link'
          ]]
        }
      });

      // Create Commissions sheet headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Commissions!A1:K1',
        valueInputOption: 'RAW',
        resource: {
          values: [[
            'merchant_pattern',
            'category_pattern',
            'affiliate_program',
            'commission_rate',
            'cookie_days',
            'priority',
            'active',
            'direct_affiliate',
            'template_url',
            'notes',
            'updated_at'
          ]]
        }
      });

      // Create Analytics sheet headers
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Analytics!A1:E1',
        valueInputOption: 'RAW',
        resource: {
          values: [[
            'product_id',
            'clicks',
            'conversions',
            'revenue',
            'last_updated'
          ]]
        }
      });

      console.log('✅ Sample sheet structure created');
    } catch (error) {
      console.error('❌ Error creating sample sheets:', error);
    }
  }
}

export default GoogleSheetsService;
export { ProductInbox, CommissionRule };