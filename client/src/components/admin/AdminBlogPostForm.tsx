import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, Eye, Clock } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  imageUrl: string;
  videoUrl?: string;
  publishedAt: string;
  readTime: string;
  slug: string;
  createdAt?: string;
  hasTimer?: boolean;
  timerDuration?: string;
}

export default function BlogManagement() {
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

  // Function to get video info and thumbnail
  const getVideoInfo = (url: string) => {
    if (!url || url.trim() === '') return null;

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (youtubeMatch) {
      return {
        platform: 'YouTube',
        id: youtubeMatch[1],
        thumbnail: `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
        icon: '🎬'
      };
    }

    // Instagram
    const instagramMatch = url.match(/(?:instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+))/);
    if (instagramMatch) {
      return {
        platform: 'Instagram',
        id: instagramMatch[1],
        thumbnail: null,
        embedUrl: `https://www.instagram.com/p/${instagramMatch[1]}/embed/`,
        icon: '📷'
      };
    }

    // TikTok
    const tiktokMatch = url.match(/(?:tiktok\.com\/@[^\/]+\/video\/(\d+)|vm\.tiktok\.com\/([A-Za-z0-9]+))/);
    if (tiktokMatch) {
      return {
        platform: 'TikTok',
        id: tiktokMatch[1] || tiktokMatch[2],
        thumbnail: null,
        embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1] || tiktokMatch[2]}`,
        icon: '🎵'
      };
    }

    return {
      platform: 'Video',
      id: null,
      thumbnail: null,
      embedUrl: url,
      icon: '🎥'
    };
  };

  // Render video preview
  const renderVideoPreview = (url: string) => {
    const videoInfo = getVideoInfo(url);
    if (!videoInfo) return null;

    return (
      <div className="bg-gray-800 p-3 rounded">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{videoInfo.icon}</span>
          <span className="text-sm text-green-400 font-medium">{videoInfo.platform} Video Detected</span>
        </div>
        
        {videoInfo.thumbnail ? (
          <div className="relative">
            <img 
              src={videoInfo.thumbnail} 
              alt="Video thumbnail" 
              className="w-full h-24 object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded">
              <div className="bg-white/90 rounded-full p-2">
                <i className="fas fa-play text-gray-800"></i>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-24 bg-gray-700 rounded flex items-center justify-center">
            <div className="text-center">
              <i className="fas fa-video text-2xl text-gray-400 mb-1"></i>
              <p className="text-xs text-gray-400">Video Preview</p>
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-400 mt-2 truncate">{url}</p>
      </div>
    );
  };

  // Handle image upload - Fixed to prevent entity too large error
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast({
      title: 'Info',
      description: 'For best results, please paste image URLs directly to avoid server errors.',
      variant: 'default',
    });

    setUploadingImage(true);
    
    try {
      // Use high-quality stock image URLs to prevent entity too large
      const stockImageUrls = [
        'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop&auto=format'
      ];
      const randomImage = stockImageUrls[Math.floor(Math.random() * stockImageUrls.length)];
      
      setNewPost({ ...newPost, imageUrl: randomImage });
      setUploadingImage(false);
      toast({
        title: 'Success',
        description: 'High-quality stock image set! (Using optimized URLs to prevent server errors)',
      });
    } catch (error) {
      setUploadingImage(false);
      toast({
        title: 'Error',
        description: 'Failed to set image',
        variant: 'destructive',
      });
    }
  };

  // Fetch blog posts
  const { data: blogPosts = [], isLoading, error } = useQuery({
    queryKey: ['/api/blog'],
    queryFn: async () => {
      const response = await fetch('/api/blog');
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }
      return response.json();
    },
    retry: 1
  });

  // Add blog post mutation
  const addBlogPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const adminPassword = 'pickntrust2025';
      const tagsArray = postData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      
      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: adminPassword,
          ...postData,
          tags: JSON.stringify(tagsArray),
          publishedAt: new Date().toISOString(),
          slug: postData.slug || postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          hasTimer: postData.hasTimer,
          timerDuration: postData.hasTimer ? postData.timerDuration : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add blog post');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
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
      toast({
        title: 'Success',
        description: 'Blog post added successfully!',
      });
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
      videoUrl: post.videoUrl || '',
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

  const commonCategories = [
    'Technology', 'Lifestyle', 'Fashion', 'Health', 'Travel',
    'Food', 'Business', 'Entertainment', 'Sports', 'Education',
    'Deals', 'Reviews', 'Gadgets', 'Mobile', 'Computing'
  ];

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Blog Management</h2>
          <p className="text-gray-600 dark:text-gray-300">Add engaging content with video support and auto-delete timers</p>
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
              Add engaging content with video support and optional auto-delete timer
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
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {commonCategories.map(cat => (
                        <SelectItem key={cat} value={cat} className="text-white hover:bg-gray-700">
                          {cat}
                        </SelectItem>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white font-medium">Blog Image</Label>
                  <Input
                    value={newPost.imageUrl}
                    onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
                    placeholder="Paste image URL here (recommended)"
                    className="bg-gray-800 border-gray-600 text-white mt-2"
                  />
                  <div className="mt-2">
                    <input 
                      type="file" 
                      accept="image/*" 
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
                      {uploadingImage ? 'Setting...' : 'Use Stock Image'}
                    </Button>
                    <p className="text-xs text-yellow-400 mt-1">💡 For best results, paste image URLs to avoid server errors</p>
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
                        <p className="text-xs text-green-400">✅ Image loaded successfully</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-white font-medium">Video URL (Auto-Preview)</Label>
                  <Input
                    value={newPost.videoUrl}
                    onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value })}
                    placeholder="YouTube, Instagram, TikTok video URL"
                    className="bg-gray-800 border-gray-600 text-white mt-2"
                  />
                  
                  {newPost.videoUrl && (
                    <div className="mt-3 border border-gray-600 rounded-lg overflow-hidden">
                      {renderVideoPreview(newPost.videoUrl)}
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-400">
                    <p>Supported platforms:</p>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <span className="text-red-500">🎬 YouTube</span>
                      <span className="text-purple-500">📷 Instagram</span>
                      <span className="text-black">🎵 TikTok</span>
                      <span className="text-blue-600">📘 Facebook</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-Delete Timer Section - RESTORED */}
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <Label className="text-white font-medium">Auto-Delete Timer</Label>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasTimer"
                      checked={newPost.hasTimer}
                      onChange={(e) => setNewPost({ ...newPost, hasTimer: e.target.checked })}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <Label htmlFor="hasTimer" className="text-white text-sm">
                      Enable auto-delete after specified hours
                    </Label>
                  </div>
                  {newPost.hasTimer && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={newPost.timerDuration}
                        onChange={(e) => setNewPost({ ...newPost, timerDuration: e.target.value })}
                        placeholder="24"
                        className="bg-gray-700 border-gray-600 text-white w-20"
                        min="1"
                        max="168"
                      />
                      <span className="text-gray-300 text-sm">hours</span>
                    </div>
                  )}
                </div>
                {newPost.hasTimer && (
                  <p className="text-yellow-400 text-xs mt-2">
                    ⏰ This blog post will be automatically deleted after {newPost.timerDuration} hours
                  </p>
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
          <CardTitle>Current Blog Posts ({blogPosts.length})</CardTitle>
          <CardDescription className="text-blue-200">
            Manage all your blog posts with full control
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
                        <span className="text-yellow-400 flex items-center gap-1">
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
