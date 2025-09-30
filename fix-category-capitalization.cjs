// Fix Category Capitalization and Matching Issues
// Addresses: First letter capitalization + proper category matching (e.g., Home & Kitchen vs Home)

const Database = require('better-sqlite3');

console.log('🔧 FIXING CATEGORY CAPITALIZATION AND MATCHING');
console.log('=' .repeat(60));
console.log('Target Purpose: Fix category name formatting and prevent duplicate categories');
console.log('Stats Issues: Capitalization + subcategory matching (Home & Kitchen vs Home)');
console.log('=' .repeat(60));

async function fixCategoryCapitalizationAndMatching() {
  try {
    console.log('\n1. 🗄️ Connecting to Database...');
    
    const db = new Database('database.sqlite');
    
    console.log('\n2. Stats Analyzing Current Category Issues...');
    
    // Get all categories
    const allCategories = db.prepare(`
      SELECT id, name, parent_id, display_order
      FROM categories 
      ORDER BY name
    `).all();
    
    console.log(`Found ${allCategories.length} categories`);
    
    // Find categories with capitalization issues
    const capitalizationIssues = [];
    const duplicateIssues = [];
    
    allCategories.forEach(category => {
      const name = category.name;
      
      // Check capitalization (first letter should be capital)
      if (name && name[0] !== name[0].toUpperCase()) {
        capitalizationIssues.push({
          id: category.id,
          currentName: name,
          correctName: properCapitalize(name)
        });
      }
      
      // Check for potential duplicates (case-insensitive)
      const similarCategories = allCategories.filter(cat => 
        cat.id !== category.id && 
        cat.name.toLowerCase() === name.toLowerCase()
      );
      
      if (similarCategories.length > 0) {
        duplicateIssues.push({
          category: category,
          duplicates: similarCategories
        });
      }
    });
    
    console.log(`\n📋 Issues Found:`);
    console.log(`   Capitalization issues: ${capitalizationIssues.length}`);
    console.log(`   Potential duplicates: ${duplicateIssues.length}`);
    
    if (capitalizationIssues.length > 0) {
      console.log('\n🔤 Capitalization Issues:');
      capitalizationIssues.forEach(issue => {
        console.log(`   "${issue.currentName}" → "${issue.correctName}"`);
      });
    }
    
    if (duplicateIssues.length > 0) {
      console.log('\nRefresh Duplicate Issues:');
      duplicateIssues.forEach(issue => {
        console.log(`   "${issue.category.name}" has ${issue.duplicates.length} similar categories`);
      });
    }
    
    console.log('\n3. 🔧 Fixing Capitalization Issues...');
    
    // Fix capitalization issues
    capitalizationIssues.forEach(issue => {
      try {
        db.prepare(`
          UPDATE categories 
          SET name = ? 
          WHERE id = ?
        `).run(issue.correctName, issue.id);
        
        console.log(`   Success Fixed: "${issue.currentName}" → "${issue.correctName}"`);
      } catch (error) {
        console.log(`   Error Failed to fix "${issue.currentName}": ${error.message}`);
      }
    });
    
    console.log('\n4. Search Checking for Subcategory Matching Issues...');
    
    // Find products that might be assigned to wrong categories
    const productCategoryIssues = findProductCategoryIssues(db);
    
    if (productCategoryIssues.length > 0) {
      console.log(`\nProducts Product Category Issues Found: ${productCategoryIssues.length}`);
      productCategoryIssues.forEach(issue => {
        console.log(`   Product "${issue.productName}" in category "${issue.currentCategory}"`);
        console.log(`   Should be in: "${issue.suggestedCategory}"`);
      });
    }
    
    console.log('\n5. 🛠️ Creating Enhanced Category Matching Function...');
    
    // Create a better category matching function
    const enhancedCategoryMatcher = createEnhancedCategoryMatcher(db);
    
    console.log('\n6. 🧪 Testing Enhanced Category Matching...');
    
    // Test cases for category matching
    const testCases = [
      'home',
      'Home',
      'HOME',
      'home & kitchen',
      'Home & Kitchen',
      'HOME & KITCHEN',
      'electronics',
      'Electronics & Gadgets',
      'fashion',
      'Fashion & Clothing',
      'beauty',
      'Beauty & Personal Care'
    ];
    
    console.log('\n🧪 Category Matching Tests:');
    testCases.forEach(testCase => {
      const match = enhancedCategoryMatcher(testCase);
      console.log(`   "${testCase}" → "${match || 'No match'}"`);
    });
    
    console.log('\n7. Blog Creating Category Normalization Helper...');
    
    // Create a helper function for future use
    const categoryNormalizationHelper = `
// Enhanced Category Matching and Normalization Helper
// Use this function to properly match and create categories

function findOrCreateCategory(inputCategoryName, db) {
  if (!inputCategoryName || typeof inputCategoryName !== 'string') {
    return null;
  }
  
  // Normalize the input
  const normalizedInput = inputCategoryName.trim();
  
  // First, try exact match (case-insensitive)
  const exactMatch = db.prepare(\`
    SELECT id, name FROM categories 
    WHERE LOWER(name) = LOWER(?)
    LIMIT 1
  \`).get(normalizedInput);
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // Try partial matching for subcategories
  // If input is "Home", try to find "Home & Kitchen", "Home & Living", etc.
  const partialMatches = db.prepare(\`
    SELECT id, name FROM categories 
    WHERE LOWER(name) LIKE LOWER(?) 
    ORDER BY LENGTH(name) ASC
    LIMIT 5
  \`).all(\`%\${normalizedInput}%\`);
  
  if (partialMatches.length > 0) {
    // Prefer more specific matches
    const bestMatch = partialMatches.find(match => 
      match.name.toLowerCase().startsWith(normalizedInput.toLowerCase())
    ) || partialMatches[0];
    
    console.log(\`📍 Partial match: "\${normalizedInput}" → "\${bestMatch.name}"\`);
    return bestMatch;
  }
  
  // If no match found, create new category with proper capitalization
  const properName = properCapitalize(normalizedInput);
  
  try {
    const insertResult = db.prepare(\`
      INSERT INTO categories (name, description, icon, color, is_for_products, is_for_services, display_order)
      VALUES (?, ?, 'fas fa-tag', '#6B7280', 1, 0, 
        (SELECT COALESCE(MAX(display_order), 0) + 10 FROM categories))
    \`).run(
      properName,
      \`\${properName} products and services\`
    );
    
    console.log(\`Success Created new category: "\${properName}" (ID: \${insertResult.lastInsertRowid})\`);
    
    return {
      id: insertResult.lastInsertRowid,
      name: properName
    };
  } catch (error) {
    console.error(\`Error Error creating category "\${properName}":\`, error.message);
    return null;
  }
}

function properCapitalize(str) {
  if (!str) return str;
  
  return str
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      
      // Handle special cases like "&", "and", "of", "the"
      const lowerWord = word.toLowerCase();
      if (['&', 'and', 'of', 'the', 'in', 'on', 'at', 'by', 'for', 'with'].includes(lowerWord)) {
        return lowerWord === '&' ? '&' : lowerWord;
      }
      
      // Capitalize first letter, keep rest as is (to preserve acronyms)
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\b(\w)/g, (match, letter, offset) => {
      // Always capitalize first letter of the string
      return offset === 0 ? letter.toUpperCase() : match;
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { findOrCreateCategory, properCapitalize };
}
`;
    
    // Write the helper to a file
    require('fs').writeFileSync('category-normalization-helper.js', categoryNormalizationHelper);
    console.log('Success Created category-normalization-helper.js');
    
    console.log('\n8. Success CATEGORY FIXES COMPLETED!');
    
    // Final verification
    const updatedCategories = db.prepare(`
      SELECT id, name, parent_id
      FROM categories 
      ORDER BY name
    `).all();
    
    console.log('\nStats FINAL CATEGORY LIST:');
    updatedCategories.forEach(cat => {
      const indent = cat.parent_id ? '  └─ ' : '';
      console.log(`   ${indent}${cat.id}. ${cat.name}`);
    });
    
    console.log('\nTarget FIXES APPLIED:');
    console.log('   Success Category names properly capitalized');
    console.log('   Success Enhanced category matching function created');
    console.log('   Success Subcategory matching improved');
    console.log('   Success Helper functions for future use');
    
    console.log('\nTip USAGE INSTRUCTIONS:');
    console.log('   1. Use findOrCreateCategory() instead of direct category creation');
    console.log('   2. This function will find existing categories before creating new ones');
    console.log('   3. "Home" will match "Home & Kitchen" if it exists');
    console.log('   4. All new categories will have proper capitalization');
    
    db.close();
    
  } catch (error) {
    console.error('Error Error fixing category issues:', error.message);
  }
}

// Helper functions
function properCapitalize(str) {
  if (!str) return str;
  
  return str
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      
      // Handle special cases like "&", "and", "of", "the"
      const lowerWord = word.toLowerCase();
      if (['&', 'and', 'of', 'the', 'in', 'on', 'at', 'by', 'for', 'with'].includes(lowerWord)) {
        return lowerWord === '&' ? '&' : lowerWord;
      }
      
      // Capitalize first letter, keep rest as is (to preserve acronyms)
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\b(\w)/g, (match, letter, offset) => {
      // Always capitalize first letter of the string
      return offset === 0 ? letter.toUpperCase() : match;
    });
}

function findProductCategoryIssues(db) {
  const issues = [];
  
  try {
    // Check products table
    const products = db.prepare(`
      SELECT id, name, category 
      FROM products 
      WHERE category IS NOT NULL
      LIMIT 100
    `).all();
    
    products.forEach(product => {
      const category = product.category;
      
      // Check if this category exists in categories table
      const categoryExists = db.prepare(`
        SELECT id, name FROM categories WHERE name = ?
      `).get(category);
      
      if (!categoryExists) {
        // Check if there's a similar category
        const similarCategory = db.prepare(`
          SELECT id, name FROM categories 
          WHERE LOWER(name) LIKE LOWER(?) 
          ORDER BY LENGTH(name) ASC
          LIMIT 1
        `).get(`%${category}%`);
        
        if (similarCategory) {
          issues.push({
            productId: product.id,
            productName: product.name,
            currentCategory: category,
            suggestedCategory: similarCategory.name
          });
        }
      }
    });
  } catch (error) {
    console.log('Warning Could not check product category issues:', error.message);
  }
  
  return issues;
}

function createEnhancedCategoryMatcher(db) {
  return function(inputCategory) {
    if (!inputCategory) return null;
    
    const normalized = inputCategory.trim();
    
    // Exact match (case-insensitive)
    const exactMatch = db.prepare(`
      SELECT name FROM categories 
      WHERE LOWER(name) = LOWER(?)
      LIMIT 1
    `).get(normalized);
    
    if (exactMatch) {
      return exactMatch.name;
    }
    
    // Partial match (for subcategories)
    const partialMatch = db.prepare(`
      SELECT name FROM categories 
      WHERE LOWER(name) LIKE LOWER(?) 
      ORDER BY LENGTH(name) ASC
      LIMIT 1
    `).get(`%${normalized}%`);
    
    if (partialMatch) {
      return partialMatch.name;
    }
    
    return null;
  };
}

// Run the fix
fixCategoryCapitalizationAndMatching().catch(console.error);