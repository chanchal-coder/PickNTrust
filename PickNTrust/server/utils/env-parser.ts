/**
 * Utility functions for parsing and validating environment variables
 */

/**
 * Cleans and validates a database URL
 * @param url The raw URL string from environment variable
 * @returns Cleaned URL string
 * @throws Error if URL is invalid
 */
export function cleanDatabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Remove any leading/trailing whitespace
  let cleanedUrl = url.trim();
  
  // Check if the URL includes the variable name (common issue)
  if (cleanedUrl.includes('DATABASE_URL=')) {
    // Extract just the URL part after DATABASE_URL=
    const urlMatch = cleanedUrl.match(/DATABASE_URL=(.+)/);
    if (urlMatch && urlMatch[1]) {
      cleanedUrl = urlMatch[1].trim();
    }
  }
  
  // Validate the URL format
  try {
    new URL(cleanedUrl);
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${cleanedUrl}`);
  }
  
  return cleanedUrl;
}

/**
 * Validates that all required environment variables are properly set
 */
export function validateEnvironmentVariables() {
  const requiredVars = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}
