import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
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
  ctaText?: string; // CTA button text
  ctaUrl?: string; // CTA button URL
  createdAt: string;
}

// No sample fallback; use only data from API

export default function VideosSection() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  
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

  // Fetch videos from API only; no local fallback
  const { data: videos } = useQuery<VideoContent[]>({
    queryKey: ['/api/video-content'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/video-content');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity
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
      queryClient.invalidateQueries({ queryKey: ['/api/video-content'] });
      toast({
        title: 'Video Deleted',
        description: 'Video has been successfully deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete video. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const displayVideos = videos || [];

  // Horizontal scroll helpers for desktop
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  const handleDeleteVideo = async (video: VideoContent) => {
    if (window.confirm(`Are you sure you want to delete "${video.title}"?`)) {
      deleteVideoMutation.mutate(video.id);
    }
  };

  const handleVideoClick = (video: VideoContent) => {
    window.open(video.videoUrl, '_blank', 'noopener,noreferrer');
  };

  // Removed custom per-platform share handler in favor of EnhancedShare component

  // Function to extract video info and create embed URL
  const getVideoInfo = (url: string, platform: string) => {
    if (!url || url.trim() === '') return null;

    switch (platform.toLowerCase()) {
      case 'youtube':
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const youtubeMatch = url.match(youtubeRegex);
        if (youtubeMatch) {
          return {
            embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
            thumbnailUrl: `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`
          };
        }
        break;
      
      case 'vimeo':
        const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
        const vimeoMatch = url.match(vimeoRegex);
        if (vimeoMatch) {
          return {
            embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
            thumbnailUrl: `https://vumbnail.com/${vimeoMatch[1]}.jpg`
          };
        }
        break;
      
      default:
        return {
          embedUrl: url,
          thumbnailUrl: null
        };
    }
    
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <section id="videos-section" className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="relative inline-block">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent mb-4 relative leading-tight">
              Featured Videos
              <div className="absolute -top-1 -right-4 sm:-top-2 sm:-right-6 text-lg sm:text-xl animate-bounce"><i className="fas fa-film"></i></div>
            </h3>
          </div>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 font-medium mt-4 sm:mt-6 px-4">
            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent"><i className="fas fa-sparkles"></i> Watch our latest reviews, tutorials, and guides <i className="fas fa-sparkles"></i></span>
          </p>
        </div>
        
        {/* Desktop: Horizontal Scrolling Videos with Arrows */}
        <div className="hidden md:block relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 dark:bg-gray-800/20 dark:border-gray-700/30">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-disabled={!canScrollLeft}
            className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-gradient-to-br from-red-600 to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl hidden md:flex items-center justify-center ${!canScrollLeft ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Scroll left"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-disabled={!canScrollRight}
            className={`absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-gradient-to-br from-red-600 to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl hidden md:flex items-center justify-center ${!canScrollRight ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            {displayVideos.slice(0, 6).map((video: VideoContent, index: number) => {
              const videoInfo = getVideoInfo(video.videoUrl, video.platform);
              return (
                <div 
                  key={video.id}
                  className="flex-shrink-0 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 cursor-pointer"
                  onClick={() => handleVideoClick(video)}
                >
                  {/* Video Thumbnail */}
                  <div className={`relative ${
                    index % 4 === 0 ? 'bg-gradient-to-br from-red-500 to-orange-600' : 
                    index % 4 === 1 ? 'bg-gradient-to-br from-orange-500 to-yellow-600' : 
                    index % 4 === 2 ? 'bg-gradient-to-br from-yellow-500 to-red-500' :
                    'bg-gradient-to-br from-pink-500 to-red-600'
                  } p-2`}>
                    <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden">
                      <img 
                        src={video.thumbnailUrl || videoInfo?.thumbnailUrl || `https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&q=80`} 
                        alt={video.title} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&q=80`;
                        }}
                      />
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition-all">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors">
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
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                        {video.platform}
                      </div>
                    </div>
                  </div>
                  {/* Video Content */}
                  <div className="p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white space-y-3 relative">
                    {/* Share Button - Top Right */}
                    <div className="absolute top-2 right-2">
                      <EnhancedShare
                        product={{
                          id: video.id,
                          name: video.title,
                          description: video.description,
                          imageUrl: video.thumbnailUrl,
                          category: video.category,
                          videoUrl: video.videoUrl,
                          affiliateUrl: video.videoUrl
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md transition-colors"
                        buttonText=""
                        showIcon={true}
                        contentType="video"
                      />
                    </div>
                    {/* Category Badge */}
                    <div className="flex justify-start">
                      <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full text-xs">
                        {video.category}
                      </span>
                    </div>
                    {/* Video Title */}
                    <h4 className="font-bold text-sm text-red-600 dark:text-red-400 leading-tight pr-16 line-clamp-2">{video.title}</h4>
                    {/* Video Description */}
                    <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed line-clamp-2">{video.description}</p>
                    {/* Tags */}
                    {video.tags && video.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {video.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span key={tagIndex} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                        {video.tags.length > 3 && (
                          <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                            +{video.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Date and Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(video.createdAt)}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Admin Action Buttons */}
                        {isAdmin && (
                          <>
                            {/* Share to All Platforms Button */}
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
                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVideo(video);
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md transition-colors"
                              title="Delete video"
                            >
                              <i className="fas fa-trash text-xs"></i>
                            </button>
                          </>
                        )}
                        {/* CTA Button - Show if both ctaText and ctaUrl exist */}
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
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVideoClick(video);
                          }}
                          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-300 text-xs"
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
          {displayVideos.slice(0, 6).map((video: VideoContent, index: number) => {
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
                    src={video.thumbnailUrl || videoInfo?.thumbnailUrl || `https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&q=80`} 
                    alt={video.title} 
                    className="w-full h-32 object-cover" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&q=80`;
                    }}
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
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
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                    {video.platform}
                  </div>
                </div>

                {/* Video Content */}
                <div className="p-3">
                  {/* Category Badge */}
                  <div className="flex justify-start mb-2">
                    <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full text-xs">
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

                  {/* CTA Button - Show if both ctaText and ctaUrl exist */}
                  {video.ctaText && video.ctaUrl && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(video.ctaUrl, '_blank');
                      }}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 text-sm mb-2 shadow-lg"
                    >
                      <i className="fas fa-external-link-alt mr-1"></i>
                      {video.ctaText}
                    </button>
                  )}
                  
                  {/* Watch Now Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoClick(video);
                    }}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 text-sm mb-2"
                  >
                    <i className="fas fa-play mr-1"></i>Watch Now
                  </button>

                  {/* Action Buttons Row (simplified) */}
                  <div className="flex gap-2">
                    {/* Admin Delete Button */}
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVideo(video);
                        }}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs"
                        title="Delete video"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* More Button */}
        <div className="flex justify-center mt-8">
          <Link 
            href="/videos"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <span className="mr-2">Watch All Videos</span>
            <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
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
