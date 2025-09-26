const TelegramBot = require('node-telegram-bot-api');
const { spawn } = require('child_process');
require('dotenv').config();

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('❌ MASTER_BOT_TOKEN not found in environment variables');
    process.exit(1);
}

let tunnelProcess = null;

async function createTunnel() {
    console.log('🌐 Creating public tunnel to localhost:5000...');
    
    return new Promise((resolve, reject) => {
        tunnelProcess = spawn('npx', ['localtunnel', '--port', '5000'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        });
        
        let publicUrl = '';
        
        tunnelProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('Tunnel output:', output);
            
            if (output.includes('your url is:')) {
                publicUrl = output.split('your url is: ')[1].trim();
                console.log(`✅ Tunnel created: ${publicUrl}`);
                resolve(publicUrl);
            }
        });
        
        tunnelProcess.stderr.on('data', (data) => {
            const output = data.toString();
            console.log('Tunnel stderr:', output);
            
            if (output.includes('your url is:')) {
                publicUrl = output.split('your url is: ')[1].trim();
                console.log(`✅ Tunnel created: ${publicUrl}`);
                resolve(publicUrl);
            }
        });
        
        tunnelProcess.on('error', (error) => {
            console.log('❌ Tunnel creation failed:', error.message);
            reject(error);
        });
        
        // Timeout after 30 seconds
        setTimeout(() => {
            reject(new Error('Tunnel creation timeout'));
        }, 30000);
    });
}

async function setupWebhookWithTunnel() {
    console.log('🚀 Setting up master bot webhook with tunnel...');
    
    try {
        // Create tunnel first
        const baseUrl = await createTunnel();
        
        // Wait for tunnel to stabilize
        console.log('⏳ Waiting for tunnel to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
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
            console.log('📱 Send a test message to any monitored channel');
            console.log('⚠️  Keep this terminal open to maintain the tunnel!');
            
            // Keep the process alive
            process.on('SIGINT', async () => {
                console.log('\\n🛑 Shutting down...');
                try {
                    await bot.deleteWebHook();
                    console.log('🧹 Webhook cleared');
                } catch (error) {
                    console.log('⚠️ Error clearing webhook:', error.message);
                }
                
                if (tunnelProcess) {
                    tunnelProcess.kill();
                    console.log('🧹 Tunnel process terminated');
                }
                
                process.exit(0);
            });
            
            // Keep alive
            setInterval(() => {
                console.log(`💓 Webhook system running... (${new Date().toLocaleTimeString()})`);
            }, 60000);
            
        } else {
            console.log('⚠️ Webhook verification failed');
            console.log(`   Expected: ${webhookUrl}`);
            console.log(`   Got: ${webhookInfo.url}`);
        }
        
    } catch (error) {
        console.error('❌ Error setting up webhook:', error.message);
        
        if (tunnelProcess) {
            tunnelProcess.kill();
        }
    }
}

setupWebhookWithTunnel();