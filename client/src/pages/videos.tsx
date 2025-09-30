import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';
import ScrollNavigation from '@/components/scroll-navigation';
import { AnnouncementBanner } from "@/components/announcement-banner";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageBanner from '@/components/PageBanner';
import { Play, Clock, Calendar, Tag, Search, Filter, Grid, List, Trash2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import EnhancedShare from '@/components/enhanced-share';
import SmartShareDropdown from '@/components/SmartShareDropdown';
import UniversalPageLayout from '@/components/UniversalPageLayout';

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
  hasTimer?: boolean;
  timerDuration?: number;
  timerStartTime?: string;
  pages?: string[];
  showOnHomepage?: boolean;
  ctaText?: string;
  ctaUrl?: string;
  createdAt: string;
}

export default function VideosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const { data: videos = [], isLoading, error } = useQuery({
    queryKey: ['/api/video-content'],
    queryFn: async () => {
      // Try direct backend call first, then fallback to proxy
      let response;
      try {
        response = await fetch('/api/video-content');
      } catch (error) {
        console.log('Direct call failed, trying proxy...');
        response = await fetch('/api/video-content');
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      return response.json();
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  // Extract unique categories and platforms for filters
  const categories: string[] = Array.from(new Set(videos.map((video: VideoContent) => video.category)));
  const platforms: string[] = Array.from(new Set(videos.map((video: VideoContent) => video.platform)));

  // Filter videos based on search and filters
  const filteredVideos = videos.filter((video: VideoContent) => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    const matchesPlatform = selectedPlatform === 'all' || video.platform === selectedPlatform;
    
    return matchesSearch && matchesCategory && matchesPlatform;
  });

  // Function to extract video info and create embed URL
  const getVideoInfo = (url: string, platform: string) => {
    if (!url || url.trim() === '') return null;
    
    // Check if URL is base64 image data (not a valid video URL)
    if (url.startsWith('data:image/')) {
      return null;
    }

    switch (platform.toLowerCase()) {
      case 'youtube':
        // Handle YouTube Shorts URLs
        const shortsRegex = /(?:youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
        const shortsMatch = url.match(shortsRegex);
        if (shortsMatch) {
          return {
            embedUrl: null, // Shorts cannot be embedded
            thumbnailUrl: `https://img.youtube.com/vi/${shortsMatch[1]}/maxresdefault.jpg`,
            isShorts: true,
            videoId: shortsMatch[1]
          };
        }
        
        // Handle regular YouTube URLs
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/).*[?&]v=|youtu\.be\/)([^"&?\/\s]{11})/;
        const youtubeMatch = url.match(youtubeRegex);
        if (youtubeMatch) {
          return {
            embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
            thumbnailUrl: `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`
          };
        }
        break;
      
      case 'vimeo':
        const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/;
        const vimeoMatch = url.match(vimeoRegex);
        if (vimeoMatch) {
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
        // Only return if it's a valid URL (starts with http/https)
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return {
            embedUrl: url,
            thumbnailUrl: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&q=80'
          };
        }
        break;
    }
    
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Function to handle delete video
  const handleDeleteVideo = (videoId: number, videoTitle: string) => {
    if (confirm(`Are you sure you want to delete "${videoTitle}"? This action cannot be undone.`)) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  // Horizontal scroll state and handlers for grid view
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollButtons = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < max - 1);
  };

  useEffect(() => {
    // Initialize and bind listeners when grid view is active
    if (viewMode !== 'grid') return;
    const el = scrollContainerRef.current;
    checkScrollButtons();
    const onResize = () => checkScrollButtons();
    window.addEventListener('resize', onResize);
    if (el) el.addEventListener('scroll', checkScrollButtons, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      if (el) el.removeEventListener('scroll', checkScrollButtons as EventListener);
    };
  }, [filteredVideos, viewMode]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const firstChild = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstChild ? firstChild.clientWidth : 320;
    const gap = 32; // matches Tailwind gap-8
    const delta = (cardWidth + gap) * (direction === 'left' ? -1 : 1);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const handleWheel = (e: any) => {
    // Translate vertical wheel to horizontal scroll for grid view
    const el = scrollContainerRef.current;
    if (!el) return;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      el.scrollBy({ left: e.deltaY, behavior: 'smooth' });
      e.preventDefault();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
      
      {/* Amazing Page Banner */}
      <PageBanner page="videos" />
        <div className="pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-8">
              <div className="h-12 bg-gray-200 rounded-lg w-1/3"></div>
              <div className="grid md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <AnnouncementBanner page="videos" />
        
        <PageBanner page="videos" />
        <div className="pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <Play className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-red-600">Unable to Load Videos</h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading the video content. Please try refreshing the page.
              </p>
              <Button onClick={() => {
                  // Use proper navigation instead of page reload
                  window.location.reload();
                }} variant="outline">
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
        <ScrollNavigation />
      </div>
    );
  }

  return (
    <UniversalPageLayout pageId="videos">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <Header />
        
        <AnnouncementBanner />
        
        <PageBanner page="videos" />
      <div className="relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Enhanced Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl shadow-lg">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-extrabold bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Video Content
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              <i className="fas fa-video"></i> Discover our curated collection of videos, tutorials, and reviews <i className="fas fa-sparkles"></i>
            </p>
          </div>

          {/* Enhanced Filters and Search */}
          <div className="mb-12">
            <div className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-slate-700/50">
              <div className="flex flex-col lg:flex-row gap-6 items-center">
                {/* Search Section */}
                <div className="flex-1 w-full">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10" />
                      <Input
                        placeholder="🔍 Search amazing videos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-transparent bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm focus:border-gradient-to-r focus:from-blue-500 focus:to-purple-500 transition-all duration-300 shadow-lg"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Filter Section */}
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="relative w-full sm:w-52 h-12 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-transparent hover:border-green-500/30 transition-all duration-300 shadow-lg">
                        <Tag className="w-4 h-4 mr-2 text-green-600" />
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                        <SelectItem value="all" className="rounded-lg">
                          <i className="fas fa-bullseye mr-2 text-red-500"></i>All Categories
                        </SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category} className="rounded-lg">
                            <i className="fas fa-folder mr-2 text-blue-500"></i>{category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                      <SelectTrigger className="relative w-full sm:w-52 h-12 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-transparent hover:border-purple-500/30 transition-all duration-300 shadow-lg">
                        <Play className="w-4 h-4 mr-2 text-purple-600" />
                        <SelectValue placeholder="All Platforms" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                        <SelectItem value="all" className="rounded-lg"><i className="fas fa-globe"></i> All Platforms</SelectItem>
                        {platforms.map((platform) => (
                          <SelectItem key={platform} value={platform} className="rounded-lg">
                            <span>
                              <i className={platform === 'youtube' ? 'fas fa-tv' : platform === 'vimeo' ? 'fas fa-video' : 'fas fa-film'}></i> {platform}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                </Select>
              </div>

                 {/* Enhanced View Mode Toggle */}
                 <div className="flex items-center gap-1 bg-white/50 dark:bg-slate-900/50 rounded-2xl p-1 backdrop-blur-sm border border-white/30 dark:border-slate-700/30">
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => setViewMode('grid')}
                     className={`rounded-xl transition-all duration-300 ${viewMode === 'grid' 
                       ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105' 
                       : 'hover:bg-white/50 dark:hover:bg-slate-800/50'
                     }`}
                   >
                     <Grid className="w-4 h-4 mr-1" />
                     Grid
                   </Button>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => setViewMode('list')}
                     className={`rounded-xl transition-all duration-300 ${viewMode === 'list' 
                       ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg transform scale-105' 
                       : 'hover:bg-white/50 dark:hover:bg-slate-800/50'
                     }`}
                   >
                     <List className="w-4 h-4 mr-1" />
                     List
                   </Button>
                 </div>
               </div>
             </div>
           </div>

           {/* Enhanced Results Count */}
           <div className="mb-8">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl">
                   <Play className="w-5 h-5 text-emerald-600" />
                 </div>
                 <div>
                   <p className="text-lg font-semibold text-foreground">
                     {filteredVideos.length} Amazing Videos
                   </p>
                   <p className="text-sm text-muted-foreground">
                     {filteredVideos.length === videos.length 
                       ? 'Showing all videos' 
                       : `Filtered from ${videos.length} total videos`
                     }
                   </p>
                 </div>
               </div>
               
               {filteredVideos.length > 0 && (
                 <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   Live Results
                 </div>
               )}
             </div>
           </div>

          {/* Enhanced Videos Grid/List */}
          {filteredVideos.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative mx-auto mb-8 w-32 h-32">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-red-500/30 to-pink-500/30 rounded-full animate-pulse delay-150"></div>
                <div className="absolute inset-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                  <Play className="w-12 h-12 text-white animate-bounce" />
                </div>
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
                <i className="fas fa-video"></i> No Videos Found
              </h3>
              <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
                {searchTerm || selectedCategory !== 'all' || selectedPlatform !== 'all' ? (
                  <>
                    <i className="fas fa-sparkles"></i> Try adjusting your search or filters to discover amazing content!
                  </>
                ) : (
                  <>
                    <i className="fas fa-rocket"></i> No video content has been published yet. Stay tuned for exciting updates!
                  </>
                )}
              </p>
              {(searchTerm || selectedCategory !== 'all' || selectedPlatform !== 'all') && (
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedPlatform('all');
                  }}
                  className="mt-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <i className="fas fa-sync-alt"></i> Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'relative' : 'space-y-8'}>
              {viewMode === 'grid' && (
                <>
                  <button
                    aria-label="Scroll left"
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transition absolute left-2 top-1/2 -translate-y-1/2 z-20`}
                    onClick={() => scroll('left')}
                    disabled={!canScrollLeft}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    aria-label="Scroll right"
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transition absolute right-2 top-1/2 -translate-y-1/2 z-20`}
                    onClick={() => scroll('right')}
                    disabled={!canScrollRight}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              <div
                ref={scrollContainerRef}
                onWheel={viewMode === 'grid' ? handleWheel : undefined}
                className={viewMode === 'grid' ? 'overflow-x-auto scrollbar-hide flex gap-8 pb-2' : 'space-y-8'}
                style={viewMode === 'grid' ? { scrollBehavior: 'smooth' } : undefined}
              >
              {filteredVideos.map((video: VideoContent, index: number) => {
                const videoInfo = getVideoInfo(video.videoUrl, video.platform);
                
                return (
                  <div 
                    key={video.id} 
                    className={`group animate-in fade-in-0 slide-in-from-bottom-4 duration-700 ${viewMode === 'grid' ? 'flex-shrink-0 w-[28rem] sm:w-[32rem]' : ''}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Card className="overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 rounded-3xl">
                      <div className="relative">
                        {/* Gradient overlay for card */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                        
                        <div className={viewMode === 'grid' ? 'relative' : 'md:flex relative'}>
                          {/* Enhanced Video Thumbnail */}
                          <div className={`relative overflow-hidden ${viewMode === 'grid' ? 'aspect-video rounded-t-3xl' : 'md:w-80 aspect-video md:aspect-square md:rounded-l-3xl md:rounded-tr-none rounded-t-3xl'}`}>
                            {videoInfo ? (
                              <div 
                                className="w-full h-full bg-gradient-to-br from-gray-900 to-black relative cursor-pointer group/thumb overflow-hidden"
                                onClick={() => window.open(video.videoUrl, '_blank')}
                              >
                                <img 
                                  src={video.thumbnailUrl || videoInfo?.thumbnailUrl || 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&q=80'} 
                                  alt={video.title}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-110"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&q=80';
                                  }}
                                />
                                {/* Play button overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover/thumb:from-black/80 transition-all duration-500 flex items-center justify-center">
                                  <div className="relative">
                                    <div className={`absolute inset-0 rounded-full blur-xl opacity-50 group-hover/thumb:opacity-75 transition-opacity duration-300 animate-pulse ${
                                      videoInfo?.isShorts ? 'bg-red-500' : 'bg-blue-500'
                                    }`}></div>
                                    <div className={`relative rounded-full p-5 group-hover/thumb:scale-125 transition-all duration-500 shadow-2xl ${
                                      videoInfo?.isShorts 
                                        ? 'bg-gradient-to-br from-red-500 to-red-600 group-hover/thumb:rotate-12' 
                                        : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                    }`}>
                                      <Play className="w-10 h-10 text-white fill-white transform group-hover/thumb:scale-110 transition-transform duration-300" />
                                    </div>
                                  </div>
                                </div>
                                {/* Enhanced badge for Shorts */}
                                {videoInfo?.isShorts && (
                                  <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm border border-white/20">
                                    <i className="fas fa-bolt"></i> Shorts
                                  </div>
                                )}
                                {/* Shimmer effect for Shorts */}
                                {videoInfo?.isShorts && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover/thumb:translate-x-[100%] transition-transform duration-1000"></div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                                {/* Animated background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 animate-pulse"></div>
                                <div className="relative z-10">
                                  <div className="p-4 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-full mb-4 shadow-lg">
                                    <Play className="w-12 h-12 text-slate-500 dark:text-slate-400" />
                                  </div>
                                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1"><i className="fas fa-video"></i> No Video Available</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-500">Please update with a valid video URL</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Enhanced Video Info */}
                          <CardContent className={`relative p-8 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                            <div className="space-y-4">
                              {/* Title and Platform */}
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="font-bold text-xl leading-tight bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-500">
                                  {video.title}
                                </h3>
                                <div className="shrink-0">
                                  <Badge className={`px-3 py-1.5 rounded-full font-semibold text-xs shadow-lg border-0 ${
                                    video.platform.toLowerCase() === 'youtube' 
                                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                                      : video.platform.toLowerCase() === 'vimeo'
                                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                      : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                                  }`}>
                                    <i className={video.platform.toLowerCase() === 'youtube' ? 'fas fa-tv' : video.platform.toLowerCase() === 'vimeo' ? 'fas fa-video' : 'fas fa-film'}></i> {video.platform}
                                  </Badge>
                                </div>
                              </div>

                              {/* Description */}
                              <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                                {video.description}
                              </p>

                              {/* Enhanced Category and Duration Badges */}
                              <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-colors duration-300">
                                  <div className="p-1 bg-emerald-500/20 rounded-lg">
                                    <Tag className="w-3 h-3 text-emerald-600" />
                                  </div>
                                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{video.category}</span>
                                </div>
                                {video.duration && (
                                  <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-colors duration-300">
                                    <div className="p-1 bg-blue-500/20 rounded-lg">
                                      <Clock className="w-3 h-3 text-blue-600" />
                                    </div>
                                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">{video.duration}</span>
                                  </div>
                                )}
                              </div>

                              {/* Enhanced Tags Section */}
                              {video.tags && video.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {video.tags.slice(0, 3).map((tag, index) => (
                                    <span 
                                      key={index} 
                                      className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors duration-200"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                  {video.tags.length > 3 && (
                                    <span className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full border border-orange-200 dark:border-orange-700">
                                      +{video.tags.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Enhanced Footer Section */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 mt-4 border-t border-gradient-to-r from-slate-200/50 via-slate-300/50 to-slate-200/50 dark:from-slate-700/50 dark:via-slate-600/50 dark:to-slate-700/50">
                                {/* Date with enhanced styling */}
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-700/50 w-fit">
                                  <div className="p-1 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg">
                                    <Calendar className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                  </div>
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{formatDate(video.createdAt)}</span>
                                </div>
                                
                                {/* Enhanced Action Buttons */}
                                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                                  {/* Enhanced CTA Button */}
                                  {video.ctaText && video.ctaUrl && (
                                    <Button 
                                      size="sm" 
                                      asChild
                                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                    >
                                      <a href={video.ctaUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        {video.ctaText}
                                      </a>
                                    </Button>
                                  )}
                                  
                                  {/* Admin Enhanced Share Button - Multiple Options */}
                                  {isAdmin && (
                                    <EnhancedShare
                                      product={{
                                        id: video.id,
                                        name: video.title,
                                        description: video.description,
                                        videoUrl: video.videoUrl,
                                        category: video.category
                                      }}
                                      contentType="video"
                                      className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-3 py-1.5"
                                      buttonText="Share"
                                      showIcon={true}
                                    />
                                  )}
                                  
                                  {/* Public User Smart Share Button */}
                                  {!isAdmin && (
                                    <SmartShareDropdown
                                      product={{
                                        id: video.id,
                                        name: video.title,
                                        description: video.description,
                                        imageUrl: video.thumbnailUrl,
                                        category: video.category,
                                        affiliateUrl: video.videoUrl
                                      }}
                                      className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-3 py-1.5"
                                      buttonText="Share"
                                      showIcon={true}
                                    />
                                  )}

                                  {/* Enhanced Admin Delete Button */}
                                  {isAdmin && (
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleDeleteVideo(video.id, video.title)}
                                      disabled={deleteVideoMutation.isPending}
                                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                              
                                   
                                   {/* Enhanced Watch Video Button */}
                                   {getVideoInfo(video.videoUrl, video.platform) ? (
                                     <Button 
                                       size="sm" 
                                       asChild
                                       className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                     >
                                       <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                                         <Play className="w-3 h-3 mr-1" />
                                         Watch Video
                                       </a>
                                     </Button>
                                   ) : (
                                     <Button 
                                       size="sm" 
                                       disabled
                                       className="bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0 rounded-xl opacity-50 cursor-not-allowed"
                                     >
                                       <Play className="w-3 h-3 mr-1" />
                                       No Video URL
                                     </Button>
                                   )}
                                 </div>
                               </div>
                             </div>
                           </CardContent>
                         </div>
                       </div>
                     </Card>
                   </div>
                );
              })}
              </div>
            </div>
          )}
        </div>
      </div>
        <ScrollNavigation />
      </div>
      </div>
    </UniversalPageLayout>
  );
}
