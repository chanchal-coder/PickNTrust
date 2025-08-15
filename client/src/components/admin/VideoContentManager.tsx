import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, Video, Youtube, Instagram, Music, Globe, Edit, Trash2, Eye, Clock, Image, RefreshCw } from 'lucide-react';

interface VideoContent {
  id: number;
  title: string;
  description?: string;
  category?: string;
  tags?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  platform: string;
  duration?: string;
  views?: number;
  createdAt: string;
  customFields?: Record<string, string>;
  hasTimer?: boolean;
  timerDuration?: string;
}

interface CustomField {
  name: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'url';
  required: boolean;
}

export default function VideoContentManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('any-website');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showCustomFieldForm, setShowCustomFieldForm] = useState(false);
  const [thumbnailMode, setThumbnailMode] = useState<'auto' | 'manual' | 'upload'>('auto');
  
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
    timerDuration: '24'
  });

  const [newCustomField, setNewCustomField] = useState({
    name: '',
    type: 'text' as const,
    required: false
  });

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
    }
  ];

  // Auto-generate thumbnail from video URL
  const generateThumbnailFromUrl = (url: string, platform: string) => {
    if (!url || thumbnailMode !== 'auto') return '';

    // YouTube thumbnail extraction
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
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

  // Handle video file upload
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
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setVideoData({ ...videoData, videoUrl: result, platform: 'file-upload' });
        setUploadingVideo(false);
        
        toast({
          title: 'Success',
          description: 'Video uploaded successfully!',
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadingVideo(false);
      toast({
        title: 'Error',
        description: 'Failed to upload video',
        variant: 'destructive',
      });
    }
  };

  // Add custom field
  const addCustomField = () => {
    if (!newCustomField.name.trim()) {
      toast({
        title: 'Error',
        description: 'Field name is required',
        variant: 'destructive',
      });
      return;
    }

    setCustomFields([...customFields, { ...newCustomField }]);
    setNewCustomField({ name: '', type: 'text', required: false });
    setShowCustomFieldForm(false);
    
    toast({
      title: 'Success',
      description: `Custom field "${newCustomField.name}" added successfully!`,
    });
  };

  // Remove custom field
  const removeCustomField = (index: number) => {
    const fieldName = customFields[index].name;
    setCustomFields(customFields.filter((_, i) => i !== index));
    
    const newCustomFields = { ...videoData.customFields };
    delete newCustomFields[fieldName];
    setVideoData({ ...videoData, customFields: newCustomFields });
    
    toast({
      title: 'Success',
      description: `Custom field "${fieldName}" removed successfully!`,
    });
  };

  // Update custom field value
  const updateCustomField = (fieldName: string, value: string) => {
    setVideoData({
      ...videoData,
      customFields: {
        ...videoData.customFields,
        [fieldName]: value
      }
    });
  };

  // Get video preview info
  const getVideoPreview = (url: string, platform: string) => {
    if (!url) return null;

    if (platform === 'file-upload' || url.startsWith('data:video/')) {
      return (
        <div className="relative">
          <video 
            src={url} 
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

  // Fetch video content
  const { data: videoContent = [], isLoading } = useQuery({
    queryKey: ['/api/video-content'],
    queryFn: async () => {
      const response = await fetch('/api/video-content');
      if (!response.ok) {
        throw new Error('Failed to fetch video content');
      }
      return response.json();
    },
    retry: 1
  });

  // Add video content mutation
  const addVideoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/video-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'pickntrust2025',
          ...data,
          tags: data.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0),
          createdAt: new Date().toISOString(),
          hasTimer: data.hasTimer,
          timerDuration: data.hasTimer ? data.timerDuration : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add video content');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-content'] });
      setVideoData({
        title: '',
        description: '',
        category: '',
        tags: '',
        videoUrl: '',
        thumbnailUrl: '',
        platform: activeTab,
        duration: '',
        customFields: {},
        hasTimer: false,
        timerDuration: '24'
      });
      setThumbnailMode('auto');
      toast({
        title: 'Success',
        description: 'Video content added successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add video content',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoData.title.trim() || !videoData.videoUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Title and video URL/file are required',
        variant: 'destructive',
      });
      return;
    }

    for (const field of customFields) {
      if (field.required && !videoData.customFields[field.name]?.trim()) {
        toast({
          title: 'Error',
          description: `${field.name} is required`,
          variant: 'destructive',
        });
        return;
      }
    }

    addVideoMutation.mutate({ ...videoData, platform: activeTab });
  };

  const activePlatform = platforms.find(p => p.id === activeTab);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-900 to-blue-900 text-white border-purple-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Video className="w-8 h-8 text-purple-300" />
            📹 Video Content Manager
          </CardTitle>
          <CardDescription className="text-purple-200">
            Upload video files or add videos from any platform with auto-generated thumbnails, custom fields, and advanced management
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
                    🎥 Supports: MP4, WebM, OGG, MOV, AVI, WMV, FLV, MKV, M4V, 3GP (max 100MB)
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
                    {['Entertainment', 'Education', 'Technology', 'Music', 'Gaming', 'Sports', 'News', 'Comedy', 'Tutorial', 'Review'].map(cat => (
                      <SelectItem key={cat} value={cat} className="text-white hover:bg-gray-700">
                        {cat}
                      </SelectItem>
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
                    ✨ Automatically extracts thumbnail from YouTube, Vimeo, and other supported platforms
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
                    🔗 Enter a direct URL to your custom thumbnail image
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
                    📁 Supports: JPEG, PNG, GIF, WebP, BMP, SVG, TIFF, ICO, AVIF (max 10MB)
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
                    <p className="text-xs text-green-400">✅ Thumbnail loaded successfully</p>
                  </div>
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
                      <SelectContent className="bg-gray-800 border-gray-
