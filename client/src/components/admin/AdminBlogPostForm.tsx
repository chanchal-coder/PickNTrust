import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

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
    readTime: '5 min read',
    slug: ''
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
        readTime: '5 min read',
        slug: ''
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
    'Food', 'Business', 'Entertainment', 'Sports', 'Education'
  ];

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Blog Posts</CardTitle>
          <CardDescription>
            Failed to load blog posts. Check your server connection.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Blog Post Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Blog Post</CardTitle>
          <CardDescription>
            Create a new blog post for your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAddingPost ? (
            <Button 
              onClick={() => setIsAddingPost(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Blog Post
            </Button>
          ) : (
            <form onSubmit={handleAddPost} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="e.g., 10 Best Tech Gadgets of 2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {commonCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Excerpt</label>
                <textarea
                  value={newPost.excerpt}
                  onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                  placeholder="Brief description of the blog post..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Full blog post content..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={8}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <input
                    type="url"
                    value={newPost.imageUrl}
                    onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Video URL (Optional)</label>
                  <input
                    type="url"
                    value={newPost.videoUrl}
                    onChange={(e) => setNewPost({ ...newPost, videoUrl: e.target.value })}
                    placeholder="https://example.com/video.mp4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    placeholder="tech, gadgets, review"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Read Time</label>
                  <input
                    type="text"
                    value={newPost.readTime}
                    onChange={(e) => setNewPost({ ...newPost, readTime: e.target.value })}
                    placeholder="5 min read"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Slug (Optional)</label>
                  <input
                    type="text"
                    value={newPost.slug}
                    onChange={(e) => setNewPost({ ...newPost, slug: e.target.value })}
                    placeholder="best-tech-gadgets-2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={addBlogPostMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {addBlogPostMutation.isPending ? 'Publishing...' : 'Publish Post'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsAddingPost(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Blog Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Blog Posts ({blogPosts.length})</CardTitle>
          <CardDescription>
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
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deleteBlogPostMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
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
