import { useState, useEffect, type ComponentType, createElement } from 'react';

// Admin authentication hook with strict security
export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        // Check multiple admin session indicators
        const adminSession = localStorage.getItem('pickntrust-admin-session');
        const adminToken = localStorage.getItem('pickntrust-admin-token');
        const adminPassword = localStorage.getItem('pickntrust-admin-password');
        
        // Strict admin validation - ALL conditions must be met
        const isValidAdmin = (
          adminSession === 'active' &&
          adminToken &&
          adminPassword === 'pickntrust2025' &&
          adminToken.length > 10 // Ensure token exists and has reasonable length
        );
        
        if (isValidAdmin) {
          setIsAdmin(true);
          setAdminToken(adminToken);
        } else {
          // Force logout if any condition fails
          setIsAdmin(false);
          setAdminToken(null);
          // Clear potentially corrupted admin data
          localStorage.removeItem('pickntrust-admin-session');
          localStorage.removeItem('pickntrust-admin-token');
        }
      } catch (error) {
        console.error('Admin auth check failed:', error);
        setIsAdmin(false);
        setAdminToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();

    // Listen for storage changes (admin login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('pickntrust-admin')) {
        checkAdminAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Periodic re-validation every 30 seconds
    const interval = setInterval(checkAdminAuth, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const login = (password: string): boolean => {
    if (password === 'pickntrust2025') {
      const token = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      localStorage.setItem('pickntrust-admin-session', 'active');
      localStorage.setItem('pickntrust-admin-token', token);
      localStorage.setItem('pickntrust-admin-password', password);
      
      setIsAdmin(true);
      setAdminToken(token);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('pickntrust-admin-session');
    localStorage.removeItem('pickntrust-admin-token');
    localStorage.removeItem('pickntrust-admin-password');
    
    setIsAdmin(false);
    setAdminToken(null);
  };

  return {
    isAdmin,
    isLoading,
    adminToken,
    login,
    logout
  };
}

// Higher-order component to protect admin features
export function withAdminAuth<T extends object>(Component: ComponentType<T>) {
  return function AdminProtectedComponent(props: T) {
    const { isAdmin, isLoading } = useAdminAuth();
    
    if (isLoading) {
      return null; // Don't render anything while checking
    }
    
    if (!isAdmin) {
      return null; // Don't render admin components for non-admin users
    }
    
    return createElement(Component, props);
  };
}

// Hook to get admin-only features
export function useAdminFeatures() {
  const { isAdmin } = useAdminAuth();
  
  return {
    canDelete: isAdmin,
    canEdit: isAdmin,
    canShare: isAdmin,
    canManage: isAdmin,
    showAdminUI: isAdmin
  };
}