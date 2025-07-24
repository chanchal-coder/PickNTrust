import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  originalPrice: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL'),
  affiliateUrl: z.string().url('Must be a valid URL'),
  affiliateNetworkId: z.string().optional(),
  category: z.enum(['Tech', 'Home', 'Beauty', 'Fashion', 'Deals']),
  rating: z.string().min(1, 'Rating is required'),
  reviewCount: z.string().min(1, 'Review count is required'),
  discount: z.string().optional(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

// Affiliate Network Manager Component
function AffiliateNetworkManager() {
  const { data: networks = [], isLoading } = useQuery({
    queryKey: ['/api/affiliate-networks']
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading networks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(networks as any[]).map((network: any) => (
          <div key={network.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-navy dark:text-blue-400">{network.name}</h4>
              <Badge variant={network.isActive ? "default" : "secondary"}>
                {network.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300">{network.description}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Commission Rate:</span>
                <span className="font-medium text-green-600">{network.commissionRate}%</span>
              </div>
              
              {network.trackingParams && (
                <div className="flex justify-between">
                  <span>Tracking:</span>
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">
                    {network.trackingParams}
                  </code>
                </div>
              )}
            </div>

            {network.joinUrl && (
              <a 
                href={network.joinUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-bright-blue hover:underline"
              >
                Join Network →
              </a>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">Network Integration Tips</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• Apply for networks with highest commission rates first</li>
          <li>• Use proper tracking parameters in all affiliate links</li>
          <li>• Test links regularly to ensure they work properly</li>
          <li>• Monitor performance and focus on best-converting networks</li>
          <li>• Diversify across multiple networks to maximize revenue</li>
        </ul>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [showNetworks, setShowNetworks] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products/featured']
  });

  const { data: affiliateNetworks = [] } = useQuery({
    queryKey: ['/api/affiliate-networks']
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
        affiliateNetworkId: data.affiliateNetworkId ? parseInt(data.affiliateNetworkId) : undefined,
        isNew: data.isNew || false,
        isFeatured: data.isFeatured || false,
      };
      
      const response = await fetch('/api/products', {
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
      const response = await fetch('/api/products/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: productUrl }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Auto-fill the form with extracted data
        const data = result.data;
        form.setValue('name', data.name);
        form.setValue('description', data.description);
        form.setValue('price', data.price);
        form.setValue('originalPrice', data.originalPrice);
        form.setValue('discount', data.discount);
        form.setValue('rating', data.rating);
        form.setValue('reviewCount', data.reviewCount);
        form.setValue('category', data.category);
        form.setValue('imageUrl', data.imageUrl);
        form.setValue('affiliateUrl', productUrl);
        form.setValue('affiliateNetworkId', data.affiliateNetworkId);

        toast({
          title: 'Details Extracted!',
          description: 'Product details filled automatically. Review and adjust as needed.',
        });
        
        setProductUrl('');
      } else {
        toast({
          title: 'Extraction Failed',
          description: result.message || 'Could not extract product details. Please fill manually.',
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

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password check - you can change this password
    if (password === 'pickntrust2025') {
      setIsAuthenticated(true);
      setPassword('');
      toast({
        title: 'Access Granted',
        description: 'Welcome to PickNTrust Admin Panel',
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-navy dark:text-blue-400 mb-2">
              PickNTrust Admin Panel
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your products and affiliate links daily
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-navy dark:text-blue-400">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-navy dark:text-blue-400">
                  {(products as any[]).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-navy dark:text-blue-400">Featured Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-accent-green">
                  {(products as any[]).filter((p: any) => p.isFeatured).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-navy dark:text-blue-400">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-accent-orange">5</p>
              </CardContent>
            </Card>
          </div>

          {/* Auto-Extract Section - Always Visible */}
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
                  className="bg-accent-green hover:bg-green-600 text-white px-6"
                >
                  {isExtracting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Extracting...
                    </>
                  ) : (
                    'Auto-Fill & Add'
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
                <div className="space-y-6">

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
                          <SelectItem value="Tech">Tech</SelectItem>
                          <SelectItem value="Home">Home</SelectItem>
                          <SelectItem value="Beauty">Beauty</SelectItem>
                          <SelectItem value="Fashion">Fashion</SelectItem>
                          <SelectItem value="Deals">Deals</SelectItem>
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
                  <p className="text-sm text-gray-500 mt-1">
                    Select the affiliate network and enter your tracking link
                  </p>

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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Optimization */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-navy dark:text-blue-400">Revenue Optimization</CardTitle>
                <CardDescription>Track performance and optimize earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">Performance Tracking</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>Monitor which products get the most clicks</li>
                      <li>Track conversion rates by category</li>
                      <li>Identify seasonal trending products</li>
                      <li>Analyze mobile vs desktop performance</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">A/B Testing Ideas</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>Test different product descriptions</li>
                      <li>Compare image styles (lifestyle vs product)</li>
                      <li>Try different "Pick Now" button colors</li>
                      <li>Test product positioning on homepage</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">Click-Through Rate Tips</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>Use urgency words: "Limited time", "Flash sale"</li>
                      <li>Highlight discounts prominently</li>
                      <li>Add social proof with review counts</li>
                      <li>Update bestsellers weekly</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-navy dark:text-blue-400">Seasonal Content Calendar</CardTitle>
                <CardDescription>Plan content for maximum revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">January - March</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>New Year fitness products</li>
                      <li>Valentine's Day gifts (Beauty, Fashion)</li>
                      <li>Holi festival deals</li>
                      <li>Summer prep products</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">April - June</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>Summer cooling products</li>
                      <li>Father's Day tech deals</li>
                      <li>Student tech for exams</li>
                      <li>Monsoon prep items</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">October - December</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>Diwali festival shopping</li>
                      <li>Winter clothing collection</li>
                      <li>Year-end tech deals</li>
                      <li>Christmas gifts and decor</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Affiliate Networks Management */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-navy dark:text-blue-400">Affiliate Networks</CardTitle>
              <CardDescription>Manage your affiliate partnerships and commission rates</CardDescription>
            </CardHeader>
            <CardContent>
              <AffiliateNetworkManager />
            </CardContent>
          </Card>

          {/* Quick Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-navy dark:text-blue-400">Daily Management Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-navy dark:text-blue-400">Morning Routine (10 min)</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5">
                    <li>Check affiliate partner sites for new deals</li>
                    <li>Update 2-3 products with current prices</li>
                    <li>Add 1 new product to "Deals" category</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-navy dark:text-blue-400">Best Practices</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5">
                    <li>Always test affiliate links before adding</li>
                    <li>Use high-quality product images</li>
                    <li>Update seasonal content regularly</li>
                    <li>Monitor click-through rates</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-navy dark:text-blue-400">Content Sources</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5">
                    <li>Amazon Best Sellers & Daily Deals</li>
                    <li>Flipkart Super Deals & Flash Sales</li>
                    <li>Brand websites with affiliate programs</li>
                    <li>Social media trending products</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}