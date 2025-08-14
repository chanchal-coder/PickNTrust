import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/header';
import { Trash2, Edit, Share2, ExternalLink, Facebook, Twitter, Instagram, MessageCircle, Star, DollarSign, Trophy, Package, Globe, FileText, Eye, Play, X, Tag, Plus, Megaphone } from 'lucide-react';
import { ColorPicker } from '@/components/color-picker';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  originalPrice: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL'),
  affiliateUrl: z.string().url('Must be a valid URL'),
  affiliateNetworkId: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  gender: z.string().optional(),
  rating: z.string().min(1, 'Rating is required'),
  reviewCount: z.string().min(1, 'Review count is required'),
  discount: z.string().optional(),
  hasTimer: z.boolean().optional(),
  timerDuration: z.string().optional(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

// Announcement Manager Component
function AnnouncementManager() {
  const [isEditing, setIsEditing] = useState(false);
  const [announcementData, setAnnouncementData] = useState({
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
    bannerBorderColor: '#000000',
    isActive: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current active announcement
  const { data: activeAnnouncement } = useQuery({
    queryKey: ['/api/announcement/active'],
    retry: false
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating announcement with data:', data);
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, password: 'pickntrust2025' })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create announcement');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      console.log('Announcement created successfully:', result);
      toast({
        title: 'Announcement Created!',
        description: 'The announcement banner has been activated and is now live.',
      });
      
      // Reset form data
      setAnnouncementData({
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
        bannerBorderColor: '#000000',
        isActive: true
      });
      
      // Refresh data and close editor
      queryClient.invalidateQueries({ queryKey: ['/api/announcement/active'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      console.error('Error creating announcement:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create announcement. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!announcementData.message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an announcement message.',
        variant: 'destructive',
      });
      return;
    }
    createAnnouncementMutation.mutate({
      ...announcementData,
      textBorderWidth: announcementData.textBorderWidth || '0px',
      textBorderStyle: announcementData.textBorderStyle || 'solid',
      textBorderColor: announcementData.textBorderColor || '#000000',
      bannerBorderWidth: announcementData.bannerBorderWidth || '0px',
      bannerBorderStyle: announcementData.bannerBorderStyle || 'solid',
      bannerBorderColor: announcementData.bannerBorderColor || '#000000',
    });
  };

  return (
    <div className="space-y-4">
      {activeAnnouncement ? (
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
            Current Active Announcement:
          </h4>
          <div 
            className="p-3 rounded-md text-center font-medium"
            style={{
              backgroundColor: (activeAnnouncement as any).backgroundColor,
              color: (activeAnnouncement as any).textColor,
              fontSize: (activeAnnouncement as any).fontSize,
              fontWeight: (activeAnnouncement as any).fontWeight,
              textDecoration: (activeAnnouncement as any).textDecoration || 'none',
              fontStyle: (activeAnnouncement as any).fontStyle || 'normal'
            }}
          >
            {(activeAnnouncement as any).message}
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAnnouncementData({
                  message: (activeAnnouncement as any).message,
                  textColor: (activeAnnouncement as any).textColor,
                  backgroundColor: (activeAnnouncement as any).backgroundColor,
                  fontSize: (activeAnnouncement as any).fontSize,
                  fontWeight: (activeAnnouncement as any).fontWeight,
                  textDecoration: (activeAnnouncement as any).textDecoration || 'none',
                  fontStyle: (activeAnnouncement as any).fontStyle || 'normal',
                  animationSpeed: (activeAnnouncement as any).animationSpeed,
                  textBorderWidth: (activeAnnouncement as any).textBorderWidth || '0px',
                  textBorderStyle: (activeAnnouncement as any).textBorderStyle || 'solid',
                  textBorderColor: (activeAnnouncement as any).textBorderColor || '#000000',
                  bannerBorderWidth: (activeAnnouncement as any).bannerBorderWidth || '0px',
                  bannerBorderStyle: (activeAnnouncement as any).bannerBorderStyle || 'solid',
                  bannerBorderColor: (activeAnnouncement as any).bannerBorderColor || '#000000',
                  isActive: true
                });
                setIsEditing(true);
              }}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-center text-gray-500 dark:text-gray-400">
          No active announcement. Create one below.
        </div>
      )}

      {!isEditing ? (
        <Button
          onClick={() => setIsEditing(true)}
          className="bg-bright-blue hover:bg-navy"
        >
          <Plus className="w-4 h-4 mr-1" />
          Create New Announcement
        </Button>
      ) : (
        <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="font-semibold text-navy dark:text-blue-400">
            {activeAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
          </h4>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="message">Announcement Message</Label>
              <Input
                id="message"
                placeholder="Enter your announcement message (use emojis for more appeal! 🎉✨)"
                value={announcementData.message}
                onChange={(e) => setAnnouncementData(prev => ({...prev, message: e.target.value}))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="textColor">Text Color</Label>
                <div className="flex gap-2 items-center">
                  <ColorPicker
                    selectedColor={announcementData.textColor}
                    onColorChange={(color) => setAnnouncementData(prev => ({...prev, textColor: color}))}
                  />
                  <Input
                    value={announcementData.textColor}
                    onChange={(e) => setAnnouncementData(prev => ({...prev, textColor: e.target.value}))}
                    className="flex-1"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex gap-2 items-center">
                  <ColorPicker
                    selectedColor={announcementData.backgroundColor}
                    onColorChange={(color) => setAnnouncementData(prev => ({...prev, backgroundColor: color}))}
                  />
                  <Input
                    value={announcementData.backgroundColor}
                    onChange={(e) => setAnnouncementData(prev => ({...prev, backgroundColor: e.target.value}))}
                    className="flex-1"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fontSize">Font Size</Label>
                <Select value={announcementData.fontSize} onValueChange={(value) => setAnnouncementData(prev => ({...prev, fontSize: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14px">Small (14px)</SelectItem>
                    <SelectItem value="16px">Medium (16px)</SelectItem>
                    <SelectItem value="18px">Large (18px)</SelectItem>
                    <SelectItem value="20px">Extra Large (20px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fontWeight">Font Weight</Label>
                <Select value={announcementData.fontWeight} onValueChange={(value) => setAnnouncementData(prev => ({...prev, fontWeight: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="600">Semi Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fontStyle">Font Style</Label>
                <Select value={announcementData.fontStyle} onValueChange={(value) => setAnnouncementData(prev => ({...prev, fontStyle: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="italic">Italic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="textDecoration">Text Decoration</Label>
                <Select value={announcementData.textDecoration} onValueChange={(value) => setAnnouncementData(prev => ({...prev, textDecoration: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="underline">Underline</SelectItem>
                    <SelectItem value="line-through">Strikethrough</SelectItem>
                    <SelectItem value="underline line-through">Underline + Strikethrough</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="animationSpeed">Animation Speed</Label>
                <Select value={announcementData.animationSpeed} onValueChange={(value) => setAnnouncementData(prev => ({...prev, animationSpeed: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">Fast (20s)</SelectItem>
                    <SelectItem value="30">Medium (30s)</SelectItem>
                    <SelectItem value="40">Slow (40s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-gray-200 dark:border-gray-600 my-4"></div>

            {/* Text Border Options */}
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-lg text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <span className="text-xl">🔲</span> Text Border Options
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="textBorderWidth">Border Width</Label>
                  <Select value={announcementData.textBorderWidth} onValueChange={(value) => setAnnouncementData(prev => ({...prev, textBorderWidth: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0px">None (0px)</SelectItem>
                      <SelectItem value="1px">Thin (1px)</SelectItem>
                      <SelectItem value="2px">Medium (2px)</SelectItem>
                      <SelectItem value="3px">Thick (3px)</SelectItem>
                      <SelectItem value="4px">Extra Thick (4px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="textBorderStyle">Border Style</Label>
                  <Select value={announcementData.textBorderStyle} onValueChange={(value) => setAnnouncementData(prev => ({...prev, textBorderStyle: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="dotted">Dotted</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="textBorderColor">Border Color</Label>
                  <div className="flex gap-2 items-center">
                    <ColorPicker
                      selectedColor={announcementData.textBorderColor}
                      onColorChange={(color) => setAnnouncementData(prev => ({...prev, textBorderColor: color}))}
                    />
                    <Input
                      value={announcementData.textBorderColor}
                      onChange={(e) => setAnnouncementData(prev => ({...prev, textBorderColor: e.target.value}))}
                      className="flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Border Options */}
            <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-lg text-green-800 dark:text-green-300 flex items-center gap-2">
                <span className="text-xl">🎯</span> Banner Border Options
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="bannerBorderWidth">Border Width</Label>
                  <Select value={announcementData.bannerBorderWidth} onValueChange={(value) => setAnnouncementData(prev => ({...prev, bannerBorderWidth: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0px">None (0px)</SelectItem>
                      <SelectItem value="1px">Thin (1px)</SelectItem>
                      <SelectItem value="2px">Medium (2px)</SelectItem>
                      <SelectItem value="3px">Thick (3px)</SelectItem>
                      <SelectItem value="4px">Extra Thick (4px)</SelectItem>
                      <SelectItem value="5px">Very Thick (5px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bannerBorderStyle">Border Style</Label>
                  <Select value={announcementData.bannerBorderStyle} onValueChange={(value) => setAnnouncementData(prev => ({...prev, bannerBorderStyle: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="dotted">Dotted</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bannerBorderColor">Border Color</Label>
                  <div className="flex gap-2 items-center">
                    <ColorPicker
                      selectedColor={announcementData.bannerBorderColor}
                      onColorChange={(color) => setAnnouncementData(prev => ({...prev, bannerBorderColor: color}))}
                    />
                    <Input
                      value={announcementData.bannerBorderColor}
                      onChange={(e) => setAnnouncementData(prev => ({...prev, bannerBorderColor: e.target.value}))}
                      className="flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label>Preview</Label>
              <div 
                className="p-3 rounded-md text-center font-medium"
                style={{
                  backgroundColor: announcementData.backgroundColor,
                  color: announcementData.textColor,
                  fontSize: announcementData.fontSize,
                  fontWeight: announcementData.fontWeight,
                  textDecoration: announcementData.textDecoration,
                  fontStyle: announcementData.fontStyle,
                  textShadow: `${announcementData.textBorderWidth || '0px'} 0 0 ${announcementData.textBorderColor || '#000000'}, 0 ${announcementData.textBorderWidth || '0px'} 0 ${announcementData.textBorderColor || '#000000'}, -${announcementData.textBorderWidth || '0px'} 0 0 ${announcementData.textBorderColor || '#000000'}, 0 -${announcementData.textBorderWidth || '0px'} 0 ${announcementData.textBorderColor || '#000000'}`,
                  border: `${announcementData.bannerBorderWidth || '0px'} ${announcementData.bannerBorderStyle || 'solid'} ${announcementData.bannerBorderColor || '#000000'}`
                }}
              >
                {announcementData.message || 'Your announcement will appear here...'}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={createAnnouncementMutation.isPending}
                className="bg-bright-blue hover:bg-navy"
              >
                {createAnnouncementMutation.isPending ? 'Saving...' : 'Save Announcement'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Product Management Card Component
function ProductManagementCard({ product, onUpdate, onDelete }: { product: any, onUpdate: () => void, onDelete: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [editData, setEditData] = useState(product);
  const { toast } = useToast();

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'pickntrust2025' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Product Deleted!',
        description: 'Product has been removed successfully.',
      });
      onDelete();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete product. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, password: 'pickntrust2025' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Product Updated!',
        description: 'Product has been updated successfully.',
      });
      setIsEditing(false);
      onUpdate();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update product. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const handleUpdate = () => {
    updateProductMutation.mutate(editData);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData(product); // Reset to original data
    }
    setIsEditing(!isEditing);
  };

  const handleShare = (platform: string) => {
    const productUrl = `${window.location.origin}`;
    const productText = `Check out this amazing deal: ${product.name} - ₹${product.price}${product.originalPrice ? ` (was ₹${product.originalPrice})` : ''} at PickNTrust!`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/profile.php?id=61578969445670`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/+m-O-S6SSpVU2NWU1`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(productText)}&url=${encodeURIComponent(productUrl)}`;
        break;
      case 'whatsapp':
        // Try to open channel admin interface for posting
        shareUrl = `https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C`;
        break;
      case 'youtube':
        // Open YouTube homepage or a specific channel (update as needed)
        shareUrl = `https://www.youtube.com/`;
        break;
      case 'instagram':
        // Updated Instagram sharing - opens Instagram with better integration
        const instagramText = `🛍️ Amazing Deal Alert! ${product.name} - Only ₹${product.price}${product.originalPrice ? ` (was ₹${product.originalPrice})` : ''}! 💰\n\n✨ Get the best deals at PickNTrust\n\n#PickNTrust #Deals #Shopping #BestPrice`;
        
        // Copy to clipboard for easy sharing
        navigator.clipboard.writeText(instagramText + '\n\n' + productUrl);
        
        // Try to open Instagram app or web
        const instagramUrl = 'https://www.instagram.com/';
        window.open(instagramUrl, '_blank');
        
        toast({
          title: 'Instagram Ready!',
          description: 'Content copied to clipboard and Instagram opened. Paste to create your post!',
        });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    setShowShareMenu(false);
  };

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h5 className="font-semibold text-navy dark:text-blue-400">{product.name}</h5>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{product.description}</p>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-600">₹{product.price}</span>
                {product.originalPrice && (
                  <span className="text-gray-500 line-through">₹{product.originalPrice}</span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{product.rating}</span>
                <span className="text-gray-500">({product.reviewCount})</span>
              </div>
              
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
              
              {product.isNew && (
                <Badge className="bg-green-100 text-green-800 text-xs">NEW</Badge>
              )}
              
              {product.isFeatured && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">FEATURED</Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            
            {showShareMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-700 border rounded-lg shadow-lg p-2 z-10">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    <Facebook className="w-4 h-4 text-blue-600" />
                    Facebook
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    <Twitter className="w-4 h-4 text-blue-400" />
                    Twitter
                  </button>
                  <button
                    onClick={() => handleShare('telegram')}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    Telegram
                  </button>
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                  >
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleShare('instagram')}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                  >
                    <Instagram className="w-4 h-4 text-purple-600" />
                    Instagram
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(product.affiliateUrl, '_blank')}
            className="p-2"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditToggle}
            className="p-2"
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleteProductMutation.isPending}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {isEditing && (
        <div className="mt-4 p-4 border-t bg-gray-50 dark:bg-gray-700/50 space-y-4">
          <h5 className="font-medium text-navy dark:text-blue-400">Edit Product</h5>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Price (₹)</Label>
              <Input
                id="edit-price"
                value={editData.price}
                onChange={(e) => setEditData({...editData, price: e.target.value})}
                placeholder="999"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-originalPrice">Original Price (₹)</Label>
              <Input
                id="edit-originalPrice"
                value={editData.originalPrice || ''}
                onChange={(e) => setEditData({...editData, originalPrice: e.target.value})}
                placeholder="1299"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={editData.category}
                onChange={(e) => setEditData({...editData, category: e.target.value})}
                placeholder="Electronics & Gadgets"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              value={editData.description}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
              placeholder="Product description"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-imageUrl">Image URL</Label>
            <Input
              id="edit-imageUrl"
              value={editData.imageUrl}
              onChange={(e) => setEditData({...editData, imageUrl: e.target.value})}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleUpdate} 
              disabled={updateProductMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {updateProductMutation.isPending ? 'Updating...' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleEditToggle}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Affiliate Network Manager Component
function AffiliateNetworkManager() {
  const { data: networks = [], isLoading } = useQuery({
    queryKey: ['/api/affiliate-networks']
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading networks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(networks as any[]).map((network: any) => (
          <div key={network.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-navy dark:text-blue-400">{network.name}</h4>
              <Badge variant={network.isActive ? "default" : "secondary"}>
                {network.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300">{network.description}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Commission Rate:</span>
                <span className="font-medium text-green-600">{network.commissionRate}%</span>
              </div>
              
              {network.trackingParams && (
                <div className="flex justify-between">
                  <span>Tracking:</span>
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">
                    {network.trackingParams}
                  </code>
                </div>
              )}
            </div>

            {network.joinUrl && (
              <a 
                href={network.joinUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-bright-blue hover:underline"
              >
                Join Network →
              </a>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">Network Integration Tips</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• Apply for networks with highest commission rates first</li>
          <li>• Use proper tracking parameters in all affiliate links</li>
          <li>• Test links regularly to ensure they work properly</li>
          <li>• Monitor performance and focus on best-converting networks</li>
          <li>• Diversify across multiple networks to maximize revenue</li>
        </ul>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [showNetworks, setShowNetworks] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [socialSettings, setSocialSettings] = useState({
    telegramChannelUrl: 'https://t.me/+m-O-S6SSpVU2NWU1',
    facebookPageUrl: 'https://www.facebook.com/profile.php?id=61578969445670',
    whatsappChannelUrl: 'https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C'
  });
  const [timerSettings, setTimerSettings] = useState({
    hasTimer: false,
    timerDuration: '24',
    timerType: 'hours'
  });

  const [blogFormData, setBlogFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [] as string[],
    imageUrl: '',
    videoUrl: '',
    publishedAt: new Date().toISOString().split('T')[0],
    readTime: '3 min read',
    slug: '',
    hasTimer: false,
    timerDuration: '24'
  });
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // File upload helper function
  const uploadFile = async (file: File, type: 'image' | 'video') => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      
      if (type === 'image') {
        setBlogFormData({...blogFormData, imageUrl: result.url});
      } else {
        setBlogFormData({...blogFormData, videoUrl: result.url});
      }
      
      toast({ 
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded!`, 
        description: `Your ${type} has been uploaded successfully.` 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: `Failed to upload ${type}.`, 
        variant: 'destructive' 
      });
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setUploadingImage(true);
        await uploadFile(file, 'image');
        setUploadingImage(false);
      } else if (file.type.startsWith('video/')) {
        setUploadingVideo(true);
        await uploadFile(file, 'video');
        setUploadingVideo(false);
      } else {
        toast({ 
          title: 'Invalid file type', 
          description: 'Please upload an image or video file.', 
          variant: 'destructive' 
        });
      }
    }
  };

  // Check if admin session exists on page load
  useEffect(() => {
    const adminSession = localStorage.getItem('pickntrust-admin-session');
    if (adminSession === 'active') {
      setIsAuthenticated(true);
    }
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products/featured']
  });

  const { data: affiliateNetworks = [] } = useQuery({
    queryKey: ['/api/affiliate-networks']
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories']
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['/api/blog']
  });

  // Get admin stats for accurate dashboard counts
  const { data: adminStats = { totalProducts: 0, featuredProducts: 0, blogPosts: 0, affiliateNetworks: 0 } } = useQuery({
    queryKey: ['/api/admin/stats']
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const productData = {
        ...data,
        price: data.price,
        originalPrice: data.originalPrice || undefined,
        rating: parseFloat(data.rating),
        reviewCount: parseInt(data.reviewCount),
        discount: data.discount ? parseInt(data.discount) : undefined,
        affiliateNetworkId: data.affiliateNetworkId ? parseInt(data.affiliateNetworkId) : undefined,
        gender: (data.gender && data.gender !== 'none') ? data.gender : undefined,
        hasTimer: data.hasTimer || false,
        timerDuration: data.hasTimer && data.timerDuration ? parseInt(data.timerDuration) : null,
        isNew: data.isNew || false,
        isFeatured: data.isFeatured || false,
        password: 'pickntrust2025', // Add admin password for authentication
      };
      
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Product Added!',
        description: 'New product has been added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      // Reset form to default values instead of clearing
      form.reset({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        imageUrl: '',
        affiliateUrl: '',
        category: 'Electronics & Gadgets',
        rating: '4.5',
        reviewCount: '100',
        discount: '',
        isNew: false,
        isFeatured: true,
      });
      setShowAddForm(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add product. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Blog management mutations
  const addBlogMutation = useMutation({
    mutationFn: async (blogData: any) => {
      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...blogData, password: 'pickntrust2025' }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add blog post');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Blog Post Added!', description: 'Your blog post has been published successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setBlogFormData({ title: '', excerpt: '', content: '', category: '', tags: [], imageUrl: '', videoUrl: '', publishedAt: new Date().toISOString().split('T')[0], readTime: '3 min read', slug: '', hasTimer: false, timerDuration: '24' });
      setShowBlogForm(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to add blog post. Please try again.', variant: 'destructive' });
    },
  });

  const deleteBlogMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'pickntrust2025' }),
      });
      if (!response.ok) throw new Error('Failed to delete blog post');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Blog Post Deleted!', description: 'Blog post has been removed successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete blog post. Please try again.', variant: 'destructive' });
    },
  });

  const updateBlogMutation = useMutation({
    mutationFn: async ({ id, ...blogData }: any) => {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...blogData, password: 'pickntrust2025' }),
      });
      if (!response.ok) throw new Error('Failed to update blog post');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Blog Post Updated!', description: 'Blog post has been updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setEditingBlog(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update blog post. Please try again.', variant: 'destructive' });
    },
  });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      imageUrl: '',
      affiliateUrl: '',
      category: 'Tech',
      rating: '4.5',
      reviewCount: '100',
      discount: '',
      isNew: false,
      isFeatured: true,
    },
  });

  const onSubmit = (data: ProductForm) => {
    addProductMutation.mutate(data);
  };

  const extractProductDetails = async () => {
    if (!productUrl.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a product URL to extract details.',
        variant: 'destructive',
      });
      return;
    }

    setIsExtracting(true);
    
    try {
      const extractResponse = await fetch('/api/products/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: productUrl }),
      });

      const extractResult = await extractResponse.json();

      if (extractResult.success && extractResult.data) {
        const data = extractResult.data;
        setExtractedProduct({
          ...data,
          affiliateUrl: productUrl,
        });
        setShowPreview(true);
        setIsEditingPreview(false);
        
        toast({
          title: 'Product Details Extracted!',
          description: 'Review the details below and click "Add Product" to confirm.',
        });
      } else {
        toast({
          title: 'Extraction Failed',
          description: extractResult.message || 'Could not extract product details from this URL.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to extract product details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const addExtractedProduct = async () => {
    if (!extractedProduct) return;

    // Validation
    if (!extractedProduct.name?.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a product name.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!extractedProduct.imageUrl?.trim()) {
      toast({
        title: 'Image Required',
        description: 'Please enter a valid image URL.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!extractedProduct.affiliateUrl?.trim()) {
      toast({
        title: 'Affiliate Link Required',
        description: 'Please enter a valid affiliate link.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const productData = {
        name: extractedProduct.name.trim(),
        description: extractedProduct.description?.trim() || `Professional-grade ${extractedProduct.name} with industry-leading features.`,
        price: extractedProduct.price,
        originalPrice: extractedProduct.originalPrice || undefined,
        rating: parseFloat(extractedProduct.rating) || 4.5,
        reviewCount: parseInt(extractedProduct.reviewCount) || 100,
        discount: extractedProduct.discount ? parseInt(extractedProduct.discount) : undefined,
        category: extractedProduct.category,
        gender: (extractedProduct.gender && extractedProduct.gender !== 'none') ? extractedProduct.gender : undefined,
        hasTimer: extractedProduct.hasTimer || false,
        timerDuration: extractedProduct.hasTimer && extractedProduct.timerDuration ? parseInt(extractedProduct.timerDuration) : null,
        imageUrl: extractedProduct.imageUrl.trim(),
        affiliateUrl: extractedProduct.affiliateUrl.trim(),
        affiliateNetworkId: extractedProduct.affiliateNetworkId ? parseInt(extractedProduct.affiliateNetworkId) : undefined,
        isNew: extractedProduct.isNew || false,
        isFeatured: extractedProduct.isFeatured !== false,
      };

      const addResponse = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...productData,
          password: 'pickntrust2025', // Add admin password for authentication
        }),
      });

      if (addResponse.ok) {
        toast({
          title: 'Product Added Successfully!',
          description: `"${extractedProduct.name}" has been added to your catalog.`,
        });
        
        // Refresh the products list and admin stats
        queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
        
        // Clear everything
        setProductUrl('');
        setExtractedProduct(null);
        setShowPreview(false);
      } else {
        throw new Error('Failed to add product');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add product. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setPassword('');
        localStorage.setItem('pickntrust-admin-session', 'active');
        toast({
          title: 'Access Granted',
          description: 'Welcome to PickNTrust Admin Panel. You now have admin controls across all pages.',
        });
        // Trigger storage event for other components
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'pickntrust-admin-session',
          newValue: 'active'
        }));
      } else {
        toast({
          title: 'Access Denied',
          description: 'Incorrect password. Please try again.',
          variant: 'destructive',
        });
        setPassword('');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: 'Unable to connect to server. Please try again.',
        variant: 'destructive',
      });
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // Remove admin session from all category pages
    localStorage.removeItem('pickntrust-admin-session');
    toast({
      title: 'Logged Out',
      description: 'Redirecting to homepage...',
    });
    // Redirect to homepage using window.location for better compatibility
    window.location.href = '/';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-navy dark:text-blue-400">PickNTrust Admin</CardTitle>
              <CardDescription>Enter password to access admin panel</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">Admin Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-bright-blue hover:bg-navy">
                  Access Admin Panel
                </Button>
              </form>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Only authorized users can access this panel
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-navy dark:text-blue-400 mb-2">
                PickNTrust Admin Panel
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your products and affiliate links daily
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Gamified Dashboard Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white transition-transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Products</p>
                    <p className="text-2xl font-bold">{adminStats.totalProducts}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white transition-transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm">Featured Products</p>
                    <p className="text-2xl font-bold">{adminStats.featuredProducts}</p>
                  </div>
                  <Star className="w-8 h-8 text-indigo-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white transition-transform hover:scale-105">
              <CardContent className="p-4">
