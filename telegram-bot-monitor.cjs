
const { exec } = require('child_process');
const fs = require('fs');

class TelegramBotMonitor {
  constructor() {
    this.checkInterval = 30000; // 30 seconds
    this.isMonitoring = false;
  }

  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('Search Starting Telegram bot monitoring...');
    
    this.monitorLoop();
  }

  async monitorLoop() {
    while (this.isMonitoring) {
      try {
        await this.checkBotHealth();
        await this.checkForConflicts();
        await this.verifyAutoPosting();
      } catch (error) {
        console.error('Error Monitor error:', error.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, this.checkInterval));
    }
  }

  async checkBotHealth() {
    // Check if bots are responding
    const healthCheck = await this.makeApiCall('http://localhost:5000/api/bot-health');
    
    if (!healthCheck.success) {
      console.log('Warning Bot health check failed - attempting recovery');
      await this.triggerBotRestart();
    }
  }

  async checkForConflicts() {
    // Monitor for 409 errors in logs
    const logFile = './server.log';
    
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf8');
      const recentLogs = logs.split('\n').slice(-100).join('\n');
      
      if (recentLogs.includes('409') || recentLogs.includes('Conflict')) {
        console.log('Alert Bot conflict detected in logs - resolving...');
        await this.resolveConflict();
      }
    }
  }

  async verifyAutoPosting() {
    // Check if new products are being added
    const productCount = await this.getProductCount();
    
    if (this.lastProductCount && productCount === this.lastProductCount) {
      // No new products for extended period - check bot status
      const timeSinceLastProduct = Date.now() - (this.lastProductTime || 0);
      
      if (timeSinceLastProduct > 300000) { // 5 minutes
        console.log('Warning No new products detected - checking bot connectivity');
        await this.checkBotConnectivity();
      }
    }
    
    this.lastProductCount = productCount;
    this.lastProductTime = Date.now();
  }

  async makeApiCall(url) {
    return new Promise((resolve) => {
      exec(`curl -s ${url}`, (error, stdout) => {
        if (error) {
          resolve({ success: false, error: error.message });
        } else {
          try {
            resolve({ success: true, data: JSON.parse(stdout) });
          } catch {
            resolve({ success: false, error: 'Invalid JSON response' });
          }
        }
      });
    });
  }

  async getProductCount() {
    const result = await this.makeApiCall('http://localhost:5000/api/products/page/click-picks');
    return result.success ? (result.data.length || 0) : 0;
  }

  async triggerBotRestart() {
    console.log('Refresh Triggering bot restart...');
    await this.makeApiCall('http://localhost:5000/api/bot-restart');
  }

  async resolveConflict() {
    console.log('🔧 Resolving bot conflict...');
    await this.makeApiCall('http://localhost:5000/api/bot-resolve-conflict');
  }

  async checkBotConnectivity() {
    console.log('Search Checking bot connectivity...');
    const result = await this.makeApiCall('http://localhost:5000/api/bot-connectivity-test');
    
    if (!result.success) {
      console.log('Error Bot connectivity failed - triggering restart');
      await this.triggerBotRestart();
    }
  }

  stop() {
    this.isMonitoring = false;
    console.log('Stop Stopped bot monitoring');
  }
}

// Start monitoring if run directly
if (require.main === module) {
  const monitor = new TelegramBotMonitor();
  monitor.start();
  
  process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
  });
}

module.exports = { TelegramBotMonitor };
