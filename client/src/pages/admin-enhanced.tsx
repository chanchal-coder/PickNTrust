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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';
import { 
  Trash2, Edit, Share2, ExternalLink, Facebook, Twitter, Instagram, MessageCircle, 
  Star, DollarSign, Trophy, Package, Globe, FileText, Eye, Plus, Megaphone,
  Settings, Users, BarChart3, Link, Sparkles, BookOpen, Tags, Palette
} from 'lucide-react';

// Import existing admin components
import ProductManagement from '@/components/admin/ProductManagement';
import CategoryManagement from '@/components/admin/CategoryManagement';
import BlogManagement from '@/components/admin/AdminBlogPostForm';
import AnnouncementManagement from '@/components/admin/AnnouncementManagement';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  originalPrice: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL'),
  affiliateUrl: z.string().url('Must be a valid URL'),
  category: z.string().min(1, 'Category is required'),
  rating: z.string().min(1, 'Rating is required'),
  reviewCount: z.string().min(1, 'Review count is required'),
  discount: z.string().optional(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function EnhancedAdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractUrl, setExtractUrl] = useState('');

  // Check if admin session exists on page load
  useEffect(() => {
    const adminSession = localStorage.getItem('pickntrust-admin-session');
    if (adminSession === 'active') {
      setIsAuthenticated(true);
    }
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products/featured'],
    queryFn: async () => {
      const response = await fetch('/api/products/featured');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch all products');
      }
      const data = await response.json();
      return data.products || [];
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['/api/blog'],
    queryFn: async () => {
      const response = await fetch('/api/blog');
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }
      return response.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // URL extraction mutation
  const extractProductMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch('/api/products/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract product details');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Product Extracted!',
          description: 'Product details have been extracted. You can now edit and save.',
        });
        // Here you would populate the form with extracted data
        // This would require form state management
      }
    },
    onError: () => {
      toast({
        title: 'Extraction Failed',
        description: 'Could not extract product details from the URL.',
        variant: 'destructive',
      });
    },
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
          description: 'Welcome to PickNTrust Enhanced Admin Panel.',
        });
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
    localStorage.removeItem('pickntrust-admin-session');
    toast({
      title: 'Logged Out',
      description: 'Redirecting to homepage...',
    });
    window.location.href = '/';
  };

  const handleExtractProduct = () => {
    if (!extractUrl.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a product URL to extract details.',
        variant: 'destructive',
      });
      return;
    }
    setIsExtracting(true);
    extractProductMutation.mutate(extractUrl);
    setTimeout(() => setIsExtracting(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PickNTrust Admin
              </CardTitle>
              <CardDescription className="text-lg">Enhanced Admin Panel</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="password" className="text-base font-medium">Admin Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="mt-2 h-12 text-lg"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Access Admin Panel
                </Button>
              </form>
              <p className="text-xs text-gray-500 mt-6 text-center">
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
          {/* Header Section */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                PickNTrust Enhanced Admin
              </h1>
              <p className="text-gray-700 dark:text-gray-300 text-lg">
                Complete management dashboard for your affiliate platform
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

          {/* Main Admin Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-lg">
              <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white">
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Products</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <Tags className="w-4 h-4" />
                <span className="hidden sm:inline">Categories</span>
              </TabsTrigger>
              <TabsTrigger value="blog" className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Blog</span>
              </TabsTrigger>
              <TabsTrigger value="announcements" className="flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white">
                <Megaphone className="w-4 h-4" />
                <span className="hidden sm:inline">Announcements</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Tools</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid md:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Total Products</p>
                        <p className="text-3xl font-bold">{Array.isArray(allProducts) ? allProducts.length : 0}</p>
                      </div>
                      <Package className="w-10 h-10 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Featured Products</p>
                        <p className="text-3xl font-bold">{Array.isArray(products) ? products.filter((p: any) => p.isFeatured).length : 0}</p>
                      </div>
                      <Star className="w-10 h-10 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Categories</p>
                        <p className="text-3xl font-bold">{Array.isArray(categories) ? categories.length : 0}</p>
                      </div>
                      <Tags className="w-10 h-10 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm font-medium">Blog Posts</p>
                        <p className="text-3xl font-bold">{Array.isArray(blogPosts) ? blogPosts.length : 0}</p>
                      </div>
                      <BookOpen className="w-10 h-10 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription className="text-gray-700">
                    Frequently used admin actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Button 
                      onClick={() => setActiveTab('products')}
                      className="h-16 bg-green-600 hover:bg-green-700 flex flex-col gap-1"
                    >
                      <Plus className="w-5 h-5" />
                      Add Product
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('categories')}
                      className="h-16 bg-purple-600 hover:bg-purple-700 flex flex-col gap-1"
                    >
                      <Tags className="w-5 h-5" />
                      Add Category
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('blog')}
                      className="h-16 bg-orange-600 hover:bg-orange-700 flex flex-col gap-1"
                    >
                      <BookOpen className="w-5 h-5" />
                      Write Blog Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              <ProductManagement />
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories">
              <CategoryManagement />
            </TabsContent>

            {/* Blog Tab */}
            <TabsContent value="blog">
              <BlogManagement />
            </TabsContent>

            {/* Announcements Tab */}
            <TabsContent value="announcements">
              <AnnouncementManagement />
            </TabsContent>

            {/* Tools Tab */}
            <TabsContent value="tools" className="space-y-6">
              {/* URL Product Extractor */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="w-5 h-5" />
                    Product URL Extractor
                  </CardTitle>
                  <CardDescription>
                    Extract product details automatically from URLs (Amazon, eBay, etc.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Paste product URL here (e.g., https://amazon.com/product/...)"
                      value={extractUrl}
                      onChange={(e) => setExtractUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleExtractProduct}
                      disabled={isExtracting || extractProductMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isExtracting || extractProductMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Extracting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Extract Details
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-2">Supported platforms:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Amazon</Badge>
                      <Badge variant="outline">eBay</Badge>
                      <Badge variant="outline">AliExpress</Badge>
                      <Badge variant="outline">Flipkart</Badge>
                      <Badge variant="outline">And more...</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Other Tools */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">View detailed analytics and performance metrics.</p>
                    <Button variant="outline" className="w-full">
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      System Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">Configure system settings and preferences.</p>
                    <Button variant="outline" className="w-full">
                      Open Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
