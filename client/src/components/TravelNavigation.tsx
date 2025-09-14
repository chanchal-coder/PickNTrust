import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit, Plus, Trash2, Save, X } from 'lucide-react';
import AdminLogin from '@/components/AdminLogin';

interface TravelCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  productCount?: number;
}

interface TravelNavigationProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  isAdmin?: boolean;
  categoryCount?: number;
}

const defaultTravelCategories: TravelCategory[] = [
  {
    id: 1,
    name: 'Flights',
    slug: 'flights',
    icon: 'fas fa-plane',
    color: '#2196F3', // Sky Blue / Light Blue - Material Design
    description: 'Domestic and International Flight Bookings',
    isActive: true,
    displayOrder: 1
  },
  {
    id: 2,
    name: 'Hotels',
    slug: 'hotels',
    icon: 'fas fa-bed',
    color: '#FF9800', // Orange / Amber - Material Design
    description: 'Hotel Bookings and Accommodations',
    isActive: true,
    displayOrder: 2
  },
  {
    id: 3,
    name: 'Packages',
    slug: 'packages',
    icon: 'fas fa-suitcase',
    color: '#9C27B0', // Purple / Violet - Material Design
    description: 'Complete Travel Packages',
    isActive: true,
    displayOrder: 3
  },
  {
    id: 4,
    name: 'Tours',
    slug: 'tours',
    icon: 'fas fa-map-marked-alt',
    color: '#F44336', // Red / Tomato Red - Material Design
    description: 'Guided Tours and Experiences',
    isActive: true,
    displayOrder: 4
  },
  {
    id: 5,
    name: 'Bus',
    slug: 'bus',
    icon: 'fas fa-bus',
    color: '#FFC107', // Orange-Yellow / Mustard - Material Design
    description: 'Bus Ticket Bookings',
    isActive: true,
    displayOrder: 5
  },
  {
    id: 6,
    name: 'Train',
    slug: 'train',
    icon: 'fas fa-train',
    color: '#4CAF50', // Green / Leaf Green - Material Design
    description: 'Railway Ticket Bookings',
    isActive: true,
    displayOrder: 6
  },
  {
    id: 7,
    name: 'Car Rental',
    slug: 'car-rental',
    icon: 'fas fa-car',
    color: '#3F51B5', // Blue-Violet / Indigo - Material Design
    description: 'Car Rental Services',
    isActive: true,
    displayOrder: 7
  },
  {
    id: 8,
    name: 'Cruises',
    slug: 'cruises',
    icon: 'fas fa-ship',
    color: '#009688', // Teal / Aqua Green-Blue - Material Design
    description: 'Cruise Bookings',
    isActive: true,
    displayOrder: 8
  },
  {
    id: 9,
    name: 'Tickets',
    slug: 'tickets',
    icon: 'fas fa-ticket-alt',
    color: '#E91E63', // Violet / Bright Purple - Material Design
    description: 'Event and Activity Tickets',
    isActive: true,
    displayOrder: 9
  }
];

export default function TravelNavigation({ selectedCategory, onCategoryChange, isAdmin = false, categoryCount = 0 }: TravelNavigationProps) {
  const [editingCategory, setEditingCategory] = useState<TravelCategory | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<TravelCategory>>({});
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [localIsAdmin, setLocalIsAdmin] = useState(false);

  // Check admin status on component mount and when prop changes
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    const adminStatus = adminAuth === 'active' || isAdmin;
    setLocalIsAdmin(adminStatus);
  }, [isAdmin]);

  const handleAdminLogin = () => {
    setLocalIsAdmin(true);
    setShowAdminLogin(false);
  };

  const handleAdminAction = () => {
    if (!localIsAdmin) {
      setShowAdminLogin(true);
      return;
    }
    setIsAddingNew(true);
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch travel categories
  const { data: categories = defaultTravelCategories } = useQuery<TravelCategory[]>({
    queryKey: ['/api/travel-categories'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/travel-categories');
        if (response.ok) {
          const data = await response.json();
          // Return API data if it's an array, otherwise use defaults
          return Array.isArray(data) ? data : defaultTravelCategories;
        }
        throw new Error('Failed to fetch categories');
      } catch (error) {
        console.warn('Failed to fetch travel categories, using defaults:', error);
        throw error; // Let React Query handle the error and use the default fallback
      }
    },
    staleTime: 1 * 60 * 1000, // Reduced stale time for better updates
    refetchOnWindowFocus: false
  });

  // Fetch product counts for each category
  const { data: productCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ['/api/travel-deals/counts'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/travel-deals/counts');
        if (response.ok) {
          return await response.json();
        }
        return {};
      } catch (error) {
        return {};
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (category: TravelCategory) => {
      const response = await fetch(`/api/travel-categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
      });
      if (!response.ok) throw new Error('Failed to update category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/travel-categories'] });
      toast({ title: 'Category updated successfully' });
      setEditingCategory(null);
    },
    onError: () => {
      toast({ title: 'Failed to update category', variant: 'destructive' });
    }
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (category: Partial<TravelCategory>) => {
      const response = await fetch('/api/travel-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...category,
          displayOrder: categories.length + 1,
          isActive: true
        })
      });
      if (!response.ok) throw new Error('Failed to add category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/travel-categories'] });
      toast({ title: 'Category added successfully' });
      setIsAddingNew(false);
      setNewCategory({});
    },
    onError: () => {
      toast({ title: 'Failed to add category', variant: 'destructive' });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const response = await fetch(`/api/travel-categories/${categoryId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/travel-categories'] });
      toast({ title: 'Category deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete category', variant: 'destructive' });
    }
  });

  const handleSaveEdit = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate(editingCategory);
    }
  };

  const handleAddNew = () => {
    if (!newCategory.name || !newCategory.slug || !newCategory.icon) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Name, Icon, Route Path)",
        variant: "destructive"
      });
      return;
    }

    const categoryData = {
      name: newCategory.name,
      slug: newCategory.slug,
      icon: newCategory.icon,
      color: newCategory.color || '#3B82F6',
      description: newCategory.description || ''
    };

    addCategoryMutation.mutate(categoryData);
  };

  const handleDelete = (categoryId: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const activeCategories = categories
    .filter(cat => cat.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg mb-8 overflow-hidden">
      {/* Admin Header - Only show for admin users */}
      {localIsAdmin && (
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-white">Travel Categories</h3>
            <p className="text-gray-400 text-sm">Manage travel navigation</p>
          </div>
          <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Travel Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-200 mb-2">Category Name *</label>
                                  <Input
                                    placeholder=""
                                    value={newCategory.name || ''}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                    className="bg-gray-600 border-gray-500 text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-200 mb-2">Icon *</label>
                                  <Input
                                    placeholder="fas fa-ticket-alt"
                                    value={newCategory.icon || ''}
                                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                                    className="bg-gray-600 border-gray-500 text-white"
                                  />
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    <button type="button" className="px-3 py-1 bg-blue-600 text-white text-xs rounded">Travel</button>
                                    <button type="button" className="px-3 py-1 bg-gray-600 text-white text-xs rounded">Stay</button>
                                    <button type="button" className="px-3 py-1 bg-gray-600 text-white text-xs rounded">Activity</button>
                                    <button type="button" className="px-3 py-1 bg-gray-600 text-white text-xs rounded">Service</button>
                                    <button type="button" className="px-3 py-1 bg-gray-600 text-white text-xs rounded">Dining</button>
                                    <button type="button" className="px-3 py-1 bg-gray-600 text-white text-xs rounded">Shopping</button>
                                    <button type="button" className="px-3 py-1 bg-gray-600 text-white text-xs rounded">Navigation</button>
                                    <button type="button" className="px-3 py-1 bg-gray-600 text-white text-xs rounded">Weather</button>
                                    <button type="button" className="px-3 py-1 bg-gray-600 text-white text-xs rounded">General</button>
                                  </div>
                                  <div className="grid grid-cols-8 gap-2 mt-3 p-3 bg-gray-700 rounded">
                                      <button type="button" onClick={() => setNewCategory({ ...newCategory, icon: 'fas fa-plane' })} className={`p-2 rounded hover:bg-gray-500 ${newCategory.icon === 'fas fa-plane' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-600'}`}><i className="fas fa-plane text-white"></i></button>
                                      <button type="button" onClick={() => setNewCategory({ ...newCategory, icon: 'fas fa-bed' })} className={`p-2 rounded hover:bg-gray-500 ${newCategory.icon === 'fas fa-bed' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-600'}`}><i className="fas fa-bed text-white"></i></button>
                                      <button type="button" onClick={() => setNewCategory({ ...newCategory, icon: 'fas fa-suitcase' })} className={`p-2 rounded hover:bg-gray-500 ${newCategory.icon === 'fas fa-suitcase' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-600'}`}><i className="fas fa-suitcase text-white"></i></button>
                                      <button type="button" onClick={() => setNewCategory({ ...newCategory, icon: 'fas fa-map-marked-alt' })} className={`p-2 rounded hover:bg-gray-500 ${newCategory.icon === 'fas fa-map-marked-alt' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-600'}`}><i className="fas fa-map-marked-alt text-white"></i></button>
                                      <button type="button" onClick={() => setNewCategory({ ...newCategory, icon: 'fas fa-bus' })} className={`p-2 rounded hover:bg-gray-500 ${newCategory.icon === 'fas fa-bus' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-600'}`}><i className="fas fa-bus text-white"></i></button>
                                      <button type="button" onClick={() => setNewCategory({ ...newCategory, icon: 'fas fa-train' })} className={`p-2 rounded hover:bg-gray-500 ${newCategory.icon === 'fas fa-train' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-600'}`}><i className="fas fa-train text-white"></i></button>
                                      <button type="button" onClick={() => setNewCategory({ ...newCategory, icon: 'fas fa-car' })} className={`p-2 rounded hover:bg-gray-500 ${newCategory.icon === 'fas fa-car' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-600'}`}><i className="fas fa-car text-white"></i></button>
                                      <button type="button" onClick={() => setNewCategory({ ...newCategory, icon: 'fas fa-ship' })} className={`p-2 rounded hover:bg-gray-500 ${newCategory.icon === 'fas fa-ship' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-600'}`}><i className="fas fa-ship text-white"></i></button>
                                      <button type="button" onClick={() => setNewCategory({ ...newCategory, icon: 'fas fa-anchor' })} className={`p-2 rounded hover:bg-gray-500 ${newCategory.icon === 'fas fa-anchor' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-600'}`}><i className="fas fa-anchor text-white"></i></button>
                                      <button type="button" onClick={() => setNewCategory({ ...newCategory, icon: 'fas fa-mountain' })} className={`p-2 rounded hover:bg-gray-500 ${newCategory.icon === 'fas fa-mountain' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-600'}`}><i className="fas fa-mountain text-white"></i></button>
                                    </div>
                                  <p className="text-xs text-yellow-400 mt-2"><i className="fas fa-lightbulb"></i> Tip: You can also type any Font Awesome icon class in the input field above</p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-200 mb-2">Description</label>
                                  <Input
                                    placeholder=""
                                    value={newCategory.description || ''}
                                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                    className="bg-gray-600 border-gray-500 text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-200 mb-2">Route Path</label>
                                  <Input
                                    placeholder="/category-name"
                                    value={newCategory.slug || ''}
                                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                                    className="bg-gray-600 border-gray-500 text-white"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={true}
                                    className="w-4 h-4"
                                  />
                                  <label className="text-sm text-gray-200">Active</label>
                                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddNew} disabled={!newCategory.name || !newCategory.slug || !newCategory.icon}>
                    <Save className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Navigation Categories - Exact UI Match */}
      <div className="relative">
        {/* Left Arrow */}
        <button className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Scrollable Categories Container */}
        <div className="overflow-x-auto scrollbar-hide mx-12">
          <div className="flex gap-6 py-4 px-4 min-w-max">
            {/* Category Buttons - Exact Match */}
            {activeCategories.map((category) => {
              const isSelected = selectedCategory === category.slug;
              const count = category.slug === selectedCategory ? categoryCount : (productCounts[category.slug] || 0);

              return (
                <div key={category.id} className="relative group">
                  <button
                    onClick={() => onCategoryChange(category.slug)}
                    className="flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105"
                  >
                    {/* Circular Icon Background - Gradient Colors with Selection Ring */}
                      <div className="relative">
                        <div 
                             className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-medium transition-all duration-200 hover:scale-105`}
                             style={{ 
                               backgroundColor: category.color,
                               boxShadow: `0 2px 8px ${category.color}40`
                             }}
                         >
                           {category.icon.startsWith('fas ') || category.icon.startsWith('fa ') ? (
                             <i className={category.icon}></i>
                           ) : (
                             <span className="text-2xl">{category.icon}</span>
                           )}
                         </div>
                        {/* Selection Ring */}
                        {isSelected && (
                          <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-white animate-pulse"></div>
                        )}
                      </div>
                    
                    {/* Category Name with Count */}
                    <span className="text-white text-sm font-medium text-center min-w-[80px]">
                      {category.name} ({count})
                    </span>
                  </button>

                  {/* Admin Edit Controls */}
                   {localIsAdmin && (
                    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Dialog open={editingCategory?.id === category.id} onOpenChange={(open) => {
                          if (!open) setEditingCategory(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-6 h-6 p-0 bg-blue-500 border-blue-500 text-white hover:bg-blue-600 rounded-full"
                              onClick={() => setEditingCategory(category)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit Travel Category</DialogTitle>
                            </DialogHeader>
                            {editingCategory && (
                              <div className="space-y-4">
                                <Input
                                  placeholder="Category Name"
                                  value={editingCategory.name}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                />
                                <Input
                                  placeholder="Category Slug"
                                  value={editingCategory.slug}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                                />
                                <Input
                                  placeholder="Icon (emoji)"
                                  value={editingCategory.icon}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                                />
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Color</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="color"
                                      value={editingCategory.color || '#3B82F6'}
                                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                                    />
                                    <Input
                                      placeholder="#3B82F6"
                                      value={editingCategory.color}
                                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                                      className="flex-1"
                                    />
                                  </div>
                                </div>
                                <Input
                                  placeholder="Description"
                                  value={editingCategory.description || ''}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                                />
                                <div className="flex gap-2">
                                  <Button onClick={handleSaveEdit}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                  </Button>
                                  <Button variant="outline" onClick={() => setEditingCategory(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-6 h-6 p-0 bg-red-500 border-red-500 text-white hover:bg-red-600 rounded-full"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Arrow */}
        <button className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Category Description */}
      {selectedCategory && (
        <div className="mt-6 text-center">
          <p className="text-slate-300 text-sm">
            {activeCategories.find(cat => cat.slug === selectedCategory)?.description}
          </p>
        </div>
      )}
      
      {/* Admin Login Modal */}
      {showAdminLogin && (
        <AdminLogin onLogin={handleAdminLogin} />
      )}
    </div>
  );
}