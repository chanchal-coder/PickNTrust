// Bot Lock Manager - Prevents 409 Polling Conflicts
// Ensures only one bot instance per token can poll at a time

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const access = promisify(fs.access);

interface BotLock {
  botName: string;
  token: string;
  pid: number;
  timestamp: number;
  hostname: string;
}

class BotLockManager {
  private lockDir: string;
  private locks = new Map<string, BotLock>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.lockDir = path.join(process.cwd(), '.bot-locks');
    this.ensureLockDir();
    this.startCleanupProcess();
    this.setupProcessHandlers();
  }

  private ensureLockDir(): void {
    if (!fs.existsSync(this.lockDir)) {
      fs.mkdirSync(this.lockDir, { recursive: true });
    }
  }

  private getLockFilePath(botName: string): string {
    return path.join(this.lockDir, `${botName}.lock`);
  }

  private isProcessRunning(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return false;
    }
  }

  async acquireLock(botName: string, token: string): Promise<boolean> {
    const lockFile = this.getLockFilePath(botName);
    
    try {
      // Check if lock file exists
      await access(lockFile);
      
      // Read existing lock
      const lockData = await readFile(lockFile, 'utf8');
      const existingLock: BotLock = JSON.parse(lockData);
      
      // Check if the process is still running
      if (this.isProcessRunning(existingLock.pid)) {
        console.log(`❌ Bot lock exists for ${botName} (PID: ${existingLock.pid})`);
        return false;
      } else {
        console.log(`🧹 Cleaning stale lock for ${botName} (PID: ${existingLock.pid})`);
        await this.releaseLock(botName);
      }
    } catch (error) {
      // Lock file doesn't exist, we can proceed
    }

    // Create new lock
    const lock: BotLock = {
      botName,
      token: token.substring(0, 20) + '...', // Don't store full token
      pid: process.pid,
      timestamp: Date.now(),
      hostname: (await import('os')).hostname()
    };

    try {
      await writeFile(lockFile, JSON.stringify(lock, null, 2));
      this.locks.set(botName, lock);
      console.log(`✅ Acquired bot lock for ${botName} (PID: ${process.pid})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to acquire lock for ${botName}:`, error);
      return false;
    }
  }

  async releaseLock(botName: string): Promise<void> {
    const lockFile = this.getLockFilePath(botName);
    
    try {
      await unlink(lockFile);
      this.locks.delete(botName);
      console.log(`🔓 Released bot lock for ${botName}`);
    } catch (error) {
      // Lock file might not exist, which is fine
      console.log(`ℹ️ Lock file for ${botName} already removed`);
    }
  }

  async releaseAllLocks(): Promise<void> {
    const lockNames = Array.from(this.locks.keys());
    for (const botName of lockNames) {
      await this.releaseLock(botName);
    }
  }

  private startCleanupProcess(): void {
    // Clean up stale locks every 30 seconds
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupStaleLocks();
    }, 30000);
  }

  private async cleanupStaleLocks(): Promise<void> {
    try {
      const files = fs.readdirSync(this.lockDir);
      
      for (const file of files) {
        if (!file.endsWith('.lock')) continue;
        
        const lockFile = path.join(this.lockDir, file);
        try {
          const lockData = await readFile(lockFile, 'utf8');
          const lock: BotLock = JSON.parse(lockData);
          
          // Check if process is still running
          if (!this.isProcessRunning(lock.pid)) {
            console.log(`🧹 Cleaning stale lock: ${file} (PID: ${lock.pid})`);
            await unlink(lockFile);
          }
          
          // Also check for very old locks (> 1 hour)
          const age = Date.now() - lock.timestamp;
          if (age > 60 * 60 * 1000) {
            console.log(`🧹 Cleaning old lock: ${file} (age: ${Math.round(age / 60000)}min)`);
            await unlink(lockFile);
          }
        } catch (error) {
          // Invalid lock file, remove it
          console.log(`🧹 Removing invalid lock file: ${file}`);
          await unlink(lockFile);
        }
      }
    } catch (error) {
      // Lock directory might not exist or be accessible
    }
  }

  private setupProcessHandlers(): void {
    const cleanup = async () => {
      console.log('🔄 Bot Lock Manager: Cleaning up on process exit...');
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      await this.releaseAllLocks();
    };

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught exception, cleaning up locks:', error);
      await cleanup();
      process.exit(1);
    });
  }

  getLockStatus(): { [botName: string]: BotLock } {
    const status: { [botName: string]: BotLock } = {};
    this.locks.forEach((lock, botName) => {
      status[botName] = { ...lock };
    });
    return status;
  }
}

// Singleton instance
export const botLockManager = new BotLockManager();
export default botLockManager;