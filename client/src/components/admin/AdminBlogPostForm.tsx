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
import { Plus, Upload, Eye, Clock, Video } from 'lucide-react';

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
  const [uploadingVideo, setUploadingVideo] = useState(false);
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

    // Check if it's a direct video file (base64 or file URL)
    if (url.startsWith('data:video/') || url.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i)) {
      return {
        platform: 'Video File',
        id: null,
        thumbnail: null,
        embedUrl: url,
        icon: '🎥'
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
          <span className="text-sm text-green-400 font-medium">{videoInfo.platform} Detected</span>
        </div>
        
        {videoInfo.platform === 'Video File' ? (
          <div className="relative">
            <video 
              src={url} 
              className="w-full h-24 object-cover rounded"
              controls={false}
              muted
              preload="metadata"
              onError={(e) => {
                (e.target as HTMLVideoElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded">
              <div className="bg-white/90 rounded-full p-2">
                <i className="fas fa-play text-gray-800"></i>
              </div>
            </div>
          </div>
        ) : videoInfo.thumbnail ? (
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
        
        <p className="text-xs text-gray-400 mt-2 truncate">{url.length > 50 ? url.substring(0, 50) + '...' : url}</p>
      </div>
    );
  };

  // Handle image upload - Enhanced to support all image formats
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

    // Check file size (limit to 5MB for better performance)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 5MB for optimal performance.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);
    
    try {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setNewPost({ ...newPost, imageUrl: result });
        setUploadingImage(false);
        
        // Get file extension for success message
        const fileExtension = file.type.split('/')[1].toUpperCase();
        toast({
          title: 'Success',
          description: `${fileExtension} image uploaded successfully! (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
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
      
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadingImage(false);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    }
  };

  // Handle video upload - NEW FEATURE
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - support common video formats
    const supportedVideoTypes = [
      'video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi', 
      'video/wmv', 'video/flv', 'video/mkv', 'video/m4v', 'video/3gp'
    ];
    
    if (!supportedVideoTypes.includes(file.type)) {
      toast({
        title: 'Invalid Video Format',
        description: 'Please upload a valid video file (MP4, WebM, OGG, MOV, AVI, WMV, FLV, MKV, M4V, 3GP)',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (limit to 50MB for videos)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'Video File Too Large',
        description: 'Please upload a video smaller than 50MB for optimal performance.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingVideo(true);
    
    try {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setNewPost({ ...newPost, videoUrl: result });
        setUploadingVideo(false);
        
        // Get file extension for success message
        const fileExtension = file.type.split('/')[1].toUpperCase();
        toast({
          title: 'Success',
          description: `${fileExtension} video uploaded successfully! (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        });
      };
      
      reader.onerror = () => {
        setUploadingVideo(false);
        toast({
          title: 'Upload Error',
          description: 'Failed to read the video file. Please try again.',
          variant: 'destructive',
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadingVideo(false);
      toast({
        title: 'Error',
        description: 'Failed to upload video',
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
          <p className="text-gray-600 dark:text-gray-300">Add engaging content with image & video upload support and auto-delete timers</p>
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
              Add engaging content with image & video upload support and optional auto-delete timer
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
                    <p className="text-xs text-blue-400 mt-1">📁 Supports: JPEG, PNG, GIF, WebP, BMP, SVG, TIFF, ICO, AVIF, HEIC (max 5MB)</p>
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
                  <Label className="text-white font-medium">Video Content</Label>
                  <Input
                    value={newPost.videoUrl}
                    onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value })}
                    placeholder="YouTube, Instagram, TikTok URL or upload video file"
                    className="bg-gray-800 border-gray-600 text-white mt-2"
                  />
                  <div className="mt-2">
                    <input 
                      type="file" 
                      accept="video/mp4,video/webm,video/ogg,video/mov,video/avi,video/wmv,video/flv,video/mkv,video/m4v,video/3gp" 
                      className="hidden" 
                      id="video-upload"
                      onChange={handleVideoUpload}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('video-upload')?.click()}
                      className="text-xs"
                      disabled={uploadingVideo}
                    >
                      <Video className="w-3 h-3 mr-1" />
                      {uploadingVideo ? 'Uploading...' : 'Upload Video File'}
                    </Button>
                    <p className="text-xs text-purple-400 mt-1">🎥 Supports: MP4, WebM, OGG, MOV, AVI, WMV, FLV, MKV, M4V, 3GP (max 50MB)</p>
                  </div>
                  
                  {newPost.videoUrl && (
                    <div className="mt-3 border border-gray-600 rounded-lg overflow-hidden">
                      {renderVideoPreview(newPost.videoUrl)}
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-400">
                    <p>Supported platforms & formats:</p>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <span className="text-red-500">🎬 YouTube</span>
                      <span className="text-purple-500">📷 Instagram</span>
                      <span className="text-black">🎵 TikTok</span>
                      <span className="text-blue-600">🎥 Video Files</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-Delete Timer Section */}
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
                    < C a r d D e s c r i p t i o n   c l a s s N a m e = \  
 t e x t - b l u e - 2 0 0 \ > 
                         M a n a g e   a l l   y o u r   b l o g   p o s t s   w i t h   f u l l   c o n t r o l 
                     < / C a r d D e s c r i p t i o n > 
                 < / C a r d H e a d e r > 
                 < C a r d C o n t e n t > 
                     { i s L o a d i n g   ?   ( 
                         < d i v   c l a s s N a m e = \ t e x t - c e n t e r  
 p y - 8 \ > 
                             < d i v   c l a s s N a m e = \ a n i m a t e - s p i n  
 r o u n d e d - f u l l  
 h - 8  
 w - 8  
 b o r d e r - b - 2  
 b o r d e r - b l u e - 6 0 0  
 m x - a u t o \ > < / d i v > 
                             < p   c l a s s N a m e = \ m t - 2  
 t e x t - g r a y - 6 0 0 \ > L o a d i n g   b l o g   p o s t s . . . < / p > 
                         < / d i v > 
                     )   :   b l o g P o s t s . l e n g t h   = = =   0   ?   ( 
                         < d i v   c l a s s N a m e = \ t e x t - c e n t e r  
 p y - 8 \ > 
                             < p   c l a s s N a m e = \ t e x t - g r a y - 6 0 0 \ > N o   b l o g   p o s t s   f o u n d .   A d d   y o u r   f i r s t   p o s t   a b o v e . < / p > 
                         < / d i v > 
                     )   :   ( 
                         < d i v   c l a s s N a m e = \ s p a c e - y - 4 \ > 
                             { b l o g P o s t s . m a p ( ( p o s t :   B l o g P o s t )   = >   ( 
                                 < d i v 
                                     k e y = { p o s t . i d } 
                                     c l a s s N a m e = \ f l e x  
 i t e m s - c e n t e r  
 g a p - 4  
 p - 4  
 b g - g r a y - 8 0 0  
 r o u n d e d - l g  
 h o v e r : b g - g r a y - 7 5 0  
 t r a n s i t i o n - c o l o r s \ 
                                 > 
                                     < d i v   c l a s s N a m e = \ w - 2 0  
 h - 2 0  
 r o u n d e d - l g  
 o v e r f l o w - h i d d e n  
 f l e x - s h r i n k - 0 \ > 
                                         < i m g   
                                             s r c = { p o s t . i m a g e U r l   | |   ' h t t p s : / / i m a g e s . u n s p l a s h . c o m / p h o t o - 1 4 8 6 3 1 2 3 3 8 2 1 9 - c e 6 8 d 2 c 6 f 4 4 d ? w = 4 0 0 ' }   
                                             a l t = { p o s t . t i t l e } 
                                             c l a s s N a m e = \ w - f u l l  
 h - f u l l  
 o b j e c t - c o v e r \ 
                                             o n E r r o r = { ( e )   = >   { 
                                                 ( e . t a r g e t   a s   H T M L I m a g e E l e m e n t ) . s r c   =   ' h t t p s : / / i m a g e s . u n s p l a s h . c o m / p h o t o - 1 4 8 6 3 1 2 3 3 8 2 1 9 - c e 6 8 d 2 c 6 f 4 4 d ? w = 4 0 0 ' ; 
                                             } } 
                                         / > 
                                     < / d i v > 
                                     < d i v   c l a s s N a m e = \ f l e x - 1  
 m i n - w - 0 \ > 
                                         < h 3   c l a s s N a m e = \ t e x t - l g  
 f o n t - s e m i b o l d  
 t e x t - b l u e - 4 0 0  
 m b - 1  
 t r u n c a t e \ > { p o s t . t i t l e } < / h 3 > 
                                         < p   c l a s s N a m e = \ t e x t - g r a y - 3 0 0  
 t e x t - s m  
 m b - 2  
 l i n e - c l a m p - 1 \ > { p o s t . e x c e r p t } < / p > 
                                         < d i v   c l a s s N a m e = \ f l e x  
 i t e m s - c e n t e r  
 g a p - 4  
 t e x t - s m \ > 
                                             < s p a n   c l a s s N a m e = \ t e x t - g r a y - 4 0 0 \ > { p o s t . c a t e g o r y } < / s p a n > 
                                             < s p a n   c l a s s N a m e = \ t e x t - g r a y - 4 0 0 \ > { p o s t . r e a d T i m e } < / s p a n > 
                                             < s p a n   c l a s s N a m e = \ t e x t - g r a y - 4 0 0 \ > { n e w   D a t e ( p o s t . p u b l i s h e d A t ) . t o L o c a l e D a t e S t r i n g ( ) } < / s p a n > 
                                             { p o s t . h a s T i m e r   & &   ( 
                                                 < s p a n   c l a s s N a m e = \ b g - y e l l o w - 6 0 0  
 t e x t - w h i t e  
 p x - 2  
 p y - 1  
 r o u n d e d  
 t e x t - x s  
 f l e x  
 i t e m s - c e n t e r  
 g a p - 1 \ > 
                                                     < C l o c k   c l a s s N a m e = \ w - 3  
 h - 3 \   / > 
                                                     { p o s t . t i m e r D u r a t i o n } h   t i m e r 
                                                 < / s p a n > 
                                             ) } 
                                             { p o s t . v i d e o U r l   & &   ( 
                                                 < s p a n   c l a s s N a m e = \ b g - p u r p l e - 6 0 0  
 t e x t - w h i t e  
 p x - 2  
 p y - 1  
 r o u n d e d  
 t e x t - x s  
 f l e x  
 i t e m s - c e n t e r  
 g a p - 1 \ > 
                                                     < V i d e o   c l a s s N a m e = \ w - 3  
 h - 3 \   / > 
                                                     V i d e o 
                                                 < / s p a n > 
                                             ) } 
                                         < / d i v > 
                                     < / d i v > 
                                     < d i v   c l a s s N a m e = \ f l e x  
 i t e m s - c e n t e r  
 g a p - 2 \ > 
                                         < b u t t o n 
                                             o n C l i c k = { ( )   = >   w i n d o w . o p e n ( \ / b l o g / \ \ ,   ' _ b l a n k ' ) } 
                                             c l a s s N a m e = \ p - 2  
 b g - g r a y - 7 0 0  
 h o v e r : b g - g r a y - 6 0 0  
 r o u n d e d - l g  
 t r a n s i t i o n - c o l o r s \ 
                                             t i t l e = \ V i e w  
 b l o g  
 p o s t \ 
                                         > 
                                             < i   c l a s s N a m e = \ f a s  
 f a - e x t e r n a l - l i n k - a l t  
 t e x t - g r a y - 3 0 0 \ > < / i > 
                                         < / b u t t o n > 
                                         < b u t t o n 
                                             o n C l i c k = { ( )   = >   h a n d l e E d i t P o s t ( p o s t ) } 
                                             c l a s s N a m e = \ p - 2  
 b g - g r a y - 7 0 0  
 h o v e r : b g - g r a y - 6 0 0  
 r o u n d e d - l g  
 t r a n s i t i o n - c o l o r s \ 
                                             t i t l e = \ E d i t  
 b l o g  
 p o s t \ 
                                         > 
                                             < i   c l a s s N a m e = \ f a s  
 f a - e d i t  
 t e x t - g r a y - 3 0 0 \ > < / i > 
                                         < / b u t t o n > 
                                         < b u t t o n 
                                             o n C l i c k = { ( )   = >   h a n d l e D e l e t e P o s t ( p o s t . i d ) } 
                                             d i s a b l e d = { d e l e t e B l o g P o s t M u t a t i o n . i s P e n d i n g } 
                                             c l a s s N a m e = \ p - 2  
 b g - r e d - 6 0 0  
 h o v e r : b g - r e d - 7 0 0  
 r o u n d e d - l g  
 t r a n s i t i o n - c o l o r s \ 
                                             t i t l e = \ D e l e t e  
 b l o g  
 p o s t \ 
                                         > 
                                             < i   c l a s s N a m e = \ f a s  
 f a - t r a s h  
 t e x t - w h i t e \ > < / i > 
                                         < / b u t t o n > 
                                     < / d i v > 
                                 < / d i v > 
                             ) ) } 
                         < / d i v > 
                     ) } 
                 < / C a r d C o n t e n t > 
             < / C a r d > 
         < / d i v > 
     ) ; 
 }  
 