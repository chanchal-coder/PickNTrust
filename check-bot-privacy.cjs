const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

console.log('🔍 CHECKING BOT PRIVACY SETTINGS');
console.log('=================================');

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;
const CUE_PICKS_CHANNEL = '-1002982344997';
const PRIME_PICKS_CHANNEL = '-1002955338551';

if (!BOT_TOKEN) {
    console.error('❌ MASTER_BOT_TOKEN not found');
    process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN);

async function checkBotPrivacySettings() {
    try {
        console.log('\n🤖 Getting bot information...');
        const botInfo = await bot.getMe();
        console.log('✅ Bot Info:');
        console.log(`   ID: ${botInfo.id}`);
        console.log(`   Username: ${botInfo.username}`);
        console.log(`   Name: ${botInfo.first_name}`);
        console.log(`   Can join groups: ${botInfo.can_join_groups}`);
        console.log(`   Can read all group messages: ${botInfo.can_read_all_group_messages}`);
        console.log(`   Supports inline queries: ${botInfo.supports_inline_queries}`);
        
        console.log('\n📺 Checking channel memberships...');
        
        // Check Prime Picks channel
        try {
            const primePicksMember = await bot.getChatMember(PRIME_PICKS_CHANNEL, botInfo.id);
            console.log('✅ Prime Picks Channel Status:');
            console.log(`   Status: ${primePicksMember.status}`);
            console.log(`   Can post messages: ${primePicksMember.can_post_messages || 'N/A'}`);
            console.log(`   Can edit messages: ${primePicksMember.can_edit_messages || 'N/A'}`);
            console.log(`   Can delete messages: ${primePicksMember.can_delete_messages || 'N/A'}`);
        } catch (error) {
            console.log('❌ Prime Picks Channel:', error.message);
        }
        
        // Check Cue Picks channel
        try {
            const cuePicksMember = await bot.getChatMember(CUE_PICKS_CHANNEL, botInfo.id);
            console.log('✅ Cue Picks Channel Status:');
            console.log(`   Status: ${cuePicksMember.status}`);
            console.log(`   Can post messages: ${cuePicksMember.can_post_messages || 'N/A'}`);
            console.log(`   Can edit messages: ${cuePicksMember.can_edit_messages || 'N/A'}`);
            console.log(`   Can delete messages: ${cuePicksMember.can_delete_messages || 'N/A'}`);
        } catch (error) {
            console.log('❌ Cue Picks Channel:', error.message);
        }
        
        console.log('\n🔄 Testing getUpdates directly...');
        try {
            const updates = await bot.getUpdates({ limit: 5 });
            console.log(`✅ Retrieved ${updates.length} recent updates`);
            
            if (updates.length > 0) {
                console.log('\n📋 Recent Updates:');
                updates.forEach((update, index) => {
                    console.log(`\n   Update ${index + 1}:`);
                    console.log(`   Update ID: ${update.update_id}`);
                    
                    if (update.message) {
                        console.log(`   Type: message`);
                        console.log(`   Chat ID: ${update.message.chat.id}`);
                        console.log(`   Chat Type: ${update.message.chat.type}`);
                        console.log(`   Text: ${(update.message.text || update.message.caption || 'No text').substring(0, 50)}...`);
                    } else if (update.channel_post) {
                        console.log(`   Type: channel_post`);
                        console.log(`   Chat ID: ${update.channel_post.chat.id}`);
                        console.log(`   Chat Type: ${update.channel_post.chat.type}`);
                        console.log(`   Text: ${(update.channel_post.text || update.channel_post.caption || 'No text').substring(0, 50)}...`);
                    } else if (update.edited_channel_post) {
                        console.log(`   Type: edited_channel_post`);
                        console.log(`   Chat ID: ${update.edited_channel_post.chat.id}`);
                        console.log(`   Chat Type: ${update.edited_channel_post.chat.type}`);
                    } else {
                        console.log(`   Type: ${Object.keys(update).filter(k => k !== 'update_id').join(', ')}`);
                    }
                });
            } else {
                console.log('   No recent updates found');
            }
        } catch (error) {
            console.log('❌ getUpdates failed:', error.message);
        }
        
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('===================');
        console.log('1. Check if bot privacy is set to "Disabled" in @BotFather');
        console.log('2. Ensure bot has admin rights in both channels');
        console.log('3. Verify bot can read all group messages (should be enabled)');
        console.log('4. Try using webhooks instead of polling if issues persist');
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
    }
    
    process.exit(0);
}

checkBotPrivacySettings();