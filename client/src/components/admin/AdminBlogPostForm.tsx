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
import { Plus, Upload, Calendar, Clock, Link, Eye, Trash2 } from 'lucide-react';

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
}

export default function BlogManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
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
    timerDuration: ''
  });

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
          slug: postData.slug || postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
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
        timerDuration: ''
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

  const handleSharePost = (platform: string, post: BlogPost) => {
    const postUrl = `${window.location.origin}/blog/${post.slug}`;
    const postText = `Check out this amazing blog post: ${post.title} at PickNTrust!`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/profile.php?id=61578969445670`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/+m-O-S6SSpVU2NWU1`;
        break;
      case 'twitter':
        shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(postText)}&url=${encodeURIComponent(postUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C`;
        break;
      case 'instagram':
        const instagramText = `📝 New Article Alert! ${post.title}\n\n${post.excerpt.substring(0, 100)}...\n\n✨ Read more at PickNTrust\n\n#PickNTrust #Blog #${post.category} #Shopping`;
        navigator.clipboard.writeText(instagramText + '\n\n' + postUrl);
        const instagramUrl = 'https://www.instagram.com/';
        window.open(instagramUrl, '_blank');
        toast({
          title: 'Instagram Ready!',
          description: 'Content copied to clipboard and Instagram opened. Paste to create your post!',
        });
        setShowShareMenu(prev => ({...prev, [post.id]: false}));
        return;
      case 'youtube':
        shareUrl = `https://www.youtube.com/@PickNTrust`;
        break;
      case 'pinterest':
        shareUrl = `https://www.pinterest.com/PickNTrust/`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        break;
      case 'reddit':
        shareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(post.title)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    setShowShareMenu(prev => ({...prev, [post.id]: false}));
  };

  const handleEditPost = (post: BlogPost) => {
    // Set the post data for editing
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
      hasTimer: false,
      timerDuration: ''
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

  const suggestedTags = [
    'budget', 'premium', 'mobile', 'computing', 'fashion', 'beauty', 'deals',
    'smartphone', 'laptop', 'gadgets', 'tech', 'review', 'comparison'
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
      {/* Blog Management Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Blog Management</h2>
          <p className="text-gray-600 dark:text-gray-300">Add engaging content with video support to drive affiliate sales</p>
        </div>
        <Button 
          onClick={() => setIsAddingPost(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Blog Post
        </Button>
      </div>

      {/* Create New Blog Post Form */}
      {isAddingPost && (
        <Card className="bg-gray-900 text-white border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <Plus className="w-5 h-5" />
              Create New Blog Post
            </CardTitle>
            <CardDescription className="text-gray-300">
              Add engaging content with video support to drive affiliate sales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleAddPost} className="space-y-6">
              {/* Blog Title */}
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

              {/* Excerpt */}
              <div>
                <Label className="text-white font-medium">Excerpt (4-5 lines for homepage) *</Label>
                <Textarea
                  value={newPost.excerpt}
                  onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                  placeholder="Short description that appears on the homepage. You can include affiliate links here: [Product Name](https://amzn.to/link)"
                  className="bg-gray-800 border-gray-600 text-white mt-2"
                  rows={4}
                  required
                />
                <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                  💡 Add affiliate links in excerpt using [text](url) format - they'll work on homepage and full post
                </p>
              </div>

              {/* Full Content */}
              <div>
                <Label className="text-white font-medium">Full Content *</Label>
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder={`Full blog post content with unlimited affiliate links. Use Markdown formatting:

# Main Heading
## Sub Heading
### Small Heading

**Bold text**
*Italic text*

1. Numbered list item
2. Another item

💡 Affiliate Product Link: https://amzn.to/link (use as-is with)
📱 Supports Markdown formatting. Add unlimited affiliate links using [text](url) format`}
                  className="bg-gray-800 border-gray-600 text-white mt-2 font-mono text-sm"
                  rows={12}
                  required
                />
                <p className="text-blue-400 text-xs mt-1">
                  📝 Supports Markdown formatting. Add unlimited affiliate links using [text](url) format
                </p>
              </div>

              {/* Category and Tags */}
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
                  <Label className="text-white font-medium">Tags (comma separated)</Label>
                  <Input
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    placeholder="deals, budget, tech, gadgets, amazon"
                    className="bg-gray-800 border-gray-600 text-white mt-2"
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    <p className="text-yellow-400 text-xs">💡 Auto-suggested:</p>
                    {suggestedTags.slice(0, 8).map(tag => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="text-xs cursor-pointer hover:bg-gray-700"
                        onClick={() => {
                          const currentTags = newPost.tags ? newPost.tags.split(',').map(t => t.trim()) : [];
                          if (!currentTags.includes(tag)) {
                            setNewPost({ ...newPost, tags: [...currentTags, tag].join(', ') });
                          }
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Drag & Drop Your Files Here</h3>
                <p className="text-gray-400 mb-4">Images and videos up to 50MB each</p>
                <div className="flex justify-center gap-4 text-sm text-gray-400">
                  <span>📷 JPG, PNG, GIF</span>
                  <span>🎥 MP4, WEBM, MOV</span>
                </div>
              </div>

              {/* Blog Image and Video */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white font-medium">Blog Image</Label>
                  <Input
                    value={newPost.imageUrl}
                    onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-... or use drag-drop above"
                    className="bg-gray-800 border-gray-600 text-white mt-2"
                  />
                  <div className="mt-2">
                    <input type="file" accept="image/*" className="hidden" id="image-upload" />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="text-xs"
                    >
                      Choose File
                    </Button>
                    <span className="text-gray-400 text-xs ml-2">No file chosen</span>
                  </div>
                </div>

                <div>
                  <Label className="text-white font-medium">Video/Reel Content</Label>
                  <Input
                    value={newPost.videoUrl}
                    onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value })}
                    placeholder="YouTube, Instagram Reel, Facebook Reel, or upload below"
                    className="bg-gray-800 border-gray-600 text-white mt-2"
                  />
                  <div className="mt-2">
                    <input type="file" accept="video/*" className="hidden" id="video-upload" />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('video-upload')?.click()}
                      className="text-xs"
                    >
                      Choose File
                    </Button>
                    <span className="text-gray-400 text-xs ml-2">No file chosen</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    <p>Social media links (up to 50MB):</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-blue-400">📘 Instagram: https://www.instagram.com/reel/ABC123/</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-600">📘 Facebook: https://www.facebook.com/reel/123456789</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-red-500">🎬 YouTube: https://youtube.com/watch?v=ABC123</span>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-green-800 rounded text-xs">
                    ✅ Upload your own content or share social media links - perfect for personal blogging!
                  </div>
                </div>
              </div>

              {/* Publish Settings */}
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
                  <Label className="text-white font-medium">URL Slug (Auto-generated)</Label>
                  <Input
                    value={newPost.slug}
                    onChange={(e) => setNewPost({ ...newPost, slug: e.target.value })}
                    placeholder="url-friendly-title"
                    className="bg-gray-800 border-gray-600 text-white mt-2"
                  />
                </div>
              </div>

              {/* Auto-Delete Timer */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasTimer"
                    checked={newPost.hasTimer}
                    onChange={(e) => setNewPost({ ...newPost, hasTimer: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="hasTimer" className="text-sm font-medium text-blue-300">Add Auto-Delete Timer</label>
                </div>

                {newPost.hasTimer && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-blue-300">Timer Duration (hours)</label>
                    <select
                      value={newPost.timerDuration}
                      onChange={(e) => setNewPost({ ...newPost, timerDuration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white"
                    >
                      <option value="">Select Duration</option>
                      <option value="1">1 hour</option>
                      <option value="2">2 hours</option>
                      <option value="3">3 hours</option>
                      <option value="6">6 hours</option>
                      <option value="12">12 hours</option>
                      <option value="24">24 hours (1 day)</option>
                      <option value="48">48 hours (2 days)</option>
                      <option value="72">72 hours (3 days)</option>
                      <option value="168">1 week</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      ⚠️ Blog post will be automatically deleted when timer expires (no countdown shown to users)
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
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

      {/* Blog Posts List */}
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
                  {/* Blog Image */}
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

                  {/* Blog Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-blue-400 mb-1 truncate">{post.title}</h3>
                    <p className="text-gray-300 text-sm mb-2 line-clamp-1">{post.excerpt}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">{post.category}</span>
                      <span className="text-gray-400">{post.readTime}</span>
                      <span className="text-gray-400">{new Date(post.publishedAt).toLocaleDateString()}</span>
                      {post.tags && (
                        <div className="flex gap-1">
                          {(typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags).slice(0, 2).map((tag: string, index: number) => (
                            <span key={index} className="bg-purple-600 text-white px-2 py-1 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowShareMenu(prev => ({...prev, [post.id]: !prev[post.id]}))}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Share blog post"
                      >
                        <i className="fas fa-share text-gray-300"></i>
                      </button>
                      
                      {/* Share Menu */}
                      {showShareMenu[post.id] && (
                        <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-2 z-50 min-w-[160px] max-h-[300px] overflow-y-auto">
                          <button
                            onClick={() => handleSharePost('facebook', post)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-facebook text-blue-600"></i>
                            Facebook
                          </button>
                          <button
                            onClick={() => handleSharePost('twitter', post)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded w-full text-left text-gray-700"
                          >
                            <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
                              <span className="text-white text-xs font-bold">𝕏</span>
                            </div>
                            X (Twitter)
                          </button>
                          <button
                            onClick={() => handleSharePost('whatsapp', post)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-green-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-whatsapp text-green-600"></i>
                            WhatsApp
                          </button>
                          <button
                            onClick={() => handleSharePost('instagram', post)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-instagram text-purple-600"></i>
                            Instagram
                          </button>
                          <button
                            onClick={() => handleSharePost('youtube', post)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-youtube text-red-600"></i>
                            YouTube
                          </button>
                          <button
                            onClick={() => handleSharePost('telegram', post)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-telegram text-blue-500"></i>
                            Telegram
                          </button>
                          <button
                            onClick={() => handleSharePost('pinterest', post)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-pinterest text-red-600"></i>
                            Pinterest
                          </button>
                          <button
                            onClick={() => handleSharePost('linkedin', post)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-linkedin text-blue-700"></i>
                            LinkedIn
                          </button>
                          <button
                            onClick={() => handleSharePost('reddit', post)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-orange-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-reddit text-orange-600"></i>
                            Reddit
                          </button>
                        </div>
                      )}
                    </div>
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
