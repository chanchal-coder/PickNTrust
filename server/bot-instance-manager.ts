
// Bot Instance Manager - Prevents multiple bot conflicts
class BotInstanceManager {
  private activeBots: Map<string, any>;
  private botLocks: Map<string, any>;
  private recoveryAttempts: Map<string, number>;
  private maxRecoveryAttempts: number;

  constructor() {
    this.activeBots = new Map();
    this.botLocks = new Map();
    this.recoveryAttempts = new Map();
    this.maxRecoveryAttempts = 3;
  }

  async acquireBotLock(botName: string, botToken: string): Promise<boolean> {
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

  releaseBotLock(botName: string, botToken: string): void {
    const lockKey = `${botName}_${botToken.slice(-10)}`;
    this.botLocks.delete(lockKey);
    console.log(`🔓 Released lock for bot ${botName}`);
  }

  async handleBotConflict(botName: string, error: any): Promise<boolean> {
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

  resetRecoveryAttempts(botName: string): void {
    this.recoveryAttempts.delete(botName);
    console.log(`Success Reset recovery attempts for ${botName}`);
  }
}

export { BotInstanceManager };
