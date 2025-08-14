import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';
import { Trash2, Edit, Share2, ExternalLink, Facebook, Twitter, Instagram, MessageCircle, Star, DollarSign, Trophy, Package, Globe, FileText, Eye, Play, X, Tag, Plus, Megaphone } from 'lucide-react';
import CategoryManagement from '@/components/admin/CategoryManagement';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  originalPrice: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL'),
  affiliateUrl: z.string().url('Must be a valid URL'),
  affiliateNetworkId: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  gender: z.string().optional(),
  rating: z.string().min(1, 'Rating is required'),
  reviewCount: z.string().min(1, 'Review count is required'),
  discount: z.string().optional(),
  hasTimer: z.boolean().optional(),
  timerDuration: z.string().optional(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

// Announcement Manager Component
function AnnouncementManager() {
  const [isEditing, setIsEditing] = useState(false);
  const [announcementData, setAnnouncementData] = useState({
    message: '',
    textColor: '#ffffff',
    backgroundColor: '#3b82f6',
    fontSize: '16px',
    fontWeight: 'normal',
    textDecoration: 'none',
    fontStyle: 'normal',
    animationSpeed: '30',
    textBorderWidth: '0px',
    textBorderStyle: 'solid',
    textBorderColor: '#000000',
    bannerBorderWidth: '0px',
    bannerBorderStyle: 'solid',
    bannerBorderColor: '#000000',
    isActive: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current active announcement
  const { data: activeAnnouncement } = useQuery({
    queryKey: ['/api/announcement/active'],
    retry: false
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating announcement with data:', data);
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, password: 'pickntrust2025' })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create announcement');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      console.log('Announcement created successfully:', result);
      toast({
        title: 'Announcement Created!',
        description: 'The announcement banner has been activated and is now live.',
      });
      
      // Reset form data
      setAnnouncementData({
        message: '',
        textColor: '#ffffff',
        backgroundColor: '#3b82f6',
        fontSize: '16px',
        fontWeight: 'normal',
        textDecoration: 'none',
        fontStyle: 'normal',
        animationSpeed: '30',
        isActive: true
      });
      
      // Refresh data and close editor
      queryClient.invalidateQueries({ queryKey: ['/api/announcement/active'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      console.error('Error creating announcement:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create announcement. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!announcementData.message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an announcement message.',
        variant: 'destructive',
      });
      return;
    }
    createAnnouncementMutation.mutate({
      ...announcementData,
      textBorderWidth: announcementData.textBorderWidth || '0px',
      textBorderStyle: announcementData.textBorderStyle || 'solid',
      textBorderColor: announcementData.textBorderColor || '#000000',
      bannerBorderWidth: announcementData.bannerBorderWidth || '0px',
      bannerBorderStyle: announcementData.bannerBorderStyle || 'solid',
      bannerBorderColor: announcementData.bannerBorderColor || '#000000',
    });
  };

  return (
    <div className="space-y-4">
      {activeAnnouncement ? (
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
            Current Active Announcement:
          </h4>
          <div 
            className="p-3 rounded-md text-center font-medium"
            style={{
              backgroundColor: activeAnnouncement.backgroundColor,
              color: activeAnnouncement.textColor,
              fontSize: activeAnnouncement.fontSize,
              fontWeight: activeAnnouncement.fontWeight,
              textDecoration: activeAnnouncement.textDecoration || 'none',
              fontStyle: activeAnnouncement.fontStyle || 'normal'
            }}
          >
            {activeAnnouncement.message}
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAnnouncementData({
                  message: activeAnnouncement.message,
                  textColor: activeAnnouncement.textColor,
                  backgroundColor: activeAnnouncement.backgroundColor,
                  fontSize: activeAnnouncement.fontSize,
                  fontWeight: activeAnnouncement.fontWeight,
                  textDecoration: activeAnnouncement.textDecoration || 'none',
                  fontStyle: activeAnnouncement.fontStyle || 'normal',
                  animationSpeed: activeAnnouncement.animationSpeed,
                  textBorderWidth: activeAnnouncement.textBorderWidth || '0px',
                  textBorderStyle: activeAnnouncement.textBorderStyle || 'solid',
                  textBorderColor: activeAnnouncement.textBorderColor || '#000000',
                  bannerBorderWidth: activeAnnouncement.bannerBorderWidth || '0px',
                  bannerBorderStyle: activeAnnouncement.bannerBorderStyle || 'solid',
                  bannerBorderColor: activeAnnouncement.bannerBorderColor || '#000000',
                  isActive: true
                });
                setIsEditing(true);
              }}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-center text-gray-500 dark:text-gray-400">
          No active announcement. Create one below.
        </div>
      )}

      {!isEditing ? (
        <Button
          onClick={() => setIsEditing(true)}
          className="bg-bright-blue hover:bg-navy"
        >
          <Plus className="w-4 h-4 mr-1" />
          Create New Announcement
        </Button>
      ) : (
        <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="font-semibold text-navy dark:text-blue-400">
            {activeAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
          </h4>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="message">Announcement Message</Label>
              <Input
                id="message"
                placeholder="Enter your announcement message (use emojis for more appeal! 🎉✨)"
                value={announcementData.message}
                onChange={(e) => setAnnouncementData(prev => ({...prev, message: e.target.value}))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="textColor">Text Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={announcementData.textColor}
                    onChange={(e) => setAnnouncementData(prev => ({...prev, textColor: e.target.value}))}
                    className="w-10 h-10 border border-gray-300 rounded"
                  />
                  <Input
                    value={announcementData.textColor}
                    onChange={(e) => setAnnouncementData(prev => ({...prev, textColor: e.target.value}))}
                    className="flex-1"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={announcementData.backgroundColor}
                    onChange={(e) => setAnnouncementData(prev => ({...prev, backgroundColor: e.target.value}))}
                    className="w-10 h-10 border border-gray-300 rounded"
                  />
                  <Input
                    value={announcementData.backgroundColor}
                    onChange={(e) => setAnnouncementData(prev => ({...prev, backgroundColor: e.target.value}))}
                    className="flex-1"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fontSize">Font Size</Label>
                <Select value={announcementData.fontSize} onValueChange={(value) => setAnnouncementData(prev => ({...prev, fontSize: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14px">Small (14px)</SelectItem>
                    <SelectItem value="16px">Medium (16px)</SelectItem>
                    <SelectItem value="18px">Large (18px)</SelectItem>
                    <SelectItem value="20px">Extra Large (20px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fontWeight">Font Weight</Label>
                <Select value={announcementData.fontWeight} onValueChange={(value) => setAnnouncementData(prev => ({...prev, fontWeight: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="600">Semi Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label>Preview</Label>
              <div 
                className="p-3 rounded-md text-center font-medium"
                style={{
                  backgroundColor: announcementData.backgroundColor,
                  color: announcementData.textColor,
                  fontSize: announcementData.fontSize,
                  fontWeight: announcementData.fontWeight,
                  textDecoration: announcementData.textDecoration,
                  fontStyle: announcementData.fontStyle
                }}
              >
                {announcementData.message || 'Your announcement will appear here...'}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={createAnnouncementMutation.isPending}
                className="bg-bright-blue hover:bg-navy"
              >
                {createAnnouncementMutation.isPending ? 'Saving...' : 'Save Announcement'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [socialSettings, setSocialSettings] = useState({
    telegramChannelUrl: 'https://t.me/+m-O-S6SSpVU2NWU1',
    facebookPageUrl: 'https://www.facebook.com/profile.php?id=61578969445670',
    whatsappChannelUrl: 'https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C'
  });

  // Check if admin session exists on page load
  useEffect(() => {
    const adminSession = localStorage.getItem('pickntrust-admin-session');
    if (adminSession === 'active') {
      setIsAuthenticated(true);
    }
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products/featured']
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories']
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['/api/blog']
  });

  // Get admin stats for accurate dashboard counts
  const { data: adminStats = { totalProducts: 0, featuredProducts: 0, blogPosts: 0, affiliateNetworks: 0 } } = useQuery({
    queryKey: ['/api/admin/stats']
  });

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setPassword('');
        localStorage.setItem('pickntrust-admin-session', 'active');
        toast({
          title: 'Access Granted',
          description: 'Welcome to PickNTrust Admin Panel. You now have admin controls across all pages.',
        });
        // Trigger storage event for other components
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'pickntrust-admin-session',
          newValue: 'active'
        }));
      } else {
        toast({
          title: 'Access Denied',
          description: 'Incorrect password. Please try again.',
          variant: 'destructive',
        });
        setPassword('');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: 'Unable to connect to server. Please try again.',
        variant: 'destructive',
      });
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // Remove admin session from all category pages
    localStorage.removeItem('pickntrust-admin-session');
    toast({
      title: 'Logged Out',
      description: 'Redirecting to homepage...',
    });
    // Redirect to homepage using window.location for better compatibility
    window.location.href = '/';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-navy dark:text-blue-400">PickNTrust Admin</CardTitle>
              <CardDescription>Enter password to access admin panel</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">Admin Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-bright-blue hover:bg-navy">
                  Access Admin Panel
                </Button>
              </form>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Only authorized users can access this panel
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-navy dark:text-blue-400 mb-2">
                PickNTrust Admin Panel
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your products and affiliate links daily
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Gamified Dashboard Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Products</p>
                    <p className="text-2xl font-bold">{adminStats.totalProducts}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white transition-transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm">Featured Products</p>
                    <p className="text-2xl font-bold">{adminStats.featuredProducts}</p>
                  </div>
                  <Star className="w-8 h-8 text-indigo-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white transition-transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Blog Posts</p>
                    <p className="text-2xl font-bold">{adminStats.blogPosts}</p>
                  </div>
                  <FileText className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white transition-transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Achievements</p>
                    <p className="text-2xl font-bold">{
                      (() => {
                        const dynamicAchievements = [];
                        if (Array.isArray(blogPosts)) {
                          if (blogPosts.length >= 1) dynamicAchievements.push('First Post');
                          if (blogPosts.length >= 5) dynamicAchievements.push('Content Creator');
                          if (blogPosts.length >= 10) dynamicAchievements.push('Blog Master');
                          if (blogPosts.some((p: any) => p.videoUrl)) dynamicAchievements.push('Video Pioneer');
                        }
                        if (Array.isArray(products) && products.length >= 10) dynamicAchievements.push('Product Master');
                        if (Array.isArray(products) && products.length >= 50) dynamicAchievements.push('Catalog King');
                        return dynamicAchievements.length;
                      })()
                    }</p>
                  </div>
                  <Trophy className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Navigation Tabs with Animations */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg max-w-lg">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-300 transform ${
                  activeTab === 'products'
                    ? 'bg-white dark:bg-gray-700 text-navy dark:text-white shadow-sm scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-white hover:scale-105'
                }`}
              >
                <span className="inline-block w-5 h-5 mr-1 rounded bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-center leading-5 shadow-md shadow-pink-300/50">📦</span>
                Products
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-300 transform ${
                  activeTab === 'categories'
                    ? 'bg-white dark:bg-gray-700 text-navy dark:text-white shadow-sm scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-white hover:scale-105'
                }`}
              >
                <span className="inline-block w-5 h-5 mr-1 rounded bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400 text-white text-center leading-5 shadow-md shadow-yellow-300/50">🏷️</span>
                Categories
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-300 transform ${
                  activeTab === 'announcements'
                    ? 'bg-white dark:bg-gray-700 text-navy dark:text-white shadow-sm scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-white hover:scale-105'
                }`}
              >
                <span className="inline-block w-5 h-5 mr-1 rounded bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-center leading-5 shadow-md shadow-purple-300/50">📢</span>
                Announcements
              </button>
            </div>
          </div>

          {/* Conditional Content Based on Active Tab */}
          {activeTab === 'products' && (
            <div>
              <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-6">Product Management</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Manage your products here</p>
            </div>
          )}

          {activeTab === 'categories' && (
            <CategoryManagement />
          )}

          {activeTab === 'announcements' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-navy dark:text-blue-400">
                  <Megaphone className="w-5 h-5" />
                  Announcement Banner
                </CardTitle>
                <CardDescription>
                  Manage the scrolling announcement banner shown on the homepage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnnouncementManager />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
