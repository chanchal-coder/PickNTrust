import { useState, useEffect } from 'react';
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
import { Trash2, Edit, Share2, ExternalLink, Facebook, Twitter, Instagram, MessageCircle, Star, DollarSign, Trophy, Package, Globe, FileText, Eye, Play, X, Tag, Plus } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  originalPrice: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL'),
  affiliateUrl: z.string().url('Must be a valid URL'),
  affiliateNetworkId: z.string().optional(),
  category: z.enum(['Tech', 'Home', 'Beauty', 'Fashion', 'Deals', 'Fitness', 'Books', 'Kitchen', 'Gaming', 'Travel', 'Baby', 'Pets', 'Automotive']),
  rating: z.string().min(1, 'Rating is required'),
  reviewCount: z.string().min(1, 'Review count is required'),
  discount: z.string().optional(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

// Product Management Card Component
function ProductManagementCard({ product, onUpdate, onDelete }: { product: any, onUpdate: () => void, onDelete: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const { toast } = useToast();

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Product Deleted!',
        description: 'Product has been removed successfully.',
      });
      onDelete();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete product. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const handleShare = (platform: string) => {
    const productUrl = `${window.location.origin}`;
    const productText = `Check out this amazing deal: ${product.name} - ₹${product.price}${product.originalPrice ? ` (was ₹${product.originalPrice})` : ''} at PickNTrust!`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(productText)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(productText)}&url=${encodeURIComponent(productUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(productText + ' ' + productUrl)}`;
        break;
      case 'instagram':
        // Updated Instagram sharing - opens Instagram with better integration
        const instagramText = `🛍️ Amazing Deal Alert! ${product.name} - Only ₹${product.price}${product.originalPrice ? ` (was ₹${product.originalPrice})` : ''}! 💰\n\n✨ Get the best deals at PickNTrust\n\n#PickNTrust #Deals #Shopping #BestPrice`;
        
        // Copy to clipboard for easy sharing
        navigator.clipboard.writeText(instagramText + '\n\n' + productUrl);
        
        // Try to open Instagram app or web
        const instagramUrl = 'https://www.instagram.com/';
        window.open(instagramUrl, '_blank');
        
        toast({
          title: 'Instagram Ready!',
          description: 'Content copied to clipboard and Instagram opened. Paste to create your post!',
        });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    setShowShareMenu(false);
  };

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
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
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            
            {showShareMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-700 border rounded-lg shadow-lg p-2 z-10">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    <Facebook className="w-4 h-4 text-blue-600" />
                    Facebook
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    <Twitter className="w-4 h-4 text-blue-400" />
                    Twitter
                  </button>
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                  >
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleShare('instagram')}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                  >
                    <Instagram className="w-4 h-4 text-purple-600" />
                    Instagram
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(product.affiliateUrl, '_blank')}
            className="p-2"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="p-2"
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleteProductMutation.isPending}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

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
  const [extractedProduct, setExtractedProduct] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [showBlogForm, setShowBlogForm] = useState(false);
  

  
  const [blogFormData, setBlogFormData] = useState({
    title: '',
    excerpt: '',
    imageUrl: '',
    videoUrl: '',
    publishedAt: new Date().toISOString().split('T')[0],
    readTime: '3 min read',
    slug: ''
  });
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  // File upload helper function
  const uploadFile = async (file: File, type: 'image' | 'video') => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      
      if (type === 'image') {
        setBlogFormData({...blogFormData, imageUrl: result.url});
      } else {
        setBlogFormData({...blogFormData, videoUrl: result.url});
      }
      
      toast({ 
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded!`, 
        description: `Your ${type} has been uploaded successfully.` 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: `Failed to upload ${type}.`, 
        variant: 'destructive' 
      });
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setUploadingImage(true);
        await uploadFile(file, 'image');
        setUploadingImage(false);
      } else if (file.type.startsWith('video/')) {
        setUploadingVideo(true);
        await uploadFile(file, 'video');
        setUploadingVideo(false);
      } else {
        toast({ 
          title: 'Invalid file type', 
          description: 'Please upload an image or video file.', 
          variant: 'destructive' 
        });
      }
    }
  };

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

  const { data: affiliateNetworks = [] } = useQuery({
    queryKey: ['/api/affiliate-networks']
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories']
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['/api/blog']
  });

  // Achievement system
  useEffect(() => {
    if (blogPosts && Array.isArray(blogPosts)) {
      setTotalPosts(blogPosts.length);
      const newAchievements = [];
      
      if (blogPosts.length >= 1) newAchievements.push('First Post');
      if (blogPosts.length >= 5) newAchievements.push('Content Creator');
      if (blogPosts.length >= 10) newAchievements.push('Blog Master');
      if (blogPosts.some((p: any) => p.videoUrl)) newAchievements.push('Video Pioneer');
      
      setAchievements(newAchievements);
    }
    
    if (products && Array.isArray(products)) {
      setTotalProducts(products.length);
    }
  }, [blogPosts, products]);

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
      // Reset extracted product data
      setExtractedProduct(null);
      setShowPreview(false);
      // Form reset would go here if form was available
      /*form.reset({
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
      });*/
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

  // Blog management mutations
  const addBlogMutation = useMutation({
    mutationFn: async (blogData: any) => {
      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...blogData, password: 'pickntrust2025' }),
      });
      if (!response.ok) throw new Error('Failed to add blog post');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Blog Post Added!', description: 'Your blog post has been published successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      setBlogFormData({ title: '', excerpt: '', imageUrl: '', videoUrl: '', publishedAt: new Date().toISOString().split('T')[0], readTime: '3 min read', slug: '' });
      setShowBlogForm(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add blog post. Please try again.', variant: 'destructive' });
    },
  });

  const deleteBlogMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'pickntrust2025' }),
      });
      if (!response.ok) throw new Error('Failed to delete blog post');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Blog Post Deleted!', description: 'Blog post has been removed successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete blog post. Please try again.', variant: 'destructive' });
    },
  });

  const updateBlogMutation = useMutation({
    mutationFn: async ({ id, ...blogData }: any) => {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...blogData, password: 'pickntrust2025' }),
      });
      if (!response.ok) throw new Error('Failed to update blog post');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Blog Post Updated!', description: 'Blog post has been updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      setEditingBlog(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update blog post. Please try again.', variant: 'destructive' });
    },
  });



  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('pickntrust-admin-session');
    toast({
      title: 'Logged Out',
      description: 'Admin session ended.',
    });
  };

  const handlePasswordSubmit = (e: any) => {
    e.preventDefault();
    if (password === 'pickntrust2025') {
      setIsAuthenticated(true);
      localStorage.setItem('pickntrust-admin-session', 'active');
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
                Password management features have been removed
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

          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">
              Password Management Removed
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              All password management features have been removed per your request.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Admin panel now uses simple authentication only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
