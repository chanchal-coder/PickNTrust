// Admin configuration
// Note: In production, these should be fetched from a secure API endpoint
// Client-side code cannot access server environment variables directly

export const ADMIN_CONFIG = {
  // For development - in production, fetch from secure API
  PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD || 'pickntrust2025',
  
  // API endpoint to validate admin credentials
  VALIDATE_ENDPOINT: '/api/admin/auth',
  
  // Security note: Never expose real credentials in client code
  // This is a temporary solution - implement proper authentication
};

// Helper function to get admin password
export const getAdminPassword = (): string => {
  // In production, this should make an API call to get a session token
  // instead of using a hardcoded password
  return ADMIN_CONFIG.PASSWORD;
};

// TODO: Implement proper authentication with JWT tokens
// TODO: Move password validation to server-side only
// TODO: Use secure session management