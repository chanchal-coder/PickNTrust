import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from '@/hooks/use-toast';

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
  createdAt: string;
}

// Sample videos data
const sampleVideos: VideoContent[] = [
  {
    id: 2001,
    title: "Top 10 Tech Gadgets 2024 - Must Have!",
    description: "Discover the latest and greatest tech gadgets that will revolutionize your daily life in 2024.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&q=80",
    platform: "YouTube",
    category: "Tech Reviews",
    tags: ["gadgets", "tech", "2024", "reviews"],
    duration: "12:45",
    createdAt: new Date().toISOString()
  },
  {
    id: 2002,
    title: "Best Credit Cards for Cashback in India",
    description: "Complete guide to choosing the right credit card for maximum cashback and rewards.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
    platform: "YouTube",
    category: "Finance",
    tags: ["credit cards", "cashback", "finance", "india"],
    duration: "8:30",
    createdAt: new Date().toISOString()
  },
  {
    id: 2003,
    title: "Smart Home Setup on Budget - Complete Guide",
    description: "Transform your home into a smart home without breaking the bank. Step-by-step tutorial.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    platform: "YouTube",
    category: "Smart Home",
    tags: ["smart home", "budget", "diy", "automation"],
    duration: "15:20",
    createdAt: new Date().toISOString()
  },
  {
    id: 2004,
    title: "Fashion Haul - Winter Collection 2024",
    description: "Latest winter fashion trends and affordable clothing options for the season.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80",
    platform: "YouTube",
    category: "Fashion",
    tags: ["fashion", "winter", "haul", "trends"],
    duration: "10:15",
    createdAt: new Date().toISOString()
  },
  {
    id: 2005,
    title: "Productivity Apps That Changed My Life",
    description: "Essential productivity apps and tools that will boost your efficiency and organization.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&q=80",
    platform: "YouTube",
    category: "Productivity",
    tags: ["productivity", "apps", "organization", "efficiency"],
    duration: "9:45",
    createdAt: new Date().toISOString()
  },
  {
    id: 2006,
    title: "Unboxing: Latest Gaming Setup Under ₹50K",
    description: "Complete gaming setup unboxing and review - perfect for budget-conscious gamers.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80",
    platform: "YouTube",
    category: "Gaming",
    tags: ["gaming", "unboxing", "budget", "setup"],
    duration: "14:30",
    createdAt: new Date().toISOString()
  }
];

export default function VideosSection() {
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const [isAdmin, setIsAdmin] = useState(false);
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

  // Fetch videos from API (fallback to sample data)
  const { data: videos } = useQuery<VideoContent[]>({
    queryKey: ['/api/video-content'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/video-content');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return data.length > 0 ? data : sampleVideos;
      } catch {
        return sampleVideos;
      }
    },
    retry: 1
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await fetch(`/api/video-content/${videoId}`, {
        method: 'DELETE',
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

  const displayVideos = videos || sampleVideos;

  const handleDeleteVideo = async (video: VideoContent) => {
    if (window.confirm(`Are you sure you want to delete "${video.title}"?`)) {
      deleteVideoMutation.mutate(video.id);
    }
  };

  const handleVideoClick = (video: VideoContent) => {
    window.open(video.videoUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShare = (platform: string, video: VideoContent) => {
    const videoUrl = `${window.location.origin}`;
    const videoText = `Check out this amazing video: ${video.title} - ${video.description} at PickNTrust!`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/profile.php?id=61578969445670`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/+m-O-S6SSpVU2NWU1`;
        break;
      case 'twitter':
        shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(videoText)}&url=${encodeURIComponent(videoUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C`;
        break;
      case 'instagram':
        const instagramText = `🎥 Amazing Video Alert! ${video.title}\n\n📝 ${video.description}\n\n⏱️ Duration: ${video.duration}\n\n✨ Watch more at PickNTrust\n\n#PickNTrust #Videos #${video.category.replace(/\s+/g, '')}`;
        navigator.clipboard.writeText(instagramText + '\n\n' + videoUrl);
        const instagramUrl = 'https://www.instagram.com/';
        window.open(instagramUrl, '_blank');
        toast({
          title: 'Instagram Ready!',
          description: 'Content copied to clipboard and Instagram opened. Paste to create your post!',
        });
        setShowShareMenu(prev => ({...prev, [video.id]: false}));
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    setShowShareMenu(prev => ({...prev, [video.id]: false}));
  };

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
            thumbnailUrl: `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`
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
              <div className="absolute -top-1 -right-4 sm:-top-2 sm:-right-6 text-lg sm:text-xl animate-bounce">🎥</div>
            </h3>
          </div>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 font-medium mt-4 sm:mt-6 px-4">
            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">✨ Watch our latest reviews, tutorials, and guides ✨</span>
          </p>
        </div>
        
        {/* Desktop: Videos Grid */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {displayVideos.slice(0, 6).map((video: VideoContent, index: number) => {
            const videoInfo = getVideoInfo(video.videoUrl, video.platform);
            
            return (
              <div 
                key={video.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden cursor-pointer"
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
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowShareMenu(prev => ({...prev, [video.id]: !prev[video.id]}));
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md transition-colors"
                        title="Share video"
                      >
                        <i className="fas fa-share text-xs"></i>
                      </button>
                      
                      {/* Share Menu */}
                      {showShareMenu[video.id] && (
                        <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-2 z-50 min-w-[160px] max-h-[300px] overflow-y-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare('facebook', video);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-facebook text-blue-600"></i>
                            Facebook
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare('twitter', video);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded w-full text-left text-gray-700"
                          >
                            <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
                              <span className="text-white text-xs font-bold">𝕏</span>
                            </div>
                            X (Twitter)
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare('whatsapp', video);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-green-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-whatsapp text-green-600"></i>
                            WhatsApp
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare('instagram', video);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-instagram text-purple-600"></i>
                            Instagram
                          </button>
                        </div>
                      )}
                    </div>
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
                      {/* Admin Delete Button */}
                      {isAdmin && (
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

                  {/* Action Buttons Row */}
                  <div className="flex gap-2">
                    {/* Share Button */}
                    <div className="relative flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowShareMenu(prev => ({...prev, [video.id]: !prev[video.id]}));
                        }}
                        className="w-full p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors text-xs"
                        title="Share video"
                      >
                        <i className="fas fa-share mr-1"></i>Share
                      </button>
                      
                      {/* Share Menu */}
                      {showShareMenu[video.id] && (
                        <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-1 z-50 min-w-full">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare('facebook', video);
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded w-full text-left text-gray-700 dark:text-gray-300"
                          >
                            <i className="fab fa-facebook text-blue-600"></i>
                            Facebook
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare('whatsapp', video);
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-green-50 dark:hover:bg-green-900/20 rounded w-full text-left text-gray-700 dark:text-gray-300"
                          >
                            <i className="fab fa-whatsapp text-green-600"></i>
                            WhatsApp
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare('instagram', video);
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded w-full text-left text-gray-700 dark:text-gray-300"
                          >
                            <i className="fab fa-instagram text-purple-600"></i>
                            Instagram
                          </button>
                        </div>
                      )}
                    </div>

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
    </section>
  );
}
