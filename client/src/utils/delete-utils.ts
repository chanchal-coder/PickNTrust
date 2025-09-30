import { QueryClient } from '@tanstack/react-query';

/**
 * Comprehensive query invalidation for product deletions
 * This ensures all relevant caches are cleared when a product is deleted
 */
export const invalidateAllProductQueries = (queryClient: QueryClient) => {
  // Core product queries
  queryClient.invalidateQueries({ queryKey: ['/api/products'] });
  queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
  
  // Page-specific queries
  queryClient.invalidateQueries({ queryKey: ['/api/services'] });
  queryClient.invalidateQueries({ queryKey: ['/api/apps'] });
  queryClient.invalidateQueries({ queryKey: ['/api/prime-picks'] });
  queryClient.invalidateQueries({ queryKey: ['/api/click-picks'] });
  queryClient.invalidateQueries({ queryKey: ['/api/cue-picks'] });
  queryClient.invalidateQueries({ queryKey: ['/api/value-picks'] });
  queryClient.invalidateQueries({ queryKey: ['/api/loot-box'] });
  queryClient.invalidateQueries({ queryKey: ['/api/amazon'] });
  queryClient.invalidateQueries({ queryKey: ['/api/cuelinks'] });
  queryClient.invalidateQueries({ queryKey: ['/api/travel-deals'] });
  queryClient.invalidateQueries({ queryKey: ['travel-products'] });
  queryClient.invalidateQueries({ queryKey: ['/api/travel-products'] });
  
  // Homepage queries
  queryClient.invalidateQueries({ queryKey: ['/api/homepage/services'] });
  queryClient.invalidateQueries({ queryKey: ['/api/homepage/apps'] });
  queryClient.invalidateQueries({ queryKey: ['/api/homepage/products'] });
  
  // Category and search queries
  queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
  queryClient.invalidateQueries({ queryKey: ['/api/search'] });
  
  // Wishlist and user-related queries
  queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
};

/**
 * Standard admin delete function for products
 * @param productType - The type of product ('travel' for travel products, or productId for regular products)
 * @param productId - The ID of the product to delete (optional for travel products)
 * @param password - Admin password (defaults to standard password)
 * @returns Promise with the delete response
 */
export const deleteProduct = async (productType: number | string, productId?: number | string, password: string = 'pickntrust2025') => {
  let endpoint: string;
  
  // Handle travel products specifically
  if (productType === 'travel' && productId) {
    endpoint = `/api/admin/travel-products/${productId}`;
  } else if (productType === 'all') {
    // Handle bulk delete - this might need to be implemented on the backend
    endpoint = `/api/admin/travel-products/bulk-delete`;
  } else {
    // Regular products
    endpoint = `/api/admin/products/${productType}`;
  }
  
  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete product');
  }
  
  return response.json();
};

/**
 * Create a standardized delete mutation for React Query
 * @param queryClient - The React Query client instance
 * @param onSuccessMessage - Custom success message (optional)
 * @returns useMutation configuration object
 */
export const createDeleteMutation = (queryClient: QueryClient, onSuccessMessage?: string) => ({
  mutationFn: (productId: number | string) => deleteProduct(productId, undefined, 'pickntrust2025'),
  onSuccess: () => {
    invalidateAllProductQueries(queryClient);
  },
  onError: (error: any) => {
    console.error('Delete failed:', error);
    throw error;
  },
});