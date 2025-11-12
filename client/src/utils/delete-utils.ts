import type { QueryClient } from '@tanstack/react-query';

/**
 * Delete a product by ID using the admin API.
 * Supports two call styles:
 * - deleteProduct(productId)
 * - deleteProduct(context, productId)
 * - deleteProduct(productId, context, password)
 */
export async function deleteProduct(
  arg1: string | number,
  arg2?: string | number,
  password: string = 'pickntrust2025'
): Promise<any> {
  let productId: string | number;
  let context: string | undefined;

  if (typeof arg1 === 'string' && typeof arg2 !== 'undefined') {
    context = arg1;
    productId = arg2 as string | number;
  } else {
    productId = arg1 as string | number;
    context = typeof arg2 === 'string' ? arg2 : undefined;
  }

  const url = `/api/admin/products/${productId}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (context) headers['X-Delete-Context'] = context;

  const response = await fetch(url, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ password })
  });

  if (!response.ok) {
    let payload: any = null;
    try {
      payload = await response.json();
    } catch (_) {
      // ignore
    }
    const message = payload?.message || `Failed to delete product ${productId}`;
    throw new Error(message);
  }

  return response.json();
}

/**
 * Invalidate and remove product-related queries across the app.
 * Use after mutations like delete to ensure UI reflects latest state.
 */
export function invalidateAllProductQueries(queryClient: QueryClient): void {
  // Broad predicate-based invalidation for any query touching /api/products
  queryClient.invalidateQueries({
    predicate: (q) => {
      const keys = Array.isArray(q.queryKey) ? q.queryKey : [q.queryKey];
      return keys.some(
        (k) => typeof k === 'string' && k.includes('/api/products')
      );
    }
  });

  // Target a few commonly used keys explicitly
  queryClient.invalidateQueries({ queryKey: ['/api/products'] });
  queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
  queryClient.invalidateQueries({ queryKey: ['/api/products/services'] });
  queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });

  // Remove stale queries to avoid ghost items across pages
  try {
    queryClient.removeQueries({
      predicate: (q) => {
        const keys = Array.isArray(q.queryKey) ? q.queryKey : [q.queryKey];
        return keys.some(
          (k) => typeof k === 'string' && k.includes('/api/products')
        );
      }
    });
  } catch (_) {
    // Some older versions may throw; safe to ignore
  }
}