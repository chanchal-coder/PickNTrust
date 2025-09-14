import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ColorPicker } from '@/components/ui/color-picker';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Megaphone, Palette, Type, Settings, Eye } from 'lucide-react';
import { getAvailablePages, getAvailablePagesHybrid, getPageDisplayName, type PageInfo } from '@/utils/pages';

interface Announcement {
  id: number;
  message: string;
  isActive: boolean;
  textColor: string;
  backgroundColor: string;
  fontSize: string;
  fontWeight: string;
  textDecoration: string;
  fontStyle: string;
  animationSpeed: string;
  textBorderWidth: string;
  textBorderStyle: string;
  textBorderColor: string;
  bannerBorderWidth: string;
  bannerBorderStyle: string;
  bannerBorderColor: string;
  page?: string; // Page-specific announcement
  isGlobal?: boolean; // Global announcement for all pages
  createdAt?: string;
}

export default function AnnouncementManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
  const [availablePages, setAvailablePages] = useState<PageInfo[]>([]);
  
  // Load available pages on component mount (with API fallback)
  useEffect(() => {
    const loadPages = async () => {
      try {
        // Try API first for dynamic pages, fallback to static
        const pages = await getAvailablePagesHybrid();
        setAvailablePages(pages);
      } catch (error) {
        console.error('Failed to load pages:', error);
        // Final fallback to static pages
        const staticPages = getAvailablePages();
        setAvailablePages(staticPages);
      }
    };
    
    loadPages();
  }, []);
  const [newAnnouncement, setNewAnnouncement] = useState({
    message: '',
    textColor: '#ffffff',
    backgroundColor: '#3b82f6',
    fontSize: 'Medium (16px)',
    fontWeight: 'Normal',
    textDecoration: 'None',
    fontStyle: 'Normal',
    animationSpeed: 'Medium (30s)',
    textBorderWidth: 'None (0px)',
    textBorderStyle: 'Solid',
    textBorderColor: '#000000',
    bannerBorderWidth: 'None (0px)',
    bannerBorderStyle: 'Solid',
    bannerBorderColor: '#000000',
    page: '',
    isGlobal: true
  });

  // Fetch announcements
  const { data: announcements = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/announcements'],
    queryFn: async () => {
      const adminPassword = 'pickntrust2025';
      const response = await fetch(`/api/admin/announcements?password=${adminPassword}`);
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }
      return response.json();
    },
    retry: 1
  });

  // Add announcement mutation
  const addAnnouncementMutation = useMutation({
    mutationFn: async (announcementData: any) => {
      const adminPassword = 'pickntrust2025';
      
      // Convert display values to actual values
      const processedData = {
        ...announcementData,
        fontSize: announcementData.fontSize.includes('(') ? 
          announcementData.fontSize.match(/\(([^)]+)\)/)[1] : announcementData.fontSize,
        animationSpeed: announcementData.animationSpeed.includes('(') ? 
          announcementData.animationSpeed.match(/\(([^)]+)\)/)[1].replace('s', '') : announcementData.animationSpeed,
        textBorderWidth: announcementData.textBorderWidth.includes('(') ? 
          announcementData.textBorderWidth.match(/\(([^)]+)\)/)[1] : announcementData.textBorderWidth,
        bannerBorderWidth: announcementData.bannerBorderWidth.includes('(') ? 
          announcementData.bannerBorderWidth.match(/\(([^)]+)\)/)[1] : announcementData.bannerBorderWidth,
      };

      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: adminPassword,
          ...processedData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add announcement');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] });
      setNewAnnouncement({
        message: '',
        textColor: '#ffffff',
        backgroundColor: '#3b82f6',
        fontSize: 'Medium (16px)',
        fontWeight: 'Normal',
        textDecoration: 'None',
        fontStyle: 'Normal',
        animationSpeed: 'Medium (30s)',
        textBorderWidth: 'None (0px)',
        textBorderStyle: 'Solid',
        textBorderColor: '#000000',
        bannerBorderWidth: 'None (0px)',
        bannerBorderStyle: 'Solid',
        bannerBorderColor: '#000000',
         page: '',
         isGlobal: true
       });
      setIsAddingAnnouncement(false);
      toast({
        title: 'Success',
        description: 'Announcement created successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create announcement',
        variant: 'destructive',
      });
    }
  });

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (announcementId: number) => {
      const adminPassword = 'pickntrust2025';
      const response = await fetch(`/api/admin/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete announcement');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] });
      toast({
        title: 'Success',
        description: 'Announcement deleted successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete announcement',
        variant: 'destructive',
      });
    }
  });

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.message.trim()) {
      toast({
        title: 'Error',
        description: 'Announcement message is required',
        variant: 'destructive',
      });
      return;
    }
    addAnnouncementMutation.mutate(newAnnouncement);
  };

  const handleDeleteAnnouncement = (announcementId: number) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      deleteAnnouncementMutation.mutate(announcementId);
    }
  };

  // Font size options with more variety
  const fontSizeOptions = [
    'Extra Small (10px)', 'Small (12px)', 'Medium (16px)', 'Large (20px)', 
    'Extra Large (24px)', 'Huge (28px)', 'Giant (32px)', 'Massive (40px)'
  ];

  // Font weight options
  const fontWeightOptions = [
    'Thin', 'Extra Light', 'Light', 'Normal', 'Medium', 'Semi Bold', 'Bold', 'Extra Bold', 'Black'
  ];

  // Font style options
  const fontStyleOptions = [
    'Normal', 'Italic', 'Oblique'
  ];

  // Text decoration options
  const textDecorationOptions = [
    'None', 'Underline', 'Overline', 'Line Through', 'Underline Overline'
  ];

  // Animation speed options
  const animationSpeedOptions = [
    'Lightning (5s)', 'Very Fast (10s)', 'Fast (20s)', 'Medium (30s)', 'Slow (40s)', 'Very Slow (60s)', 'Crawl (90s)'
  ];

  // Border width options
  const borderWidthOptions = [
    'None (0px)', 'Hair (0.5px)', 'Thin (1px)', 'Medium (2px)', 'Thick (3px)', 'Extra Thick (5px)', 'Ultra Thick (8px)'
  ];

  // Border style options
  const borderStyleOptions = [
    'Solid', 'Dashed', 'Dotted', 'Double', 'Groove', 'Ridge', 'Inset', 'Outset'
  ];

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Announcements</CardTitle>
          <CardDescription>
            Failed to load announcements. Check your server connection.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ArrowLeft className="w-6 h-6 text-blue-400" />
        <div>
          <h2 className="text-2xl font-bold text-blue-400">Announcement Banner</h2>
          <p className="text-gray-400">Manage the scrolling announcement banner shown on the homepage</p>
        </div>
      </div>

      {/* Active Announcement Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <p className="text-gray-400">
              {announcements.length > 0 && announcements.some((a: Announcement) => a.isActive) 
                ? `Active announcement: "${announcements.find((a: Announcement) => a.isActive)?.message}"`
                : "No active announcement. Create one below."
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Create New Announcement */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-blue-400">Create New Announcement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAddAnnouncement} className="space-y-6">
            {/* Announcement Message */}
            <div>
              <Label className="text-white font-medium">Announcement Message</Label>
              <Textarea
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                placeholder="Enter your announcement message (use emojis for more appeal!)"
                className="bg-gray-900 border-gray-600 text-white mt-2"
                rows={3}
                required
              />
            </div>

            {/* Page Targeting */}
            <div className="space-y-4">
              <Label className="text-white font-medium">Page Targeting</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white font-medium">Announcement Type</Label>
                  <Select 
                    value={newAnnouncement.isGlobal ? 'global' : 'page-specific'}
                    onValueChange={(value) => setNewAnnouncement({ 
                      ...newAnnouncement, 
                      isGlobal: value === 'global',
                      page: value === 'global' ? '' : newAnnouncement.page
                    })}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-600">
                      <SelectItem value="global" className="text-white hover:bg-gray-700">
                        🌐 Global (All Pages)
                      </SelectItem>
                      <SelectItem value="page-specific" className="text-white hover:bg-gray-700">
                        📄 Page-Specific
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!newAnnouncement.isGlobal && (
                  <div>
                    <Label className="text-white font-medium">Target Page</Label>
                    <Select 
                      value={newAnnouncement.page}
                      onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, page: value })}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-2">
                        <SelectValue placeholder="Select a page" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-600">
                        {availablePages.map(page => (
                          <SelectItem 
                            key={page.id} 
                            value={page.id} 
                            className="text-white hover:bg-gray-700"
                          >
                            {page.icon} {page.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-sm">
                {newAnnouncement.isGlobal 
                  ? "This announcement will appear on all pages of the website."
                  : "This announcement will only appear on the selected page."
                }
              </p>
            </div>

            {/* Text and Background Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ColorPicker
                label="Text Color"
                value={newAnnouncement.textColor}
                onChange={(color) => setNewAnnouncement({ ...newAnnouncement, textColor: color })}
              />

              <ColorPicker
                label="Background Color"
                value={newAnnouncement.backgroundColor}
                onChange={(color) => setNewAnnouncement({ ...newAnnouncement, backgroundColor: color })}
              />
            </div>

            {/* Font Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-white font-medium">Font Size</Label>
                <Select 
                  value={newAnnouncement.fontSize}
                  onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, fontSize: value })}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-600">
                    {fontSizeOptions.map(size => (
                      <SelectItem key={size} value={size} className="text-white hover:bg-gray-700">
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white font-medium">Font Weight</Label>
                <Select 
                  value={newAnnouncement.fontWeight}
                  onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, fontWeight: value })}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-600">
                    {fontWeightOptions.map(weight => (
                      <SelectItem key={weight} value={weight} className="text-white hover:bg-gray-700">
                        {weight}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-white font-medium">Font Style</Label>
                <Select 
                  value={newAnnouncement.fontStyle}
                  onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, fontStyle: value })}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-600">
                    {fontStyleOptions.map(style => (
                      <SelectItem key={style} value={style} className="text-white hover:bg-gray-700">
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white font-medium">Text Decoration</Label>
                <Select 
                  value={newAnnouncement.textDecoration}
                  onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, textDecoration: value })}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-600">
                    {textDecorationOptions.map(decoration => (
                      <SelectItem key={decoration} value={decoration} className="text-white hover:bg-gray-700">
                        {decoration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Animation Speed */}
            <div>
              <Label className="text-white font-medium">Animation Speed</Label>
              <Select 
                value={newAnnouncement.animationSpeed}
                onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, animationSpeed: value })}
              >
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-600">
                  {animationSpeedOptions.map(speed => (
                    <SelectItem key={speed} value={speed} className="text-white hover:bg-gray-700">
                      {speed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Text Border Options */}
            <Card className="bg-gray-900 border-blue-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-400 text-lg flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Text Border Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white font-medium">Border Width</Label>
                    <Select 
                      value={newAnnouncement.textBorderWidth}
                      onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, textBorderWidth: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {borderWidthOptions.map(width => (
                          <SelectItem key={width} value={width} className="text-white hover:bg-gray-700">
                            {width}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white font-medium">Border Style</Label>
                    <Select 
                      value={newAnnouncement.textBorderStyle}
                      onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, textBorderStyle: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {borderStyleOptions.map(style => (
                          <SelectItem key={style} value={style} className="text-white hover:bg-gray-700">
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <ColorPicker
                    label="Border Color"
                    value={newAnnouncement.textBorderColor}
                    onChange={(color) => setNewAnnouncement({ ...newAnnouncement, textBorderColor: color })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Banner Border Options */}
            <Card className="bg-gray-900 border-green-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-400 text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Banner Border Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white font-medium">Border Width</Label>
                    <Select 
                      value={newAnnouncement.bannerBorderWidth}
                      onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, bannerBorderWidth: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {borderWidthOptions.map(width => (
                          <SelectItem key={width} value={width} className="text-white hover:bg-gray-700">
                            {width}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white font-medium">Border Style</Label>
                    <Select 
                      value={newAnnouncement.bannerBorderStyle}
                      onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, bannerBorderStyle: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {borderStyleOptions.map(style => (
                          <SelectItem key={style} value={style} className="text-white hover:bg-gray-700">
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <ColorPicker
                    label="Border Color"
                    value={newAnnouncement.bannerBorderColor}
                    onChange={(color) => setNewAnnouncement({ ...newAnnouncement, bannerBorderColor: color })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <div>
              <Label className="text-white font-medium">Preview</Label>
              <div className="mt-2 bg-blue-600 rounded-lg p-4 overflow-hidden">
                <div 
                  className="text-center whitespace-nowrap animate-marquee"
                  style={{
                    color: newAnnouncement.textColor,
                    backgroundColor: newAnnouncement.backgroundColor,
                    fontSize: newAnnouncement.fontSize.includes('(') ? 
                      newAnnouncement.fontSize.match(/\(([^)]+)\)/)?.[1] : '16px',
                    fontWeight: newAnnouncement.fontWeight.toLowerCase(),
                    fontStyle: newAnnouncement.fontStyle.toLowerCase(),
                    textDecoration: newAnnouncement.textDecoration.toLowerCase().replace(' ', '-'),
                    padding: '12px',
                    borderRadius: '4px'
                  }}
                >
                  {newAnnouncement.message || 'Your announcement will appear here...'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4">
              <Button 
                type="button"
                variant="outline"
                className="text-blue-400 border-blue-400 hover:bg-blue-900"
              >
                <Eye className="w-4 h-4 mr-2" />
                Live Preview
              </Button>

              <div className="flex gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingAnnouncement(false)}
                  className="text-gray-400 border-gray-600 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addAnnouncementMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {addAnnouncementMutation.isPending ? 'Saving...' : 'Save Announcement'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Announcements */}
      {announcements.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Manage Announcements ({announcements.length})</CardTitle>
            <CardDescription className="text-gray-400">
              View and manage all announcements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-400">Loading announcements...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement: Announcement) => (
                  <div
                    key={announcement.id}
                    className="border border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-900"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">Announcement #{announcement.id}</h3>
                          {announcement.isActive && (
                            <Badge className="bg-green-600 text-white">
                              Active
                            </Badge>
                          )}
                          {announcement.isGlobal ? (
                            <Badge className="bg-blue-600 text-white">
                              🌐 Global
                            </Badge>
                          ) : (
                             <Badge className="bg-purple-600 text-white">
                               {announcement.page ? getPageDisplayName(announcement.page) : '📄 Page-Specific'}
                             </Badge>
                           )}
                        </div>
                        <div 
                          className="p-3 rounded mb-2 text-center"
                          style={{
                            backgroundColor: announcement.backgroundColor,
                            color: announcement.textColor,
                            fontSize: announcement.fontSize,
                            fontWeight: announcement.fontWeight
                          }}
                        >
                          {announcement.message}
                        </div>
                        <div className="text-sm text-gray-400">
                          <p>Animation Speed: {announcement.animationSpeed}s</p>
                          <p>Target: {announcement.isGlobal ? 'All Pages (Global)' : `${announcement.page ? getPageDisplayName(announcement.page) : 'Page-Specific'} Only`}</p>
                          <p>Created: {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : 'Unknown'}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        disabled={deleteAnnouncementMutation.isPending}
                        className="text-red-400 border-red-400 hover:bg-red-900/20"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
