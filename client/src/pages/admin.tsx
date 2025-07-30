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
    createAnnouncementMutation.mutate(announcementData);
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
              backgroundColor: activeAnnouncement.backgroundColor,
              color: activeAnnouncement.textColor,
              fontSize: activeAnnouncement.fontSize,
              fontWeight: activeAnnouncement.fontWeight,
              textDecoration: activeAnnouncement.textDecoration || 'none',
              fontStyle: activeAnnouncement.fontStyle || 'normal'
            }}
          >
            {activeAnnouncement.message}
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAnnouncementData({
                  message: activeAnnouncement.message,
                  textColor: activeAnnouncement.textColor,
                  backgroundColor: activeAnnouncement.backgroundColor,
                  fontSize: activeAnnouncement.fontSize,
                  fontWeight: activeAnnouncement.fontWeight,
                  textDecoration: activeAnnouncement.textDecoration || 'none',
                  fontStyle: activeAnnouncement.fontStyle || 'normal',
                  animationSpeed: activeAnnouncement.animationSpeed,
                  textBorderWidth: activeAnnouncement.textBorderWidth || '0px',
                  textBorderStyle: activeAnnouncement.textBorderStyle || 'solid',
                  textBorderColor: activeAnnouncement.textBorderColor || '#000000',
                  bannerBorderWidth: activeAnnouncement.bannerBorderWidth || '0px',
                  bannerBorderStyle: activeAnnouncement.bannerBorderStyle || 'solid',
                  bannerBorderColor: activeAnnouncement.bannerBorderColor || '#000000',
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

            {/* Text Border Options */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Text Border Options</h4>
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
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Banner Border Options</h4>
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
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(productText)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(productText)}&url=${encodeURIComponent(productUrl)}`;
        break;
      case 'whatsapp':
        // Try to open channel admin interface for posting
        shareUrl = `https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C`;
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
      if (!response.ok) throw new Error('Failed to add blog post');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Blog Post Added!', description: 'Your blog post has been published successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setBlogFormData({ title: '', excerpt: '', content: '', category: '', tags: [], imageUrl: '', videoUrl: '', publishedAt: new Date().toISOString().split('T')[0], readTime: '3 min read', slug: '', hasTimer: false, timerDuration: '24' });
      setShowBlogForm(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add blog post. Please try again.', variant: 'destructive' });
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

  // Authentication complete - password management removed per user request

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
    // Redirect to homepage after logout
    setTimeout(() => {
      setLocation('/');
    }, 1000);
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Blog Posts</p>
                    <p className="text-2xl font-bold">{adminStats.blogPosts}</p>
                  </div>
                  <FileText className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white transition-transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Achievements</p>
                    <p className="text-2xl font-bold">{
                      (() => {
                        const dynamicAchievements = [];
                        if (Array.isArray(blogPosts)) {
                          if (blogPosts.length >= 1) dynamicAchievements.push('First Post');
                          if (blogPosts.length >= 5) dynamicAchievements.push('Content Creator');
                          if (blogPosts.length >= 10) dynamicAchievements.push('Blog Master');
                          if (blogPosts.some((p: any) => p.videoUrl)) dynamicAchievements.push('Video Pioneer');
                        }
                        if (Array.isArray(products) && products.length >= 10) dynamicAchievements.push('Product Master');
                        if (Array.isArray(products) && products.length >= 50) dynamicAchievements.push('Catalog King');
                        return dynamicAchievements.length;
                      })()
                    }</p>
                  </div>
                  <Trophy className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white transition-transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Networks</p>
                    <p className="text-2xl font-bold">{adminStats.affiliateNetworks}</p>
                  </div>
                  <Globe className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievement Badges */}
          {(() => {
            const dynamicAchievements = [];
            if (Array.isArray(blogPosts)) {
              if (blogPosts.length >= 1) dynamicAchievements.push('First Post');
              if (blogPosts.length >= 5) dynamicAchievements.push('Content Creator');
              if (blogPosts.length >= 10) dynamicAchievements.push('Blog Master');
              if (blogPosts.some((p: any) => p.videoUrl)) dynamicAchievements.push('Video Pioneer');
            }
            if (Array.isArray(products) && products.length >= 10) dynamicAchievements.push('Product Master');
            if (Array.isArray(products) && products.length >= 50) dynamicAchievements.push('Catalog King');
            
            return dynamicAchievements.length > 0 && (
              <div className="mb-8 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Your Achievements
                </h3>
                <div className="flex flex-wrap gap-2">
                  {dynamicAchievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full text-sm font-medium transition-transform hover:scale-105 animate-pulse">
                      <span className="text-yellow-600">🏆</span>
                      {achievement}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Admin Navigation Tabs with Animations */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg max-w-md">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-300 transform ${
                  activeTab === 'products'
                    ? 'bg-white dark:bg-gray-700 text-navy dark:text-white shadow-sm scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-white hover:scale-105'
                }`}
              >
                📦 Products
              </button>
              <button
                onClick={() => setActiveTab('blog')}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-300 transform ${
                  activeTab === 'blog'
                    ? 'bg-white dark:bg-gray-700 text-navy dark:text-white shadow-sm scale-105'
                    : 'text-gray-600 dark:text-gray-400 hover:text-navy dark:hover:text-white hover:scale-105'
                }`}
              >
                📝 Blog Posts
              </button>
            </div>
          </div>

          {/* Announcement Management Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-navy dark:text-blue-400">
                <Megaphone className="w-5 h-5" />
                Announcement Banner
              </CardTitle>
              <CardDescription>
                Manage the scrolling announcement banner shown on the homepage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnnouncementManager />
            </CardContent>
          </Card>

          {/* Conditional Content Based on Active Tab */}
          {activeTab === 'products' && (
            <>
              {/* Auto-Extract Section - Always Visible */}
              <Card className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-xl text-bright-blue">🚀 Auto-Extract Product Details</CardTitle>
              <CardDescription>
                Paste any product URL (Amazon, Flipkart, etc.) to automatically extract and add products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Paste product URL here: https://amazon.in/dp/B08N5WRWNW or https://flipkart.com/product..."
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="flex-1 text-sm"
                />
                <Button
                  type="button"
                  onClick={extractProductDetails}
                  disabled={isExtracting || !productUrl.trim()}
                  className="bg-bright-blue hover:bg-navy text-white px-6"
                >
                  {isExtracting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Extracting...
                    </>
                  ) : (
                    'Extract Details'
                  )}
                </Button>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Amazon Products
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Flipkart Products  
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Other Retailers
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Preview Section */}
          {showPreview && extractedProduct && (
            <Card className="mb-8 border-green-200 dark:border-green-800">
              <CardHeader className="bg-green-50 dark:bg-green-900/20">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-green-700 dark:text-green-400">
                      {isEditingPreview ? '✏️ Edit Product Details' : '📋 Product Preview'}
                    </CardTitle>
                    <CardDescription>
                      {isEditingPreview 
                        ? 'Edit the extracted details before adding to your catalog'
                        : 'Review the extracted details and confirm to add to your catalog'
                      }
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingPreview(!isEditingPreview)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {isEditingPreview ? 'Preview' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isEditingPreview ? (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-name">Product Name *</Label>
                        <Input
                          id="edit-name"
                          value={extractedProduct.name}
                          onChange={(e) => setExtractedProduct({...extractedProduct, name: e.target.value})}
                          placeholder="Enter product name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-category">Category *</Label>
                        <Select 
                          value={extractedProduct.category}
                          onValueChange={(value) => setExtractedProduct({...extractedProduct, category: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(categories as any[]).map((category: any) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name} - {category.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Gender field for extracted products */}
                    <div>
                      <Label htmlFor="edit-gender">Gender Category (Optional)</Label>
                      <Select 
                        value={extractedProduct.gender || ''}
                        onValueChange={(value) => setExtractedProduct({...extractedProduct, gender: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender category (leave empty if not applicable)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not Applicable</SelectItem>
                          <SelectItem value="Men">
                            <div className="flex items-center">
                              <i className="fas fa-male mr-2 text-blue-500"></i>
                              Men
                            </div>
                          </SelectItem>
                          <SelectItem value="Women">
                            <div className="flex items-center">
                              <i className="fas fa-female mr-2 text-pink-500"></i>
                              Women
                            </div>
                          </SelectItem>
                          <SelectItem value="Kids">
                            <div className="flex items-center">
                              <i className="fas fa-child mr-2 text-green-500"></i>
                              Kids
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500 mt-1">
                        Use for categories like Footwear & Accessories, Jewelry & Watches, Beauty & Grooming
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="edit-description">Description *</Label>
                      <Textarea
                        id="edit-description"
                        value={extractedProduct.description}
                        onChange={(e) => setExtractedProduct({...extractedProduct, description: e.target.value})}
                        placeholder="Enter product description"
                        rows={3}
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="edit-price">Current Price (₹) *</Label>
                        <Input
                          id="edit-price"
                          value={extractedProduct.price}
                          onChange={(e) => setExtractedProduct({...extractedProduct, price: e.target.value})}
                          placeholder="9999.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-originalPrice">Original Price (₹)</Label>
                        <Input
                          id="edit-originalPrice"
                          value={extractedProduct.originalPrice || ''}
                          onChange={(e) => setExtractedProduct({...extractedProduct, originalPrice: e.target.value})}
                          placeholder="14999.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-discount">Discount %</Label>
                        <Input
                          id="edit-discount"
                          value={extractedProduct.discount || ''}
                          onChange={(e) => setExtractedProduct({...extractedProduct, discount: e.target.value})}
                          placeholder="33"
                          type="number"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-rating">Rating (1-5) *</Label>
                        <Input
                          id="edit-rating"
                          value={extractedProduct.rating}
                          onChange={(e) => setExtractedProduct({...extractedProduct, rating: e.target.value})}
                          placeholder="4.5"
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-reviewCount">Review Count *</Label>
                        <Input
                          id="edit-reviewCount"
                          value={extractedProduct.reviewCount}
                          onChange={(e) => setExtractedProduct({...extractedProduct, reviewCount: e.target.value})}
                          placeholder="1234"
                          type="number"
                        />
                      </div>
                    </div>

                    {/* Timer Controls for Extracted Products */}
                    <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">⏰ Deal Timer Settings</h4>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={extractedProduct.hasTimer || false}
                              onChange={(e) => setExtractedProduct({...extractedProduct, hasTimer: e.target.checked})}
                              className="rounded"
                            />
                            <span className="text-sm font-medium">Enable Timer</span>
                          </label>
                        </div>
                        
                        <div>
                          <Label htmlFor="edit-timer-duration">Timer Duration (Hours)</Label>
                          <Select 
                            value={extractedProduct.timerDuration || ''}
                            onValueChange={(value) => setExtractedProduct({...extractedProduct, timerDuration: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select timer duration" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Hour - Flash Deal</SelectItem>
                              <SelectItem value="2">2 Hours - Quick Sale</SelectItem>
                              <SelectItem value="4">4 Hours - Morning Deal</SelectItem>
                              <SelectItem value="6">6 Hours - Half Day</SelectItem>
                              <SelectItem value="12">12 Hours - Full Day</SelectItem>
                              <SelectItem value="24">24 Hours - Daily Special</SelectItem>
                              <SelectItem value="48">48 Hours - Weekend Deal</SelectItem>
                              <SelectItem value="72">72 Hours - 3-Day Sale</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                            🔥 When timer is ON: Product shows "Deal ends in X hours" and auto-deletes when time expires<br/>
                            ⏸️ When timer is OFF: Product stays until you manually delete it
                          </p>
                        </div>
                      </div>
                    </Card>

                    <div>
                      <Label htmlFor="edit-imageUrl">Product Image URL *</Label>
                      <Input
                        id="edit-imageUrl"
                        value={extractedProduct.imageUrl}
                        onChange={(e) => setExtractedProduct({...extractedProduct, imageUrl: e.target.value})}
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Update with high-quality image URL if the extracted image is incorrect
                      </p>
                      {/* Image Preview */}
                      {extractedProduct.imageUrl && (
                        <div className="mt-3">
                          <img 
                            src={extractedProduct.imageUrl} 
                            alt={extractedProduct.name}
                            className="w-32 h-32 object-cover rounded-lg border"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="edit-affiliateUrl">Affiliate Link *</Label>
                      <Input
                        id="edit-affiliateUrl"
                        value={extractedProduct.affiliateUrl}
                        onChange={(e) => setExtractedProduct({...extractedProduct, affiliateUrl: e.target.value})}
                        placeholder="https://amzn.to/XXXXXXX"
                      />
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={extractedProduct.isNew || false}
                          onChange={(e) => setExtractedProduct({...extractedProduct, isNew: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Mark as NEW</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={extractedProduct.isFeatured !== false}
                          onChange={(e) => setExtractedProduct({...extractedProduct, isFeatured: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Featured Product</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-navy dark:text-blue-400">Product Name</h4>
                        <p className="text-sm">{extractedProduct.name}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-navy dark:text-blue-400">Description</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{extractedProduct.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-navy dark:text-blue-400">Price</h4>
                          <p className="text-lg font-bold text-green-600">₹{extractedProduct.price}</p>
                        </div>
                        {extractedProduct.originalPrice && (
                          <div>
                            <h4 className="font-semibold text-navy dark:text-blue-400">Original Price</h4>
                            <p className="text-sm line-through text-gray-500">₹{extractedProduct.originalPrice}</p>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-navy dark:text-blue-400">Rating</h4>
                          <p className="text-sm">{extractedProduct.rating}/5 ⭐</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-navy dark:text-blue-400">Reviews</h4>
                          <p className="text-sm">{extractedProduct.reviewCount} reviews</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-navy dark:text-blue-400">Product Image</h4>
                        <img 
                          src={extractedProduct.imageUrl} 
                          alt={extractedProduct.name}
                          className="w-full h-48 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400';
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-navy dark:text-blue-400">Category</h4>
                        <p className="text-sm">{extractedProduct.category}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button
                    onClick={addExtractedProduct}
                    className="bg-accent-green hover:bg-green-600 text-white"
                  >
                    ✓ Add Product to Catalog
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPreview(false);
                      setExtractedProduct(null);
                      setIsEditingPreview(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Add Product Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-navy dark:text-blue-400">Manual Product Management</CardTitle>
              <CardDescription>
                Add products manually or edit auto-extracted details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-bright-blue hover:bg-navy text-white mb-4"
              >
                {showAddForm ? 'Cancel Manual Entry' : 'Add Product Manually'}
              </Button>

              {showAddForm && (
                <div className="space-y-6">

                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        {...form.register('name')}
                        placeholder="Premium Wireless Smartphone"
                      />
                      {form.formState.errors.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        onValueChange={(value) => form.setValue('category', value as any)}
                        defaultValue="Tech"
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(categories as any[]).map((category: any) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name} - {category.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Gender field - Optional for gender-specific categories */}
                  <div>
                    <Label htmlFor="gender">Gender Category (Optional)</Label>
                    <Select 
                      onValueChange={(value) => form.setValue('gender', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender category (leave empty if not applicable)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Applicable</SelectItem>
                        <SelectItem value="Men">
                          <div className="flex items-center">
                            <i className="fas fa-male mr-2 text-blue-500"></i>
                            Men
                          </div>
                        </SelectItem>
                        <SelectItem value="Women">
                          <div className="flex items-center">
                            <i className="fas fa-female mr-2 text-pink-500"></i>
                            Women
                          </div>
                        </SelectItem>
                        <SelectItem value="Kids">
                          <div className="flex items-center">
                            <i className="fas fa-child mr-2 text-green-500"></i>
                            Kids
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      Use for categories like Footwear & Accessories, Jewelry & Watches, Beauty & Grooming
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      {...form.register('description')}
                      placeholder="High-quality product with amazing features..."
                      rows={3}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price">Current Price (₹) *</Label>
                      <Input
                        id="price"
                        {...form.register('price')}
                        placeholder="₹9,999.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="originalPrice">Original Price (₹)</Label>
                      <Input
                        id="originalPrice"
                        {...form.register('originalPrice')}
                        placeholder="₹14,999.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="discount">Discount %</Label>
                      <Input
                        id="discount"
                        {...form.register('discount')}
                        placeholder="33"
                        type="number"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rating">Rating (1-5) *</Label>
                      <Input
                        id="rating"
                        {...form.register('rating')}
                        placeholder="4.5"
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="reviewCount">Review Count *</Label>
                      <Input
                        id="reviewCount"
                        {...form.register('reviewCount')}
                        placeholder="1234"
                        type="number"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="imageUrl">Product Image URL *</Label>
                    <Input
                      id="imageUrl"
                      {...form.register('imageUrl')}
                      placeholder="https://images.unsplash.com/photo-..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Use high-quality images from Unsplash or official product websites
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="affiliateUrl">Affiliate Link *</Label>
                      <Input
                        id="affiliateUrl"
                        {...form.register('affiliateUrl')}
                        placeholder="https://amzn.to/XXXXXXX"
                      />
                    </div>

                    <div>
                      <Label htmlFor="affiliateNetworkId">Affiliate Network</Label>
                      <Select 
                        onValueChange={(value) => form.setValue('affiliateNetworkId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select network" />
                        </SelectTrigger>
                        <SelectContent>
                          {(affiliateNetworks as any[]).map((network: any) => (
                            <SelectItem key={network.id} value={network.id.toString()}>
                              {network.name} ({network.commissionRate}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Select the affiliate network and enter your tracking link
                  </p>

                  {/* Timer Controls Section */}
                  <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">⏰ Deal Timer Settings</h4>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            {...form.register('hasTimer')}
                            className="rounded"
                          />
                          <span className="text-sm font-medium">Enable Timer</span>
                        </label>
                      </div>
                      
                      <div>
                        <Label htmlFor="timerDuration">Timer Duration (Hours)</Label>
                        <Select 
                          onValueChange={(value) => form.setValue('timerDuration', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timer duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Hour - Flash Deal</SelectItem>
                            <SelectItem value="2">2 Hours - Quick Sale</SelectItem>
                            <SelectItem value="4">4 Hours - Morning Deal</SelectItem>
                            <SelectItem value="6">6 Hours - Half Day</SelectItem>
                            <SelectItem value="12">12 Hours - Full Day</SelectItem>
                            <SelectItem value="24">24 Hours - Daily Special</SelectItem>
                            <SelectItem value="48">48 Hours - Weekend Deal</SelectItem>
                            <SelectItem value="72">72 Hours - 3-Day Sale</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                          🔥 When timer is ON: Product shows "Deal ends in X hours" and auto-deletes when time expires<br/>
                          ⏸️ When timer is OFF: Product stays until you manually delete it
                        </p>
                      </div>
                    </div>
                  </Card>

                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...form.register('isNew')}
                        className="rounded"
                      />
                      <span className="text-sm">Mark as NEW</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...form.register('isFeatured')}
                        className="rounded"
                        defaultChecked
                      />
                      <span className="text-sm">Featured Product</span>
                    </label>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={addProductMutation.isPending}
                    className="bg-accent-green hover:bg-green-600 text-white"
                  >
                    {addProductMutation.isPending ? 'Adding Product...' : 'Add Product'}
                  </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Management Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-navy dark:text-blue-400">Product Management</CardTitle>
              <CardDescription>Manage all your products with full control</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Product List */}
                <div>
                  <h4 className="font-semibold text-navy dark:text-blue-400 mb-4">Current Products ({Array.isArray(products) ? products.length : 0})</h4>
                  <div className="grid gap-4">
                    {(products as any[]).map((product: any) => (
                      <ProductManagementCard 
                        key={product.id} 
                        product={product} 
                        onUpdate={() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
                          queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
                        }}
                        onDelete={() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
                          queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Optimization */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-navy dark:text-blue-400">Revenue Optimization</CardTitle>
                <CardDescription>Track performance and optimize earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">Performance Tracking</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>Monitor which products get the most clicks</li>
                      <li>Track conversion rates by category</li>
                      <li>Identify seasonal trending products</li>
                      <li>Analyze mobile vs desktop performance</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">A/B Testing Ideas</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>Test different product descriptions</li>
                      <li>Compare image styles (lifestyle vs product)</li>
                      <li>Try different "Pick Now" button colors</li>
                      <li>Test product positioning on homepage</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">Click-Through Rate Tips</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>Use urgency words: "Limited time", "Flash sale"</li>
                      <li>Highlight discounts prominently</li>
                      <li>Add social proof with review counts</li>
                      <li>Update bestsellers weekly</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-navy dark:text-blue-400">Seasonal Content Calendar</CardTitle>
                <CardDescription>Plan content for maximum revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">January - March</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>New Year fitness products</li>
                      <li>Valentine's Day gifts (Beauty, Fashion)</li>
                      <li>Holi festival deals</li>
                      <li>Summer prep products</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">April - June</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>Summer cooling products</li>
                      <li>Father's Day tech deals</li>
                      <li>Student tech for exams</li>
                      <li>Monsoon prep items</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">October - December</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>Diwali festival shopping</li>
                      <li>Winter clothing collection</li>
                      <li>Year-end tech deals</li>
                      <li>Christmas gifts and decor</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Affiliate Networks Management */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-navy dark:text-blue-400">Affiliate Networks</CardTitle>
              <CardDescription>Manage your affiliate partnerships and commission rates</CardDescription>
            </CardHeader>
            <CardContent>
              <AffiliateNetworkManager />
            </CardContent>
          </Card>

          {/* Quick Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-navy dark:text-blue-400">Daily Management Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-navy dark:text-blue-400">Morning Routine (10 min)</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5">
                    <li>Check affiliate partner sites for new deals</li>
                    <li>Update 2-3 products with current prices</li>
                    <li>Add 1 new product to "Deals" category</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-navy dark:text-blue-400">Best Practices</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5">
                    <li>Always test affiliate links before adding</li>
                    <li>Use high-quality product images</li>
                    <li>Update seasonal content regularly</li>
                    <li>Monitor click-through rates</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-navy dark:text-blue-400">Content Sources</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5">
                    <li>Amazon Best Sellers & Daily Deals</li>
                    <li>Flipkart Super Deals & Flash Sales</li>
                    <li>Brand websites with affiliate programs</li>
                    <li>Social media trending products</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          </>
          )}

          {/* Blog Management Tab */}
          {activeTab === 'blog' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-navy dark:text-blue-400">Blog Management</h2>
                <Button 
                  onClick={() => setShowBlogForm(true)}
                  className="bg-bright-blue hover:bg-navy"
                >
                  Add New Blog Post
                </Button>
              </div>

              {/* Blog Post Form */}
              {showBlogForm && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-xl text-bright-blue">✍️ Create New Blog Post</CardTitle>
                    <CardDescription>Add engaging content with video support to drive affiliate sales</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="blog-title">Blog Title *</Label>
                      <Input
                        id="blog-title"
                        value={blogFormData.title}
                        onChange={(e) => setBlogFormData({...blogFormData, title: e.target.value})}
                        placeholder="10 Best Budget Smartphones Under ₹20,000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="blog-excerpt">Excerpt (4-5 lines for homepage) *</Label>
                      <Textarea
                        id="blog-excerpt"
                        value={blogFormData.excerpt}
                        onChange={(e) => setBlogFormData({...blogFormData, excerpt: e.target.value})}
                        placeholder="Short description that appears on the homepage. You can include affiliate links here: [Product Name](https://amzn.to/link)"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Add affiliate links in excerpt using [text](url) format - they'll work on homepage and full post
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="blog-content">Full Content *</Label>
                      <Textarea
                        id="blog-content"
                        value={blogFormData.content || ''}
                        onChange={(e) => setBlogFormData({...blogFormData, content: e.target.value})}
                        placeholder="Full blog post content with unlimited affiliate links. Use Markdown formatting:

# Main Heading
## Sub Heading
### Small Heading

**Bold text**
*Italic text*

1. Numbered list item
2. Another item

[Affiliate Product Link](https://amzn.to/product-link)
![Image Description](https://image-url.com/image.jpg)

Add as many affiliate links as needed!"
                        rows={12}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        📝 Supports Markdown formatting. Add unlimited affiliate links using [text](url) format
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="blog-category">Category *</Label>
                        <Select
                          value={blogFormData.category || ''}
                          onValueChange={(value) => setBlogFormData({...blogFormData, category: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Shopping Tips">🛍️ Shopping Tips</SelectItem>
                            <SelectItem value="Product Reviews">⭐ Product Reviews</SelectItem>
                            <SelectItem value="Budget Shopping">💰 Budget Shopping</SelectItem>
                            <SelectItem value="Deals & Offers">🔥 Deals & Offers</SelectItem>
                            <SelectItem value="Tech News">📱 Tech News</SelectItem>
                            <SelectItem value="Fashion">👗 Fashion</SelectItem>
                            <SelectItem value="Beauty & Health">💄 Beauty & Health</SelectItem>
                            <SelectItem value="Home & Living">🏠 Home & Living</SelectItem>
                            <SelectItem value="Lifestyle">✨ Lifestyle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="blog-tags">Tags (comma separated)</Label>
                        <Input
                          id="blog-tags"
                          value={blogFormData.tags?.join(', ') || ''}
                          onChange={(e) => setBlogFormData({
                            ...blogFormData, 
                            tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                          })}
                          placeholder="deals, budget, tech, gadgets, amazon"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Auto-suggested: budget, premium, mobile, computing, fashion, beauty, deals
                        </p>
                      </div>
                    </div>

                    {/* Drag and Drop Zone */}
                    <div 
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragActive 
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <div className="space-y-2">
                        <div className="text-3xl">📁</div>
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                          Drag & Drop Your Files Here
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Images and videos up to 50MB each
                        </p>
                        <div className="flex justify-center gap-2 text-xs text-gray-400">
                          <span>📷 JPG, PNG, GIF</span>
                          <span>•</span>
                          <span>🎥 MP4, WEBM, MOV</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="blog-image">Blog Image</Label>
                        <div className="space-y-2">
                          <Input
                            id="blog-image"
                            value={blogFormData.imageUrl}
                            onChange={(e) => setBlogFormData({...blogFormData, imageUrl: e.target.value})}
                            placeholder="https://images.unsplash.com/photo-... or use drag-drop above"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">OR</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setUploadingImage(true);
                                  await uploadFile(file, 'image');
                                  setUploadingImage(false);
                                }
                              }}
                              className="text-xs"
                              disabled={uploadingImage}
                            />
                            {uploadingImage && <span className="text-xs text-blue-600">Uploading...</span>}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">URL, file picker, or drag-drop</p>
                      </div>
                      <div>
                        <Label htmlFor="blog-video">Video/Reel Content</Label>
                        <div className="space-y-2">
                          <Input
                            id="blog-video"
                            value={blogFormData.videoUrl}
                            onChange={(e) => setBlogFormData({...blogFormData, videoUrl: e.target.value})}
                            placeholder="YouTube, Instagram Reel, Facebook Reel, or upload below"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">OR</span>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setUploadingVideo(true);
                                  await uploadFile(file, 'video');
                                  setUploadingVideo(false);
                                }
                              }}
                              className="text-xs"
                              disabled={uploadingVideo}
                            />
                            {uploadingVideo && <span className="text-xs text-blue-600">Uploading...</span>}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Social media URLs, drag-drop, or file picker (up to 50MB)
                        </p>
                        <div className="text-xs text-blue-600 mt-1 space-y-1">
                          <div>📱 Instagram: https://www.instagram.com/reel/ABC123/</div>
                          <div>📘 Facebook: https://www.facebook.com/reel/123456789</div>
                          <div>🎥 YouTube: https://youtube.com/watch?v=ABC123</div>
                        </div>
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                          <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                            📁 Upload your own content or share social media links - perfect for personal blogging!
                          </p>
                        </div>
                        
                        {/* Preview uploaded content */}
                        {blogFormData.imageUrl && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Image Preview:</p>
                            <img 
                              src={blogFormData.imageUrl.startsWith('/uploads/') ? `${window.location.origin}${blogFormData.imageUrl}` : blogFormData.imageUrl}
                              alt="Preview" 
                              className="w-20 h-20 object-cover rounded border"
                            />
                          </div>
                        )}
                        
                        {blogFormData.videoUrl && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Video Preview:</p>
                            {/* YouTube Videos */}
                            {(blogFormData.videoUrl.includes('youtube.com') || blogFormData.videoUrl.includes('youtu.be')) ? (
                              <div className="w-full h-32 border rounded">
                                <iframe
                                  src={blogFormData.videoUrl
                                    .replace('watch?v=', 'embed/')
                                    .replace('youtu.be/', 'youtube.com/embed/')
                                    .split('&')[0]} // Remove extra parameters
                                  className="w-full h-full rounded"
                                  frameBorder="0"
                                  allowFullScreen
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  title="YouTube video preview"
                                />
                              </div>
                            ) : 
                            /* Personal Uploaded Videos */
                            blogFormData.videoUrl.startsWith('/uploads/') ? (
                              <video 
                                src={`${window.location.origin}${blogFormData.videoUrl}`}
                                className="w-full h-32 object-cover rounded border"
                                controls
                                preload="metadata"
                                onError={(e) => {
                                  console.error('Video load error:', e);
                                }}
                              >
                                <source src={`${window.location.origin}${blogFormData.videoUrl}`} type="video/mp4" />
                                <source src={`${window.location.origin}${blogFormData.videoUrl}`} type="video/webm" />
                                Your browser does not support the video tag.
                              </video>
                            ) : 
                            /* Instagram Reels */
                            blogFormData.videoUrl.includes('instagram.com') ? (
                              <div className="w-full h-32 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white rounded border flex items-center justify-center">
                                <div className="text-center">
                                  <Instagram className="w-8 h-8 mx-auto mb-1" />
                                  <p className="text-sm font-medium">Instagram Reel</p>
                                  <button 
                                    onClick={() => window.open(blogFormData.videoUrl, '_blank')}
                                    className="mt-1 px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30 transition-colors"
                                  >
                                    Open Link
                                  </button>
                                </div>
                              </div>
                            ) : 
                            /* Facebook Reels */
                            blogFormData.videoUrl.includes('facebook.com') ? (
                              <div className="w-full h-32 bg-blue-600 text-white rounded border flex items-center justify-center">
                                <div className="text-center">
                                  <Facebook className="w-8 h-8 mx-auto mb-1" />
                                  <p className="text-sm font-medium">Facebook Reel</p>
                                  <button 
                                    onClick={() => window.open(blogFormData.videoUrl, '_blank')}
                                    className="mt-1 px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30 transition-colors"
                                  >
                                    Open Link
                                  </button>
                                </div>
                              </div>
                            ) : 
                            /* Generic Video URLs */
                            blogFormData.videoUrl.match(/\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i) ? (
                              <video 
                                src={blogFormData.videoUrl}
                                className="w-full h-32 object-cover rounded border"
                                controls
                                preload="metadata"
                                onError={(e) => {
                                  console.error('Video load error:', e);
                                }}
                              >
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              /* Fallback for unknown URLs */
                              <div className="w-full h-32 bg-gray-600 text-white rounded border flex items-center justify-center">
                                <div className="text-center">
                                  <Play className="w-8 h-8 mx-auto mb-1" />
                                  <p className="text-sm font-medium">Video Content</p>
                                  <p className="text-xs opacity-75">Preview not available</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Video URL validation feedback */}
                            <div className="mt-1 text-xs">
                              {blogFormData.videoUrl.includes('youtube.com') || blogFormData.videoUrl.includes('youtu.be') ? (
                                <span className="text-green-600 dark:text-green-400">✓ YouTube video embedded</span>
                              ) : blogFormData.videoUrl.includes('instagram.com') ? (
                                <span className="text-purple-600 dark:text-purple-400">✓ Instagram content linked</span>
                              ) : blogFormData.videoUrl.includes('facebook.com') ? (
                                <span className="text-blue-600 dark:text-blue-400">✓ Facebook content linked</span>
                              ) : blogFormData.videoUrl.startsWith('/uploads/') ? (
                                <span className="text-green-600 dark:text-green-400">✓ Personal video uploaded</span>
                              ) : (
                                <span className="text-orange-600 dark:text-orange-400">⚠ URL format may not be supported</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="blog-date">Publish Date</Label>
                        <Input
                          id="blog-date"
                          type="date"
                          value={blogFormData.publishedAt}
                          onChange={(e) => setBlogFormData({...blogFormData, publishedAt: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="blog-readtime">Read Time</Label>
                        <Input
                          id="blog-readtime"
                          value={blogFormData.readTime}
                          onChange={(e) => setBlogFormData({...blogFormData, readTime: e.target.value})}
                          placeholder="3 min read"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="blog-slug">URL Slug (Auto-generated)</Label>
                      <Input
                        id="blog-slug"
                        value={blogFormData.slug || blogFormData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                        onChange={(e) => setBlogFormData({...blogFormData, slug: e.target.value})}
                        placeholder="url-friendly-title"
                      />
                    </div>

                    {/* Timer Controls */}
                    <div className="border rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-600">
                      <div className="flex items-center gap-2 mb-3">
                        <i className="fas fa-clock text-orange-600 w-4 h-4" />
                        <Label className="text-orange-800 dark:text-orange-300 font-semibold">Auto-Delete Timer</Label>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="blog-timer"
                            checked={blogFormData.hasTimer}
                            onChange={(e) => setBlogFormData({
                              ...blogFormData, 
                              hasTimer: e.target.checked,
                              timerDuration: e.target.checked ? blogFormData.timerDuration : '24'
                            })}
                            className="rounded"
                          />
                          <Label htmlFor="blog-timer" className="text-sm">
                            Enable auto-delete timer (blog post will be automatically removed after expiry)
                          </Label>
                        </div>
                        
                        {blogFormData.hasTimer && (
                          <div>
                            <Label htmlFor="blog-timer-duration" className="text-sm">Timer Duration</Label>
                            <Select
                              value={blogFormData.timerDuration}
                              onValueChange={(value) => setBlogFormData({...blogFormData, timerDuration: value})}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 hour</SelectItem>
                                <SelectItem value="3">3 hours</SelectItem>
                                <SelectItem value="6">6 hours</SelectItem>
                                <SelectItem value="12">12 hours</SelectItem>
                                <SelectItem value="18">18 hours</SelectItem>
                                <SelectItem value="24">24 hours</SelectItem>
                                <SelectItem value="48">48 hours</SelectItem>
                                <SelectItem value="72">72 hours</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              Post will show countdown timer and automatically delete after {blogFormData.timerDuration} hour{blogFormData.timerDuration !== '1' ? 's' : ''}
                            </p>
                          </div>
                        )}
                        
                        <div className="text-xs text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-800/30 p-2 rounded">
                          <strong>Timer OFF:</strong> Blog post stays until you manually delete it<br/>
                          <strong>Timer ON:</strong> Blog post shows countdown and auto-deletes after expiry
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPreviewModal(true)}
                        className="flex items-center gap-2"
                        disabled={!blogFormData.title || !blogFormData.excerpt}
                      >
                        <Eye className="w-4 h-4" />
                        Live Preview
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowBlogForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => {
                            // Smart content categorization and auto-tags
                            const getAutoCategory = (content: string) => {
                              const lower = content.toLowerCase();
                              if (lower.includes('budget') || lower.includes('cheap') || lower.includes('affordable')) return 'Budget Shopping';
                              if (lower.includes('review') || lower.includes('vs') || lower.includes('comparison')) return 'Product Reviews';
                              if (lower.includes('tip') || lower.includes('guide') || lower.includes('how to')) return 'Shopping Tips';
                              if (lower.includes('deal') || lower.includes('offer') || lower.includes('discount')) return 'Deals & Offers';
                              if (lower.includes('tech') || lower.includes('gadget') || lower.includes('electronic')) return 'Tech News';
                              return 'Shopping Tips';
                            };

                            const generateTags = (content: string) => {
                              const lower = content.toLowerCase();
                              const tags = [];
                              
                              if (lower.includes('budget')) tags.push('budget');
                              if (lower.includes('premium')) tags.push('premium');
                              if (lower.includes('smartphone') || lower.includes('phone')) tags.push('mobile');
                              if (lower.includes('laptop') || lower.includes('computer')) tags.push('computing');
                              if (lower.includes('fashion') || lower.includes('clothing')) tags.push('fashion');
                              if (lower.includes('beauty') || lower.includes('skincare')) tags.push('beauty');
                              if (lower.includes('amazon') || lower.includes('flipkart')) tags.push('ecommerce');
                              if (lower.includes('deal') || lower.includes('offer')) tags.push('deals');
                              
                              return tags.slice(0, 3);
                            };

                            addBlogMutation.mutate({
                              ...blogFormData,
                              category: getAutoCategory(blogFormData.title + ' ' + blogFormData.excerpt),
                              tags: generateTags(blogFormData.title + ' ' + blogFormData.excerpt)
                            });
                          }}
                          disabled={!blogFormData.title || !blogFormData.excerpt || !blogFormData.content || !blogFormData.category || addBlogMutation.isPending}
                          className="bg-accent-green hover:bg-green-600"
                        >
                          {addBlogMutation.isPending ? 'Publishing...' : 'Publish Blog Post'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Blog Content Ideas */}
              <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="text-xl text-purple-600 dark:text-purple-400">💡 Blog Content Ideas</CardTitle>
                  <CardDescription>Proven topics with video/reel support that drive affiliate sales</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div>
                      <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">Shopping Tips & Guides</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <li>• "10 Best Black Friday Deals Worth Waiting For"</li>
                        <li>• "How to Spot Fake Reviews on Amazon"</li>
                        <li>• "Secret Cashback Apps You Should Be Using"</li>
                        <li>• "Budget vs Premium: When to Splurge"</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">Product Reviews</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <li>• "iPhone 15 vs iPhone 14: Which Should You Buy?"</li>
                        <li>• "Best Budget Laptops Under ₹50,000"</li>
                        <li>• "Top 5 Air Purifiers for Indian Homes"</li>
                        <li>• "Wireless Earbuds: Premium vs Budget"</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">📱 Social Media Integration</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <li>• Share Instagram product reels</li>
                        <li>• Embed Facebook shopping videos</li>
                        <li>• YouTube unboxing & reviews</li>
                        <li>• Mix text + video for engagement</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">📁 Personal Content</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <li>• Upload your own product photos</li>
                        <li>• Record personal review videos</li>
                        <li>• Share behind-the-scenes content</li>
                        <li>• Create authentic user experiences</li>
                      </ul>
                      <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">
                          📁 New: Upload images & videos up to 50MB each for personal touch!
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Blog Posts List */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-navy dark:text-blue-400">Current Blog Posts ({Array.isArray(blogPosts) ? blogPosts.length : 0})</h3>
                
                {!Array.isArray(blogPosts) || blogPosts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No blog posts yet. Create your first one!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {Array.isArray(blogPosts) && blogPosts.map((post: any) => (
                      <Card key={post.id} className="p-4">
                        <div className="flex gap-4">
                          <img 
                            src={post.imageUrl} 
                            alt={post.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-navy dark:text-blue-400">{post.title}</h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{post.excerpt}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                              <span>{post.readTime}</span>
                              {post.videoUrl && (
                                <span className="flex items-center gap-1">
                                  <span>
                                    {post.videoUrl.includes('instagram.com') ? '📱' : 
                                     post.videoUrl.includes('facebook.com') ? '📘' : 
                                     post.videoUrl.includes('youtube.com') ? '🎥' : '📹'}
                                  </span> 
                                  {post.videoUrl.includes('instagram.com') ? 'Instagram Reel' : 
                                   post.videoUrl.includes('facebook.com') ? 'Facebook Reel' : 
                                   post.videoUrl.includes('youtube.com') ? 'YouTube Video' : 'Video'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {/* Social Sharing Buttons */}
                            <div className="flex gap-1 mb-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const url = `${window.location.origin}/blog/${post.slug}`;
                                  const text = `${post.title} - ${post.excerpt}`;
                                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                title="Share on Facebook"
                              >
                                <Facebook className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm" 
                                onClick={() => {
                                  const url = `${window.location.origin}/blog/${post.slug}`;
                                  const text = `${post.title} - ${post.excerpt}`;
                                  window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
                                }}
                                className="p-1.5 text-black hover:bg-gray-50 dark:hover:bg-gray-800"
                                title="Share on X (Twitter)"
                              >
                                <div className="w-3 h-3 bg-black rounded-sm flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">𝕏</span>
                                </div>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  window.open(`https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C`, '_blank', 'width=1200,height=800');
                                }}
                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                title="Share on WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Instagram doesn't have direct sharing API, so copy link to clipboard
                                  const url = `${window.location.origin}/blog/${post.slug}`;
                                  navigator.clipboard.writeText(url);
                                  toast({
                                    title: "Link Copied!",
                                    description: "Paste this link in your Instagram story or bio.",
                                  });
                                }}
                                className="p-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white hover:scale-110 transition-all"
                                title="Copy link for Instagram"
                              >
                                <Instagram className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingBlog(post);
                                  setBlogFormData({
                                    title: post.title,
                                    excerpt: post.excerpt,
                                    content: post.content || '',
                                    category: post.category || '',
                                    tags: post.tags || [],
                                    imageUrl: post.imageUrl,
                                    videoUrl: post.videoUrl || '',
                                    publishedAt: new Date(post.publishedAt).toISOString().split('T')[0],
                                    readTime: post.readTime,
                                    slug: post.slug,
                                    hasTimer: post.hasTimer || false,
                                    timerDuration: post.timerDuration?.toString() || '24'
                                  });
                                  setShowBlogForm(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => {
                                  if (confirm('Delete this blog post?')) {
                                    deleteBlogMutation.mutate(post.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Interactive Blog Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-navy dark:text-blue-400 flex items-center gap-2">
                  <Eye className="w-6 h-6" />
                  Live Blog Preview
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2"
                >
                  ✕
                </Button>
              </div>
              
              <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-900 mb-4">
                <article className="max-w-none">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <span>📅 {blogFormData.publishedAt}</span>
                      <span>•</span>
                      <span>⏱ {blogFormData.readTime}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      {blogFormData.title || "Your Blog Title"}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                      {blogFormData.excerpt || "Your blog excerpt will appear here..."}
                    </p>
                  </div>
                  
                  {/* Media content */}
                  <div className="mb-6">
                    {blogFormData.videoUrl && (
                      <div className="mb-4">
                        {blogFormData.videoUrl.includes("youtube.com") || blogFormData.videoUrl.includes("youtu.be") ? (
                          <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                              <div className="text-4xl mb-2">🎥</div>
                              <p className="font-medium">YouTube Video</p>
                              <p className="text-sm">Video will be embedded here</p>
                            </div>
                          </div>
                        ) : blogFormData.videoUrl.includes("instagram.com") ? (
                          <div className="flex items-center justify-center p-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg text-white">
                            <div className="text-center">
                              <Instagram className="w-12 h-12 mx-auto mb-2" />
                              <p className="font-semibold">Instagram Reel</p>
                              <p className="text-sm opacity-90">Click to view on Instagram</p>
                            </div>
                          </div>
                        ) : blogFormData.videoUrl.includes("facebook.com") ? (
                          <div className="flex items-center justify-center p-8 bg-blue-600 rounded-lg text-white">
                            <div className="text-center">
                              <Facebook className="w-12 h-12 mx-auto mb-2" />
                              <p className="font-semibold">Facebook Reel</p>
                              <p className="text-sm opacity-90">Click to view on Facebook</p>
                            </div>
                          </div>
                        ) : blogFormData.videoUrl.startsWith("/uploads/") ? (
                          <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                              <div className="text-4xl mb-2">📹</div>
                              <p className="font-medium">Personal Video</p>
                              <p className="text-sm">Uploaded video file</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-8 bg-gray-600 rounded-lg text-white">
                            <div className="text-center">
                              <div className="text-4xl mb-2">🎬</div>
                              <p className="font-semibold">Video Content</p>
                              <p className="text-sm opacity-90">Video will be embedded</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {blogFormData.imageUrl && (
                      <img 
                        src={blogFormData.imageUrl.startsWith("/uploads/") ? `${window.location.origin}${blogFormData.imageUrl}` : blogFormData.imageUrl}
                        alt="Blog featured image" 
                        className="w-full rounded-lg shadow-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                  </div>
                </article>
              </div>
              
              {/* Social Media Sharing Preview */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Social Media Preview
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Facebook className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Facebook</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium line-clamp-2">{blogFormData.title}</p>
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-1">{blogFormData.excerpt}</p>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">𝕏</span>
                      </div>
                      <span className="text-sm font-medium">X (Twitter)</span>
                    </div>
                    <div className="text-sm">
                      <p className="line-clamp-2">{blogFormData.title}</p>
                      <p className="text-gray-600 dark:text-gray-400">{blogFormData.excerpt?.substring(0, 100)}...</p>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 rounded flex items-center justify-center">
                        <Instagram className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium">Instagram</span>
                    </div>
                    <div className="text-sm">
                      <p className="line-clamp-2">{blogFormData.title}</p>
                      <p className="text-gray-600 dark:text-gray-400">Link copied for story/bio</p>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">WhatsApp</span>
                    </div>
                    <div className="text-sm">
                      <p className="line-clamp-2">{blogFormData.title}</p>
                      <p className="text-gray-600 dark:text-gray-400">Ready to share via WhatsApp</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
