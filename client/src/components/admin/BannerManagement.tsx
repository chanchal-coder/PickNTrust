import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Plus, Save, X, Eye, EyeOff, Image, Link, ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { getStaticBanners } from '@/components/StaticPageBanner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { bannerSlides } from '../hero-banner-slider';

interface BannerButton {
  text: string;
  url: string;
  style?: 'primary' | 'secondary' | 'outline';
}

  interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  buttonText?: string;
  buttons?: BannerButton[];
  isActive: boolean;
  displayOrder: number;
  page: string;
  // Icon and emoji support
  icon?: string;
  iconType?: 'emoji' | 'fontawesome' | 'none';
  iconPosition?: 'left' | 'right' | 'top';
  // New styling properties
  imageDisplayType?: 'image' | 'unsplash' | 'text-only';
  unsplashQuery?: string;
  fontFamily?: string;
  fontWeight?: string;
  textColor?: string;
  textGradient?: string;
  textStyle?: 'solid' | 'gradient' | 'palette';
  backgroundColor?: string;
  backgroundGradient?: string;
  useGradient?: boolean;
  backgroundStyle?: 'solid' | 'gradient' | 'palette';
    backgroundOpacity?: number;
  created_at?: string;
  updated_at?: string;
}

  interface BannerForm {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  buttonText: string;
  buttons: BannerButton[];
  page: string;
  isActive?: boolean;
  // Icon and emoji support
  icon?: string;
  iconType?: 'emoji' | 'fontawesome' | 'none';
  iconPosition?: 'left' | 'right' | 'top';
  // New styling properties
  imageDisplayType?: 'image' | 'unsplash' | 'text-only';
  unsplashQuery?: string;
  fontFamily?: string;
  fontWeight?: string;
  textColor?: string;
  textGradient?: string;
  textStyle?: 'solid' | 'gradient' | 'palette';
  backgroundColor?: string;
  backgroundGradient?: string;
  useGradient?: boolean;
  backgroundStyle?: 'solid' | 'gradient' | 'palette';
    backgroundOpacity?: number;
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

const pages = [
  { value: 'home', label: 'Home Page' },
  { value: 'top-picks', label: 'Top Picks' },
  { value: 'services', label: 'Services Page' },
  { value: 'apps', label: 'Apps & AI Apps' },
  { value: 'categories', label: 'Categories Page' },
  { value: 'blog', label: 'Blog Page' },
  { value: 'videos', label: 'Videos Page' },
  { value: 'wishlist', label: 'Wishlist Page' },
  { value: 'contact', label: 'Contact Page' },
  { value: 'prime-picks', label: 'Prime Picks' },
  { value: 'cue-picks', label: 'Cue Picks' },
  { value: 'value-picks', label: 'Value Picks' },
  { value: 'click-picks', label: 'Click Picks' },
  { value: 'deals-hub', label: 'Deals Hub' },
  { value: 'global-picks', label: 'Global Picks' },
  { value: 'travel-picks', label: 'Travel Picks' },
  { value: 'loot-box', label: 'Loot Box' },
];

const imageDisplayTypes = [
  { value: 'image', label: 'Custom Image' },
  { value: 'unsplash', label: 'Unsplash Image' },
  { value: 'text-only', label: 'Text Only' },
];

const fontFamilies = [
  { value: 'font-sans', label: 'Sans Serif' },
  { value: 'font-serif', label: 'Serif' },
  { value: 'font-mono', label: 'Monospace' },
  { value: 'font-display', label: 'Display' },
];

const fontWeights = [
  { value: 'font-light', label: 'Light' },
  { value: 'font-normal', label: 'Normal' },
  { value: 'font-medium', label: 'Medium' },
  { value: 'font-semibold', label: 'Semi Bold' },
  { value: 'font-bold', label: 'Bold' },
  { value: 'font-extrabold', label: 'Extra Bold' },
];

const gradientPresets = [
  { value: 'bg-gradient-to-r from-blue-600 to-purple-600', label: 'Blue to Purple' },
  { value: 'bg-gradient-to-r from-green-400 to-blue-500', label: 'Green to Blue' },
  { value: 'bg-gradient-to-r from-purple-400 to-pink-400', label: 'Purple to Pink' },
  { value: 'bg-gradient-to-r from-yellow-400 to-orange-500', label: 'Yellow to Orange' },
  { value: 'bg-gradient-to-r from-red-400 to-pink-500', label: 'Red to Pink' },
  { value: 'bg-gradient-to-r from-indigo-500 to-purple-600', label: 'Indigo to Purple' },
];

const colorPalette = [
  // Theme Colors (Row 1)
  '#000000', '#6B7280', '#DC2626', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899',
  // Theme Colors (Row 2)
  '#FFFFFF', '#9CA3AF', '#92400E', '#F8BBD0', '#FCD34D', '#FEF3C7', '#BBF7D0', '#BFDBFE', '#DDD6FE', '#FBCFE8',
  // Theme Colors (Row 3)
  '#F9FAFB', '#D1D5DB', '#A78BFA', '#FBBF24', '#F59E0B', '#FBBF24', '#D9F99D', '#DBEAFE', '#C7D2FE', '#F3E8FF',
  // Theme Colors (Row 4)
  '#F3F4F6', '#6B7280', '#8B4513', '#FF6347', '#FF8C00', '#FFD700', '#ADFF2F', '#00CED1', '#1E90FF', '#9932CC',
  // Theme Colors (Row 5)
  '#E5E7EB', '#4B5563', '#A0522D', '#CD5C5C', '#DC143C', '#B22222', '#32CD32', '#228B22', '#4169E1', '#8A2BE2',
  // Theme Colors (Row 6)
  '#D1D5DB', '#374151', '#8B4513', '#B22222', '#FF0000', '#FF4500', '#7CFC00', '#20B2AA', '#0000FF', '#4B0082'
];

const standardColors = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#F97316', '#6B7280', '#374151'
];

const textGradientPresets = [
  { value: 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent', label: 'Blue to Purple' },
  { value: 'bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent', label: 'Green to Blue' },
  { value: 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent', label: 'Purple to Pink' },
  { value: 'bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent', label: 'Yellow to Orange' },
  { value: 'bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent', label: 'Red to Pink' },
  { value: 'bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent', label: 'Indigo to Purple' },
];

// Icon and Emoji Support
const iconTypes = [
  { value: 'none', label: 'No Icon' },
  { value: 'emoji', label: 'Emoji' },
  { value: 'fontawesome', label: 'Font Awesome' },
];

const iconPositions = [
  { value: 'left', label: 'Left of Title' },
  { value: 'right', label: 'Right of Title' },
  { value: 'top', label: 'Above Title' },
];

const emojiPresets = [
  { value: '🎉', label: '🎉 Party' },
  { value: '🔥', label: '🔥 Fire' },
  { value: '⭐', label: '⭐ Star' },
  { value: '💎', label: '💎 Diamond' },
  { value: '🚀', label: '🚀 Rocket' },
  { value: '👑', label: '👑 Crown' },
  { value: '🎯', label: '🎯 Target' },
  { value: '💰', label: '💰 Money' },
  { value: '🛍️', label: '🛍️ Shopping' },
  { value: '🎁', label: '🎁 Gift' },
  { value: '⚡', label: '⚡ Lightning' },
  { value: '🌟', label: '🌟 Glowing Star' },
  { value: '🔔', label: '🔔 Bell' },
  { value: '📢', label: '📢 Megaphone' },
  { value: '🎊', label: '🎊 Confetti' },
  { value: '💫', label: '💫 Dizzy' },
  { value: '🏆', label: '🏆 Trophy' },
  { value: '🎪', label: '🎪 Circus' },
  { value: '🎨', label: '🎨 Art' },
  { value: '🌈', label: '🌈 Rainbow' },
];

const fontAwesomePresets = [
  { value: 'fas fa-star', label: 'Star' },
  { value: 'fas fa-crown', label: 'Crown' },
  { value: 'fas fa-fire', label: 'Fire' },
  { value: 'fas fa-gem', label: 'Gem' },
  { value: 'fas fa-rocket', label: 'Rocket' },
  { value: 'fas fa-bolt', label: 'Lightning Bolt' },
  { value: 'fas fa-trophy', label: 'Trophy' },
  { value: 'fas fa-gift', label: 'Gift' },
  { value: 'fas fa-shopping-cart', label: 'Shopping Cart' },
  { value: 'fas fa-shopping-bag', label: 'Shopping Bag' },
  { value: 'fas fa-heart', label: 'Heart' },
  { value: 'fas fa-thumbs-up', label: 'Thumbs Up' },
  { value: 'fas fa-bullseye', label: 'Bullseye' },
  { value: 'fas fa-magic', label: 'Magic Wand' },
  { value: 'fas fa-sparkles', label: 'Sparkles' },
  { value: 'fas fa-medal', label: 'Medal' },
  { value: 'fas fa-award', label: 'Award' },
  { value: 'fas fa-certificate', label: 'Certificate' },
  { value: 'fas fa-tags', label: 'Tags' },
  { value: 'fas fa-percent', label: 'Percent' },
  { value: 'fas fa-dollar-sign', label: 'Dollar Sign' },
  { value: 'fas fa-coins', label: 'Coins' },
  { value: 'fas fa-hand-holding-usd', label: 'Money Hand' },
  { value: 'fas fa-piggy-bank', label: 'Piggy Bank' },
  // Business & Commerce
  { value: 'fas fa-briefcase', label: 'Briefcase' },
  { value: 'fas fa-chart-line', label: 'Chart Line' },
  { value: 'fas fa-handshake', label: 'Handshake' },
  { value: 'fas fa-store', label: 'Store' },
  { value: 'fas fa-credit-card', label: 'Credit Card' },
  { value: 'fas fa-wallet', label: 'Wallet' },
  { value: 'fas fa-receipt', label: 'Receipt' },
  { value: 'fas fa-cash-register', label: 'Cash Register' },
  // Technology
  { value: 'fas fa-laptop', label: 'Laptop' },
  { value: 'fas fa-mobile-alt', label: 'Mobile Phone' },
  { value: 'fas fa-desktop', label: 'Desktop' },
  { value: 'fas fa-wifi', label: 'WiFi' },
  { value: 'fas fa-cloud', label: 'Cloud' },
  { value: 'fas fa-database', label: 'Database' },
  { value: 'fas fa-server', label: 'Server' },
  { value: 'fas fa-code', label: 'Code' },
  // Communication
  { value: 'fas fa-envelope', label: 'Envelope' },
  { value: 'fas fa-phone', label: 'Phone' },
  { value: 'fas fa-comments', label: 'Comments' },
  { value: 'fas fa-bell', label: 'Bell' },
  { value: 'fas fa-bullhorn', label: 'Bullhorn' },
  { value: 'fas fa-microphone', label: 'Microphone' },
  // Navigation & UI
  { value: 'fas fa-home', label: 'Home' },
  { value: 'fas fa-search', label: 'Search' },
  { value: 'fas fa-cog', label: 'Settings' },
  { value: 'fas fa-user', label: 'User' },
  { value: 'fas fa-users', label: 'Users' },
  { value: 'fas fa-bars', label: 'Menu Bars' },
  { value: 'fas fa-times', label: 'Close X' },
  { value: 'fas fa-check', label: 'Check' },
  { value: 'fas fa-plus', label: 'Plus' },
  { value: 'fas fa-minus', label: 'Minus' },
  { value: 'fas fa-arrow-right', label: 'Arrow Right' },
  { value: 'fas fa-arrow-left', label: 'Arrow Left' },
  { value: 'fas fa-arrow-up', label: 'Arrow Up' },
  { value: 'fas fa-arrow-down', label: 'Arrow Down' },
  // Media & Entertainment
  { value: 'fas fa-play', label: 'Play' },
  { value: 'fas fa-pause', label: 'Pause' },
  { value: 'fas fa-stop', label: 'Stop' },
  { value: 'fas fa-music', label: 'Music' },
  { value: 'fas fa-video', label: 'Video' },
  { value: 'fas fa-camera', label: 'Camera' },
  { value: 'fas fa-image', label: 'Image' },
  { value: 'fas fa-film', label: 'Film' },
];

export default function BannerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPage, setSelectedPage] = useState('home');
  const [isAddingBanner, setIsAddingBanner] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [hiddenStaticBanners, setHiddenStaticBanners] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('hiddenStaticBanners');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageInputType, setImageInputType] = useState<'url' | 'upload'>('url');
  const [newBanner, setNewBanner] = useState<BannerForm>({
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '',
    buttonText: '',
    buttons: [{ text: '', url: '', style: 'primary' }],
    page: 'home',
    isActive: true,
    // Icon and emoji defaults
    icon: '',
    iconType: 'none',
    iconPosition: 'left',
    imageDisplayType: 'image',
    unsplashQuery: '',
    fontFamily: 'font-sans',
    fontWeight: 'font-bold',
    textColor: '#ffffff',
    textGradient: 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
    textStyle: 'solid',
    backgroundColor: '#1f2937',
    backgroundGradient: 'bg-gradient-to-r from-blue-600 to-purple-600',
    useGradient: false,
    backgroundStyle: 'solid',
    backgroundOpacity: 100,
  });

  // Fetch banners
  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['/api/admin/banners'],
    queryFn: async () => {
      const response = await fetch('/api/admin/banners');
      if (!response.ok) {
        throw new Error('Failed to fetch banners');
      }
      const data = await response.json();
      // Normalize various possible backend shapes to a flat Banner[]
      let payload: any = data;
      // Handle wrapper: { success: true, banners: ... }
      if (payload && typeof payload === 'object' && 'banners' in payload) {
        payload = (payload as any).banners;
      }
      // If already an array
      if (Array.isArray(payload)) {
        return payload as Banner[];
      }
      // If grouped object keyed by page
      if (payload && typeof payload === 'object') {
        const flattened: Banner[] = Object.entries(payload).flatMap(([page, list]) =>
          Array.isArray(list)
            ? (list as any[]).map((b: any) => ({ ...b, page: b?.page ?? page }))
            : []
        );
        return flattened;
      }
      // Fallback
      return [] as Banner[];
    },
  });

  // Fetch navigation tabs for dynamic pages
  const { data: navTabs = [] } = useQuery<NavTab[]>({
    queryKey: ['/api/nav-tabs'],
    queryFn: async () => {
      // Use proxy for API calls
      const response = await fetch('/api/nav-tabs');
      
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
     staleTime: 0,
     refetchOnWindowFocus: true, // Refetch when window gains focus
     refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
   });

  // Create dynamic pages array from navigation tabs with fallback
  const dynamicPages = [
    { value: 'home', label: 'Home Page' },
    { value: 'top-picks', label: 'Top Picks' },
    { value: 'services', label: 'Services Page' },
    { value: 'apps', label: 'Apps & AI Apps' },
    { value: 'categories', label: 'Categories Page' },
    { value: 'blog', label: 'Blog Page' },
    { value: 'videos', label: 'Videos Page' },
    { value: 'wishlist', label: 'Wishlist Page' },
    { value: 'contact', label: 'Contact Page' },
    { value: 'travel-picks', label: 'Travel Picks' },
    // Add navigation pages from API if available, otherwise use hardcoded fallback
    ...(Array.isArray(navTabs) && navTabs.length > 0 
      ? navTabs
          .filter(tab => tab.is_active)
          .sort((a, b) => a.display_order - b.display_order)
          .map(tab => ({
            value: tab.slug,
            label: tab.name
          }))
      : [
          { value: 'prime-picks', label: 'Prime Picks' },
          { value: 'cue-picks', label: 'Cue Picks' },
          { value: 'value-picks', label: 'Value Picks' },
          { value: 'click-picks', label: 'Click Picks' },
          { value: 'deals-hub', label: 'Deals Hub' },
          { value: 'global-picks', label: 'Global Picks' },
          { value: 'loot-box', label: 'Loot Box' },
          { value: 'travel-picks', label: 'Travel Picks' }
        ]
    )
  ];

  // Filter banners by selected page
  const filteredBanners = (Array.isArray(banners) ? banners : []).filter((banner: Banner) => banner.page === selectedPage);

  // Create banner mutation
  const createBannerMutation = useMutation({
    mutationFn: async (bannerData: BannerForm) => {
      const response = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bannerData),
      });
      
      if (!response.ok) {
        // Be tolerant to non-JSON error bodies
        let errorMsg = 'Failed to create banner';
        try {
          const error = await response.json();
          errorMsg = (error && (error.error || error.message)) || errorMsg;
        } catch {
          try {
            const text = await response.text();
            if (text && text.length > 0) errorMsg = text;
          } catch {}
        }
        throw new Error(errorMsg);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      // Invalidate all page banner queries to refresh frontend
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      // Invalidate specific page banner queries used by PageBanner component
      pages.forEach(page => {
        queryClient.invalidateQueries({ queryKey: [`banners-${page.value}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/banners/${page.value}`] });
      });
      // Also invalidate dynamic pages and API patterns
      queryClient.invalidateQueries({ predicate: (query) => 
        typeof query.queryKey[0] === 'string' && 
        (query.queryKey[0].startsWith('banners-') || query.queryKey[0].startsWith('/api/banners/'))
      });
      setIsAddingBanner(false);
      setEditingBannerId(null);
      setNewBanner({
        title: '',
        subtitle: '',
        imageUrl: '',
        linkUrl: '',
        buttonText: '',
        buttons: [{ text: '', url: '', style: 'primary' }],
        page: 'home',
        isActive: true,
        // Icon and emoji defaults
        icon: '',
        iconType: 'none',
        iconPosition: 'left',
        imageDisplayType: 'image',
        unsplashQuery: '',
        fontFamily: 'font-sans',
        fontWeight: 'font-bold',
        textColor: '#ffffff',
        textGradient: 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
        textStyle: 'solid',
        backgroundColor: '#1f2937',
        backgroundGradient: 'bg-gradient-to-r from-blue-600 to-purple-600',
        useGradient: false,
        backgroundStyle: 'solid',
      });
      toast({
        title: 'Success',
        description: 'Banner created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update banner mutation
  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<BannerForm>) => {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update banner');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      // Invalidate all page banner queries to refresh frontend
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      // Invalidate specific page banner queries used by PageBanner component
      pages.forEach(page => {
        queryClient.invalidateQueries({ queryKey: [`banners-${page.value}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/banners/${page.value}`] });
      });
      // Also invalidate dynamic pages and API patterns
      queryClient.invalidateQueries({ predicate: (query) => 
        typeof query.queryKey[0] === 'string' && 
        (query.queryKey[0].startsWith('banners-') || query.queryKey[0].startsWith('/api/banners/'))
      });
      setEditingBannerId(null);
      setIsAddingBanner(false);
      setNewBanner({
        title: '',
        subtitle: '',
        imageUrl: '',
        linkUrl: '',
        buttonText: '',
        buttons: [{ text: '', url: '', style: 'primary' }],
        page: 'home',
        isActive: true,
        // Icon and emoji defaults
        icon: '',
        iconType: 'none',
        iconPosition: 'left',
        imageDisplayType: 'image',
        unsplashQuery: '',
        fontFamily: 'font-sans',
        fontWeight: 'font-bold',
        textColor: '#ffffff',
        textGradient: 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
        textStyle: 'solid',
        backgroundColor: '#1f2937',
        backgroundGradient: 'bg-gradient-to-r from-blue-600 to-purple-600',
        useGradient: false,
        backgroundStyle: 'solid',
      });
      toast({
        title: 'Success',
        description: 'Banner updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete banner mutation
  const deleteBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        // Backend expects an admin password in the request body
        body: JSON.stringify({ password: 'pickntrust2025' }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete banner' }));
        throw new Error(error.message || 'Failed to delete banner');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      // Invalidate all page banner queries to refresh frontend
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      // Invalidate specific page banner queries used by PageBanner component
      pages.forEach(page => {
        queryClient.invalidateQueries({ queryKey: [`banners-${page.value}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/banners/${page.value}`] });
      });
      // Also invalidate dynamic pages and API patterns
      queryClient.invalidateQueries({ predicate: (query) => 
        typeof query.queryKey[0] === 'string' && 
        (query.queryKey[0].startsWith('banners-') || query.queryKey[0].startsWith('/api/banners/'))
      });
      toast({
        title: 'Success',
        description: 'Banner deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Import all static banners into dynamic database
  const importStaticBannersMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/banners/import-static', {
        method: 'POST',
      });
      if (!response.ok) {
        let errorMsg = 'Failed to import static banners';
        try {
          const err = await response.json();
          errorMsg = (err && (err.error || err.message)) || errorMsg;
        } catch {
          try {
            const text = await response.text();
            if (text && text.length > 0) errorMsg = text;
          } catch {}
        }
        throw new Error(errorMsg);
      }
      return response.json();
    },
    onSuccess: () => {
      // Refresh all banner queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      pages.forEach(page => {
        queryClient.invalidateQueries({ queryKey: [`banners-${page.value}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/banners/${page.value}`] });
      });
      queryClient.invalidateQueries({ predicate: (query) => 
        typeof query.queryKey[0] === 'string' && 
        (query.queryKey[0].startsWith('banners-') || query.queryKey[0].startsWith('/api/banners/'))
      });
      toast({
        title: 'Success',
        description: 'Imported static banners into dynamic management',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reorder banners mutation
  const reorderBannersMutation = useMutation({
    mutationFn: async (bannerOrders: { id: number; displayOrder: number }[]) => {
      // Filter out any invalid/non-numeric IDs defensively
      const safeOrders = bannerOrders.filter((b) => Number.isFinite(Number(b.id)));
      // Backend expects payload: { banners: [{ id, display_order }] }
      const normalized = safeOrders.map((b) => ({
        id: Number(b.id),
        display_order: Number(b.displayOrder),
      }));

      const response = await fetch('/api/admin/banners/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ banners: normalized }),
      });

      if (!response.ok) {
        // Be tolerant to non-JSON error bodies
        let errorMsg = 'Failed to reorder banners';
        try {
          const error = await response.json();
          if (error && Array.isArray(error.missingIds) && error.missingIds.length > 0) {
            errorMsg = `Banner not found: ${error.missingIds.join(', ')}`;
          } else {
            errorMsg = (error && (error.error || error.message)) || errorMsg;
          }
        } catch {
          try {
            const text = await response.text();
            if (text && text.length > 0) errorMsg = text;
          } catch {}
        }
        throw new Error(errorMsg);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      // Invalidate all page banner queries to refresh frontend
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      // Invalidate specific page banner queries used by PageBanner component
      pages.forEach(page => {
        queryClient.invalidateQueries({ queryKey: [`banners-${page.value}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/banners/${page.value}`] });
      });
      // Also invalidate dynamic pages and API patterns
      queryClient.invalidateQueries({ predicate: (query) => 
        typeof query.queryKey[0] === 'string' && 
        (query.queryKey[0].startsWith('banners-') || query.queryKey[0].startsWith('/api/banners/'))
      });
      toast({
        title: 'Success',
        description: 'Banner order updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select a valid image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);

    try {
      // Create a local URL for the uploaded file as fallback
      const localUrl = URL.createObjectURL(file);
      
      // Try to upload to server first
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('/api/admin/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setNewBanner({ ...newBanner, imageUrl: data.imageUrl });
        } else {
          // Fallback to local URL if server upload fails
          setNewBanner({ ...newBanner, imageUrl: localUrl });
        }
      } catch (serverError) {
        // Fallback to local URL if server is not available
        setNewBanner({ ...newBanner, imageUrl: localUrl });
      }
      
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBannerId) {
      updateBannerMutation.mutate({
        id: editingBannerId,
        ...newBanner
      });
    } else {
      createBannerMutation.mutate(newBanner);
    }
  };

  // Handle edit
  const handleEdit = (banner: Banner) => {
    setNewBanner({
      title: banner.title,
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      buttonText: banner.buttonText || '',
      buttons: banner.buttons || [{ text: banner.buttonText || '', url: banner.linkUrl || '', style: 'primary' }],
      page: banner.page,
      isActive: banner.isActive,
      // Icon and emoji properties with defaults
      icon: banner.icon || '',
      iconType: banner.iconType || 'none',
      iconPosition: banner.iconPosition || 'left',
      // Styling properties with defaults
      imageDisplayType: banner.imageDisplayType || 'image',
      unsplashQuery: banner.unsplashQuery || '',
      fontFamily: banner.fontFamily || 'font-sans',
      fontWeight: banner.fontWeight || 'font-bold',
      textColor: banner.textColor || '#ffffff',
      textGradient: banner.textGradient || 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
      textStyle: banner.textStyle || 'solid',
      backgroundColor: banner.backgroundColor || '#1f2937',
      backgroundGradient: banner.backgroundGradient || 'bg-gradient-to-r from-blue-600 to-purple-600',
      useGradient: banner.useGradient || false,
      backgroundStyle: banner.backgroundStyle || 'solid',
    });
    setEditingBannerId(banner.id);
    setIsAddingBanner(true);
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    deleteBannerMutation.mutate(id);
  };

  // Toggle banner active status
  const toggleBannerStatus = async (banner: Banner) => {
    // Send a full payload to avoid backend NOT NULL violations
    const placeholderImage =
      banner.imageUrl && banner.imageUrl.trim().length > 0
        ? banner.imageUrl
        : "https://via.placeholder.com/1x1/transparent/transparent.png";

    updateBannerMutation.mutate({
      id: banner.id,
      // core fields expected by backend update route
      title: banner.title ?? "",
      subtitle: banner.subtitle ?? "",
      imageUrl: placeholderImage,
      linkUrl: banner.linkUrl ?? "",
      buttonText: banner.buttonText ?? "",
      page: banner.page,
      // toggle active status
      isActive: !banner.isActive,
      // icon-related
      icon: banner.icon ?? "",
      iconType: banner.iconType ?? "none",
      iconPosition: banner.iconPosition ?? "top",
      // background-related
      useGradient:
        typeof banner.useGradient === "boolean"
          ? banner.useGradient
          : banner.backgroundStyle === "gradient",
      backgroundGradient: banner.backgroundGradient ?? "",
      backgroundOpacity:
        typeof banner.backgroundOpacity === "number"
          ? banner.backgroundOpacity
          : 100,
      // image display helpers
      imageDisplayType: banner.imageDisplayType ?? "image",
      unsplashQuery: banner.unsplashQuery ?? "",
    });
  };

  // Handle drag end for reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items: Banner[] = Array.from(filteredBanners);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const bannerOrders = items.map((item, index) => ({
      id: item.id,
      displayOrder: index + 1
    }));
    
    reorderBannersMutation.mutate(bannerOrders);
  };

  // Toggle static banner visibility
  const toggleStaticBanner = (bannerId: string) => {
    setHiddenStaticBanners(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bannerId)) {
        newSet.delete(bannerId);
        toast({
          title: 'Banner Shown',
          description: 'Static banner is now visible on live site',
        });
      } else {
        newSet.add(bannerId);
        toast({
          title: 'Banner Hidden',
          description: 'Static banner is now hidden from live site',
        });
      }
      // Save to localStorage
      localStorage.setItem('hiddenStaticBanners', JSON.stringify([...newSet]));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('hiddenBannersChanged'));
      return newSet;
    });
  };

  // Convert hardcoded banner to editable
  const makeEditable = async (hardcodedBanner: any) => {
    try {
      const bannerData = {
        title: hardcodedBanner.title,
        subtitle: hardcodedBanner.subtitle || hardcodedBanner.description || '',
        linkUrl: hardcodedBanner.ctaLink || hardcodedBanner.linkUrl || '/',
        buttonText: hardcodedBanner.ctaText || hardcodedBanner.buttonText || 'Learn More',
        buttons: [{ text: hardcodedBanner.ctaText || hardcodedBanner.buttonText || 'Learn More', url: hardcodedBanner.ctaLink || hardcodedBanner.linkUrl || '/', style: 'primary' as const }],
        page: hardcodedBanner.page || selectedPage,
        isActive: true,
        // Preserve visual styling from static banner - force text-only with gradient
        imageDisplayType: 'text-only' as const,
        imageUrl: 'https://via.placeholder.com/1x1/transparent/transparent.png', // Placeholder URL for validation, won't be used in text-only mode
        unsplashQuery: '',
        fontFamily: 'font-sans',
        fontWeight: 'font-bold',
        textColor: '#ffffff',
        textGradient: 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
        textStyle: 'solid' as const,
        backgroundColor: '#1f2937',
        backgroundGradient: hardcodedBanner.bgGradient ? `bg-gradient-to-r ${hardcodedBanner.bgGradient}` : 'bg-gradient-to-r from-purple-600 to-orange-600',
        useGradient: true,
        backgroundStyle: 'gradient' as const,
        // Keep Font Awesome icons exactly as in static banners
        icon: hardcodedBanner.icon || '',
        iconType: hardcodedBanner.icon ? 'fontawesome' as const : 'none' as const,
        // Default to top icon to mirror static banner presentation
        iconPosition: 'top' as const,
      };
      
      await createBannerMutation.mutateAsync(bannerData);
      
      toast({
        title: 'Success',
        description: `"${hardcodedBanner.title}" banner is now editable!`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to make banner editable',
        variant: 'destructive',
      });
    }
  };

  // Get hardcoded banners for current page
  const getHardcodedBanners = () => {
    if (selectedPage === 'home') {
      return bannerSlides.map(banner => ({
        ...banner,
        id: banner.id.toString(), // Convert to string for consistency
        isHardcoded: true,
        page: 'home'
      }));
    }
    
    // Travel page: show all static travel banners from config
    if (selectedPage === 'travel-picks') {
      try {
        const staticTravel = (getStaticBanners('travel-picks') as any[]) || [];
        return staticTravel
          .filter(b => b && b.isActive)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
          .map(b => ({
            id: `static-${b.id}`,
            title: b.title,
            subtitle: b.subtitle || '',
            image: b.imageUrl || '',
            ctaText: b.buttonText || 'Learn More',
            ctaLink: b.linkUrl || '/',
            bgGradient: b.gradient || '',
            icon: b.icon || '',
            isHardcoded: true,
            page: 'travel-picks'
          }));
      } catch {
        return [];
      }
    }

    // Get fallback banners for other pages
    const fallbackBanners: { [key: string]: any } = {
      'prime-picks': {
        id: 'fallback-prime-picks',
        title: 'Prime Picks',
        subtitle: 'Discover our premium selection of top-quality home décor products handpicked just for you!',
        image: '',
        ctaText: 'Explore Prime Deals',
        ctaLink: '/',
        bgGradient: 'from-purple-600 via-pink-600 to-orange-500',
        icon: 'fas fa-crown'
      },
      'value-picks': {
        id: 'fallback-value-picks',
        title: 'Value Picks',
        subtitle: 'Maximum value for your money - Best bang for buck',
        image: '',
        ctaText: 'Find Value Deals',
        ctaLink: '/',
        bgGradient: 'from-green-600 via-emerald-600 to-teal-600',
        icon: 'fas fa-gem'
      },
      'click-picks': {
        id: 'fallback-click-picks',
        title: 'Click Picks',
        subtitle: 'One-click shopping for the most popular products',
        image: '',
        ctaText: 'Quick Shop Now',
        ctaLink: '/',
        bgGradient: 'from-blue-600 via-indigo-600 to-purple-500',
        icon: 'fas fa-mouse-pointer'
      },
      'cue-picks': {
        id: 'fallback-cue-picks',
        title: 'Cue Picks',
        subtitle: 'Trending products curated just for you',
        image: '',
        ctaText: 'Browse Trends',
        ctaLink: '/',
        bgGradient: 'from-red-600 via-pink-600 to-rose-600',
        icon: 'fas fa-bullseye'
      },
      'global-picks': {
        id: 'fallback-global-picks',
        title: 'Global Picks',
        subtitle: 'International favorites from around the world',
        image: '',
        ctaText: 'Explore Global',
        ctaLink: '/',
        bgGradient: 'from-cyan-600 via-blue-600 to-indigo-600',
        icon: 'fas fa-globe'
      },
      'deals-hub': {
        id: 'fallback-deals-hub',
        title: 'Deals Hub',
        subtitle: 'Your central destination for the best deals and discounts',
        image: '',
        ctaText: 'Browse Deals',
        ctaLink: '/',
        bgGradient: 'from-red-600 via-orange-600 to-yellow-500',
        icon: 'fas fa-fire'
      },
      'loot-box': {
        id: 'fallback-loot-box',
        title: 'Loot Box',
        subtitle: 'Surprise deals and mystery products waiting to be discovered',
        image: '',
        ctaText: 'Open Loot Box',
        ctaLink: '/',
        bgGradient: 'from-purple-600 via-indigo-600 to-blue-600',
        icon: 'fas fa-box-open'
      }
    };
    
    if (fallbackBanners[selectedPage]) {
      return [{
        ...fallbackBanners[selectedPage],
        isHardcoded: true,
        page: selectedPage
      }];
    }
    
    return [];
  };

  const hardcodedBanners = getHardcodedBanners();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Banner Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage sliding banners for all pages</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAddingBanner(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Banner
          </Button>
          <Button
            onClick={() => importStaticBannersMutation.mutate()}
            disabled={importStaticBannersMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {importStaticBannersMutation.isPending ? 'Importing…' : 'Import Static'}
          </Button>
        </div>
      </div>

      {/* Page Filter */}
      <div className="flex flex-wrap gap-2">
        {dynamicPages.map((page) => (
          <Button
            key={page.value}
            variant={selectedPage === page.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPage(page.value)}
          >
            {page.label}
          </Button>
        ))}
      </div>

      {/* Add/Edit Banner Form */}
      {isAddingBanner && (
        <Card>
          <CardHeader>
            <CardTitle>{editingBannerId ? 'Edit Banner' : 'Add New Banner'}</CardTitle>
            <CardDescription>
              {editingBannerId ? 'Update banner details' : 'Create a new banner for the selected page'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">Title (Optional)</Label>
                  <Input
                    id="title"
                    value={newBanner.title}
                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                    placeholder="Banner title (optional for image-only banners)"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle" className="text-gray-700 dark:text-gray-300">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={newBanner.subtitle}
                    onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                    placeholder="Banner subtitle (optional)"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Icon and Emoji Configuration */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Icon & Emoji Settings</h3>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label htmlFor="iconType" className="text-gray-700 dark:text-gray-300">Icon Type</Label>
                    <select
                      id="iconType"
                      value={newBanner.iconType}
                      onChange={(e) => setNewBanner({ ...newBanner, iconType: e.target.value as 'emoji' | 'fontawesome' | 'none', icon: '' })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {iconTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {newBanner.iconType !== 'none' && (
                    <div>
                      <Label htmlFor="iconPosition" className="text-gray-700 dark:text-gray-300">Icon Position</Label>
                      <select
                        id="iconPosition"
                        value={newBanner.iconPosition}
                        onChange={(e) => setNewBanner({ ...newBanner, iconPosition: e.target.value as 'left' | 'right' | 'top' })}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {iconPositions.map((position) => (
                          <option key={position.value} value={position.value}>
                            {position.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {newBanner.iconType !== 'none' && (
                    <div>
                      <Label htmlFor="icon" className="text-gray-700 dark:text-gray-300">
                        {newBanner.iconType === 'emoji' ? 'Custom Emoji' : 'Custom Font Awesome Class'}
                      </Label>
                      <Input
                        id="icon"
                        value={newBanner.icon}
                        onChange={(e) => setNewBanner({ ...newBanner, icon: e.target.value })}
                        placeholder={newBanner.iconType === 'emoji' ? '🎉 Enter emoji' : 'fas fa-star'}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                  )}
                </div>
                
                {/* Emoji Presets */}
                {newBanner.iconType === 'emoji' && (
                  <div className="mb-4">
                    <Label className="text-gray-700 dark:text-gray-300 mb-3 block">Emoji Presets</Label>
                    <div className="grid grid-cols-10 gap-2">
                      {emojiPresets.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`p-2 text-2xl rounded border-2 hover:scale-110 transition-transform ${
                            newBanner.icon === emoji.value 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' 
                              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                          }`}
                          onClick={() => setNewBanner({ ...newBanner, icon: emoji.value })}
                          title={emoji.label}
                        >
                          {emoji.value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Font Awesome Presets */}
                {newBanner.iconType === 'fontawesome' && (
                  <div className="mb-4">
                    <Label className="text-gray-700 dark:text-gray-300 mb-3 block">Font Awesome Presets</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {fontAwesomePresets.map((icon, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`p-3 rounded border-2 hover:scale-105 transition-transform flex items-center justify-center ${
                            newBanner.icon === icon.value 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' 
                              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                          }`}
                          onClick={() => setNewBanner({ ...newBanner, icon: icon.value })}
                          title={icon.label}
                        >
                          <i className={`${icon.value} text-lg`}></i>
                          <span className="ml-2 text-sm">{icon.label}</span>
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom FontAwesome Input */}
                    <div className="mt-4">
                      <Label htmlFor="customFontAwesome" className="text-gray-700 dark:text-gray-300">Custom FontAwesome Class</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="customFontAwesome"
                          value={newBanner.icon || ''}
                          onChange={(e) => setNewBanner({ ...newBanner, icon: e.target.value })}
                          placeholder="e.g., fas fa-star, fab fa-facebook, far fa-heart"
                          className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        {newBanner.icon && (
                          <div className="flex items-center justify-center w-12 h-10 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700">
                            <i className={`${newBanner.icon} text-lg text-gray-700 dark:text-gray-300`}></i>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Enter any FontAwesome class (fas, far, fab, fal, fad). Examples: fas fa-star, fab fa-twitter, far fa-heart
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-700 dark:text-gray-300">Banner Image (optional)</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={imageInputType === 'url' ? 'default' : 'outline'}
                      onClick={() => setImageInputType('url')}
                    >
                      URL
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={imageInputType === 'upload' ? 'default' : 'outline'}
                      onClick={() => setImageInputType('upload')}
                    >
                      Upload
                    </Button>
                  </div>
                </div>
                
                {imageInputType === 'url' ? (
                  <Input
                    id="imageUrl"
                    value={newBanner.imageUrl}
                    onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                    placeholder="https://example.com/banner-image.jpg"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                ) : (
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file);
                        }
                      }}
                      disabled={uploadingImage}
                      className="cursor-pointer bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                    {uploadingImage && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        Uploading image...
                      </div>
                    )}
                    {newBanner.imageUrl && (
                      <div className="text-sm text-green-600 dark:text-green-400">
                        <i className="fas fa-check"></i> Image uploaded successfully
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkUrl" className="text-gray-700 dark:text-gray-300">Link URL</Label>
                  <Input
                    id="linkUrl"
                    value={newBanner.linkUrl}
                    onChange={(e) => setNewBanner({ ...newBanner, linkUrl: e.target.value })}
                    placeholder="https://example.com (optional)"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label htmlFor="buttonText" className="text-gray-700 dark:text-gray-300">Button Text</Label>
                  <Input
                    id="buttonText"
                    value={newBanner.buttonText}
                    onChange={(e) => setNewBanner({ ...newBanner, buttonText: e.target.value })}
                    placeholder="Shop Now (optional)"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="page" className="text-gray-700 dark:text-gray-300">Page</Label>
                <select
                  id="page"
                  value={newBanner.page}
                  onChange={(e) => setNewBanner({ ...newBanner, page: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  {dynamicPages.map((page) => (
                    <option key={page.value} value={page.value}>
                      {page.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multiple Buttons Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Banner Buttons</h3>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const newButtons = [...newBanner.buttons, { text: '', url: '', style: 'primary' as const }];
                      setNewBanner({ ...newBanner, buttons: newButtons });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Button
                  </Button>
                </div>
                
                {newBanner.buttons.map((button, index) => (
                  <div key={index} className="border rounded-lg p-4 mb-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">Button {index + 1}</h4>
                      {newBanner.buttons.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newButtons = newBanner.buttons.filter((_, i) => i !== index);
                            setNewBanner({ ...newBanner, buttons: newButtons });
                          }}
                          className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`buttonText-${index}`} className="text-gray-700 dark:text-gray-300">Button Text</Label>
                        <Input
                          id={`buttonText-${index}`}
                          value={button.text}
                          onChange={(e) => {
                            const newButtons = [...newBanner.buttons];
                            newButtons[index].text = e.target.value;
                            setNewBanner({ ...newBanner, buttons: newButtons });
                          }}
                          placeholder="Shop Now"
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`buttonUrl-${index}`} className="text-gray-700 dark:text-gray-300">Button URL</Label>
                        <Input
                          id={`buttonUrl-${index}`}
                          value={button.url}
                          onChange={(e) => {
                            const newButtons = [...newBanner.buttons];
                            newButtons[index].url = e.target.value;
                            setNewBanner({ ...newBanner, buttons: newButtons });
                          }}
                          placeholder="https://example.com"
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`buttonStyle-${index}`} className="text-gray-700 dark:text-gray-300">Button Style</Label>
                        <select
                          id={`buttonStyle-${index}`}
                          value={button.style}
                          onChange={(e) => {
                            const newButtons = [...newBanner.buttons];
                            newButtons[index].style = e.target.value as 'primary' | 'secondary' | 'outline';
                            setNewBanner({ ...newBanner, buttons: newButtons });
                          }}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="primary">Primary</option>
                          <option value="secondary">Secondary</option>
                          <option value="outline">Outline</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Styling Options */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Styling Options</h3>
                
                {/* Image Display Type */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="imageDisplayType" className="text-gray-700 dark:text-gray-300">Image Display</Label>
                    <select
                      id="imageDisplayType"
                      value={newBanner.imageDisplayType}
                      onChange={(e) => setNewBanner({ ...newBanner, imageDisplayType: e.target.value as 'image' | 'unsplash' | 'text-only' })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {imageDisplayTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Unsplash Query */}
                  {newBanner.imageDisplayType === 'unsplash' && (
                    <div>
                      <Label htmlFor="unsplashQuery" className="text-gray-700 dark:text-gray-300">Unsplash Search Query</Label>
                      <Input
                        id="unsplashQuery"
                        value={newBanner.unsplashQuery}
                        onChange={(e) => setNewBanner({ ...newBanner, unsplashQuery: e.target.value })}
                        placeholder="e.g., nature, technology, business"
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                  )}
                </div>

                {/* Font Options */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="fontFamily" className="text-gray-700 dark:text-gray-300">Font Family</Label>
                    <select
                      id="fontFamily"
                      value={newBanner.fontFamily}
                      onChange={(e) => setNewBanner({ ...newBanner, fontFamily: e.target.value })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {fontFamilies.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="fontWeight" className="text-gray-700 dark:text-gray-300">Font Weight</Label>
                    <select
                      id="fontWeight"
                      value={newBanner.fontWeight}
                      onChange={(e) => setNewBanner({ ...newBanner, fontWeight: e.target.value })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {fontWeights.map((weight) => (
                        <option key={weight.value} value={weight.value}>
                          {weight.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Color Options */}
                <div className="mb-4">
                  <div className="flex items-center gap-4 mb-3">
                    <Label className="text-gray-700 dark:text-gray-300">Background Style</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={newBanner.backgroundStyle === 'solid' ? 'default' : 'outline'}
                        onClick={() => setNewBanner({ ...newBanner, backgroundStyle: 'solid', useGradient: false })}
                      >
                        Solid Color
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={newBanner.backgroundStyle === 'gradient' ? 'default' : 'outline'}
                        onClick={() => setNewBanner({ ...newBanner, backgroundStyle: 'gradient', useGradient: true })}
                      >
                        Gradient
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={newBanner.backgroundStyle === 'palette' ? 'default' : 'outline'}
                        onClick={() => setNewBanner({ ...newBanner, backgroundStyle: 'palette', useGradient: false })}
                      >
                        Color Palette
                      </Button>
                    </div>
                  </div>
                  
                  {/* Overlay Opacity Control */}
                  <div className="mb-4">
                    <Label className="text-gray-700 dark:text-gray-300">Background Opacity: {newBanner.backgroundOpacity ?? 100}%</Label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="10"
                      value={newBanner.backgroundOpacity ?? 100}
                      onChange={(e) => setNewBanner({ ...newBanner, backgroundOpacity: parseInt(e.target.value, 10) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10% (Very transparent)</span>
                      <span>100% (Fully opaque)</span>
                    </div>
                  </div>
                  
                  {/* Text Color Options */}
                  <div className="mb-4">
                    <div className="flex items-center gap-4 mb-3">
                      <Label className="text-gray-700 dark:text-gray-300">Text Style</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={newBanner.textStyle === 'solid' ? 'default' : 'outline'}
                          onClick={() => setNewBanner({ ...newBanner, textStyle: 'solid' })}
                        >
                          Solid Color
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={newBanner.textStyle === 'gradient' ? 'default' : 'outline'}
                          onClick={() => setNewBanner({ ...newBanner, textStyle: 'gradient' })}
                        >
                          Gradient
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={newBanner.textStyle === 'palette' ? 'default' : 'outline'}
                          onClick={() => setNewBanner({ ...newBanner, textStyle: 'palette' })}
                        >
                          Color Palette
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {newBanner.textStyle === 'solid' && (
                        <div>
                          <Label htmlFor="textColor" className="text-gray-700 dark:text-gray-300">Text Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              id="textColor"
                              value={newBanner.textColor}
                              onChange={(e) => setNewBanner({ ...newBanner, textColor: e.target.value })}
                              className="w-16 h-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                            />
                            <Input
                              value={newBanner.textColor}
                              onChange={(e) => setNewBanner({ ...newBanner, textColor: e.target.value })}
                              placeholder="#ffffff"
                              className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          </div>
                        </div>
                      )}
                      
                      {newBanner.textStyle === 'gradient' && (
                        <div>
                          <Label htmlFor="textGradient" className="text-gray-700 dark:text-gray-300">Text Gradient</Label>
                          <select
                            id="textGradient"
                            value={newBanner.textGradient}
                            onChange={(e) => setNewBanner({ ...newBanner, textGradient: e.target.value })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            {textGradientPresets.map((gradient) => (
                              <option key={gradient.value} value={gradient.value}>
                                {gradient.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    
                    {/* Text Color Palette Section */}
                    {newBanner.textStyle === 'palette' && (
                      <div className="mt-4">
                        <Label className="text-gray-700 dark:text-gray-300 mb-3 block">Theme Colors</Label>
                        <div className="grid grid-cols-10 gap-2 mb-4">
                          {colorPalette.map((color, index) => (
                            <button
                              key={index}
                              type="button"
                              className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                                newBanner.textColor === color 
                                  ? 'border-gray-900 dark:border-white shadow-lg' 
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setNewBanner({ ...newBanner, textColor: color })}
                              title={color}
                            />
                          ))}
                        </div>
                        
                        <Label className="text-gray-700 dark:text-gray-300 mb-3 block">Standard Colors</Label>
                        <div className="flex gap-2 flex-wrap">
                          {standardColors.map((color, index) => (
                            <button
                              key={index}
                              type="button"
                              className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                                newBanner.textColor === color 
                                  ? 'border-gray-900 dark:border-white shadow-lg' 
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setNewBanner({ ...newBanner, textColor: color })}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Background Color Options */}
                  <div className="grid md:grid-cols-1 gap-4">
                    
                    {newBanner.backgroundStyle === 'solid' && (
                      <div>
                        <Label htmlFor="backgroundColor" className="text-gray-700 dark:text-gray-300">Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            id="backgroundColor"
                            value={newBanner.backgroundColor}
                            onChange={(e) => setNewBanner({ ...newBanner, backgroundColor: e.target.value })}
                            className="w-16 h-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                          />
                          <Input
                            value={newBanner.backgroundColor}
                            onChange={(e) => setNewBanner({ ...newBanner, backgroundColor: e.target.value })}
                            placeholder="#000000"
                            className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                      </div>
                    )}
                    
                    {newBanner.backgroundStyle === 'gradient' && (
                      <div>
                        <Label htmlFor="backgroundGradient" className="text-gray-700 dark:text-gray-300">Gradient Preset</Label>
                        <select
                          id="backgroundGradient"
                          value={newBanner.backgroundGradient}
                          onChange={(e) => setNewBanner({ ...newBanner, backgroundGradient: e.target.value })}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {gradientPresets.map((gradient) => (
                            <option key={gradient.value} value={gradient.value}>
                              {gradient.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  {/* Color Palette Section */}
                  {newBanner.backgroundStyle === 'palette' && (
                    <div className="mt-4">
                      <Label className="text-gray-700 dark:text-gray-300 mb-3 block">Theme Colors</Label>
                      <div className="grid grid-cols-10 gap-2 mb-4">
                        {colorPalette.map((color, index) => (
                          <button
                            key={index}
                            type="button"
                            className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                              newBanner.backgroundColor === color 
                                ? 'border-gray-900 dark:border-white shadow-lg' 
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewBanner({ ...newBanner, backgroundColor: color })}
                            title={color}
                          />
                        ))}
                      </div>
                      
                      <Label className="text-gray-700 dark:text-gray-300 mb-3 block">Standard Colors</Label>
                      <div className="flex gap-2 flex-wrap">
                        {standardColors.map((color, index) => (
                          <button
                            key={index}
                            type="button"
                            className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                              newBanner.backgroundColor === color 
                                ? 'border-gray-900 dark:border-white shadow-lg' 
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewBanner({ ...newBanner, backgroundColor: color })}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Banner Preview */}
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Banner Preview</Label>
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <div 
                    className={`relative w-full h-48 flex items-center justify-center ${
                      newBanner.backgroundStyle === 'gradient' ? newBanner.backgroundGradient : ''
                    } ${newBanner.fontFamily} ${newBanner.fontWeight}`}
                    style={{
                      backgroundColor: (newBanner.backgroundStyle === 'solid' || newBanner.backgroundStyle === 'palette') ? newBanner.backgroundColor : undefined,
                      color: newBanner.textStyle === 'solid' || newBanner.textStyle === 'palette' ? newBanner.textColor : undefined,
                      opacity: newBanner.imageDisplayType === 'text-only' ? ((newBanner.backgroundOpacity ?? 100) / 100) : undefined
                    }}
                  >
                    {/* Background Image */}
                    {newBanner.imageDisplayType !== 'text-only' && (
                      <div className="absolute inset-0">
                        {newBanner.imageDisplayType === 'unsplash' && newBanner.unsplashQuery ? (
                          <img
                            src={`https://picsum.photos/800/400?random=${encodeURIComponent(newBanner.unsplashQuery)}`}
                            alt="Unsplash background"
                            className="w-full h-full object-cover"
                            style={{ opacity: ((newBanner.backgroundOpacity ?? 100) / 100) }}
                            onError={(e) => {
                              // Fallback to a working placeholder
                              e.currentTarget.src = 'https://picsum.photos/800/400?random=1';
                            }}
                          />
                        ) : newBanner.imageDisplayType === 'image' && newBanner.imageUrl ? (
                          <img
                            src={newBanner.imageUrl}
                            alt="Custom background"
                            className="w-full h-full object-cover"
                            style={{ opacity: ((newBanner.backgroundOpacity ?? 100) / 100) }}
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/800x400/6B7280/FFFFFF?text=Image+Not+Found';
                            }}
                          />
                        ) : null}
                      </div>
                    )}
                    
                    {/* Content Overlay */}
                    <div className="relative z-10 text-center px-6">
                      {/* Icon Above Title */}
                      {newBanner.iconType !== 'none' && newBanner.icon && newBanner.iconPosition === 'top' && (
                        <div className="mb-3">
                          {newBanner.iconType === 'emoji' ? (
                            <span className="text-4xl">{newBanner.icon}</span>
                          ) : (
                            <i className={`${newBanner.icon} text-3xl`}></i>
                          )}
                        </div>
                      )}
                      
                      {/* Title with Side Icons */}
                      <h2 className={`text-2xl mb-2 flex items-center justify-center gap-3 ${
                        newBanner.textStyle === 'gradient' ? newBanner.textGradient : ''
                      }`}>
                        {/* Left Icon */}
                        {newBanner.iconType !== 'none' && newBanner.icon && newBanner.iconPosition === 'left' && (
                          <span className="flex-shrink-0">
                            {newBanner.iconType === 'emoji' ? (
                              <span className="text-2xl">{newBanner.icon}</span>
                            ) : (
                              <i className={`${newBanner.icon} text-xl`}></i>
                            )}
                          </span>
                        )}
                        
                        <span>{newBanner.title || 'Banner Title'}</span>
                        
                        {/* Right Icon */}
                        {newBanner.iconType !== 'none' && newBanner.icon && newBanner.iconPosition === 'right' && (
                          <span className="flex-shrink-0">
                            {newBanner.iconType === 'emoji' ? (
                              <span className="text-2xl">{newBanner.icon}</span>
                            ) : (
                              <i className={`${newBanner.icon} text-xl`}></i>
                            )}
                          </span>
                        )}
                      </h2>
                      {newBanner.subtitle && (
                        <p className={`text-lg opacity-90 mb-4 ${
                          newBanner.textStyle === 'gradient' ? newBanner.textGradient : ''
                        }`}>
                          {newBanner.subtitle}
                        </p>
                      )}
                      
                      {/* Multiple Buttons */}
                      {newBanner.buttons.filter(btn => btn.text.trim()).length > 0 && (
                        <div className="flex flex-wrap gap-3 justify-center">
                          {newBanner.buttons.filter(btn => btn.text.trim()).map((button, index) => {
                            const getButtonClasses = (style: string) => {
                              switch (style) {
                                case 'primary':
                                  return 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all';
                                case 'secondary':
                                  return 'px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all';
                                case 'outline':
                                  return 'px-4 py-2 bg-transparent border-2 border-current rounded-lg hover:bg-white hover:bg-opacity-20 transition-all';
                                default:
                                  return 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all';
                              }
                            };
                            
                            return (
                              <button 
                                key={index}
                                className={getButtonClasses(button.style || 'primary')}
                                style={button.style === 'outline' ? { color: newBanner.textColor, borderColor: newBanner.textColor } : undefined}
                              >
                                {button.text}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Legacy single button fallback */}
                      {newBanner.buttonText && newBanner.buttons.filter(btn => btn.text.trim()).length === 0 && (
                        <button 
                          className="px-4 py-2 bg-white bg-opacity-20 rounded-lg border border-current hover:bg-opacity-30 transition-all"
                          style={{ color: newBanner.textColor }}
                        >
                          {newBanner.buttonText}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Preview Info */}
                  <div className="p-3 bg-gray-50 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-4">
                      <span>Display: {imageDisplayTypes.find(t => t.value === newBanner.imageDisplayType)?.label}</span>
                      <span>Font: {fontFamilies.find(f => f.value === newBanner.fontFamily)?.label}</span>
                      <span>Weight: {fontWeights.find(w => w.value === newBanner.fontWeight)?.label}</span>
                      <span>Background: {newBanner.backgroundStyle === 'gradient' ? 'Gradient' : newBanner.backgroundStyle === 'palette' ? 'Color Palette' : 'Solid Color'}</span>
                      <span>Text: {newBanner.textStyle === 'gradient' ? 'Gradient' : newBanner.textStyle === 'palette' ? 'Color Palette' : 'Solid Color'}</span>
                      <span>Buttons: {newBanner.buttons.filter(btn => btn.text.trim()).length}</span>
                      {newBanner.imageDisplayType === 'unsplash' && newBanner.unsplashQuery && (
                        <span>Query: "{newBanner.unsplashQuery}"</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createBannerMutation.isPending || updateBannerMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingBannerId ? 'Update Banner' : 'Create Banner'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingBanner(false);
                    setEditingBannerId(null);
                    setNewBanner({
                      title: '',
                      subtitle: '',
                      imageUrl: '',
                      linkUrl: '',
                      buttonText: '',
                      buttons: [{ text: '', url: '', style: 'primary' }],
                      page: 'home',
                      isActive: true,
                      imageDisplayType: 'image',
                      unsplashQuery: '',
                      fontFamily: 'font-sans',
                      fontWeight: 'font-bold',
                      textColor: '#ffffff',
                      textGradient: 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
                      textStyle: 'solid',
                      backgroundColor: '#1f2937',
                      backgroundGradient: 'bg-gradient-to-r from-blue-600 to-purple-600',
                      useGradient: false,
                      backgroundStyle: 'solid',
                    });
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Hardcoded Banners Section */}
      {hardcodedBanners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Static {dynamicPages.find(p => p.value === selectedPage)?.label} Banners
              <Badge variant="outline">{hardcodedBanners.length}</Badge>
            </CardTitle>
            <CardDescription>
              These are hardcoded banners currently displayed on the page. Click "Make Editable" to convert them to manageable banners.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hardcodedBanners.map((banner: any, index: number) => (
                <div key={`hardcoded-${banner.id}`} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-12 rounded overflow-hidden bg-gray-100">
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-banner.jpg';
                        }}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{banner.title}</h3>
                        <Badge variant="secondary">Hardcoded</Badge>
                      </div>
                      {banner.subtitle && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{banner.subtitle}</p>
                      )}
                      {banner.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{banner.description}</p>
                      )}
                      {banner.ctaLink && (
                        <div className="flex items-center gap-1 mt-1">
                          <Link className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 truncate">{banner.ctaLink}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStaticBanner(banner.id)}
                        className={hiddenStaticBanners.has(banner.id) ? 'text-gray-500' : 'text-green-600'}
                      >
                        {hiddenStaticBanners.has(banner.id) ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => makeEditable(banner)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Make Editable
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Banners List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Dynamic {dynamicPages.find(p => p.value === selectedPage)?.label} Banners
            <Badge variant="secondary">{filteredBanners.length}</Badge>
          </CardTitle>
          <CardDescription>
            {filteredBanners.length > 1 
              ? 'Multiple banners will slide automatically' 
              : filteredBanners.length === 1 
                ? 'Single banner will stay static' 
                : 'No banners configured for this page'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading banners...</p>
            </div>
          ) : filteredBanners.length === 0 ? (
            <div className="text-center py-8">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No banners found for {dynamicPages.find(p => p.value === selectedPage)?.label}</p>
              <Button
                onClick={() => setIsAddingBanner(true)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Banner
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="banners">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {filteredBanners.map((banner: Banner, index: number) => (
                      <Draggable key={banner.id} draggableId={banner.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border rounded-lg p-4 bg-white dark:bg-gray-800 ${
                              snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div {...provided.dragHandleProps} className="cursor-move">
                                <div className="flex flex-col gap-1">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                </div>
                              </div>
                              
                              <div className="w-20 h-12 rounded overflow-hidden bg-gray-100">
                                <img
                                  src={banner.imageUrl}
                                  alt={banner.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder-banner.jpg';
                                  }}
                                />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900 dark:text-white">{banner.title}</h3>
                                  <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                                    {banner.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                {banner.subtitle && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{banner.subtitle}</p>
                                )}
                                {banner.linkUrl && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Link className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-500 truncate">{banner.linkUrl}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleBannerStatus(banner)}
                                  disabled={updateBannerMutation.isPending}
                                >
                                  {banner.isActive ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(banner)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(banner.id)}
                                  disabled={deleteBannerMutation.isPending}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Banner Preview Modal */}
      {previewBanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Banner Preview</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewBanner(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={previewBanner.imageUrl}
                  alt={previewBanner.title}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-center text-white">
                    <h4 className="text-2xl font-bold mb-2">{previewBanner.title}</h4>
                    {previewBanner.subtitle && (
                      <p className="text-lg mb-4">{previewBanner.subtitle}</p>
                    )}
                    {previewBanner.buttonText && (
                      <Button className="bg-white text-black hover:bg-gray-100">
                        {previewBanner.buttonText}
                      </Button>
                    )}
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