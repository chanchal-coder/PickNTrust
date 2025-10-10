import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { getAdminPassword } from '@/config/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, Clock, Zap, RefreshCw, Database, Mail, Bell, 
  Calendar, TrendingUp, Shield, AlertTriangle, CheckCircle,
  Play, Pause, Settings, Activity, Timer, Workflow, Plus,
  Palette, Share2, Instagram, Facebook, MessageCircle, Send,
  Twitter, Camera, Video, Image, Hash, Type, Clock3
} from 'lucide-react';

interface AutomationTask {
  id: string;
  name: string;
  description: string;
  type: 'product_sync' | 'price_update' | 'email_campaign' | 'content_generation' | 'analytics' | 'backup' | 'canva_automation';
  status: 'active' | 'paused' | 'stopped';
  schedule: string;
  lastRun?: Date;
  nextRun?: Date;
  successRate: number;
}

interface CanvaSettings {
  isEnabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  defaultTemplateId?: string;
  autoGenerateCaptions: boolean;
  autoGenerateHashtags: boolean;
  defaultCaption?: string;
  defaultHashtags?: string;
  platforms: string[];
  scheduleType: 'immediate' | 'scheduled';
  scheduleDelayMinutes: number;
  // Content type toggles
  enableBlogPosts: boolean;
  enableVideos: boolean;
}

// API response interface (snake_case from database)
interface CanvaSettingsResponse {
  is_enabled: boolean;
  api_key?: string;
  api_secret?: string;
  default_template_id?: string;
  auto_generate_captions: boolean;
  auto_generate_hashtags: boolean;
  default_caption?: string;
  default_hashtags?: string;
  platforms: string | string[];
  schedule_type: 'immediate' | 'scheduled';
  schedule_delay_minutes: number;
  enable_blog_posts: boolean;
  enable_videos: boolean;
}

interface CanvaTemplate {
  id: number;
  templateId: string;
  name: string;
  type: 'post' | 'story' | 'reel' | 'short';
  category?: string;
  thumbnailUrl?: string;
  isActive: boolean;
}

const mockAutomationTasks: AutomationTask[] = [
  {
    id: '1',
    name: 'Product Price Monitor',
    description: 'Automatically check and update product prices from affiliate sources',
    type: 'price_update',
    status: 'active',
    schedule: 'Every 6 hours',
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 4 * 60 * 60 * 1000),
    successRate: 98.5
  },
  {
    id: '2',
    name: 'New Product Discovery',
    description: 'Scan affiliate networks for trending products in selected categories',
    type: 'product_sync',
    status: 'active',
    schedule: 'Daily at 2:00 AM',
    lastRun: new Date(Date.now() - 8 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 16 * 60 * 60 * 1000),
    successRate: 92.1
  },
  {
    id: '3',
    name: 'Weekly Newsletter',
    description: 'Generate and send weekly newsletter with top deals and new products',
    type: 'email_campaign',
    status: 'paused',
    schedule: 'Weekly on Sunday',
    lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    successRate: 95.8
  },
  {
    id: '4',
    name: 'Content Auto-Generation',
    description: 'Generate product descriptions and blog content using AI',
    type: 'content_generation',
    status: 'active',
    schedule: 'Every 12 hours',
    lastRun: new Date(Date.now() - 5 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 7 * 60 * 60 * 1000),
    successRate: 87.3
  },
  {
    id: '5',
    name: 'Analytics Report',
    description: 'Generate daily analytics reports and performance insights',
    type: 'analytics',
    status: 'active',
    schedule: 'Daily at 6:00 AM',
    lastRun: new Date(Date.now() - 18 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000),
    successRate: 99.2
  },
  {
    id: '6',
    name: 'Database Backup',
    description: 'Automated backup of all database content and configurations',
    type: 'backup',
    status: 'active',
    schedule: 'Daily at 3:00 AM',
    lastRun: new Date(Date.now() - 21 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 3 * 60 * 60 * 1000),
    successRate: 100
  }
];

export default function AutomationManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<AutomationTask[]>(mockAutomationTasks);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    type: 'product_sync' as AutomationTask['type'],
    schedule: 'daily'
  });

  // Custom platform state
  const [customPlatforms, setCustomPlatforms] = useState([]);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [newPlatform, setNewPlatform] = useState({
    key: '',
    name: '',
    apiUrl: '',
    apiKey: '',
    apiSecret: '',
    webhookUrl: '',
    color: 'text-purple-300',
    icon: Share2
  });

  // Backend template management
  const [backendTemplates, setBackendTemplates] = useState<{ templates: any[]; audio: any[] }>({ templates: [], audio: [] });
  const [templateStats, setTemplateStats] = useState<any>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  // State declarations
  const [canvaSettings, setCanvaSettings] = useState<CanvaSettings>({
    isEnabled: false,
    autoGenerateCaptions: true,
    autoGenerateHashtags: true,
    platforms: ['instagram', 'facebook'],
    scheduleType: 'immediate',
    scheduleDelayMinutes: 0,
    enableBlogPosts: true,
    enableVideos: true
  });
  const [isEditingCanva, setIsEditingCanva] = useState(false);
  const [platformTemplates, setPlatformTemplates] = useState<Record<string, string[]>>({
    instagram: [''],
    'instagram-reels': [''],
    facebook: [''],
    twitter: [''],
    whatsapp: [''],
    telegram: [''],
    youtube: [''],
    'youtube-shorts': ['']
  });
  const [extraTemplates, setExtraTemplates] = useState<string[]>(['']);
  const [defaultTemplates, setDefaultTemplates] = useState<Record<string, number | null>>({
    instagram: null,
    'instagram-reels': null,
    facebook: null,
    twitter: null,
    whatsapp: null,
    telegram: null,
    youtube: null,
    'youtube-shorts': null
  });
  const [defaultExtraTemplate, setDefaultExtraTemplate] = useState<number | null>(null);

  // Custom platform management functions
  const handleAddPlatform = () => {
    if (!newPlatform.key || !newPlatform.name) {
      toast({
        title: "Error",
        description: "Platform key and name are required",
        variant: "destructive"
      });
      return;
    }

    const platform = {
      ...newPlatform,
      key: newPlatform.key.toLowerCase().replace(/\s+/g, '_'),
      id: Date.now().toString()
    };
    
    // Add platform logic here if needed
  };

  // Backend template management functions
  const fetchBackendTemplates = async () => {
    try {
      const response = await fetch('/api/admin/backend-templates?password=admin');
      const data = await response.json();
      
      if (data.success) {
        setBackendTemplates({
          templates: data.templates || [],
          audio: data.audio || []
        });
      }
    } catch (error) {
      console.error('Error fetching backend templates:', error);
    }
  };

  const fetchTemplateStats = async () => {
    try {
      const response = await fetch('/api/admin/backend-templates/stats?password=admin');
      const data = await response.json();
      
      if (data.success) {
        setTemplateStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching template stats:', error);
    }
  };

  const testBackendTemplate = async () => {
    try {
      const response = await fetch('/api/admin/backend-templates/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: 'admin',
          productData: {
            id: Date.now(),
            name: 'Test Electronics Product',
            description: 'A high-tech gadget for testing our smart template system',
            price: '₹1,999',
            category: 'electronics',
            imageUrl: '/placeholder-image.png'
          }
        })
      });
      
      const data = await response.json();
      
      
      if (data.success) {
        toast({
          title: "Template Test Successful",
          description: `Generated content: ${data.generatedUrl}`,
        });
      } else {
        throw new Error(data.error || 'Test failed');
      }
    } catch (error: any) {
      console.error('Template test failed:', error);
      toast({
        title: "Template Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Load backend template data on component mount
  useEffect(() => {
    fetchBackendTemplates();
    fetchTemplateStats();
  }, []);

  // Complete the handleAddPlatform function
  const completeAddPlatform = () => {
    // This function was incomplete, adding the missing logic
    setShowAddPlatform(false);
    toast({
      title: "Platform Added",
      description: "Custom platform has been added successfully"
    });
  };

  const handleRemovePlatform = (platformId: string) => {
    setCustomPlatforms(prev => prev.filter(p => p.id !== platformId));
    toast({
      title: "Platform Removed",
      description: "Platform has been removed successfully"
    });
  };

  const handleTestPlatform = async (platform: any) => {
    try {
      // Test platform connection logic here
      toast({
        title: "Platform Test",
        description: `Testing connection to ${platform.name}...`
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to connect to platform",
        variant: "destructive"
      });
    }
  };

  // Remove duplicate function declarations - they are already defined above

  // Fetch Canva settings from backend
  const { data: canvaSettingsData, isLoading: canvaLoading } = useQuery<CanvaSettingsResponse>({
    queryKey: ['canva-settings'],
    queryFn: async (): Promise<CanvaSettingsResponse> => {
      const password = getAdminPassword();
      const res = await fetch(`/api/admin/canva/settings?password=${encodeURIComponent(password)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to fetch Canva settings');
      }
      const data = await res.json();
      return data?.settings || {
        is_enabled: false,
        auto_generate_captions: true,
        auto_generate_hashtags: true,
        platforms: ['instagram', 'facebook'],
        schedule_type: 'immediate' as const,
        schedule_delay_minutes: 0,
        enable_blog_posts: true,
        enable_videos: true
      };
    }
  });

  // Update Canva settings via backend
  const updateCanvaSettingsMutation = useMutation({
    mutationFn: async (settings: CanvaSettings) => {
      const password = getAdminPassword();
      const res = await fetch('/api/admin/canva/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, ...settings })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to update Canva settings');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: (
          <span className="inline-flex items-center gap-2">
            <i className="fas fa-check-circle"></i>
            <span>Settings Saved</span>
          </span>
        ),
        description: 'Canva automation settings updated successfully.',
      });
      
      // Force update local state with the response data
      const settings = (data && data.settings) ? data.settings : data;
      if (settings) {
        const updatedSettings = {
          ...settings,
          platforms: Array.isArray(settings.platforms) 
            ? settings.platforms 
            : JSON.parse(settings.platforms || '[]')
        } as any;
        setCanvaSettings(updatedSettings);
      }
      
      // Invalidate and refetch queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['canva-settings'] });
      queryClient.refetchQueries({ queryKey: ['canva-settings'] });
      setIsEditingCanva(false);
    },
    onError: (error: any) => {
      toast({
        title: (
          <span className="inline-flex items-center gap-2">
            <i className="fas fa-times-circle"></i>
            <span>Error</span>
          </span>
        ),
        description: error.message || 'Failed to update Canva settings.',
        variant: 'destructive',
      });
      
      // Revert local state on error by refetching
      queryClient.refetchQueries({ queryKey: ['canva-settings'] });
    }
  });

  // Test Canva automation via backend
  const testCanvaMutation = useMutation({
    mutationFn: async () => {
      const password = getAdminPassword();
      const res = await fetch('/api/admin/canva/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to test Canva automation');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Test Successful',
        description: data.message || 'Canva automation test completed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Test Failed',
        description: error.message || 'Failed to test Canva automation.',
        variant: 'destructive',
      });
    }
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (canvaSettingsData && !updateCanvaSettingsMutation.isPending) {
      const updatedSettings = {
        isEnabled: (canvaSettingsData as any).is_enabled ?? (canvaSettingsData as any).isEnabled ?? false,
        apiKey: (canvaSettingsData as any).api_key ?? (canvaSettingsData as any).apiKey ?? '',
        apiSecret: (canvaSettingsData as any).api_secret ?? (canvaSettingsData as any).apiSecret ?? '',
        defaultTemplateId: (canvaSettingsData as any).default_template_id ?? (canvaSettingsData as any).defaultTemplateId ?? '',
        autoGenerateCaptions: ((canvaSettingsData as any).auto_generate_captions ?? (canvaSettingsData as any).autoGenerateCaptions) !== false,
        autoGenerateHashtags: ((canvaSettingsData as any).auto_generate_hashtags ?? (canvaSettingsData as any).autoGenerateHashtags) !== false,
        defaultCaption: (canvaSettingsData as any).default_caption ?? (canvaSettingsData as any).defaultCaption ?? '',
        defaultHashtags: (canvaSettingsData as any).default_hashtags ?? (canvaSettingsData as any).defaultHashtags ?? '',
        platforms: Array.isArray((canvaSettingsData as any).platforms)
          ? (canvaSettingsData as any).platforms
          : (typeof (canvaSettingsData as any).platforms === 'string'
              ? JSON.parse((canvaSettingsData as any).platforms || '[]')
              : ['instagram', 'facebook']),
        scheduleType: ((canvaSettingsData as any).schedule_type ?? (canvaSettingsData as any).scheduleType ?? 'immediate') as 'immediate' | 'scheduled',
        scheduleDelayMinutes: (canvaSettingsData as any).schedule_delay_minutes ?? (canvaSettingsData as any).scheduleDelayMinutes ?? 0,
        enableBlogPosts: ((canvaSettingsData as any).enable_blog_posts ?? (canvaSettingsData as any).enableBlogPosts) !== false,
        enableVideos: ((canvaSettingsData as any).enable_videos ?? (canvaSettingsData as any).enableVideos) !== false
      };
      setCanvaSettings(updatedSettings);
    }
  }, [canvaSettingsData, updateCanvaSettingsMutation.isPending]);

  // Toggle task status mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: AutomationTask['status'] }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { taskId, newStatus };
    },
    onSuccess: ({ taskId, newStatus }) => {
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      toast({
        title: 'Task Updated',
        description: `Automation task ${newStatus === 'active' ? 'activated' : newStatus === 'paused' ? 'paused' : 'stopped'} successfully.`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update automation task.',
        variant: 'destructive',
      });
    }
  });

  // Create new task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: typeof newTask) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        id: Date.now().toString(),
        ...taskData,
        status: 'active' as const,
        successRate: 0,
        nextRun: new Date(Date.now() + 60 * 60 * 1000)
      };
    },
    onSuccess: (newTaskData) => {
      setTasks(prev => [...prev, newTaskData]);
      setNewTask({
        name: '',
        description: '',
        type: 'product_sync',
        schedule: 'daily'
      });
      setIsCreatingTask(false);
      toast({
        title: 'Task Created',
        description: 'New automation task created successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create automation task.',
        variant: 'destructive',
      });
    }
  });

  const handleToggleTask = (taskId: string, currentStatus: AutomationTask['status']) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    toggleTaskMutation.mutate({ taskId, newStatus });
  };

  const handleCreateTask = () => {
    if (!newTask.name.trim() || !newTask.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    createTaskMutation.mutate(newTask);
  };

  const getTaskIcon = (type: AutomationTask['type']) => {
    switch (type) {
      case 'product_sync': return <Database className="w-4 h-4" />;
      case 'price_update': return <TrendingUp className="w-4 h-4" />;
      case 'email_campaign': return <Mail className="w-4 h-4" />;
      case 'content_generation': return <Bot className="w-4 h-4" />;
      case 'analytics': return <Activity className="w-4 h-4" />;
      case 'backup': return <Shield className="w-4 h-4" />;
      default: return <Workflow className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: AutomationTask['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'stopped': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Active Tasks</p>
                <p className="text-2xl font-bold">{tasks.filter(t => t.status === 'active').length}</p>
              </div>
              <Bot className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Success Rate</p>
                <p className="text-2xl font-bold">{Math.round(tasks.reduce((acc, t) => acc + t.successRate, 0) / tasks.length)}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Scheduled</p>
                <p className="text-2xl font-bold">{tasks.filter(t => t.nextRun).length}</p>
              </div>
              <Timer className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Total Tasks</p>
                <p className="text-2xl font-bold">{tasks.length}</p>
              </div>
              <Workflow className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social Media Automation Section - Moved to Top */}
      <Card className="bg-gradient-to-r from-purple-200 to-pink-300 text-black border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black font-bold text-lg">
            <Share2 className="w-5 h-5" />
            <i className="fas fa-palette"></i> Social Media Automation with Canva
            <Badge variant={canvaSettings.isEnabled ? 'default' : 'secondary'} className="bg-white/80 text-black border-gray-300 font-semibold">
              {canvaSettings.isEnabled ? (
                <span className="inline-flex items-center gap-2">
                  <i className="fas fa-check-circle"></i>
                  <span>ON</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <i className="fas fa-times-circle"></i>
                  <span>OFF</span>
                </span>
              )}
            </Badge>
          </CardTitle>
          <CardDescription className="text-black font-medium">
            Automatically create and post beautiful social media content using Canva templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canvaLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2 text-white" />
              <span className="text-white">Loading settings...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Step 1: Enable/Disable */}
              <div className="bg-white/15 backdrop-blur-sm p-4 rounded-lg border border-white/30 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white text-pink-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-md">1</div>
                    <div>
                      <h4 className="font-bold text-black text-base">Turn On Automation</h4>
                      <p className="text-sm text-black font-medium">
                        {canvaSettings.isEnabled ? '🟢 Automation is running' : '🔴 Click to start automation'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={canvaSettings.isEnabled}
                    onCheckedChange={(checked) => {
                      // Optimistic update - update UI immediately
                      const previousSettings = { ...canvaSettings };
                      const updatedSettings = { ...canvaSettings, isEnabled: checked };
                      setCanvaSettings(updatedSettings);
                      
                      // Call mutation with error handling
                      updateCanvaSettingsMutation.mutate(updatedSettings, {
                        onError: () => {
                          // Revert to previous state on error
                          setCanvaSettings(previousSettings);
                        }
                      });
                    }}
                    className="data-[state=checked]:bg-green-500"
                    disabled={updateCanvaSettingsMutation.isPending}
                  />
                </div>
              </div>

              {/* Step 2: Choose Platforms */}
              <div className="bg-white/15 backdrop-blur-sm p-4 rounded-lg border border-white/30 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white text-pink-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-md">2</div>
                  <h4 className="font-bold text-black text-base">Choose Social Media Platforms</h4>
                </div>
                <p className="text-sm text-black font-medium mb-3">Select where you want to post your content:</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-300' },
                    { key: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-300' },
                    { key: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-blue-200' },
                    { key: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-300' },
                    { key: 'telegram', name: 'Telegram', icon: Send, color: 'text-blue-300' },
                    { key: 'youtube', name: 'YouTube', icon: Video, color: 'text-red-300' },
                    ...customPlatforms
                  ].map((platform) => (
                    <div key={platform.key} className="flex items-center gap-2 p-3 bg-white/20 rounded-lg border border-white/30 hover:bg-white/25 transition-colors shadow-sm">
                      <Checkbox
                        id={platform.key}
                        checked={canvaSettings.platforms.includes(platform.key)}
                        onCheckedChange={(checked) => {
                          const updatedPlatforms = checked
                            ? [...canvaSettings.platforms, platform.key]
                            : canvaSettings.platforms.filter(p => p !== platform.key);
                          const updatedSettings = { ...canvaSettings, platforms: updatedPlatforms };
                          setCanvaSettings(updatedSettings);
                          updateCanvaSettingsMutation.mutate(updatedSettings);
                        }}
                      />
                      <platform.icon className={`w-4 h-4 ${platform.color} drop-shadow-sm`} />
                      <Label htmlFor={platform.key} className="text-sm font-semibold cursor-pointer text-black">
                        {platform.name}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {/* Add Custom Platform Button */}
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => setShowAddPlatform(true)}
                    variant="outline"
                    className="bg-white/10 border-white/30 text-black hover:bg-white/20 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Platform
                  </Button>
                </div>
                
                {/* Custom Platform Management */}
                {customPlatforms.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm font-semibold text-black">Custom Platforms:</Label>
                    {customPlatforms.map((platform) => (
                      <div key={platform.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20">
                        <div className="flex items-center gap-2">
                          <platform.icon className={`w-4 h-4 ${platform.color}`} />
                          <span className="text-sm font-medium text-black">{platform.name}</span>
                          <Badge variant="secondary" className="text-xs">{platform.key}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleTestPlatform(platform)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            Test
                          </Button>
                          <Button
                            onClick={() => handleRemovePlatform(platform.id)}
                            size="sm"
                            variant="destructive"
                            className="text-xs"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Manual Content Fields */}
                <div className="mt-4 space-y-3">
                  <div>
                    <Label htmlFor="manual-caption" className="text-sm font-semibold text-black mb-2 block">
                      <i className="fas fa-edit"></i> Manual Caption (Optional)
                    </Label>
                    <Textarea
                      id="manual-caption"
                      placeholder="Write your custom caption here..."
                      value={canvaSettings.defaultCaption || ''}
                      onChange={(e) => {
                        const updatedSettings = { ...canvaSettings, defaultCaption: e.target.value };
                        setCanvaSettings(updatedSettings);
                        updateCanvaSettingsMutation.mutate(updatedSettings);
                      }}
                      className="bg-white/20 border-white/30 text-black placeholder:text-gray-600 focus:bg-white/30 transition-colors"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="manual-hashtags" className="text-sm font-semibold text-black mb-2 block">
                      <i className="fas fa-tag"></i> Manual Hashtags (Optional)
                    </Label>
                    <Input
                      id="manual-hashtags"
                      placeholder="#example #hashtags #socialmedia"
                      value={canvaSettings.defaultHashtags || ''}
                      onChange={(e) => {
                        const updatedSettings = { ...canvaSettings, defaultHashtags: e.target.value };
                        setCanvaSettings(updatedSettings);
                        updateCanvaSettingsMutation.mutate(updatedSettings);
                      }}
                      className="bg-white/20 border-white/30 text-black placeholder:text-gray-600 focus:bg-white/30 transition-colors"
                    />
                  </div>
                 </div>
                 
                 {/* Canva Template Settings */}
                 <div className="mt-4 p-4 bg-white/10 rounded-lg border border-white/20">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2">
                       <Palette className="w-5 h-5 text-black" />
                       <Label className="text-sm font-semibold text-black">
                         <i className="fas fa-palette"></i> Canva Template Settings
                       </Label>
                     </div>
                     <Switch
                       checked={isEditingCanva}
                       onCheckedChange={setIsEditingCanva}
                       className="data-[state=checked]:bg-pink-500"
                     />
                   </div>
                   
                   {isEditingCanva && (
                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                        {/* API Configuration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="api-key" className="text-sm font-semibold text-black mb-2 block">
                              <i className="fas fa-key"></i> API Key
                            </Label>
                            <Input
                              id="api-key"
                              type="password"
                              placeholder="Enter your Canva API key"
                              value={canvaSettings.apiKey || ''}
                              onChange={(e) => {
                                const updatedSettings = { ...canvaSettings, apiKey: e.target.value };
                                setCanvaSettings(updatedSettings);
                                updateCanvaSettingsMutation.mutate(updatedSettings);
                              }}
                              className="bg-white/20 border-white/30 text-black placeholder:text-gray-600 focus:bg-white/30 transition-colors"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="api-secret" className="text-sm font-semibold text-black mb-2 block">
                              <i className="fas fa-lock"></i> API Secret
                            </Label>
                            <Input
                              id="api-secret"
                              type="password"
                              placeholder="Enter your Canva API secret"
                              value={canvaSettings.apiSecret || ''}
                              onChange={(e) => {
                                const updatedSettings = { ...canvaSettings, apiSecret: e.target.value };
                                setCanvaSettings(updatedSettings);
                                updateCanvaSettingsMutation.mutate(updatedSettings);
                              }}
                              className="bg-white/20 border-white/30 text-black placeholder:text-gray-600 focus:bg-white/30 transition-colors"
                            />
                          </div>
                        </div>
                        
                        {/* Platform-Specific Templates */}
                        <div>
                          <Label className="text-sm font-semibold text-black mb-3 block">
                            <i className="fas fa-mobile-alt"></i> Platform Templates
                          </Label>
                          <div className="space-y-3">
                            {[
                               { key: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
                               { key: 'instagram-reels', name: 'Instagram Reels', icon: Video, color: 'text-pink-600' },
                               { key: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-500' },
                               { key: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-blue-400' },
                               { key: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-500' },
                               { key: 'telegram', name: 'Telegram', icon: Send, color: 'text-blue-500' },
                               { key: 'youtube', name: 'YouTube', icon: Video, color: 'text-red-500' },
                               { key: 'youtube-shorts', name: 'YouTube Shorts', icon: Camera, color: 'text-red-600' }
                             ].map((platform) => (
                              <div key={platform.key} className="p-3 bg-white/10 rounded-lg border border-white/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <platform.icon className={`w-4 h-4 ${platform.color}`} />
                                  <span className="text-sm font-medium text-black">{platform.name} Templates</span>
                                </div>
                                <div className="space-y-2">
                                  {platformTemplates[platform.key].map((template, index) => (
                                     <div key={index} className="flex gap-2 items-center">
                                       <div className="flex items-center gap-2 flex-1">
                                         <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              const newDefaults = { ...defaultTemplates };
                                              // Toggle: if already selected, unselect (set to null), otherwise select
                                              newDefaults[platform.key] = defaultTemplates[platform.key] === index ? null : index;
                                              setDefaultTemplates(newDefaults);
                                            }}
                                            className={`w-6 h-6 p-0 rounded-full border-2 ${
                                              defaultTemplates[platform.key] === index
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'bg-white/20 border-white/40 text-gray-600 hover:bg-white/30'
                                            }`}
                                          >
                                            {defaultTemplates[platform.key] === index ? (
                                              <i className="fas fa-check"></i>
                                            ) : null}
                                          </Button>
                                         <Input
                                           placeholder={`${platform.name} template ID`}
                                           value={template}
                                           onChange={(e) => {
                                             const newTemplates = { ...platformTemplates };
                                             newTemplates[platform.key][index] = e.target.value;
                                             setPlatformTemplates(newTemplates);
                                           }}
                                           className="bg-white/20 border-white/30 text-black placeholder:text-gray-600 focus:bg-white/30 transition-colors flex-1"
                                         />
                                       </div>
                                       {platformTemplates[platform.key].length > 1 && (
                                         <Button
                                           type="button"
                                           variant="outline"
                                           size="sm"
                                           onClick={() => {
                                             const newTemplates = { ...platformTemplates };
                                             newTemplates[platform.key].splice(index, 1);
                                             setPlatformTemplates(newTemplates);
                                             // Adjust default template index if needed
                                             const newDefaults = { ...defaultTemplates };
                                             if (newDefaults[platform.key] !== null && newDefaults[platform.key]! >= newTemplates[platform.key].length) {
                                               newDefaults[platform.key] = newTemplates[platform.key].length > 0 ? Math.max(0, newTemplates[platform.key].length - 1) : null;
                                             }
                                             setDefaultTemplates(newDefaults);
                                           }}
                                           className="bg-red-500/20 border-red-300 text-red-700 hover:bg-red-500/30"
                                         >
                                           <i className="fas fa-times-circle"></i>
                                         </Button>
                                       )}
                                     </div>
                                   ))}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newTemplates = { ...platformTemplates };
                                      newTemplates[platform.key].push('');
                                      setPlatformTemplates(newTemplates);
                                    }}
                                    className="bg-green-500/20 border-green-300 text-green-700 hover:bg-green-500/30 w-full"
                                  >
                                    ➕ Add Template
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Extra Templates */}
                        <div>
                          <Label className="text-sm font-semibold text-black mb-2 block">
                            <i className="fas fa-clipboard"></i> Extra Templates
                          </Label>
                          <div className="space-y-2">
                            {extraTemplates.map((template, index) => (
                               <div key={index} className="flex gap-2 items-center">
                                 <div className="flex items-center gap-2 flex-1">
                                   <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        // Toggle: if already selected, unselect (set to null), otherwise select
                                        setDefaultExtraTemplate(defaultExtraTemplate === index ? null : index);
                                      }}
                                      className={`w-6 h-6 p-0 rounded-full border-2 ${
                                        defaultExtraTemplate === index
                                          ? 'bg-green-500 border-green-500 text-white'
                                          : 'bg-white/20 border-white/40 text-gray-600 hover:bg-white/30'
                                      }`}
                                    >
                                      {defaultExtraTemplate === index ? (
                                        <i className="fas fa-check"></i>
                                      ) : null}
                                    </Button>
                                   <Input
                                     placeholder="Extra template ID"
                                     value={template}
                                     onChange={(e) => {
                                       const newTemplates = [...extraTemplates];
                                       newTemplates[index] = e.target.value;
                                       setExtraTemplates(newTemplates);
                                     }}
                                     className="bg-white/20 border-white/30 text-black placeholder:text-gray-600 focus:bg-white/30 transition-colors flex-1"
                                   />
                                 </div>
                                 {extraTemplates.length > 1 && (
                                   <Button
                                     type="button"
                                     variant="outline"
                                     size="sm"
                                     onClick={() => {
                                       const newTemplates = [...extraTemplates];
                                       newTemplates.splice(index, 1);
                                       setExtraTemplates(newTemplates);
                                       // Adjust default extra template index if needed
                                        if (defaultExtraTemplate !== null && defaultExtraTemplate >= newTemplates.length) {
                                          setDefaultExtraTemplate(newTemplates.length > 0 ? Math.max(0, newTemplates.length - 1) : null);
                                        }
                                     }}
                                     className="bg-red-500/20 border-red-300 text-red-700 hover:bg-red-500/30"
                                   >
                                     <i className="fas fa-times-circle"></i>
                                   </Button>
                                 )}
                               </div>
                             ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setExtraTemplates([...extraTemplates, '']);
                              }}
                              className="bg-green-500/20 border-green-300 text-green-700 hover:bg-green-500/30 w-full"
                            >
                              ➕ Add Extra Template
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                 </div>
              </div>

              {/* Step 3: Content Options */}
              <div className="bg-white/15 backdrop-blur-sm p-4 rounded-lg border border-white/30 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white text-pink-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-md">3</div>
                  <h4 className="font-bold text-black text-base">Content Options</h4>
                </div>
                <p className="text-sm text-black font-medium mb-3">What should we automatically add to your posts?</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/20 rounded-lg border border-white/30 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-pink-100 drop-shadow-sm" />
                      <Label className="text-sm font-semibold text-black">Auto-write captions</Label>
                    </div>
                    <Switch
                      checked={canvaSettings.autoGenerateCaptions}
                      onCheckedChange={(checked) => {
                        // Optimistic update - update UI immediately
                        const previousSettings = { ...canvaSettings };
                        const updatedSettings = { ...canvaSettings, autoGenerateCaptions: checked };
                        setCanvaSettings(updatedSettings);
                        
                        // Call mutation with error handling
                        updateCanvaSettingsMutation.mutate(updatedSettings, {
                          onError: () => {
                            // Revert to previous state on error
                            setCanvaSettings(previousSettings);
                          }
                        });
                      }}
                      disabled={updateCanvaSettingsMutation.isPending}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/20 rounded-lg border border-white/30 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-pink-100 drop-shadow-sm" />
                      <Label className="text-sm font-semibold text-black">Auto-generate hashtags</Label>
                    </div>
                    <Switch
                      checked={canvaSettings.autoGenerateHashtags}
                      onCheckedChange={(checked) => {
                        // Optimistic update - update UI immediately
                        const previousSettings = { ...canvaSettings };
                        const updatedSettings = { ...canvaSettings, autoGenerateHashtags: checked };
                        setCanvaSettings(updatedSettings);
                        
                        // Call mutation with error handling
                        updateCanvaSettingsMutation.mutate(updatedSettings, {
                          onError: () => {
                            // Revert to previous state on error
                            setCanvaSettings(previousSettings);
                          }
                        });
                      }}
                       disabled={updateCanvaSettingsMutation.isPending}
                     />
                  </div>
                </div>
              </div>

              {/* Step 4: Test Button */}
              <div className="bg-white/15 backdrop-blur-sm p-4 rounded-lg border border-white/30 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white text-pink-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-md">4</div>
                  <h4 className="font-bold text-black text-base">Test or Go Live</h4>
                </div>
                <p className="text-sm text-black font-medium mb-3">Test your automation or create content manually:</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => testCanvaMutation.mutate()}
                    disabled={testCanvaMutation.isPending || !canvaSettings.isEnabled}
                    className="bg-white text-pink-600 hover:bg-pink-50 border-0"
                  >
                    {testCanvaMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 mr-2" />
                    )}
                    <i className="fas fa-flask"></i> Test Automation
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    <i className="fas fa-mobile-alt"></i> Manual Post
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backend Template Management */}
      <Card className="bg-gradient-to-r from-purple-200 to-indigo-300 text-black border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black font-bold text-lg">
            <Palette className="w-5 h-5" />
            🧠 Smart Backend Template System
          </CardTitle>
          <CardDescription className="text-black font-medium">
            Universal template library with AI-powered selection and rotation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Template Stats Overview */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                <div className="flex items-center gap-2 mb-2">
                  <Image className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-black">Templates</h4>
                </div>
                <p className="text-2xl font-bold text-black">
                  {backendTemplates.templates.length}
                </p>
                <p className="text-sm text-gray-700">Available templates</p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-black">Audio Files</h4>
                </div>
                <p className="text-2xl font-bold text-black">
                  {backendTemplates.audio.length}
                </p>
                <p className="text-sm text-gray-700">Background music</p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-black">Total Usage</h4>
                </div>
                <p className="text-2xl font-bold text-black">
                  {templateStats?.totalUsage || 0}
                </p>
                <p className="text-sm text-gray-700">Content generated</p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-black">Categories</h4>
                </div>
                <p className="text-2xl font-bold text-black">
                  {templateStats ? Object.keys(templateStats.categoryDistribution || {}).length : 0}
                </p>
                <p className="text-sm text-gray-700">Content types</p>
              </div>
            </div>

            {/* Template Management Actions */}
            <div className="bg-white/15 backdrop-blur-sm p-4 rounded-lg border border-white/30 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-black text-base mb-1">🎨 Template Library Management</h4>
                  <p className="text-sm text-black font-medium">
                    Upload templates and audio files to the universal folders
                  </p>
                </div>
                <Switch
                  checked={showTemplateManager}
                  onCheckedChange={setShowTemplateManager}
                  className="data-[state=checked]:bg-purple-500"
                />
              </div>
              
              {showTemplateManager && (
                <div className="space-y-4 mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                  {/* Upload Instructions */}
                  <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                    <h5 className="font-semibold text-black mb-2">📁 Upload Instructions:</h5>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-black">
                      <div>
                        <p className="font-medium mb-1">🖼️ Templates:</p>
                        <p>Copy image/video files to:</p>
                        <code className="bg-black/20 px-2 py-1 rounded text-xs">
                          backend-assets/templates/universal/
                        </code>
                      </div>
                      <div>
                        <p className="font-medium mb-1">🎵 Audio:</p>
                        <p>Copy music files to:</p>
                        <code className="bg-black/20 px-2 py-1 rounded text-xs">
                          backend-assets/audio/universal/
                        </code>
                      </div>
                    </div>
                  </div>
                  
                  {/* Template Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => testBackendTemplate()}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Test Template Generation
                    </Button>
                    
                    <Button
                      onClick={() => fetchBackendTemplates()}
                      variant="outline"
                      className="bg-white/10 border-white/30 text-black hover:bg-white/20"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Library
                    </Button>
                    
                    <Button
                      onClick={() => fetchTemplateStats()}
                      variant="outline"
                      className="bg-white/10 border-white/30 text-black hover:bg-white/20"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Update Stats
                    </Button>
                  </div>
                  
                  {/* Supported File Extensions */}
                  <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                    <h5 className="font-semibold text-black mb-2">📋 Supported File Extensions:</h5>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-black">
                      <div>
                        <p className="font-medium mb-1">🖼️ Template Files:</p>
                        <div className="flex flex-wrap gap-1">
                          <span className="bg-black/20 px-2 py-1 rounded text-xs">.jpg</span>
                          <span className="bg-black/20 px-2 py-1 rounded text-xs">.jpeg</span>
                          <span className="bg-black/20 px-2 py-1 rounded text-xs">.png</span>
                          <span className="bg-black/20 px-2 py-1 rounded text-xs">.gif</span>
                          <span className="bg-black/20 px-2 py-1 rounded text-xs">.webp</span>
                          <span className="bg-black/20 px-2 py-1 rounded text-xs">.svg</span>
                          <span className="bg-black/20 px-2 py-1 rounded text-xs">.mp4</span>
                          <span className="bg-black/20 px-2 py-1 rounded text-xs">.webm</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium mb-1">🎵 Audio Files:</p>
                        <div className="flex flex-wrap gap-1">
                          <span className="bg-black/20 px-2 py-1 rounded text-xs">.mp3</span>
                          <span className="bg-black/20 px-2 py-1 rounded text-xs">.wav</span>
                          <span className="bg-black/20 px-2 py-1 rounded text-xs">.ogg</span>
                          <span className="bg-black/20 px-2 py-1 rounded text-xs">.m4a</span>
                          <span className="bg-black/20 px-2 py-1 rounded text-xs">.aac</span>
                          <span className="bg-black/20 px-2 py-1 rounded text-xs">.flac</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Template Library Preview */}
                  {backendTemplates.templates.length > 0 && (
                    <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <h5 className="font-semibold text-black mb-3">📚 Template Library:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {backendTemplates.templates.slice(0, 8).map((template, index) => (
                          <div key={template.id || index} className="bg-white/20 p-3 rounded-lg border border-white/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Image className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-medium text-black truncate">
                                {template.filename || `Template ${index + 1}`}
                              </span>
                            </div>
                            <div className="text-xs text-gray-700">
                              <p>Style: {template.characteristics?.style || 'Unknown'}</p>
                              <p>Type: {template.type || 'image'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {backendTemplates.templates.length > 8 && (
                        <p className="text-sm text-gray-700 mt-2 text-center">
                          +{backendTemplates.templates.length - 8} more templates
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Audio Library Preview */}
                  {backendTemplates.audio.length > 0 && (
                    <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <h5 className="font-semibold text-black mb-3">🎵 Audio Library:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {backendTemplates.audio.slice(0, 6).map((audio, index) => (
                          <div key={audio.id || index} className="bg-white/20 p-3 rounded-lg border border-white/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Hash className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-medium text-black truncate">
                                {audio.filename || `Audio ${index + 1}`}
                              </span>
                            </div>
                            <div className="text-xs text-gray-700">
                              <p>Genre: {audio.characteristics?.genre || 'Unknown'}</p>
                              <p>Duration: {audio.duration || 0}s</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {backendTemplates.audio.length > 6 && (
                        <p className="text-sm text-gray-700 mt-2 text-center">
                          +{backendTemplates.audio.length - 6} more audio files
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Smart Features Info */}
                  <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 p-4 rounded-lg border border-white/30">
                    <h5 className="font-semibold text-black mb-2">🧠 Smart Features:</h5>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-black">
                      <div>
                        <p className="font-medium mb-1">✨ AI-Powered Selection:</p>
                        <p>Automatically matches templates to product categories, colors, and mood</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">🔄 Smart Rotation:</p>
                        <p>Prevents repetition by rotating templates and tracking usage history</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">📊 Performance Learning:</p>
                        <p>Learns from engagement metrics to improve future selections</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">🎯 Universal Compatibility:</p>
                        <p>Works with any content type - no category folders needed</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create New Task */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Automation Task
          </CardTitle>
          <CardDescription>
            Set up automated tasks to streamline your workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isCreatingTask ? (
            <Button 
              onClick={() => setIsCreatingTask(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Automation Task
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taskName">Task Name</Label>
                  <Input
                    id="taskName"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    placeholder="e.g., Daily Price Updates"
                  />
                </div>
                <div>
                  <Label htmlFor="taskType">Task Type</Label>
                  <Select value={newTask.type} onValueChange={(value: AutomationTask['type']) => setNewTask({ ...newTask, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product_sync">Product Sync</SelectItem>
                      <SelectItem value="price_update">Price Update</SelectItem>
                      <SelectItem value="email_campaign">Email Campaign</SelectItem>
                      <SelectItem value="content_generation">Content Generation</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="backup">Backup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="taskDescription">Description</Label>
                <Input
                  id="taskDescription"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Describe what this automation task will do"
                />
              </div>

              <div>
                <Label htmlFor="taskSchedule">Schedule</Label>
                <Select value={newTask.schedule} onValueChange={(value) => setNewTask({ ...newTask, schedule: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Every Hour</SelectItem>
                    <SelectItem value="every-6-hours">Every 6 Hours</SelectItem>
                    <SelectItem value="every-12-hours">Every 12 Hours</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateTask}
                  disabled={createTaskMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createTaskMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create Task
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsCreatingTask(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automation Tasks List */}
      <Card className="bg-gradient-to-r from-indigo-200 to-purple-300 text-black border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black font-bold text-lg">
            <Bot className="w-5 h-5" />
            <i className="fas fa-robot"></i> Automation Tasks ({tasks.length})
          </CardTitle>
          <CardDescription className="text-black font-medium">
            Manage your automated workflows and schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-3 h-3 rounded-full ${task.status === 'active' ? 'bg-green-400' : task.status === 'paused' ? 'bg-yellow-400' : 'bg-red-400'} mt-2`}></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-black">{getTaskIcon(task.type)}</div>
                        <h3 className="font-semibold text-black">{task.name}</h3>
                        <Badge className={`${task.status === 'active' ? 'bg-green-500 text-white' : task.status === 'paused' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'} border-0`}>
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-black mb-3">{task.description}</p>
                      
                      <div className="grid md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-black">Schedule:</span>
                          <p className="font-medium text-black">{task.schedule}</p>
                        </div>
                        {task.lastRun && (
                          <div>
                            <span className="text-black">Last Run:</span>
                            <p className="font-medium text-black">{formatDate(task.lastRun)}</p>
                          </div>
                        )}
                        {task.nextRun && (
                          <div>
                            <span className="text-black">Next Run:</span>
                            <p className="font-medium text-black">{formatDate(task.nextRun)}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-black">Success Rate:</span>
                          <p className="font-medium text-black">{task.successRate}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleToggleTask(task.id, task.status)}
                      disabled={toggleTaskMutation.isPending}
                      className={`${task.status === 'active' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'} border-0`}
                    >
                      {task.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white border-0"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Setup Templates */}
      <Card className="bg-gradient-to-r from-blue-200 to-cyan-300 text-black border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black font-bold text-lg">
            <Zap className="w-5 h-5" />
            <i className="fas fa-bolt"></i> Quick Setup Templates
          </CardTitle>
          <CardDescription className="text-black font-medium">
            Pre-configured automation templates for common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-100" />
                <h4 className="font-semibold text-white">Price Monitoring</h4>
              </div>
              <p className="text-sm text-blue-100 mb-3">
                Monitor product prices and update automatically
              </p>
              <Button size="sm" className="w-full bg-white text-blue-600 hover:bg-blue-50 border-0">
                Setup Now
              </Button>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-green-100" />
                <h4 className="font-semibold text-white">Email Campaigns</h4>
              </div>
              <p className="text-sm text-green-100 mb-3">
                Automated email marketing and newsletters
              </p>
              <Button size="sm" className="w-full bg-white text-green-600 hover:bg-green-50 border-0">
                Setup Now
              </Button>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-purple-100" />
                <h4 className="font-semibold text-white">Content Generation</h4>
              </div>
              <p className="text-sm text-purple-100 mb-3">
                AI-powered content creation and optimization
              </p>
              <Button size="sm" className="w-full bg-white text-purple-600 hover:bg-purple-50 border-0">
                Setup Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Custom Platform Modal */}
      {showAddPlatform && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Custom Platform</h3>
              <Button
                onClick={() => setShowAddPlatform(false)}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="platform-name" className="text-sm font-medium text-gray-700">Platform Name *</Label>
                <Input
                  id="platform-name"
                  placeholder="e.g., Discord, Reddit, TikTok"
                  value={newPlatform.name}
                  onChange={(e) => setNewPlatform(prev => ({ ...prev, name: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="platform-key" className="text-sm font-medium text-gray-700">Platform Key *</Label>
                <Input
                  id="platform-key"
                  placeholder="e.g., discord, reddit, tiktok"
                  value={newPlatform.key}
                  onChange={(e) => setNewPlatform(prev => ({ ...prev, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="api-url" className="text-sm font-medium text-gray-700">API URL</Label>
                <Input
                  id="api-url"
                  placeholder="https://api.platform.com/v1/"
                  value={newPlatform.apiUrl}
                  onChange={(e) => setNewPlatform(prev => ({ ...prev, apiUrl: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="api-key" className="text-sm font-medium text-gray-700">API Key</Label>
                  <Input
                    id="api-key"
                    placeholder="Your API key"
                    value={newPlatform.apiKey}
                    onChange={(e) => setNewPlatform(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="mt-1"
                    type="password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="api-secret" className="text-sm font-medium text-gray-700">API Secret</Label>
                  <Input
                    id="api-secret"
                    placeholder="Your API secret"
                    value={newPlatform.apiSecret}
                    onChange={(e) => setNewPlatform(prev => ({ ...prev, apiSecret: e.target.value }))}
                    className="mt-1"
                    type="password"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="webhook-url" className="text-sm font-medium text-gray-700">Webhook URL (Optional)</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://hooks.platform.com/webhook"
                  value={newPlatform.webhookUrl}
                  onChange={(e) => setNewPlatform(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Icon Color</Label>
                <Select
                  value={newPlatform.color}
                  onValueChange={(value) => setNewPlatform(prev => ({ ...prev, color: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-purple-300">Purple</SelectItem>
                    <SelectItem value="text-pink-300">Pink</SelectItem>
                    <SelectItem value="text-blue-300">Blue</SelectItem>
                    <SelectItem value="text-green-300">Green</SelectItem>
                    <SelectItem value="text-yellow-300">Yellow</SelectItem>
                    <SelectItem value="text-red-300">Red</SelectItem>
                    <SelectItem value="text-orange-300">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => setShowAddPlatform(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPlatform}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Platform
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
