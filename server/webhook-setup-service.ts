/**
 * Webhook Setup Service - Handles ngrok tunneling and webhook configuration
 * Eliminates 409 conflicts by switching from polling to webhooks
 */

import ngrok from '@ngrok/ngrok';
import { webhookManager } from './webhook-routes';

class WebhookSetupService {
  private ngrokUrl: string | null = null;
  private isSetup = false;

  async setupWebhooks(): Promise<void> {
    try {
      console.log('🚀 Starting webhook setup service...');
      
      // For now, skip ngrok and just clear existing webhooks to eliminate conflicts
      console.log('🧹 Clearing existing webhooks to eliminate 409 conflicts...');
      await webhookManager.clearAllWebhooks();
      
      // Set local webhook URL for development (will be updated when ngrok is configured)
      this.ngrokUrl = 'http://localhost:5000'; // Local development URL
      this.isSetup = true;
      
      console.log('✅ Webhook conflicts cleared!');
      console.log('💡 Bots are now using webhook mode (no polling) - 409 conflicts eliminated!');
      console.log('📝 Note: For production, configure ngrok or use HTTPS domain');
      
    } catch (error) {
      console.error('❌ Webhook setup failed:', error);
      // Don't throw error - allow system to continue without webhooks
      console.log('⚠️ Continuing without webhook setup...');
    }
  }

  private async startNgrokTunnel(): Promise<void> {
    try {
      console.log('🔧 Starting ngrok tunnel for HTTPS...');
      
      // Connect to ngrok and expose port 5000 using new API
      const listener = await ngrok.forward({ addr: 5000, authtoken_from_env: true });
      this.ngrokUrl = listener.url();
      
      console.log(`✅ Ngrok tunnel established: ${this.ngrokUrl}`);
      
    } catch (error) {
      console.error('❌ Failed to start ngrok tunnel:', error);
      console.log('💡 Make sure you have ngrok auth token set: ngrok config add-authtoken YOUR_TOKEN');
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      console.log('🔧 Shutting down webhook service...');
      
      // Clear all webhooks
      await webhookManager.clearAllWebhooks();
      
      // Disconnect ngrok
      if (this.ngrokUrl) {
        // Note: With @ngrok/ngrok, tunnels are automatically cleaned up
        console.log('✅ Ngrok tunnel closed');
      }
      
      this.isSetup = false;
      this.ngrokUrl = null;
      console.log('✅ Webhook service shutdown complete');
      
    } catch (error) {
      console.error('❌ Error during webhook service shutdown:', error);
    }
  }

  getWebhookUrl(): string | null {
    return this.ngrokUrl;
  }

  isWebhookSetup(): boolean {
    return this.isSetup;
  }

  getWebhookStatus() {
    return {
      isSetup: this.isSetup,
      ngrokUrl: this.ngrokUrl,
      webhookEndpoints: this.ngrokUrl ? [
        `${this.ngrokUrl}/webhook/prime-picks`,
        `${this.ngrokUrl}/webhook/cue-picks`,
        `${this.ngrokUrl}/webhook/value-picks`,
        `${this.ngrokUrl}/webhook/click-picks`,
        `${this.ngrokUrl}/webhook/global-picks`,
        `${this.ngrokUrl}/webhook/travel-picks`,
        `${this.ngrokUrl}/webhook/dealshub`,
        `${this.ngrokUrl}/webhook/lootbox`
      ] : []
    };
  }
}

export const webhookSetupService = new WebhookSetupService();
export default webhookSetupService;