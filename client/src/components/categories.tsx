import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Categories() {
  const { data: categories, isLoading } = useQuery({
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
      <section className="py-12" style={{ backgroundColor: '#1e293b' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-green-400 mb-8">Browse Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[...Array(36)].map((_, i) => (
              <div key={i} className="bg-gray-600 rounded-[20px] p-6 animate-pulse min-h-[140px]"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12" style={{ backgroundColor: '#1e293b' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="relative">
            <h2 className="text-3xl font-bold text-green-400 mb-2">Browse Categories</h2>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold"
            >
              + Add Category
            </button>
          )}
        </div>

        {/* Add Category Form - Admin Only */}
        {isAdmin && showAddForm && (
          <div className="bg-gray-700 rounded-lg p-6 mb-8">
            <h4 className="text-lg font-semibold text-blue-400 mb-4">Add New Category</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-gray-600 border-gray-500 text-white"
                  placeholder="e.g., Sports"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-gray-600 border-gray-500 text-white"
                  placeholder="Brief description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icon (FontAwesome class)</label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-gray-600 border-gray-500 text-white"
                  placeholder="e.g., fas fa-dumbbell"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Color (hex code)</label>
                <input
                  type="text"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-gray-600 border-gray-500 text-white"
                  placeholder="e.g., #6366F1"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddCategory}
                disabled={addCategoryMutation.isPending}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {addCategoryMutation.isPending ? 'Adding...' : 'Add Category'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* 6x6 Grid Layout - EXACTLY matching the image with perfect styling */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.isArray(categories) && categories.map((category: any) => (
            <Link 
              key={category.id}
              href={`/category/${encodeURIComponent(category.name)}`}
              className={`group relative rounded-[20px] p-6 text-white text-center hover:transform hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl block min-h-[140px] flex flex-col justify-center items-center ${
                category.name === 'AI Apps & Services' 
                  ? 'ring-2 ring-yellow-400 ring-opacity-60' 
                  : ''
              }`}
              style={{ 
                background: `linear-gradient(180deg, ${category.color}E6 0%, ${category.color}CC 100%)`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* NEW badge for AI category - positioned exactly like in image */}
              {category.name === 'AI Apps & Services' && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full z-20">
                  NEW!
                </div>
              )}
              
              {/* Pure White Icon - FontAwesome icons */}
              <div className={`text-4xl mb-3 ${category.name === 'AI Apps & Services' ? 'animate-pulse' : ''}`} 
                   style={{ 
                     color: '#ffffff',
                     filter: 'brightness(1) contrast(1)',
                     fontWeight: '300',
                     strokeWidth: '2px'
                   }}>
                <i className={category.icon}></i>
              </div>
              
              {/* Bold Title - Pure White, Semi-bold */}
              <h3 className="font-semibold text-sm leading-tight mb-2 text-center text-white" 
                  style={{ 
                    color: '#ffffff',
                    fontWeight: '600',
                    letterSpacing: '0.025em'
                  }}>
                {category.name}
              </h3>
              
              {/* Subtitle - Lighter White, 80% opacity */}
              <p className="text-xs leading-tight text-center" 
                 style={{ 
                   color: '#ffffff',
                   opacity: '0.8',
                   fontWeight: '400',
                   letterSpacing: '0.025em'
                 }}>
                {category.description}
              </p>

              {/* Subtle inner highlight for neumorphic effect */}
              <div className="absolute inset-0 rounded-[20px] bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
