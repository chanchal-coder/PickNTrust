import React from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';

// Component that completely blocks admin features for non-admin users
interface AdminProtectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export function AdminProtection({ 
  children, 
  fallback = null, 
  requireAuth = true 
}: AdminProtectionProps) {
  const { isAdmin, isLoading } = useAdminAuth();
  
  // Don't render anything while checking authentication
  if (isLoading) {
    return null;
  }
  
  // Block admin features for non-admin users
  if (requireAuth && !isAdmin) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Higher-order component for admin-only components
export function withAdminProtection<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ReactNode
) {
  return function ProtectedComponent(props: T) {
    return (
      <AdminProtection fallback={fallback}>
        <Component {...props} />
      </AdminProtection>
    );
  };
}

// Hook to conditionally render admin features
export function useAdminOnly() {
  const { isAdmin, isLoading } = useAdminAuth();
  
  const AdminOnly = ({ children, fallback = null }: { 
    children: React.ReactNode; 
    fallback?: React.ReactNode; 
  }) => {
    if (isLoading) return null;
    if (!isAdmin) return <>{fallback}</>;
    return <>{children}</>;
  };
  
  const PublicOnly = ({ children }: { children: React.ReactNode }) => {
    if (isLoading) return null;
    if (isAdmin) return null;
    return <>{children}</>;
  };
  
  return {
    AdminOnly,
    PublicOnly,
    isAdmin,
    isLoading
  };
}

// Component to show different content for admin vs public
export function ConditionalRender({ 
  admin, 
  public: publicContent 
}: { 
  admin: React.ReactNode; 
  public: React.ReactNode; 
}) {
  const { AdminOnly, PublicOnly } = useAdminOnly();
  
  return (
    <>
      <AdminOnly>{admin}</AdminOnly>
      <PublicOnly>{publicContent}</PublicOnly>
    </>
  );
}