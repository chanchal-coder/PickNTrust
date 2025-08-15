import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, Clock, Zap, RefreshCw, Database, Mail, Bell, 
  Calendar, TrendingUp, Shield, AlertTriangle, CheckCircle,
  Play, Pause, Settings, Activity, Timer, Workflow, Plus
} from 'lucide-react';

interface AutomationTask {
  id: string;
  name: string;
  description: string;
  type: 'product_sync' | 'price_update' | 'email_campaign' | 'content_generation' | 'analytics' | 'backup';
  status: 'active' | 'paused' | 'stopped';
  schedule: string;
  lastRun?: Date;
  nextRun?: Date;
  successRate: number;
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
    </div>
  );
}
