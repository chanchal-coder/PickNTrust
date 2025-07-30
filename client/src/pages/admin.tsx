import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/header';
import { 
  Trash2, Edit, Share2, ExternalLink, Facebook, Twitter, Instagram, MessageCircle, 
  Star, DollarSign, Trophy, Package, Globe, FileText, Eye, Play, X, Tag, Plus, 
  Settings, TrendingUp, Calendar, Users, BarChart3, MousePointer, Target, 
  Lightbulb, CheckCircle, Clock, ShoppingBag, Heart, Zap, Gift
} from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  originalPrice: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL'),
  affiliateUrl: z.string().url('Must be a valid URL'),
  affiliateNetworkId: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  rating: z.string().min(1, 'Rating is required'),
  reviewCount: z.string().min(1, 'Review count is required'),
  discount: z.string().optional(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

// Blog post schema
const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  excerpt: z.string().min(1, 'Excerpt is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.string().min(1, 'Tags are required'),
  imageUrl: z.string().url('Must be a valid URL'),
  videoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  readTime: z.string().min(1, 'Read time is required'),
  slug: z.string().optional(),
});

type BlogPostForm = z.infer<typeof blogPostSchema>;

// Product Management Card Component
function ProductManagementCard({ product, onUpdate, onDelete }: { product: any, onUpdate: () => void, onDelete: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [editData, setEditData] = useState(product);
  const { toast } = useToast();

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'pickntrust2025' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      onDelete();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...updates, password: 'pickntrust2025' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setIsEditing(false);
      onUpdate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProductMutation.mutate(editData);
  };

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(product.affiliateUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(product.name)}&url=${encodeURIComponent(product.affiliateUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out this amazing deal: ${product.name} - ${product.affiliateUrl}`)}`,
    instagram: `https://www.instagram.com/`
  };

  return (
    <Card className="w-full mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-16 h-16 object-cover rounded-lg"
          />
          
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  placeholder="Product name"
                />
                <Input
                  value={editData.price}
                  onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                  placeholder="Price"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm">Save</Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-sm">{product.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>₹ {product.price}</span>
                  {product.originalPrice && (
                    <span className="line-through">₹ {product.originalPrice}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {product.rating} ({product.reviewCount})
                  </span>
                  <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                  {product.isFeatured && <Badge className="text-xs bg-blue-500">FEATURED</Badge>}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareMenu(!showShareMenu)}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(product.affiliateUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteProductMutation.mutate(product.id)}
              disabled={deleteProductMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showShareMenu && (
          <div className="mt-3 flex gap-2 p-2 bg-muted rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(shareUrls.facebook, '_blank')}
            >
              <Facebook className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(shareUrls.twitter, '_blank')}
            >
              <Twitter className="h-4 w-4 text-blue-400" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(shareUrls.whatsapp, '_blank')}
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(shareUrls.instagram, '_blank')}
            >
              <Instagram className="h-4 w-4 text-pink-600" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Revenue Optimization Component
function RevenueOptimization() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Performance Tracking
          </CardTitle>
          <CardDescription>Track performance and optimize earnings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>• Monitor which products get the most clicks</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>• Track conversion rates by category</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>• Identify seasonal trending products</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>• Analyze mobile vs desktop performance</span>
            </div>
          </div>
          
          <div className="pt-3 border-t">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              A/B Testing Ideas
            </h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>• Test different product descriptions</div>
              <div>• Compare button styles (Shop Now vs Buy Now)</div>
              <div>• Try different "Flash Sale" button colors</div>
              <div>• Test product positioning on homepage</div>
            </div>
          </div>

          <div className="pt-3 border-t">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-blue-500" />
              Click Through Rate Tips
            </h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>• Use urgency words "Limited Time!" "Flash Sale!"</div>
              <div>• Highlight discounts prominently</div>
              <div>• Add social proof with review counts</div>
              <div>• Update bestsellers weekly</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-purple-500" />
            Seasonal Content Calendar
          </CardTitle>
          <CardDescription>Plan content for maximum revenue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2 text-blue-600">January - March</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>• New Year fitness products</div>
              <div>• Valentine's Day gifts (Beauty, Fashion)</div>
              <div>• Holi festival deals</div>
              <div>• Summer prep products</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2 text-green-600">April - June</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>• Summer cooling products</div>
              <div>• Father's Day tech deals</div>
              <div>• Student tech for exams</div>
              <div>• Monsoon prep items</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2 text-orange-600">October - December</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>• Diwali festival shopping</div>
              <div>• Winter clothing collection</div>
              <div>• Year-end tech deals</div>
              <div>• Christmas gifts and decor</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Affiliate Networks Component
function AffiliateNetworks() {
  const { data: networks, isLoading } = useQuery({
    queryKey: ['/api/affiliate-networks'],
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading networks...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {(networks as any)?.map((network: any) => (
        <Card key={network.id} className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">{network.name}</h3>
              <Badge className="bg-blue-600 text-white">ACTIVE</Badge>
            </div>
            
            <p className="text-sm text-slate-300 mb-3">{network.description}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Commission Rate:</span>
                <span className="text-green-400 font-semibold">{network.commissionRate}%</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Tracking:</span>
                <span className="text-blue-400">{network.trackingParams || network.slug}</span>
              </div>
            </div>

            {network.joinUrl && (
              <Button 
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
                onClick={() => window.open(network.joinUrl, '_blank')}
              >
                Join Network →
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminPanel() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [extractUrl, setExtractUrl] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if already authenticated
  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Queries
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
    enabled: isAuthenticated,
  });

  const { data: blogPosts, isLoading: blogLoading } = useQuery({
    queryKey: ['/api/blog'],
    enabled: isAuthenticated,
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    enabled: isAuthenticated,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: isAuthenticated,
  });

  // Product form
  const productForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isNew: false,
      isFeatured: false,
    },
  });

  // Blog form
  const blogForm = useForm<BlogPostForm>({
    resolver: zodResolver(blogPostSchema),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'pickntrust2025') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
      toast({
        title: "Welcome!",
        description: "Successfully logged into admin panel",
      });
    } else {
      toast({
        title: "Error",
        description: "Invalid password",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuthenticated');
    setPassword('');
    navigate('/');
  };

  // Product extraction mutation
  const extractProductMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch('/api/admin/extract-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          password: 'pickntrust2025' 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract product data');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setExtractedData(data);
      toast({
        title: "Success",
        description: "Product data extracted successfully! Review and edit below.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Extraction Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: ProductForm) => {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...productData,
          password: 'pickntrust2025',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product added successfully",
      });
      productForm.reset();
      setExtractedData(null);
      setExtractUrl('');
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add blog post mutation
  const addBlogMutation = useMutation({
    mutationFn: async (blogData: BlogPostForm) => {
      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...blogData,
          tags: blogData.tags.split(',').map(tag => tag.trim()),
          publishedAt: new Date().toISOString(),
          password: 'pickntrust2025',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add blog post');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blog post added successfully",
      });
      blogForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExtractProduct = () => {
    if (!extractUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }
    
    setIsExtracting(true);
    extractProductMutation.mutate(extractUrl);
    setIsExtracting(false);
  };

  const handleAddExtractedProduct = () => {
    if (!extractedData) return;
    
    addProductMutation.mutate({
      name: extractedData.name,
      description: extractedData.description,
      price: extractedData.price,
      originalPrice: extractedData.originalPrice || '',
      imageUrl: extractedData.imageUrl,
      affiliateUrl: extractedData.affiliateUrl || extractUrl,
      category: extractedData.category,
      rating: extractedData.rating,
      reviewCount: extractedData.reviewCount,
      discount: extractedData.discount || '',
      isNew: extractedData.isNew || false,
      isFeatured: extractedData.isFeatured || false,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
                <CardDescription>Enter password to access admin panel</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="networks">Networks</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                      <p className="text-2xl font-bold">{(stats as any)?.totalProducts || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Star className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Featured Products</p>
                      <p className="text-2xl font-bold">{(stats as any)?.featuredProducts || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Blog Posts</p>
                      <p className="text-2xl font-bold">{(stats as any)?.blogPosts || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Categories</p>
                      <p className="text-2xl font-bold">{(stats as any)?.categories || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Manual Product Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  Manual Product Management
                </CardTitle>
                <CardDescription>
                  Add products manually or edit auto-extracted details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setShowManualForm(!showManualForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add Product Manually
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('products')}>
                <CardContent className="p-4 text-center">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold">Manage Products</h3>
                  <p className="text-sm text-muted-foreground">Add, edit, delete products</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('blog')}>
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold">Manage Blog</h3>
                  <p className="text-sm text-muted-foreground">Create and manage posts</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('revenue')}>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-semibold">Revenue Optimization</h3>
                  <p className="text-sm text-muted-foreground">Track performance & tips</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('networks')}>
                <CardContent className="p-4 text-center">
                  <Globe className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <h3 className="font-semibold">Affiliate Networks</h3>
                  <p className="text-sm text-muted-foreground">Manage partnerships</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {/* URL Extraction Section */}
            <Card>
              <CardHeader>
                <CardTitle>Auto-Extract Product Details</CardTitle>
                <CardDescription>
                  Paste any product URL to automatically extract details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste Amazon, Flipkart, or any product URL here..."
                    value={extractUrl}
                    onChange={(e) => setExtractUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleExtractProduct}
                    disabled={extractProductMutation.isPending || isExtracting}
                  >
                    {extractProductMutation.isPending || isExtracting ? 'Extracting...' : 'Extract'}
                  </Button>
                </div>
                
                {extractedData && (
                  <Card className="mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <CardHeader>
                      <CardTitle className="text-lg text-green-800 dark:text-green-200">
                        ✅ Product Extracted Successfully!
                      </CardTitle>
                      <CardDescription className="text-green-700 dark:text-green-300">
                        Review the extracted information below and edit if needed, then click "Add to Catalog"
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <img 
                            src={extractedData.imageUrl} 
                            alt={extractedData.name}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Product Name</Label>
                            <Input
                              value={extractedData.name}
                              onChange={(e) => setExtractedData({...extractedData, name: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-sm font-medium">Price</Label>
                              <Input
                                value={extractedData.price}
                                onChange={(e) => setExtractedData({...extractedData, price: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Original Price</Label>
                              <Input
                                value={extractedData.originalPrice || ''}
                                onChange={(e) => setExtractedData({...extractedData, originalPrice: e.target.value})}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-sm font-medium">Rating</Label>
                              <Input
                                value={extractedData.rating}
                                onChange={(e) => setExtractedData({...extractedData, rating: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Reviews</Label>
                              <Input
                                value={extractedData.reviewCount}
                                onChange={(e) => setExtractedData({...extractedData, reviewCount: e.target.value})}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <Textarea
                          value={extractedData.description}
                          onChange={(e) => setExtractedData({...extractedData, description: e.target.value})}
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Category</Label>
                          <Select 
                            value={extractedData.category} 
                            onValueChange={(value) => setExtractedData({...extractedData, category: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(categories as any)?.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.name}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Discount %</Label>
                          <Input
                            value={extractedData.discount || ''}
                            onChange={(e) => setExtractedData({...extractedData, discount: e.target.value})}
                            placeholder="e.g., 25"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Affiliate URL</Label>
                          <Input
                            value={extractedData.affiliateUrl || extractUrl}
                            onChange={(e) => setExtractedData({...extractedData, affiliateUrl: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={extractedData.isNew || false}
                            onChange={(e) => setExtractedData({...extractedData, isNew: e.target.checked})}
                            className="rounded"
                          />
                          <span className="text-sm">Mark as New</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={extractedData.isFeatured || false}
                            onChange={(e) => setExtractedData({...extractedData, isFeatured: e.target.checked})}
                            className="rounded"
                          />
                          <span className="text-sm">Mark as Featured</span>
                        </label>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={handleAddExtractedProduct}
                          disabled={addProductMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {addProductMutation.isPending ? 'Adding...' : '✅ Add to Catalog'}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setExtractedData(null);
                            setExtractUrl('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Manual Product Form */}
            {showManualForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Product Manually</CardTitle>
                  <CardDescription>Enter product details manually</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={productForm.handleSubmit((data) => addProductMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                          id="name"
                          {...productForm.register('name')}
                          placeholder="Enter product name"
                        />
                        {productForm.formState.errors.name && (
                          <p className="text-sm text-red-600">{productForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select onValueChange={(value) => productForm.setValue('category', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {(categories as any)?.map((category: any) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {productForm.formState.errors.category && (
                          <p className="text-sm text-red-600">{productForm.formState.errors.category.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        {...productForm.register('description')}
                        placeholder="Enter product description"
                        rows={3}
                      />
                      {productForm.formState.errors.description && (
                        <p className="text-sm text-red-600">{productForm.formState.errors.description.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="price">Price</Label>
                        <Input
                          id="price"
                          {...productForm.register('price')}
                          placeholder="e.g., 1299.00"
                        />
                        {productForm.formState.errors.price && (
                          <p className="text-sm text-red-600">{productForm.formState.errors.price.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="originalPrice">Original Price (Optional)</Label>
                        <Input
                          id="originalPrice"
                          {...productForm.register('originalPrice')}
                          placeholder="e.g., 1999.00"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="discount">Discount % (Optional)</Label>
                        <Input
                          id="discount"
                          {...productForm.register('discount')}
                          placeholder="e.g., 25"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input
                          id="imageUrl"
                          {...productForm.register('imageUrl')}
                          placeholder="https://example.com/image.jpg"
                        />
                        {productForm.formState.errors.imageUrl && (
                          <p className="text-sm text-red-600">{productForm.formState.errors.imageUrl.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="affiliateUrl">Affiliate URL</Label>
                        <Input
                          id="affiliateUrl"
                          {...productForm.register('affiliateUrl')}
                          placeholder="https://affiliate-link.com"
                        />
                        {productForm.formState.errors.affiliateUrl && (
                          <p className="text-sm text-red-600">{productForm.formState.errors.affiliateUrl.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="rating">Rating</Label>
                        <Input
                          id="rating"
                          {...productForm.register('rating')}
                          placeholder="e.g., 4.5"
                        />
                        {productForm.formState.errors.rating && (
                          <p className="text-sm text-red-600">{productForm.formState.errors.rating.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="reviewCount">Review Count</Label>
                        <Input
                          id="reviewCount"
                          {...productForm.register('reviewCount')}
                          placeholder="e.g., 1234"
                        />
                        {productForm.formState.errors.reviewCount && (
                          <p className="text-sm text-red-600">{productForm.formState.errors.reviewCount.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...productForm.register('isNew')}
                          className="rounded"
                        />
                        <span>Mark as New</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...productForm.register('isFeatured')}
                          className="rounded"
                        />
                        <span>Mark as Featured</span>
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={addProductMutation.isPending}
                      >
                        {addProductMutation.isPending ? 'Adding...' : 'Add Product'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowManualForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Product Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Management
                </CardTitle>
                <CardDescription>
                  Manage all your products with full control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Current Products ({(products as any)?.length || 0})</h3>
                </div>
                
                {productsLoading ? (
                  <div className="text-center py-8">Loading products...</div>
                ) : (products as any)?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No products added yet. Add your first product above!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(products as any)?.map((product: any) => (
                      <ProductManagementCard
                        key={product.id}
                        product={product}
                        onUpdate={() => queryClient.invalidateQueries({ queryKey: ['/api/products'] })}
                        onDelete={() => queryClient.invalidateQueries({ queryKey: ['/api/products'] })}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blog" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Blog Post</CardTitle>
                <CardDescription>Create engaging content for your audience</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={blogForm.handleSubmit((data) => addBlogMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        {...blogForm.register('title')}
                        placeholder="Enter blog post title"
                      />
                      {blogForm.formState.errors.title && (
                        <p className="text-sm text-red-600">{blogForm.formState.errors.title.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select onValueChange={(value) => blogForm.setValue('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Shopping Tips">Shopping Tips</SelectItem>
                          <SelectItem value="Product Reviews">Product Reviews</SelectItem>
                          <SelectItem value="Deals & Offers">Deals & Offers</SelectItem>
                          <SelectItem value="Tech News">Tech News</SelectItem>
                          <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                        </SelectContent>
                      </Select>
                      {blogForm.formState.errors.category && (
                        <p className="text-sm text-red-600">{blogForm.formState.errors.category.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      {...blogForm.register('excerpt')}
                      placeholder="Brief summary of the blog post"
                      rows={2}
                    />
                    {blogForm.formState.errors.excerpt && (
                      <p className="text-sm text-red-600">{blogForm.formState.errors.excerpt.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      {...blogForm.register('content')}
                      placeholder="Full blog post content (supports markdown)"
                      rows={8}
                    />
                    {blogForm.formState.errors.content && (
                      <p className="text-sm text-red-600">{blogForm.formState.errors.content.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="imageUrl">Featured Image URL</Label>
                      <Input
                        id="imageUrl"
                        {...blogForm.register('imageUrl')}
                        placeholder="https://example.com/image.jpg"
                      />
                      {blogForm.formState.errors.imageUrl && (
                        <p className="text-sm text-red-600">{blogForm.formState.errors.imageUrl.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="videoUrl">Video URL (Optional)</Label>
                      <Input
                        id="videoUrl"
                        {...blogForm.register('videoUrl')}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="readTime">Read Time</Label>
                      <Input
                        id="readTime"
                        {...blogForm.register('readTime')}
                        placeholder="e.g., 5 min read"
                      />
                      {blogForm.formState.errors.readTime && (
                        <p className="text-sm text-red-600">{blogForm.formState.errors.readTime.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      {...blogForm.register('tags')}
                      placeholder="shopping, deals, tech, lifestyle"
                    />
                    {blogForm.formState.errors.tags && (
                      <p className="text-sm text-red-600">{blogForm.formState.errors.tags.message}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={addBlogMutation.isPending}>
                    {addBlogMutation.isPending ? 'Publishing...' : 'Publish Blog Post'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Blog Posts List */}
            <Card>
              <CardHeader>
                <CardTitle>Published Blog Posts</CardTitle>
                <CardDescription>Manage your published content</CardDescription>
              </CardHeader>
              <CardContent>
                {blogLoading ? (
                  <div className="text-center py-8">Loading blog posts...</div>
                ) : (blogPosts as any)?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No blog posts published yet. Create your first post above!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(blogPosts as any)?.map((post: any) => (
                      <Card key={post.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{post.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{post.excerpt}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">{post.category}</Badge>
                              <span className="text-xs text-muted-foreground">{post.readTime}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(post.publishedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <img 
                            src={post.imageUrl} 
                            alt={post.title}
                            className="w-16 h-16 object-cover rounded ml-4"
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <RevenueOptimization />
          </TabsContent>

          <TabsContent value="networks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Affiliate Networks
                </CardTitle>
                <CardDescription>
                  Manage your affiliate partnerships and commission rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AffiliateNetworks />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage your admin panel settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Admin Authentication</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Current password: pickntrust2025
                    </p>
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Data Management</h3>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm">
                        Export Products
                      </Button>
                      <Button variant="outline" size="sm">
                        Export Blog Posts
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}