// Type definitions for consistent typing across the application
export interface ProductPrice {
  price: string | number;
  originalPrice?: string | number;
  currency?: string;
}

export interface ProductRating {
  rating?: string | number;
  reviewCount?: string | number;
}

export interface ProductFlags {
  isNew?: boolean | number;
  isFeatured?: boolean | number;
  hasLimitedOffer?: boolean | number;
}

// Utility functions for type conversion
export const getNumericValue = (value: string | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const getBooleanValue = (value: boolean | number | undefined): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return false;
};
