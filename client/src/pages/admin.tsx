import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAdminPassword } from '@/config/admin';
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
import ScrollNavigation from '@/components/scroll-navigation';
import { 
  Trash2, Edit, Share2, ExternalLink, Facebook, Twitter, Instagram, MessageCircle, 
  Star, DollarSign, Trophy, Package, Globe, FileText, Eye, Plus, Megaphone,
  Settings, Users, BarChart3, Link, Sparkles, BookOpen, Tags, Palette, Loader2, Video, Navigation, Image, Shield, Code
} from 'lucide-react';

// Import existing admin components
import ProductManagement from '@/components/admin/ProductManagement';
import CategoryManagement from '@/components/admin/CategoryManagement';
import SimplifiedBlogForm from '@/components/admin/SimplifiedBlogForm';
import VideoContentManager from '@/components/admin/VideoContentManager';
import AnnouncementManagement from '@/components/admin/AnnouncementManagement';
import AutomationManagement from '@/components/admin/AutomationManagement';
import NavigationManagement from '@/components/admin/NavigationManagement';
import BannerManagement from '@/components/admin/BannerManagement';
import CommissionManagement from '@/components/admin/CommissionManagement';
import CredentialManagement from '@/components/admin/CredentialManagement';
import WidgetManagement from '@/components/admin/WidgetManagement';
import MetaTagsManagement from '@/components/admin/MetaTagsManagement';
import RSSFeedsManagement from '@/components/admin/RSSFeedsManagement';
import UniversalPageLayout from '@/components/UniversalPageLayout';

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

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractUrl, setExtractUrl] = useState('');

  // Check if admin session exists on page load and handle reset token from URL
  useEffect(() => {
    const adminSession = localStorage.getItem('pickntrust-admin-session');
    if (adminSession === 'active') {
      setIsAuthenticated(true);
    }
    
    // Check for reset token in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetToken(token);
      setShowResetPassword(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
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
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    }
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['/api/blog'],
    queryFn: async () => {
      const response = await fetch('/api/blog');
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }
      return response.json();
    }
  });

  const { data: videoContent = [] } = useQuery({
    queryKey: ['/api/video-content'],
    queryFn: async () => {
      const response = await fetch('/api/video-content');
      if (!response.ok) {
        throw new Error('Failed to fetch video content');
      }
      return response.json();
    }
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

  const addProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const productData = {
        ...data,
        price: data.price,
        originalPrice: data.originalPrice || undefined,
        rating: parseFloat(data.rating),
        reviewCount: parseInt(data.reviewCount),
        discount: data.discount ? parseInt(data.discount) : undefined,
        isNew: data.isNew || false,
        isFeatured: data.isFeatured || false,
        password: getAdminPassword(),
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

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send reset email');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Reset Email Sent!',
        description: 'Check your email for password reset instructions.',
      });
      setForgotPasswordEmail('');
      setShowForgotPassword(false);
      
      // In development, show the reset token
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setTimeout(() => {
          setShowResetPassword(true);
          toast({
            title: 'Development Mode',
            description: 'Reset token auto-filled for testing.',
          });
        }, 1000);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Password Reset Successfully!',
        description: 'You can now login with your new password.',
      });
      setResetPasswordData({ newPassword: '', confirmPassword: '' });
      setResetToken('');
      setShowResetPassword(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
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
      category: 'Electronics & Gadgets',
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
        
        // Set all required admin authentication values
        const adminToken = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('pickntrust-admin-session', 'active');
        localStorage.setItem('pickntrust-admin-token', adminToken);
        localStorage.setItem('pickntrust-admin-password', 'pickntrust2025');
        
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

  const handleLogout = () => {
    console.log('🚪 Logout initiated');
    localStorage.removeItem('pickntrust-admin-session');
    localStorage.removeItem('pickntrust-admin-token');
    localStorage.removeItem('pickntrust-admin-password');
    
    toast({
      title: 'Logged Out',
      description: 'Redirecting to homepage...',
    });
    
    console.log('🔄 Navigating to homepage immediately');
    // Use window.location for reliable navigation
    window.location.href = '/';
  };

  if (!isAuthenticated) {
    return (
    <UniversalPageLayout pageId="admin">
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
                    {!showForgotPassword && !showResetPassword && (
                      <>
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
                        <div className="mt-4 text-center">
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 text-center">
                          Only authorized users can access this panel
                        </p>
                      </>
                    )}
      
                    {showForgotPassword && (
                      <div className="space-y-6">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
                          <p className="text-sm text-gray-600 mt-2">Enter your email address to receive a password reset link.</p>
                        </div>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                    if (forgotPasswordEmail) {
                      forgotPasswordMutation.mutate(forgotPasswordEmail);
                    }
                  }} className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-base font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="mt-2 h-12 text-lg"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={forgotPasswordMutation.isPending}
                    >
                      {forgotPasswordMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                  </form>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordEmail('');
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              )}

              {showResetPassword && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900">Set New Password</h3>
                    <p className="text-sm text-gray-600 mt-2">Enter your new password below.</p>
                  </div>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (resetPasswordData.newPassword && resetPasswordData.confirmPassword) {
                      resetPasswordMutation.mutate(resetPasswordData);
                    }
                  }} className="space-y-4">
                    <div>
                      <Label htmlFor="newPassword" className="text-base font-medium">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={resetPasswordData.newPassword}
                        onChange={(e) => setResetPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                        className="mt-2 h-12 text-lg"
                        required
                        minLength={8}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-base font-medium">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={resetPasswordData.confirmPassword}
                        onChange={(e) => setResetPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        className="mt-2 h-12 text-lg"
                        required
                        minLength={8}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={resetPasswordMutation.isPending}
                    >
                      {resetPasswordMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </UniversalPageLayout>
    );
  }

  return (
    <UniversalPageLayout pageId="admin">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                PickNTrust Admin Panel
              </h1>
              <p className="text-gray-700 dark:text-gray-300 text-lg">
                Complete management dashboard with enhanced video content support
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
            <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg">
              {/* First Row */}
              <TabsList className="grid w-full grid-cols-5 mb-2 bg-transparent p-0">
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
                <TabsTrigger value="navigation" className="flex items-center gap-2 data-[state=active]:bg-teal-500 data-[state=active]:text-white">
                  <Navigation className="w-4 h-4" />
                  <span className="hidden sm:inline">Navigation</span>
                </TabsTrigger>
                <TabsTrigger value="banners" className="flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                  <Image className="w-4 h-4" />
                  <span className="hidden sm:inline">Banners</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Second Row */}
              <TabsList className="grid w-full grid-cols-4 mb-2 bg-transparent p-0">
                <TabsTrigger value="blog" className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Blog</span>
                </TabsTrigger>
                <TabsTrigger value="videos" className="flex items-center gap-2 data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Videos</span>
                </TabsTrigger>
                <TabsTrigger value="announcements" className="flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white">
                  <Megaphone className="w-4 h-4" />
                  <span className="hidden sm:inline">Announcements</span>
                </TabsTrigger>
                <TabsTrigger value="automation" className="flex items-center gap-2 data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Automation</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Third Row */}
              <TabsList className="grid w-full grid-cols-6 bg-transparent p-0">
                <TabsTrigger value="widgets" className="flex items-center gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                  <Code className="w-4 h-4" />
                  <span className="hidden sm:inline">Widgets</span>
                </TabsTrigger>
                <TabsTrigger value="commission" className="flex items-center gap-2 data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
                  <DollarSign className="w-4 h-4" />
                  <span className="hidden sm:inline">Commission</span>
                </TabsTrigger>
                <TabsTrigger value="credentials" className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Credentials</span>
                </TabsTrigger>
                <TabsTrigger value="metatags" className="flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Meta Tags</span>
                </TabsTrigger>
                <TabsTrigger value="rssfeeds" className="flex items-center gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">RSS Feeds</span>
                </TabsTrigger>
                <TabsTrigger value="bots" className="flex items-center gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Bot Management</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid md:grid-cols-5 gap-6">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Total Products</p>
                        <p className="text-3xl font-bold">{Array.isArray(products) ? products.length : 0}</p>
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

                <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-pink-100 text-sm font-medium">Video Content</p>
                        <p className="text-3xl font-bold">{Array.isArray(videoContent) ? videoContent.length : 0}</p>
                      </div>
                      <Video className="w-10 h-10 text-pink-200" />
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
                  <CardDescription className="text-blue-200">
                    Frequently used admin actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
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
                    <Button 
                      onClick={() => setActiveTab('videos')}
                      className="h-16 bg-pink-600 hover:bg-pink-700 flex flex-col gap-1"
                    >
                      <Video className="w-5 h-5" />
                      Add Video Content
                    </Button>
                    <Button 
                      onClick={() => setLocation('/bot-admin')}
                      className="h-16 bg-indigo-600 hover:bg-indigo-700 flex flex-col gap-1"
                    >
                      <Settings className="w-5 h-5" />
                      Bot Management
                    </Button>
                    {/* New: Payments Gateway setup entry */}
                    <Button 
                      onClick={() => setLocation('/admin/payments')}
                      className="h-16 bg-teal-600 hover:bg-teal-700 flex flex-col gap-1"
                    >
                      <DollarSign className="w-5 h-5" />
                      Payment Gateways
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

            {/* Navigation Tab */}
            <TabsContent value="navigation">
              <NavigationManagement />
            </TabsContent>

            {/* Banners Tab */}
            <TabsContent value="banners">
              <BannerManagement />
            </TabsContent>

            {/* Blog Tab - Simplified Image-Only Blog */}
            <TabsContent value="blog">
              <SimplifiedBlogForm />
            </TabsContent>

            {/* Videos Tab - NEW Enhanced Video Content Manager */}
            <TabsContent value="videos">
              <VideoContentManager />
            </TabsContent>

            {/* Announcements Tab */}
            <TabsContent value="announcements">
              <AnnouncementManagement />
            </TabsContent>

            {/* Automation Tab */}
            <TabsContent value="automation">
              <AutomationManagement />
            </TabsContent>

            {/* Commission Management Tab */}
            <TabsContent value="commission">
              <CommissionManagement />
            </TabsContent>

            {/* Widget Management Tab */}
            <TabsContent value="widgets">
              <WidgetManagement />
            </TabsContent>

            {/* Credential Management Tab */}
            <TabsContent value="credentials">
              <CredentialManagement />
            </TabsContent>

            {/* Meta Tags Management Tab */}
            <TabsContent value="metatags">
              <MetaTagsManagement />
            </TabsContent>

            {/* RSS Feeds Management Tab */}
            <TabsContent value="rssfeeds">
              <RSSFeedsManagement />
            </TabsContent>

            {/* Bot Management Tab */}
            <TabsContent value="bots" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Telegram Bot Management
                  </CardTitle>
                  <CardDescription>
                    Manage your 8-bot affiliate automation system with real-time monitoring and control.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">8-Bot System Overview</h3>
                    <p className="text-gray-600 mb-4">
                      Your Enhanced Telegram Manager is running with 8 specialized bots for different affiliate networks:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-800">Simple Bots:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Prime Picks (Amazon Associates)</li>
                          <li>• Cue Picks (CueLinks)</li>
                          <li>• Value Picks (EarnKaro)</li>
                          <li>• DealsHub (INRDeals)</li>
                          <li>• Loot Box (Deodap)</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-800">Smart Bots:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Click Picks (CPC Optimization)</li>
                          <li>• Global Picks (Multi-Currency)</li>
                          <li>• Travel Picks (Travel Partners)</li>
                        </ul>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setLocation('/bot-admin')}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3"
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      Open Bot Management Dashboard
                    </Button>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Settings className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Real-time Control</h4>
                            <p className="text-sm text-gray-600">Start, stop, and restart bots</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Performance Metrics</h4>
                            <p className="text-sm text-gray-600">Monitor success rates and CPC</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Globe className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Method Selection</h4>
                            <p className="text-sm text-gray-600">Switch between Telegram/Scraping/API</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other Tools - Moved to separate section if needed */}
            <TabsContent value="tools" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-blue-200 mb-4">View detailed analytics and performance metrics.</p>
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
                    <p className="text-blue-200 mb-4">Configure system settings and preferences.</p>
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
        <ScrollNavigation />
      </div>
    </UniversalPageLayout>
  );
}
