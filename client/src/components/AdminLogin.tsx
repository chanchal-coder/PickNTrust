import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter admin password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Send header for compatibility with tolerant server parsing
          'x-admin-password': password,
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data?.success) {
        // Set consistent admin session markers used across the app
        localStorage.setItem('pickntrust-admin-session', 'active');
        const adminToken = data?.token || `admin_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem('pickntrust-admin-token', adminToken);
        localStorage.setItem('pickntrust-admin-password', 'pickntrust2025');

        toast({
          title: "Success",
          description: "Admin login successful"
        });
        onLogin();
      } else {
        toast({
          title: "Error",
          description: data?.message || "Invalid admin password",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Login Failed",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setPassword('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Admin Login Required
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Enter admin password to manage travel categories
        </p>
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full"
          />
          <div className="flex gap-2">
            <Button 
              onClick={handleLogin} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                // Close the modal instead of reloading the page
                const event = new CustomEvent('closeAdminLogin');
                window.dispatchEvent(event);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          <i className="fas fa-lightbulb"></i> Demo passwords: admin or pickntrust2025
        </p>
      </div>
    </div>
  );
}