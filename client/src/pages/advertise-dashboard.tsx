import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Eye, 
  MousePointer, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Edit, 
  Pause, 
  Play, 
  Trash2,
  Calendar,
  Target,
  Users,
  Settings,
  FileDown,
  RefreshCw
} from 'lucide-react';

interface Campaign {
  id: number;
  name: string;
  type: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate: string;
}

interface Performance {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

interface NewCampaign {
  name: string;
  type: string;
  budget: string;
  startDate: string;
  endDate: string;
  targetAudience: string;
  adTitle: string;
  adDescription: string;
  clickUrl: string;
  imageUrl: string;
}

const AdvertiseDashboardPage = () => {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [performance, setPerformance] = useState<Performance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState<NewCampaign>({
    name: '',
    type: 'banner',
    budget: '',
    startDate: '',
    endDate: '',
    targetAudience: '',
    adTitle: '',
    adDescription: '',
    clickUrl: '',
    imageUrl: ''
  });

  // Check for existing login on component mount
  useEffect(() => {
    const token = localStorage.getItem('advertiserToken');
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    
    // Allow admin access without login or check for advertiser token
    if (adminAuth === 'active' || token) {
      setIsLoggedIn(true);
      if (token) {
        loadCampaigns(token);
      } else {
        // Load sample data for demo purposes
        loadSampleData();
      }
    }
  }, []);

  // Add sample data for demonstration
  const loadSampleData = () => {
    const sampleCampaigns: Campaign[] = [
      {
        id: 1,
        name: "Summer Electronics Sale",
        type: "banner",
        status: "active",
        budget: 5000,
        spent: 3250,
        impressions: 125000,
        clicks: 3750,
        conversions: 187,
        startDate: "2024-01-15",
        endDate: "2024-02-15"
      },
      {
        id: 2,
        name: "Smart Home Collection",
        type: "native",
        status: "active",
        budget: 3500,
        spent: 2100,
        impressions: 89000,
        clicks: 2670,
        conversions: 134,
        startDate: "2024-01-10",
        endDate: "2024-02-10"
      },
      {
        id: 3,
        name: "Gaming Accessories Promo",
        type: "sponsored_product",
        status: "paused",
        budget: 2000,
        spent: 1450,
        impressions: 67000,
        clicks: 2010,
        conversions: 95,
        startDate: "2024-01-05",
        endDate: "2024-02-05"
      },
      {
        id: 4,
        name: "Fashion Week Special",
        type: "banner",
        status: "completed",
        budget: 4000,
        spent: 4000,
        impressions: 156000,
        clicks: 4680,
        conversions: 234,
        startDate: "2023-12-01",
        endDate: "2023-12-31"
      },
      {
        id: 5,
        name: "Holiday Gift Guide",
        type: "native",
        status: "draft",
        budget: 6000,
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        startDate: "2024-02-01",
        endDate: "2024-02-28"
      }
    ];
    
    setCampaigns(sampleCampaigns);
    
    // Sample performance data
    const samplePerformance: Performance[] = [
      { date: "2024-01-15", impressions: 12500, clicks: 375, conversions: 18, spend: 325 },
      { date: "2024-01-16", impressions: 13200, clicks: 396, conversions: 20, spend: 342 },
      { date: "2024-01-17", impressions: 11800, clicks: 354, conversions: 17, spend: 298 },
      { date: "2024-01-18", impressions: 14100, clicks: 423, conversions: 21, spend: 378 },
      { date: "2024-01-19", impressions: 15600, clicks: 468, conversions: 23, spend: 421 },
      { date: "2024-01-20", impressions: 13900, clicks: 417, conversions: 19, spend: 365 },
      { date: "2024-01-21", impressions: 12300, clicks: 369, conversions: 18, spend: 312 }
    ];
    
    setPerformance(samplePerformance);
  };

  // Mock data for demonstration - remove this when using real API
  useEffect(() => {
    if (isLoggedIn && campaigns.length === 0) {
      setPerformance([
        { date: '2024-01-20', impressions: 12500, clicks: 350, conversions: 28, spend: 320 },
        { date: '2024-01-21', impressions: 13200, clicks: 380, conversions: 32, spend: 340 },
        { date: '2024-01-22', impressions: 11800, clicks: 320, conversions: 25, spend: 290 },
        { date: '2024-01-23', impressions: 14100, clicks: 420, conversions: 35, spend: 380 },
        { date: '2024-01-24', impressions: 13500, clicks: 390, conversions: 30, spend: 350 }
      ]);
    }
  }, [isLoggedIn, campaigns]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/advertisers/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('advertiserToken', data.token);
        setIsLoggedIn(true);
        loadCampaigns(data.token);
        toast({
          title: "Login Successful",
          description: "Welcome to your advertiser dashboard!"
        });
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCampaigns = async (token?: string) => {
    const authToken = token || localStorage.getItem('advertiserToken');
    if (!authToken) return;

    try {
      const response = await fetch('http://localhost:5000/api/advertisers/campaigns', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const campaignsData = await response.json();
        const formattedCampaigns = campaignsData.map((campaign: any) => ({
          id: campaign.id,
          name: campaign.campaign_name,
          type: campaign.campaign_type,
          status: campaign.status,
          budget: campaign.budget_total || 0,
          spent: campaign.total_revenue || 0,
          impressions: campaign.total_impressions || 0,
          clicks: campaign.total_clicks || 0,
          conversions: campaign.total_conversions || 0,
          startDate: campaign.start_date,
          endDate: campaign.end_date
        }));
        setCampaigns(formattedCampaigns);
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('advertiserToken');
      const response = await fetch('http://localhost:5000/api/advertisers/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCampaign)
      });

      const data = await response.json();

      if (response.ok) {
        await loadCampaigns();
        setShowCreateCampaign(false);
        setNewCampaign({
          name: '',
          type: 'banner',
          budget: '',
          startDate: '',
          endDate: '',
          targetAudience: '',
          adTitle: '',
          adDescription: '',
          clickUrl: '',
          imageUrl: ''
        });
        toast({
          title: "Campaign Created",
          description: "Your campaign has been created successfully!"
        });
      } else {
        throw new Error(data.error || 'Failed to create campaign');
      }
    } catch (error) {
      toast({
        title: "Campaign Creation Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCampaignStatus = (campaignId: number) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId 
        ? { ...campaign, status: campaign.status === 'active' ? 'paused' : 'active' as any }
        : campaign
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    return impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
  };

  const calculateCPC = (spent: number, clicks: number) => {
    return clicks > 0 ? (spent / clicks).toFixed(2) : '0.00';
  };

  if (!isLoggedIn) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-3xl rounded-full transform -translate-y-12"></div>
            
            <Card className="relative bg-slate-800/90 backdrop-blur-sm border-slate-700/50 shadow-2xl">
              <CardHeader className="text-center pb-8">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  Advertiser Login
                </CardTitle>
                <CardDescription className="text-slate-300 text-lg mt-2">
                  Access your advertising dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200 font-medium">Email Address</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 h-12 px-4"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-200 font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Your password"
                        className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 h-12 px-4"
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold h-12 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Signing In...
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
                <div className="mt-8 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-600/50"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-slate-800/90 text-slate-400">New to advertising?</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Link href="/advertise/register">
                      <Button variant="outline" className="w-full border-slate-600/50 text-slate-300 hover:text-white hover:bg-slate-700/50 h-11">
                        Create Account
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  const totalImpressions = campaigns.reduce((sum, campaign) => sum + campaign.impressions, 0);
  const totalClicks = campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
  const totalSpent = campaigns.reduce((sum, campaign) => sum + campaign.spent, 0);
  const totalConversions = campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-2">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
                Advertiser Dashboard
              </h1>
              <p className="text-slate-300 text-lg font-medium">Manage your campaigns and track performance</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm" className="border-indigo-500/50 text-indigo-200 hover:border-indigo-400 hover:bg-indigo-900/30 transition-all duration-200 shadow-sm">
                <FileDown className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-white font-semibold">
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                      Create New Campaign
                    </DialogTitle>
                    <DialogDescription className="text-slate-600">
                      Set up a new advertising campaign to reach your target audience
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateCampaign} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="campaignName" className="text-sm font-medium text-slate-300">Campaign Name</Label>
                        <Input
                          id="campaignName"
                          value={newCampaign.name}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="My Campaign"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="campaignType" className="text-sm font-medium text-slate-300">Campaign Type</Label>
                        <Select onValueChange={(value) => setNewCampaign(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="banner">Banner Ad</SelectItem>
                            <SelectItem value="native">Native Ad</SelectItem>
                            <SelectItem value="sponsored_product">Sponsored Product</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="budget" className="text-sm font-medium text-slate-300">Budget ($)</Label>
                        <Input
                          id="budget"
                          type="number"
                          value={newCampaign.budget}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: e.target.value }))}
                          placeholder="1000"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startDate" className="text-sm font-medium text-slate-300">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={newCampaign.startDate}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, startDate: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate" className="text-sm font-medium text-slate-300">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={newCampaign.endDate}
                          onChange={(e) => setNewCampaign(prev => ({ ...prev, endDate: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adTitle" className="text-sm font-medium text-slate-300">Ad Title</Label>
                      <Input
                        id="adTitle"
                        value={newCampaign.adTitle}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, adTitle: e.target.value }))}
                        placeholder="Your compelling ad title"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adDescription" className="text-sm font-medium text-slate-300">Ad Description</Label>
                      <Textarea
                        id="adDescription"
                        value={newCampaign.adDescription}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, adDescription: e.target.value }))}
                        placeholder="Describe your product or service"
                        rows={3}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clickUrl" className="text-sm font-medium text-slate-300">Click URL</Label>
                      <Input
                        id="clickUrl"
                        type="url"
                        value={newCampaign.clickUrl}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, clickUrl: e.target.value }))}
                        placeholder="https://yourwebsite.com/landing-page"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
                      <Button type="button" variant="outline" onClick={() => setShowCreateCampaign(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        {isLoading ? 'Creating...' : 'Create Campaign'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-900/20 rounded-full -mr-10 -mt-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-blue-100">Total Impressions</CardTitle>
                <div className="p-2 bg-slate-900/30 rounded-lg backdrop-blur-sm">
                  <Eye className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-white">{totalImpressions.toLocaleString()}</div>
                <p className="text-xs text-blue-100 font-medium mt-1">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-600 to-indigo-500 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-900/20 rounded-full -mr-10 -mt-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-purple-100">Total Clicks</CardTitle>
                <div className="p-2 bg-slate-900/30 rounded-lg backdrop-blur-sm">
                  <MousePointer className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-white">{totalClicks.toLocaleString()}</div>
                <p className="text-xs text-purple-100 font-medium mt-1">
                  CTR: <span className="text-yellow-200">{calculateCTR(totalClicks, totalImpressions)}%</span>
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-600 to-teal-500 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-900/20 rounded-full -mr-10 -mt-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-emerald-100">Total Spent</CardTitle>
                <div className="p-2 bg-slate-900/30 rounded-lg backdrop-blur-sm">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-white">${totalSpent.toLocaleString()}</div>
                <p className="text-xs text-emerald-100 font-medium mt-1">
                  CPC: <span className="text-yellow-200">${calculateCPC(totalSpent, totalClicks)}</span>
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-600 to-rose-500 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-slate-900/20 rounded-full -mr-10 -mt-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-pink-100">Conversions</CardTitle>
                <div className="p-2 bg-slate-900/30 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-white">{totalConversions}</div>
                <p className="text-xs text-pink-100 font-medium mt-1">
                  +8% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="campaigns" className="space-y-6">
            <TabsList className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 p-1 text-slate-200">
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns">
              <Card className="border border-slate-700 shadow-xl bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-900/60 via-indigo-900/40 to-purple-900/40 border-b border-slate-700 p-6">
                  <CardTitle className="text-2xl font-bold text-white">Your Campaigns</CardTitle>
                  <CardDescription className="text-slate-300 font-medium">
                    Manage and monitor your advertising campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="border border-slate-700 rounded-xl p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-slate-800 via-indigo-900/40 to-purple-900/40 transform hover:scale-[1.02]">
                        <div className="flex justify-between items-start mb-6">
                          <div className="space-y-3">
                            <h3 className="font-bold text-2xl text-white">{campaign.name}</h3>
                            <div className="flex items-center space-x-3">
                              <Badge className={`${getStatusColor(campaign.status)} shadow-sm font-medium px-3 py-1`}>
                                {campaign.status}
                              </Badge>
                              <Badge variant="outline" className="border-indigo-500/50 text-indigo-200 bg-indigo-900/30 font-medium px-3 py-1">
                                {campaign.type}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleCampaignStatus(campaign.id)}
                              className="border-indigo-500/50 text-indigo-200 hover:border-indigo-400 hover:bg-indigo-900/30 transition-all duration-200 shadow-sm"
                            >
                              {campaign.status === 'active' ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-200 hover:border-purple-400 hover:bg-purple-900/30 transition-all duration-200 shadow-sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-6 gap-6 text-sm">
                          <div className="space-y-2 p-3 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl border border-blue-700">
                            <p className="text-blue-200 font-semibold text-xs uppercase tracking-wide">Budget</p>
                            <p className="font-bold text-blue-100 text-lg">${campaign.budget.toLocaleString()}</p>
                          </div>
                          <div className="space-y-2 p-3 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 rounded-xl border border-emerald-700">
                            <p className="text-emerald-200 font-semibold text-xs uppercase tracking-wide">Spent</p>
                            <p className="font-bold text-emerald-100 text-lg">${campaign.spent.toLocaleString()}</p>
                          </div>
                          <div className="space-y-2 p-3 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-xl border border-purple-700">
                            <p className="text-purple-200 font-semibold text-xs uppercase tracking-wide">Impressions</p>
                            <p className="font-bold text-purple-100 text-lg">{campaign.impressions.toLocaleString()}</p>
                          </div>
                          <div className="space-y-2 p-3 bg-gradient-to-br from-pink-900/30 to-rose-900/30 rounded-xl border border-pink-700">
                            <p className="text-pink-200 font-semibold text-xs uppercase tracking-wide">Clicks</p>
                            <p className="font-bold text-pink-100 text-lg">{campaign.clicks.toLocaleString()}</p>
                          </div>
                          <div className="space-y-2 p-3 bg-gradient-to-br from-orange-900/30 to-amber-900/30 rounded-xl border border-orange-700">
                            <p className="text-orange-200 font-semibold text-xs uppercase tracking-wide">CTR</p>
                            <p className="font-bold text-orange-100 text-lg">{calculateCTR(campaign.clicks, campaign.impressions)}%</p>
                          </div>
                          <div className="space-y-2 p-3 bg-gradient-to-br from-violet-900/30 to-purple-900/30 rounded-xl border border-violet-700">
                            <p className="text-violet-200 font-semibold text-xs uppercase tracking-wide">Conversions</p>
                            <p className="font-bold text-violet-100 text-lg">{campaign.conversions}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card className="border border-slate-700 shadow-xl bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-900/60 via-indigo-900/40 to-purple-900/40 border-b border-slate-700 p-6">
                    <CardTitle className="text-2xl font-bold text-white">Performance Analytics</CardTitle>
                    <CardDescription className="text-slate-300 font-medium">
                      Detailed insights into your campaign performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="text-center py-16 text-slate-400">
                        <div className="p-6 bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-pink-900/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg border border-slate-700">
                          <BarChart3 className="h-12 w-12 text-indigo-300" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Analytics Dashboard</h3>
                        <p className="text-slate-400 font-medium mb-2">Detailed analytics charts would be displayed here</p>
                        <p className="text-sm text-slate-400">Integration with charting library needed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card className="border border-slate-700 shadow-xl bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-slate-900/60 via-indigo-900/40 to-purple-900/40 border-b border-slate-700 p-6">
                    <CardTitle className="text-2xl font-bold text-white">Account Settings</CardTitle>
                    <CardDescription className="text-slate-300 font-medium">
                      Manage your advertiser account preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="text-center py-16 text-slate-400">
                        <div className="p-6 bg-gradient-to-br from-slate-900/30 via-indigo-900/30 to-purple-900/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg border border-slate-700">
                          <Settings className="h-12 w-12 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Account Settings</h3>
                        <p className="text-slate-400 font-medium mb-2">Account settings panel would be displayed here</p>
                        <p className="text-sm text-slate-400">Profile, billing, and notification settings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PageLayout>
    );
};

export default AdvertiseDashboardPage;