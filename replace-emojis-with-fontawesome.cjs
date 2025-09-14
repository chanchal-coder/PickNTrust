/**
 * Replace All Emojis with FontAwesome Icons Throughout Website
 * This script systematically replaces emoji icons with FontAwesome equivalents
 */

const fs = require('fs');
const path = require('path');

console.log('Refresh Starting comprehensive emoji to FontAwesome replacement...');

// Comprehensive emoji to FontAwesome mapping
const emojiToFontAwesome = {
  // Travel & Transport
  'Flight': '<i className="fas fa-plane"></i>',
  'Hotel': '<i className="fas fa-bed"></i>',
  'Bus': '<i className="fas fa-bus"></i>',
  'Train': '<i className="fas fa-train"></i>',
  'Package': '<i className="fas fa-suitcase"></i>',
  'Car': '<i className="fas fa-car"></i>',
  'Ticket': '<i className="fas fa-ticket-alt"></i>',
  'Beach': '<i className="fas fa-umbrella-beach"></i>',
  'Experience': '<i className="fas fa-map-marked-alt"></i>',
  
  // Shopping & Commerce
  'Deal': '<i className="fas fa-shopping-bag"></i>',
  '🛒': '<i className="fas fa-shopping-cart"></i>',
  'Price': '<i className="fas fa-dollar-sign"></i>',
  '💳': '<i className="fas fa-credit-card"></i>',
  '🏷️': '<i className="fas fa-tag"></i>',
  'Hot': '<i className="fas fa-fire"></i>',
  'Fast': '<i className="fas fa-bolt"></i>',
  'Special': '<i className="fas fa-sparkles"></i>',
  'Gift': '<i className="fas fa-gift"></i>',
  '💎': '<i className="fas fa-gem"></i>',
  
  // Technology & Apps
  'Mobile': '<i className="fas fa-mobile-alt"></i>',
  '💻': '<i className="fas fa-laptop"></i>',
  'Image': '<i className="fas fa-camera"></i>',
  'AI': '<i className="fas fa-robot"></i>',
  '⚙️': '<i className="fas fa-cog"></i>',
  '🔧': '<i className="fas fa-wrench"></i>',
  'Link': '<i className="fas fa-link"></i>',
  'Stats': '<i className="fas fa-chart-bar"></i>',
  '📈': '<i className="fas fa-chart-line"></i>',
  'Target': '<i className="fas fa-bullseye"></i>',
  
  // People & Users
  '👨': '<i className="fas fa-male"></i>',
  '👩': '<i className="fas fa-female"></i>',
  '👦': '<i className="fas fa-child"></i>',
  '👧': '<i className="fas fa-child"></i>',
  '👶': '<i className="fas fa-baby"></i>',
  '👔': '<i className="fas fa-user-tie"></i>',
  '👗': '<i className="fas fa-tshirt"></i>',
  '👟': '<i className="fas fa-shoe-prints"></i>',
  '👤': '<i className="fas fa-user"></i>',
  
  // Home & Living
  'Home': '<i className="fas fa-home"></i>',
  '🛋️': '<i className="fas fa-couch"></i>',
  '🍽️': '<i className="fas fa-utensils"></i>',
  '🛏️': '<i className="fas fa-bed"></i>',
  '🌱': '<i className="fas fa-seedling"></i>',
  '🧴': '<i className="fas fa-pump-soap"></i>',
  '🍼': '<i className="fas fa-baby-carriage"></i>',
  '🐾': '<i className="fas fa-paw"></i>',
  
  // Content & Media
  'Blog': '<i className="fas fa-edit"></i>',
  'Upload': '<i className="fas fa-folder"></i>',
  '📂': '<i className="fas fa-folder-open"></i>',
  'Record': '<i className="fas fa-video"></i>',
  'Video': '<i className="fas fa-film"></i>',
  'Movie': '<i className="fas fa-video"></i>',
  '📺': '<i className="fas fa-tv"></i>',
  '🎮': '<i className="fas fa-gamepad"></i>',
  '📚': '<i className="fas fa-book"></i>',
  '🎓': '<i className="fas fa-graduation-cap"></i>',
  
  // Status & Actions
  'Success': '<i className="fas fa-check-circle"></i>',
  'Error': '<i className="fas fa-times-circle"></i>',
  'Warning': '<i className="fas fa-exclamation-triangle"></i>',
  'Alert': '<i className="fas fa-exclamation-circle"></i>',
  'Check': '<i className="fas fa-check"></i>',
  '✕': '<i className="fas fa-times"></i>',
  'Refresh': '<i className="fas fa-sync-alt"></i>',
  'Launch': '<i className="fas fa-rocket"></i>',
  'Tip': '<i className="fas fa-lightbulb"></i>',
  '🛡️': '<i className="fas fa-shield-alt"></i>',
  
  // Communication & Social
  '📧': '<i className="fas fa-envelope"></i>',
  '📞': '<i className="fas fa-phone"></i>',
  '💬': '<i className="fas fa-comment"></i>',
  '🔔': '<i className="fas fa-bell"></i>',
  '📢': '<i className="fas fa-bullhorn"></i>',
  'Global': '<i className="fas fa-globe"></i>',
  
  // Food & Services
  '🍕': '<i className="fas fa-pizza-slice"></i>',
  '🛠️': '<i className="fas fa-tools"></i>',
  '💄': '<i className="fas fa-lipstick"></i>',
  '❤️': '<i className="fas fa-heart"></i>',
  '🏋️': '<i className="fas fa-dumbbell"></i>',
  
  // Misc
  'Products': '<i className="fas fa-box"></i>',
  '📄': '<i className="fas fa-file-alt"></i>',
  'Date': '<i className="fas fa-calendar-alt"></i>',
  'Featured': '<i className="fas fa-star"></i>',
  '★': '<i className="fas fa-star"></i>',
  '😊': '<i className="fas fa-smile"></i>',
  '😕': '<i className="fas fa-frown"></i>',
  'Celebration': '<i className="fas fa-party-horn"></i>',
  'Premium': '<i className="fas fa-trophy"></i>',
  '🔐': '<i className="fas fa-lock"></i>',
  '🔑': '<i className="fas fa-key"></i>',
  '📋': '<i className="fas fa-clipboard"></i>',
  '✏️': '<i className="fas fa-pencil-alt"></i>',
  '🎨': '<i className="fas fa-palette"></i>',
  '🧪': '<i className="fas fa-flask"></i>',
  '🏪': '<i className="fas fa-store"></i>'
};

// Text-only emoji replacements (for non-JSX contexts)
const emojiToText = {
  'Alert': 'Alert',
  'Error': 'Error',
  'Warning': 'Warning',
  'Success': 'Success',
  'Hot': 'Hot',
  'Price': 'Price',
  'Special': 'Special',
  'Deal': 'Deal',
  'Mobile': 'Mobile',
  'AI': 'AI',
  'Target': 'Target',
  'Launch': 'Launch',
  'Tip': 'Tip',
  'Link': 'Link',
  'Stats': 'Stats',
  'Home': 'Home',
  'Blog': 'Blog',
  'Products': 'Products',
  'Gift': 'Gift',
  'Featured': 'Featured',
  'Premium': 'Premium',
  'Check': 'Check',
  'Upload': 'Upload',
  'Image': 'Image',
  'Video': 'Video',
  'Record': 'Record',
  'Movie': 'Movie',
  'Facebook': 'Facebook',
  'Celebration': 'Celebration',
  'Refresh': 'Refresh',
  'Global': 'Global',
  'Date': 'Date',
  'Cleanup': 'Cleanup',
  'Save': 'Save',
  'Stop': 'Stop',
  'Search': 'Search',
  'Unlock': 'Unlock',
  'Fast': 'Fast',
  'Experience': 'Experience',
  'Beach': 'Beach',
  'Flight': 'Flight',
  'Hotel': 'Hotel',
  'Bus': 'Bus',
  'Train': 'Train',
  'Package': 'Package',
  'Car': 'Car',
  'Ticket': 'Ticket'
};

function replaceEmojisInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Check if it's a JSX/TSX file
    const isJSXFile = filePath.endsWith('.tsx') || filePath.endsWith('.jsx');
    
    if (isJSXFile) {
      // For JSX files, replace with FontAwesome components
      for (const [emoji, fontAwesome] of Object.entries(emojiToFontAwesome)) {
        if (content.includes(emoji)) {
          content = content.replace(new RegExp(emoji, 'g'), fontAwesome);
          hasChanges = true;
        }
      }
    } else {
      // For other files, replace with text
      for (const [emoji, text] of Object.entries(emojiToText)) {
        if (content.includes(emoji)) {
          content = content.replace(new RegExp(emoji, 'g'), text);
          hasChanges = true;
        }
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath, extensions = ['.tsx', '.jsx', '.ts', '.js']) {
  const results = {
    processed: 0,
    updated: 0,
    files: []
  };
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other unnecessary directories
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          const subResults = processDirectory(itemPath, extensions);
          results.processed += subResults.processed;
          results.updated += subResults.updated;
          results.files.push(...subResults.files);
        }
      } else if (extensions.some(ext => itemPath.endsWith(ext))) {
        results.processed++;
        const wasUpdated = replaceEmojisInFile(itemPath);
        if (wasUpdated) {
          results.updated++;
          results.files.push(itemPath);
          console.log(`Success Updated: ${itemPath}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
  
  return results;
}

// Process client-side files
console.log('\nRefresh Processing client-side files...');
const clientPath = path.join(process.cwd(), 'client', 'src');
const clientResults = processDirectory(clientPath, ['.tsx', '.jsx', '.ts', '.js']);

// Process server-side files
console.log('\nRefresh Processing server-side files...');
const serverPath = path.join(process.cwd(), 'server');
const serverResults = processDirectory(serverPath, ['.ts', '.js']);

// Process root-level files
console.log('\nRefresh Processing root-level files...');
const rootResults = processDirectory(process.cwd(), ['.tsx', '.jsx', '.ts', '.js', '.cjs']);

// Calculate totals
const totalProcessed = clientResults.processed + serverResults.processed + rootResults.processed;
const totalUpdated = clientResults.updated + serverResults.updated + rootResults.updated;
const allUpdatedFiles = [...clientResults.files, ...serverResults.files, ...rootResults.files];

console.log('\nCelebration Emoji to FontAwesome replacement completed!');
console.log(`Stats Files processed: ${totalProcessed}`);
console.log(`Success Files updated: ${totalUpdated}`);

if (totalUpdated > 0) {
  console.log('\nBlog Updated files:');
  allUpdatedFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
  
  console.log('\n🎨 Replacement summary:');
  console.log('   - JSX/TSX files: Emojis → FontAwesome components');
  console.log('   - Other files: Emojis → Descriptive text');
  console.log('   - All icons now use consistent FontAwesome styling');
} else {
  console.log('\nSpecial No emoji replacements needed - all files already use FontAwesome!');
}

console.log('\nLaunch Website now uses FontAwesome icons throughout!');
console.log('Tip Refresh your browser to see the FontAwesome icons');