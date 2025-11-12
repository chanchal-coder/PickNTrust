// Centralized admin configuration helpers

// Align with login storage key used across admin flows
export const ADMIN_PASSWORD_KEY = 'pickntrust-admin-password';

export function getAdminPassword(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Primary key used by admin login flow
      const primary = window.localStorage.getItem(ADMIN_PASSWORD_KEY);
      if (primary && primary.trim().length > 0) return primary.trim();

      // Backward-compatible fallback key
      const legacy = window.localStorage.getItem('adminPassword');
      if (legacy && legacy.trim().length > 0) return legacy.trim();
    }
  } catch {}
  // Fallback to empty string; callers can prompt for password when missing
  return '';
}