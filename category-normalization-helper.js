
// Enhanced Category Matching and Normalization Helper
// Use this function to properly match and create categories

function findOrCreateCategory(inputCategoryName, db) {
  if (!inputCategoryName || typeof inputCategoryName !== 'string') {
    return null;
  }
  
  // Normalize the input
  const normalizedInput = inputCategoryName.trim();
  
  // First, try exact match (case-insensitive)
  const exactMatch = db.prepare(`
    SELECT id, name FROM categories 
    WHERE LOWER(name) = LOWER(?)
    LIMIT 1
  `).get(normalizedInput);
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // Try partial matching for subcategories
  // If input is "Home", try to find "Home & Kitchen", "Home & Living", etc.
  const partialMatches = db.prepare(`
    SELECT id, name FROM categories 
    WHERE LOWER(name) LIKE LOWER(?) 
    ORDER BY LENGTH(name) ASC
    LIMIT 5
  `).all(`%${normalizedInput}%`);
  
  if (partialMatches.length > 0) {
    // Prefer more specific matches
    const bestMatch = partialMatches.find(match => 
      match.name.toLowerCase().startsWith(normalizedInput.toLowerCase())
    ) || partialMatches[0];
    
    console.log(`📍 Partial match: "${normalizedInput}" → "${bestMatch.name}"`);
    return bestMatch;
  }
  
  // If no match found, create new category with proper capitalization
  const properName = properCapitalize(normalizedInput);
  
  try {
    const insertResult = db.prepare(`
      INSERT INTO categories (name, description, icon, color, is_for_products, is_for_services, display_order)
      VALUES (?, ?, 'fas fa-tag', '#6B7280', 1, 0, 
        (SELECT COALESCE(MAX(display_order), 0) + 10 FROM categories))
    `).run(
      properName,
      `${properName} products and services`
    );
    
    console.log(`Success Created new category: "${properName}" (ID: ${insertResult.lastInsertRowid})`);
    
    return {
      id: insertResult.lastInsertRowid,
      name: properName
    };
  } catch (error) {
    console.error(`Error Error creating category "${properName}":`, error.message);
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
    .replace(/(w)/g, (match, letter, offset) => {
      // Always capitalize first letter of the string
      return offset === 0 ? letter.toUpperCase() : match;
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { findOrCreateCategory, properCapitalize };
}
