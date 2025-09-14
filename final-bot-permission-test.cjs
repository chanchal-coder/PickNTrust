const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('Search FINAL BOT PERMISSION DIAGNOSTIC');
console.log('=' .repeat(60));
console.log('Target Purpose: Diagnose exact bot permission status');
console.log('Stats This will show exactly what\'s preventing autoposting');
console.log('=' .repeat(60));

async function diagnoseBotPermissions() {
  console.log('\nAI Testing Prime Picks Bot Permissions...');
  
  const botToken = process.env.PRIME_PICKS_BOT_TOKEN;
  const channelId = process.env.PRIME_PICKS_CHANNEL_ID;
  
  if (!botToken) {
    console.log('Error PRIME_PICKS_BOT_TOKEN not found in environment');
    return;
  }
  
  if (!channelId) {
    console.log('Error PRIME_PICKS_CHANNEL_ID not found in environment');
    return;
  }
  
  console.log(`Success Bot Token: ${botToken.substring(0, 15)}...`);
  console.log(`Success Channel ID: ${channelId}`);
  
  try {
    // Test 1: Bot connection
    console.log('\nSearch Test 1: Bot Connection');
    const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botInfo = await botInfoResponse.json();
    
    if (botInfo.ok) {
      console.log('Success Bot connected successfully');
      console.log(`   Username: @${botInfo.result.username}`);
      console.log(`   Name: ${botInfo.result.first_name}`);
      console.log(`   Can join groups: ${botInfo.result.can_join_groups}`);
      console.log(`   Can read all group messages: ${botInfo.result.can_read_all_group_messages}`);
    } else {
      console.log('Error Bot connection failed:', botInfo.description);
      return;
    }
    
    // Test 2: Channel access
    console.log('\nSearch Test 2: Channel Access');
    try {
      const chatResponse = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(channelId)}`);
      const chatInfo = await chatResponse.json();
      
      if (chatInfo.ok) {
        console.log('Success Bot can access channel information');
        console.log(`   Channel title: ${chatInfo.result.title}`);
        console.log(`   Channel type: ${chatInfo.result.type}`);
        console.log(`   Channel username: @${chatInfo.result.username || 'private'}`);
      } else {
        console.log('Error Bot cannot access channel:', chatInfo.description);
        if (chatInfo.error_code === 403) {
          console.log('   🔧 This means bot is not added to the channel or lacks permissions');
        }
      }
    } catch (error) {
      console.log('Error Channel access test failed:', error.message);
    }
    
    // Test 3: Bot admin status in channel
    console.log('\nSearch Test 3: Bot Admin Status');
    try {
      const adminResponse = await fetch(`https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(channelId)}&user_id=${botInfo.result.id}`);
      const adminInfo = await adminResponse.json();
      
      if (adminInfo.ok) {
        console.log('Success Bot admin status retrieved');
        console.log(`   Status: ${adminInfo.result.status}`);
        
        if (adminInfo.result.status === 'administrator') {
          console.log('Success Bot is an administrator');
          const permissions = adminInfo.result;
          console.log(`   Can post messages: ${permissions.can_post_messages || 'N/A'}`);
          console.log(`   Can edit messages: ${permissions.can_edit_messages || 'N/A'}`);
          console.log(`   Can delete messages: ${permissions.can_delete_messages || 'N/A'}`);
          console.log(`   Can manage chat: ${permissions.can_manage_chat || 'N/A'}`);
        } else {
          console.log(`Error Bot is not an administrator (status: ${adminInfo.result.status})`);
        }
      } else {
        console.log('Error Cannot get bot admin status:', adminInfo.description);
        if (adminInfo.error_code === 400) {
          console.log('   🔧 Bot might not be in the channel');
        }
      }
    } catch (error) {
      console.log('Error Admin status test failed:', error.message);
    }
    
    // Test 4: Recent messages
    console.log('\nSearch Test 4: Recent Messages');
    try {
      const updatesResponse = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=5`);
      const updates = await updatesResponse.json();
      
      if (updates.ok) {
        console.log(`Success Bot can get updates: ${updates.result.length} recent updates`);
        
        if (updates.result.length > 0) {
          console.log('   Recent activity:');
          updates.result.forEach((update, i) => {
            if (update.channel_post) {
              console.log(`   ${i + 1}. Channel post from ${update.channel_post.chat.title}`);
            } else if (update.message) {
              console.log(`   ${i + 1}. Message from ${update.message.chat.title || update.message.chat.first_name}`);
            } else {
              console.log(`   ${i + 1}. Other update type`);
            }
          });
        } else {
          console.log('   Warning No recent updates - bot might not be receiving messages');
        }
      } else {
        console.log('Error Cannot get updates:', updates.description);
      }
    } catch (error) {
      console.log('Error Updates test failed:', error.message);
    }
    
  } catch (error) {
    console.log('Error Diagnostic failed:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('Target DIAGNOSIS SUMMARY');
  console.log('=' .repeat(60));
  
  console.log('\n🔧 MOST LIKELY ISSUES:');
  console.log('1. Bot not added to @pntprimepicks channel as administrator');
  console.log('2. Bot added but without "Read Messages" permission');
  console.log('3. Channel ID format incorrect (@pntprimepicks vs -100123456789)');
  console.log('4. Bot token belongs to different bot than expected');
  
  console.log('\nSuccess IMMEDIATE SOLUTIONS:');
  console.log('1. Go to @pntprimepicks channel in Telegram');
  console.log('2. Tap channel name → Manage Channel → Administrators');
  console.log('3. Add @pntearnkaro_bot as administrator');
  console.log('4. Enable "Read Messages" and "Send Messages" permissions');
  console.log('5. Save and test by posting another Amazon URL');
  
  console.log('\n🧪 VERIFICATION:');
  console.log('After fixing permissions, you should see in server logs:');
  console.log('• "Mobile Prime Picks Bot received message from https://t.me/pntprimepicks"');
  console.log('• "Refresh Processing prime-picks message..."');
  console.log('• "Success Product saved with ID: X"');
  
  console.log('\n🏁 Diagnostic completed at:', new Date().toLocaleString());
}

// Run the diagnostic
diagnoseBotPermissions().catch(error => {
  console.error('💥 Diagnostic crashed:', error);
  process.exit(1);
});