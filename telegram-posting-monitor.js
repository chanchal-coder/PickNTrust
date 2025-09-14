
// Telegram Posting Monitor
// Continuously monitors posting health

const { performHealthCheck } = require('./telegram-posting-fixes.js');

const startMonitoring = () => {
  console.log('🔍 Starting Telegram posting monitor...');
  
  // Check health every 5 minutes
  setInterval(async () => {
    const isHealthy = await performHealthCheck();
    
    if (!isHealthy) {
      console.log('⚠️ System unhealthy - check logs!');
      // Could trigger alerts, restart services, etc.
    }
  }, 5 * 60 * 1000);
};

// Start monitoring if this file is run directly
if (require.main === module) {
  startMonitoring();
}

module.exports = { startMonitoring };
