const fs = require('fs');
const path = require('path');

console.log('Search CHECKING CANVA CREDENTIALS STATUS...\n');

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('Success .env file found');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check for Canva credentials
  const hasCanvaClientId = envContent.includes('CANVA_CLIENT_ID=') && !envContent.includes('CANVA_CLIENT_ID=your_canva_client_id_here');
  const hasCanvaSecret = envContent.includes('CANVA_CLIENT_SECRET=') && !envContent.includes('CANVA_CLIENT_SECRET=your_canva_client_secret_here');
  
  console.log(`${hasCanvaClientId ? 'Success' : 'Error'} CANVA_CLIENT_ID: ${hasCanvaClientId ? 'CONFIGURED' : 'MISSING OR PLACEHOLDER'}`);
  console.log(`${hasCanvaSecret ? 'Success' : 'Error'} CANVA_CLIENT_SECRET: ${hasCanvaSecret ? 'CONFIGURED' : 'MISSING OR PLACEHOLDER'}`);
  
  if (hasCanvaClientId && hasCanvaSecret) {
    console.log('\nCelebration Canva credentials are properly configured!');
  } else {
    console.log('\nWarning  Canva credentials need to be configured.');
    console.log('Run: node add-canva-credentials.cjs');
  }
  
} else {
  console.log('Error .env file not found!');
  console.log('Please create .env file with Canva credentials.');
}
