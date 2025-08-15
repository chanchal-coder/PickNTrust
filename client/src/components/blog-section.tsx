import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useRef, useState, useEffect } from "react";
import { useToast } from '@/hooks/use-toast';

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

export default function BlogSection() {
  // Fetch from API and show real blog posts
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Admin state management
  const [isAdmin, setIsAdmin] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});

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

  // Use API data if available, show empty state if no posts exist
  const displayPosts = blogPosts && blogPosts.length > 0 ? blogPosts : [];

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
        const instagramText = `📝 New Article Alert! ${post.title}\n\n${post.excerpt.substring(0, 100)}...\n\n✨ Read more at PickNTrust\n\n#PickNTrust #Blog #${post.category} #Shopping`;
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

  // Show empty state if no posts
  if (displayPosts.length === 0) {
    return (
      <section id="blog" className="py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="relative inline-block">
              <h3 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 bg-clip-text text-transparent mb-4 relative">
                Quick Tips & Trending
                <div className="absolute -top-2 -right-6 text-xl animate-spin" style={{animationDuration: '3s'}}>📝</div>
              </h3>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 font-medium mt-6">
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">🚀 Stay updated with the latest deals and shopping hacks 🚀</span>
            </p>
          </div>
          
          {/* Empty State */}
          <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-8 bg-white/50 dark:bg-gray-800/50">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h4 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">No Blog Posts Yet</h4>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Check back soon for the latest deals and shopping tips!
              </p>
              {isAdmin && (
                <Link 
                  href="/admin"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Create First Post
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="blog" className="py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h3 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 bg-clip-text text-transparent mb-4 relative">
              Quick Tips & Trending
              <div className="absolute -top-2 -right-6 text-xl animate-spin" style={{animationDuration: '3s'}}>📝</div>
            </h3>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 font-medium mt-6">
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">🚀 Stay updated with the latest deals and shopping hacks 🚀</span>
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
                  {/* Always show image - force display with multiple fallback strategies */}
                  <img 
                    src={`https://picsum.photos/400/200?random=${post.id}&blur=1`}
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 rounded-2xl border-2 border-white/50 dark:border-gray-700/50 shadow-lg"
                    onLoad={(e) => {
                      // Once the placeholder loads, try to load the actual image
                      const imgElement = e.target as HTMLImageElement;
                      if (post.imageUrl && post.imageUrl.trim() !== '' && post.imageUrl !== 'undefined' && post.imageUrl !== 'null') {
                        const testImg = new Image();
                        testImg.onload = () => {
                          imgElement.src = post.imageUrl;
                        };
                        testImg.onerror = () => {
                          // Keep the placeholder if actual image fails
                          console.log(`Failed to load image for post ${post.id}: ${post.imageUrl}`);
                        };
                        testImg.src = post.imageUrl;
                      }
                    }}
                    onError={(e) => {
                      // Final fallback - use a solid color placeholder
                      const imgElement = e.target as HTMLImageElement;
                      const canvas = document.createElement('canvas');
                      canvas.width = 400;
                      canvas.height = 200;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        const colors = ['#6366f1', '#10b981', '#f59e0b'];
                        ctx.fillStyle = colors[index % 3];
                        ctx.fillRect(0, 0, 400, 200);
                        ctx.fillStyle = 'white';
                        ctx.font = '20px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(post.title.substring(0, 20), 200, 100);
                        imgElement.src = canvas.toDataURL();
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
                        {/* Share Button - Always visible */}
                        <div className="relative">
                          <button
                            onClick={() => setShowShareMenu(prev => ({...prev, [post.id]: !prev[post.id]}))}
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md transition-colors"
                            title="Share blog post"
                          >
                            <i className="fas fa-share text-xs"></i>
                          </button>
                          
                          {/* Share Menu - Fixed positioning to prevent cutoff */}
                          {showShareMenu[post.id] && (
                            <div className="absolute right-0 bottom-full mb-2 bg-white border rounded-lg shadow-lg p-2 z-30 min-w-[140px]">
                              <button
                                onClick={() => handleShare('facebook', post)}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded w-full text-left text-gray-700"
                              >
                                <i className="fab fa-facebook text-blue-600"></i>
                                Facebook
                              </button>
                              <button
                                onClick={() => handleShare('twitter', post)}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded w-full text-left text-gray-700"
                              >
                                <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">𝕏</span>
                                </div>
                                X (Twitter)
                              </button>
                              <button
                                onClick={() => handleShare('whatsapp', post)}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-green-50 rounded w-full text-left text-gray-700"
                              >
                                <i className="fab fa-whatsapp text-green-600"></i>
                                WhatsApp
                              </button>
                              <button
                                onClick={() => handleShare('instagram', post)}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 rounded w-full text-left text-gray-700"
                              >
                                <i className="fab fa-instagram text-purple-600"></i>
                                Instagram
                              </button>
                              <button
                                onClick={() => handleShare('telegram', post)}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded w-full text-left text-gray-700"
                              >
                                <i className="fab fa-telegram text-blue-500"></i>
                                Telegram
                              </button>
                              <button
                                onClick={() => handleShare('pinterest', post)}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 rounded w-full text-left text-gray-700"
                              >
                                <i className="fab fa-pinterest text-red-600"></i>
                                Pinterest
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Delete Button - Only for admin */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md transition-colors"
                            title="Delete blog post"
                          >
                            <i className="fas fa-trash text-xs"></i>
                          </button>
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
    </section>
  );
}
