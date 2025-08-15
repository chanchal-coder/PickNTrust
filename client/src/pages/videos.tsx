import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Header from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Clock, Calendar, Tag, Search, Filter, Grid, List } from 'lucide-react';

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

export default function VideosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['/api/video-content'],
    queryFn: async () => {
      const response = await fetch('/api/video-content');
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      return response.json();
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
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Video Content</h1>
            <p className="text-muted-foreground text-lg">
              Discover our curated collection of videos, tutorials, and reviews
            </p>
          </div>

          {/* Filters and Search */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    {platforms.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing {filteredVideos.length} of {videos.length} videos
            </p>
          </div>

          {/* Videos Grid/List */}
          {filteredVideos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Play className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No videos found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== 'all' || selectedPlatform !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No video content has been published yet'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-6'
            }>
              {filteredVideos.map((video: VideoContent) => {
                const videoInfo = getVideoInfo(video.videoUrl, video.platform);
                
                return (
                  <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className={viewMode === 'grid' ? '' : 'md:flex'}>
                      {/* Video Thumbnail/Embed */}
                      <div className={viewMode === 'grid' ? 'aspect-video' : 'md:w-80 aspect-video md:aspect-square'}>
                        {videoInfo ? (
                          <iframe
                            src={videoInfo.embedUrl}
                            title={video.title}
                            className="w-full h-full border-0"
                            allowFullScreen
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Play className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Video Info */}
                      <CardContent className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                              {video.title}
                            </h3>
                            <Badge variant="secondary" className="shrink-0">
                              {video.platform}
                            </Badge>
                          </div>

                          <p className="text-muted-foreground text-sm line-clamp-3">
                            {video.description}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {video.category}
                            </Badge>
                            {video.duration && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {video.duration}
                              </Badge>
                            )}
                          </div>

                          {video.tags && video.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {video.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {video.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{video.tags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(video.createdAt)}
                            </div>
                            <Button size="sm" variant="outline" asChild>
                              <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                                Watch Full Video
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
