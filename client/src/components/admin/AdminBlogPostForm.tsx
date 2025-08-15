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
              <div className="bg-orange-900 border border-orange-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="timer"
                    checked={newPost.hasTimer}
                    onChange={(e) => setNewPost({ ...newPost, hasTimer: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="timer" className="text-orange-400 font-medium">⚠️ Auto-Delete Timer</Label>
                </div>
                <div className="text-sm text-orange-200 mb-2">
                  ☑️ Enable auto-delete timer (blog post will be automatically removed after expiry)
                </div>
                {newPost.hasTimer && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-orange-300 text-sm mb-1">Timer OFF: Blog post stays until you manually delete it</p>
                      <p className="text-orange-300 text-sm">Timer ON: Blog post shows countdown and auto-deletes after expiry</p>
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={newPost.timerDuration}
                        onChange={(e) => setNewPost({ ...newPost, timerDuration: e.target.value })}
                        placeholder="Hours until auto-delete"
                        className="bg-orange-800 border-orange-600 text-white"
                      />
                    </div>
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
          <CardTitle>Manage Blog Posts ({blogPosts.length})</CardTitle>
          <CardDescription className="text-gray-700">
            View and manage all blog posts
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blogPosts.map((post: BlogPost) => (
                <div
                  key={post.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    {/* Small delete button in top-right corner */}
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deleteBlogPostMutation.isPending}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors z-10"
                      title="Delete blog post"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900 mb-1 pr-8">{post.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{post.category}</p>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{post.readTime}</span>
                        <span>•</span>
                        <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                      </div>
                      {post.tags && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags).slice(0, 3).map((tag: string, index: number) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {post.imageUrl && (
                    <img 
                      src={post.imageUrl} 
                      alt={post.title}
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
