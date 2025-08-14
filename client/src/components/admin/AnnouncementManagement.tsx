import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

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
  createdAt?: string;
}

export default function AnnouncementManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    message: '',
    textColor: '#ffffff',
    backgroundColor: '#3b82f6',
    fontSize: '16px',
    fontWeight: 'normal',
    textDecoration: 'none',
    fontStyle: 'normal',
    animationSpeed: '30',
    textBorderWidth: '0px',
    textBorderStyle: 'solid',
    textBorderColor: '#000000',
    bannerBorderWidth: '0px',
    bannerBorderStyle: 'solid',
    bannerBorderColor: '#000000'
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
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: adminPassword,
          ...announcementData
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
        fontSize: '16px',
        fontWeight: 'normal',
        textDecoration: 'none',
        fontStyle: 'normal',
        animationSpeed: '30',
        textBorderWidth: '0px',
        textBorderStyle: 'solid',
        textBorderColor: '#000000',
        bannerBorderWidth: '0px',
        bannerBorderStyle: 'solid',
        bannerBorderColor: '#000000'
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

  const presetColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6b7280'
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
    <div className="space-y-6">
      {/* Add Announcement Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Announcement</CardTitle>
          <CardDescription>
            Create a new announcement banner for your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAddingAnnouncement ? (
            <Button 
              onClick={() => setIsAddingAnnouncement(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Announcement
            </Button>
          ) : (
            <form onSubmit={handleAddAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Announcement Message</label>
                <textarea
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                  placeholder="🎉 Special offer! Get 50% off on all products today!"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Text Color</label>
                  <div className="flex gap-2 mb-2">
                    {presetColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewAnnouncement({ ...newAnnouncement, textColor: color })}
                        className={`w-6 h-6 rounded border-2 ${
                          newAnnouncement.textColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={newAnnouncement.textColor}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, textColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Background Color</label>
                  <div className="flex gap-2 mb-2">
                    {presetColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewAnnouncement({ ...newAnnouncement, backgroundColor: color })}
                        className={`w-6 h-6 rounded border-2 ${
                          newAnnouncement.backgroundColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={newAnnouncement.backgroundColor}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, backgroundColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Font Size</label>
                  <select
                    value={newAnnouncement.fontSize}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, fontSize: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                    <option value="20px">20px</option>
                    <option value="24px">24px</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Font Weight</label>
                  <select
                    value={newAnnouncement.fontWeight}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, fontWeight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="lighter">Lighter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Animation Speed</label>
                  <select
                    value={newAnnouncement.animationSpeed}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, animationSpeed: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="10">Very Fast</option>
                    <option value="20">Fast</option>
                    <option value="30">Normal</option>
                    <option value="40">Slow</option>
                    <option value="50">Very Slow</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="border border-gray-300 rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">Preview</label>
                <div 
                  className="p-3 rounded text-center overflow-hidden whitespace-nowrap"
                  style={{
                    backgroundColor: newAnnouncement.backgroundColor,
                    color: newAnnouncement.textColor,
                    fontSize: newAnnouncement.fontSize,
                    fontWeight: newAnnouncement.fontWeight,
                    textDecoration: newAnnouncement.textDecoration,
                    fontStyle: newAnnouncement.fontStyle
                  }}
                >
                  <div className="animate-marquee">
                    {newAnnouncement.message || 'Your announcement message will appear here...'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={addAnnouncementMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {addAnnouncementMutation.isPending ? 'Creating...' : 'Create Announcement'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsAddingAnnouncement(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Announcements ({announcements.length})</CardTitle>
          <CardDescription>
            View and manage all announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No announcements found. Create your first announcement above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement: Announcement) => (
                <div
                  key={announcement.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">Announcement #{announcement.id}</h3>
                        {announcement.isActive && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            Active
                          </span>
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
                      <div className="text-sm text-gray-600">
                        <p>Animation Speed: {announcement.animationSpeed}s</p>
                        <p>Created: {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : 'Unknown'}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      disabled={deleteAnnouncementMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </div>
  );
}
