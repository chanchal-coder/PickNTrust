console.log('🔐 VERIFYING EXACT BOT CREDENTIALS AGAINST PROVIDED DATA\n');

const fs = require('fs');
const path = require('path');

// Exact credentials provided by user
const expectedCredentials = {
  'prime-picks': {
    envFile: '.env.prime-picks',
    token: '8260140807:AAEy6I9xxtYbvddJKDNfRwmcIWDX1Y9pck4',
    botUsername: '@pntamazon_bot',
    channelId: '-1002955338551',
    channelName: 'pntamazon',
    affiliateTag: '{{URL}}{{SEP}}tag=pickntrust03-21',
    affiliateNetwork: 'amazon'
  },
  'cue-picks': {
    envFile: '.env.cue-picks',
    token: '8352384812:AAE-bwA_3zIB8ZnPG4ZmyEbREBlfijjE32I',
    botUsername: '@cuelinkspnt_bot',
    channelId: '-1002982344997',
    channelName: 'cuelinkspnt',
    affiliateTag: 'https://linksredirect.com/?cid=243942&source=linkkit&url=%7B%7BURL_ENC%7D%7D',
    affiliateNetwork: 'cuelinks'
  },
  'value-picks': {
    envFile: '.env.value-picks',
    token: '8293858742:AAGDnH8aN5e-JOvhLQNCR_rWEOicOPji41A',
    botUsername: '@earnkaropnt_bot',
    channelId: '-1003017626269',
    channelName: 'valuepicksek',
    affiliateTag: 'https://ekaro.in/enkr2020/?url=%7B%7BURL_ENC%7D%7D&ref=4530348',
    affiliateNetwork: 'earnkaro'
  },
  'click-picks': {
    envFile: '.env.click-picks',
    token: '8077836519:AAGoSql-Fz9lF_90AKxobprROub89VVKePg',
    botUsername: '@clickpicks_bot',
    channelId: '-1002981205504',
    channelName: 'clickpicks',
    affiliateNetwork: 'multiple'
  },
  'global-picks': {
    envFile: '.env.global-picks',
    token: '8341930611:AAHq7sS4Sk6HKoyfUGYwYWHwXZrGOgeWx-E',
    botUsername: '@globalpnt_bot',
    channelId: '-1002902496654',
    channelName: 'globalpicks',
    affiliateNetwork: 'multiple'
  },
  'travel-picks': {
    envFile: '.env.travel-picks',
    token: '7998139680:AAGVKECApmHNi4LMp2wR3UdVFfYgkT1HwZo',
    botUsername: '@travelpicks_bot',
    channelId: '-1003047967930',
    channelName: 'travelpicks',
    affiliateNetwork: 'multiple'
  },
  'dealshub': {
    envFile: '.env.deals-hub',
    token: '8292764619:AAEkfPXIsgNh1JC3n2p6VYo27V-EHepzmBo',
    botUsername: '@dealshubpnt_bot',
    channelId: '-1003029983162',
    channelName: 'dealshubpnt',
    affiliateTag: 'id=sha678089037',
    affiliateNetwork: 'inrdeals'
  },
  'lootbox': {
    envFile: '.env.loot-box',
    token: '8141266952:AAEosdwI8BkIpSk0f1AVzn8l4iwRnS8HXFQ',
    botUsername: '@deodappnt_bot',
    channelId: '-1002991047787',
    channelName: 'Deodap pnt',
    affiliateTag: '{{URL}}{{SEP}}ref=sicvppak',
    affiliateNetwork: 'deodap'
  }
};

let allCorrect = true;
let needsUpdate = [];

Object.keys(expectedCredentials).forEach(botName => {
  const expected = expectedCredentials[botName];
  const envPath = path.join(process.cwd(), expected.envFile);
  
  console.log(`\n🤖 CHECKING ${botName.toUpperCase()}:`);
  console.log('=' .repeat(50));
  
  if (!fs.existsSync(envPath)) {
    console.log(`❌ ENV FILE: ${expected.envFile} NOT FOUND`);
    needsUpdate.push(botName);
    allCorrect = false;
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Extract current values
  const currentToken = envContent.match(/TELEGRAM_BOT_TOKEN=(.+)/);
  const currentChannelId = envContent.match(/CHANNEL_ID=(.+)/);
  const currentChannelName = envContent.match(/CHANNEL_NAME=(.+)/);
  const currentBotUsername = envContent.match(/BOT_USERNAME=(.+)/);
  const currentAffiliateNetwork = envContent.match(/AFFILIATE_NETWORK=(.+)/);
  
  console.log(`📁 ENV FILE: ${expected.envFile}`);
  
  // Check token
  const tokenMatch = currentToken && currentToken[1] === expected.token;
  console.log(`   Token: ${tokenMatch ? '✅ CORRECT' : '❌ MISMATCH'}`);
  if (!tokenMatch) {
    console.log(`      Expected: ${expected.token}`);
    console.log(`      Current:  ${currentToken ? currentToken[1] : 'MISSING'}`);
  }
  
  // Check channel ID
  const channelIdMatch = currentChannelId && currentChannelId[1] === expected.channelId;
  console.log(`   Channel ID: ${channelIdMatch ? '✅ CORRECT' : '❌ MISMATCH'}`);
  if (!channelIdMatch) {
    console.log(`      Expected: ${expected.channelId}`);
    console.log(`      Current:  ${currentChannelId ? currentChannelId[1] : 'MISSING'}`);
  }
  
  // Check channel name
  const channelNameMatch = currentChannelName && currentChannelName[1] === expected.channelName;
  console.log(`   Channel Name: ${channelNameMatch ? '✅ CORRECT' : '❌ MISMATCH'}`);
  if (!channelNameMatch) {
    console.log(`      Expected: ${expected.channelName}`);
    console.log(`      Current:  ${currentChannelName ? currentChannelName[1] : 'MISSING'}`);
  }
  
  // Check bot username
  const botUsernameMatch = currentBotUsername && currentBotUsername[1] === expected.botUsername;
  console.log(`   Bot Username: ${botUsernameMatch ? '✅ CORRECT' : '❌ MISMATCH'}`);
  if (!botUsernameMatch) {
    console.log(`      Expected: ${expected.botUsername}`);
    console.log(`      Current:  ${currentBotUsername ? currentBotUsername[1] : 'MISSING'}`);
  }
  
  // Check affiliate network
  const affiliateNetworkMatch = currentAffiliateNetwork && currentAffiliateNetwork[1] === expected.affiliateNetwork;
  console.log(`   Affiliate Network: ${affiliateNetworkMatch ? '✅ CORRECT' : '❌ MISMATCH'}`);
  if (!affiliateNetworkMatch) {
    console.log(`      Expected: ${expected.affiliateNetwork}`);
    console.log(`      Current:  ${currentAffiliateNetwork ? currentAffiliateNetwork[1] : 'MISSING'}`);
  }
  
  const botCorrect = tokenMatch && channelIdMatch && channelNameMatch && botUsernameMatch && affiliateNetworkMatch;
  console.log(`\n🎯 STATUS: ${botCorrect ? '✅ ALL CORRECT' : '❌ NEEDS UPDATE'}`);
  
  if (!botCorrect) {
    needsUpdate.push(botName);
    allCorrect = false;
  }
});

console.log('\n' + '=' .repeat(80));
console.log('📋 FINAL VERIFICATION SUMMARY:');
console.log('=' .repeat(80));

if (allCorrect) {
  console.log('🎉 ALL BOT CREDENTIALS ARE EXACTLY CORRECT!');
  console.log('✅ All tokens match provided credentials');
  console.log('✅ All channel IDs match provided credentials');
  console.log('✅ All channel names match provided credentials');
  console.log('✅ All bot usernames match provided credentials');
  console.log('✅ All affiliate networks match provided credentials');
} else {
  console.log('⚠️  CREDENTIAL MISMATCHES FOUND!');
  console.log(`\n❌ Bots needing updates: ${needsUpdate.join(', ')}`);
  console.log('\n🔧 REQUIRED ACTIONS:');
  console.log('1. Update .env files with exact provided credentials');
  console.log('2. Ensure all sensitive data is in .gitignore');
  console.log('3. Restart server after credential updates');
}

console.log('\n🔒 SECURITY CHECK:');
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const hasEnvFiles = gitignoreContent.includes('.env');
  console.log(`   .gitignore exists: ✅ YES`);
  console.log(`   .env files protected: ${hasEnvFiles ? '✅ YES' : '❌ NO - ADD .env* TO .gitignore'}`);
} else {
  console.log(`   .gitignore exists: ❌ NO - CREATE .gitignore FILE`);
}