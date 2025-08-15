import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, Video, Youtube, Instagram, Music, Globe, Edit, Trash2, Eye } from 'lucide-react';

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
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showCustomFieldForm, setShowCustomFieldForm] = useState(false);
  
  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    videoUrl: '',
    thumbnailUrl: '',
    platform: 'any-website',
    duration: '',
    customFields: {} as Record<string, string>
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

  // Handle video file upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const supportedVideoTypes = [
      'video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi', 
      'video/wmv', 'video/flv', 'video/mkv', 'video/m4v', 'video/3gp'
    ];
    
    if (!supportedVideoTypes.includes(file.type)) {
      toast({
        title: 'Invalid Video Format',
        description: 'Please upload a valid video file (MP4, WebM, OGG, MOV, AVI, WMV, FLV, MKV, M4V, 3GP)',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (limit to 100MB for videos)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: 'Video File Too Large',
        description: 'Please upload a video smaller than 100MB for optimal performance.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingVideo(true);
    
    try {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setVideoData({ ...videoData, videoUrl: result, platform: 'file-upload' });
        setUploadingVideo(false);
        
        const fileExtension = file.type.split('/')[1].toUpperCase();
        toast({
          title: 'Success',
          description: `${fileExtension} video uploaded successfully! (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        });
      };
      
      reader.onerror = () => {
        setUploadingVideo(false);
        toast({
          title: 'Upload Error',
          description: 'Failed to read the video file. Please try again.',
          variant: 'destructive',
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
    
    // Remove from video data
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

    // YouTube thumbnail
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

    // Generic preview for other platforms
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
          createdAt: new Date().toISOString()
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
        customFields: {}
      });
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

    // Validate required custom fields
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
            Upload video files or add videos from any platform with custom fields and advanced management
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
            {activeTab === 'any-website' 
              ? 'Upload video files or paste video URLs from any website'
              : `Add videos from ${activePlatform?.name} with custom metadata`
            }
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
                
                {/* File Upload Option */}
                <div className="mt-3 p-4 bg-gray-800 rounded-lg border border-gray-600">
                  <Label className="text-white font-medium mb-2 block">Or Upload Video File</Label>
                  <input 
                    type="file" 
                    accept="video/mp4,video/webm,video/ogg,video/mov,video/avi,video/wmv,video/flv,video/mkv,video/m4v,video/3gp" 
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div>
                <Label className="text-white font-medium">Thumbnail URL</Label>
                <Input
                  value={videoData.thumbnailUrl}
                  onChange={(e) => setVideoData({ ...videoData, thumbnailUrl: e.target.value })}
                  placeholder="https://example.com/thumb.jpg"
                  className="bg-gray-800 border-gray-600 text-white mt-2"
                />
              </div>
            </div>

            {/* Custom Fields Section */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-white font-medium text-lg">Custom Fields</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomFieldForm(!showCustomFieldForm)}
                  className="text-blue-400 border-blue-400 hover:bg-blue-900"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Field
                </Button>
              </div>

              {/* Add Custom Field Form */}
              {showCustomFieldForm && (
                <div className="mb-4 p-3 bg-gray-700 rounded border border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Input
                      value={newCustomField.name}
                      onChange={(e) => setNewCustomField({ ...newCustomField, name: e.target.value })}
                      placeholder="Field name"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    <Select 
                      value={newCustomField.type}
                      onValueChange={(value: any) => setNewCustomField({ ...newCustomField, type: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="text" className="text-white">Text</SelectItem>
                        <SelectItem value="textarea" className="text-white">Textarea</SelectItem>
                        <SelectItem value="number" className="text-white">Number</SelectItem>
                        <SelectItem value="date" className="text-white">Date</SelectItem>
                        <SelectItem value="url" className="text-white">URL</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="required"
                        checked={newCustomField.required}
                        onChange={(e) => setNewCustomField({ ...newCustomField, required: e.target.checked })}
                        className="rounded border-gray-600 bg-gray-700"
                      />
                      <Label htmlFor="required" className="text-white text-sm">Required</Label>
                    </div>
                    <Button
                      type="button"
                      onClick={addCustomField}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {/* Custom Fields Display */}
              {customFields.length > 0 && (
                <div className="space-y-3">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Label className="text-white text-sm">{field.name}</Label>
                          {field.required && <span className="text-red-400 text-xs">*</span>}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomField(index)}
                            className="text-red-400 hover:text-red-300 p-1 h-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        {field.type === 'textarea' ? (
                          <Textarea
                            value={videoData.customFields[field.name] || ''}
                            onChange={(e) => updateCustomField(field.name, e.target.value)}
                            className="bg-gray-700 border-gray-600 text-white"
                            rows={2}
                          />
                        ) : (
                          <Input
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'}
                            value={videoData.customFields[field.name] || ''}
                            onChange={(e) => updateCustomField(field.name, e.target.value)}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit"
                disabled={addVideoMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                {addVideoMutation.isPending ? 'Adding Video...' : 'Add Video Content'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Video Library */}
      <Card>
        <CardHeader>
          <CardTitle>Video Library ({videoContent.length})</CardTitle>
          <CardDescription>
            Manage all your video content with editing and organization tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading video content...</p>
            </div>
          ) : videoContent.length === 0 ? (
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
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-2 line-clamp-2">{video.title}</h3>
                    {video.description && (
                      <p className="text-gray-300 text-sm mb-2 line-clamp-2">{video.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      {video.category && <span>{video.category}</span>}
                      {video.duration && <span>• {video.duration}</span>}
                      {video.views && <span>• {video.views} views</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-400 border-red-400">
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
