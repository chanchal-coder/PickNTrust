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
  category: z.enum(['Tech', 'Home', 'Beauty', 'Fashion', 'Deals']),
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products/featured']
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
                  {products.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-navy dark:text-blue-400">Featured Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-accent-green">
                  {products.filter((p: any) => p.isFeatured).length}
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

          {/* Add Product Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-navy dark:text-blue-400">Daily Product Management</CardTitle>
              <CardDescription>
                Add new products, update affiliate links, and manage your inventory
              </CardDescription>
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

                  <div>
                    <Label htmlFor="affiliateUrl">Affiliate Link *</Label>
                    <Input
                      id="affiliateUrl"
                      {...form.register('affiliateUrl')}
                      placeholder="https://amzn.to/XXXXXXX"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Your affiliate tracking link from Amazon, Flipkart, etc.
                    </p>
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