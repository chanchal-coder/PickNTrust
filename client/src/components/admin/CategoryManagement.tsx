import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  parentId?: number | null;
  isForProducts?: boolean;
  isForServices?: boolean;
  isForAIApps?: boolean;
  displayOrder?: number;
  createdAt?: string;
}

// Curated category presets to be surfaced in admin management
const CURATED_PRESETS: Array<Partial<Category> & { name: string }> = [
  { name: 'Prime Picks', description: 'Premium curated products', icon: 'fas fa-star', color: '#A855F7', isForProducts: true, displayOrder: 10 },
  { name: 'Value Picks', description: 'Best value curated products', icon: 'fas fa-tags', color: '#10B981', isForProducts: true, displayOrder: 20 },
  { name: 'Click Picks', description: 'Top click-through selections', icon: 'fas fa-bolt', color: '#F59E0B', isForProducts: true, displayOrder: 30 },
  { name: 'Cue Picks', description: 'Smart selections curated with precision', icon: 'fas fa-check-circle', color: '#3B82F6', isForProducts: true, displayOrder: 40 },
  { name: 'Global Picks', description: 'Curated products from across the world', icon: 'fas fa-globe', color: '#6366F1', isForProducts: true, displayOrder: 50 },
  { name: 'Deals Hub', description: 'Best deals across categories', icon: 'fas fa-fire', color: '#DC2626', isForProducts: true, displayOrder: 60 },
  { name: 'Loot Box', description: 'Special curated surprises', icon: 'fas fa-gift', color: '#EC4899', isForProducts: true, displayOrder: 70 },
];
const CURATED_NAMES_LOWER = new Set(CURATED_PRESETS.map(p => p.name.toLowerCase()));
const isCuratedName = (name: string) => CURATED_NAMES_LOWER.has(String(name || '').trim().toLowerCase());

export default function CategoryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  // Filter state: all | products | services | apps
  const [filterMode, setFilterMode] = useState<'all' | 'products' | 'services' | 'apps'>('all');
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: 'fas fa-tag',
    color: '#6366F1',
    parentId: null as number | null,
    isForProducts: false,
    isForServices: false,
    isForAIApps: false,
    displayOrder: 0
  });

  // Fetch categories
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    retry: 1
  });

  // Identify curated presets that are missing as parent categories
  const missingCurated = Array.isArray(categories)
    ? CURATED_PRESETS.filter(p => !categories.some((c: Category) => !c.parentId && String(c.name || '').trim().toLowerCase() === p.name.toLowerCase()))
    : CURATED_PRESETS;

  // Clear selection on filter change to avoid stale selections
  useEffect(() => {
    setSelectedIds([]);
  }, [filterMode]);

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      const adminPassword = 'pickntrust2025'; // Use the admin password
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: adminPassword,
          ...categoryData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add category');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setNewCategory({
        name: '',
        description: '',
        icon: 'fas fa-tag',
        color: '#6366F1',
        parentId: null,
        isForProducts: false,
        isForServices: false,
        isForAIApps: false,
        displayOrder: 0
      });
      setIsAddingCategory(false);
      toast({
        title: 'Success',
        description: 'Category added successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add category',
        variant: 'destructive',
      });
    }
  });

  // Seed curated categories that are missing
  const seedCuratedCategories = async () => {
    try {
      for (const preset of missingCurated) {
        await addCategoryMutation.mutateAsync({
          name: preset.name,
          description: preset.description || '',
          icon: preset.icon || 'fas fa-star',
          color: preset.color || '#A855F7',
          parentId: null,
          isForProducts: preset.isForProducts ?? true,
          isForServices: preset.isForServices ?? false,
          isForAIApps: preset.isForAIApps ?? false,
          displayOrder: preset.displayOrder ?? 0,
        } as any);
      }
      toast({ title: 'Curated categories added', description: 'Missing curated parents have been created.' });
    } catch (e: any) {
      toast({ title: 'Seeding error', description: e?.message || 'Failed to seed curated categories', variant: 'destructive' });
    }
  };

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, categoryData }: { categoryId: number; categoryData: any }) => {
      const adminPassword = 'pickntrust2025';
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: adminPassword,
          ...categoryData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update category');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setEditingCategory(null);
      setNewCategory({
        name: '',
        description: '',
        icon: 'fas fa-tag',
        color: '#6366F1',
        parentId: null,
        isForProducts: false,
        isForServices: false,
        isForAIApps: false,
        displayOrder: 0
      });
      setIsAddingCategory(false);
      toast({
        title: 'Success',
        description: 'Category updated successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category',
        variant: 'destructive',
      });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const adminPassword = 'pickntrust2025';
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: 'Success',
        description: 'Category deleted successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      });
    }
  });

  // Bulk delete selected categories
  const bulkDeleteCategoriesMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const adminPassword = 'pickntrust2025';
      const response = await fetch('/api/admin/categories/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword, ids }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to bulk delete categories');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setSelectedIds([]);
      toast({
        title: 'Success',
        description: 'Selected categories deleted successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to bulk delete categories',
        variant: 'destructive',
      });
    }
  });

  // Delete all categories
  const deleteAllCategoriesMutation = useMutation({
    mutationFn: async () => {
      const adminPassword = 'pickntrust2025';
      const response = await fetch('/api/admin/categories/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete all categories');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setSelectedIds([]);
      toast({
        title: 'Success',
        description: 'All categories deleted successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete all categories',
        variant: 'destructive',
      });
    }
  });

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const selectAll = () => {
    const allIds = categories.map((cat: Category) => cat.id);
    setSelectedIds(allIds);
  };

  const clearSelection = () => setSelectedIds([]);

  const handleBulkDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Delete ${selectedIds.length} selected categories (including their subcategories)?`)) {
      bulkDeleteCategoriesMutation.mutate(selectedIds);
    }
  };

  const handleDeleteAll = () => {
    if (confirm('Delete ALL categories and subcategories? This cannot be undone.')) {
      deleteAllCategoriesMutation.mutate();
    }
  };

  // Reorder categories mutation - using fixed endpoint on port 5001
  const reorderCategoriesMutation = useMutation({
    mutationFn: async (categoryOrders: { id: number; displayOrder: number }[]) => {
      const adminPassword = 'pickntrust2025';
      const response = await fetch('/api/admin/categories/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: adminPassword,
          categoryOrders
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reorder categories');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: 'Success',
        description: 'Category order updated successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reorder categories',
        variant: 'destructive',
      });
    }
  });

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategory.name.trim();
    if (!name) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }
    // Client-side duplicate prevention (case-insensitive, trimmed)
    try {
      const existingNames = (categories as any[])
        .map((c: any) => (typeof c === 'string' ? c : c?.name))
        .filter(Boolean)
        .map((n: any) => String(n).trim().toLowerCase());
      if (existingNames.includes(name.toLowerCase())) {
        toast({
          title: 'Duplicate Category',
          description: 'A category with this name already exists.',
          variant: 'destructive',
        });
        return;
      }
    } catch {}
    addCategoryMutation.mutate({ ...newCategory, name });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      parentId: category.parentId ?? null,
      isForProducts: category.isForProducts ?? false,
      isForServices: category.isForServices ?? false,
      isForAIApps: category.isForAIApps ?? false,
      displayOrder: category.displayOrder ?? 0
    });
    setIsAddingCategory(true);
    
    // Scroll to the top of the page to show the edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !newCategory.name.trim()) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }
    // Client-side duplicate prevention on update
    try {
      const name = newCategory.name.trim();
      const existingNames = (categories as any[])
        .filter((c: any) => (typeof c === 'string' ? true : c?.id !== editingCategory.id))
        .map((c: any) => (typeof c === 'string' ? c : c?.name))
        .filter(Boolean)
        .map((n: any) => String(n).trim().toLowerCase());
      if (existingNames.includes(name.toLowerCase())) {
        toast({
          title: 'Duplicate Category',
          description: 'Another category with this name already exists.',
          variant: 'destructive',
        });
        return;
      }
    } catch {}
    updateCategoryMutation.mutate({
      categoryId: editingCategory.id,
      categoryData: newCategory
    });
  };

  const handleDeleteCategory = (categoryId: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategory({
      name: '',
      description: '',
      icon: 'fas fa-tag',
      color: '#6366F1',
      parentId: null,
      isForProducts: false,
      isForServices: false,
      isForAIApps: false,
      displayOrder: 0
    });
    setIsAddingCategory(false);
  };

  // Helper functions for reordering
  const moveCategory = (categoryId: number, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex((cat: Category) => cat.id === categoryId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    // Create new order array
    const reorderedCategories = [...categories];
    const [movedCategory] = reorderedCategories.splice(currentIndex, 1);
    reorderedCategories.splice(newIndex, 0, movedCategory);

    // Generate new display orders
    const categoryOrders = reorderedCategories.map((cat, index) => ({
      id: cat.id,
      displayOrder: (index + 1) * 10
    }));

    reorderCategoriesMutation.mutate(categoryOrders);
  };

  const canMoveUp = (categoryId: number) => {
    const currentIndex = categories.findIndex((cat: Category) => cat.id === categoryId);
    return currentIndex > 0;
  };

  const canMoveDown = (categoryId: number) => {
    const currentIndex = categories.findIndex((cat: Category) => cat.id === categoryId);
    return currentIndex < categories.length - 1;
  };

  const handleDisplayOrderChange = (categoryId: number, newOrder: number) => {
    // Update the category's display order
    const categoryOrders = [{
      id: categoryId,
      displayOrder: newOrder
    }];
    
    reorderCategoriesMutation.mutate(categoryOrders);
  };

  const toggleCategoryCollapse = (categoryId: number) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const isCategoryCollapsed = (categoryId: number) => {
    return collapsedCategories.has(categoryId);
  };

  const commonIcons = [
    'fas fa-laptop', 'fas fa-tshirt', 'fas fa-home', 'fas fa-heart',
    'fas fa-dumbbell', 'fas fa-book', 'fas fa-gamepad', 'fas fa-car',
    'fas fa-suitcase', 'fas fa-paw', 'fas fa-briefcase', 'fas fa-leaf',
    'fas fa-baby', 'fas fa-music', 'fas fa-palette', 'fas fa-utensils',
    'fas fa-gem', 'fas fa-camera', 'fas fa-tools', 'fas fa-trophy',
    'fas fa-code', 'fas fa-calendar', 'fas fa-gift', 'fas fa-graduation-cap',
    'fas fa-play', 'fas fa-cloud', 'fas fa-shield-alt', 'fas fa-server',
    'fas fa-paint-brush', 'fas fa-tasks', 'fas fa-chart-line', 'fas fa-shopping-cart',
    'fas fa-comments', 'fas fa-coins', 'fas fa-robot'
  ];

  const commonColors = [
    '#6366F1', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#14B8A6', '#6B7280', '#22C55E',
    '#F472B6', '#A855F7', '#FB7185', '#FBBF24', '#C084FC', '#60A5FA',
    '#34D399', '#F87171', '#818CF8', '#FB923C', '#A78BFA'
  ];

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Categories</CardTitle>
          <CardDescription className="text-blue-200">
            Failed to load categories. Using fallback data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            The categories are being displayed from fallback data. 
            Check your server connection and API endpoints.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Category Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
          </CardTitle>
          <CardDescription className="text-blue-200">
            {editingCategory ? 'Update the category details below' : 'Create a new category for organizing products'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAddingCategory ? (
            <Button 
              onClick={() => setIsAddingCategory(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Category
            </Button>
          ) : (
            <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Category Name</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="e.g., Electronics & Gadgets"
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Description</label>
                  <input
                    type="text"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="e.g., Latest tech & gadgets"
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              {/* Parent Category Selector */}
              <div>
                <label className="block text-sm font-medium mb-2 text-blue-300">Parent Category (Optional)</label>
                <select
                  value={newCategory.parentId || ''}
                  onChange={(e) => setNewCategory({ ...newCategory, parentId: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white"
                >
                  <option value="">None (Main Category)</option>
                  {categories
                    .filter((cat: Category) => !cat.parentId && cat.id !== editingCategory?.id)
                    .map((category: Category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  }
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Select a parent category to create a subcategory, or leave as "None" for a main category.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Icon</label>
                  <select
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white mb-2"
                  >
                    {commonIcons.map(icon => (
                      <option key={icon} value={icon}>
                        {icon.replace('fas fa-', '').replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                  
                  {/* Custom Icon Input */}
                  <div className="mb-2">
                    <label className="block text-xs font-medium mb-1 text-blue-300">Or enter custom icon class:</label>
                    <input
                      type="text"
                      value={newCategory.icon}
                      onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                      placeholder="e.g., fas fa-star, fab fa-apple, etc."
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400 text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Use FontAwesome classes like "fas fa-star" or "fab fa-apple"
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <i className={`${newCategory.icon} text-xl mr-2 text-blue-400`}></i>
                    <span className="text-sm text-blue-300">Preview</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Color</label>
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    {commonColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCategory({ ...newCategory, color })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          newCategory.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="w-full h-10 border border-slate-600 rounded-lg bg-slate-800"
                  />
                </div>
              </div>

              {/* Category Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 text-blue-300">Category Type</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCategory.isForProducts}
                      onChange={(e) => setNewCategory({ ...newCategory, isForProducts: e.target.checked })}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-blue-300">For Products</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCategory.isForServices}
                      onChange={(e) => setNewCategory({ ...newCategory, isForServices: e.target.checked })}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-blue-300">For Services</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCategory.isForAIApps}
                      onChange={(e) => setNewCategory({ ...newCategory, isForAIApps: e.target.checked })}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-blue-300">For AI Apps</span>
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Select which type of content this category should be used for
                </p>
              </div>

              {/* Display Order Field */}
              <div>
                <label className="block text-sm font-medium mb-2 text-blue-300">Display Order</label>
                <input
                  type="number"
                  value={newCategory.displayOrder}
                  onChange={(e) => setNewCategory({ ...newCategory, displayOrder: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 0, 1, 2, 10, 20..."
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                  min="0"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Lower numbers appear first. Use 0, 1, 2... for sequential order, or 10, 20, 30... to allow easy insertion.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={editingCategory ? updateCategoryMutation.isPending : addCategoryMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {editingCategory 
                    ? (updateCategoryMutation.isPending ? 'Updating...' : 'Update Category')
                    : (addCategoryMutation.isPending ? 'Adding...' : 'Add Category')
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Manage Categories ({categories.length})</CardTitle>
              <CardDescription className="text-blue-200">
                View and manage all categories
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Filter control */}
              <div className="flex items-center gap-2 mr-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">Filter:</label>
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value as any)}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All</option>
                  <option value="products">Products</option>
                  <option value="services">Services</option>
                  <option value="apps">AI & Apps</option>
                </select>
              </div>
              {/* Seed curated parents button (visible when some curated are missing) */}
              {missingCurated.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={seedCuratedCategories}
                  disabled={addCategoryMutation.isPending}
                  className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  title="Add curated parent categories"
                >
                  <i className="fas fa-star mr-1" />
                  Add Curated Parents ({missingCurated.length})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="border-gray-300 dark:border-gray-600"
              >
                <i className="fas fa-check-square mr-1" />
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="border-gray-300 dark:border-gray-600"
              >
                <i className="fas fa-eraser mr-1" />
                Clear
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={selectedIds.length === 0 || bulkDeleteCategoriesMutation.isPending}
                onClick={handleBulkDeleteSelected}
                className="bg-red-600 hover:bg-red-700"
              >
                <i className="fas fa-trash mr-1" />
                Delete Selected ({selectedIds.length})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteAllCategoriesMutation.isPending}
                onClick={handleDeleteAll}
                className="bg-red-700 hover:bg-red-800"
              >
                <i className="fas fa-trash-alt mr-1" />
                Delete All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No categories found. Add your first category above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Helper function to organize categories hierarchically */}
              {(() => {
                const matchesFilter = (cat: Category) => {
                  switch (filterMode) {
                    case 'products':
                      return !!cat.isForProducts;
                    case 'services':
                      return !!cat.isForServices;
                    case 'apps':
                      return !!cat.isForAIApps;
                    case 'all':
                    default:
                      return true;
                  }
                };

                // Build subcategory map for all categories, but filter per current mode
                const subcategoriesMap = categories.reduce((acc: { [key: number]: Category[] }, cat: Category) => {
                  if (cat.parentId) {
                    if (!acc[cat.parentId]) acc[cat.parentId] = [];
                    // Only include subcategory if it matches the filter
                    if (matchesFilter(cat)) acc[cat.parentId].push(cat);
                  }
                  return acc;
                }, {} as { [key: number]: Category[] });

                // Visible main categories are those matching the filter OR having at least one matching subcategory
                const mainCategories = categories.filter((cat: Category) => {
                  if (cat.parentId) return false; // only top-level
                  return matchesFilter(cat) || (subcategoriesMap[cat.id] && subcategoriesMap[cat.id].length > 0);
                });

                return mainCategories.map((category: Category) => (
                  <div key={category.id} className="space-y-2">
                    {/* Main Category */}
                    <div
                      className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          {/* Collapse/Expand Button */}
                          {subcategoriesMap[category.id] && subcategoriesMap[category.id].length > 0 && (
                            <button
                              onClick={() => toggleCategoryCollapse(category.id)}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              title={isCategoryCollapsed(category.id) ? 'Expand subcategories' : 'Collapse subcategories'}
                            >
                              <i className={`fas ${isCategoryCollapsed(category.id) ? 'fa-chevron-right' : 'fa-chevron-down'} text-gray-600 dark:text-gray-400 text-sm`}></i>
                            </button>
                          )}
                          {/* Selection checkbox */}
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={selectedIds.includes(category.id)}
                            onChange={() => toggleSelect(category.id)}
                            title="Select category"
                          />
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md"
                            style={{ backgroundColor: category.color }}
                          >
                            <i className={`${category.icon} text-white text-lg`}></i>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{category.name}</h3>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                Main Category
                              </span>
                              {/* Curated badge for curated parent categories */}
                              {isCuratedName(category.name) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                                  Curated
                                </span>
                              )}
                              {subcategoriesMap[category.id] && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                  {subcategoriesMap[category.id].length} subcategories
                                </span>
                              )}
                              {subcategoriesMap[category.id] && subcategoriesMap[category.id].length > 0 && (
                                <button
                                  onClick={() => toggleCategoryCollapse(category.id)}
                                  className="ml-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                >
                                  {isCategoryCollapsed(category.id) ? 'Show' : 'Hide'} subcategories
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{category.description}</p>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {category.isForProducts && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  Products
                                </span>
                              )}
                              {category.isForServices && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Services
                                </span>
                              )}
                              {category.isForAIApps && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                  AI Apps
                                </span>
                              )}
                              {!category.isForProducts && !category.isForServices && !category.isForAIApps && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                  General
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {/* Display Order Number Input */}
                          <div className="flex items-center gap-1">
                            <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Order:</label>
                            <input
                              type="number"
                              value={category.displayOrder || 0}
                              onChange={(e) => handleDisplayOrderChange(category.id, parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              min="0"
                              step="10"
                              title="Display order (lower numbers appear first)"
                            />
                          </div>
                          
                          {/* Display Order Controls */}
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveCategory(category.id, 'up')}
                              disabled={!canMoveUp(category.id) || reorderCategoriesMutation.isPending}
                              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20 border-gray-300 dark:border-gray-600 px-2"
                              title="Move up"
                            >
                              <i className="fas fa-arrow-up text-xs"></i>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveCategory(category.id, 'down')}
                              disabled={!canMoveDown(category.id) || reorderCategoriesMutation.isPending}
                              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20 border-gray-300 dark:border-gray-600 px-2"
                              title="Move down"
                            >
                              <i className="fas fa-arrow-down text-xs"></i>
                            </Button>
                          </div>
                          
                          {/* Action Controls */}
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-300 dark:border-blue-600"
                            >
                              <i className="fas fa-edit mr-1"></i>
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              disabled={deleteCategoryMutation.isPending}
                              className="text-white bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700"
                            >
                              <i className="fas fa-trash mr-1"></i>
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subcategories */}
                        {subcategoriesMap[category.id] && !isCategoryCollapsed(category.id) && (
                          <div className="ml-8 space-y-2 animate-in slide-in-from-top-2 duration-200">
                            {subcategoriesMap[category.id].map((subcategory: Category) => (
                              <div
                                key={subcategory.id}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-900/50"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center space-x-3 flex-1">
                                    {/* Selection checkbox for subcategory */}
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4"
                                      checked={selectedIds.includes(subcategory.id)}
                                      onChange={() => toggleSelect(subcategory.id)}
                                      title="Select subcategory"
                                    />
                                    <div
                                      className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
                                      style={{ backgroundColor: subcategory.color }}
                                    >
                                      <i className={`${subcategory.icon} text-white text-sm`}></i>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-base">{subcategory.name}</h4>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                      Subcategory
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subcategory.description}</p>
                                  <div className="flex gap-1 mt-2 flex-wrap">
                                    {subcategory.isForProducts && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        Products
                                      </span>
                                    )}
                                    {subcategory.isForServices && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        Services
                                      </span>
                                    )}
                                    {subcategory.isForAIApps && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                        AI Apps
                                      </span>
                                    )}
                                    {!subcategory.isForProducts && !subcategory.isForServices && !subcategory.isForAIApps && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                        General
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditCategory(subcategory)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-300 dark:border-blue-600"
                                >
                                  <i className="fas fa-edit mr-1"></i>
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteCategory(subcategory.id)}
                                  disabled={deleteCategoryMutation.isPending}
                                  className="text-white bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700"
                                >
                                  <i className="fas fa-trash mr-1"></i>
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
