# EMERGENCY BOT FIX

## Issue
Telegram bots are not processing messages from channels.
Admin API works but bots don't listen to Telegram messages.

## Root Cause
Enhanced Telegram Manager may not be properly initializing individual bot message listeners.

## Fix
Add individual bot initialization as backup:

```typescript
// EMERGENCY FIX: Add this to server/index.ts after Enhanced Manager initialization

// Initialize individual bots as backup for message processing
try {
  console.log('🚨 EMERGENCY: Initializing individual bots for message processing...');
  
  // Import and initialize Prime Picks bot directly
  const { initializePrimePicksBot } = await import('./prime-picks-bot');
  await initializePrimePicksBot();
  console.log('✅ Prime Picks bot initialized for message processing');
  
  // Add other bots as needed
  console.log('🎯 Individual bot message processing is now ACTIVE!');
  
} catch (error) {
  console.error('❌ Emergency bot initialization failed:', error.message);
  console.log('⚠️  Relying on Enhanced Manager only');
}
```

## Test
1. Apply the fix to server/index.ts
2. Restart server
3. Post Amazon URL in Prime Picks Telegram channel
4. Check if product appears on website
