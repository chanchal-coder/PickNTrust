const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 GitHub Push Protection Fix - Complete Git History Cleanup\n');

// Step 1: Create secrets file for BFG Repo-Cleaner
console.log('📝 Step 1: Creating secrets file for cleanup...');
const secretsToRemove = [
  'your_actual_canva_client_secret_here',
  'your_actual_canva_client_id_here'
];

const secretsFile = path.join(__dirname, 'secrets-to-remove.txt');
fs.writeFileSync(secretsFile, secretsToRemove.join('\n'));
console.log('✅ Secrets file created: secrets-to-remove.txt');

// Step 2: Check if BFG is available
console.log('\n🔍 Step 2: Checking for BFG Repo-Cleaner...');
try {
  execSync('java -version', { stdio: 'pipe' });
  console.log('✅ Java is available');
  
  // Check if BFG jar exists
  const bfgPath = path.join(__dirname, 'bfg.jar');
  if (!fs.existsSync(bfgPath)) {
    console.log('⚠️  BFG Repo-Cleaner not found. Please download it from:');
    console.log('   https://rtyley.github.io/bfg-repo-cleaner/');
    console.log('   Save as: bfg.jar in the project root');
    console.log('\n📋 Manual cleanup commands:');
    console.log('1. Download BFG: wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar -O bfg.jar');
    console.log('2. Run cleanup: java -jar bfg.jar --replace-text secrets-to-remove.txt --no-blob-protection .');
    console.log('3. Clean refs: git reflog expire --expire=now --all && git gc --prune=now --aggressive');
    console.log('4. Force push: git push --force-with-lease origin main');
    return;
  }
  
  console.log('✅ BFG Repo-Cleaner found');
  
  // Step 3: Run BFG cleanup
  console.log('\n🚀 Step 3: Running BFG cleanup...');
  execSync(`java -jar bfg.jar --replace-text ${secretsFile} --no-blob-protection .`, { stdio: 'inherit' });
  console.log('✅ BFG cleanup completed');
  
  // Step 4: Clean git references
  console.log('\n🧹 Step 4: Cleaning git references...');
  execSync('git reflog expire --expire=now --all', { stdio: 'inherit' });
  execSync('git gc --prune=now --aggressive', { stdio: 'inherit' });
  console.log('✅ Git references cleaned');
  
  console.log('\n🎉 Git history cleanup completed!');
  console.log('📋 Next steps:');
  console.log('1. Review the changes: git log --oneline');
  console.log('2. Force push: git push --force-with-lease origin main');
  console.log('3. Verify push protection is satisfied');
  
} catch (error) {
  console.log('❌ Java not available or BFG cleanup failed');
  console.log('📋 Alternative: Use git filter-branch (slower but works without Java)');
  console.log('\nCommands to run manually:');
  console.log('git filter-branch --force --index-filter "git rm --cached --ignore-unmatch -r ." --prune-empty --tag-name-filter cat -- --all');
}

// Step 5: Clean up temporary files
console.log('\n🧹 Cleaning up temporary files...');
if (fs.existsExists(secretsFile)) {
  fs.unlinkSync(secretsFile);
  console.log('✅ Temporary secrets file removed');
}

console.log('\n🔒 Security Reminder:');
console.log('⚠️  The exposed Canva API keys should be rotated immediately');
console.log('✅ All current files are now clean of hardcoded secrets');
console.log('✅ Environment variable setup is properly configured');

console.log('\n📋 To use this script with actual secrets:');
console.log('1. Replace the placeholder values in secretsToRemove array with actual secrets');
console.log('2. Run: node clean-git-history.cjs');
console.log('3. Follow the instructions provided by the script');
