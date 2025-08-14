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
import { Trash2, Edit, Share2, ExternalLink, Facebook, Twitter, Instagram, MessageCircle, Star, DollarSign, Trophy, Package, Globe, FileText, Eye, Plus, Megaphone } from 'lucide-react';

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
                Manage your products and affiliate links
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
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Products</p>
                    <p className="text-2xl font-bold">{Array.isArray(products) ? products.length : 0}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Featured Products</p>
                    <p className="text-2xl font-bold">{Array.isArray(products) ? products.filter((p: any) => p.isFeatured).length : 0}</p>
                  </div>
                  <Star className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Categories</p>
                    <p className="text-2xl font-bold">{Array.isArray(categories) ? categories.length : 0}</p>
                  </div>
                  <Globe className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">New Products</p>
                    <p className="text-2xl font-bold">{Array.isArray(products) ? products.filter((p: any) => p.isNew).length : 0}</p>
                  </div>
                  <Trophy className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Management */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-navy dark:text-blue-400">Product Management</CardTitle>
              <CardDescription>Add and manage your products</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-bright-blue hover:bg-navy text-white mb-4"
              >
                {showAddForm ? 'Cancel' : 'Add New Product'}
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
                        onValueChange={(value) => form.setValue('category', value)}
                        defaultValue="Electronics & Gadgets"
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(categories) && categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
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
                        placeholder="9999"
                      />
                    </div>

                    <div>
                      <Label htmlFor="originalPrice">Original Price (₹)</Label>
                      <Input
                        id="originalPrice"
                        {...form.register('originalPrice')}
                        placeholder="14999"
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
                  </div>

                  <div>
                    <Label htmlFor="affiliateUrl">Affiliate Link *</Label>
                    <Input
                      id="affiliateUrl"
                      {...form.register('affiliateUrl')}
                      placeholder="https://amzn.to/XXXXXXX"
                    />
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
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {addProductMutation.isPending ? 'Adding Product...' : 'Add Product'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Current Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-navy dark:text-blue-400">Current Products</CardTitle>
              <CardDescription>Manage your existing products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(products) && products.length > 0 ? (
                  products.map((product: any) => (
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
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No products found. Add your first product above!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
