
/**
 * Bot Integration Helper for Robust Category Validation
 * Use this in all bot services to prevent categorization issues
 */

import Database from 'better-sqlite3';
import { validateProductCategory as validateWithValidator, ensureCategoryExists as ensureWithValidator } from './category-validator.js';

// Import the validation service (adjust path as needed)
// const { CategoryValidationService } = require('./utils/category-validation-service.js');

/**
 * Validate and assign category for bot-processed products
 * @param {Object} productData - Product information
 * @returns {string} - Validated category name
 */
function validateProductCategory(productData) {
  try {
    // Use the robust category validator
    return validateWithValidator(productData);
  } catch (error) {
    console.error('Error Error in category validation:', error);
    return 'Curated Picks';
  }
}

/**
 * Ensure category exists in database
 * @param {string} categoryName - Category to ensure exists
 */
function ensureCategoryExists(categoryName) {
  try {
    // Use the robust category validator
    ensureWithValidator(categoryName);
  } catch (error) {
    console.error('Error Error ensuring category exists:', error);
  }
}

export {
  validateProductCategory,
  ensureCategoryExists
};
