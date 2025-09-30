import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useRef, useState, useEffect } from "react";
import { useToast } from '@/hooks/use-toast';
import SmartShareDropdown from '@/components/SmartShareDropdown';
import ShareAutomaticallyModal from '@/components/ShareAutomaticallyModal';

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

// Sample blog posts for fallback
const sampleBlogPosts: BlogPost[] = [
  {
    id: 1,
    title: "10 Must-Have Gadgets Under ₹999 You Can Buy Today",
    excerpt: "Discover amazing tech gadgets that won't break the bank. From wireless earbuds to smart fitness trackers, we've curated the best budget-friendly gadgets for 2024.",
    content: "# 10 Must-Have Gadgets Under ₹999 You Can Buy Today\n\nShopping for amazing gadgets doesn't have to break the bank! We've curated a fantastic list of 10 incredible gadgets...",
    category: "Tech",
    tags: ["gadgets", "budget", "tech", "shopping"],
    imageUrl: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=600&fit=crop",
    publishedAt: new Date().toISOString(),
    createdAt: new Date(),
    readTime: "8 min read",
    slug: "10-must-have-gadgets-under-999",
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null
  },
  {
    id: 2,
    title: "Best Credit Cards for Cashback in India 2024",
    excerpt: "Complete guide to choosing the right credit card for maximum cashback and rewards. Compare features, benefits, and eligibility criteria.",
    content: "# Best Credit Cards for Cashback in India 2024\n\nChoosing the right credit card can significantly boost your savings through cashback and rewards...",
    category: "Finance",
    tags: ["credit cards", "cashback", "finance", "india"],
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000),
    readTime: "6 min read",
    slug: "best-credit-cards-cashback-india-2024",
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null
  },
  {
    id: 3,
    title: "Smart Home Setup on Budget - Complete Guide",
    excerpt: "Transform your home into a smart home without breaking the bank. Step-by-step tutorial with affordable smart devices and automation tips.",
    content: "# Smart Home Setup on Budget - Complete Guide\n\nTransform your home into a smart home without breaking the bank...",
    category: "Smart Home",
    tags: ["smart home", "budget", "diy", "automation"],
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    createdAt: new Date(Date.now() - 172800000),
    readTime: "12 min read",
    slug: "smart-home-setup-budget-guide",
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null
  }
];

export default function BlogSection() {
  // Fetch from API with fallback to sample posts
  const { data: blogPosts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/blog');
        if (!response.ok) {
          throw new Error('Failed to fetch blog posts');
        }
        const data = await response.json();
        return Array.isArray(data) && data.length > 0 ? data : sampleBlogPosts;
      } catch (error) {
        console.warn('Failed to fetch blog posts, using fallback data:', error);
        return sampleBlogPosts;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get video thumbnail URL
  const getVideoThumbnail = (videoUrl: string): string => {
    if (!videoUrl) return '';
    
    // YouTube thumbnail
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
    }
    
    // Vimeo thumbnail (requires API call, so we'll use a placeholder)
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
    }
    
    // For other platforms, return empty to use fallback image
    return '';
  };

  // Admin state management
  const [isAdmin, setIsAdmin] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  
  // Mock admin panel settings - in real app, this would come from API
  const adminPlatformSettings = ['Instagram', 'Facebook', 'WhatsApp', 'Telegram'];

  // Check admin authentication
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    if (adminAuth === 'active') {
      setIsAdmin(true);
    }
  }, []);

  // Listen for admin session changes
  useEffect(() => {
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

  // Use API data if available, otherwise use sample posts
  const displayPosts = blogPosts || sampleBlogPosts;

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

  const handleDelete = (postId: number) => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      deleteBlogPostMutation.mutate(postId);
    }
  };

  const handleShare = (platform: string, post: BlogPost) => {
    const postUrl = `${window.location.origin}/blog/${post.slug}`;
    const postText = `Check out this article: ${post.title} - ${post.excerpt.substring(0, 100)}... at PickNTrust!`;
    
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
        const instagramText = `<i className="fas fa-edit"></i> New Article Alert! ${post.title}\n\n${post.excerpt.substring(0, 100)}...\n\n<i className="fas fa-sparkles"></i> Read more at PickNTrust\n\n#PickNTrust #Blog #${post.category} #Shopping`;
        navigator.clipboard.writeText(instagramText + '\n\n' + postUrl);
        const instagramUrl = 'https://www.instagram.com/';
        window.open(instagramUrl, '_blank');
        toast({
          title: 'Instagram Ready!',
          description: 'Content copied to clipboard and Instagram opened. Paste to create your post!',
        });
        return;
      case 'pinterest':
        shareUrl = `https://www.pinterest.com/PickNTrust/`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    setShowShareMenu(prev => ({...prev, [post.id]: false}));
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  // Handle mouse wheel scrolling
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollBy({ left: e.deltaY, behavior: 'smooth' });
    }
  };

  return (
    <section id="blog" className="py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 bg-clip-text text-transparent mb-4 relative leading-tight">
              Quick Tips & Trending
              <div className="absolute -top-2 -right-6 text-xl animate-spin" style={{animationDuration: '3s'}}><i className="fas fa-edit"></i></div>
            </h3>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 font-medium mt-6">
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"><i className="fas fa-rocket"></i> Stay updated with the latest deals and shopping hacks <i className="fas fa-rocket"></i></span>
          </p>
        </div>
        
        {/* Horizontal Scrollable Container with Border */}
        <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 bg-white/50 dark:bg-gray-800/50">
          {/* Left Arrow */}
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-xl rounded-full p-3 transition-all transform hover:scale-110 hidden md:block"
          >
            <i className="fas fa-chevron-left text-lg"></i>
          </button>

          {/* Right Arrow */}
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-xl rounded-full p-3 transition-all transform hover:scale-110 hidden md:block"
          >
            <i className="fas fa-chevron-right text-lg"></i>
          </button>

          {/* Scrollable Blog Container - Single Row */}
          <div 
            ref={scrollContainerRef}
            onWheel={handleWheel}
            className="flex gap-6 overflow-x-auto pb-4 px-12 md:px-16"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none'
            }}
          >
            {displayPosts.map((post: BlogPost, index: number) => (
              <article key={post.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:-translate-y-2 hover:scale-105 group flex-shrink-0 w-80">
                <div className={`w-full h-48 relative p-2 dark:bg-gradient-to-br dark:from-green-900 dark:via-teal-900 dark:to-blue-900 ${
                  index % 3 === 0 ? 'bg-blue-400' : 
                  index % 3 === 1 ? 'bg-green-400' : 
                  'bg-orange-400'
                }`}>
                  {/* Optimized image loading with video thumbnail support */}
                  <img 
                    src={(() => {
                      // Priority: Video thumbnail > Image URL > Fallback
                      const videoThumbnail = post.videoUrl ? getVideoThumbnail(post.videoUrl) : '';
                      if (videoThumbnail) return videoThumbnail;
                      
                      if (post.imageUrl && post.imageUrl.trim() !== '' && post.imageUrl !== 'undefined' && post.imageUrl !== 'null') {
                        return post.imageUrl;
                      }
                      
                      return `https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=200&fit=crop&auto=format&q=75`;
                    })()} 
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
                  
                  {/* Show video overlay if video URL exists and is valid */}
                  {post.videoUrl && post.videoUrl.trim() !== '' && (
                    <div className="absolute inset-2 bg-black/20 rounded-2xl flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-3 shadow-lg">
                        <i className="fas fa-play text-2xl text-gray-800"></i>
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
                    <h4 className="text-xl font-bold text-gray-900 dark:text-blue-400 flex-1">{post.title}</h4>
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 mb-4">
                    <span>{post.excerpt.length > 120 ? `${post.excerpt.substring(0, 120)}...` : post.excerpt}</span>
                    <br />
                    <div className="flex items-center justify-between mt-2">
                      <Link 
                        href={`/blog/${post.slug}`} 
                        className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-1 transition-colors hover:underline cursor-pointer"
                        onClick={() => {
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                      >
                        Read More <span>→</span>
                      </Link>
                      
                      {/* Share and Delete Buttons - Right side of Read More */}
                      <div className="flex gap-2">
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
                              onClick={() => handleDelete(post.id)}
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
                </div>
              </article>
            ))}
          </div>
        </div>
        
        {/* More Button */}
        <div className="flex justify-end mt-6">
          <Link 
            href="/blog"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <span className="mr-2">More</span>
            <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>
      
      {/* Share Automatically Modal */}
      <ShareAutomaticallyModal
        isOpen={shareModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmShare}
        productName={selectedBlogPost?.title || ''}
        platforms={adminPlatformSettings}
      />
    </section>
  );
}
