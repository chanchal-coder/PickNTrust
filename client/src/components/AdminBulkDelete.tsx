import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, CheckSquare, Square, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AdminBulkDeleteProps {
  products: any[];
  onSelectionChange?: (selectedIds: string[]) => void;
  pageName?: string;
}

export function AdminBulkDelete({ products, onSelectionChange, pageName = 'page' }: AdminBulkDeleteProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(() => {
    const adminSession = localStorage.getItem('pickntrust-admin-session');
    return adminSession === 'active';
  });

  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pickntrust-admin-session') {
        setIsAdmin(e.newValue === 'active');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const results = [];
      for (const productId of productIds) {
        try {
          const response = await fetch(`/api/admin/products/${productId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: 'pickntrust2025' }),
          });
          
          if (response.ok) {
            results.push({ id: productId, success: true });
          } else {
            results.push({ id: productId, success: false, error: await response.text() });
          }
        } catch (error) {
          results.push({ id: productId, success: false, error: error.message });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      // Use proper cache invalidation instead of page reload
      import('@/utils/delete-utils').then(({ invalidateAllProductQueries }) => {
        invalidateAllProductQueries(queryClient);
      });
      
      // Invalidate current page queries
      queryClient.invalidateQueries({ queryKey: [`/api/products/page/${pageName}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/${pageName}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      toast({
        title: 'Bulk Delete Complete',
        description: `Successfully deleted ${successful} products. ${failed > 0 ? `Failed: ${failed}` : ''}`,
      });
      
      // Reset selection
      setSelectedIds([]);
      setIsSelectionMode(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Bulk Delete Failed',
        description: error.message || 'Failed to delete products',
        variant: 'destructive',
      });
    },
  });

  const handleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select products to delete',
        variant: 'destructive',
      });
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedIds.length} selected products from ${pageName}? This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleDeleteAll = () => {
    if (products.length === 0) {
      toast({
        title: 'No Products',
        description: 'No products to delete on this page',
        variant: 'destructive',
      });
      return;
    }

    const confirmMessage = `Are you sure you want to delete ALL ${products.length} products from ${pageName}? This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      const allIds = products.map(p => p.id);
      bulkDeleteMutation.mutate(allIds);
    }
  };

  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  }, [selectedIds, onSelectionChange]);

  if (!isAdmin || products.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Admin Bulk Actions
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSelectionMode(!isSelectionMode)}
          className="text-xs"
        >
          {isSelectionMode ? <X className="h-3 w-3" /> : 'Bulk'}
        </Button>
      </div>

      {!isSelectionMode ? (
        <div className="space-y-2">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <i className="fas fa-lightbulb"></i> Individual delete buttons are on each product card
          </div>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAll}
            disabled={bulkDeleteMutation.isPending}
            className="w-full text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete All ({products.length})
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSelectionMode(true)}
            className="w-full text-xs"
          >
            <CheckSquare className="h-3 w-3 mr-1" />
            Select Multiple
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs"
            >
              {selectedIds.length === products.length ? (
                <CheckSquare className="h-3 w-3 mr-1" />
              ) : (
                <Square className="h-3 w-3 mr-1" />
              )}
              All ({products.length})
            </Button>
            
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {selectedIds.length} selected
            </span>
          </div>

          <div className="max-h-32 overflow-y-auto space-y-1">
            {products.slice(0, 10).map((product) => (
              <div key={product.id} className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectProduct(product.id)}
                  className="p-1 h-auto"
                >
                  {selectedIds.includes(product.id) ? (
                    <CheckSquare className="h-3 w-3 text-blue-600" />
                  ) : (
                    <Square className="h-3 w-3" />
                  )}
                </Button>
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">
                  {product.name?.substring(0, 25)}...
                </span>
              </div>
            ))}
            {products.length > 10 && (
              <div className="text-xs text-gray-500 text-center py-1">
                +{products.length - 10} more products
              </div>
            )}
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending || selectedIds.length === 0}
            className="w-full text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete Selected ({selectedIds.length})
          </Button>
        </div>
      )}

      {bulkDeleteMutation.isPending && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
          Deleting products...
        </div>
      )}
    </div>
  );
}