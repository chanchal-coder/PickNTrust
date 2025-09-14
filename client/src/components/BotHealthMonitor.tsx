/**
 * Bot Health Monitoring Dashboard
 * Real-time monitoring of Telegram bot status with emergency controls
 * Admin-only component for critical bot management
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import EmergencyProductAdder from './EmergencyProductAdder';

interface BotHealth {
  isConnected: boolean;
  lastMessageTime: number;
  errorCount: number;
  lastError?: string;
  retryCount: number;
  mode: 'webhook' | 'polling' | 'fallback';
  messagesProcessed: number;
  uptime: number;
}

interface BotStats {
  totalProducts: number;
  todayProducts: number;
  lastProductTime: number;
  avgProcessingTime: number;
}

export default function BotHealthMonitor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEmergencyAdder, setShowEmergencyAdder] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch bot health status
  const { data: botHealth, isLoading: healthLoading, error: healthError } = useQuery<BotHealth>({
    queryKey: ['/api/bot/health'],
    queryFn: async (): Promise<BotHealth> => {
      const response = await fetch('/api/bot/health');
      if (!response.ok) {
        throw new Error('Failed to fetch bot health');
      }
      return response.json();
    },
    refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5 seconds
    retry: 3,
    retryDelay: 1000
  });

  // Fetch bot statistics
  const { data: botStats, isLoading: statsLoading } = useQuery<BotStats>({
    queryKey: ['/api/bot/stats'],
    queryFn: async (): Promise<BotStats> => {
      const response = await fetch('/api/bot/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch bot stats');
      }
      return response.json();
    },
    refetchInterval: autoRefresh ? 10000 : false, // Auto-refresh every 10 seconds
    retry: 2
  });

  // Force bot restart mutation
  const restartBotMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/bot/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Failed to restart bot');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '<i className="fas fa-sync-alt"></i> Bot Restart Initiated',
        description: 'Telegram bot is restarting with enhanced error handling',
        duration: 5000,
      });
      // Refresh health data
      queryClient.invalidateQueries({ queryKey: ['/api/bot/health'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bot/stats'] });
    },
    onError: (error) => {
      toast({
        title: '<i className="fas fa-times-circle"></i> Bot Restart Failed',
        description: `Error: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Test bot connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/bot/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Connection test failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: '<i className="fas fa-check-circle"></i> Connection Test Successful',
        description: `Bot is responding: ${data.message}`,
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: '<i className="fas fa-times-circle"></i> Connection Test Failed',
        description: `Error: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Get health status color
  const getHealthColor = (health?: BotHealth) => {
    if (!health) return 'bg-gray-500';
    if (health.isConnected && health.errorCount < 3) return 'bg-green-500';
    if (health.isConnected && health.errorCount < 10) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get health status text
  const getHealthStatus = (health?: BotHealth) => {
    if (!health) return 'Unknown';
    if (health.isConnected && health.errorCount < 3) return 'Healthy';
    if (health.isConnected && health.errorCount < 10) return 'Warning';
    return 'Critical';
  };

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Auto-scroll to bottom for logs
  useEffect(() => {
    if (botHealth?.lastError) {
      // Show critical error toast
      if (botHealth.errorCount > 5) {
        toast({
          title: '<i className="fas fa-exclamation-circle"></i> Critical Bot Error',
          description: `Bot has ${botHealth.errorCount} errors. Consider emergency restart.`,
          variant: 'destructive',
          duration: 10000,
        });
      }
    }
  }, [botHealth?.errorCount, botHealth?.lastError, toast]);

  if (healthLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-white ${
          getHealthColor(botHealth) === 'bg-green-500' ? 'bg-green-600' :
          getHealthColor(botHealth) === 'bg-yellow-500' ? 'bg-yellow-600' :
          getHealthColor(botHealth) === 'bg-red-500' ? 'bg-red-600' : 'bg-gray-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${getHealthColor(botHealth)} animate-pulse`}></div>
              <div>
                <h2 className="text-xl font-bold"><i className="fas fa-robot"></i> Telegram Bot Monitor</h2>
                <p className="text-sm opacity-90">
                  Status: {getHealthStatus(botHealth)} • Mode: {botHealth?.mode || 'Unknown'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  autoRefresh ? 'bg-white bg-opacity-20' : 'bg-white bg-opacity-10'
                }`}
              >
                {autoRefresh ? '<i className="fas fa-sync-alt"></i> Auto' : '⏸️ Manual'}
              </button>
            </div>
          </div>
        </div>

        {/* Health Metrics */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Connection Status */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Connection</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {botHealth?.isConnected ? '<i className="fas fa-check-circle"></i> Online' : '<i className="fas fa-times-circle"></i> Offline'}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-full ${getHealthColor(botHealth)}`}></div>
              </div>
            </div>

            {/* Error Count */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {botHealth?.errorCount || 0}
                  </p>
                </div>
                <div className="text-2xl">
                  {(botHealth?.errorCount || 0) > 5 ? '<i className="fas fa-exclamation-circle"></i>' : (botHealth?.errorCount || 0) > 0 ? '<i className="fas fa-exclamation-triangle"></i>' : '<i className="fas fa-check-circle"></i>'}
                </div>
              </div>
            </div>

            {/* Last Message */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Message</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatTimeAgo(botHealth?.lastMessageTime || 0)}
                  </p>
                </div>
                <div className="text-2xl"><i className="fas fa-mobile-alt"></i></div>
              </div>
            </div>

            {/* Products Today */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {botStats?.todayProducts || 0} products
                  </p>
                </div>
                <div className="text-2xl"><i className="fas fa-box"></i></div>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          {botStats && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3"><i className="fas fa-chart-bar"></i> Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Total Products</p>
                  <p className="font-bold text-gray-900 dark:text-white">{botStats.totalProducts}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Retry Count</p>
                  <p className="font-bold text-gray-900 dark:text-white">{botHealth?.retryCount || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Last Product</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatTimeAgo(botStats.lastProductTime)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Bot Mode</p>
                  <p className="font-bold text-gray-900 dark:text-white capitalize">
                    {botHealth?.mode || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Details */}
          {botHealth?.lastError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2"><i className="fas fa-times-circle"></i> Last Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300 font-mono bg-red-100 dark:bg-red-900/40 p-2 rounded">
                {botHealth.lastError}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Error count: {botHealth.errorCount} • Retry count: {botHealth.retryCount}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => testConnectionMutation.mutate()}
              disabled={testConnectionMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {testConnectionMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <span><i className="fas fa-flask"></i></span>
              )}
              <span>Test Connection</span>
            </button>

            <button
              onClick={() => restartBotMutation.mutate()}
              disabled={restartBotMutation.isPending}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {restartBotMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <span><i className="fas fa-sync-alt"></i></span>
              )}
              <span>Restart Bot</span>
            </button>

            <button
              onClick={() => setShowEmergencyAdder(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <span><i className="fas fa-exclamation-circle"></i></span>
              <span>Emergency Add Product</span>
            </button>

            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/bot/health'] });
                queryClient.invalidateQueries({ queryKey: ['/api/bot/stats'] });
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
            >
              <span><i className="fas fa-sync-alt"></i></span>
              <span>Refresh Data</span>
            </button>
          </div>

          {/* Health Recommendations */}
          {botHealth && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2"><i className="fas fa-lightbulb"></i> Recommendations</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                {!botHealth.isConnected && (
                  <li>• <i className="fas fa-times-circle"></i> Bot is offline - Check internet connection and restart bot</li>
                )}
                {botHealth.errorCount > 10 && (
                  <li>• <i className="fas fa-exclamation-circle"></i> High error count - Consider restarting bot or checking Telegram API status</li>
                )}
                {botHealth.errorCount > 5 && botHealth.errorCount <= 10 && (
                  <li>• <i className="fas fa-exclamation-triangle"></i> Moderate errors detected - Monitor closely or restart if issues persist</li>
                )}
                {botHealth.mode === 'fallback' && (
                  <li>• <i className="fas fa-sync-alt"></i> Bot is in fallback mode - Normal polling failed, using backup system</li>
                )}
                {Date.now() - (botHealth.lastMessageTime || 0) > 300000 && (
                  <li>• ⏰ No recent messages - Check if Telegram channel is active</li>
                )}
                {botHealth.isConnected && botHealth.errorCount < 3 && (
                  <li>• <i className="fas fa-check-circle"></i> Bot is healthy and functioning normally</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Product Adder Modal */}
      <EmergencyProductAdder 
        isVisible={showEmergencyAdder}
        onClose={() => setShowEmergencyAdder(false)}
      />
    </>
  );
}