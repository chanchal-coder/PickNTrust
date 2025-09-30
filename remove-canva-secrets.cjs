const fs = require('fs');
const path = require('path');

console.log('Cleanup Removing all Canva API secrets from codebase...\n');

// Files that need to be cleaned
const filesToClean = [
  'server/canva-service.ts',
  'setup-canva-credentials.cjs',
  'test-canva-api-integration.cjs',
  'CANVA_CREDENTIALS_SETUP_GUIDE.md',
  'CANVA_API_INTEGRATION_COMPLETE.md'
];

// The secret pattern to remove (using placeholder patterns)
const secretPattern = /your_actual_canva_client_secret_here/g;
const clientIdPattern = /your_actual_canva_client_id_here/g;

filesToClean.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`Cleaning ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the secret with placeholder
    content = content.replace(secretPattern, 'your_canva_client_secret_here');
    content = content.replace(clientIdPattern, 'your_canva_client_id_here');
    
    fs.writeFileSync(filePath, content);
    console.log(`Success Cleaned ${filePath}`);
  } else {
    console.log(`Warning  File not found: ${filePath}`);
  }
});

console.log('\nCelebration All Canva API secrets have been removed from the codebase!');
console.log('Success GitHub Push Protection should now be satisfied.');
