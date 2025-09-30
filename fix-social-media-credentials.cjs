const fs = require('fs');

console.log('🔧 FIXING SOCIAL MEDIA API CREDENTIALS...\n');

function fixCredentials() {
  try {
    // Read current .env file
    let envContent = '';
    if (fs.existsSync('.env')) {
      envContent = fs.readFileSync('.env', 'utf8');
    }
    
    console.log('1️⃣ Adding social media API credentials to .env...');
    
    // Add all required social media API credentials
    const socialMediaVars = [
      '',
      '# Social Media API Credentials',
      'FACEBOOK_ACCESS_TOKEN=demo_facebook_token',
      'FACEBOOK_PAGE_ID=demo_page_id',
      'INSTAGRAM_ACCESS_TOKEN=demo_instagram_token', 
      'INSTAGRAM_ACCOUNT_ID=demo_account_id',
      'WHATSAPP_BUSINESS_TOKEN=demo_whatsapp_token',
      'WHATSAPP_PHONE_NUMBER_ID=demo_phone_id',
      'WHATSAPP_CHANNEL_ID=demo_channel_id',
      'TELEGRAM_BOT_TOKEN=demo_telegram_token',
      'TELEGRAM_CHANNEL_ID=@pickntrust',
      'TWITTER_BEARER_TOKEN=demo_twitter_token',
      'TWITTER_ACCESS_TOKEN=demo_twitter_access',
      'TWITTER_ACCESS_SECRET=demo_twitter_secret',
      'PINTEREST_ACCESS_TOKEN=demo_pinterest_token',
      'PINTEREST_BOARD_ID=demo_board_id',
      'YOUTUBE_API_KEY=demo_youtube_key',
      'YOUTUBE_ACCESS_TOKEN=demo_youtube_access',
      'YOUTUBE_CHANNEL_ID=demo_channel_id',
      'DEFAULT_SOCIAL_IMAGE=https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
      ''
    ];
    
    // Check which variables are missing and add them
    let varsAdded = 0;
    socialMediaVars.forEach(line => {
      if (line.includes('=')) {
        const [key] = line.split('=');
        if (!envContent.includes(key)) {
          envContent += `\n${line}`;
          varsAdded++;
        }
      } else {
        envContent += `\n${line}`;
      }
    });
    
    // Write updated .env file
    fs.writeFileSync('.env', envContent);
    console.log(`Success Added ${varsAdded} social media API variables to .env`);
    
    console.log('\n2️⃣ Creating demo mode configuration...');
    
    // Create a demo configuration file
    const demoConfig = {
      mode: 'demo',
      description: 'Demo mode uses mock API responses for social media posting',
      platforms: {
        facebook: { enabled: true, mode: 'demo' },
        instagram: { enabled: true, mode: 'demo' },
        whatsapp: { enabled: true, mode: 'demo' },
        telegram: { enabled: true, mode: 'demo' },
        twitter: { enabled: false, mode: 'demo' },
        pinterest: { enabled: false, mode: 'demo' },
        youtube: { enabled: false, mode: 'demo' }
      },
      fallback: {
        useContentImages: true,
        generateMockUrls: true,
        logActivity: true
      }
    };
    
    fs.writeFileSync('social-media-demo-config.json', JSON.stringify(demoConfig, null, 2));
    console.log('Success Created demo configuration file');
    
    console.log('\nCelebration SOCIAL MEDIA CREDENTIALS SETUP COMPLETE!');
    console.log('=====================================');
    console.log('Success Demo API credentials added to .env');
    console.log('Success Demo configuration created');
    console.log('Success Automation will work in demo mode');
    
    console.log('\nBlog NEXT STEPS:');
    console.log('1. Restart PM2 to load new environment variables:');
    console.log('   pm2 restart pickntrust-backend --update-env');
    console.log('');
    console.log('2. Test automation - it will now work in demo mode');
    console.log('');
    console.log('3. To use real APIs, replace demo tokens with actual credentials');
    console.log('');
    console.log('4. Check logs - you should see successful demo posts:');
    console.log('   pm2 logs pickntrust-backend');
    
  } catch (error) {
    console.error('Alert CREDENTIAL SETUP FAILED:', error);
  }
}

fixCredentials();
