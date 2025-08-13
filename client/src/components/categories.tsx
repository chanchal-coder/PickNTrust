import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from '@/hooks/use-toast';

// Define Category type locally to avoid schema conflicts
interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export default function Categories() {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: '', color: '' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check admin status
  useEffect(() => {
    const adminSession = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminSession === 'active');

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pickntrust-admin-session') {
        setIsAdmin(e.newValue === 'active');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (category: any) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      if (!response.ok) throw new Error('Failed to add category');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Category Added!', description: 'New category created successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setShowAddForm(false);
      setNewCategory({ name: '', description: '', icon: '', color: '' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add category.', variant: 'destructive' });
    },
  });

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast({ title: 'Name Required', description: 'Please enter a category name.', variant: 'destructive' });
      return;
    }
    addCategoryMutation.mutate(newCategory);
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-white">Browse Categories</h3>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              + Add Category
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="bg-gray-700 rounded-2xl p-4 animate-pulse h-24"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-white">Browse Categories</h3>
          {isAdmin && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              + Add Category
            </button>
          )}
        </div>

        {/* Add Category Form - Admin Only */}
        {isAdmin && showAddForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">Add New Category</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
                  placeholder="e.g., Sports"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
                  placeholder="Brief description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icon (FontAwesome class)</label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
                  placeholder="e.g., fas fa-dumbbell"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Color (Hex code)</label>
                <input
                  type="text"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white"
                  placeholder="e.g., #3B82F6"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddCategory}
                disabled={addCategoryMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {addCategoryMutation.isPending ? 'Adding...' : 'Add Category'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
          {categories?.map((category) => (
            <Link 
              key={category.id}
              href={`/category/${encodeURIComponent(category.name)}`}
              className={`rounded-2xl p-4 text-white text-center hover:transform hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg block relative group min-h-[100px] flex flex-col justify-center ${
                category.name === 'AI Apps & Services' 
                  ? 'ring-2 ring-yellow-400 ring-opacity-60 animate-pulse shadow-2xl' 
                  : ''
              }`}
              style={{ backgroundColor: category.color }}
            >
              {category.name === 'AI Apps & Services' && (
                <>
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                    NEW! 🔥
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl"></div>
                </>
              )}
              <div className="relative z-10">
                <i className={`${category.icon} text-2xl mb-2 block ${category.name === 'AI Apps & Services' ? 'animate-pulse text-yellow-200' : ''}`}></i>
                <h4 className={`font-bold text-xs leading-tight ${category.name === 'AI Apps & Services' ? 'text-yellow-100' : ''}`}>
                  {category.name}
                </h4>
                <p className={`text-xs opacity-90 mt-1 ${category.name === 'AI Apps & Services' ? 'text-yellow-200' : ''}`}>
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
