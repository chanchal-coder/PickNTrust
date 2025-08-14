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
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/header';
import { Trash2, Edit, Share2, ExternalLink, Facebook, Twitter, Instagram, MessageCircle, Star, DollarSign, Trophy, Package, Globe, FileText, Eye, Play, X, Tag, Plus, Megaphone } from 'lucide-react';
import { ColorPicker } from '@/components/color-picker';

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
    isActive: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activeAnnouncement } = useQuery({
    queryKey: ['/api/announcement/active'],
    retry: false
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: any) => {
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
    onSuccess: () => {
      toast({
        title: 'Announcement Created!',
        description: 'The announcement banner has been activated and is now live.',
      });
      
      setAnnouncementData({
        message: '',
        textColor: '#ffffff',
        backgroundColor: '#3b82f6',
        fontSize: '16px',
        fontWeight: 'normal',
        isActive: true
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/announcement/active'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
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
    createAnnouncementMutation.mutate(announcementData);
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
              backgroundColor: (activeAnnouncement as any).backgroundColor,
              color: (activeAnnouncement as any).textColor,
              fontSize: (activeAnnouncement as any).fontSize,
              fontWeight: (activeAnnouncement as any).fontWeight,
            }}
          >
            {(activeAnnouncement as any).message}
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAnnouncementData({
                  message: (activeAnnouncement as any).message,
                  textColor: (activeAnnouncement as any).textColor,
                  backgroundColor: (activeAnnouncement as any).backgroundColor,
                  fontSize: (activeAnnouncement as any).fontSize,
                  fontWeight: (activeAnnouncement as any).fontWeight,
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
                  <ColorPicker
                    selectedColor={announcementData.textColor}
                    onColorChange={(color) => setAnnouncementData(prev => ({...prev, textColor: color}))}
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
                  <ColorPicker
                    selectedColor={announcementData.backgroundColor}
                    onColorChange={(color) => setAnnouncementData(prev => ({...prev, backgroundColor: color}))}
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

            <div>
              <Label>Preview</Label>
              <div 
                className="p-3 rounded-md text-center font-medium"
                style={{
                  backgroundColor: announcementData.backgroundColor,
                  color: announcementData.textColor,
                  fontSize: announcementData.fontSize,
                  fontWeight: announcementData.fontWeight,
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [showBlogForm, setShowBlogForm] = useState(false);
  
  const [blogFormData, setBlogFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [] as string[],
    imageUrl: '',
    videoUrl: '',
    publishedAt: new Date().toISOString().split('T')[0],
    readTime: '3 min read',
    slug: '',
    hasTimer: false,
    timerDuration: '24'
  });

  useEffect(() => {
    const adminSession = localStorage.getItem('pickntrust-admin-session');
    if (adminSession === 'active') {
      setIsAuthenticated(true);
    }
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products/featured']
  });

  const { data: affiliateNetworks = [] } = useQuery({
    queryKey: ['/api/affiliate-networks']
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories']
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['/api/blog']
  });

  const { data: adminStats } = useQuery({
    queryKey: ['/api/admin/stats']
  });

  const stats = adminStats as any || { totalProducts: 0, featuredProducts: 0, blogPosts: 0, affiliateNetworks: 0 };

  const addProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const productData = {
        ...data,
        price: data.price,
        originalPrice: data.originalPrice || undefined,
        rating: parseFloat(data.rating),
        reviewCount: parseInt(data.reviewCount),
        discount: data.discount ? parseInt(data.discount) : undefined,
        affiliateNetworkId: data.affiliateNetworkId ? parseInt(data.affiliateNetworkId) : undefined,
        gender: (data.gender && data.gender !== 'none') ? data.gender : undefined,
        hasTimer: data.hasTimer || false,
        timerDuration: data.hasTimer && data.timerDuration ? parseInt(data.timerDuration) : null,
        isNew: data.isNew || false,
        isFeatured: data.isFeatured || false,
        password: 'pickntrust2025',
      };
      
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Product Added!',
        description: 'New product has been added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      form.reset();
      setShowAddForm(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add product. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const addBlogMutation = useMutation({
    mutationFn: async (blogData: any) => {
      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...blogData, password: 'pickntrust2025' }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add blog post');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Blog Post Added!', description: 'Your blog post has been published successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setBlogFormData({ title: '', excerpt: '', content: '', category: '', tags: [], imageUrl: '', videoUrl: '', publishedAt: new Date().toISOString().split('T')[0], readTime: '3 min read', slug: '', hasTimer: false, timerDuration: '24' });
      setShowBlogForm(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to add blog post. Please try again.', variant: 'destructive' });
    },
  });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      imageUrl: '',
      affiliateUrl: '',
      category: 'Tech',
      rating: '4.5',
      reviewCount: '100',
      discount: '',
      isNew: false,
      isFeatured: true,
    },
  });

  const onSubmit = (data: ProductForm) => {
    addProductMutation.mutate(data);
  };

  const extractProductDetails = async () => {
    if (!productUrl.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a product URL to extract details.',
        variant: 'destructive',
      });
      return;
    }

    setIsExtracting(true);
    
    try {
      const extractResponse = await fetch('/api/products/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: productUrl }),
      });

      const extractResult = await extractResponse.json();

      if (extractResult.success && extractResult.data) {
        const data = extractResult.data;
        setExtractedProduct({
          ...data,
          affiliateUrl: productUrl,
        });
        setShowPreview(true);
        
        toast({
          title: 'Product Details Extracted!',
          description: 'Review the details below and click "Add Product" to confirm.',
        });
      } else {
        toast({
          title: 'Extraction Failed',
          description: extractResult.message || 'Could not extract product details from this URL.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to extract product details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'pickntrust2025') {
      setIsAuthenticated(true);
      setPassword('');
      localStorage.setItem('pickntrust-admin-session', 'active');
      toast({
        title: 'Access Granted',
        description: 'Welcome to PickNTrust Admin Panel.',
      });
    } else {
      toast({
        title: 'Access Denied',
        description: 'Incorrect password. Please try again.',
        variant: 'destructive',
      });
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('pickntrust-admin-session');
    toast({
      title: 'Logged Out',
      description: 'Redirecting to homepage...',
    });
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

          {/* Dashboard Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Products</p>
                    <p className="text-2xl font-bold">{stats.totalProducts}</p>
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
                    <p className="text-2xl font-bold">{stats.featuredProducts}</p>
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
                    <p className="text-2xl font-bold">{stats.blogPosts}</p>
                  </div>
                  <FileText className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white transition-transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Networks</p>
                    <p className="text-2xl font-bold">{Array.isArray(affiliateNetworks) ? affiliateNetworks.length : 0}</p>
                  </div>
                  <Globe className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Tabs */}
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
                📦 Products
              </button>
              <button
                onClick={() => setActiveTab('blog')}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-300 transform ${
                  activeTab === 'blog'
                    ? 'bg-white dark:bg-gray-700 text-navy dark:text-white shadow-sm scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-white hover:scale-105'
                }`}
              >
                📝 Blog Posts
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-300 transform ${
                  activeTab === 'settings'
                    ? 'bg-white dark:bg-gray-700 text-navy dark:text-white shadow-sm scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-white hover:scale-105'
                }`}
              >
                ⚙️ Settings
              </button>
            </div>
          </div>

          {/* Announcement Management */}
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

          {/* Content based on active tab */}
          {activeTab === 'products' && (
            <div>
              {/* Auto-Extract Section */}
              <Card className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-xl text-bright-blue">🚀 Auto-Extract Product Details</CardTitle>
                  <CardDescription>
                    Paste any product URL (Amazon, Flipkart, etc.) to automatically extract and add products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Paste product URL here: https://amazon.in/dp/B08N5WRWNW or https://flipkart.com/product..."
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Button
                      type="button"
                      onClick={extractProductDetails}
                      disabled={isExtracting || !productUrl.trim()}
                      className="bg-bright-blue hover:bg-navy text-white px-6"
                    >
                      {isExtracting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Extracting...
                        </>
                      ) : (
                        'Extract Details'
                      )}
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Amazon Products
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      Flipkart Products  
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Other Retailers
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Manual Add Product Section */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-navy dark:text-blue-400">Manual Product Management</CardTitle>
                  <CardDescription>
                    Add products manually or edit auto-extracted details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-bright-blue hover:bg-navy text-white mb-4"
                  >
                    {showAddForm ? 'Cancel Manual Entry' : 'Add Product Manually'}
                  </Button>

                  {showAddForm && (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Product Name *</Label>
                          <Input
                            id="name"
                            {...form.register('name')}
                            placeholder="Premium Wireless Smartphone"
                          />
                          {form.formState.errors.name && (
                            <p className="text-red-500 text-sm mt-1">
                              {form.formState.errors.name.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="category">Category *</Label>
                          <Select 
                            onValueChange={(value) => form.setValue('category', value as any)}
                            defaultValue="Tech"
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(categories as any[]).map((category: any) => (
                                <SelectItem key={category.id} value={category.name}>
                                  {category.name} - {category.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          {...form.register('description')}
                          placeholder="High-quality product with amazing features..."
                          rows={3}
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="price">Current Price (₹) *</Label>
                          <Input
                            id="price"
                            {...form.register('price')}
                            placeholder="₹9,999.00"
                          />
                        </div>

                        <div>
                          <Label htmlFor="originalPrice">Original Price (₹)</Label>
                          <Input
                            id="originalPrice"
                            {...form.register('originalPrice')}
                            placeholder="₹14,999.00"
                          />
                        </div>

                        <div>
                          <Label htmlFor="discount">Discount %</Label>
                          <Input
                            id="discount"
                            {...form.register('discount')}
                            placeholder="33"
                            type="number"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="rating">Rating (1-5) *</Label>
                          <Input
                            id="rating"
                            {...form.register('rating')}
                            placeholder="4.5"
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                          />
                        </div>

                        <div>
                          <Label htmlFor="reviewCount">Review Count *</Label>
                          <Input
                            id="reviewCount"
                            {...form.register('reviewCount')}
                            placeholder="1234"
                            type="number"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="imageUrl">Product Image URL *</Label>
                        <Input
                          id="imageUrl"
                          {...form.register('imageUrl')}
                          placeholder="https://images.unsplash.com/photo-..."
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Use high-quality images from Unsplash or official product websites
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="affiliateUrl">Affiliate Link *</Label>
                          <Input
                            id="affiliateUrl"
                            {...form.register('affiliateUrl')}
                            placeholder="https://amzn.to/XXXXXXX"
                          />
                        </div>

                        <div>
                          <Label htmlFor="affiliateNetworkId">Affiliate Network</Label>
                          <Select 
                            onValueChange={(value) => form.setValue('affiliateNetworkId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select network" />
                            </SelectTrigger>
                            <SelectContent>
                              {(affiliateNetworks as any[]).map((network: any) => (
                                <SelectItem key={network.id} value={network.id.toString()}>
                                  {network.name} ({network.commissionRate}%)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            {...form.register('isNew')}
                            className="rounded"
                          />
                          <span className="text-sm">Mark as NEW</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            {...form.register('isFeatured')}
                            className="rounded"
                            defaultChecked
                          />
                          <span className="text-sm">Featured Product</span>
                        </label>
                      </div>

                      <Button 
                        type="submit" 
                        disabled={addProductMutation.isPending}
                        className="bg-accent-green hover:bg-green-600 text-white"
                      >
                        {addProductMutation.isPending ? 'Adding Product...' : 'Add Product'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Product List */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-navy dark:text-blue-400">Current Products</CardTitle>
                  <CardDescription>Manage all your products</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(products as any[]).map((product: any) => (
                      <div key={product.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4 flex-1">
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h5 className="font-semibold text-navy dark:text-blue-400">{product.name}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{product.description}</p>
                              
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="font-semibold text-green-600">₹{product.price}</span>
                                  {product.originalPrice && (
                                    <span className="text-gray-500 line-through">₹{product.originalPrice}</span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  <span>{product.rating}</span>
                                  <span className="text-gray-500">({product.reviewCount})</span>
                                </div>
                                
                                <Badge variant="outline" className="text-xs">
                                  {product.category}
                                </Badge>
                                
                                {product.isNew && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">NEW</Badge>
                                )}
                                
                                {product.isFeatured && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">FEATURED</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(product.affiliateUrl, '_blank')}
                              className="p-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Optimization & Seasonal Content Calendar */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Revenue Optimization */}
                <Card className="bg-gradient-to-br from-blue-900 to-blue-800 text-white">
                  <CardHeader>
                    <CardTitle className="text-blue-100">Revenue Optimization</CardTitle>
                    <CardDescription className="text-blue-200">Track performance and optimize earnings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-blue-100 mb-2">Performance Tracking</h4>
                      <ul className="text-sm text-blue-200 space-y-1">
                        <li>• Monitor which products get the most clicks</li>
                        <li>• Track conversion rates by category</li>
                        <li>• Identify seasonal trending products</li>
                        <li>• Analyze mobile vs desktop performance</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-blue-100 mb-2">A/B Testing Ideas</h4>
                      <ul className="text-sm text-blue-200 space-y-1">
                        <li>• Test different product descriptions</li>
                        <li>• Compare image styles (lifestyle vs product)</li>
                        <li>• Try different "Pick Now" button colors</li>
                        <li>• Test product positioning on homepage</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-blue-100 mb-2">Click-Through Rate Tips</h4>
                      <ul className="text-sm text-blue-200 space-y-1">
                        <li>• Use urgency words: "Limited time", "Flash sale"</li>
                        <li>• Highlight discounts prominently</li>
                        <li>• Add social proof with review counts</li>
                        <li>• Update bestsellers weekly</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Seasonal Content Calendar */}
                <Card className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white">
                  <CardHeader>
                    <CardTitle className="text-indigo-100">Seasonal Content Calendar</CardTitle>
                    <CardDescription className="text-indigo-200">Plan content for maximum revenue</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-indigo-100 mb-2">January - March</h4>
                      <ul className="text-sm text-indigo-200 space-y-1">
                        <li>• New Year fitness products</li>
                        <li>• Valentine's Day gifts (Beauty, Fashion)</li>
                        <li>• Holi festival deals</li>
                        <li>• Summer prep products</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-indigo-100 mb-2">April - June</h4>
                      <ul className="text-sm text-indigo-200 space-y-1">
                        <li>• Summer cooling products</li>
                        <li>• Father's Day tech deals</li>
                        <li>• Student tech for exams</li>
                        <li>• Monsoon prep items</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-indigo-100 mb-2">October - December</h4>
                      <ul className="text-sm text-indigo-200 space-y-1">
                        <li>• Diwali festival shopping</li>
                        <li>• Winter clothing collection</li>
                        <li>• Year-end tech deals</li>
                        <li>• Christmas gifts and decor</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Affiliate Networks */}
              <Card className="mb-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <CardHeader>
                  <CardTitle className="text-gray-100">Affiliate Networks</CardTitle>
                  <CardDescription className="text-gray-300">Manage your affiliate partnerships and commission rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {/* Amazon Associates */}
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-white">Amazon Associates</h4>
                        <Badge className="bg-blue-600 text-white">Active</Badge>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">World's largest e-commerce affiliate program</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Commission Rate:</span>
                          <span className="text-green-400 font-medium">1-10%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tracking:</span>
                          <code className="text-xs bg-gray-700 px-1 rounded text-blue-300">tag=pickntrust-21</code>
                        </div>
                      </div>
                      <a href="#" className="text-xs text-blue-400 hover:underline mt-2 block">Join Network →</a>
                    </div>

                    {/* Commission Junction */}
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-white">Commission Junction (CJ)</h4>
                        <Badge className="bg-blue-600 text-white">Active</Badge>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">Global affiliate marketing network</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Commission Rate:</span>
                          <span className="text-green-400 font-medium">8.00%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tracking:</span>
                          <code className="text-xs bg-gray-700 px-1 rounded text-blue-300">sid=pickntrust</code>
                        </div>
                      </div>
                      <a href="#" className="text-xs text-blue-400 hover:underline mt-2 block">Join Network →</a>
                    </div>

                    {/* ShareASale */}
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-white">ShareASale</h4>
                        <Badge className="bg-blue-600 text-white">Active</Badge>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">Performance marketing network</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Commission Rate:</span>
                          <span className="text-green-400 font-medium">5-50%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tracking:</span>
                          <code className="text-xs bg-gray-700 px-1 rounded text-blue-300">afftrack=pickntrust</code>
                        </div>
                      </div>
                      <a href="#" className="text-xs text-blue-400 hover:underline mt-2 block">Join Network →</a>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800">
                    <h4 className="font-semibold text-blue-100 mb-2">Network Integration Tips</h4>
                    <ul className="text-sm text-blue-200 space-y-1">
                      <li>• Apply for networks with highest commission rates first</li>
                      <li>• Use proper tracking parameters in all affiliate links</li>
                      <li>• Test links regularly to ensure they work properly</li>
                      <li>• Monitor performance and focus on best-converting networks</li>
                      <li>• Diversify across multiple networks to maximize revenue</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Management Tips */}
              <Card className="mb-8 bg-gradient-to-br from-green-900 to-green-800 text-white">
                <CardHeader>
                  <CardTitle className="text-green-100">Daily Management Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-100 mb-2">Morning Routine (30 min)</h4>
                    <ul className="text-sm text-green-200 space-y-1">
                      <li>• Check affiliate partner sites for new deals</li>
                      <li>• Update expired products with current prices</li>
                      <li>• Add 1 new product to "Deals" category</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-green-100 mb-2">Best Practices</h4>
                    <ul className="text-sm text-green-200 space-y-1">
                      <li>• Always test affiliate links before adding</li>
                      <li>• Use high-quality product images</li>
                      <li>• Write compelling product copy</li>
                      <li>• Monitor click-through rates</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-green-100 mb-2">Content Sources</h4>
                    <ul className="text-sm text-green-200 space-y-1">
                      <li>• Amazon Best Sellers & Daily Deals</li>
                      <li>• Flipkart Super Deals & Flash Sales</li>
                      <li>• Brand websites with affiliate programs</li>
                      <li>• Social media trending products</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'blog' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-navy dark:text-blue-400">Blog Management</h2>
                <Button 
                  onClick={() => setShowBlogForm(true)}
                  className="bg-bright-blue hover:bg-navy"
                >
                  Add New Blog Post
                </Button>
              </div>

              {/* Blog Content Ideas */}
              <Card className="mb-8 bg-gradient-to-br from-purple-900 to-purple-800 text-white">
                <CardHeader>
                  <CardTitle className="text-purple-100">💡 Blog Content Ideas</CardTitle>
                  <CardDescription className="text-purple-200">Proven topics with video/social support that drive affiliate sales</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    {/* Shopping Tips & Guides */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-purple-100 text-sm">Shopping Tips & Guides</h4>
                      <ul className="text-xs text-purple-200 space-y-1">
                        <li>• "10 Things to Check Before Buying Online - Worth Every Penny!"</li>
                        <li>• "How to Spot Fake Reviews on Amazon"</li>
                        <li>• "Secret Cashback Apps You Should Be Using"</li>
                        <li>• "Budget vs Premium: When to Splurge"</li>
                      </ul>
                    </div>

                    {/* Product Reviews */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-purple-100 text-sm">Product Reviews</h4>
                      <ul className="text-xs text-purple-200 space-y-1">
                        <li>• "iPhone 15 vs OnePlus 12: Which Should You Buy?"</li>
                        <li>• "Top 5 Air Purifiers for Indian Homes"</li>
                        <li>• "Wireless Earbuds: Premium vs Budget"</li>
                        <li>• "Best Laptops Under ₹50,000"</li>
                      </ul>
                    </div>

                    {/* Social Media Integration */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-purple-100 text-sm">📱 Social Media Integration</h4>
                      <ul className="text-xs text-purple-200 space-y-1">
                        <li>• Share Instagram product posts</li>
                        <li>• Embed Facebook shopping videos</li>
                        <li>• YouTube unboxing & reviews</li>
                        <li>• Mix text + video for engagement</li>
                      </ul>
                    </div>

                    {/* Personal Content */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-purple-100 text-sm">📝 Personal Content</h4>
                      <ul className="text-xs text-purple-200 space-y-1">
                        <li>• Upload your own product photos</li>
                        <li>• Record personal review videos</li>
                        <li>• Share behind-the-scenes content</li>
                        <li>• Create authentic user experiences</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-purple-800/50 rounded-lg border border-purple-700">
                    <p className="text-sm text-purple-100 font-medium mb-2">💡 Pro Tip for Personal Touch:</p>
                    <p className="text-xs text-purple-200">
                      Mix each blog post with personal content up to 30% each for personal touch!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {showBlogForm && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-xl text-bright-blue">✍️ Create New Blog Post</CardTitle>
                    <CardDescription>Add engaging content to drive affiliate sales</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="blog-title">Blog Title *</Label>
                      <Input
                        id="blog-title"
                        value={blogFormData.title}
                        onChange={(e) => setBlogFormData({...blogFormData, title: e.target.value})}
                        placeholder="10 Best Budget Smartphones Under ₹20,000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="blog-excerpt">Excerpt *</Label>
                      <Textarea
                        id="blog-excerpt"
                        value={blogFormData.excerpt}
                        onChange={(e) => setBlogFormData({...blogFormData, excerpt: e.target.value})}
                        placeholder="Short description that appears on the homepage..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="blog-content">Full Content *</Label>
                      <Textarea
                        id="blog-content"
                        value={blogFormData.content || ''}
                        onChange={(e) => setBlogFormData({...blogFormData, content: e.target.value})}
                        placeholder="Full blog post content with affiliate links..."
                        rows={8}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="blog-category">Category *</Label>
                        <Select
                          value={blogFormData.category || ''}
                          onValueChange={(value) => setBlogFormData({...blogFormData, category: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Shopping Tips">🛍️ Shopping Tips</SelectItem>
                            <SelectItem value="Product Reviews">⭐ Product Reviews</SelectItem>
                            <SelectItem value="Budget Shopping">💰 Budget Shopping</SelectItem>
                            <SelectItem value="Deals & Offers">🔥 Deals & Offers</SelectItem>
                            <SelectItem value="Tech News">📱 Tech News</SelectItem>
                            <SelectItem value="Fashion">👗 Fashion</SelectItem>
                            <SelectItem value="Beauty & Health">💄 Beauty & Health</SelectItem>
                            <SelectItem value="Home & Living">🏠 Home & Living</SelectItem>
                            <SelectItem value="Lifestyle">✨ Lifestyle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="blog-tags">Tags (comma separated)</Label>
                        <Input
                          id="blog-tags"
                          value={blogFormData.tags?.join(', ') || ''}
                          onChange={(e) => setBlogFormData({
                            ...blogFormData, 
                            tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                          })}
                          placeholder="deals, budget, tech, gadgets, amazon"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="blog-image">Blog Image URL</Label>
                        <Input
                          id="blog-image"
                          value={blogFormData.imageUrl}
                          onChange={(e) => setBlogFormData({...blogFormData, imageUrl: e.target.value})}
                          placeholder="https://images.unsplash.com/photo-..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="blog-video">Video URL (Optional)</Label>
                        <Input
                          id="blog-video"
                          value={blogFormData.videoUrl}
                          onChange={(e) => setBlogFormData({...blogFormData, videoUrl: e.target.value})}
                          placeholder="YouTube, Instagram Reel, Facebook Reel URL"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowBlogForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => {
                          addBlogMutation.mutate({
                            ...blogFormData,
                            slug: blogFormData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                          });
                        }}
                        disabled={!blogFormData.title || !blogFormData.excerpt || !blogFormData.content || !blogFormData.category || addBlogMutation.isPending}
                        className="bg-accent-green hover:bg-green-600"
                      >
                        {addBlogMutation.isPending ? 'Publishing...' : 'Publish Blog Post'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Blog Posts List */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-navy dark:text-blue-400">Current Blog Posts ({Array.isArray(blogPosts) ? blogPosts.length : 0})</h3>
                
                {!Array.isArray(blogPosts) || blogPosts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No blog posts yet. Create your first one!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {Array.isArray(blogPosts) && blogPosts.map((post: any) => (
                      <Card key={post.id} className="p-4">
                        <div className="flex gap-4">
                          <img 
                            src={post.imageUrl} 
                            alt={post.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-navy dark:text-blue-400">{post.title}</h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{post.excerpt}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                              <span>{post.readTime}</span>
                              {post.videoUrl && (
                                <span className="flex items-center gap-1">
                                  <Play className="w-3 h-3" />
                                  Video
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-6">Settings</h2>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-navy dark:text-blue-400">Social Media Settings</CardTitle>
                  <CardDescription>Configure your social media channels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="telegram">Telegram Channel URL</Label>
                    <Input
                      id="telegram"
                      value="https://t.me/+m-O-S6SSpVU2NWU1"
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebook">Facebook Page URL</Label>
                    <Input
                      id="facebook"
                      value="https://www.facebook.com/profile.php?id=61578969445670"
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp Channel URL</Label>
                    <Input
                      id="whatsapp"
                      value="https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C"
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-navy dark:text-blue-400">Admin Information</CardTitle>
                  <CardDescription>Current admin panel information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Admin Password:</strong> pickntrust2025</p>
                    <p><strong>Session Status:</strong> Active</p>
                    <p><strong>Last Login:</strong> {new Date().toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
