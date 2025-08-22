# Schema Naming Convention Fix

## Problem
The database uses snake_case column names but the Drizzle schema expects camelCase.

## Current Database Schema
- Tables: products, categories, blog_posts, newsletter_subscribers, etc.
- Columns: original_price, image_url, affiliate_url, etc.

## Current TypeScript Schema  
- Expects: originalPrice, imageUrl, affiliateUrl, etc.

## Solution
Update the Drizzle schema to map camelCase properties to snake_case columns:


// The issue is that Drizzle schema uses camelCase but database uses snake_case
// We need to add column mapping to the schema definitions

// Example fix for products table:
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price").notNull(),
  originalPrice: numeric("original_price"), // Map camelCase to snake_case
  imageUrl: text("image_url").notNull(),    // Map camelCase to snake_case
  affiliateUrl: text("affiliate_url").notNull(), // Map camelCase to snake_case
  // ... continue for all columns
});

// This way Drizzle will use the correct database column names
// while maintaining camelCase in TypeScript code


## Files to Update
1. shared/sqlite-schema.ts - Add proper column mapping
2. server/storage.ts - Ensure queries work with mapped columns
3. Test all API endpoints after the fix

## Next Steps
1. Update the schema file with proper column mapping
2. Test database queries
3. Verify API endpoints work correctly
4. Test gender categorization functionality
