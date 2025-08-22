import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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

  // Canva automation state
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

  // Fetch Canva settings
  const { data: canvaSettingsData, isLoading: canvaLoading } = useQuery({
    queryKey: ['canva-settings'],
    queryFn: async () => {
      const password = localStorage.getItem('adminPassword') || 'pickntrust2025';
      const response = await fetch(`/api/admin/canva/settings?password=${password}`);
      if (!response.ok) throw new Error('Failed to fetch Canva settings');
      return response.json();
    },
    enabled: true
  });

  // Update Canva settings mutation
  const updateCanvaSettingsMutation = useMutation({
    mutationFn: async (settings: CanvaSettings) => {
      const password = localStorage.getItem('adminPassword') || 'pickntrust2025';
      
      // Convert camelCase to snake_case for API
      const apiSettings = {
        password,
        is_enabled: settings.isEnabled,
        api_key: settings.apiKey,
        api_secret: settings.apiSecret,
        default_template_id: settings.defaultTemplateId,
        auto_generate_captions: settings.autoGenerateCaptions,
        auto_generate_hashtags: settings.autoGenerateHashtags,
        default_caption: settings.defaultCaption,
        default_hashtags: settings.defaultHashtags,
        platforms: JSON.stringify(settings.platforms),
        schedule_type: settings.scheduleType,
        schedule_delay_minutes: settings.scheduleDelayMinutes,
        enable_blog_posts: settings.enableBlogPosts,
        enable_videos: settings.enableVideos
      };
      
      const response = await fetch('/api/admin/canva/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiSettings)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update Canva settings: ${errorText}`);
      }
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: 'Settings Saved ✅',
        description: 'Canva automation settings updated successfully.',
      });
      
      // Force update local state with the response data
      if (data.settings) {
        const updatedSettings = {
          ...data.settings,
          platforms: Array.isArray(data.settings.platforms) 
            ? data.settings.platforms 
            : JSON.parse(data.settings.platforms || '[]')
        };
        setCanvaSettings(updatedSettings);
      }
      
      // Invalidate and refetch queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['canva-settings'] });
      queryClient.refetchQueries({ queryKey: ['canva-settings'] });
      setIsEditingCanva(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error ❌',
        description: error.message || 'Failed to update Canva settings.',
        variant: 'destructive',
      });
      
      // Revert local state on error by refetching
      queryClient.refetchQueries({ queryKey: ['canva-settings'] });
    }
  });

  // Test Canva automation mutation
  const testCanvaMutation = useMutation({
    mutationFn: async () => {
      const password = localStorage.getItem('adminPassword') || 'pickntrust2025';
      const response = await fetch('/api/admin/canva/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password, 
          contentType: 'product', 
          contentId: 1 
        })
      });
      if (!response.ok) throw new Error('Failed to test Canva automation');
      return response.json();
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

  // Update local state when data is fetched (only on initial load)
  useEffect(() => {
    if (canvaSettingsData && !updateCanvaSettingsMutation.isPending) {
      setCanvaSettings({
        ...canvaSettingsData,
        platforms: Array.isArray(canvaSettingsData.platforms) 
          ? canvaSettingsData.platforms 
          : JSON.parse(canvaSettingsData.platforms || '[]')
      });
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Automation Tasks ({tasks.length})
          </CardTitle>
          <CardDescription>
            Manage your automated workflows and schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)} mt-2`}></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTaskIcon(task.type)}
                        <h3 className="font-semibold text-gray-900 dark:text-white">{task.name}</h3>
                        <Badge variant={task.status === 'active' ? 'default' : task.status === 'paused' ? 'secondary' : 'destructive'}>
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{task.description}</p>
                      
                      <div className="grid md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Schedule:</span>
                          <p className="font-medium">{task.schedule}</p>
                        </div>
                        {task.lastRun && (
                          <div>
                            <span className="text-gray-500">Last Run:</span>
                            <p className="font-medium">{formatDate(task.lastRun)}</p>
                          </div>
                        )}
                        {task.nextRun && (
                          <div>
                            <span className="text-gray-500">Next Run:</span>
                            <p className="font-medium">{formatDate(task.nextRun)}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Success Rate:</span>
                          <p className="font-medium text-green-600">{task.successRate}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleTask(task.id, task.status)}
                      disabled={toggleTaskMutation.isPending}
                      className={task.status === 'active' ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}
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
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Setup Templates
          </CardTitle>
          <CardDescription>
            Pre-configured automation templates for common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h4 className="font-semibold">Price Monitoring</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Monitor product prices and update automatically
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Setup Now
              </Button>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-green-500" />
                <h4 className="font-semibold">Email Campaigns</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Automated email marketing and newsletters
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Setup Now
              </Button>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-purple-500" />
                <h4 className="font-semibold">Content Generation</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                AI-powered content creation and optimization
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Setup Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canva Social Media Automation - Simplified */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            🎨 Social Media Automation with Canva
            <Badge variant={canvaSettings.isEnabled ? 'default' : 'secondary'}>
              {canvaSettings.isEnabled ? '✅ ON' : '❌ OFF'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Automatically create and post beautiful social media content using Canva templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canvaLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading settings...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Step 1: Enable/Disable */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">Turn On Automation</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {canvaSettings.isEnabled ? '🟢 Automation is running' : '🔴 Click to start automation'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={canvaSettings.isEnabled}
                    onCheckedChange={(checked) => {
                      const updatedSettings = { ...canvaSettings, isEnabled: checked };
                      setCanvaSettings(updatedSettings);
                      updateCanvaSettingsMutation.mutate(updatedSettings);
                    }}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>

              {/* Step 2: Choose Platforms */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                  <h4 className="font-semibold text-green-900 dark:text-green-100">Choose Social Media Platforms</h4>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">Select where you want to post your content:</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
                    { key: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
                    { key: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-blue-400' },
                    { key: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-500' },
                    { key: 'telegram', name: 'Telegram', icon: Send, color: 'text-blue-500' },
                    { key: 'youtube', name: 'YouTube', icon: Video, color: 'text-red-500' }
                  ].map((platform) => (
                    <div key={platform.key} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border">
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
                      <platform.icon className={`w-4 h-4 ${platform.color}`} />
                      <Label htmlFor={platform.key} className="text-sm font-medium cursor-pointer">
                        {platform.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Content Options */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100">Content Options</h4>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">What should we automatically add to your posts?</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-purple-500" />
                      <Label className="text-sm font-medium">Auto-write captions</Label>
                    </div>
                    <Switch
                      checked={canvaSettings.autoGenerateCaptions}
                      onCheckedChange={(checked) => {
                        const updatedSettings = { ...canvaSettings, autoGenerateCaptions: checked };
                        setCanvaSettings(updatedSettings);
                        updateCanvaSettingsMutation.mutate(updatedSettings);
                      }}
                    />
                  </div>
                  
                  {!canvaSettings.autoGenerateCaptions && (
                    <div className="ml-4 p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Default Caption Template
                      </Label>
                      <Textarea
                        className="w-full"
                        rows={3}
                        placeholder="🛍️ Amazing {category} Alert! ✨ {title} 💰 Price: ₹{price} 🔗 Get the best deals at PickNTrust!"
                        value={canvaSettings.defaultCaption || ''}
                        onChange={(e) => setCanvaSettings(prev => ({ ...prev, defaultCaption: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use placeholders: {'{title}'}, {'{description}'}, {'{price}'}, {'{category}'}, {'{websiteUrl}'}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-purple-500" />
                      <Label className="text-sm font-medium">Auto-add hashtags</Label>
                    </div>
                    <Switch
                      checked={canvaSettings.autoGenerateHashtags}
                      onCheckedChange={(checked) => {
                        const updatedSettings = { ...canvaSettings, autoGenerateHashtags: checked };
                        setCanvaSettings(updatedSettings);
                        updateCanvaSettingsMutation.mutate(updatedSettings);
                      }}
                    />
                  </div>

                  {!canvaSettings.autoGenerateHashtags && (
                    <div className="ml-4 p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Default Hashtags
                      </Label>
                      <Input
                        type="text"
                        className="w-full"
                        placeholder="#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India"
                        value={canvaSettings.defaultHashtags || ''}
                        onChange={(e) => setCanvaSettings(prev => ({ ...prev, defaultHashtags: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separate hashtags with spaces. These will be used for all posts.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3.5: Content Type Toggles */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">📝</div>
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">Content Type Automation</h4>
                </div>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">Choose which content types should trigger Canva automation:</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-blog text-indigo-500 w-4 h-4 flex items-center justify-center"></i>
                      <Label className="text-sm font-medium">📝 Blog Posts</Label>
                      <span className="text-xs text-gray-500 ml-2">(When new blog posts are published)</span>
                    </div>
                    <Switch
                      checked={canvaSettings.enableBlogPosts}
                      onCheckedChange={(checked) => {
                        const updatedSettings = { ...canvaSettings, enableBlogPosts: checked };
                        setCanvaSettings(updatedSettings);
                        updateCanvaSettingsMutation.mutate(updatedSettings);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-indigo-500" />
                      <Label className="text-sm font-medium">🎥 Video Content</Label>
                      <span className="text-xs text-gray-500 ml-2">(When new videos are added)</span>
                    </div>
                    <Switch
                      checked={canvaSettings.enableVideos}
                      onCheckedChange={(checked) => {
                        const updatedSettings = { ...canvaSettings, enableVideos: checked };
                        setCanvaSettings(updatedSettings);
                        updateCanvaSettingsMutation.mutate(updatedSettings);
                      }}
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded border border-blue-200 dark:border-blue-700">
                    <div className="flex items-start gap-2">
                      <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        <p className="font-medium mb-1">ℹ️ How it works:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li><strong>Products & Services:</strong> Always trigger automation (cannot be disabled)</li>
                          <li><strong>Blog Posts:</strong> Only trigger when this toggle is ON</li>
                          <li><strong>Videos:</strong> Only trigger when this toggle is ON</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Connection Status */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Platform Connection Status</h4>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">Check which platforms are properly connected:</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { key: 'instagram', name: 'Instagram', envVars: ['INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_ACCOUNT_ID'], hasCredentials: true },
                    { key: 'facebook', name: 'Facebook', envVars: ['FACEBOOK_ACCESS_TOKEN', 'FACEBOOK_PAGE_ID'], hasCredentials: true },
                    { key: 'twitter', name: 'Twitter/X', envVars: ['TWITTER_BEARER_TOKEN', 'TWITTER_ACCESS_TOKEN'], hasCredentials: false },
                    { key: 'whatsapp', name: 'WhatsApp', envVars: ['WHATSAPP_BUSINESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'], hasCredentials: false },
                    { key: 'telegram', name: 'Telegram', envVars: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHANNEL_ID'], hasCredentials: true },
                    { key: 'youtube', name: 'YouTube', envVars: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN'], hasCredentials: true }
                  ].map((platform) => {
                    const isSelected = canvaSettings.platforms.includes(platform.key);
                    const isConnected = platform.hasCredentials;
                    
                    return (
                      <div key={platform.key} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border">
                        <div className={`w-2 h-2 rounded-full ${
                          isConnected ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm font-medium">{platform.name}</span>
                        <span className="text-xs text-gray-500 ml-auto">
                          {isConnected ? '✅' : '❌'}
                        </span>
                        {isSelected && !isConnected && (
                          <span className="text-xs text-orange-500 ml-1">⚠️ Selected but not connected</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                  ⚠️ To connect platforms, add API credentials to your .env file. 
                  <a href="#" className="underline ml-1">View Setup Guide</a>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</div>
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100">Quick Actions</h4>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">Test your automation or create content manually:</p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => testCanvaMutation.mutate()}
                    disabled={testCanvaMutation.isPending || !canvaSettings.isEnabled}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    {testCanvaMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        🧪 Test Automation
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canvaSettings.isEnabled}
                    className="flex items-center gap-2"
                  >
                    <Image className="w-4 h-4" />
                    📱 Create Post
                  </Button>
                  <Button
                    onClick={() => setIsEditingCanva(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    ⚙️ Advanced Settings
                  </Button>
                </div>
              </div>

              {/* Advanced Settings Modal */}
              {isEditingCanva && (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Advanced Settings
                  </h4>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="apiKey">Canva API Key (Optional)</Label>
                        <Input
                          id="apiKey"
                          type="password"
                          value={canvaSettings.apiKey || ''}
                          onChange={(e) => setCanvaSettings({ ...canvaSettings, apiKey: e.target.value })}
                          placeholder="Leave empty to use default"
                        />
                      </div>
                      <div>
                        <Label htmlFor="defaultTemplate">Template ID (Optional)</Label>
                        <Input
                          id="defaultTemplate"
                          value={canvaSettings.defaultTemplateId || ''}
                          onChange={(e) => setCanvaSettings({ ...canvaSettings, defaultTemplateId: e.target.value })}
                          placeholder="Leave empty for auto-select"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="scheduleType">When to Post</Label>
                      <Select 
                        value={canvaSettings.scheduleType} 
                        onValueChange={(value: 'immediate' | 'scheduled') => 
                          setCanvaSettings({ ...canvaSettings, scheduleType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">📤 Post Immediately</SelectItem>
                          <SelectItem value="scheduled">⏰ Schedule for Later</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {canvaSettings.scheduleType === 'scheduled' && (
                      <div>
                        <Label htmlFor="scheduleDelay">Delay (minutes)</Label>
                        <Input
                          id="scheduleDelay"
                          type="number"
                          value={canvaSettings.scheduleDelayMinutes}
                          onChange={(e) => setCanvaSettings({ 
                            ...canvaSettings, 
                            scheduleDelayMinutes: parseInt(e.target.value) || 0 
                          })}
                          placeholder="0"
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => updateCanvaSettingsMutation.mutate(canvaSettings)}
                        disabled={updateCanvaSettingsMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        {updateCanvaSettingsMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            💾 Save Settings
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingCanva(false)}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
