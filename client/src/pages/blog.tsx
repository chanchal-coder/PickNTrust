import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import ScrollNavigation from "@/components/scroll-navigation";
import PageVideosSection from '@/components/PageVideosSection';
import PageBanner from '@/components/PageBanner';
import WidgetRenderer from '@/components/WidgetRenderer';
import { AnnouncementBanner } from "@/components/announcement-banner";
import SmartShareDropdown from '@/components/SmartShareDropdown';
import ShareAutomaticallyModal from '@/components/ShareAutomaticallyModal';
import { useToast } from '@/hooks/use-toast';
import UniversalPageLayout from '@/components/UniversalPageLayout';
// Define BlogPost type locally to avoid schema conflicts
interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  imageUrl: string;
  videoUrl?: string;
  publishedAt: Date | string;
  createdAt: Date | null;
  readTime: string;
  slug: string;
  hasTimer: boolean;
  timerDuration: number | null;
  timerStartTime: Date | null;
}

export default function Blog() {
  const { data: blogPosts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog'],
    queryFn: async () => {
      const response = await fetch('/api/blog');
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }
      return response.json();
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Use API data if available, show empty state if no posts exist
  const displayPosts = blogPosts && blogPosts.length > 0 ? blogPosts : [];
  
  // Admin state management
  const [isAdmin, setIsAdmin] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Mock admin panel settings - in real app, this would come from API
  const adminPlatformSettings = ['Instagram', 'Facebook', 'WhatsApp', 'Telegram'];
  
  // Check admin authentication
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active');
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pickntrust-admin-session') {
        setIsAdmin(e.newValue === 'active');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Handle share modal
  const handleShareToAll = (blogPost: BlogPost) => {
    setSelectedBlogPost(blogPost);
    setShareModalOpen(true);
  };
  
  const handleConfirmShare = () => {
    if (selectedBlogPost) {
      // TODO: Implement actual sharing based on admin panel automation settings
      alert(`✅ Sharing "${selectedBlogPost.title}" to all configured platforms!`);
      console.log('Share confirmed for:', selectedBlogPost.id, selectedBlogPost.title);
      // Here you would call the API: await shareToAllPlatforms(selectedBlogPost.id, adminPlatformSettings);
    }
    setShareModalOpen(false);
    setSelectedBlogPost(null);
  };
  
  const handleCloseModal = () => {
    setShareModalOpen(false);
    setSelectedBlogPost(null);
  };
  
  // Delete blog post mutation
  const deleteBlogPostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const adminPassword = 'pickntrust2025';
      const response = await fetch(`/api/admin/blog/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete blog post');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete blog post',
        variant: 'destructive',
      });
    },
  });
  
  const handleDelete = (postId: number) => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      deleteBlogPostMutation.mutate(postId);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <UniversalPageLayout pageId="blog">
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Header Top above dynamic banner */}
        <WidgetRenderer page={'blog'} position="header-top" className="w-full" />
        
        <AnnouncementBanner page="blog" />
      
      {/* Page Header */}
      {/* Amazing Page Banner */}
        <PageBanner page="blog" />
        {/* Header Bottom below dynamic banner */}
        <WidgetRenderer page={'blog'} position="header-bottom" className="w-full" />
      <div className="header-spacing">

      {/* Blog Posts Grid */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {displayPosts.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">No blog posts yet</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Please check back soon for new articles.</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayPosts.map((post: BlogPost, index: number) => (
              <article key={post.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:-translate-y-2 hover:scale-105 group">
                <div className={`w-full h-48 relative p-2 dark:bg-gradient-to-br dark:from-green-900 dark:via-teal-900 dark:to-blue-900 ${
                  index % 3 === 0 ? 'bg-blue-400' : 
                  index % 3 === 1 ? 'bg-green-400' : 
                  'bg-orange-400'
                }`}>
                  {/* Optimized image loading with immediate fallback */}
                  <img 
                    src={post.imageUrl && post.imageUrl.trim() !== '' && post.imageUrl !== 'undefined' && post.imageUrl !== 'null' 
                      ? post.imageUrl 
                      : `https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=200&fit=crop&auto=format&q=75`}
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 rounded-2xl border-2 border-white/50 dark:border-gray-700/50 shadow-lg"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to a reliable image if the primary fails
                      const imgElement = e.target as HTMLImageElement;
                      if (imgElement.src !== `https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=200&fit=crop&auto=format&q=75`) {
                        imgElement.src = `https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=200&fit=crop&auto=format&q=75`;
                      }
                    }}
                  />
                  
                  {/* Show video overlay if video exists */}
                  {post.videoUrl && post.videoUrl.trim() !== '' && (
                    <div className="absolute inset-2 bg-black/30 rounded-2xl flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-3 shadow-lg">
                        <i className="fas fa-play text-2xl text-gray-800"></i>
                      </div>
                      <div className="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                        VIDEO
                      </div>
                    </div>
                  )}
                </div>
                <div className={`p-6 ${
                  index % 3 === 0 ? 'bg-blue-50 dark:bg-gray-800' : 
                  index % 3 === 1 ? 'bg-green-50 dark:bg-gray-800' : 
                  'bg-orange-50 dark:bg-gray-800'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <i className="far fa-calendar mr-2 text-blue-500 dark:text-blue-400"></i>
                      <span>{formatDate(post.publishedAt)}</span>
                      <span className="mx-2 text-purple-500">•</span>
                      <i className="far fa-clock mr-1 text-green-500 dark:text-green-400"></i>
                      <span>{post.readTime}</span>
                    </div>
                    {post.category && (
                      <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-bold text-navy dark:text-blue-400 flex-1">{post.title}</h4>
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 mb-4">
                    <span>{post.excerpt.length > 120 ? `${post.excerpt.substring(0, 120)}...` : post.excerpt}</span>
                    <br />
                    <Link 
                      href={`/blog/${post.slug}`} 
                      className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-1 mt-2 transition-colors hover:underline cursor-pointer"
                      onClick={() => {
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}
                    >
                      Read More <span>→</span>
                    </Link>
                  </div>
                  
                  {/* Tags */}
                  {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      {post.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                        <span 
                          key={tagIndex}
                          className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-gray-400 text-xs px-2 py-1">
                          +{post.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Share Buttons Section */}
                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700 mt-3">
                    {/* Admin Buttons: Share to All + Individual Share + Delete */}
                    {isAdmin ? (
                      <>
                        {/* Share to All Platforms Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleShareToAll(post);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md transition-colors cursor-pointer z-10 relative"
                          title="Share to All Platforms"
                        >
                          <i className="fas fa-edit text-xs pointer-events-none"></i>
                        </button>
                        
                        {/* Individual Share Button */}
                        <SmartShareDropdown
                          product={{
                            id: post.id,
                            name: post.title,
                            description: post.excerpt,
                            imageUrl: post.imageUrl,
                            category: post.category,
                            affiliateUrl: `/blog/${post.slug}`
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-md transition-colors"
                          buttonText=""
                          showIcon={true}
                        />
                        
                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(post.id);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md transition-colors"
                          title="Delete blog post"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      </>
                    ) : (
                      /* Public User Share Button */
                      <SmartShareDropdown
                        product={{
                          id: post.id,
                          name: post.title,
                          description: post.excerpt,
                          imageUrl: post.imageUrl,
                          category: post.category,
                          affiliateUrl: `/blog/${post.slug}`
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md transition-colors"
                        buttonText=""
                        showIcon={true}
                      />
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Videos Section - Only shows if videos exist for blog */}
      <PageVideosSection 
        page="blog" 
        title="Blog Videos"
      />
      
      <ScrollNavigation />
      
      {/* Share Automatically Modal */}
      <ShareAutomaticallyModal
        isOpen={shareModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmShare}
        productName={selectedBlogPost?.title || ''}
        platforms={adminPlatformSettings}
      />
      {/* Close header-spacing wrapper */}
      </div>
      {/* Close outer min-h-screen container */}
      </div>
    </UniversalPageLayout>
  );
}
