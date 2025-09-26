import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Plus, Save, X, GripVertical, Eye, EyeOff } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const colorPalette = [
  // Theme Colors (Row 1)
  '#000000', '#6B7280', '#DC2626', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899',
  // Theme Colors (Row 2)
  '#FFFFFF', '#9CA3AF', '#92400E', '#F8BBD0', '#FCD34D', '#FEF3C7', '#BBF7D0', '#BFDBFE', '#DDD6FE', '#FBCFE8',
  // Theme Colors (Row 3)
  '#F9FAFB', '#D1D5DB', '#A78BFA', '#FBBF24', '#F59E0B', '#FBBF24', '#D9F99D', '#DBEAFE', '#C7D2FE', '#F3E8FF',
  // Theme Colors (Row 4)
  '#F3F4F6', '#6B7280', '#8B4513', '#FF6347', '#FF8C00', '#FFD700', '#ADFF2F', '#00CED1', '#1E90FF', '#9932CC',
  // Theme Colors (Row 5)
  '#E5E7EB', '#4B5563', '#A0522D', '#CD5C5C', '#DC143C', '#B22222', '#32CD32', '#228B22', '#4169E1', '#8A2BE2',
  // Theme Colors (Row 6)
  '#D1D5DB', '#374151', '#8B4513', '#B22222', '#FF0000', '#FF4500', '#7CFC00', '#20B2AA', '#0000FF', '#4B0082'
];

const standardColors = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#F97316', '#6B7280', '#374151'
];

interface NavTab {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color_from: string;
  color_to: string;
  colorStyle?: 'gradient' | 'palette';
  display_order: number;
  is_active: boolean;
  is_system: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface NavTabForm {
  name: string;
  slug: string;
  icon: string;
  color_from: string;
  color_to: string;
  colorStyle: 'gradient' | 'palette';
  description: string;
  is_active?: boolean;
}

export default function NavigationManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [editingTabId, setEditingTabId] = useState<number | null>(null);
  const [newTab, setNewTab] = useState<NavTabForm>({
    name: '',
    slug: '',
    icon: 'fas fa-star',
    color_from: '#3B82F6',
    color_to: '#1D4ED8',
    colorStyle: 'gradient',
    description: ''
  });

  // Fetch navigation tabs with direct backend call
  const { data: navTabs = [], isLoading: tabsLoading } = useQuery<NavTab[]>({
    queryKey: ['/api/admin/nav-tabs'],
    queryFn: async () => {
      // Try direct backend call first, fallback to proxy
      let response;
      try {
        response = await fetch('/api/admin/nav-tabs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors'
        });
      } catch (error) {
        console.log('Direct call failed, trying proxy...');
        response = await fetch('/api/admin/nav-tabs');
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch navigation tabs');
      }
      return response.json();
    },
    staleTime: 0, // Real-time updates
  });

  // Create navigation tab mutation with direct backend call
  const createTabMutation = useMutation({
    mutationFn: async (tabData: NavTabForm) => {
      // Try direct backend call first, fallback to proxy
      let response;
      try {
        response = await fetch('/api/admin/nav-tabs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          body: JSON.stringify(tabData),
        });
      } catch (error) {
        console.log('Direct call failed, trying proxy...');
        response = await fetch('/api/admin/nav-tabs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tabData),
        });
      }
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create navigation tab');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all navigation-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ['/api/admin/nav-tabs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nav-tabs'] });
      // Invalidate dynamic page queries that depend on navigation tabs
      queryClient.invalidateQueries({ predicate: (query) => 
        Boolean(query.queryKey[0]?.toString().includes('/api/nav-tabs/')) 
      });
      // Refetch all queries to ensure immediate updates
      queryClient.refetchQueries({ queryKey: ['/api/nav-tabs'] });
      
      setIsAddingTab(false);
      setNewTab({
        name: '',
        slug: '',
        icon: 'fas fa-star',
        color_from: '#3B82F6',
        color_to: '#1D4ED8',
        colorStyle: 'gradient',
        description: ''
      });
      toast({
        title: 'Success',
        description: 'Navigation tab created successfully',
      });
    },
    onError: (error: Error) => {
      console.error('Update mutation error:', error);
      toast({
        title: 'Update Failed',
        description: `Failed to update navigation tab: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update navigation tab mutation
  const updateTabMutation = useMutation({
    mutationFn: async ({ id, ...tabData }: Partial<NavTabForm> & { id: number; password?: string }) => {
      const response = await fetch(`/api/admin/nav-tabs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tabData),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        console.error('API Error:', error);
        throw new Error(error.message || 'Failed to update navigation tab');
      }
      
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      // Invalidate all navigation-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ['/api/admin/nav-tabs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nav-tabs'] });
      // Invalidate dynamic page queries that depend on navigation tabs
      queryClient.invalidateQueries({ predicate: (query) => 
        Boolean(query.queryKey[0]?.toString().includes('/api/nav-tabs/')) 
      });
      // Refetch all queries to ensure immediate updates
      queryClient.refetchQueries({ queryKey: ['/api/nav-tabs'] });
      
      setEditingTabId(null);
      toast({
        title: 'Success',
        description: 'Navigation tab updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete navigation tab mutation
  const deleteTabMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const response = await fetch(`/api/admin/nav-tabs/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete navigation tab');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all navigation-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ['/api/admin/nav-tabs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nav-tabs'] });
      // Invalidate dynamic page queries that depend on navigation tabs
      queryClient.invalidateQueries({ predicate: (query) => 
        Boolean(query.queryKey[0]?.toString().includes('/api/nav-tabs/')) 
      });
      // Refetch all queries to ensure immediate updates
      queryClient.refetchQueries({ queryKey: ['/api/nav-tabs'] });
      
      toast({
        title: 'Success',
        description: 'Navigation tab deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reorder navigation tabs mutation
  const reorderTabsMutation = useMutation({
    mutationFn: async ({ tabOrders, password }: { tabOrders: { id: number }[]; password: string }) => {
      const response = await fetch('/api/admin/nav-tabs/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tabOrders, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reorder navigation tabs');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all navigation-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ['/api/admin/nav-tabs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nav-tabs'] });
      // Invalidate dynamic page queries that depend on navigation tabs
      queryClient.invalidateQueries({ predicate: (query) => 
        Boolean(query.queryKey[0]?.toString().includes('/api/nav-tabs/')) 
      });
      // Refetch all queries to ensure immediate updates
      queryClient.refetchQueries({ queryKey: ['/api/nav-tabs'] });
      
      toast({
        title: 'Success',
        description: 'Navigation tabs reordered successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTabId) {
      updateTabMutation.mutate({
        id: editingTabId,
        ...newTab
      });
    } else {
      createTabMutation.mutate({
        ...newTab
      });
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this navigation tab?')) return;
    
    deleteTabMutation.mutate({ id });
  };

  // Handle edit
  const handleEdit = (tab: NavTab) => {
    setEditingTabId(tab.id);
    setNewTab({
      name: tab.name,
      slug: tab.slug,
      icon: tab.icon,
      color_from: tab.color_from,
      color_to: tab.color_to,
      colorStyle: tab.colorStyle || 'gradient',
      description: tab.description || ''
    });
    setIsAddingTab(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setIsAddingTab(false);
    setEditingTabId(null);
    setNewTab({
      name: '',
      slug: '',
      icon: 'fas fa-star',
      color_from: '#3B82F6',
      color_to: '#1D4ED8',
      colorStyle: 'gradient',
      description: ''
    });
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle name change and auto-generate slug
  const handleNameChange = (name: string) => {
    setNewTab(prev => ({
      ...prev,
      name,
      slug: editingTabId ? prev.slug : generateSlug(name)
    }));
  };

  // Handle drag end
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(navTabs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const password = prompt('Enter admin password to reorder tabs:');
    if (!password) return;

    const tabOrders = items.map((item, index) => ({ id: item.id }));
    reorderTabsMutation.mutate({ tabOrders, password });
  };

  // Toggle tab active status with direct backend call
  const toggleTabStatus = async (tab: NavTab) => {
    try {
      // Try direct backend call first, fallback to proxy
      let response;
      try {
        response = await fetch(`/api/admin/nav-tabs/${tab.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          body: JSON.stringify({
            is_active: !tab.is_active
          }),
        });
      } catch (error) {
        console.log('Direct call failed, trying proxy...');
        response = await fetch(`/api/admin/nav-tabs/${tab.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_active: !tab.is_active
          }),
        });
      }
      
      if (response.ok) {
        // Invalidate all navigation-related queries for real-time updates
        queryClient.invalidateQueries({ queryKey: ['/api/admin/nav-tabs'] });
        queryClient.invalidateQueries({ queryKey: ['/api/nav-tabs'] });
        // Invalidate dynamic page queries that depend on navigation tabs
        queryClient.invalidateQueries({ predicate: (query) => 
          Boolean(query.queryKey[0]?.toString().includes('/api/nav-tabs/')) 
        });
        // Refetch all queries to ensure immediate updates
        queryClient.refetchQueries({ queryKey: ['/api/nav-tabs'] });
        
        toast({
          title: 'Success',
          description: `Tab ${!tab.is_active ? 'activated' : 'deactivated'} successfully`,
        });
      } else {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || 'Failed to toggle tab status');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error',
        description: `Failed to toggle tab status: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Navigation Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage navigation tabs and create new pages</p>
        </div>
        <Button
          onClick={() => setIsAddingTab(true)}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isAddingTab}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Navigation Tab
        </Button>
      </div>

      {/* Add/Edit Form */}
      {isAddingTab && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">
              {editingTabId ? 'Edit Navigation Tab' : 'Add New Navigation Tab'}
            </CardTitle>
            <CardDescription>
              {editingTabId ? 'Update the navigation tab details' : 'Create a new navigation tab and its dedicated page'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Tab Name</Label>
                  <Input
                    id="name"
                    value={newTab.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Tech Picks"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={newTab.slug}
                    onChange={(e) => setNewTab(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., tech-picks"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="icon">Icon Class</Label>
                  <Input
                    id="icon"
                    value={newTab.icon}
                    onChange={(e) => setNewTab(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="e.g., fas fa-laptop"
                  />
                </div>
                
                {/* Color Style Selection */}
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <Label className="text-gray-700 dark:text-gray-300">Color Style</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={newTab.colorStyle === 'gradient' ? 'default' : 'outline'}
                        onClick={() => setNewTab(prev => ({ ...prev, colorStyle: 'gradient' }))}
                      >
                        Gradient
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={newTab.colorStyle === 'palette' ? 'default' : 'outline'}
                        onClick={() => setNewTab(prev => ({ ...prev, colorStyle: 'palette' }))}
                      >
                        Color Palette
                      </Button>
                    </div>
                  </div>
                  
                  {newTab.colorStyle === 'gradient' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="color_from" className="text-gray-700 dark:text-gray-300">Gradient Start Color</Label>
                        <Input
                          id="color_from"
                          type="color"
                          value={newTab.color_from}
                          onChange={(e) => setNewTab(prev => ({ ...prev, color_from: e.target.value }))}
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="color_to" className="text-gray-700 dark:text-gray-300">Gradient End Color</Label>
                        <Input
                          id="color_to"
                          type="color"
                          value={newTab.color_to}
                          onChange={(e) => setNewTab(prev => ({ ...prev, color_to: e.target.value }))}
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Color Palette Section */}
                  {newTab.colorStyle === 'palette' && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300 mb-3 block">Theme Colors</Label>
                        <div className="grid grid-cols-10 gap-2 mb-4">
                          {colorPalette.map((color, index) => (
                            <button
                              key={index}
                              type="button"
                              className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                                newTab.color_from === color 
                                  ? 'border-gray-900 dark:border-white shadow-lg' 
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setNewTab(prev => ({ ...prev, color_from: color, color_to: color }))}
                              title={color}
                            />
                          ))}
                        </div>
                        
                        <Label className="text-gray-700 dark:text-gray-300 mb-3 block">Standard Colors</Label>
                        <div className="flex gap-2 flex-wrap">
                          {standardColors.map((color, index) => (
                            <button
                              key={index}
                              type="button"
                              className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                                newTab.color_from === color 
                                  ? 'border-gray-900 dark:border-white shadow-lg' 
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setNewTab(prev => ({ ...prev, color_from: color, color_to: color }))}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTab.description}
                  onChange={(e) => setNewTab(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this navigation tab"
                  rows={3}
                />
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">Preview:</Label>
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium"
                  style={{
                    background: newTab.colorStyle === 'gradient' 
                      ? `linear-gradient(to right, ${newTab.color_from}, ${newTab.color_to})`
                      : newTab.color_from
                  }}
                >
                  <i className={newTab.icon}></i>
                  <span>{newTab.name || 'Tab Name'}</span>
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Style: {newTab.colorStyle === 'gradient' ? 'Gradient' : 'Solid Color'}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createTabMutation.isPending || updateTabMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingTabId ? 'Update Tab' : 'Create Tab'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Navigation Tabs List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Navigation Tabs</CardTitle>
          <CardDescription>
            Drag and drop to reorder tabs. System tabs cannot be deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tabsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading navigation tabs...</p>
            </div>
          ) : (Array.isArray(navTabs) && navTabs.length === 0) ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No navigation tabs found.</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="nav-tabs">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {(Array.isArray(navTabs) ? navTabs : []).map((tab, index) => (
                      <Draggable key={tab.id} draggableId={tab.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-4 border rounded-lg bg-white dark:bg-gray-800 ${
                              snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div {...provided.dragHandleProps} className="cursor-grab">
                                  <GripVertical className="w-5 h-5 text-gray-400" />
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-medium"
                                    style={{
                                      background: (tab.colorStyle === 'palette' || !tab.colorStyle) 
                                        ? tab.color_from
                                        : `linear-gradient(to right, ${tab.color_from}, ${tab.color_to})`
                                    }}
                                  >
                                    <i className={tab.icon}></i>
                                    <span>{tab.name}</span>
                                  </div>
                                  
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    /{tab.slug}
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    {tab.is_system && (
                                      <Badge variant="secondary" className="text-xs">
                                        System
                                      </Badge>
                                    )}
                                    <Badge 
                                      variant={tab.is_active ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {tab.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={tab.is_active}
                                      onChange={() => toggleTabStatus(tab)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                      {tab.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </label>
                                </div>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(tab)}
                                  disabled={isAddingTab}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                
                                {!tab.is_system && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDelete(tab.id)}
                                    disabled={deleteTabMutation.isPending}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {tab.description && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 ml-9">
                                {tab.description}
                              </p>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}