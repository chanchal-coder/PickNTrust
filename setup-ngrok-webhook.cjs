const TelegramBot = require('node-telegram-bot-api');
const { spawn } = require('child_process');
const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('❌ MASTER_BOT_TOKEN not found in environment variables');
    process.exit(1);
}

let ngrokProcess = null;
let publicUrl = null;

function cleanup() {
    if (ngrokProcess) {
        console.log('🧹 Cleaning up ngrok process...');
        ngrokProcess.kill();
    }
}

async function createNgrokTunnel() {
    console.log('🌐 Creating ngrok tunnel to localhost:5000...');
    
    return new Promise((resolve, reject) => {
        // Start ngrok tunnel
        ngrokProcess = spawn('ngrok', ['http', '5000', '--log=stdout'], {
            stdio: 'pipe',
            shell: true
        });
        
        let output = '';
        
        ngrokProcess.stdout.on('data', (data) => {
            output += data.toString();
            console.log('Ngrok output:', data.toString());
            
            // Look for the HTTPS URL
            const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.ngrok-free\.app/);
            if (urlMatch && !publicUrl) {
                publicUrl = urlMatch[0];
                console.log(`✅ Ngrok tunnel created: ${publicUrl}`);
                resolve(publicUrl);
            }
        });
        
        ngrokProcess.stderr.on('data', (data) => {
            const error = data.toString();
            console.log('Ngrok stderr:', error);
            
            // Also check stderr for URL
            const urlMatch = error.match(/https:\/\/[a-z0-9-]+\.ngrok-free\.app/);
            if (urlMatch && !publicUrl) {
                publicUrl = urlMatch[0];
                console.log(`✅ Ngrok tunnel created: ${publicUrl}`);
                resolve(publicUrl);
            }
        });
        
        ngrokProcess.on('error', (error) => {
            console.error('❌ Failed to start ngrok:', error.message);
            console.log('💡 Make sure ngrok is installed: https://ngrok.com/download');
            reject(error);
        });
        
        // Timeout after 30 seconds
        setTimeout(() => {
            if (!publicUrl) {
                reject(new Error('Ngrok tunnel creation timed out'));
            }
        }, 30000);
    });
}

async function testWebhookEndpoint(baseUrl) {
    console.log('🧪 Testing webhook endpoint...');
    
    try {
        const testUrl = `${baseUrl}/webhook/master/${BOT_TOKEN}`;
        const response = await axios.get(testUrl, { timeout: 5000 });
        console.log('✅ Webhook endpoint is accessible');
        return true;
    } catch (error) {
        console.log('❌ Webhook endpoint not accessible:', error.message);
        return false;
    }
}

async function setupWebhookWithNgrok() {
    console.log('🚀 Setting up master bot webhook with ngrok...');
    
    try {
        // Create ngrok tunnel
        const baseUrl = await createNgrokTunnel();
        
        // Wait for tunnel to stabilize
        console.log('⏳ Waiting for tunnel to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Test webhook endpoint
        const isAccessible = await testWebhookEndpoint(baseUrl);
        if (!isAccessible) {
            throw new Error('Webhook endpoint not accessible');
        }
        
        // Set up webhook
        const bot = new TelegramBot(BOT_TOKEN, { polling: false });
        
        // Clear existing webhook
        console.log('🧹 Clearing existing webhook...');
        await bot.deleteWebHook();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Set new webhook
        const webhookUrl = `${baseUrl}/webhook/master/${BOT_TOKEN}`;
        console.log(`🔗 Setting webhook to: ${webhookUrl}`);
        
        await bot.setWebHook(webhookUrl, {
            allowed_updates: ['message', 'channel_post', 'edited_channel_post']
        });
        
        console.log('✅ Webhook set successfully');
        
        // Verify webhook
        await new Promise(resolve => setTimeout(resolve, 2000));
        const webhookInfo = await bot.getWebHookInfo();
        
        console.log('📊 Webhook verification:');
        console.log('   URL:', webhookInfo.url);
        console.log('   Pending updates:', webhookInfo.pending_update_count);
        console.log('   Allowed updates:', webhookInfo.allowed_updates);
        
        if (webhookInfo.url === webhookUrl) {
            console.log('✅ Webhook verified successfully!');
            console.log('🚀 Master bot is now ready to receive channel messages');
            console.log('📱 Monitored channels:');
            console.log('   • Prime Picks: -1002955338551');
            console.log('   • Cue Links: -1002982344997');
            console.log('   • Value Picks: -1003017626269');
            console.log('   • Click Picks: -1002981205504');
            console.log('   • Global Picks: -1002902496654');
            console.log('   • Travel Picks: -1003047967930');
            console.log('   • Deals Hub: -1003029983162');
            console.log('   • Loot Box: -1002991047787');
            
            console.log('\n⚠️  IMPORTANT: Keep this terminal open to maintain the tunnel!');
            console.log('   Press Ctrl+C to stop the webhook system');
            
            // Keep the process running
            process.on('SIGINT', () => {
                console.log('\n\n🛑 Shutting down webhook system...');
                cleanup();
                process.exit(0);
            });
            
            // Keep alive and show status
            setInterval(() => {
                console.log(`💓 Webhook system running... (${new Date().toLocaleTimeString()})`);
            }, 60000); // Every minute
            
            // Keep process alive
            await new Promise(() => {}); // Never resolves
            
        } else {
            console.log('⚠️ Webhook verification failed');
            console.log(`   Expected: ${webhookUrl}`);
            console.log(`   Got: ${webhookInfo.url}`);
            cleanup();
        }
        
    } catch (error) {
        console.error('❌ Error setting up webhook:', error.message);
        
        if (error.message.includes('ngrok')) {
            console.log('💡 Install ngrok:');
            console.log('   1. Download from: https://ngrok.com/download');
            console.log('   2. Extract and add to PATH');
            console.log('   3. Sign up for free account at ngrok.com');
            console.log('   4. Run: ngrok config add-authtoken YOUR_TOKEN');
        }
        
        cleanup();
    }
}

setupWebhookWithNgrok();