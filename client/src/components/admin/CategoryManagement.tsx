import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
}

export default function CategoryManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon: 'fas fa-tag',
    color: '#6366F1'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    retry: false
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData & { password: string }) => {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to add category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setShowAddForm(false);
      setFormData({ name: '', description: '', icon: 'fas fa-tag', color: '#6366F1' });
      setAdminPassword('');
      toast({ title: 'Success', description: 'Category added successfully!' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryFormData & { password: string } }) => {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setEditingCategory(null);
      setFormData({ name: '', description: '', icon: 'fas fa-tag', color: '#6366F1' });
      setAdminPassword('');
      toast({ title: 'Success', description: 'Category updated successfully!' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!response.ok) throw new Error('Failed to delete category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: 'Success', description: 'Category deleted successfully!' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) {
      toast({ title: 'Error', description: 'Admin password is required', variant: 'destructive' });
      return;
    }

    const data = { ...formData, password: adminPassword };

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      addCategoryMutation.mutate(data);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color
    });
    setShowAddForm(true);
  };

  const handleDelete = (category: Category) => {
    if (!adminPassword) {
      toast({ title: 'Error', description: 'Admin password is required', variant: 'destructive' });
      return;
    }

    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      deleteCategoryMutation.mutate({ id: category.id, password: adminPassword });
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: 'fas fa-tag', color: '#6366F1' });
    setAdminPassword('');
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Category Management</h2>
        <div className="flex gap-4 items-center">
          <input
            type="password"
            placeholder="Admin Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Add Category
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon (FontAwesome class)
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="fas fa-tag"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories.map((category: Category) => (
          <div
            key={category.id}
            className="relative group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
            style={{ borderColor: category.color + '20' }}
          >
            {/* Special effects for AI Apps & Services */}
            {category.name === 'AI Apps & Services' && (
              <>
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                  NEW!
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl"></div>
              </>
            )}
            
            <div className="relative z-10">
              <i className={`${category.icon} text-2xl mb-3 ${category.name === 'AI Apps & Services' ? 'animate-pulse text-yellow-200' : ''}`} style={{ color: category.color }}></i>
              <h4 className={`font-bold text-sm mb-1 ${category.name === 'AI Apps & Services' ? 'text-yellow-100' : 'text-gray-900 dark:text-white'}`}>
                {category.name}
              </h4>
              <p className={`text-xs opacity-90 ${category.name === 'AI Apps & Services' ? 'text-yellow-200' : 'text-gray-600 dark:text-gray-300'}`}>
                {category.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={() => handleEdit(category)}
                className="bg-blue-600 bg-opacity-75 text-white p-1 rounded-full text-xs hover:bg-opacity-100"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button
                onClick={() => handleDelete(category)}
                className="bg-red-600 bg-opacity-75 text-white p-1 rounded-full text-xs hover:bg-opacity-100"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Management Guide */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          <i className="fas fa-info-circle mr-2"></i>
          Category Management Guide
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <h4 className="font-semibold mb-2">Features:</h4>
            <ul className="space-y-1">
              <li>• Add new categories with custom icons and colors</li>
              <li>• Edit existing category details</li>
              <li>• Delete unused categories</li>
              <li>• Real-time sync with frontend display</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Pro Tips:</h4>
            <ul className="space-y-1">
              <li>• Use FontAwesome classes (fas fa-*) for icons</li>
              <li>• Choose colors that complement your brand</li>
              <li>• Keep names concise (2-3 words max)</li>
              <li>• Test changes on frontend immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
