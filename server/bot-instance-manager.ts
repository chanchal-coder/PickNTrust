
// Bot Instance Manager - Prevents multiple bot conflicts
class BotInstanceManager {
  constructor() {
    this.activeBots = new Map();
    this.botLocks = new Map();
    this.recoveryAttempts = new Map();
    this.maxRecoveryAttempts = 3;
  }

  async acquireBotLock(botName, botToken) {
    const lockKey = `${botName}_${botToken.slice(-10)}`;
    
    if (this.botLocks.has(lockKey)) {
      console.log(`Warning Bot ${botName} already has active lock`);
      return false;
    }

    this.botLocks.set(lockKey, {
      botName,
      timestamp: Date.now(),
      pid: process.pid
    });

    console.log(`🔒 Acquired lock for bot ${botName}`);
    return true;
  }

  releaseBotLock(botName, botToken) {
    const lockKey = `${botName}_${botToken.slice(-10)}`;
    this.botLocks.delete(lockKey);
    console.log(`Unlock Released lock for bot ${botName}`);
  }

  async handleBotConflict(botName, error) {
    console.log(`Alert Bot conflict detected for ${botName}: ${error.message}`);
    
    const attempts = this.recoveryAttempts.get(botName) || 0;
    
    if (attempts >= this.maxRecoveryAttempts) {
      console.log(`Error Max recovery attempts reached for ${botName}`);
      return false;
    }

    this.recoveryAttempts.set(botName, attempts + 1);
    
    // Wait with exponential backoff
    const delay = Math.pow(2, attempts) * 5000; // 5s, 10s, 20s
    console.log(`⏳ Waiting ${delay/1000}s before retry for ${botName}`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return true;
  }

  resetRecoveryAttempts(botName) {
    this.recoveryAttempts.delete(botName);
    console.log(`Success Reset recovery attempts for ${botName}`);
  }
}

module.exports = { BotInstanceManager };
