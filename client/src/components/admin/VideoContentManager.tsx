import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectSeparator } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, Video, Youtube, Instagram, Music, Globe, Edit, Trash2, Eye, Clock, Image, RefreshCw } from 'lucide-react';

interface VideoContent {
  id: number;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  videoUrl: string;
  thumbnailUrl?: string;
  platform: string;
  duration?: string;
  views?: number;
  createdAt: string;
  customFields?: Record<string, string>;
  hasTimer?: boolean;
  timerDuration?: number | null;
  pages?: string[];
  showOnHomepage?: boolean;
  ctaText?: string;
  ctaUrl?: string;
}

interface NavTab {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color_from: string;
  color_to: string;
  display_order: number;
  is_active: boolean;
  is_system: boolean;
  description?: string;
}

export default function VideoContentManager() {
  // Track editing state for existing videos
  const [editingVideoId, setEditingVideoId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('any-website');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailMode, setThumbnailMode] = useState<'auto' | 'manual' | 'upload'>('auto');
  const [manualPagesInput, setManualPagesInput] = useState('');
  
  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    videoUrl: '',
    thumbnailUrl: '',
    platform: 'any-website',
    duration: '',
    customFields: {} as Record<string, string>,
    hasTimer: false,
    timerDuration: '24',
    pages: [] as string[],
    showOnHomepage: true,
    ctaText: '',
    ctaUrl: ''
  });

  // Manual page slugs helpers
  const normalizeSlug = (raw: string) => {
    const s = String(raw || '').toLowerCase().trim();
    if (!s) return '';
    return s.replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  };
  const parseManualPages = (input: string) =>
    (String(input || '')
      .split(',')
      .map(p => normalizeSlug(p))
      .filter(Boolean));

  // Load ALL categories from DB for video categorization (no filtering)
  const { data: uiCategories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to load categories');
      const list = await res.json();
      return (Array.isArray(list) ? list : []).map((c: any) => ({
        id: c.id || c.name,
        name: c.name,
        isForProducts: c.isForProducts,
        isForServices: c.isForServices,
        isForAIApps: c.isForAIApps,
      }));
    },
    // Always refetch on mount to reflect latest flags
    staleTime: 0,
    retry: 1,
  });

  // Group categories by type (Products, Services, AI Apps, General)
  const groupedVideoCategories = (uiCategories || []).reduce((groups: Record<string, any[]>, cat: any) => {
    const add = (label: string) => {
      if (!groups[label]) groups[label] = [];
      groups[label].push(cat);
    };
    if ((cat as any).isForProducts) add('Products');
    if ((cat as any).isForServices) add('Services');
    if ((cat as any).isForAIApps) add('AI Apps');
    if (!(cat as any).isForProducts && !(cat as any).isForServices && !(cat as any).isForAIApps) add('General');
    return groups;
  }, {} as Record<string, any[]>);
  const videoCategoryGroupOrder = ['Products', 'Services', 'AI Apps', 'General'];

  // Platform configurations
  const platforms = [
    {
      id: 'any-website',
      name: 'Any Website',
      icon: <Globe className="w-5 h-5" />,
      color: 'bg-gray-600',
      placeholder: 'https://example.com/video.mp4'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: <Youtube className="w-5 h-5" />,
      color: 'bg-red-600',
      placeholder: 'https://www.youtube.com/watch?v=...'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: <Instagram className="w-5 h-5" />,
      color: 'bg-purple-600',
      placeholder: 'https://www.instagram.com/p/...'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: <Music className="w-5 h-5" />,
      color: 'bg-black',
      placeholder: 'https://www.tiktok.com/@user/video/...'
    },
    {
      id: 'vimeo',
      name: 'Vimeo',
      icon: <Video className="w-5 h-5" />,
      color: 'bg-blue-500',
      placeholder: 'https://vimeo.com/...'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">f</div>,
      color: 'bg-blue-600',
      placeholder: 'https://www.facebook.com/watch/?v=...'
    },
    {
      id: 'file-upload',
      name: 'File Upload',
      icon: <Upload className="w-5 h-5" />,
      color: 'bg-green-600',
      placeholder: 'Upload video file from device'
    }
  ];

  // Auto-generate thumbnail from video URL
  const generateThumbnailFromUrl = (url: string, platform: string) => {
    if (!url || thumbnailMode !== 'auto') return '';

    // YouTube thumbnail extraction
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
    }

    // Vimeo thumbnail extraction
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
    }

    // Instagram - use placeholder
    if (url.includes('instagram.com')) {
      return 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=400&h=300&fit=crop';
    }

    // TikTok - use placeholder
    if (url.includes('tiktok.com')) {
      return 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400&h=300&fit=crop';
    }

    // Facebook - use placeholder
    if (url.includes('facebook.com')) {
      return 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop';
    }

    return '';
  };

  // Auto-update thumbnail when video URL changes
  useEffect(() => {
    if (videoData.videoUrl && thumbnailMode === 'auto') {
      const autoThumbnail = generateThumbnailFromUrl(videoData.videoUrl, activeTab);
      if (autoThumbnail) {
        setVideoData(prev => ({ ...prev, thumbnailUrl: autoThumbnail }));
      }
    }
  }, [videoData.videoUrl, activeTab, thumbnailMode]);

  // Handle thumbnail upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const supportedImageTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
      'image/bmp', 'image/svg+xml', 'image/tiff', 'image/ico', 'image/avif'
    ];
    
    if (!supportedImageTypes.includes(file.type)) {
      toast({
        title: 'Invalid Image Format',
        description: 'Please upload a valid image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Image Too Large',
        description: 'Please upload a thumbnail smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingThumbnail(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setVideoData({ ...videoData, thumbnailUrl: result });
        setThumbnailMode('upload');
        setUploadingThumbnail(false);
        
        toast({
          title: 'Success',
          description: 'Thumbnail uploaded successfully!',
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadingThumbnail(false);
      toast({
        title: 'Error',
        description: 'Failed to upload thumbnail',
        variant: 'destructive',
      });
    }
  };

  // Helper to build absolute media URL when needed
  const getBackendBaseUrl = () => {
    const envBase = (import.meta as any).env?.VITE_API_BASE_URL || '';
    if (envBase) return envBase;
    const origin = window.location.origin;
    // In dev, switch Vite port 5173 to backend 5000
    if (origin.includes(':5173')) return origin.replace(':5173', ':5000');
    return origin;
  };

  const toAbsoluteMediaUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http')) return url;
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (url.startsWith('/')) return getBackendBaseUrl() + url;
    return url;
  };

  // Handle video file upload (send to backend and store served URL)
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const supportedVideoTypes = [
      'video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi',
      'video/wmv', 'video/flv', 'video/mkv', 'video/m4v', 'video/3gp'
    ];

    if (!supportedVideoTypes.includes(file.type)) {
      toast({
        title: 'Invalid Video Format',
        description: 'Please upload a valid video file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: 'Video File Too Large',
        description: 'Please upload a video smaller than 100MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingVideo(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text().catch(() => '');
        throw new Error(`Unexpected response (not JSON): ${text.slice(0, 200)}…`);
      }
      if (!res.ok || !data?.url) throw new Error(data?.message || 'Upload failed');

      // Store relative URL from backend and compute absolute for preview
      const relativeUrl = data.url as string; // e.g., /uploads/filename.mp4
      setVideoData({ ...videoData, videoUrl: relativeUrl, platform: 'file-upload' });
      setUploadingVideo(false);

      toast({
        title: 'Success',
        description: 'Video uploaded successfully!',
      });
    } catch (error: any) {
      setUploadingVideo(false);
      toast({
        title: 'Error',
        description: String(error?.message || error) || 'Failed to upload video',
        variant: 'destructive',
      });
    }
  };

  // Get video preview info
  const getVideoPreview = (url: string, platform: string) => {
    if (!url) return null;

    if (platform === 'file-upload' || url.startsWith('data:video/')) {
      return (
        <div className="relative">
          <video 
            src={toAbsoluteMediaUrl(url)} 
            className="w-full h-32 object-cover rounded"
            controls={false}
            muted
            preload="metadata"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded">
            <div className="bg-white/90 rounded-full p-3">
              <Video className="w-6 h-6 text-gray-800" />
            </div>
          </div>
        </div>
      );
    }

    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (youtubeMatch) {
      return (
        <div className="relative">
          <img 
            src={`https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`}
            alt="Video thumbnail" 
            className="w-full h-32 object-cover rounded"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded">
            <div className="bg-red-600 rounded-full p-3">
              <Youtube className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-32 bg-gray-700 rounded flex items-center justify-center">
        <div className="text-center">
          <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-400 capitalize">{platform} Video</p>
        </div>
      </div>
    );
  };

  // Fetch video content with error handling
  const { data: videoContent = [], isLoading } = useQuery({
    queryKey: ['/api/video-content'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/video-content');
        if (!response.ok) {
          return [];
        }
        return response.json();
      } catch (error) {
        console.log('Failed to fetch video content:', error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  // Fetch navigation tabs with error handling
  const { data: navTabs = [] } = useQuery<NavTab[]>({
    queryKey: ['/api/nav-tabs'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/nav-tabs');
        if (!response.ok) {
          return [];
        }
        return response.json();
      } catch (error) {
        console.log('Failed to fetch navigation tabs:', error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  // Create dynamic pages array with safety checks
  const availablePages = [
    { value: 'home', label: 'Home Page', description: 'Main website homepage' },
    { value: 'trending', label: 'Trending Page', description: 'Trending products and content' },
    { value: 'services', label: 'Services Page', description: 'Services and subscriptions' },
    { value: 'apps', label: 'Apps Page', description: 'Apps and AI tools' },
    { value: 'blog', label: 'Blog Page', description: 'Blog articles and posts' },
    { value: 'top-picks', label: 'Top Picks', description: 'Today\'s top picks and featured deals' },
    ...(Array.isArray(navTabs) ? navTabs : [])
      .filter(tab => tab && tab.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(tab => ({
        value: tab.slug || '',
        label: `${tab.name || 'Unnamed'}`,
        description: tab.description || 'Navigation page'
      }))
  ];

  // Add video mutation
  const addVideoMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        password: 'pickntrust2025',
        title: data.title,
        description: data.description || '',
        category: data.category || '',
        tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : [],
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl || '',
        platform: data.platform,
        duration: data.duration || '',
        hasTimer: Boolean(data.hasTimer),
        timerDuration: data.hasTimer ? parseInt(data.timerDuration) : null,
        pages: data.pages || [],
        showOnHomepage: Boolean(data.showOnHomepage),
        ctaText: data.ctaText || '',
        ctaUrl: data.ctaUrl || ''
      };

      const response = await fetch('/api/admin/video-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to add video');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Video content added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/video-content'] });
      setVideoData({
        title: '',
        description: '',
        category: '',
        tags: '',
        videoUrl: '',
        thumbnailUrl: '',
        platform: 'any-website',
        duration: '',
        customFields: {},
        hasTimer: false,
        timerDuration: '24',
        pages: [],
        showOnHomepage: true,
        ctaText: '',
        ctaUrl: ''
      });
      setManualPagesInput('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add video content',
        variant: 'destructive',
      });
    }
  });

  // Update video mutation
  const updateVideoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const payload = {
        password: 'pickntrust2025',
        title: data.title,
        description: data.description || '',
        category: data.category || '',
        tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : [],
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl || '',
        platform: data.platform,
        duration: data.duration || '',
        hasTimer: Boolean(data.hasTimer),
        timerDuration: data.hasTimer ? parseInt(data.timerDuration) : null,
        pages: data.pages || [],
        showOnHomepage: Boolean(data.showOnHomepage),
        ctaText: data.ctaText || '',
        ctaUrl: data.ctaUrl || ''
      };

      // Append critical fields to query string for proxy compatibility on EC2
      const qsPages = encodeURIComponent((payload.pages || []).join(','));
      const qsShow = payload.showOnHomepage ? 'true' : 'false';
      const url = `/api/admin/video-content/${id}?password=pickntrust2025&pages=${qsPages}&showOnHomepage=${qsShow}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update video');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Updated!',
        description: 'Video content updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/video-content'] });
      setEditingVideoId(null);
      setVideoData({
        title: '',
        description: '',
        category: '',
        tags: '',
        videoUrl: '',
        thumbnailUrl: '',
        platform: 'any-website',
        duration: '',
        customFields: {},
        hasTimer: false,
        timerDuration: '24',
        pages: [],
        showOnHomepage: true,
        ctaText: '',
        ctaUrl: ''
      });
      setManualPagesInput('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update video content',
        variant: 'destructive',
      });
    }
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
        description: 'Video content deleted successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/video-content'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete video content',
        variant: 'destructive',
      });
    }
  });

  // Delete all videos mutation
  const deleteAllVideosMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/video-content/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'pickntrust2025' }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete all videos');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'All videos deleted successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/video-content'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete all videos',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoData.title.trim() || !videoData.videoUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Title and video URL are required',
        variant: 'destructive',
      });
      return;
    }

    const extraPages = parseManualPages(manualPagesInput);
    const mergedPages = Array.from(new Set([...(videoData.pages || []), ...extraPages]));
    if (editingVideoId) {
      updateVideoMutation.mutate({ id: editingVideoId, data: { ...videoData, platform: activeTab, pages: mergedPages } });
    } else {
      addVideoMutation.mutate({ ...videoData, platform: activeTab, pages: mergedPages });
    }
  };

  const handleDeleteVideo = (videoId: number) => {
    if (confirm('Are you sure you want to delete this video content?')) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  const handleDeleteAllVideos = () => {
    if (!Array.isArray(videoContent) || videoContent.length === 0) {
      toast({
        title: 'No Videos',
        description: 'There are no videos to delete.',
        variant: 'destructive',
      });
      return;
    }

    const confirmMessage = `Are you sure you want to delete ALL ${videoContent.length} videos? This action cannot be undone!`;
    if (confirm(confirmMessage)) {
      deleteAllVideosMutation.mutate();
    }
  };

  const activePlatform = platforms.find(p => p.id === activeTab);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-900 to-blue-900 text-white border-purple-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Video className="w-8 h-8 text-purple-300" />
            <i className="fas fa-video"></i> Video Content Manager
          </CardTitle>
          <CardDescription className="text-purple-200">
            Upload video files or add videos from any platform with auto-generated thumbnails
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Platform Tabs */}
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform) => (
          <Button
            key={platform.id}
            variant={activeTab === platform.id ? "default" : "outline"}
            onClick={() => {
              setActiveTab(platform.id);
              setVideoData({ ...videoData, platform: platform.id });
            }}
            className={`flex items-center gap-2 ${
              activeTab === platform.id 
                ? `${platform.color} text-white` 
                : 'border-gray-600 text-gray-300 hover:bg-gray-800'
            }`}
          >
            {platform.icon}
            {platform.name}
          </Button>
        ))}
      </div>

      {/* Video Upload Form */}
      <Card className="bg-gray-900 text-white border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-400">
            {activePlatform?.icon}
            Add {activePlatform?.name} Video
          </CardTitle>
          <CardDescription className="text-gray-300">
            Add videos with automatic thumbnail extraction and timer functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Video Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-white font-medium">Video URL *</Label>
                <Input
                  value={videoData.videoUrl}
                  onChange={(e) => setVideoData({ ...videoData, videoUrl: e.target.value })}
                  placeholder={activePlatform?.placeholder}
                  className="bg-gray-800 border-gray-600 text-white mt-2"
                  required
                />
                
                <div className="mt-3 p-4 bg-gray-800 rounded-lg border border-gray-600">
                  <Label className="text-white font-medium mb-2 block">Or Upload Video File</Label>
                  <input 
                    type="file" 
                    accept="video/*" 
                    className="hidden" 
                    id="video-upload"
                    onChange={handleVideoUpload}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('video-upload')?.click()}
                    className="w-full"
                    disabled={uploadingVideo}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingVideo ? 'Uploading...' : 'Upload Video File'}
                  </Button>
                  <p className="text-xs text-purple-400 mt-2">
                    <i className="fas fa-film"></i> Supports: MP4, WebM, OGG, MOV, AVI, WMV, FLV, MKV, M4V, 3GP (max 100MB)
                  </p>
                </div>
              </div>

              <div>
                {videoData.videoUrl && (
                  <div>
                    <Label className="text-white font-medium">Preview</Label>
                    <div className="mt-2 border border-gray-600 rounded-lg overflow-hidden">
                      {getVideoPreview(videoData.videoUrl, videoData.platform)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white font-medium">Title *</Label>
                <Input
                  value={videoData.title}
                  onChange={(e) => setVideoData({ ...videoData, title: e.target.value })}
                  placeholder="Amazing Video Title"
                  className="bg-gray-800 border-gray-600 text-white mt-2"
                  required
                />
              </div>

              <div>
                <Label className="text-white font-medium">Category</Label>
                <Select 
                  value={videoData.category}
                  onValueChange={(value) => setVideoData({ ...videoData, category: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {videoCategoryGroupOrder.filter(label => groupedVideoCategories[label]?.length).map((label, idx, arr) => (
                      <SelectGroup key={label}>
                        <div className="px-2 py-1 text-xs uppercase tracking-wide font-bold text-white">{label}</div>
                        {groupedVideoCategories[label].map((cat: any) => (
                          <SelectItem key={cat.id ?? cat.name} value={cat.name} className="text-white hover:bg-gray-700">
                            {cat.name}
                          </SelectItem>
                        ))}
                        {idx < arr.length - 1 && <SelectSeparator className="bg-gray-700" />}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-white font-medium">Description</Label>
              <Textarea
                value={videoData.description}
                onChange={(e) => setVideoData({ ...videoData, description: e.target.value })}
                placeholder="Detailed description of the video content..."
                className="bg-gray-800 border-gray-600 text-white mt-2"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white font-medium">Tags</Label>
                <Input
                  value={videoData.tags}
                  onChange={(e) => setVideoData({ ...videoData, tags: e.target.value })}
                  placeholder="viral, trending, funny"
                  className="bg-gray-800 border-gray-600 text-white mt-2"
                />
              </div>

              <div>
                <Label className="text-white font-medium">Duration</Label>
                <Input
                  value={videoData.duration}
                  onChange={(e) => setVideoData({ ...videoData, duration: e.target.value })}
                  placeholder="5:30"
                  className="bg-gray-800 border-gray-600 text-white mt-2"
                />
              </div>
            </div>

            {/* Enhanced Thumbnail Section */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-3">
                <Image className="w-5 h-5 text-blue-400" />
                <Label className="text-white font-medium">Video Thumbnail</Label>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="auto-thumbnail"
                    name="thumbnailMode"
                    checked={thumbnailMode === 'auto'}
                    onChange={() => {
                      setThumbnailMode('auto');
                      const autoThumbnail = generateThumbnailFromUrl(videoData.videoUrl, activeTab);
                      if (autoThumbnail) {
                        setVideoData({ ...videoData, thumbnailUrl: autoThumbnail });
                      }
                    }}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                  <Label htmlFor="auto-thumbnail" className="text-white text-sm">
                    Auto-generate (Default)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="manual-thumbnail"
                    name="thumbnailMode"
                    checked={thumbnailMode === 'manual'}
                    onChange={() => setThumbnailMode('manual')}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                  <Label htmlFor="manual-thumbnail" className="text-white text-sm">
                    Manual URL
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="upload-thumbnail"
                    name="thumbnailMode"
                    checked={thumbnailMode === 'upload'}
                    onChange={() => setThumbnailMode('upload')}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                  <Label htmlFor="upload-thumbnail" className="text-white text-sm">
                    Upload Image
                  </Label>
                </div>
              </div>

              {thumbnailMode === 'auto' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={videoData.thumbnailUrl}
                      placeholder="Auto-generated from video URL"
                      className="bg-gray-700 border-gray-600 text-white"
                      disabled
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const autoThumbnail = generateThumbnailFromUrl(videoData.videoUrl, activeTab);
                        if (autoThumbnail) {
                          setVideoData({ ...videoData, thumbnailUrl: autoThumbnail });
                          toast({
                            title: 'Success',
                            description: 'Thumbnail auto-generated!',
                          });
                        } else {
                          toast({
                            title: 'Info',
                            description: 'Auto-generation not available for this platform.',
                          });
                        }
                      }}
                      disabled={!videoData.videoUrl}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-xs text-blue-400">
                    <i className="fas fa-sparkles"></i> Automatically extracts thumbnail from YouTube, Vimeo, and other supported platforms
                  </p>
                </div>
              )}

              {thumbnailMode === 'manual' && (
                <div className="space-y-2">
                  <Input
                    value={videoData.thumbnailUrl}
                    onChange={(e) => setVideoData({ ...videoData, thumbnailUrl: e.target.value })}
                    placeholder="https://example.com/thumbnail.jpg"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-xs text-green-400">
                    <i className="fas fa-link"></i> Enter a direct URL to your custom thumbnail image
                  </p>
                </div>
              )}

              {thumbnailMode === 'upload' && (
                <div className="space-y-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    id="thumbnail-upload"
                    onChange={handleThumbnailUpload}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('thumbnail-upload')?.click()}
                    className="w-full"
                    disabled={uploadingThumbnail}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingThumbnail ? 'Uploading...' : 'Upload Thumbnail Image'}
                  </Button>
                  <p className="text-xs text-purple-400">
                    <i className="fas fa-folder"></i> Supports: JPEG, PNG, GIF, WebP, BMP, SVG, TIFF, ICO, AVIF (max 10MB)
                  </p>
                </div>
              )}

              {videoData.thumbnailUrl && (
                <div className="mt-3 border border-gray-600 rounded-lg overflow-hidden">
                  <img 
                    src={videoData.thumbnailUrl} 
                    alt="Thumbnail preview" 
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400';
                    }}
                  />
                  <div className="p-2 bg-gray-800">
                    <p className="text-xs text-green-400"><i className="fas fa-check-circle"></i> Thumbnail loaded successfully</p>
                  </div>
                </div>
              )}
            </div>

            {/* Page Selection Section */}
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
              <h3 className="text-white font-medium mb-4">📍 Video Display Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showOnHomepage"
                    checked={videoData.showOnHomepage}
                    onChange={(e) => setVideoData({ ...videoData, showOnHomepage: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="showOnHomepage" className="text-white">
                    <i className="fas fa-home"></i> Show on Homepage
                  </Label>
                </div>
                
                <div>
                  <Label className="text-white font-medium mb-3 block"><i className="fas fa-file-alt"></i> Additional Pages (Select Multiple)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {availablePages.map((page) => (
                      <div key={page.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`page-${page.value}`}
                          checked={videoData.pages.includes(page.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVideoData({ 
                                ...videoData, 
                                pages: [...videoData.pages, page.value] 
                              });
                            } else {
                              setVideoData({ 
                                ...videoData, 
                                pages: videoData.pages.filter(p => p !== page.value) 
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={`page-${page.value}`} className="text-white text-sm">
                          {page.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-blue-400 mt-2">
                    <i className="fas fa-sparkles"></i> Video will appear on homepage (if checked) and all selected pages
                  </p>
                  {/* Manual Slugs Input */}
                  <div className="mt-4">
                    <Label className="text-white font-medium mb-2 block"><i className="fas fa-keyboard"></i> Manual page slugs (comma-separated)</Label>
                    <Input
                      value={manualPagesInput}
                      onChange={(e) => setManualPagesInput(e.target.value)}
                      placeholder="e.g., videos, apps, services"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    <p className="text-xs text-purple-400 mt-2">
                      <i className="fas fa-info-circle"></i> These slugs will be added along with selected pages when you save.
                    </p>
                    {(() => {
                      const preview = Array.from(new Set([...(videoData.pages || []), ...parseManualPages(manualPagesInput)]));
                      return (
                        <p className="text-xs text-green-400 mt-1">
                          <i className="fas fa-list"></i> Effective pages: {preview.length ? preview.join(', ') : 'none'}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button Section */}
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
              <h3 className="text-white font-medium mb-4"><i className="fas fa-link"></i> Call-to-Action Button (Optional)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white font-medium">Button Text</Label>
                  <Input
                    value={videoData.ctaText}
                    onChange={(e) => setVideoData({ ...videoData, ctaText: e.target.value })}
                    placeholder="e.g., Learn More, Buy Now, Visit Site"
                    className="bg-gray-700 border-gray-600 text-white mt-2"
                  />
                </div>
                
                <div>
                  <Label className="text-white font-medium">Button URL</Label>
                  <Input
                    value={videoData.ctaUrl}
                    onChange={(e) => setVideoData({ ...videoData, ctaUrl: e.target.value })}
                    placeholder="https://example.com"
                    className="bg-gray-700 border-gray-600 text-white mt-2"
                    type="url"
                  />
                </div>
              </div>
              
              {videoData.ctaText && videoData.ctaUrl && (
                <div className="mt-3 p-3 bg-green-900/30 border border-green-600/50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <span className="text-sm font-medium"><i className="fas fa-check-circle"></i> CTA Button Preview</span>
                  </div>
                  <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                    {videoData.ctaText}
                  </button>
                  <p className="text-green-300 text-xs mt-1">
                    Will link to: {videoData.ctaUrl}
                  </p>
                </div>
              )}
            </div>

            {/* Auto-Delete Timer Section */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <Label className="text-white font-medium">Auto-Delete Timer</Label>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasTimer"
                    checked={videoData.hasTimer}
                    onChange={(e) => setVideoData({ ...videoData, hasTimer: e.target.checked })}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                  <Label htmlFor="hasTimer" className="text-white text-sm">
                    Enable auto-delete after specified hours
                  </Label>
                </div>
                {videoData.hasTimer && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={videoData.timerDuration}
                      onValueChange={(value) => setVideoData({ ...videoData, timerDuration: value })}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="1" className="text-white hover:bg-gray-700">1 hour</SelectItem>
                        <SelectItem value="6" className="text-white hover:bg-gray-700">6 hours</SelectItem>
                        <SelectItem value="12" className="text-white hover:bg-gray-700">12 hours</SelectItem>
                        <SelectItem value="24" className="text-white hover:bg-gray-700">24 hours (1 day)</SelectItem>
                        <SelectItem value="48" className="text-white hover:bg-gray-700">48 hours (2 days)</SelectItem>
                        <SelectItem value="72" className="text-white hover:bg-gray-700">72 hours (3 days)</SelectItem>
                        <SelectItem value="168" className="text-white hover:bg-gray-700">168 hours (1 week)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {videoData.hasTimer && (
                <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span className="text-sm font-medium">Auto-Delete Warning</span>
                  </div>
                  <p className="text-yellow-300 text-xs mt-1">
                    This video will be automatically deleted after {videoData.timerDuration} hours. The countdown is hidden from frontend users.
                  </p>
                </div>
              )}
            </div>

            {/* Submit / Save Buttons */}
             <div className="flex justify-end gap-2">
               {editingVideoId && (
                 <Button
                   type="button"
                   variant="outline"
                   className="border-gray-600 text-gray-200"
                   onClick={() => { setEditingVideoId(null); }}
                 >
                   Cancel Edit
                 </Button>
               )}
               <Button 
                 type="submit"
                 disabled={editingVideoId ? updateVideoMutation.isPending : addVideoMutation.isPending}
                 className="bg-green-600 hover:bg-green-700 text-white px-8"
               >
                 {editingVideoId
                   ? (updateVideoMutation.isPending ? 'Saving Changes...' : 'Save Changes')
                   : (addVideoMutation.isPending ? 'Adding Video...' : 'Add Video Content')}
               </Button>
             </div>
          </form>
        </CardContent>
      </Card>

      {/* Video Library */}
       <Card>
         <CardHeader>
           <div className="flex items-center justify-between">
             <div>
               <CardTitle>Video Library ({Array.isArray(videoContent) ? videoContent.length : 0})</CardTitle>
               <CardDescription>
                 Manage all your video content with editing, timer status, and organization tools
               </CardDescription>
             </div>
             {Array.isArray(videoContent) && videoContent.length > 0 && (
               <Button
                 variant="destructive"
                 size="sm"
                 onClick={handleDeleteAllVideos}
                 disabled={deleteAllVideosMutation.isPending}
                 className="bg-red-600 hover:bg-red-700"
               >
                 <Trash2 className="w-4 h-4 mr-2" />
                 {deleteAllVideosMutation.isPending ? 'Deleting...' : 'Delete All'}
               </Button>
             )}
           </div>
         </CardHeader>
        <CardContent>
           {isLoading ? (
             <div className="text-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
               <p className="mt-2 text-gray-600">Loading video content...</p>
             </div>
           ) : !Array.isArray(videoContent) || videoContent.length === 0 ? (
             <div className="text-center py-8">
               <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
               <p className="text-gray-600">No video content found. Add your first video above.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {videoContent.map((video: VideoContent) => (
                 <div key={video.id} className="bg-gray-800 rounded-lg overflow-hidden">
                   <div className="relative">
                     {getVideoPreview(video.videoUrl, video.platform)}
                     <Badge className={`absolute top-2 right-2 ${
                       platforms.find(p => p.id === video.platform)?.color || 'bg-gray-600'
                     }`}>
                       {platforms.find(p => p.id === video.platform)?.name || video.platform}
                     </Badge>
                     {video.hasTimer && (
                       <Badge className="absolute top-2 left-2 bg-yellow-600 text-white">
                         <Clock className="w-3 h-3 mr-1" />
                         {video.timerDuration}h
                       </Badge>
                     )}
                   </div>
                   <div className="p-4">
                     <h3 className="font-semibold text-white mb-2 line-clamp-2">{video.title}</h3>
                     <p className="text-gray-400 text-sm mb-3 line-clamp-2">{video.description}</p>
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2">
                         <Badge variant="secondary" className="text-xs">
                           {video.category}
                         </Badge>
                         {video.duration && (
                           <span className="text-xs text-gray-400">{video.duration}</span>
                         )}
                       </div>
                     </div>
                     
                     {/* Display Settings */}
                     <div className="flex flex-wrap gap-1 mb-3">
                       {video.showOnHomepage && (
                         <Badge className="bg-blue-600 text-white text-xs">
                           <i className="fas fa-home"></i> Homepage
                         </Badge>
                       )}
                       {video.pages && video.pages.length > 0 && (
                         <Badge className="bg-green-600 text-white text-xs">
                           📍 {video.pages.length} Page{video.pages.length > 1 ? 's' : ''}
                         </Badge>
                       )}
                       {video.ctaText && video.ctaUrl && (
                         <Badge className="bg-purple-600 text-white text-xs">
                           <i className="fas fa-link"></i> CTA
                         </Badge>
                       )}
                       {!video.showOnHomepage && (!video.pages || video.pages.length === 0) && (
                         <Badge className="bg-gray-600 text-white text-xs">
                           🚫 Not displayed
                         </Badge>
                       )}
                     </div>
                     
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-1">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="text-gray-400 hover:text-white"
                           onClick={() => window.open(toAbsoluteMediaUrl(video.videoUrl), '_blank')}
                           title="View video"
                         >
                           <Eye className="w-4 h-4" />
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="text-gray-400 hover:text-white"
                           onClick={() => {
                             setVideoData({
                               title: video.title,
                               description: video.description || '',
                               category: video.category || '',
                               tags: Array.isArray(video.tags) ? video.tags.join(', ') : (video.tags || ''),
                               videoUrl: video.videoUrl,
                               thumbnailUrl: video.thumbnailUrl || '',
                               platform: video.platform,
                               duration: video.duration || '',
                               customFields: video.customFields || {},
                               hasTimer: video.hasTimer || false,
                               timerDuration: video.timerDuration ? video.timerDuration.toString() : '24',
                               pages: video.pages || [],
                               showOnHomepage: video.showOnHomepage ?? true,
                               ctaText: video.ctaText || '',
                               ctaUrl: video.ctaUrl || ''
                             });
                             setEditingVideoId(video.id);
                             setActiveTab(video.platform);
                             if (video.thumbnailUrl) {
                               if (video.thumbnailUrl.includes('youtube.com') || video.thumbnailUrl.includes('vimeo.com')) {
                                 setThumbnailMode('auto');
                               } else if (video.thumbnailUrl.startsWith('data:image/')) {
                                 setThumbnailMode('upload');
                               } else {
                                 setThumbnailMode('manual');
                               }
                             }
                             toast({
                               title: 'Edit Mode',
                               description: 'Video content loaded for editing. Make your changes and save.',
                             });
                             window.scrollTo({ top: 0, behavior: 'smooth' });
                           }}
                           title="Edit video"
                         >
                           <Edit className="w-4 h-4" />
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="text-red-400 hover:text-red-300"
                           onClick={() => handleDeleteVideo(video.id)}
                           disabled={deleteVideoMutation.isPending}
                           title="Delete video"
                         >
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </div>
                     </div>
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
