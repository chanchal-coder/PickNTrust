import { useState } from 'react';
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
  createdAt?: string;
}

export default function CategoryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: 'fas fa-tag',
    color: '#6366F1'
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
        color: '#6366F1'
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

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }
    addCategoryMutation.mutate(newCategory);
  };

  const handleDeleteCategory = (categoryId: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(categoryId);
    }
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
          <CardTitle>Add New Category</CardTitle>
          <CardDescription className="text-blue-200">
            Create a new category for organizing products
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
            <form onSubmit={handleAddCategory} className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Icon</label>
                  <select
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white"
                  >
                    {commonIcons.map(icon => (
                      <option key={icon} value={icon}>
                        {icon.replace('fas fa-', '').replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex items-center">
                    <i className={`${newCategory.icon} text-xl mr-2`}></i>
                    <span className="text-sm text-gray-700">Preview</span>
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

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={addCategoryMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {addCategoryMutation.isPending ? 'Adding...' : 'Add Category'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsAddingCategory(false)}
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
          <CardTitle>Manage Categories ({categories.length})</CardTitle>
          <CardDescription className="text-blue-200">
            View and manage all categories
          </CardDescription>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category: Category) => (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: category.color }}
                      >
                        <i className={`${category.icon} text-white`}></i>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={deleteCategoryMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
