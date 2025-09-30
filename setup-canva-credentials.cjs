const fs = require('fs');
const path = require('path');

console.log('🎨 Setting up Canva API credentials...\n');

const envPath = path.join(__dirname, '.env');
const canvaCredentials = `
# Canva API Credentials
CANVA_CLIENT_ID=your_canva_client_id_here
CANVA_CLIENT_SECRET=your_canva_client_secret_here
`;

try {
  // Check if .env file exists
  if (fs.existsSync(envPath)) {
    // Read existing .env content
    const existingContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if Canva credentials already exist
    if (existingContent.includes('CANVA_CLIENT_ID')) {
      console.log('Success Canva credentials already exist in .env file');
    } else {
      // Append Canva credentials to existing .env
      fs.appendFileSync(envPath, canvaCredentials);
      console.log('Success Canva credentials template added to existing .env file');
    }
  } else {
    // Create new .env file with Canva credentials
    fs.writeFileSync(envPath, canvaCredentials.trim());
    console.log('Success Created new .env file with Canva credentials template');
  }

  console.log('\nCelebration Canva API setup complete!');
  console.log('\nCredentials template added to .env file');
  console.log('Warning  IMPORTANT: Replace the placeholder values with your actual Canva API credentials');
  
  console.log('\nBlog Next steps:');
  console.log('1. Edit your .env file and replace the placeholder values with real credentials');
  console.log('2. Restart your server to load the new environment variables');
  console.log('3. Test the Canva integration in the admin panel');

} catch (error) {
  console.error('Error Error setting up Canva credentials:', error.message);
  console.log('\nBlog Manual setup:');
  console.log('Please add these lines to your .env file manually:');
  console.log('CANVA_CLIENT_ID=your_canva_client_id_here');
  console.log('CANVA_CLIENT_SECRET=your_canva_client_secret_here');
  console.log('\nThen replace the placeholder values with your actual Canva API credentials.');
}
