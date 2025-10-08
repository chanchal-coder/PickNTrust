import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectSeparator } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, Eye, Clock, Image } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  imageUrl: string;
  publishedAt: string;
  readTime: string;
  slug: string;
  hasTimer?: boolean;
  timerDuration?: string;
}

export default function SimplifiedBlogForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    imageUrl: '',
    videoUrl: '',
    readTime: '3 min read',
    slug: '',
    publishDate: new Date().toISOString().split('T')[0],
    hasTimer: false,
    timerDuration: '24'
  });

  // Fetch ALL categories from DB for form dropdown (no filtering)
  const { data: browseCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const list = await res.json();
      return (Array.isArray(list) ? list : []).map((c: any) => ({
        id: c.id || c.name,
        name: c.name,
        isForProducts: c.isForProducts,
        isForServices: c.isForServices,
        isForAIApps: c.isForAIApps,
      }));
    },
    // Always refetch on mount to reflect latest flags
    staleTime: 0,
  });

  // Group categories by type for clearer selection (Products, Services, AI Apps, General)
  const groupedBlogCategories = (browseCategories || []).reduce((groups: Record<string, any[]>, cat: any) => {
    const add = (label: string) => {
      if (!groups[label]) groups[label] = [];
      groups[label].push(cat);
    };
    if (cat.isForProducts) add('Products');
    if (cat.isForServices) add('Services');
    if (cat.isForAIApps) add('AI Apps');
    if (!cat.isForProducts && !cat.isForServices && !cat.isForAIApps) add('General');
    return groups;
  }, {} as Record<string, any[]>);
  const blogCategoryGroupOrder = ['Products', 'Services', 'AI Apps', 'General'];

  // Handle image upload - Optimized with compression for better performance
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - support all common image formats
    const supportedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
      'image/bmp', 'image/svg+xml', 'image/tiff', 'image/tif', 'image/ico',
      'image/avif', 'image/heic', 'image/heif'
    ];
    
    if (!supportedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a valid image file (JPEG, PNG, GIF, WebP, BMP, SVG, TIFF, ICO, AVIF, HEIC)',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (limit to 10MB - server now supports up to 50MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 10MB. For larger images, use an image URL instead.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);
    
    try {
      // Compress image for better performance
      const compressedFile = await compressImage(file);
      
      // Convert compressed file to base64 for storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setNewPost({ ...newPost, imageUrl: result });
        setUploadingImage(false);
        
        // Get file extension for success message
        const fileExtension = file.type.split('/')[1].toUpperCase();
        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
        toast({
          title: 'Success',
          description: `${fileExtension} image uploaded successfully! Original: ${originalSize}MB → Optimized: ${compressedSize}MB`,
        });
      };
      
      reader.onerror = () => {
        setUploadingImage(false);
        toast({
          title: 'Upload Error',
          description: 'Failed to read the image file. Please try again.',
          variant: 'destructive',
        });
      };
      
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      setUploadingImage(false);
      toast({
        title: 'Error',
        description: 'Failed to upload image. Try using a smaller image or an image URL instead.',
        variant: 'destructive',
      });
    }
  };

  // Image compression function for better performance
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      
      img.onload = () => {
        if (!ctx) {
          resolve(file); // Fallback if no context
          return;
        }
        
        // Calculate new dimensions (max 1200px width, maintain aspect ratio)
        const maxWidth = 1200;
        const maxHeight = 800;
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original if compression fails
            }
          },
          file.type,
          0.8 // 80% quality for good balance of size and quality
        );
      };
      
      img.onerror = () => resolve(file); // Fallback to original if loading fails
      img.src = URL.createObjectURL(file);
    });
  };

  // Fetch blog posts
  const { data: blogPosts = [], isLoading, error } = useQuery({
    queryKey: ['/api/blog'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/blog');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error('Server returned non-JSON response. Check server logs.');
        }
        
        return response.json();
      } catch (error) {
        console.error('Blog fetch error:', error);
        throw error;
      }
    },
    retry: 1
  });

  // Add blog post mutation
  const addBlogPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      try {
        const adminPassword = 'pickntrust2025';
        const tagsArray = postData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
        
        const payload = {
          password: adminPassword,
          ...postData,
          tags: JSON.stringify(tagsArray),
          publishedAt: new Date().toISOString(),
          slug: postData.slug || postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          hasTimer: postData.hasTimer,
          timerDuration: postData.hasTimer ? postData.timerDuration : null
        };

        const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
          } else {
            const errorText = await response.text();
            console.error('Non-JSON error response:', errorText);
            throw new Error(`Server error: ${response.status} ${response.statusText}. Check server logs.`);
          }
        }

        const result = await response.json();
        return result;
      } catch (error) {

        throw error;
      }
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      
      // Trigger Canva automation for the newly added blog post (only if enabled)
      if (data && data.id) {
        try {
          // First check if blog post automation is enabled
          const password = localStorage.getItem('adminPassword') || 'pickntrust2025';
          const settingsResponse = await fetch(`/api/admin/canva/settings?password=${password}`);
          
          if (settingsResponse.ok) {
            const settings = await settingsResponse.json();
            const isBlogAutomationEnabled = settings.enableBlogPosts !== false; // Default to true if not set
            
            if (isBlogAutomationEnabled && settings.isEnabled) {
              const canvaResponse = await fetch('/api/admin/canva/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  password, 
                  contentType: 'blog', 
                  contentId: data.id 
                })
              });
              
              if (canvaResponse.ok) {
                const canvaResult = await canvaResponse.json();
                toast({
                  title: '<i className="fas fa-palette"></i> Blog Post Published!',
                  description: 'Blog post added and Canva automation started for social media posting.',
                });
              } else {
                toast({
                  title: 'Blog Post Published <i className="fas fa-check-circle"></i>',
                  description: 'Blog post added successfully! (Canva automation may be disabled)',
                });
              }
            } else {
              toast({
                title: 'Blog Post Published <i className="fas fa-check-circle"></i>',
                description: 'Blog post added successfully! (Blog automation is disabled)',
              });
            }
          } else {
            toast({
              title: 'Blog Post Published <i className="fas fa-check-circle"></i>',
              description: 'Blog post added successfully!',
            });
          }
        } catch (canvaError) {
          toast({
            title: 'Blog Post Published <i className="fas fa-check-circle"></i>',
            description: 'Blog post added successfully! (Canva automation encountered an issue)',
          });
        }
      } else {
        toast({
          title: 'Success',
          description: 'Blog post added successfully!',
        });
      }
      
      setNewPost({
        title: '',
        excerpt: '',
        content: '',
        category: '',
        tags: '',
        imageUrl: '',
        videoUrl: '',
        readTime: '3 min read',
        slug: '',
        publishDate: new Date().toISOString().split('T')[0],
        hasTimer: false,
        timerDuration: '24'
      });
      setIsAddingPost(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add blog post',
        variant: 'destructive',
      });
    }
  });

  // Delete blog post mutation
  const deleteBlogPostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const adminPassword = 'pickntrust2025';
      const response = await fetch(`/api/admin/blog/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete blog post');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete blog post',
        variant: 'destructive',
      });
    }
  });

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({
        title: 'Error',
        description: 'Title and content are required',
        variant: 'destructive',
      });
      return;
    }
    addBlogPostMutation.mutate(newPost);
  };

  const handleDeletePost = (postId: number) => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      deleteBlogPostMutation.mutate(postId);
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setNewPost({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: typeof post.tags === 'string' ? JSON.parse(post.tags).join(', ') : post.tags,
      imageUrl: post.imageUrl,
      videoUrl: (post as any).videoUrl || '',
      readTime: post.readTime,
      slug: post.slug,
      publishDate: new Date(post.publishedAt).toISOString().split('T')[0],
      hasTimer: post.hasTimer || false,
      timerDuration: post.timerDuration || '24'
    });
    setIsAddingPost(true);
    
    toast({
      title: 'Edit Mode',
      description: 'Blog post loaded for editing. Make your changes and save.',
    });
  };

  // Removed hardcoded categories in favor of DB-driven categories

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Blog Posts</CardTitle>
          <CardDescription className="text-gray-700">
            Failed to load blog posts. Check your server connection.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white"><i className="fas fa-edit"></i> Image Blog Management</h2>
          <p className="text-gray-600 dark:text-gray-300">Create engaging blog posts with high-quality images up to 10MB</p>
        </div>
        <Button 
          onClick={() => setIsAddingPost(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Blog Post
        </Button>
      </div>

      {isAddingPost && (
        <Card className="bg-gray-900 text-white border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <Plus className="w-5 h-5" />
              Create New Blog Post
            </CardTitle>
            <CardDescription className="text-gray-300">
              Add engaging content with high-quality image support (up to 10MB) and optional auto-delete timer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleAddPost} className="space-y-6">
              <div>
                <Label className="text-white font-medium">Blog Title *</Label>
                <Input
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="10 Best Budget Smartphones Under ₹20,000"
                  className="bg-gray-800 border-gray-600 text-white mt-2"
                  required
                />
              </div>

              <div>
                <Label className="text-white font-medium">Excerpt *</Label>
                <Textarea
                  value={newPost.excerpt}
                  onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                  placeholder="Short description for homepage"
                  className="bg-gray-800 border-gray-600 text-white mt-2"
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label className="text-white font-medium">Full Content *</Label>
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Full blog post content with Markdown formatting"
                  className="bg-gray-800 border-gray-600 text-white mt-2 font-mono text-sm"
                  rows={12}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white font-medium">Category *</Label>
                  <Select 
                    value={newPost.category}
                    onValueChange={(value) => setNewPost({ ...newPost, category: value })}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
                      <SelectValue placeholder={categoriesLoading ? 'Loading categories...' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {blogCategoryGroupOrder.filter(label => groupedBlogCategories[label]?.length).map((label, idx, arr) => (
                        <SelectGroup key={label}>
                          <div className="px-2 py-1 text-xs uppercase tracking-wide font-bold text-white">{label}</div>
                          {groupedBlogCategories[label].map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.name} className="text-white hover:bg-gray-700">
                              {cat.name}
                            </SelectItem>
                          ))}
                          {idx < arr.length - 1 && <SelectSeparator className="bg-gray-700" />}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white font-medium">Tags</Label>
                  <Input
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    placeholder="deals, budget, tech, gadgets"
                    className="bg-gray-800 border-gray-600 text-white mt-2"
                  />
                </div>
              </div>

              {/* Image Section - Enhanced with 10MB support */}
              <div>
                <Label className="text-white font-medium">Blog Image</Label>
                <Input
                  value={newPost.imageUrl}
                  onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
                  placeholder="Paste image URL here or upload from device"
                  className="bg-gray-800 border-gray-600 text-white mt-2"
                />
                <div className="mt-2">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,image/tiff,image/ico,image/avif,image/heic" 
                    className="hidden" 
                    id="image-upload"
                    onChange={handleImageUpload}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="text-xs"
                    disabled={uploadingImage}
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {uploadingImage ? 'Uploading...' : 'Upload from Device'}
                  </Button>
                  <p className="text-xs text-blue-400 mt-1"><i className="fas fa-folder"></i> Supports: JPEG, PNG, GIF, WebP, BMP, SVG, TIFF, ICO, AVIF, HEIC (max 10MB)</p>
                </div>
                
                {newPost.imageUrl && (
                  <div className="mt-3 border border-gray-600 rounded-lg overflow-hidden">
                    <img 
                      src={newPost.imageUrl} 
                      alt="Preview" 
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400';
                      }}
                    />
                    <div className="p-2 bg-gray-800">
                      <p className="text-xs text-green-400"><i className="fas fa-check-circle"></i> High-quality image loaded successfully</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Video URL Section */}
              <div>
                <Label className="text-white font-medium">Video URL (Optional)</Label>
                <Input
                  value={newPost.videoUrl}
                  onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                  className="bg-gray-800 border-gray-600 text-white mt-2"
                />
                <p className="text-xs text-blue-400 mt-1"><i className="fas fa-film"></i> Supports: YouTube, Vimeo, TikTok, Instagram, Facebook, Twitter, Dailymotion, Twitch</p>
                
                {newPost.videoUrl && (
                  <div className="mt-3 p-3 bg-gray-800 border border-gray-600 rounded-lg">
                    <p className="text-xs text-green-400"><i className="fas fa-check-circle"></i> Video URL added - will be displayed in blog post</p>
                  </div>
                )}
              </div>

              {/* Auto-Delete Timer Section - Exact match to product form */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasTimer"
                    checked={newPost.hasTimer}
                    onChange={(e) => setNewPost({ ...newPost, hasTimer: e.target.checked })}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                  <Label htmlFor="hasTimer" className="text-white text-sm">
                    <i className="fas fa-check-circle"></i> Add Countdown Timer
                  </Label>
                </div>

                {newPost.hasTimer && (
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Timer Duration (hours)</Label>
                    <Select 
                      value={newPost.timerDuration}
                      onValueChange={(value) => setNewPost({ ...newPost, timerDuration: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="1" className="text-white hover:bg-gray-700">1 hour</SelectItem>
                        <SelectItem value="2" className="text-white hover:bg-gray-700">2 hours</SelectItem>
                        <SelectItem value="3" className="text-white hover:bg-gray-700">3 hours</SelectItem>
                        <SelectItem value="6" className="text-white hover:bg-gray-700">6 hours</SelectItem>
                        <SelectItem value="12" className="text-white hover:bg-gray-700">12 hours</SelectItem>
                        <SelectItem value="24" className="text-white hover:bg-gray-700">24 hours (1 day)</SelectItem>
                        <SelectItem value="48" className="text-white hover:bg-gray-700">48 hours (2 days)</SelectItem>
                        <SelectItem value="72" className="text-white hover:bg-gray-700">72 hours (3 days)</SelectItem>
                        <SelectItem value="168" className="text-white hover:bg-gray-700">168 hours (1 week)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-yellow-400 text-xs">
                      <i className="fas fa-exclamation-triangle"></i> Blog post will be automatically deleted when timer expires
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-white font-medium">Publish Date</Label>
                  <Input
                    type="date"
                    value={newPost.publishDate}
                    onChange={(e) => setNewPost({ ...newPost, publishDate: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white mt-2"
                  />
                </div>

                <div>
                  <Label className="text-white font-medium">Read Time</Label>
                  <Input
                    value={newPost.readTime}
                    onChange={(e) => setNewPost({ ...newPost, readTime: e.target.value })}
                    placeholder="3 min read"
                    className="bg-gray-800 border-gray-600 text-white mt-2"
                  />
                </div>

                <div>
                  <Label className="text-white font-medium">URL Slug</Label>
                  <Input
                    value={newPost.slug}
                    onChange={(e) => setNewPost({ ...newPost, slug: e.target.value })}
                    placeholder="url-friendly-title"
                    className="bg-gray-800 border-gray-600 text-white mt-2"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  className="text-blue-400 border-blue-400 hover:bg-blue-900"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Live Preview
                </Button>

                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingPost(false)}
                    className="text-gray-400 border-gray-600 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addBlogPostMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {addBlogPostMutation.isPending ? 'Publishing...' : 'Publish Blog Post'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Current Blog Posts ({blogPosts.length})
          </CardTitle>
          <CardDescription className="text-blue-200">
            Manage all your high-quality image-based blog posts (up to 10MB each)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading blog posts...</p>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No blog posts found. Add your first post above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {blogPosts.map((post: BlogPost) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={post.imageUrl || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400'} 
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-blue-400 mb-1 truncate">{post.title}</h3>
                    <p className="text-gray-300 text-sm mb-2 line-clamp-1">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">{post.category}</span>
                      <span className="text-gray-400">{post.readTime}</span>
                      <span className="text-gray-400">{new Date(post.publishedAt).toLocaleDateString()}</span>
                      {post.hasTimer && (
                        <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.timerDuration}h timer
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      title="View blog post"
                    >
                      <i className="fas fa-external-link-alt text-gray-300"></i>
                    </button>
                    <button
                      onClick={() => handleEditPost(post)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Edit blog post"
                    >
                      <i className="fas fa-edit text-gray-300"></i>
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deleteBlogPostMutation.isPending}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      title="Delete blog post"
                    >
                      <i className="fas fa-trash text-white"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
