import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useToast } from '@/hooks/use-toast';
import EnhancedShare from '@/components/enhanced-share';
import ShareAutomaticallyModal from '@/components/ShareAutomaticallyModal';

// Define VideoContent type
interface VideoContent {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  platform: string;
  category: string;
  tags: string[];
  duration?: string;
  pages?: string[]; // Array of pages where video should appear
  showOnHomepage?: boolean; // Whether to show on homepage
  ctaText?: string; // CTA button text
  ctaUrl?: string; // CTA button URL
  createdAt: string;
}

interface PageVideosSectionProps {
  page: string; // The page slug to filter videos for
  title?: string; // Optional custom title
}

export default function PageVideosSection({ page, title }: PageVideosSectionProps) {
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // Mock admin panel settings - in real app, this would come from API
  const adminPlatformSettings = ['Instagram', 'Facebook', 'WhatsApp', 'Telegram'];
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check admin status
  useEffect(() => {
    const adminSession = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminSession === 'active');

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pickntrust-admin-session') {
        setIsAdmin(e.newValue === 'active');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Handle share modal
  const handleShareToAll = (video: VideoContent) => {
    setSelectedVideo(video);
    setShareModalOpen(true);
  };
  
  const handleConfirmShare = () => {
    if (selectedVideo) {
      // TODO: Implement actual sharing based on admin panel automation settings
      alert(`✅ Sharing "${selectedVideo.title}" to all configured platforms!`);
      console.log('Share confirmed for:', selectedVideo.id, selectedVideo.title);
      // Here you would call the API: await shareToAllPlatforms(selectedVideo.id, adminPlatformSettings);
    }
    setShareModalOpen(false);
    setSelectedVideo(null);
  };
  
  const handleCloseModal = () => {
    setShareModalOpen(false);
    setSelectedVideo(null);
  };

  // Fetch videos from API filtered by page
  const { data: videos = [] } = useQuery<VideoContent[]>({
    queryKey: [`/api/video-content/page/${page}`],
    queryFn: async () => {
      try {
        // Fetch all videos and filter client-side
        const allResponse = await fetch('/api/video-content');
        if (!allResponse.ok) return [];
        const allVideos = await allResponse.json();
        
        // Filter videos that should appear on this page
        return allVideos.filter((video: VideoContent) => {
          // Show on homepage if showOnHomepage is true and page is 'home'
          if (page === 'home' && video.showOnHomepage) {
            return true;
          }
          
          // Show on specific pages if the page is in the pages array
          if (video.pages && Array.isArray(video.pages)) {
            return video.pages.includes(page);
          }
          
          return false;
        });
      } catch {
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 300000 // 5 minutes
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await fetch(`/api/admin/video-content/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'pickntrust2025' }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Video deleted successfully!',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/video-content/page/${page}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/video-content'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete video',
        variant: 'destructive',
      });
    }
  });

  // Render section even if there are no videos; show an empty-state UI instead

  // Function to handle video click
  const handleVideoClick = (video: VideoContent) => {
    if (video.videoUrl) {
      window.open(video.videoUrl, '_blank');
    }
  };

  // Function to handle share
  const handleShare = (video: VideoContent) => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: video.videoUrl,
      });
    } else {
      navigator.clipboard.writeText(video.videoUrl);
      toast({
        title: 'Link Copied',
        description: 'Video link has been copied to clipboard.',
      });
    }
  };

  // Function to handle delete video
  const handleDeleteVideo = (videoId: number, videoTitle: string) => {
    if (confirm(`Are you sure you want to delete "${videoTitle}"? This action cannot be undone.`)) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  // Horizontal scroll helpers (desktop)
  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400; // approximate card width + gap
      const newLeft = direction === 'left'
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      scrollContainerRef.current.scrollTo({ left: newLeft, behavior: 'smooth' });
    }
  };

  // Attach non-passive wheel listener to enable preventDefault without warnings
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onWheel = (e: any) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
      checkScrollButtons();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel as EventListener);
  }, [videos]);

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      const onScroll = () => checkScrollButtons();
      container.addEventListener('scroll', onScroll);
      return () => container.removeEventListener('scroll', onScroll);
    }
  }, [videos]);

  // Keep arrow visibility in sync on viewport resize
  useEffect(() => {
    const onResize = () => checkScrollButtons();
    window.addEventListener('resize', onResize);
    // Initial check in case layout changes after mount
    checkScrollButtons();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Function to extract video info and create embed URL
  const getVideoInfo = (url: string, platform: string) => {
    if (!url || url.trim() === '') return null;

    switch (platform.toLowerCase()) {
      case 'youtube':
        // Enhanced YouTube regex to handle various URL formats
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const youtubeMatch = url.match(youtubeRegex);
        if (youtubeMatch && youtubeMatch[1]) {
          return {
            embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
            thumbnailUrl: `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`
          };
        }
        break;
      
      case 'vimeo':
        // Enhanced Vimeo regex
        const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/;
        const vimeoMatch = url.match(vimeoRegex);
        if (vimeoMatch && vimeoMatch[1]) {
          return {
            embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
            thumbnailUrl: `https://vumbnail.com/${vimeoMatch[1]}.jpg`
          };
        }
        break;
      
      case 'tiktok':
        return {
          embedUrl: url,
          thumbnailUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80'
        };
      
      default:
        return {
          embedUrl: url,
          thumbnailUrl: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&q=80'
        };
    }
    
    return {
      embedUrl: url,
      thumbnailUrl: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&q=80'
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="relative inline-block">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 relative leading-tight">
              {title || 'Related Videos'}
              <div className="absolute -top-1 -right-4 sm:-top-2 sm:-right-6 text-lg sm:text-xl animate-bounce"><i className="fas fa-film"></i></div>
            </h3>
          </div>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 font-medium mt-4 sm:mt-6 px-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"><i className="fas fa-sparkles"></i> Watch videos related to this section <i className="fas fa-sparkles"></i></span>
          </p>
        </div>

        {/* Empty-state when no videos available for this page */}
        {videos.length === 0 && (
          <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">No videos yet</div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Check back soon — we’re adding videos for this page.</p>
            {isAdmin && (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Tip: Add videos via the admin panel and include page "{page}".</p>
            )}
          </div>
        )}
        
        {/* Desktop: Horizontal Scrolling Videos with Arrows */}
        <div className="hidden md:block relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 dark:bg-gray-800/20 dark:border-gray-700/30">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-disabled={!canScrollLeft}
            className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hidden md:flex items-center justify-center ${!canScrollLeft ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Scroll left"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-disabled={!canScrollRight}
            className={`absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hidden md:flex items-center justify-center ${!canScrollRight ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Scroll right"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x'
            }}
          >
            {videos.slice(0, 6).map((video: VideoContent) => {
              const videoInfo = getVideoInfo(video.videoUrl, video.platform);
              return (
                <div 
                  key={video.id}
                  className="flex-shrink-0 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 cursor-pointer group"
                  onClick={() => handleVideoClick(video)}
                >
                  {/* Video Thumbnail */}
                  <div className="relative">
                    <img 
                      src={video.thumbnailUrl || videoInfo?.thumbnailUrl || 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&q=80'} 
                      alt={video.title} 
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&q=80';
                      }}
                    />
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all duration-300">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
                        <i className="fas fa-play text-white text-xl ml-1"></i>
                      </div>
                    </div>
                    {/* Duration Badge */}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
                        {video.duration}
                      </div>
                    )}
                    {/* Platform Badge */}
                    <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      {video.platform}
                    </div>
                  </div>
                  {/* Video Content */}
                  <div className="p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white space-y-3 relative">
                    {/* Admin Action Buttons - Top Right */}
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleShareToAll(video);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md transition-colors cursor-pointer z-10 relative"
                          title="Share to All Platforms"
                        >
                          <i className="fas fa-edit text-xs pointer-events-none"></i>
                        </button>
                        <EnhancedShare
                          product={{
                            id: video.id,
                            name: video.title,
                            description: video.description,
                            videoUrl: video.videoUrl,
                            category: video.category
                          }}
                          contentType="video"
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-md transition-colors"
                          buttonText=""
                          showIcon={true}
                        />
                      </div>
                    )}
                    {/* Category Badge */}
                    <div className="flex justify-start mb-2">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
                        {video.category}
                      </span>
                    </div>
                    {/* Video Title */}
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2 pr-8">
                      {video.title}
                    </h4>
                    {/* Video Description */}
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 mb-4">
                      {video.description}
                    </p>
                    {/* Video Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-calendar-alt"></i>
                        {formatDate(video.createdAt)}
                      </span>
                      {video.duration && (
                        <span className="flex items-center gap-1">
                          <i className="fas fa-clock"></i>
                          {video.duration}
                        </span>
                      )}
                    </div>
                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex gap-2">
                        {video.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {video.ctaText && video.ctaUrl && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(video.ctaUrl, '_blank');
                            }}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 px-3 rounded-lg hover:shadow-lg transition-all duration-300 text-xs z-10 relative"
                            style={{ minWidth: '80px' }}
                          >
                            <i className="fas fa-external-link-alt mr-1"></i>
                            {video.ctaText}
                          </button>
                        )}
                        {isAdmin && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVideo(video.id, video.title);
                            }}
                            disabled={deleteVideoMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg hover:shadow-lg transition-all duration-300 text-xs"
                            title="Delete video"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVideoClick(video);
                          }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-300 text-xs"
                        >
                          <i className="fas fa-play mr-1"></i>Watch Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile: Horizontal Scrolling Videos */}
        <div className="md:hidden flex gap-3 overflow-x-auto pb-4 px-2">
          {videos.slice(0, 6).map((video: VideoContent) => {
            const videoInfo = getVideoInfo(video.videoUrl, video.platform);
            
            return (
              <div 
                key={video.id}
                className="flex-shrink-0 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 cursor-pointer"
                onClick={() => handleVideoClick(video)}
              >
                {/* Video Thumbnail */}
                <div className="relative">
                  <img 
                    src={video.thumbnailUrl || videoInfo?.thumbnailUrl || 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&q=80'} 
                    alt={video.title} 
                    className="w-full h-32 object-cover" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&q=80';
                    }}
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <i className="fas fa-play text-white text-sm ml-0.5"></i>
                    </div>
                  </div>
                  
                  {/* Duration Badge */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
                      {video.duration}
                    </div>
                  )}
                  
                  {/* Platform Badge */}
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                    {video.platform}
                  </div>
                </div>

                {/* Video Content */}
                <div className="p-3">
                  {/* Category Badge */}
                  <div className="flex justify-start mb-2">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
                      {video.category}
                    </span>
                  </div>
                  
                  {/* Video Title */}
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2">
                    {video.title}
                  </h4>
                  
                  {/* Video Description */}
                  <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed line-clamp-2 mb-3">
                    {video.description}
                  </p>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {/* CTA Button - Show if both ctaText and ctaUrl exist */}
                    {video.ctaText && video.ctaUrl && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(video.ctaUrl, '_blank');
                        }}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 text-xs shadow-lg"
                      >
                        <i className="fas fa-external-link-alt mr-1"></i>
                        {video.ctaText}
                      </button>
                    )}
                    
                    {/* Admin Delete Button */}
                    {isAdmin && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVideo(video.id, video.title);
                        }}
                        disabled={deleteVideoMutation.isPending}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 text-xs"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Delete Video
                      </button>
                    )}
                    
                    {/* Watch Now Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVideoClick(video);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 text-xs"
                    >
                      <i className="fas fa-play mr-1"></i>Watch Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Videos Link */}
        {videos.length > 6 && (
          <div className="text-center mt-8">
            <a 
              href="/videos" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-300"
            >
              <i className="fas fa-video"></i>
              View All Videos
            </a>
          </div>
        )}
      </div>
      
      {/* Share Automatically Modal */}
      <ShareAutomaticallyModal
        isOpen={shareModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmShare}
        productName={selectedVideo?.title || ''}
        platforms={adminPlatformSettings}
      />
    </section>
  );
}